import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Comparison is a triage step, never an authorization to replace an answer.
const bank = JSON.parse(fs.readFileSync('content/question-bank.json', 'utf8'));
const baselineFile = 'content/audits/answer-key-baseline.json';
fs.mkdirSync('content/audits', { recursive: true });
if (!fs.existsSync(baselineFile)) {
  const frozen = JSON.parse(execFileSync('git', ['show', 'df4d7fd:content/question-bank.json'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
  fs.writeFileSync(baselineFile, `${JSON.stringify({ commit: 'df4d7fd', questions: frozen.questions.map(q => ({ id: q.id, answer: q.answer, hash: crypto.createHash('sha256').update(JSON.stringify({ sourceText: q.sourceText, options: q.options })).digest('hex') })) }, null, 2)}\n`);
}
const baseline = new Map(JSON.parse(fs.readFileSync(baselineFile, 'utf8')).questions.map(q => [q.id, q]));
const reviewState = JSON.parse(fs.readFileSync('content/question-review-state.json', 'utf8')).records;
const reviewed = new Map(JSON.parse(fs.readFileSync('content/audits/reviewed-answer-keys.json', 'utf8')).papers.flatMap(p => Object.entries(p.answers).map(([number, value]) => [`${p.exam}|${p.year}|${p.paper}|${number}`, { answer: value[0], reason: value[1], source: p.source, evidenceTier: p.evidenceTier, sha256: p.sha256, series: p.series, page: p.page }])));
const defects = new Map(JSON.parse(fs.readFileSync('content/audits/reviewed-answer-key-cells.json', 'utf8')).papers.flatMap(p => Object.entries(p.excluded ?? {}).map(([number, reason]) => [`${p.exam}|${p.year}|${p.paper}|${number}`, reason])));
// The legacy importer forced every record to CDS. Retain its original identity
// as audit evidence, never treat its old "included" label as key verification.
const legacyRecords = JSON.parse(fs.readFileSync('../data/polity/polity_legacy_160_baseline.json', 'utf8')).questions;
const legacySources = new Map(legacyRecords.map(row => [`cds-${row.year}-${String(row.paper || row.paper_no || row.paper_id).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.printed_question_number}`, row]));
const files = ['full_reaudit_clean_questions.json', 'full_reaudit_clean_nda_questions.json', 'full_reaudit_clean_cds_matches.json'];
const references = files.flatMap(file => {
  const filename = path.resolve('..', '.tmp', file);
  if (!fs.existsSync(filename)) return [];
  return JSON.parse(fs.readFileSync(filename, 'utf8')).records.map(row => ({ ...row, auditFile: file }));
});
const norm = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const paper = value => ({ I: '1', II: '2' })[value] ?? String(value);
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = new Map();
for (const row of references) {
  const key = `${row.exam}|${row.year}|${paper(row.paper)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
const rows = bank.questions.map(question => {
  const candidates = groups.get(`${question.exam}|${question.year}|${paper(question.paper)}`) ?? [];
  const exact = candidates.filter(row => norm(row.question_text) === norm(question.sourceText) && 'ABCD'.split('').every(letter => norm(row.options?.[letter]) === norm(question.options[letter])));
  const answers = [...new Set(exact.map(row => row.answer).filter(answer => /^[ABCD]$/.test(answer)))];
  const status = answers.length > 1 ? 'conflicting-reference-answers' : answers.length === 1 ? (answers[0] === question.answer ? 'secondary-exact-match-agrees' : 'secondary-exact-match-conflicts') : 'no-exact-secondary-transcript';
  const reconstruction = reviewState[question.id];
  const restored = Boolean(reconstruction?.changes.length);
  const keyEvidence = reconstruction?.evidence.find(row => /official-(final|provisional)-key/.test(row.kind));
  const reasoning = reconstruction?.evidence.filter(row => row.kind === 'primary-source-reasoning');
  const review = reconstruction ? (reconstruction.answer.status === 'verified' && reconstruction.answer.value !== 'X' ? {
    answer: reconstruction.answer.value, reason: reconstruction.reason,
    source: keyEvidence?.url ?? reasoning.map(e => e.url).join(' '),
    evidenceTier: keyEvidence ? (keyEvidence.kind.includes('provisional') ? 'official-provisional-key-and-reproduction-reviewed' : 'official-final-key-and-reproduction-reviewed') : 'reasoned-verified-primary-sources',
    sha256: keyEvidence?.sha256 ?? crypto.createHash('sha256').update(JSON.stringify(reasoning.map(({kind, ...e}) => e))).digest('hex'),
    series: keyEvidence?.series ?? reconstruction.identity.series, page: keyEvidence?.page ?? null,
  } : undefined) : reviewed.get(`${question.exam}|${question.year}|${question.paper}|${question.questionNumber}`);
  const legacySource = question.source.dataset === 'CDS Polity verified baseline' ? legacySources.get(question.id) : undefined;
  if (question.source.dataset === 'CDS Polity verified baseline' && !legacySource) throw new Error(`Unmapped legacy source ${question.id}`);
  const contentHash = hash({ sourceText: question.sourceText, options: question.options });
  let approvedHash = baseline.get(question.id)?.hash;
  for (const change of reconstruction?.changes ?? []) {
    if (change.beforeHash !== approvedHash) throw new Error(`Broken reconstruction history: ${question.id}`);
    approvedHash = change.afterHash;
  }
  if (approvedHash !== contentHash) throw new Error(`Question wording or options changed without an approved reconstruction: ${question.id}`);
  if (review && review.answer !== question.answer) throw new Error(`Unapplied review: ${question.id}`);
  return {
    id: question.id, exam: question.exam, year: question.year, paper: question.paper,
    questionNumber: question.questionNumber, answerAtAudit: baseline.get(question.id).answer, currentAnswer: question.answer,
    contentHash,
    previousVerificationLabel: question.source.answerStatus, status,
    officialVerification: review ? review.evidenceTier : 'not-yet-independently-established', review,
    disposition: reconstruction?.status ?? 'previously-key-reviewed',
    reproductionDefect: reconstruction?.status === 'quarantined' ? reconstruction.reason : restored ? undefined : defects.get(`${question.exam}|${question.year}|${question.paper}|${question.questionNumber}`),
    ...(restored ? { reconstruction: { status: 'resolved', changes: reconstruction.changes.map(({ beforeHash, afterHash, reason }) => ({ beforeHash, afterHash, reason })) } } : {}),
    ...(legacySource ? {
      sourceReconstructionRequired: !restored,
      originalSourceIdentity: { exam: legacySource.exam, year: legacySource.year, paper: legacySource.session_paper, questionNumber: legacySource.printed_question_number, page: legacySource.source_page, pdfSha256: legacySource.pdf_sha256 },
      sourceIdentityMismatch: legacySource.exam !== question.exam,
    } : {}),
    references: exact.map(row => ({ answer: row.answer, url: row.clean_source_url, file: row.auditFile, questionNumber: row.canonical_question_number ?? row.structured_question_number })),
  };
});
if (new Set(rows.map(row => row.id)).size !== bank.questions.length) throw new Error('Duplicate question IDs');
const summary = Object.fromEntries([...new Set(rows.map(row => row.status))].map(status => [status, rows.filter(row => row.status === status).length]));
const reviewDispositions = Object.fromEntries(['pending', 'official-final', 'official-provisional', 'reasoned-verified', 'withdrawn', 'duplicate', 'quarantined'].map(status => [status, Object.values(reviewState).filter(row => row.status === status).length]));
const output = { generatedAt: new Date().toISOString(), phase: reviewDispositions.pending ? 'audit-in-progress-not-completed' : 'pending-cohort-dispositioned', total: rows.length, reviewed: rows.filter(row => row.review).length, corrected: rows.filter(row => row.currentAnswer !== row.answerAtAudit).length, frozen204Dispositions: reviewDispositions, summary, rows };
fs.mkdirSync('content/audits', { recursive: true });
fs.writeFileSync('content/audits/answer-key-audit.json', `${JSON.stringify(output, null, 2)}\n`);
const pending = rows.filter(row => ['pending','quarantined'].includes(reviewState[row.id]?.status));
const mismatch = rows.filter(row => row.sourceIdentityMismatch);
const report = [
  '# Answer audit — local reconciliation', '',
  `Updated: ${output.generatedAt.slice(0, 10)}. Local working copy; not a production-release confirmation.`, '',
  '| Measure | Records |', '|---|---:|',
  `| Original bank accounted for | ${rows.length} |`,
  `| Independently reviewed key cells | ${output.reviewed} |`,
  `| Applied answer corrections | ${output.corrected} |`,
  `| Pending additional evidence / quarantined | ${pending.length} |`,
  `| Original pending cohort | ${Object.keys(reviewState).length} |`,
  ...Object.entries(reviewDispositions).map(([status, count]) => `| Cohort: ${status} | ${count} |`),
  `| Legacy imports requiring source reconstruction | ${rows.filter(row => row.sourceReconstructionRequired).length} |`,
  `| Legacy records still assigned a different exam from their recovered source | ${mismatch.length} |`, '',
  'Key-cell review is not a claim that every question has passed a complete verbatim and diagram audit. Secondary-transcript agreement is triage only. Provisional official keys remain labelled provisional.', '',
  '## Unresolved records', '',
  'All 160 legacy records have recorded source reconstruction decisions in eight frozen batches of 20. Quarantined, withdrawn and duplicate records stay excluded from new scored tests. Historical material defects are excluded from grading without changing submitted answers. Nothing has been deployed. A defensible disposition does not mean every record is publishable.', '',
  '| Published ID | Required work |', '|---|---|',
  ...pending.map(row => `| ${row.id} | ${row.reproductionDefect ?? (row.sourceReconstructionRequired ? `Reconstruct source/text/options: ${row.originalSourceIdentity.exam} ${row.originalSourceIdentity.paper} Q${row.originalSourceIdentity.questionNumber}${row.sourceIdentityMismatch ? '; wrong published exam' : ''}` : 'Obtain matching official key and compare the displayed options; otherwise document a primary-source reasoned review.')} |`), '',
  '## Applied corrections', '', '| ID | Before | After | Basis |', '|---|---|---|---|',
  ...rows.filter(row => row.currentAnswer !== row.answerAtAudit).map(row => `| ${row.id} | ${row.answerAtAudit} | ${row.currentAnswer} | ${row.review.reason.replace(/\|/g, '/')} |`), '',
  '## Evidence and reproducibility', '',
  '- `content/audits/answer-key-baseline.json` freezes the original answers and stem/options hashes.',
  '- `content/audits/reviewed-answer-keys.json` records booklet series, key page, source URL and PDF SHA-256.',
  '- `content/audits/answer-key-audit.json` accounts for every original record, including unresolved records.',
  '- `content/answer-key-revisions.json` invalidates stale locally stored grading feedback for corrected keys.',
  '- The audit integrity tests reject unexplained content changes or corrections without evidence and a cache revision.', '',
].join('\n');
fs.writeFileSync('docs/answer-key-audit-progress.md', report);
console.log(JSON.stringify({ total: rows.length, summary }, null, 2));
for (const row of rows.filter(row => row.status === 'secondary-exact-match-conflicts' && !row.review)) console.log(row.id, row.currentAnswer, '=>', row.references[0].answer);
