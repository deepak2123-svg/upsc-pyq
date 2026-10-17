import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const bookRoot = path.resolve(projectRoot, "..");
const ocrPath = path.join(bookRoot, ".tmp/indian_geography_answer_key_row_ocr_v4.json");
const manifestPath = path.join(bookRoot, ".tmp/indian_geography_answer_key_rows_v4/manifest.json");
const outputPath = path.join(projectRoot, "content/taxonomy/indian-geography-v1.3-official-key-extraction.json");
const candidatePath = path.join(projectRoot, "content/taxonomy/indian-geography-v1.3-source-candidates.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const ocr = readJson(ocrPath);
const manifest = readJson(manifestPath);
const candidates = readJson(candidatePath).candidates;

const normalizeAnswer = (value) => String(value).toUpperCase() === "C" ? "C" : String(value).toUpperCase();
const normalizeTerm = (value) => String(value)
  .toUpperCase()
  .replace(/^PAPER\s*/, "")
  .replace(/^I\/II$/, "1 AND 2")
  .replace(/^II$/, "2")
  .replace(/^I$/, "1")
  .replace(/\s+/g, " ")
  .trim();
const paperIdentity = (directory) => {
  const match = /^(CDS|NDA)_(\d{4})-(.+)$/.exec(directory);
  if (!match) return null;
  return { exam: match[1], year: Number(match[2]), term: match[3] };
};

const cells = [];
for (const row of ocr.pages) {
  const identity = paperIdentity(row.paper);
  if (!identity) continue;
  const rowName = path.basename(row.image, path.extname(row.image));
  const rowMatch = /^page-(\d+)-(\d+)$/.exec(rowName);
  if (!rowMatch) continue;
  const sourcePage = Number(rowMatch[1]);
  const sourceRow = Number(rowMatch[2]);
  const normalized = String(row.text ?? "")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const matches = [...normalized.matchAll(/(?:^|\s)(\d{1,3})\s+([ABCDabcd])(?=\s|$)/g)];
  for (const match of matches) {
    const questionNumber = Number(match[1]);
    const maximum = identity.exam === "NDA" ? 150 : 120;
    if (questionNumber < 1 || questionNumber > maximum) continue;
    cells.push({
      ...identity,
      questionNumber,
      answer: normalizeAnswer(match[2]),
      confidence: "high-explicit-number-answer-adjacency",
      evidence: {
        renderedRowImage: row.image,
        originalKeyPage: sourcePage,
        detectedTableRow: sourceRow,
        ocrText: normalized,
      },
    });
  }
}

const grouped = new Map();
for (const cell of cells) {
  const key = [cell.exam, cell.year, cell.term, cell.questionNumber].join("|");
  const list = grouped.get(key) ?? [];
  list.push(cell);
  grouped.set(key, list);
}

const records = [...grouped.entries()].map(([key, evidence]) => {
  const answers = [...new Set(evidence.map((item) => item.answer))];
  const first = evidence[0];
  return {
    key,
    exam: first.exam,
    year: first.year,
    term: first.term,
    questionNumber: first.questionNumber,
    extractedAnswer: answers.length === 1 ? answers[0] : null,
    status: answers.length === 1 ? "extracted-needs-series-alignment" : "conflicting-ocr-extractions",
    evidence,
  };
}).sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

const recordIndex = new Map(records.map((record) => [
  [record.exam, record.year, normalizeTerm(record.term), record.questionNumber].join("|"),
  record,
]));
const candidateComparisons = candidates
  .filter((candidate) => ["CDS", "NDA"].includes(candidate.sourceIdentity.exam))
  .map((candidate) => {
    const identity = candidate.sourceIdentity;
    const key = [identity.exam, identity.year, normalizeTerm(identity.paper), identity.questionNumber].join("|");
    const extracted = recordIndex.get(key) ?? null;
    return {
      sourceIdentity: identity,
      sourceTextHash: candidate.sourceTextHash,
      projectAnswer: candidate.answer,
      extractedAnswer: extracted?.extractedAnswer ?? null,
      comparison: !extracted?.extractedAnswer
        ? "no-high-confidence-cell-extracted"
        : extracted.extractedAnswer === candidate.answer
          ? "agrees-pending-series-alignment"
          : "conflicts-pending-series-alignment",
      extractionKey: extracted?.key ?? null,
    };
  });

const byStatus = Object.fromEntries(
  [...records.reduce((map, record) => map.set(record.status, (map.get(record.status) ?? 0) + 1), new Map())]
    .sort(([a], [b]) => a.localeCompare(b)),
);
const byExam = Object.fromEntries(
  [...records.reduce((map, record) => map.set(record.exam, (map.get(record.exam) ?? 0) + 1), new Map())]
    .sort(([a], [b]) => a.localeCompare(b)),
);
const comparisonSummary = Object.fromEntries(
  [...candidateComparisons.reduce((map, record) => map.set(record.comparison, (map.get(record.comparison) ?? 0) + 1), new Map())]
    .sort(([a], [b]) => a.localeCompare(b)),
);

const output = {
  version: "indian-geography-official-key-extraction-v1",
  status: "evidence-extraction-not-yet-publication-authority",
  generatedAt: new Date().toISOString(),
  source: {
    rowPreparationManifest: manifestPath,
    ocrArtifact: ocrPath,
    preparedPages: manifest.summary.prepared,
    reviewRequiredPages: manifest.summary.reviewRequired,
  },
  methodology: [
    "Official or archived key PDFs are rendered locally and their answer tables are segmented into individual rows.",
    "Only an explicitly adjacent question-number and A/B/C/D token is accepted by this pass.",
    "OCR-only answers remain provisional until the key's booklet series is aligned with the stored question numbering.",
    "Missing cells are not inferred and conflicting OCR extractions are blocked.",
  ],
  summary: { recordCount: records.length, byExam, byStatus, candidateComparison: comparisonSummary },
  records,
  candidateComparisons,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output.summary, null, 2));
