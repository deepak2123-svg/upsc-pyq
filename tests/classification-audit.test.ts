import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUDIT_VERSION,
  EXPECTED_ACTIVE_BASELINE,
  activeAuditQuestions,
  buildBlindPackets,
  buildInitialManifest,
  progressReport,
  validateManifest,
  type AuditManifest,
  type ReviewDecision,
} from '../scripts/classification-audit.ts';

function clone<T>(value: T): T { return structuredClone(value); }

function decision(reviewerId: string, primaryId: string): ReviewDecision {
  return {
    reviewerId,
    reviewedAt: '2026-11-19T00:00:00Z',
    primaryId,
    additionalIds: [],
    tag: 'Static',
    rationale: 'The complete stem and options principally test this concept.',
    confidence: 'high',
    ambiguityFlags: [],
    taxonomyChangeNeeded: false,
  };
}

test('audit baseline enumerates every active canonical runtime question exactly once', () => {
  const runtime = activeAuditQuestions();
  const manifest = buildInitialManifest();
  assert.equal(runtime.length, EXPECTED_ACTIVE_BASELINE);
  assert.equal(manifest.records.length, EXPECTED_ACTIVE_BASELINE);
  assert.equal(new Set(manifest.records.map(record => record.questionId)).size, EXPECTED_ACTIVE_BASELINE);
  assert.equal(manifest.baseline.gsQuestions, 2_525);
  assert.equal(manifest.baseline.preparationQuestions, 3_126);
  assert.deepEqual(manifest.baseline.byExam, { CAPF: 252, CDS: 184, CSE: 753, NDA: 4_462 });
  assert.equal(manifest.records.filter(record => record.auditWave === 'calibration-pilot').length, 120);
  assert.ok(manifest.batches.every(batch => batch.questionIds.length <= 30));
});

test('bundled independent cohort is applied while the remaining audit stays pending', () => {
  const manifest = buildInitialManifest();
  const result = validateManifest(manifest, { compareRuntime: true });
  assert.deepEqual(result.issues, []);
  assert.equal(result.resolvedCount, 28);
  assert.equal(result.appliedCount, 28);
  assert.equal(result.certificationComplete, false);
  const report = progressReport(manifest);
  assert.equal(report.status, 'pending-independent-review');
  assert.equal(report.review.unresolved, EXPECTED_ACTIVE_BASELINE - 28);
  assert.equal(report.review.adjudicated, 6);
  const defect = manifest.records.find(record => record.questionId === 'nda-2015-ii-137')!;
  assert.equal(defect.before.primaryId, 'syllabus:polity-governance/institutions/parliament/sessions-and-procedures');
  assert.equal(defect.before.tags.join('|'), 'Event-based');
  assert.equal(defect.reviewerA?.reviewerId, 'taxonomy-reviewer-a');
  assert.equal(defect.reviewerB?.reviewerId, 'taxonomy-reviewer-b');
  assert.equal(defect.application.status, 'applied');
});

test('blind review packets omit prior classifications, rationales, answers and explanations', () => {
  const manifest = buildInitialManifest();
  const packets = buildBlindPackets(manifest);
  const serialized = JSON.stringify(packets[0].questions[0]);
  for (const forbidden of ['before', 'primaryId', 'additionalIds', 'riskFlags', 'rationale', 'answer', 'explanation', 'subject', 'topic', 'subtopic']) {
    assert.equal(serialized.includes(`\"${forbidden}\"`), false, `Blind packet leaked ${forbidden}`);
  }
  assert.ok(packets.every(packet => packet.questions.length <= 30));
});

test('known classification defect is automatically placed in the high-risk calibration cohort', () => {
  const manifest = buildInitialManifest();
  const record = manifest.records.find(row => row.questionId === 'nda-2015-ii-137');
  assert.ok(record);
  assert.equal(record.auditWave, 'calibration-pilot');
  assert.ok(record.riskFlags.includes('known-classification-defect'));
});

test('certification rejects same-reviewer passes, unknown leaves and unadjudicated disagreement', () => {
  const manifest = buildInitialManifest();
  const record = manifest.records[0];
  record.reviewerA = decision('reviewer-one', record.before.primaryId);
  record.reviewerB = decision('reviewer-one', record.before.primaryId);
  let result = validateManifest(manifest, { compareRuntime: false });
  assert.ok(result.issues.some(issue => issue.code === 'reviewer-independence'));

  const unknown = clone(manifest) as AuditManifest;
  unknown.records[0].reviewerB = decision('reviewer-two', 'unknown:leaf');
  result = validateManifest(unknown, { compareRuntime: false });
  assert.ok(result.issues.some(issue => issue.code === 'reviewer-b-primary'));

  const disagreement = buildInitialManifest();
  const other = disagreement.taxonomyCatalog.find(leaf => leaf.id !== disagreement.records[0].before.primaryId)!;
  disagreement.records[0].reviewerA = decision('reviewer-one', disagreement.records[0].before.primaryId);
  disagreement.records[0].reviewerB = decision('reviewer-two', other.id);
  result = validateManifest(disagreement, { compareRuntime: false });
  assert.ok(result.issues.some(issue => issue.code === 'unadjudicated-disagreement'));
});

test('applied records require a resolved decision, taxonomy revision and output verification', () => {
  const manifest = buildInitialManifest();
  const record = manifest.records[0];
  record.reviewerA = decision('reviewer-one', record.before.primaryId);
  record.reviewerB = decision('reviewer-two', record.before.primaryId);
  record.application.status = 'applied';
  let result = validateManifest(manifest, { compareRuntime: false });
  assert.ok(result.issues.some(issue => issue.code === 'invalid-application'));
  record.application.classificationRevision = 1;
  record.application.generatedOutputVerified = true;
  result = validateManifest(manifest, { compareRuntime: false });
  assert.equal(result.issues.some(issue => issue.code === 'invalid-application'), false);
});

test('audit identity and risk report stay versioned and reproducible', () => {
  const manifest = buildInitialManifest();
  const report = progressReport(manifest);
  assert.equal(report.auditVersion, AUDIT_VERSION);
  assert.equal(report.coverage.activeQuestions, EXPECTED_ACTIVE_BASELINE);
  assert.equal(report.riskCounts['known-classification-defect'], 1);
  assert.ok(report.riskCounts['question-number-analogue-rationale'] > 0);
  assert.ok(report.riskCounts['same-agent-second-pass'] > 0);
});
