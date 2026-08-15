import { handleApiError, json, readJson, requireDatabase } from "../../../../lib/server/http";
import { requireStaff } from "../../../../lib/server/admin";
import { createHash } from "node:crypto";
import { getDb } from "../../../../db";
import { questions } from "../../../../db/schema";

type ImportQuestion = Record<string, unknown> & { id?: string; exam?: string; subject?: string; topic?: string; sourceText?: string; promptLines?: string[]; options?: Record<string, string>; answer?: string; origin?: "pyq" | "generated"; source?: Record<string, unknown>; sourceTextHash?: string; difficulty?: string; explanation?: string; requiresFigure?: boolean };

function normalize(record: ImportQuestion) {
  const errors: string[] = [];
  const options = record.options ?? {};
  if (!record.id || !record.exam || !record.subject || !record.topic || !record.sourceText) errors.push("missing required identity, taxonomy, or source text");
  if (Object.keys(options).sort().join(",") !== "A,B,C,D") errors.push("options must contain exactly A-D");
  if (!record.answer || !options[record.answer]) errors.push("answer must be one of A-D");
  if (record.origin !== "pyq" && record.origin !== "generated") errors.push("origin must be pyq or generated");
  const fingerprint = createHash("sha256").update(JSON.stringify([record.exam, record.year ?? null, record.paper ?? null, record.questionNumber ?? null, record.sourceText, options])).digest("hex");
  return { errors, value: { id: record.id, exam: record.exam, year: typeof record.year === "number" ? record.year : null, paper: typeof record.paper === "string" ? record.paper : null, sourceQuestionNumber: record.questionNumber == null ? null : String(record.questionNumber), subject: record.subject, topic: record.topic, subtopic: typeof record.subtopic === "string" ? record.subtopic : null, stem: record.sourceText, promptLines: record.promptLines?.length ? record.promptLines : [record.sourceText], options, correctOption: record.answer, explanation: record.explanation && !/^Explanation pending/i.test(record.explanation) ? record.explanation : null, eliminationNotes: null, origin: record.origin, source: record.source ?? {}, sourceFingerprint: fingerprint, sourceTextHash: record.sourceTextHash ?? createHash("sha256").update(record.sourceText).digest("hex"), sourceTextLocked: record.origin === "pyq", verificationStatus: "unverified", evidence: [], suggestedDifficulty: record.difficulty ?? null, editorialDifficulty: null, workflowStatus: errors.length ? "draft" : "review", requiresFigure: Boolean(record.requiresFigure), figureKey: null } };
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const { identity } = await requireStaff();
    const payload = await readJson<{ questions?: ImportQuestion[]; apply?: boolean }>(request);
    const records = (payload.questions ?? []).map(normalize);
    const invalid = records.filter((record) => record.errors.length);
    if (invalid.length) return json({ imported: 0, invalid: invalid.map((record) => record.errors) }, { status: 422 });
    if (!payload.apply) return json({ dryRun: true, valid: records.length, invalid: 0 });
    const db = getDb();
    let inserted = 0;
    for (const record of records) {
      const result = await db.insert(questions).values(record.value).onConflictDoNothing().returning({ id: questions.id });
      if (result.length) inserted += 1;
    }
    return json({ imported: inserted, skipped: records.length - inserted, actorId: identity.userId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
