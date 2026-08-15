import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { attemptAnswers, examPapers, profiles, questions, results, savedTests, testQuestions, tests } from "../../db/schema";
import type { RequestIdentity } from "../auth/session";
import type { QuestionSnapshot, ScoringConfig, TestRecipe } from "../domain/test";
import { publicSnapshot } from "../domain/test";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) {
    super(message);
  }
}

function ownerPredicate(identity: RequestIdentity) {
  const guest = identity.guestSessionId ? eq(tests.guestSessionId, identity.guestSessionId) : undefined;
  if (identity.userId && guest) return or(eq(tests.userId, identity.userId), guest);
  if (identity.userId) return eq(tests.userId, identity.userId);
  if (guest) return guest;
  throw new ApiError(401, "IDENTITY_REQUIRED", "A guest session or account is required.");
}

function seedFor(recipe: TestRecipe, testId: string) {
  return createHash("sha256").update(`${testId}:${JSON.stringify(recipe)}`).digest("hex");
}

function stableRank(seed: string, questionId: string) {
  return createHash("sha256").update(`${seed}:${questionId}`).digest("hex");
}

function toSnapshot(row: typeof questions.$inferSelect): QuestionSnapshot {
  return {
    id: row.id,
    exam: row.exam,
    year: row.year,
    paper: row.paper,
    sourceQuestionNumber: row.sourceQuestionNumber,
    subject: row.subject,
    topic: row.topic,
    subtopic: row.subtopic,
    stem: row.stem,
    promptLines: row.promptLines,
    options: row.options,
    correctOption: row.correctOption,
    explanation: row.explanation,
    eliminationNotes: row.eliminationNotes,
    origin: row.origin,
    source: row.source,
    difficulty: row.editorialDifficulty ?? row.suggestedDifficulty ?? "Moderate",
    requiresFigure: row.requiresFigure,
    figureKey: row.figureKey,
  };
}

async function resolveScoring(db: ReturnType<typeof getDb>, recipe: TestRecipe): Promise<ScoringConfig> {
  const requestedPaper = recipe.paper ?? ({ CSE: "GS-I", CAPF: "I", CDS: "General Knowledge", NDA: "General Ability" } as const)[recipe.exam];
  const rows = await db.select().from(examPapers).where(and(eq(examPapers.exam, recipe.exam), eq(examPapers.paper, requestedPaper), eq(examPapers.active, true))).orderBy(desc(examPapers.year));
  const row = rows[0];
  if (!row) throw new ApiError(503, "SCORING_UNCONFIGURED", `No active scoring rule is configured for ${recipe.exam} ${requestedPaper}.`, { exam: recipe.exam, paper: requestedPaper });
  return {
    exam: row.exam,
    paper: row.paper,
    year: row.year,
    questionCount: row.questionCount,
    durationSeconds: row.durationSeconds,
    marksPerQuestion: Number(row.marksPerQuestion),
    negativeMarksPerQuestion: Number(row.negativeMarksPerQuestion),
    source: row.source,
    version: row.version,
  };
}

function eligibleWhere(recipe: TestRecipe) {
  const predicates = [
    eq(questions.workflowStatus, "published"),
    eq(questions.verificationStatus, "verified"),
    isNotNull(questions.explanation),
  ];
  if (!recipe.sourceMix) predicates.push(eq(questions.exam, recipe.exam));
  if (recipe.subjects.length) predicates.push(inArray(questions.subject, recipe.subjects));
  if (recipe.topics?.length) predicates.push(inArray(questions.topic, recipe.topics));
  if (recipe.difficulty !== "All types" && recipe.difficulty !== "Mixed") {
    predicates.push(sql`coalesce(${questions.editorialDifficulty}, ${questions.suggestedDifficulty}) = ${recipe.difficulty}`);
  }
  return and(...predicates);
}

function selectQuestions(rows: (typeof questions.$inferSelect)[], recipe: TestRecipe, seed: string) {
  const ranked = [...rows].sort((a, b) => stableRank(seed, a.id).localeCompare(stableRank(seed, b.id)));
  if (recipe.difficulty !== "Mixed") return ranked.slice(0, recipe.count);

  const buckets = new Map<string, typeof ranked>();
  for (const level of ["Easy", "Moderate", "Hard"]) buckets.set(level, []);
  for (const row of ranked) {
    const level = row.editorialDifficulty ?? row.suggestedDifficulty ?? "Moderate";
    buckets.get(level)?.push(row);
  }
  const selected: typeof ranked = [];
  let index = 0;
  while (selected.length < recipe.count && index < ranked.length) {
    for (const level of ["Easy", "Moderate", "Hard"]) {
      const row = buckets.get(level)?.shift();
      if (row) selected.push(row);
      if (selected.length === recipe.count) break;
    }
    index += 1;
  }
  return selected;
}

export async function getInventory(recipe: TestRecipe) {
  const db = getDb();
  const rows = await db.select({
    id: questions.id,
    exam: questions.exam,
    subject: questions.subject,
    topic: questions.topic,
    difficulty: sql<string>`coalesce(${questions.editorialDifficulty}, ${questions.suggestedDifficulty}, 'Moderate')`,
  }).from(questions).where(eligibleWhere(recipe));
  return {
    total: rows.length,
    byExam: rows.reduce((counts, row) => ({ ...counts, [row.exam]: (counts[row.exam] ?? 0) + 1 }), {} as Record<string, number>),
    bySubject: rows.reduce((counts, row) => ({ ...counts, [row.subject]: (counts[row.subject] ?? 0) + 1 }), {} as Record<string, number>),
    byTopic: rows.reduce((counts, row) => ({ ...counts, [row.topic]: (counts[row.topic] ?? 0) + 1 }), {} as Record<string, number>),
    byDifficulty: rows.reduce((counts, row) => ({ ...counts, [row.difficulty]: (counts[row.difficulty] ?? 0) + 1 }), {} as Record<string, number>),
  };
}

export async function createTest(identity: RequestIdentity, recipe: TestRecipe) {
  const db = getDb();
  const testId = randomUUID();
  const scoring = await resolveScoring(db, recipe);
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + recipe.durationMinutes * 60_000);

  return db.transaction(async (tx) => {
    const rows = await tx.select().from(questions).where(eligibleWhere(recipe));
    const selected = selectQuestions(rows, recipe, seedFor(recipe, testId));
    if (selected.length < recipe.count) {
      throw new ApiError(409, "INSUFFICIENT_INVENTORY", `Only ${selected.length} published questions match this recipe.`, { requested: recipe.count, available: selected.length, recipe });
    }

    await tx.insert(tests).values({
      id: testId,
      userId: identity.userId,
      guestSessionId: identity.guestSessionId || null,
      exam: recipe.exam,
      paper: scoring.paper,
      mode: recipe.mode.toLowerCase() as "exam" | "practice",
      recipe,
      scoring,
      durationSeconds: recipe.durationMinutes * 60,
      startedAt,
      deadlineAt,
    });

    await tx.insert(testQuestions).values(selected.map((row, position) => ({
      testId,
      questionId: row.id,
      position,
      questionSnapshot: toSnapshot(row),
    })));

    return { id: testId, recipe, scoring, startedAt, deadlineAt, questions: selected.map(toSnapshot).map((snapshot) => publicSnapshot(snapshot, recipe.mode === "Practice")) };
  });
}

export async function getTest(identity: RequestIdentity, testId: string) {
  const db = getDb();
  const test = (await db.select().from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
  if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
  const [questionRows, answerRows] = await Promise.all([
    db.select().from(testQuestions).where(eq(testQuestions.testId, testId)).orderBy(asc(testQuestions.position)),
    db.select().from(attemptAnswers).where(eq(attemptAnswers.testId, testId)),
  ]);
  const reveal = test.mode === "practice" || test.status !== "active";
  return {
    ...test,
    questions: questionRows.map((row) => publicSnapshot(row.questionSnapshot as QuestionSnapshot, reveal)),
    answers: answerRows,
  };
}

export async function saveAnswer(identity: RequestIdentity, testId: string, questionId: string, selectedOption: string | null, markedForReview: boolean, secondsSpent: number) {
  const db = getDb();
  const test = (await db.select().from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
  if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
  if (test.status !== "active") throw new ApiError(409, "TEST_LOCKED", "Submitted tests cannot be edited.");
  const question = (await db.select({ id: testQuestions.questionId }).from(testQuestions).where(and(eq(testQuestions.testId, testId), eq(testQuestions.questionId, questionId))))[0];
  if (!question) throw new ApiError(404, "QUESTION_NOT_IN_TEST", "This question is not part of the test.");
  if (test.deadlineAt && new Date(test.deadlineAt).getTime() <= Date.now()) {
    await submitTest(identity, testId);
    throw new ApiError(409, "TEST_EXPIRED", "This test expired and was submitted automatically.");
  }
  if (selectedOption !== null && !["A", "B", "C", "D"].includes(selectedOption)) throw new ApiError(400, "INVALID_OPTION", "Selected option must be A, B, C, or D.");

  await db.insert(attemptAnswers).values({ testId, questionId, selectedOption, markedForReview, secondsSpent: Math.max(0, Math.round(secondsSpent)) }).onConflictDoUpdate({
    target: [attemptAnswers.testId, attemptAnswers.questionId],
    set: { selectedOption, markedForReview, secondsSpent: Math.max(0, Math.round(secondsSpent)), updatedAt: new Date() },
  });
  return { ok: true };
}

function buildResult(test: typeof tests.$inferSelect, questionRows: (typeof testQuestions.$inferSelect)[], answerRows: (typeof attemptAnswers.$inferSelect)[]) {
  const scoring = test.scoring as ScoringConfig;
  const answers = new Map(answerRows.map((answer) => [answer.questionId, answer]));
  let correctCount = 0;
  let incorrectCount = 0;
  const breakdown: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; score: number }> = {};

  for (const row of questionRows) {
    const question = row.questionSnapshot as QuestionSnapshot;
    const answer = answers.get(question.id)?.selectedOption ?? null;
    const bucket = breakdown[question.subject] ?? { total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0 };
    bucket.total += 1;
    if (!answer) bucket.unattempted += 1;
    else if (answer === question.correctOption) { correctCount += 1; bucket.correct += 1; bucket.score += scoring.marksPerQuestion; }
    else { incorrectCount += 1; bucket.incorrect += 1; bucket.score -= scoring.negativeMarksPerQuestion; }
    breakdown[question.subject] = bucket;
  }

  const unattemptedCount = questionRows.length - correctCount - incorrectCount;
  const score = correctCount * scoring.marksPerQuestion - incorrectCount * scoring.negativeMarksPerQuestion;
  const maxScore = questionRows.length * scoring.marksPerQuestion;
  const accuracy = correctCount + incorrectCount ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;
  const weakAreas = Object.entries(breakdown)
    .map(([subject, value]) => ({ subject, accuracy: value.correct + value.incorrect ? value.correct / (value.correct + value.incorrect) : 0 }))
    .filter((value) => value.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((value) => value.subject);

  return {
    score: Number(score.toFixed(4)),
    maxScore: Number(maxScore.toFixed(4)),
    accuracy: Number(accuracy.toFixed(4)),
    correctCount,
    incorrectCount,
    unattemptedCount,
    timeUsedSeconds: Math.min(test.durationSeconds, Math.max(0, Math.floor((Date.now() - new Date(test.startedAt).getTime()) / 1000))),
    breakdown,
    weakAreas,
  };
}

export async function submitTest(identity: RequestIdentity, testId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const test = (await tx.select().from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
    if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
    if (test.status !== "active") {
      const existing = (await tx.select().from(results).where(eq(results.testId, testId)))[0];
      if (existing) return existing;
      throw new ApiError(409, "TEST_LOCKED", "This test has already been submitted.");
    }
    const questionRows = await tx.select().from(testQuestions).where(eq(testQuestions.testId, testId)).orderBy(asc(testQuestions.position));
    const answerRows = await tx.select().from(attemptAnswers).where(eq(attemptAnswers.testId, testId));
    const result = buildResult(test, questionRows, answerRows);
    await tx.update(tests).set({ status: "submitted", submittedAt: new Date() }).where(eq(tests.id, testId));
    await tx.insert(results).values({ testId, ...result }).onConflictDoNothing();
    return (await tx.select().from(results).where(eq(results.testId, testId)))[0];
  });
}

export async function getResult(identity: RequestIdentity, testId: string) {
  const db = getDb();
  const test = (await db.select({ id: tests.id }).from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
  if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
  const result = (await db.select().from(results).where(eq(results.testId, testId)))[0];
  if (!result) throw new ApiError(404, "RESULT_NOT_FOUND", "This test has not been submitted yet.");
  return result;
}

export async function listAttempts(identity: RequestIdentity) {
  const db = getDb();
  return db.select({ test: tests, result: results }).from(tests).leftJoin(results, eq(results.testId, tests.id)).where(ownerPredicate(identity)).orderBy(desc(tests.startedAt)).limit(100);
}

export async function listSavedTests(userId: string) {
  const db = getDb();
  return db.select().from(savedTests).where(eq(savedTests.userId, userId)).orderBy(desc(savedTests.updatedAt));
}

export async function saveTestRecipe(userId: string, name: string, recipe: Record<string, unknown>) {
  const db = getDb();
  const value = { userId, name: name.trim().slice(0, 120) || "Saved test", recipe };
  return (await db.insert(savedTests).values(value).returning())[0];
}

export async function getStaffRole(userId: string | null) {
  if (!userId) return null;
  const db = getDb();
  return (await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)))[0]?.role ?? null;
}
