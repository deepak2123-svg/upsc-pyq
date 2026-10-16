import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "content/taxonomy", name), "utf8"));

const candidates = read("indian-geography-v1.3-source-candidates.json");
const classification = read("indian-geography-v1.3-classification-draft.json");
const answerAudit = read("indian-geography-v1.3-answer-audit.json");
const originalPdfAudit = read("indian-geography-v1.3-original-pdf-audit.json");

const byLabel = (records, selector = (record) => record.sourceIdentity.label) =>
  new Map(records.map((record) => [selector(record), record]));

const candidateByLabel = byLabel(candidates.candidates);
const answerByLabel = byLabel(answerAudit.records);
const originalPdfByLabel = byLabel(originalPdfAudit.records);

const records = classification.records
  .filter((record) => record.scopeDecision === "include")
  .map((classified) => {
    const label = classified.sourceIdentity.label;
    const candidate = candidateByLabel.get(label);
    const answer = answerByLabel.get(label);
    const originalPdfMatch = originalPdfByLabel.get(label);
    if (!candidate || !answer || !originalPdfMatch) throw new Error(`Missing joined audit data for ${label}`);

    const hasOriginalPaper = Boolean(Object.keys(candidate.originalPdfProvenance ?? {}).length);
    const original = candidate.originalPdfProvenance ?? {};
    const highConfidenceOriginalMatch = hasOriginalPaper && (
      (original.ocr_confidence_band === "high" && Number(original.ocr_token_coverage ?? 0) >= 0.95)
      || (Number(original.ocr_confidence ?? 0) >= 0.9 && Boolean(original.source_page))
    );
    const structuredMatch = answer.cleanMatch;
    let reproductionGate = "original-paper-review-required";
    if (hasOriginalPaper && candidate.reproductionStatus === "source-provenance-present-needs-comparison") {
      reproductionGate = "provenance-present-comparison-required";
    }
    if (structuredMatch?.strongIdentityMatch && structuredMatch.textSimilarity >= 0.97 && structuredMatch.optionSimilarity >= 0.97) {
      reproductionGate = hasOriginalPaper
        ? "structured-source-and-original-provenance-corroborate"
        : "structured-source-corroborates-needs-original-paper";
    }
    if (answer.disposition === "identity-or-reproduction-conflict") {
      reproductionGate = "blocked-reproduction-conflict";
    }
    if (highConfidenceOriginalMatch) {
      reproductionGate = "original-paper-high-confidence-match";
    }
    if (originalPdfMatch.status === "high-confidence-original-page-match") {
      reproductionGate = "original-paper-high-confidence-match";
    } else if (originalPdfMatch.status === "manual-original-page-review" && reproductionGate === "original-paper-review-required") {
      reproductionGate = "manual-original-page-review";
    }

    const answerGate = answer.publicationGate;
    const reproductionCleared = new Set([
      "structured-source-and-original-provenance-corroborate",
      "original-paper-high-confidence-match",
    ]).has(reproductionGate);
    const importGate = answerGate === "answer-cleared" && reproductionCleared
      ? "ready-for-final-editorial-review"
      : "blocked";

    return {
      sourceIdentity: candidate.sourceIdentity,
      importAction: candidate.importAction,
      existingQuestionIds: candidate.existingQuestionIds,
      question: {
        text: candidate.sourceText,
        textHash: candidate.sourceTextHash,
        options: candidate.options,
        answer: candidate.answer,
      },
      targetPath: classified.proposedPath,
      classification: {
        confidence: classified.confidence,
        rationale: classified.rationale,
      },
      provenance: {
        sourceRefs: candidate.sourceRefs,
        originalPdf: candidate.originalPdfProvenance,
        originalPageAudit: originalPdfMatch,
      },
      gates: {
        answer: answerGate,
        reproduction: reproductionGate,
        import: importGate,
      },
      answerAudit: {
        disposition: answer.disposition,
        priorVerification: answer.priorVerification,
        cleanMatch: answer.cleanMatch,
      },
    };
  });

const countBy = (selector) => Object.fromEntries(
  [...records.reduce((map, record) => {
    const key = selector(record);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map())].sort(([a], [b]) => String(a).localeCompare(String(b))),
);

const output = {
  version: "indian-geography-import-draft-v1",
  status: "blocked-until-audits-clear-do-not-publish",
  generatedAt: new Date().toISOString(),
  recordCount: records.length,
  sourceCandidateCount: candidates.candidateCount,
  excludedOrMovedCount: candidates.candidateCount - records.length,
  summary: {
    byExam: countBy((record) => record.sourceIdentity.exam),
    byImportAction: countBy((record) => record.importAction),
    byAnswerGate: countBy((record) => record.gates.answer),
    byReproductionGate: countBy((record) => record.gates.reproduction),
    byImportGate: countBy((record) => record.gates.import),
  },
  invariants: [
    "Only records with an explicit include scope decision appear in this manifest.",
    "A record is not import-ready merely because a secondary solved-paper transcription agrees with its answer.",
    "Officially dropped questions and all answer/reproduction conflicts remain blocked.",
    "No live question-bank or taxonomy file is modified by this draft.",
  ],
  records,
};

fs.writeFileSync(
  path.join(root, "content/taxonomy/indian-geography-v1.3-import-draft.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output.summary, null, 2));
