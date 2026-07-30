import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dataRoot = path.resolve(projectRoot, "../data");
const outputRoot = path.resolve(projectRoot, "content");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

function hash(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function subjectFor(record) {
  const haystack = clean([
    record.legacy_taxonomy?.meta_head,
    record.legacy_taxonomy?.chapter,
    record.chapter,
    record.super_topic,
    record.topic,
  ].join(" ")).toLowerCase();
  if (haystack.includes("polity") || haystack.includes("constitution") || haystack.includes("governance")) return "Polity";
  if (haystack.includes("history") || haystack.includes("ancient") || haystack.includes("medieval")) return "History";
  if (haystack.includes("geograph") || haystack.includes("earth") || haystack.includes("agriculture")) return "Geography";
  if (haystack.includes("econom") || haystack.includes("finance")) return "Economy";
  if (haystack.includes("environment") || haystack.includes("ecology")) return "Environment";
  if (haystack.includes("science") || haystack.includes("physics") || haystack.includes("chemistry")) return "Science";
  return "General Studies";
}

function topicFor(record) {
  return clean(record.legacy_taxonomy?.chapter || record.chapter || record.super_topic || record.topic || "General");
}

function sourceTextFor(record) {
  const raw = String(record.question_text ?? (Array.isArray(record.prompt_lines) ? record.prompt_lines.join("\n") : null) ?? record.source_raw ?? record.question ?? "");
  // The supplied CAPF source copy contains this direction immediately before
  // Question 1. Keep the exam wording and statement structure as a locked
  // source field instead of using the shortened question_text field.
  if (record.exam === "CAPF" && Number(record.year) === 2017 && Number(record.question_number) === 1 && /plantation farming/i.test(raw)) {
    return "The following items consist of two statements, Statement I and Statement II Examine these two statements carefully and select the correct answer using the code given below :\nStatement I : Plantation farming has mostly been practiced in humid tropics\nStatement II : The soil of humid tropics is highly fertile";
  }
  return raw;
}

function rawQuestionTextFor(record) {
  return String(record.question_text ?? (Array.isArray(record.prompt_lines) ? record.prompt_lines.join("\n") : null) ?? record.source_raw ?? record.question ?? "");
}

function promptLinesFor(sourceText, record) {
  if (Array.isArray(record.prompt_lines) && record.prompt_lines.length) return record.prompt_lines.map((line) => String(line).trim()).filter(Boolean);
  const displayText = sourceText.replace(/\s+(Statement\s+II\s*:)/i, "\n$1");
  return displayText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function difficultyFor(sourceText, options) {
  const optionText = Object.values(options).join(" ");
  if (/statement\s+i\b|consider the following/i.test(sourceText) || sourceText.length + optionText.length > 650) return "Hard";
  if (sourceText.length + optionText.length < 260) return "Easy";
  return "Moderate";
}

function normalize(record, index, defaults = {}) {
  const exam = defaults.exam || record.exam || record.source?.exam || "NDA";
  const year = Number(record.year || record.source_year || record.source?.year || 0) || null;
  const paper = String(record.paper || record.paper_no || record.paper_id || record.source?.term_roman || "");
  const questionNumber = Number(record.question_number || record.source_question_no || record.printed_question_number || record.question_no || record.local_question_no || record.source?.question_number || index + 1);
  const options = record.options || {};
  const sourceText = sourceTextFor(record);
  const promptLines = promptLinesFor(sourceText, record);
  const id = `${exam.toLowerCase()}-${year || "unknown"}-${paper.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "paper"}-${questionNumber}`;
  return {
    id,
    origin: "pyq",
    sourceTextLocked: true,
    sourceText,
    sourceTextHash: hash(sourceText),
    source: {
      dataset: defaults.dataset,
      year,
      paper,
      questionNumber,
      answerStatus: record.answer_status || record.decision || "source-record",
      answerSource: record.answer_source_url || record.answer_key_evidence?.source || record.answer_evidence?.paper_url || null,
      rawQuestionText: rawQuestionTextFor(record) || null,
    },
    exam,
    year,
    paper,
    questionNumber,
    subject: subjectFor(record),
    topic: topicFor(record),
    subtopic: clean(record.legacy_taxonomy?.subtopic || record.subtopic || "General"),
    difficulty: difficultyFor(sourceText, options),
    promptLines,
    options,
    answer: String(record.answer || "").trim().toUpperCase(),
    explanation: clean(record.explanation || "Explanation pending editorial review."),
    requiresFigure: Boolean(record.requires_figure),
  };
}

const cse = readJson("cse_geography_2013_2026.json").records.map((q, i) => normalize(q, i, { dataset: "CSE Geography 2013–2026", exam: "CSE" }));
const capf = readJson("capf_geography_2017_2026.json").records.map((q, i) => normalize(q, i, { dataset: "CAPF Geography 2017–2026", exam: "CAPF" }));
const cdsPolity = readJson("polity/polity_legacy_160_baseline.json").questions
  .filter((q) => q.decision === "included")
  .map((q, i) => normalize(q, i, { dataset: "CDS Polity verified baseline", exam: "CDS" }));
const cdsGs = readJson("nda_gs_question_bank_database.json").included_questions
  .filter((q) => q.pyq !== false)
  .map((q, i) => normalize(q, i, { dataset: "CDS GS verified question bank", exam: "CDS" }));
const ndaAnswerMap = readJson("nda_answer_key_map.json").answers;
const nda = readJson("nda_gs_book_working_database.json").questions
  .map((q, i) => {
    const answerKey = ndaAnswerMap[q.source?.label];
    if (!answerKey) return null;
    return normalize({
      ...q,
      answer: answerKey.answer,
      answer_status: answerKey.status,
      answer_source_url: answerKey.url,
      source_year: q.source?.year,
      paper_no: q.source?.term_roman,
      source_question_no: q.source?.question_number,
    }, i, { dataset: "NDA GAT verified answer-key bank", exam: "NDA" });
  })
  .filter(Boolean);

const seen = new Set();
const questions = [...cse, ...capf, ...cdsPolity, ...cdsGs, ...nda].filter((question) => {
  if (!question.answer || !question.options[question.answer] || Object.keys(question.options).length !== 4 || seen.has(question.id)) return false;
  seen.add(question.id);
  return true;
});

const sourceCounts = questions.reduce((counts, question) => {
  counts[question.exam] = (counts[question.exam] || 0) + 1;
  return counts;
}, {});

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "question-bank.json"), `${JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString(),
  sourceCounts,
  total: questions.length,
  questions,
}, null, 2)}\n`);
console.log(JSON.stringify({ total: questions.length, sourceCounts, output: "content/question-bank.json" }, null, 2));
