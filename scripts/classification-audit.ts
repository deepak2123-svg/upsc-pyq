import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getQuestionPaths,
  historicalPyqQuestions,
  type PyqQuestion,
} from '../lib/pyq-catalog.ts';
import {
  questionEligible,
  questionInGsScope,
} from '../lib/question-review.ts';
import {
  PRELIMS_TAXONOMY_VERSION,
  prelimsRegistryNodes,
  reviewedPrelimsPlacements,
} from '../lib/prelims-taxonomy.ts';

export const AUDIT_VERSION = 'classification-audit-v1';
export const EXPECTED_ACTIVE_BASELINE = 5_651;
export const MANIFEST_PATH = `content/audits/${AUDIT_VERSION}/manifest.json`;
export const REPORT_JSON_PATH = `content/audits/${AUDIT_VERSION}/progress.json`;
export const REPORT_MARKDOWN_PATH = `docs/${AUDIT_VERSION}-progress.md`;
export const PACKET_DIRECTORY = `tmp/${AUDIT_VERSION}`;
export const EVIDENCE_INDEX_PATH = `content/audits/${AUDIT_VERSION}/evidence-index.json`;

const REVIEW_TAGS = new Set(['Static', 'Event-based']);
const REVIEW_CONFIDENCE = new Set(['high', 'medium', 'low']);
const KNOWN_CLASSIFICATION_DEFECTS = new Set(['nda-2015-ii-137']);
const SOURCE_IDENTITY_KEYS = [
  'originalPdfSha256',
  'originalPage',
  'originalPages',
  'bookletSeries',
  'answerStatus',
  'originalUrl',
  'sourceUrl',
] as const;

type RuntimePath = ReturnType<typeof getQuestionPaths>[number];

export type TaxonomyCatalogLeaf = {
  id: string;
  subject: string;
  section: string;
  chapter: string;
  subpart: string;
  source: 'prelims-registry' | 'runtime-projection';
  includes: string[];
  excludes: string[];
  boundary: string | null;
  placementRule: string | null;
  exampleStatus: string | null;
};

export type ReviewDecision = {
  reviewerId: string;
  reviewedAt: string;
  primaryId: string;
  additionalIds: string[];
  tag: 'Static' | 'Event-based';
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  ambiguityFlags: string[];
  taxonomyChangeNeeded: boolean;
};

export type AdjudicationDecision = ReviewDecision & {
  resolves: 'reviewer-disagreement' | 'taxonomy-change' | 'editorial-direction';
};

export type AuditRecord = {
  questionId: string;
  expectedSourceTextHash: string;
  expectedQuestionContentHash: string;
  expectedAnswerHash: string;
  expectedSourceIdentityHash: string;
  expectedRecordHash: string | null;
  sourceIdentity: Record<string, unknown> & {
    exam: string;
    year: number;
    paper: string;
    questionNumber: number;
  };
  scope: 'gs' | 'preparation';
  before: {
    primaryId: string;
    additionalIds: string[];
    tags: string[];
  };
  riskFlags: string[];
  auditWave: 'calibration-pilot' | 'high-risk' | 'gs-certification' | 'preparation-certification';
  batchId: string;
  reviewerA: ReviewDecision | null;
  reviewerB: ReviewDecision | null;
  adjudication: AdjudicationDecision | null;
  application: {
    status: 'pending' | 'applied';
    classificationRevision: number | null;
    generatedOutputVerified: boolean;
  };
};

export type AuditManifest = {
  version: 1;
  auditVersion: typeof AUDIT_VERSION;
  taxonomyVersion: string;
  status: 'pending-independent-review' | 'review-complete-application-pending' | 'certified';
  rules: {
    independentReviewRequired: true;
    maxBatchSize: 30;
    questionNumberAnalogueForbidden: true;
    answerContentAndScoringIndependent: true;
  };
  baseline: {
    activeQuestions: number;
    gsQuestions: number;
    preparationQuestions: number;
    byExam: Record<string, number>;
    expectedActiveBaseline: number;
  };
  taxonomyCatalog: TaxonomyCatalogLeaf[];
  batches: Array<{
    id: string;
    wave: AuditRecord['auditWave'];
    exam: string;
    year: number;
    paper: string;
    questionIds: string[];
  }>;
  records: AuditRecord[];
};

type RuntimeQuestion = PyqQuestion & {
  sourceText?: string;
  source?: Record<string, unknown>;
  classificationTags?: string[];
};

type ValidationIssue = { questionId?: string; code: string; message: string };

type ReviewEnvelope = {
  auditVersion: string;
  paperId: string;
  reviewer: { id: string; reviewedAt: string; independent: boolean };
  decisions: EvidenceDecision[];
};

type AdjudicationEnvelope = {
  auditVersion: string;
  paperId: string;
  adjudicator: { id: string; reviewedAt: string };
  decisions: Array<EvidenceDecision & { resolves: AdjudicationDecision['resolves'] }>;
};

type EvidenceDecision = {
  questionId: string;
  primaryLeaf: string;
  additionalLeaves: string[];
  tag: ReviewDecision['tag'];
  rationale: string;
  confidence: ReviewDecision['confidence'];
  taxonomyChangeNeeded: boolean;
};

type EvidenceIndex = {
  version: 1;
  auditVersion: string;
  cohorts: Array<{
    id: string;
    reviewerA: string;
    reviewerB: string;
    adjudication: string;
    beforeClassificationModule: string;
    classificationRevision: number;
    generatedOutputVerified: boolean;
  }>;
};

const registryById = new Map(prelimsRegistryNodes.map(node => [node.id, node]));

function stableHash(value: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function questionContentHash(question: RuntimeQuestion) {
  return stableHash({
    sourceText: question.sourceText,
    promptLines: question.promptLines,
    options: question.options,
    sharedContext: question.sharedContext,
    underlined: question.underlined,
    requiresFigure: question.requiresFigure,
    figureKey: question.figureKey,
    figureAlt: question.figureAlt,
  });
}

function answerHash(question: RuntimeQuestion) {
  return stableHash({ answer: question.answer, acceptedAnswers: question.acceptedAnswers });
}

function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[key(row)] = (counts[key(row)] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function placementId(runtimePath: RuntimePath) {
  return runtimePath.taxonomyId || runtimePath.subtopicId;
}

function registryBoundary(nodeId: string) {
  let node = registryById.get(nodeId);
  while (node && node.kind !== 'chapter') node = node.parentId ? registryById.get(node.parentId) : undefined;
  return typeof node?.boundary === 'string' ? node.boundary : null;
}

function catalogLeaf(runtimePath: RuntimePath): TaxonomyCatalogLeaf {
  const id = placementId(runtimePath);
  const node = registryById.get(id);
  return {
    id,
    subject: runtimePath.subject,
    section: runtimePath.head,
    chapter: runtimePath.topic,
    subpart: runtimePath.subtopic,
    source: node?.kind === 'subpart' ? 'prelims-registry' : 'runtime-projection',
    includes: Array.isArray(node?.includes) ? [...node.includes] : [runtimePath.subtopic],
    excludes: Array.isArray(node?.excludes) ? [...node.excludes] : [],
    boundary: node?.kind === 'subpart' ? registryBoundary(node.id) : null,
    placementRule: typeof node?.placementRule === 'string' ? node.placementRule : null,
    exampleStatus: typeof node?.editorialExampleStatus === 'string' ? node.editorialExampleStatus : null,
  };
}

function catalogLeafById(id: string): TaxonomyCatalogLeaf {
  const node = registryById.get(id);
  assert.equal(node?.kind, 'subpart', `Review evidence references an unknown taxonomy leaf: ${id}`);
  const labels = new Map<string, string>();
  let cursor = node;
  while (cursor) {
    labels.set(cursor.kind, cursor.label);
    cursor = cursor.parentId ? registryById.get(cursor.parentId) : undefined;
  }
  return {
    id,
    subject: labels.get('subject')!,
    section: labels.get('section')!,
    chapter: labels.get('chapter')!,
    subpart: labels.get('subpart')!,
    source: 'prelims-registry',
    includes: Array.isArray(node.includes) ? [...node.includes] : [node.label],
    excludes: Array.isArray(node.excludes) ? [...node.excludes] : [],
    boundary: registryBoundary(id),
    placementRule: typeof node.placementRule === 'string' ? node.placementRule : null,
    exampleStatus: typeof node.editorialExampleStatus === 'string' ? node.editorialExampleStatus : null,
  };
}

export function activeAuditQuestions() {
  const rows = (historicalPyqQuestions as RuntimeQuestion[]).filter(question => questionEligible(question.id));
  assert.equal(
    rows.length,
    EXPECTED_ACTIVE_BASELINE,
    `Active classification baseline changed from ${EXPECTED_ACTIVE_BASELINE} to ${rows.length}; open a reviewed audit-baseline change instead of silently changing the certification denominator.`,
  );
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'Active runtime question IDs must be unique');
  return rows;
}

export function buildTaxonomyCatalog(questions = activeAuditQuestions()) {
  const leaves = new Map<string, TaxonomyCatalogLeaf>();
  for (const question of questions) {
    for (const runtimePath of getQuestionPaths(question)) {
      const leaf = catalogLeaf(runtimePath);
      const existing = leaves.get(leaf.id);
      if (existing) {
        assert.deepEqual(
          [existing.subject, existing.section, existing.chapter, existing.subpart],
          [leaf.subject, leaf.section, leaf.chapter, leaf.subpart],
          `Conflicting runtime taxonomy labels for ${leaf.id}`,
        );
      } else leaves.set(leaf.id, leaf);
    }
  }
  return [...leaves.values()].sort((a, b) =>
    a.subject.localeCompare(b.subject) || a.section.localeCompare(b.section) ||
    a.chapter.localeCompare(b.chapter) || a.subpart.localeCompare(b.subpart) || a.id.localeCompare(b.id));
}

function sourceIdentity(question: RuntimeQuestion) {
  const source = question.source || {};
  const selected: Record<string, unknown> = {
    exam: question.exam,
    year: question.year,
    paper: question.paper,
    questionNumber: question.questionNumber,
  };
  for (const key of SOURCE_IDENTITY_KEYS) if (source[key] !== undefined) selected[key] = source[key];
  return selected as AuditRecord['sourceIdentity'];
}

function previousTags(question: RuntimeQuestion) {
  const reviewed = reviewedPrelimsPlacements.get(question.id) as { tags?: string[] } | undefined;
  const tags = reviewed?.tags || question.classificationTags || [];
  return [...new Set(tags)].sort();
}

function riskFlags(question: RuntimeQuestion, paths: RuntimePath[], rationaleCounts: Map<string, number>, catalog: Map<string, TaxonomyCatalogLeaf>) {
  const reviewed = reviewedPrelimsPlacements.get(question.id) as {
    rationale?: string;
    secondPass?: { rationale?: string };
    additionalIds?: string[];
  } | undefined;
  const flags = new Set<string>();
  const rationale = reviewed?.rationale?.trim() || '';
  if (!reviewed) flags.add('source-embedded-outside-central-ledger');
  if (KNOWN_CLASSIFICATION_DEFECTS.has(question.id)) flags.add('known-classification-defect');
  if (/analogue/i.test(rationale)) flags.add('question-number-analogue-rationale');
  if (/same-agent/i.test(reviewed?.secondPass?.rationale || '')) flags.add('same-agent-second-pass');
  if (paths.length > 1) flags.add('multiple-placement');
  if (previousTags(question).includes('Event-based')) flags.add('event-based');
  if (!previousTags(question).length) flags.add('missing-static-event-tag');
  if (rationale && (rationaleCounts.get(rationale) || 0) > 1) flags.add('reused-rationale');
  for (const runtimePath of paths) {
    if (!runtimePath.taxonomyId) flags.add('runtime-path-without-registry-id');
    const leaf = catalog.get(placementId(runtimePath));
    if (leaf?.excludes.join('|') === 'Incidental references without testing this concept|Unrelated neighbouring concepts') {
      flags.add('generic-taxonomy-boundary');
    }
    if (leaf?.exampleStatus === 'pending-real-question-pilot') flags.add('taxonomy-example-pending');
  }
  return [...flags].sort();
}

function assignWaves(records: Array<Omit<AuditRecord, 'auditWave' | 'batchId'>>) {
  const pilot = new Set<string>();
  for (const exam of ['CSE', 'CAPF', 'CDS', 'NDA']) {
    const candidates = records.filter(record => record.sourceIdentity.exam === exam).sort((a, b) =>
      Number(b.riskFlags.includes('known-classification-defect')) - Number(a.riskFlags.includes('known-classification-defect')) ||
      Number(b.riskFlags.includes('question-number-analogue-rationale')) - Number(a.riskFlags.includes('question-number-analogue-rationale')) ||
      b.riskFlags.length - a.riskFlags.length ||
      Number(b.sourceIdentity.year) - Number(a.sourceIdentity.year) ||
      a.questionId.localeCompare(b.questionId));
    assert.ok(candidates.length >= 30, `${exam} needs at least 30 active questions for the calibration pilot`);
    for (const record of candidates.slice(0, 30)) pilot.add(record.questionId);
  }
  return records.map(record => ({
    ...record,
    auditWave: pilot.has(record.questionId)
      ? 'calibration-pilot'
      : record.riskFlags.length
        ? 'high-risk'
        : record.scope === 'gs'
          ? 'gs-certification'
          : 'preparation-certification',
    batchId: '',
  } as AuditRecord));
}

function assignBatches(records: AuditRecord[]) {
  const grouped = Map.groupBy(records, record => [
    record.auditWave,
    record.sourceIdentity.exam,
    record.sourceIdentity.year,
    record.sourceIdentity.paper,
  ].join('/'));
  const batches: AuditManifest['batches'] = [];
  for (const [group, groupRecords] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    groupRecords.sort((a, b) => Number(a.sourceIdentity.questionNumber) - Number(b.sourceIdentity.questionNumber) || a.questionId.localeCompare(b.questionId));
    for (let offset = 0; offset < groupRecords.length; offset += 30) {
      const members = groupRecords.slice(offset, offset + 30);
      const batchId = `${group}/batch-${String(offset / 30 + 1).padStart(2, '0')}`.toLowerCase().replace(/[^a-z0-9/-]+/g, '-');
      for (const record of members) record.batchId = batchId;
      batches.push({
        id: batchId,
        wave: members[0].auditWave,
        exam: String(members[0].sourceIdentity.exam),
        year: Number(members[0].sourceIdentity.year),
        paper: String(members[0].sourceIdentity.paper),
        questionIds: members.map(member => member.questionId),
      });
    }
  }
  return batches;
}

export function buildInitialManifest(): AuditManifest {
  const questions = activeAuditQuestions();
  const taxonomyCatalog = buildTaxonomyCatalog(questions);
  const catalog = new Map(taxonomyCatalog.map(leaf => [leaf.id, leaf]));
  const rationaleCounts = new Map<string, number>();
  for (const row of reviewedPrelimsPlacements.values() as Iterable<{ rationale?: string }>) {
    const rationale = row.rationale?.trim();
    if (rationale) rationaleCounts.set(rationale, (rationaleCounts.get(rationale) || 0) + 1);
  }
  const baseRecords = questions.map(question => {
    const paths = getQuestionPaths(question);
    assert.ok(paths.length, `Active question has no runtime classification path: ${question.id}`);
    assert.ok(question.sourceTextHash, `Active question has no sourceTextHash: ${question.id}`);
    const reviewed = reviewedPrelimsPlacements.get(question.id) as { expectedRecordHash?: string } | undefined;
    return {
      questionId: question.id,
      expectedSourceTextHash: question.sourceTextHash,
      expectedQuestionContentHash: questionContentHash(question),
      expectedAnswerHash: answerHash(question),
      expectedSourceIdentityHash: stableHash(sourceIdentity(question)),
      expectedRecordHash: reviewed?.expectedRecordHash || null,
      sourceIdentity: sourceIdentity(question),
      scope: questionInGsScope(question.id) ? 'gs' : 'preparation',
      before: {
        primaryId: placementId(paths[0]),
        additionalIds: paths.slice(1).map(placementId),
        tags: previousTags(question),
      },
      riskFlags: riskFlags(question, paths, rationaleCounts, catalog),
      reviewerA: null,
      reviewerB: null,
      adjudication: null,
      application: { status: 'pending', classificationRevision: null, generatedOutputVerified: false },
    } satisfies Omit<AuditRecord, 'auditWave' | 'batchId'>;
  }).sort((a, b) => a.questionId.localeCompare(b.questionId));
  const records = assignWaves(baseRecords);
  const batches = assignBatches(records);
  const gsQuestions = records.filter(record => record.scope === 'gs').length;
  const manifest: AuditManifest = {
    version: 1,
    auditVersion: AUDIT_VERSION,
    taxonomyVersion: PRELIMS_TAXONOMY_VERSION,
    status: 'pending-independent-review',
    rules: {
      independentReviewRequired: true,
      maxBatchSize: 30,
      questionNumberAnalogueForbidden: true,
      answerContentAndScoringIndependent: true,
    },
    baseline: {
      activeQuestions: records.length,
      gsQuestions,
      preparationQuestions: records.length - gsQuestions,
      byExam: countBy(records, record => String(record.sourceIdentity.exam)),
      expectedActiveBaseline: EXPECTED_ACTIVE_BASELINE,
    },
    taxonomyCatalog,
    batches,
    records,
  };
  return applyBundledReviewEvidence(manifest);
}

function decisionsEqual(a: ReviewDecision, b: ReviewDecision) {
  return a.primaryId === b.primaryId &&
    [...a.additionalIds].sort().join('|') === [...b.additionalIds].sort().join('|') &&
    a.tag === b.tag && a.taxonomyChangeNeeded === b.taxonomyChangeNeeded;
}

function isoTimestamp(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
}

function readJson<T>(file: string) {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function decisionFromEvidence(
  reviewerId: string,
  reviewedAt: string,
  decision: EvidenceDecision,
): ReviewDecision {
  return {
    reviewerId,
    reviewedAt: isoTimestamp(reviewedAt),
    primaryId: decision.primaryLeaf,
    additionalIds: [...decision.additionalLeaves],
    tag: decision.tag,
    rationale: decision.rationale,
    confidence: decision.confidence,
    ambiguityFlags: decision.taxonomyChangeNeeded ? ['taxonomy-gap'] : [],
    taxonomyChangeNeeded: decision.taxonomyChangeNeeded,
  };
}

function semanticAdditionalIds(primaryId: string, additionalIds: string[], catalog: Map<string, TaxonomyCatalogLeaf>) {
  const primary = catalog.get(primaryId);
  if (!primary) return additionalIds;
  return additionalIds.filter(id => {
    const candidate = catalog.get(id);
    if (!candidate || primary.chapter !== candidate.chapter || primary.subpart !== candidate.subpart) return true;
    return !(
      (primary.subject === 'Economy' && primary.section === 'Current Affairs' && candidate.subject === 'Current Affairs' && candidate.section === 'Economy & Development') ||
      (primary.subject === 'Current Affairs' && primary.section === 'Economy & Development' && candidate.subject === 'Economy' && candidate.section === 'Current Affairs')
    );
  });
}

function parseClassificationModule(file: string) {
  const source = fs.readFileSync(file, 'utf8').replace(/^\s*export const classifications\s*=\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(source) as Record<string, { path: string; additional?: string[] }>;
}

/** Merge immutable, independently-authored review evidence into the reproducible baseline. */
export function applyBundledReviewEvidence(manifest: AuditManifest) {
  if (!fs.existsSync(EVIDENCE_INDEX_PATH)) return manifest;
  const index = readJson<EvidenceIndex>(EVIDENCE_INDEX_PATH);
  assert.equal(index.version, 1);
  assert.equal(index.auditVersion, AUDIT_VERSION);
  const recordById = new Map(manifest.records.map(record => [record.questionId, record]));
  const runtimeById = new Map(activeAuditQuestions().map(question => [question.id, question]));
  const idByPath = new Map(manifest.taxonomyCatalog.map(leaf => [[leaf.subject, leaf.section, leaf.chapter, leaf.subpart].join('/'), leaf.id]));

  for (const cohort of index.cohorts) {
    const reviewA = readJson<ReviewEnvelope>(cohort.reviewerA);
    const reviewB = readJson<ReviewEnvelope>(cohort.reviewerB);
    const adjudication = readJson<AdjudicationEnvelope>(cohort.adjudication);
    const before = parseClassificationModule(cohort.beforeClassificationModule);
    assert.equal(reviewA.auditVersion, AUDIT_VERSION, cohort.id);
    assert.equal(reviewB.auditVersion, AUDIT_VERSION, cohort.id);
    assert.equal(adjudication.auditVersion, AUDIT_VERSION, cohort.id);
    assert.equal(reviewA.paperId, reviewB.paperId, cohort.id);
    assert.equal(reviewA.paperId, adjudication.paperId, cohort.id);
    assert.equal(reviewA.reviewer.independent, true, cohort.id);
    assert.equal(reviewB.reviewer.independent, true, cohort.id);
    assert.notEqual(reviewA.reviewer.id, reviewB.reviewer.id, cohort.id);
    assert.ok(![reviewA.reviewer.id, reviewB.reviewer.id].includes(adjudication.adjudicator.id), cohort.id);
    const secondById = new Map(reviewB.decisions.map(decision => [decision.questionId, decision]));
    const adjudicatedById = new Map(adjudication.decisions.map(decision => [decision.questionId, decision]));
    const catalogIds = new Set(manifest.taxonomyCatalog.map(leaf => leaf.id));
    for (const decision of [...reviewA.decisions, ...reviewB.decisions, ...adjudication.decisions]) {
      for (const id of [decision.primaryLeaf, ...decision.additionalLeaves]) {
        if (!catalogIds.has(id)) {
          manifest.taxonomyCatalog.push(catalogLeafById(id));
          catalogIds.add(id);
        }
      }
    }
    manifest.taxonomyCatalog.sort((a, b) =>
      a.subject.localeCompare(b.subject) || a.section.localeCompare(b.section) ||
      a.chapter.localeCompare(b.chapter) || a.subpart.localeCompare(b.subpart) || a.id.localeCompare(b.id));

    for (const first of reviewA.decisions) {
      const second = secondById.get(first.questionId);
      const record = recordById.get(first.questionId);
      const runtime = runtimeById.get(first.questionId);
      assert.ok(second && record && runtime, `${cohort.id}: incomplete evidence for ${first.questionId}`);
      const number = String(record.sourceIdentity.questionNumber);
      const prior = before[number];
      assert.ok(prior, `${cohort.id}: missing before-state for ${first.questionId}`);
      const priorPrimary = idByPath.get(prior.path);
      const priorAdditional = (prior.additional || []).map(path => idByPath.get(path));
      assert.ok(priorPrimary, `${cohort.id}: unknown before primary ${prior.path}`);
      assert.ok(priorAdditional.every(Boolean), `${cohort.id}: unknown before additional placement`);
      record.before = {
        primaryId: priorPrimary,
        additionalIds: priorAdditional as string[],
        tags: Number(number) >= 136 ? ['Event-based'] : ['Static'],
      };
      if (!record.riskFlags.includes('question-number-analogue-rationale')) {
        record.riskFlags = [...record.riskFlags, 'question-number-analogue-rationale'].sort();
      }
      record.reviewerA = decisionFromEvidence(reviewA.reviewer.id, reviewA.reviewer.reviewedAt, first);
      record.reviewerB = decisionFromEvidence(reviewB.reviewer.id, reviewB.reviewer.reviewedAt, second);
      if (!decisionsEqual(record.reviewerA, record.reviewerB)) {
        const final = adjudicatedById.get(first.questionId);
        assert.ok(final, `${cohort.id}: disagreement is not adjudicated for ${first.questionId}`);
        record.adjudication = {
          ...decisionFromEvidence(adjudication.adjudicator.id, adjudication.adjudicator.reviewedAt, final),
          resolves: final.resolves,
        };
      } else {
        assert.equal(adjudicatedById.has(first.questionId), false, `${cohort.id}: agreement must not be overwritten`);
      }
      const resolved = resolvedDecision(record);
      assert.ok(resolved, `${cohort.id}: no resolved decision for ${first.questionId}`);
      const runtimePaths = getQuestionPaths(runtime);
      assert.equal(placementId(runtimePaths[0]), resolved.primaryId, `${cohort.id}: generated primary not applied for ${first.questionId}`);
      const semanticAdditional = semanticAdditionalIds(resolved.primaryId, runtimePaths.slice(1).map(placementId), new Map(manifest.taxonomyCatalog.map(leaf => [leaf.id, leaf])));
      assert.deepEqual(semanticAdditional.sort(), [...resolved.additionalIds].sort(), `${cohort.id}: generated additional placements not applied for ${first.questionId}`);
      assert.deepEqual(previousTags(runtime), [resolved.tag], `${cohort.id}: generated tag not applied for ${first.questionId}`);
      record.application = {
        status: 'applied',
        classificationRevision: cohort.classificationRevision,
        generatedOutputVerified: cohort.generatedOutputVerified,
      };
    }
    assert.equal(secondById.size, reviewA.decisions.length, `${cohort.id}: reviewer queue lengths differ`);
    assert.equal(adjudicatedById.size, reviewA.decisions.filter(first => {
      const second = secondById.get(first.questionId)!;
      return first.primaryLeaf !== second.primaryLeaf ||
        [...first.additionalLeaves].sort().join('|') !== [...second.additionalLeaves].sort().join('|') ||
        first.tag !== second.tag || first.taxonomyChangeNeeded !== second.taxonomyChangeNeeded;
    }).length, `${cohort.id}: adjudication count differs from disagreements`);
  }
  return manifest;
}

export function resolvedDecision(record: AuditRecord): ReviewDecision | AdjudicationDecision | null {
  if (!record.reviewerA || !record.reviewerB) return null;
  if (decisionsEqual(record.reviewerA, record.reviewerB)) return record.reviewerA;
  return record.adjudication;
}

function validateDecision(decision: ReviewDecision, record: AuditRecord, leaves: Set<string>, role: string, issues: ValidationIssue[]) {
  if (!decision.reviewerId.trim()) issues.push({ questionId: record.questionId, code: `${role}-identity`, message: `${role} reviewer identity is blank` });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(decision.reviewedAt)) issues.push({ questionId: record.questionId, code: `${role}-date`, message: `${role} reviewedAt must be an ISO UTC timestamp` });
  if (!leaves.has(decision.primaryId)) issues.push({ questionId: record.questionId, code: `${role}-primary`, message: `${role} primary leaf is unknown: ${decision.primaryId}` });
  if (!decision.rationale.trim()) issues.push({ questionId: record.questionId, code: `${role}-rationale`, message: `${role} rationale is blank` });
  if (!REVIEW_TAGS.has(decision.tag)) issues.push({ questionId: record.questionId, code: `${role}-tag`, message: `${role} tag is invalid` });
  if (!REVIEW_CONFIDENCE.has(decision.confidence)) issues.push({ questionId: record.questionId, code: `${role}-confidence`, message: `${role} confidence is invalid` });
  if (new Set(decision.additionalIds).size !== decision.additionalIds.length) issues.push({ questionId: record.questionId, code: `${role}-additional-duplicate`, message: `${role} has duplicate additional leaves` });
  for (const id of decision.additionalIds) {
    if (!leaves.has(id)) issues.push({ questionId: record.questionId, code: `${role}-additional`, message: `${role} additional leaf is unknown: ${id}` });
    if (id === decision.primaryId) issues.push({ questionId: record.questionId, code: `${role}-additional-primary`, message: `${role} repeats the primary as an additional leaf` });
  }
}

export function validateManifest(manifest: AuditManifest, options: { compareRuntime?: boolean; requireCertification?: boolean } = {}) {
  const issues: ValidationIssue[] = [];
  if (manifest.auditVersion !== AUDIT_VERSION) issues.push({ code: 'audit-version', message: `Expected ${AUDIT_VERSION}` });
  if (manifest.baseline.activeQuestions !== EXPECTED_ACTIVE_BASELINE) issues.push({ code: 'baseline-count', message: `Expected ${EXPECTED_ACTIVE_BASELINE} active records` });
  if (manifest.records.length !== manifest.baseline.activeQuestions) issues.push({ code: 'record-count', message: 'Manifest record count differs from baseline' });
  const ids = new Set<string>();
  const leaves = new Set(manifest.taxonomyCatalog.map(leaf => leaf.id));
  for (const record of manifest.records) {
    if (ids.has(record.questionId)) issues.push({ questionId: record.questionId, code: 'duplicate-id', message: 'Question appears more than once' });
    ids.add(record.questionId);
    if (!leaves.has(record.before.primaryId)) issues.push({ questionId: record.questionId, code: 'before-primary', message: `Unknown before primary: ${record.before.primaryId}` });
    if (record.before.additionalIds.some(id => !leaves.has(id))) issues.push({ questionId: record.questionId, code: 'before-additional', message: 'Unknown before additional leaf' });
    if (!record.expectedSourceTextHash) issues.push({ questionId: record.questionId, code: 'source-hash', message: 'Missing expected source hash' });
    if (!record.expectedQuestionContentHash) issues.push({ questionId: record.questionId, code: 'content-hash', message: 'Missing expected question-content hash' });
    if (!record.expectedAnswerHash) issues.push({ questionId: record.questionId, code: 'answer-hash', message: 'Missing expected answer hash' });
    if (!record.expectedSourceIdentityHash) issues.push({ questionId: record.questionId, code: 'source-identity-hash', message: 'Missing expected source-identity hash' });
    if (!record.batchId) issues.push({ questionId: record.questionId, code: 'batch', message: 'Missing audit batch' });
    if (record.reviewerA) validateDecision(record.reviewerA, record, leaves, 'reviewer-a', issues);
    if (record.reviewerB) validateDecision(record.reviewerB, record, leaves, 'reviewer-b', issues);
    if (record.reviewerA && record.reviewerB && record.reviewerA.reviewerId === record.reviewerB.reviewerId) {
      issues.push({ questionId: record.questionId, code: 'reviewer-independence', message: 'Reviewer A and B identities must differ' });
    }
    if (record.adjudication) {
      validateDecision(record.adjudication, record, leaves, 'adjudicator', issues);
      if ([record.reviewerA?.reviewerId, record.reviewerB?.reviewerId].includes(record.adjudication.reviewerId)) {
        issues.push({ questionId: record.questionId, code: 'adjudicator-independence', message: 'Adjudicator must differ from both reviewers' });
      }
    }
    const resolved = resolvedDecision(record);
    if (record.reviewerA && record.reviewerB && !decisionsEqual(record.reviewerA, record.reviewerB) && !record.adjudication) {
      issues.push({ questionId: record.questionId, code: 'unadjudicated-disagreement', message: 'Reviewer disagreement requires adjudication' });
    }
    if (record.application.status === 'applied' && (!resolved || !record.application.generatedOutputVerified || !record.application.classificationRevision)) {
      issues.push({ questionId: record.questionId, code: 'invalid-application', message: 'Applied records require a resolved decision, taxonomy revision and generated-output verification' });
    }
  }
  for (const batch of manifest.batches) {
    if (batch.questionIds.length > manifest.rules.maxBatchSize) issues.push({ code: 'batch-size', message: `${batch.id} exceeds ${manifest.rules.maxBatchSize}` });
    for (const id of batch.questionIds) if (!ids.has(id)) issues.push({ code: 'batch-member', message: `${batch.id} contains unknown ${id}` });
  }
  if (options.compareRuntime !== false) {
    const runtime = new Map(activeAuditQuestions().map(question => [question.id, question]));
    const catalog = new Map(manifest.taxonomyCatalog.map(leaf => [leaf.id, leaf]));
    if (runtime.size !== ids.size) issues.push({ code: 'runtime-count', message: 'Manifest active IDs differ from runtime active IDs' });
    for (const record of manifest.records) {
      const question = runtime.get(record.questionId);
      if (!question) { issues.push({ questionId: record.questionId, code: 'runtime-id', message: 'Question is no longer active' }); continue; }
      if (question.sourceTextHash !== record.expectedSourceTextHash) issues.push({ questionId: record.questionId, code: 'runtime-source-hash', message: 'Source text hash changed' });
      if (questionContentHash(question) !== record.expectedQuestionContentHash) issues.push({ questionId: record.questionId, code: 'runtime-content-hash', message: 'Question wording, options, context or figure identity changed' });
      if (answerHash(question) !== record.expectedAnswerHash) issues.push({ questionId: record.questionId, code: 'runtime-answer-hash', message: 'Answer evidence changed' });
      if (stableHash(sourceIdentity(question)) !== record.expectedSourceIdentityHash) issues.push({ questionId: record.questionId, code: 'runtime-source-identity-hash', message: 'Source identity changed' });
      const expected = record.application.status === 'applied' ? resolvedDecision(record) : null;
      const runtimePaths = getQuestionPaths(question);
      const currentPrimary = placementId(runtimePaths[0]);
      const runtimeAdditional = runtimePaths.slice(1).map(placementId);
      const currentAdditional = (expected ? semanticAdditionalIds(currentPrimary, runtimeAdditional, catalog) : runtimeAdditional).sort();
      const primary = expected?.primaryId || record.before.primaryId;
      const additional = [...(expected?.additionalIds || record.before.additionalIds)].sort();
      if (currentPrimary !== primary || currentAdditional.join('|') !== additional.join('|')) issues.push({ questionId: record.questionId, code: 'runtime-placement', message: 'Runtime placement differs from the expected audit state' });
      const expectedTags = expected ? [expected.tag] : record.before.tags;
      if (previousTags(question).join('|') !== expectedTags.join('|')) issues.push({ questionId: record.questionId, code: 'runtime-tags', message: 'Runtime Static/Event-based tag differs from the expected audit state' });
    }
  }
  const resolvedCount = manifest.records.filter(record => resolvedDecision(record)).length;
  const appliedCount = manifest.records.filter(record => record.application.status === 'applied' && record.application.generatedOutputVerified).length;
  const certificationComplete = resolvedCount === manifest.records.length && appliedCount === manifest.records.length && !issues.length;
  if (options.requireCertification && !certificationComplete) issues.push({ code: 'certification-incomplete', message: `Resolved ${resolvedCount}/${manifest.records.length}; applied and verified ${appliedCount}/${manifest.records.length}` });
  return { issues, resolvedCount, appliedCount, certificationComplete };
}

function blindQuestion(question: RuntimeQuestion, record: AuditRecord) {
  return {
    auditVersion: AUDIT_VERSION,
    batchId: record.batchId,
    wave: record.auditWave,
    questionId: question.id,
    sourceIdentity: sourceIdentity(question),
    expectedSourceTextHash: question.sourceTextHash,
    sourceText: question.sourceText || null,
    promptLines: question.promptLines,
    options: question.options,
    sharedContext: question.sharedContext || null,
    underlined: question.underlined || [],
    requiresFigure: Boolean(question.requiresFigure),
    figureKey: question.figureKey || null,
    figureAlt: question.figureAlt || null,
  };
}

export function buildBlindPackets(manifest: AuditManifest) {
  const byId = new Map((historicalPyqQuestions as RuntimeQuestion[]).map(question => [question.id, question]));
  return manifest.batches.map(batch => ({
    ...batch,
    taxonomyCatalogFile: 'taxonomy-catalog.json',
    questions: batch.questionIds.map(id => {
      const question = byId.get(id);
      const record = manifest.records.find(row => row.questionId === id);
      assert.ok(question && record, `Cannot build blind packet for ${id}`);
      return blindQuestion(question, record);
    }),
  }));
}

export function progressReport(manifest: AuditManifest) {
  const validation = validateManifest(manifest, { compareRuntime: false });
  const reviewedA = manifest.records.filter(record => record.reviewerA).length;
  const reviewedB = manifest.records.filter(record => record.reviewerB).length;
  const agreements = manifest.records.filter(record => record.reviewerA && record.reviewerB && decisionsEqual(record.reviewerA, record.reviewerB)).length;
  const disagreements = manifest.records.filter(record => record.reviewerA && record.reviewerB && !decisionsEqual(record.reviewerA, record.reviewerB)).length;
  const riskCounts: Record<string, number> = {};
  for (const record of manifest.records) for (const flag of record.riskFlags) riskCounts[flag] = (riskCounts[flag] || 0) + 1;
  return {
    auditVersion: manifest.auditVersion,
    taxonomyVersion: manifest.taxonomyVersion,
    status: validation.certificationComplete ? 'certified' : validation.resolvedCount === manifest.records.length ? 'review-complete-application-pending' : 'pending-independent-review',
    coverage: {
      activeQuestions: manifest.records.length,
      gsQuestions: manifest.records.filter(record => record.scope === 'gs').length,
      preparationQuestions: manifest.records.filter(record => record.scope === 'preparation').length,
      byExam: countBy(manifest.records, record => String(record.sourceIdentity.exam)),
      byWave: countBy(manifest.records, record => record.auditWave),
      byYearAndExam: countBy(manifest.records, record => `${record.sourceIdentity.exam} ${record.sourceIdentity.year}`),
    },
    review: {
      reviewerA: reviewedA,
      reviewerB: reviewedB,
      agreements,
      disagreements,
      adjudicated: manifest.records.filter(record => record.adjudication).length,
      resolved: validation.resolvedCount,
      appliedAndVerified: validation.appliedCount,
      unresolved: manifest.records.length - validation.resolvedCount,
    },
    riskCounts: Object.fromEntries(Object.entries(riskCounts).sort(([a], [b]) => a.localeCompare(b))),
    validationIssues: validation.issues,
    certificationComplete: validation.certificationComplete,
  };
}

export function progressMarkdown(report: ReturnType<typeof progressReport>) {
  const rows = Object.entries(report.coverage.byExam).map(([exam, count]) => `| ${exam} | ${count} |`).join('\n');
  const risks = Object.entries(report.riskCounts).map(([flag, count]) => `| \`${flag}\` | ${count} |`).join('\n');
  return `# MCQ classification re-audit progress\n\n` +
    `Audit: \`${report.auditVersion}\` · Taxonomy: \`${report.taxonomyVersion}\`\n\n` +
    `Status: **${report.status}**. This report does not certify pending records.\n\n` +
    `## Coverage\n\n| Exam | Active MCQs |\n|---|---:|\n${rows}\n\n` +
    `- Active: ${report.coverage.activeQuestions}\n- GS: ${report.coverage.gsQuestions}\n- Preparation: ${report.coverage.preparationQuestions}\n` +
    `- Reviewer A: ${report.review.reviewerA}\n- Reviewer B: ${report.review.reviewerB}\n- Resolved: ${report.review.resolved}\n` +
    `- Applied and verified: ${report.review.appliedAndVerified}\n- Unresolved: ${report.review.unresolved}\n\n` +
    `## Automated risk flags\n\n| Flag | Questions |\n|---|---:|\n${risks}\n\n` +
    `## Certification gate\n\nCertification requires two distinct reviewer identities for every question, adjudication of every disagreement, an applied classification revision, generated-output verification, unchanged source hashes, and zero validation issues.\n`;
}

function writeJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as AuditManifest;
}

export function writeAuditArtifacts(manifest: AuditManifest) {
  const validation = validateManifest(manifest);
  assert.deepEqual(validation.issues, [], `Audit manifest is invalid:\n${validation.issues.map(issue => `${issue.questionId || 'manifest'}: ${issue.message}`).join('\n')}`);
  const report = progressReport(manifest);
  manifest.status = report.status as AuditManifest['status'];
  writeJson(MANIFEST_PATH, manifest);
  writeJson(REPORT_JSON_PATH, report);
  fs.mkdirSync(path.dirname(REPORT_MARKDOWN_PATH), { recursive: true });
  fs.writeFileSync(REPORT_MARKDOWN_PATH, progressMarkdown(report));
}

export function writeBlindPacketArtifacts(manifest: AuditManifest) {
  const packets = buildBlindPackets(manifest);
  fs.mkdirSync(PACKET_DIRECTORY, { recursive: true });
  writeJson(path.join(PACKET_DIRECTORY, 'taxonomy-catalog.json'), {
    auditVersion: manifest.auditVersion,
    taxonomyVersion: manifest.taxonomyVersion,
    leaves: manifest.taxonomyCatalog,
  });
  fs.writeFileSync(
    path.join(PACKET_DIRECTORY, 'blind-review-packets.jsonl'),
    `${packets.map(packet => JSON.stringify(packet)).join('\n')}\n`,
  );
  return packets;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--init')) {
    assert.ok(!fs.existsSync(MANIFEST_PATH), `${MANIFEST_PATH} already exists; never overwrite reviewer evidence with a regenerated baseline`);
    writeAuditArtifacts(buildInitialManifest());
  }
  const manifest = fs.existsSync(MANIFEST_PATH) ? readManifest() : buildInitialManifest();
  if (args.has('--packets')) writeBlindPacketArtifacts(manifest);
  if (args.has('--report') && fs.existsSync(MANIFEST_PATH)) writeAuditArtifacts(manifest);
  const validation = validateManifest(manifest, { requireCertification: args.has('--certify') });
  if (args.has('--check') || args.has('--certify')) assert.deepEqual(validation.issues, [], validation.issues.map(issue => `${issue.questionId || 'manifest'}: ${issue.message}`).join('\n'));
  console.log(JSON.stringify({
    auditVersion: manifest.auditVersion,
    active: manifest.records.length,
    resolved: validation.resolvedCount,
    applied: validation.appliedCount,
    certificationComplete: validation.certificationComplete,
    issues: validation.issues.length,
  }));
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main();
