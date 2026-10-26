import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, notInArray, or, sql } from "drizzle-orm";
import { heldQuestionIds, gsOutOfScopeIds, questionContentRevision } from '../question-review';
import { scoreReviewedQuestions } from '../reviewed-grading';
import bank from '../combined-question-bank';
import {getQuestionPath,type PyqQuestion} from '../pyq-catalog';
import {matchesPlacementRecipe} from '../prelims-recipe-matching';
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
  const corrected=bank.questions.find(q=>q.id===row.id);
  if(corrected) {
    const path=getQuestionPath(corrected as PyqQuestion);
    row={...row,exam:corrected.exam,year:corrected.year,paper:corrected.paper,sourceQuestionNumber:String(corrected.questionNumber),subject:path?.subject||corrected.subject,topic:path?.topic||corrected.topic,subtopic:path?.subtopic||corrected.subtopic,stem:corrected.sourceText,promptLines:corrected.promptLines,options:corrected.options,correctOption:corrected.answer,explanation:corrected.explanation,source:corrected.source,
      taxonomyId:path?.taxonomyId||row.taxonomyId,taxonomyHead:path?.head||row.taxonomyHead,taxonomyChapter:path?.topic||row.taxonomyChapter,taxonomySubtopic:path?.subtopic||row.taxonomySubtopic,
      taxonomyVersion:('taxonomyVersion'in corrected&&corrected.taxonomyVersion)||row.taxonomyVersion};
  }
  return {
    id: row.id,
    contentRevision: questionContentRevision(row.id),
    exam: row.exam,
    year: row.year,
    paper: row.paper,
    sourceQuestionNumber: row.sourceQuestionNumber,
    subject: row.subject,
    topic: row.topic,
    subtopic: row.subtopic,
    taxonomyVersion: row.taxonomyVersion,
    taxonomyHead: row.taxonomyHead,
    taxonomyChapter: row.taxonomyChapter,
    taxonomySubtopic: row.taxonomySubtopic,
    taxonomyId: row.taxonomyId,
    stem: row.stem,
    promptLines: row.promptLines,
    options: row.options,
    correctOption: row.correctOption,
    ...(corrected && 'acceptedAnswers' in corrected && Array.isArray(corrected.acceptedAnswers) ? {acceptedOptions: corrected.acceptedAnswers as string[]} : {}),
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
  if (heldQuestionIds.length) predicates.push(notInArray(questions.id, heldQuestionIds));
  if (gsOutOfScopeIds.length) predicates.push(notInArray(questions.id, gsOutOfScopeIds));
  if (recipe.difficulty !== "All types" && recipe.difficulty !== "Mixed") {
    predicates.push(sql`coalesce(${questions.editorialDifficulty}, ${questions.suggestedDifficulty}) = ${recipe.difficulty}`);
  }
  return and(...predicates);
}

function matchesReviewedRecipe(row:typeof questions.$inferSelect,recipe:TestRecipe) {
  const canonical=bank.questions.find(q=>q.id===row.id);
  if(canonical)return matchesPlacementRecipe(canonical as PyqQuestion,recipe);
  const q=toSnapshot(row);
  return (recipe.sourceMix||q.exam===recipe.exam)
    && (!recipe.subjects.length||recipe.subjects.includes(q.subject))
    && (!recipe.topics?.length||recipe.topics.includes(q.topic))
    && (!recipe.subtopics?.length||Boolean(q.taxonomyId&&recipe.subtopics.includes(q.taxonomyId)));
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
  const records = await db.select().from(questions).where(eligibleWhere(recipe));
  const rows=records.filter(row=>matchesReviewedRecipe(row,recipe)).map(toSnapshot);
  return {
    total: rows.length,
    byExam: rows.reduce((counts, row) => ({ ...counts, [row.exam]: (counts[row.exam] ?? 0) + 1 }), {} as Record<string, number>),
    bySubject: rows.reduce((counts, row) => ({ ...counts, [row.subject]: (counts[row.subject] ?? 0) + 1 }), {} as Record<string, number>),
    byTopic: rows.reduce((counts, row) => ({ ...counts, [row.topic]: (counts[row.topic] ?? 0) + 1 }), {} as Record<string, number>),
    bySubtopic: rows.reduce((counts, row) => row.taxonomyId ? ({ ...counts, [row.taxonomyId]: (counts[row.taxonomyId] ?? 0) + 1 }) : counts, {} as Record<string, number>),
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
    const rows = (await tx.select().from(questions).where(eligibleWhere(recipe))).filter(row=>matchesReviewedRecipe(row,recipe));
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
  const graded=scoreReviewedQuestions(questionRows.map(row=>row.questionSnapshot as QuestionSnapshot),new Map(answerRows.map(a=>[a.questionId,a.selectedOption])),scoring);
  return {
    ...graded,
    timeUsedSeconds: Math.min(test.durationSeconds, Math.max(0, Math.floor((Date.now() - new Date(test.startedAt).getTime()) / 1000))),
  };
}

export async function submitTest(identity: RequestIdentity, testId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const test = (await tx.select().from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
    if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
    if (test.status !== "active") {
      const existing = (await tx.select().from(results).where(eq(results.testId, testId)))[0];
      if (existing) return getResult(identity,testId);
      throw new ApiError(409, "TEST_LOCKED", "This test has already been submitted.");
    }
    const questionRows = await tx.select().from(testQuestions).where(eq(testQuestions.testId, testId)).orderBy(asc(testQuestions.position));
    const answerRows = await tx.select().from(attemptAnswers).where(eq(attemptAnswers.testId, testId));
    const result = buildResult(test, questionRows, answerRows);
    await tx.update(tests).set({ status: "submitted", submittedAt: new Date() }).where(eq(tests.id, testId));
    const {excludedCount:_excluded,scoredCount:_scored,...stored}=result;
    await tx.insert(results).values({ testId, ...stored,score:String(result.score),maxScore:String(result.maxScore),accuracy:String(result.accuracy) }).onConflictDoNothing();
    return {testId,...result};
  });
}

export async function getResult(identity: RequestIdentity, testId: string) {
  const db = getDb();
  const test = (await db.select().from(tests).where(and(eq(tests.id, testId), ownerPredicate(identity))))[0];
  if (!test) throw new ApiError(404, "TEST_NOT_FOUND", "Test not found.");
  const result = (await db.select().from(results).where(eq(results.testId, testId)))[0];
  if (!result) throw new ApiError(404, "RESULT_NOT_FOUND", "This test has not been submitted yet.");
  const [questionRows,answerRows]=await Promise.all([db.select().from(testQuestions).where(eq(testQuestions.testId,testId)),db.select().from(attemptAnswers).where(eq(attemptAnswers.testId,testId))]);
  return {...result,...buildResult(test,questionRows,answerRows),timeUsedSeconds:result.timeUsedSeconds};
}

export async function listAttempts(identity: RequestIdentity) {
  const db = getDb();
  const rows=await db.select({ test: tests, result: results }).from(tests).leftJoin(results, eq(results.testId, tests.id)).where(ownerPredicate(identity)).orderBy(desc(tests.startedAt)).limit(100);
  const ids=rows.filter(r=>r.result).map(r=>r.test.id);
  if(!ids.length) return rows;
  const [questionRows,answerRows]=await Promise.all([db.select().from(testQuestions).where(inArray(testQuestions.testId,ids)),db.select().from(attemptAnswers).where(inArray(attemptAnswers.testId,ids))]);
  return rows.map(row=>({...row,result:row.result?{...row.result,...buildResult(row.test,questionRows.filter(q=>q.testId===row.test.id),answerRows.filter(a=>a.testId===row.test.id)),timeUsedSeconds:row.result.timeUsedSeconds}:null}));
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
