import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bankPath = path.join(root, "content", "question-bank.json");
const reportPath = path.join(root, "content", "taxonomy", "geography-figure-audit-v1.json");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

const confirmed = {
  "capf-2017-i-120": {
    figureKey: "/question-figures/capf-2017-i-q120-map.png",
    figureAlt: "Original CAPF 2017 map of India with four numbered national-park locations",
    figureSource: "Original CAPF 2017 Paper I, printed page 41, Question 120",
  },
  "capf-2019-i-113": {
    figureKey: "/question-figures/capf-2019-i-q113-map.png",
    figureAlt: "Original CAPF 2019 map of India with four numbered river locations",
    figureSource: "Original CAPF 2019 Paper I, printed page 39, Question 113",
  },
  "capf-2019-i-120": {
    figureKey: "/question-figures/capf-2019-i-q120-map.png",
    figureAlt: "Original CAPF 2019 map of Sikkim with four numbered border locations",
    figureSource: "Original CAPF 2019 Paper I, printed page 43, Question 120",
  },
  "cds-2014-2-33": {
    figureKey: "/question-figures/cds-2014-2-q33-diagram.png",
    figureAlt: "Original CDS 2014 pressure diagram showing locations A, B and C",
    figureSource: "Original CDS 2014 Paper 2, printed page 10, Question 33",
  },
};

const explicitFigureCue = /\b(location in map|diagram given|following (?:map|diagram|figure)|map shown|figure shown|shown in (?:the )?(?:map|diagram|figure)|marked on (?:the )?map|indicated in (?:the )?(?:map|diagram|figure))\b/i;
const benignMapContext = /\b(on the map|locate (?:it|the place) on the map|topographical map|map scale)\b/i;
const extraction = "Lossless crop from the locally archived original-paper page; no redrawing, OCR reconstruction, or generative repair";
const geography = bank.questions.filter((question) => question.subject === "Geography");

for (const question of geography) {
  const match = confirmed[question.id];
  if (!match) continue;
  question.requiresFigure = true;
  question.figureKey = match.figureKey;
  question.figureAlt = match.figureAlt;
  question.source = { ...question.source, figureSource: match.figureSource, figureExtraction: extraction };
}

const entries = geography.map((question) => {
  const text = [question.sourceText, ...(question.promptLines || []), ...Object.values(question.options || {})].join(" ");
  const match = confirmed[question.id];
  const assetPath = match ? path.join(root, "public", match.figureKey.replace(/^\//, "")) : null;
  let status = "text-only-screened";
  let reason = "No explicit dependency on a map, diagram, graph, photograph, or other printed figure was detected in the preserved question text.";
  if (match) {
    status = fs.existsSync(assetPath) && fs.statSync(assetPath).size > 1000 ? "asset-verified" : "figure-required-missing-asset";
    reason = "Original-paper review confirmed that the figure is necessary to answer the question.";
  } else if (explicitFigureCue.test(text)) {
    status = "manual-review-required";
    reason = "The preserved text explicitly refers to a figure but no reviewed asset is registered.";
  } else if (benignMapContext.test(text)) {
    status = "text-only-verified";
    reason = "The word map describes the tested concept; the question does not refer to a supplied printed figure.";
  }
  return {
    questionId: question.id,
    exam: question.exam,
    year: question.year,
    paper: question.paper,
    questionNumber: question.questionNumber,
    status,
    figureKey: match?.figureKey || null,
    originalPaperReference: match?.figureSource || null,
    reason,
  };
});

const unresolved = entries.filter((entry) => entry.status === "manual-review-required" || entry.status === "figure-required-missing-asset");
const report = {
  version: 1,
  scope: "Every question whose subject is Geography in content/question-bank.json",
  rule: "A question that depends on a printed map, diagram, graph, photograph, table image, or other non-text figure must use a lossless crop from the archived original paper. It must declare requiresFigure, figureKey, figureAlt, and original-paper provenance. It may not be published or imported without a substantive local asset.",
  generatedAt: new Date().toISOString(),
  totals: {
    audited: entries.length,
    figureDependent: entries.filter((entry) => entry.status === "asset-verified").length,
    textOnly: entries.filter((entry) => entry.status.startsWith("text-only")).length,
    unresolved: unresolved.length,
  },
  entries,
};

fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (unresolved.length) {
  console.error(`Geography figure audit has ${unresolved.length} unresolved question(s): ${unresolved.map((entry) => entry.questionId).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Audited ${entries.length} Geography questions; ${report.totals.figureDependent} figure-dependent assets verified; 0 unresolved.`);
}
