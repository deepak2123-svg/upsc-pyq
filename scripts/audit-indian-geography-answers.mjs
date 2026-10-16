import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "content/taxonomy/indian-geography-v1.3-source-candidates.json");
const outputPath = path.join(projectRoot, "content/taxonomy/indian-geography-v1.3-answer-audit.json");
const bookRoot = path.resolve(projectRoot, "..");

const cleanFiles = [
  path.join(bookRoot, ".tmp/full_reaudit_clean_questions.json"),
  path.join(bookRoot, ".tmp/full_reaudit_clean_cds_matches.json"),
  path.join(bookRoot, ".tmp/full_reaudit_clean_nda_questions.json"),
];

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const candidates = readJson(sourcePath).candidates;
const cleanRecords = cleanFiles.flatMap((file) => {
  if (!fs.existsSync(file)) return [];
  const data = readJson(file);
  return (data.records ?? []).map((record) => ({ ...record, _auditSourceFile: path.basename(file) }));
});

const romanToArabic = (value) => ({ I: "1", II: "2", "GS-I": "GS-I" })[String(value).toUpperCase()] ?? String(value);
const normalizedPaper = (value) => romanToArabic(String(value ?? "").replace(/^paper\s*/i, "").trim());
const cleanQuestionNumber = (record) => Number(record.canonical_question_number ?? record.structured_question_number);
const identityKey = ({ exam, year, paper, questionNumber }) =>
  [exam, year, normalizedPaper(paper), Number(questionNumber)].join("|");

const cleanIndex = new Map();
for (const record of cleanRecords) {
  const key = identityKey({
    exam: record.exam,
    year: record.year,
    paper: record.paper,
    questionNumber: cleanQuestionNumber(record),
  });
  const existing = cleanIndex.get(key) ?? [];
  existing.push(record);
  cleanIndex.set(key, existing);
}

const normalize = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\\\([^)]*\\\)/g, (match) => match.replace(/\\/g, ""))
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim()
  .toLowerCase();

const tokens = (value) => new Set(normalize(value).split(" ").filter(Boolean));
const similarity = (left, right) => {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size && !b.size) return 1;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return Number((overlap / Math.max(a.size, b.size, 1)).toFixed(5));
};

const optionSimilarity = (left = {}, right = {}) => {
  const scores = ["A", "B", "C", "D"].map((key) => similarity(left[key], right[key]));
  return Number((scores.reduce((sum, score) => sum + score, 0) / 4).toFixed(5));
};

const trustedOfficialStatuses = new Set([
  "official-key-verified",
  "official-provisional-key-verified",
  "official-provisional-key-crosschecked",
]);

const records = candidates.map((candidate) => {
  const identity = candidate.sourceIdentity;
  const key = identityKey({
    exam: identity.exam,
    year: identity.year,
    paper: identity.paper,
    questionNumber: identity.questionNumber,
  });
  const possible = cleanIndex.get(key) ?? [];
  const ranked = possible
    .map((record) => ({
      record,
      textSimilarity: similarity(candidate.sourceText, record.question_text),
      optionSimilarity: optionSimilarity(candidate.options, record.options),
    }))
    .sort((a, b) => (b.textSimilarity + b.optionSimilarity) - (a.textSimilarity + a.optionSimilarity));
  const best = ranked[0] ?? null;
  const strongIdentityMatch = Boolean(best && best.textSimilarity >= 0.72);
  const answerAgrees = strongIdentityMatch && candidate.answer === best.record.answer;
  const status = candidate.answerVerification.status;

  let disposition = "manual-source-review-required";
  let publicationGate = "blocked";
  if (status === "official-dropped") {
    disposition = "officially-dropped-quarantine";
  } else if (trustedOfficialStatuses.has(status)) {
    disposition = answerAgrees || !strongIdentityMatch
      ? "official-key-accepted"
      : "official-key-overrides-secondary-source";
    publicationGate = "answer-cleared";
  } else if (strongIdentityMatch && answerAgrees) {
    disposition = "independent-transcription-corroborates-key";
    publicationGate = "needs-authoritative-key-or-explicit-editorial-approval";
  } else if (strongIdentityMatch) {
    disposition = "answer-conflict";
  } else if (best) {
    disposition = "identity-or-reproduction-conflict";
  }

  return {
    sourceIdentity: identity,
    sourceTextHash: candidate.sourceTextHash,
    importAction: candidate.importAction,
    sourceAnswer: candidate.answer,
    priorVerification: candidate.answerVerification,
    cleanMatch: best ? {
      sourceFile: best.record._auditSourceFile,
      sourceUrl: best.record.clean_source_url ?? "",
      questionNumber: cleanQuestionNumber(best.record),
      textSimilarity: best.textSimilarity,
      optionSimilarity: best.optionSimilarity,
      answer: best.record.answer ?? null,
      answerAgrees: answerAgrees,
      strongIdentityMatch,
    } : null,
    disposition,
    publicationGate,
  };
});

const countBy = (field) => Object.fromEntries(
  [...records.reduce((map, record) => map.set(record[field], (map.get(record[field]) ?? 0) + 1), new Map())]
    .sort(([a], [b]) => a.localeCompare(b)),
);

const output = {
  version: "indian-geography-answer-audit-v1",
  status: "draft-audit-do-not-publish",
  generatedAt: new Date().toISOString(),
  candidateCount: records.length,
  methodology: [
    "Identity matching uses exam, year, paper/term and canonical question number.",
    "A structured transcription corroborates an answer only when normalized question-text similarity is at least 0.72.",
    "Third-party or project-only agreement is corroboration, not official verification.",
    "Officially dropped questions remain quarantined even when a third-party transcription supplies an answer.",
    "Any answer, identity or reproduction conflict blocks publication until manual comparison with the original paper and authoritative key.",
  ],
  summary: {
    byDisposition: countBy("disposition"),
    byPublicationGate: countBy("publicationGate"),
  },
  records,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output.summary, null, 2));
