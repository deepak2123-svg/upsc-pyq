import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const root = process.cwd();
const sourcePath = path.join(root, "content", "question-bank.json");
const apply = process.argv.includes("--apply");

function fingerprint(question) {
  const canonical = [
    question.exam,
    question.year ?? "",
    question.paper ?? "",
    question.questionNumber ?? "",
    question.sourceText ?? "",
    JSON.stringify(question.options ?? {}),
  ].join("\u001f");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function normalize(question) {
  const errors = [];
  const options = question.options && typeof question.options === "object" ? question.options : {};
  const optionKeys = Object.keys(options).sort();
  if (!question.id || !question.exam || !question.subject || !question.topic) errors.push("missing identity or taxonomy");
  if (!question.sourceText || !Array.isArray(question.promptLines) || question.promptLines.length === 0) errors.push("missing exact source text");
  if (optionKeys.join(",") !== "A,B,C,D") errors.push("must contain exactly A-D options");
  if (!options[question.answer]) errors.push("answer is not one of A-D");
  if (!question.origin || !["pyq", "generated"].includes(question.origin)) errors.push("invalid origin");
  if (question.origin === "pyq" && question.sourceTextLocked !== true) errors.push("PYQ sourceTextLocked must be true");

  const explanation = typeof question.explanation === "string" && !/^Explanation pending/i.test(question.explanation.trim())
    ? question.explanation.trim()
    : null;

  return {
    record: {
      id: question.id,
      exam: question.exam,
      year: question.year ?? null,
      paper: question.paper ?? null,
      sourceQuestionNumber: String(question.questionNumber ?? ""),
      subject: question.subject,
      topic: question.topic,
      subtopic: question.subtopic ?? null,
      stem: question.sourceText,
      promptLines: question.promptLines,
      options,
      correctOption: question.answer,
      explanation,
      eliminationNotes: null,
      origin: question.origin,
      source: question.source ?? {},
      sourceFingerprint: fingerprint(question),
      sourceTextHash: question.sourceTextHash ?? crypto.createHash("sha256").update(question.sourceText ?? "").digest("hex"),
      sourceTextLocked: question.origin === "pyq" ? true : Boolean(question.sourceTextLocked),
      verificationStatus: "unverified",
      evidence: question.source?.answerSource ? [{ kind: "answer-key", url: question.source.answerSource }] : [],
      suggestedDifficulty: question.difficulty ?? null,
      editorialDifficulty: null,
      workflowStatus: errors.length ? "draft" : "review",
      requiresFigure: Boolean(question.requiresFigure),
      figureKey: null,
    },
    errors,
  };
}

const payload = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const questions = Array.isArray(payload.questions) ? payload.questions : [];
const normalized = questions.map(normalize);
const seen = new Set();
for (const item of normalized) {
  if (seen.has(item.record.sourceFingerprint)) item.errors.push("duplicate source fingerprint in import");
  seen.add(item.record.sourceFingerprint);
}

const invalid = normalized.filter((item) => item.errors.length > 0);
const summary = {
  total: normalized.length,
  valid: normalized.length - invalid.length,
  invalid: invalid.length,
  origins: normalized.reduce((counts, item) => {
    counts[item.record.origin] = (counts[item.record.origin] ?? 0) + 1;
    return counts;
  }, {}),
  workflow: normalized.reduce((counts, item) => {
    counts[item.record.workflowStatus] = (counts[item.record.workflowStatus] ?? 0) + 1;
    return counts;
  }, {}),
};

console.log(JSON.stringify({ summary, errors: invalid.slice(0, 50).map((item) => ({ id: item.record.id, errors: item.errors })) }, null, 2));

if (!apply) {
  console.log("Dry run only. Use `node scripts/import-questions-to-supabase.mjs --apply` to insert new records.");
  process.exit(invalid.length ? 1 : 0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply");
if (invalid.length) throw new Error(`Refusing to import ${invalid.length} invalid records`);

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  let inserted = 0;
  await sql.begin(async (transaction) => {
    for (const { record } of normalized) {
      const rows = await transaction`
        insert into public.questions (
          id, exam, year, paper, source_question_number, subject, topic, subtopic,
          stem, prompt_lines, options, correct_option, explanation, elimination_notes,
          origin, source, source_fingerprint, source_text_hash, source_text_locked,
          verification_status, evidence, suggested_difficulty, editorial_difficulty,
          workflow_status, requires_figure, figure_key
        ) values (
          ${record.id}, ${record.exam}, ${record.year}, ${record.paper}, ${record.sourceQuestionNumber},
          ${record.subject}, ${record.topic}, ${record.subtopic}, ${record.stem}, ${sql.json(record.promptLines)},
          ${sql.json(record.options)}, ${record.correctOption}, ${record.explanation}, ${record.eliminationNotes},
          ${record.origin}, ${sql.json(record.source)}, ${record.sourceFingerprint}, ${record.sourceTextHash},
          ${record.sourceTextLocked}, ${record.verificationStatus}, ${sql.json(record.evidence)},
          ${record.suggestedDifficulty}, ${record.editorialDifficulty}, ${record.workflowStatus},
          ${record.requiresFigure}, ${record.figureKey}
        ) on conflict (id) do nothing returning id
      `;
      inserted += rows.length;
    }
  });
  console.log(JSON.stringify({ inserted, skipped: normalized.length - inserted }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}
