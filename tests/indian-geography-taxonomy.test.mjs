import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [registry, migration, candidates, classification, answerAudit, importDraft, bank] = await Promise.all([
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-migration-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-source-candidates.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-classification-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-answer-audit.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-import-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/question-bank.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("Indian Geography draft has a complete ordered and unique registry", () => {
  assert.equal(registry.status, "migration-review-required");
  assert.equal(registry.chapters.length, 14);
  assert.equal(registry.chapters.flatMap((chapter) => chapter.subtopics).length, 123);
  assert.deepEqual(registry.chapters.map((chapter) => chapter.order), Array.from({ length: 14 }, (_, index) => index + 1));
  const labels = [];
  for (const chapter of registry.chapters) {
    assert.deepEqual(chapter.subtopics.map((subtopic) => subtopic.order), Array.from({ length: chapter.subtopics.length }, (_, index) => index + 1));
    labels.push(...chapter.subtopics.map((subtopic) => `${chapter.name}/${subtopic.name}`));
  }
  assert.equal(new Set(labels).size, labels.length);
});

test("every source candidate has one valid v1.3 classification proposal", () => {
  const validIds = new Set(registry.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) => {
    const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `indian-geography/${slug(chapter.name)}/${slug(subtopic.name)}`;
  })));
  assert.equal(classification.status, "classification-draft-do-not-publish");
  assert.equal(classification.recordCount, 609);
  assert.equal(classification.records.length, 609);
  assert.equal(Object.values(classification.countsByConfidence).reduce((sum, count) => sum + count, 0), 609);
  assert.deepEqual(classification.countsByScopeDecision, { include: 600, "move-out": 9 });
  assert.equal(Object.values(classification.countsByChapter).reduce((sum, count) => sum + count, 0), 600);
  assert.ok(classification.records.filter((record) => record.scopeDecision === "include").every((record) => validIds.has(record.proposedPath.taxonomyId)));
  assert.ok(classification.records.filter((record) => record.scopeDecision === "move-out").every((record) => record.proposedPath === null && record.moveOutDestination?.head));
  assert.equal(classification.countsByConfidence.low, 0);
  assert.equal(classification.countsByConfidence.medium, 0);
});

test("Indian Geography migration draft covers every current question without claiming review", () => {
  assert.equal(migration.status, "draft-only-do-not-publish");
  assert.equal(migration.recordCount, 402);
  assert.equal(migration.records.length, 402);
  assert.equal(new Set(migration.records.map((record) => record.questionId)).size, 402);
  assert.deepEqual(migration.examCounts, { CSE: 110, CAPF: 59, CDS: 61, NDA: 172 });
  assert.ok(migration.records.every((record) => record.reviewStatus === "needs-review"));
  assert.ok(migration.records.every((record) => record.sourcePdfStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => record.verbatimStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => record.answerKeyStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => bank.questions.some((question) => question.id === record.questionId)));
});

test("Indian Geography source ledger exposes missing imports and verification debt", () => {
  assert.equal(candidates.status, "audit-required-do-not-import");
  assert.equal(candidates.candidateCount, 609);
  assert.deepEqual(candidates.byExam, { CSE: 123, CAPF: 65, CDS: 235, NDA: 186 });
  assert.deepEqual(candidates.byAction, { "reuse-existing": 414, "resolve-ambiguous-existing": 2, "add-new": 193 });
  assert.equal(candidates.byAnswerVerification["project-key-without-per-record-citation"], 205);
  assert.ok(candidates.candidates.every((candidate) => candidate.sourceText));
  assert.ok(candidates.candidates.every((candidate) => Object.keys(candidate.options).length === 4));
  assert.ok(candidates.candidates.every((candidate) => /^[A-D]$/.test(candidate.answer) || (candidate.answer === "X" && candidate.answerVerification.status === "official-dropped")));
  assert.ok(candidates.candidates.every((candidate) => candidate.targetTaxonomyStatus === "needs-question-level-review"));
});

test("Indian Geography answer audit covers every candidate without overstating verification", () => {
  assert.equal(answerAudit.status, "draft-audit-do-not-publish");
  assert.equal(answerAudit.candidateCount, 609);
  assert.equal(answerAudit.records.length, 609);
  assert.equal(new Set(answerAudit.records.map((record) => record.sourceIdentity.label)).size, 609);
  assert.equal(Object.values(answerAudit.summary.byDisposition).reduce((sum, count) => sum + count, 0), 609);
  assert.equal(Object.values(answerAudit.summary.byPublicationGate).reduce((sum, count) => sum + count, 0), 609);
  assert.equal(answerAudit.summary.byDisposition["officially-dropped-quarantine"], 3);
  assert.ok(answerAudit.records
    .filter((record) => record.priorVerification.status === "official-dropped")
    .every((record) => record.publicationGate === "blocked" && record.sourceAnswer === "X"));
  assert.ok(answerAudit.records
    .filter((record) => record.publicationGate === "answer-cleared")
    .every((record) => record.priorVerification.status.startsWith("official-")));
  assert.ok(answerAudit.records
    .filter((record) => record.disposition === "answer-conflict")
    .every((record) => record.publicationGate === "blocked"));
});

test("Indian Geography import draft joins every in-scope record and preserves all gates", () => {
  assert.equal(importDraft.status, "blocked-until-audits-clear-do-not-publish");
  assert.equal(importDraft.sourceCandidateCount, 609);
  assert.equal(importDraft.recordCount, 600);
  assert.equal(importDraft.excludedOrMovedCount, 9);
  assert.equal(importDraft.records.length, 600);
  assert.equal(new Set(importDraft.records.map((record) => record.sourceIdentity.label)).size, 600);
  assert.equal(Object.values(importDraft.summary.byExam).reduce((sum, count) => sum + count, 0), 600);
  assert.equal(Object.values(importDraft.summary.byImportAction).reduce((sum, count) => sum + count, 0), 600);
  assert.equal(Object.values(importDraft.summary.byAnswerGate).reduce((sum, count) => sum + count, 0), 600);
  assert.equal(Object.values(importDraft.summary.byReproductionGate).reduce((sum, count) => sum + count, 0), 600);
  assert.equal(Object.values(importDraft.summary.byImportGate).reduce((sum, count) => sum + count, 0), 600);
  assert.ok(importDraft.records.every((record) => record.targetPath?.taxonomyId));
  assert.ok(importDraft.records
    .filter((record) => record.gates.import === "ready-for-final-editorial-review")
    .every((record) => record.gates.answer === "answer-cleared"));
  assert.ok(importDraft.records
    .filter((record) => record.gates.reproduction === "original-paper-high-confidence-match")
    .every((record) => record.provenance.originalPdf.ocr_confidence_band === "high" || record.provenance.originalPdf.ocr_confidence >= 0.9));
});
