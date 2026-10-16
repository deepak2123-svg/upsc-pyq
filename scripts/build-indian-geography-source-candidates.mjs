import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const bookRoot = resolve(projectRoot, "..");
const [bank, book] = await Promise.all([
  readFile(resolve(projectRoot, "content/question-bank.json"), "utf8").then(JSON.parse),
  readFile(resolve(bookRoot, "outputs/Geography_MCQ_Bank_database.json"), "utf8").then(JSON.parse),
]);

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sourceText = (question) => question.sourceText || (question.promptLines || []).join(" ");
const existingByText = new Map();
for (const question of bank.questions) {
  const key = `${question.exam}|${question.year}|${normalize(sourceText(question))}`;
  const ids = existingByText.get(key) || [];
  ids.push(question.id);
  existingByText.set(key, ids);
}

const candidates = book.questions.filter((question) => question.super_topic === "Indian Geography").map((question) => {
  const source = question.source;
  const text = question.question_text.trim();
  const key = `${source.exam}|${source.year}|${normalize(text)}`;
  const existingQuestionIds = existingByText.get(key) || [];
  return {
    sourceIdentity: {
      exam: source.exam,
      year: source.year,
      term: source.term_number || null,
      paper: source.term_roman || source.term_number || null,
      questionNumber: source.question_number,
      label: source.label,
    },
    importAction: existingQuestionIds.length === 1 ? "reuse-existing" : existingQuestionIds.length > 1 ? "resolve-ambiguous-existing" : "add-new",
    existingQuestionIds,
    sourceText: text,
    sourceTextHash: createHash("sha256").update(text).digest("hex"),
    options: question.options,
    answer: question.answer,
    answerVerification: question.answer_verification || { status: question.answer_status || "unknown" },
    originalPdfProvenance: question.original_pdf_provenance || {},
    sourceRefs: question.source_refs || [source],
    previousPath: question.taxonomy_path || {
      meta_head: question.super_topic,
      chapter: question.chapter,
      subtopic: question.subtopic,
    },
    previousClassificationBasis: question.classification_basis || "",
    previousManualReviewStatus: question.manual_review_status || "",
    targetTaxonomyStatus: "needs-question-level-review",
    reproductionStatus: Object.keys(question.original_pdf_provenance || {}).length ? "source-provenance-present-needs-comparison" : "original-pdf-comparison-required",
  };
});

const byExam = Object.fromEntries(["CSE", "CAPF", "CDS", "NDA"].map((exam) => [exam, candidates.filter((candidate) => candidate.sourceIdentity.exam === exam).length]));
const byAction = Object.fromEntries(["reuse-existing", "resolve-ambiguous-existing", "add-new"].map((action) => [action, candidates.filter((candidate) => candidate.importAction === action).length]));
const byAnswerVerification = Object.fromEntries([...new Set(candidates.map((candidate) => candidate.answerVerification.status))].sort().map((status) => [status, candidates.filter((candidate) => candidate.answerVerification.status === status).length]));

const output = {
  version: "indian-geography-source-candidates-v1",
  status: "audit-required-do-not-import",
  generatedAt: new Date().toISOString(),
  sourceDatabase: "../outputs/Geography_MCQ_Bank_database.json",
  candidateCount: candidates.length,
  byExam,
  byAction,
  byAnswerVerification,
  invariants: [
    "No candidate may be published until its source text and four options are compared with the cited paper.",
    "No answer may be marked verified without an answer-key evidence record.",
    "Every candidate must receive exactly one reviewed Indian Geography v1.3 subtopic.",
    "Exact-text reuse preserves the existing website question ID; new records receive ancestry-independent source IDs.",
  ],
  candidates,
};

await writeFile(resolve(projectRoot, "content/taxonomy/indian-geography-v1.3-source-candidates.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ candidateCount: candidates.length, byExam, byAction, byAnswerVerification }, null, 2));
