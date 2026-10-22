import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const bankFile = 'content/question-bank.json';
const registerFile = 'content/question-review-state.json';
const bank = JSON.parse(fs.readFileSync(bankFile, 'utf8'));
const register = JSON.parse(fs.readFileSync(registerFile, 'utf8'));
const revisionsFile = 'content/answer-key-revisions.json';
const revisions = JSON.parse(fs.readFileSync(revisionsFile, 'utf8'));
const approvals = JSON.parse(fs.readFileSync('content/audits/approved-question-reconstructions.json', 'utf8')).corrections;
const papers = JSON.parse(fs.readFileSync('content/audits/reviewed-answer-keys.json', 'utf8')).papers;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const hash = q => sha(JSON.stringify({ sourceText: q.sourceText, options: q.options }));
let changed = 0;
for (const approval of approvals) {
  const q = bank.questions.find(q => q.id === approval.id);
  const row = register.records[approval.id];
  assert.ok(q && row, approval.id);
  const sourceHash = sha(fs.readFileSync(approval.sourcePdf));
  if (approval.sourcePdfSha256) assert.equal(sourceHash, approval.sourcePdfSha256, approval.id);
  const reasoned = ['reasoned-verified', 'quarantined'].includes(approval.status);
  if (reasoned) assert.ok(approval.primaryEvidence?.length && approval.reason, approval.id);
  const key = reasoned ? { source: approval.primaryEvidence.map(e => e.url).join(' '), sha256: sha(JSON.stringify(approval.primaryEvidence)), series: approval.series, page: null } : approval.key ?? papers.find(p => p.exam === approval.exam && p.year === approval.year && p.paper === approval.paper);
  assert.ok(key, `Missing reviewed key evidence: ${approval.id}`);
  if (!reasoned) assert.equal(sha(fs.readFileSync(key.localPdf)), key.sha256, approval.id);
  const prior = row.changes.find(change => change.approvalHash === sha(JSON.stringify(approval)));
  if (prior) {
    assert.equal(hash(q), row.changes.at(-1).afterHash, approval.id);
    assert.equal(q.exam, approval.exam, approval.id);
    assert.equal(q.year, approval.year, approval.id);
    assert.equal(q.questionNumber, approval.questionNumber, approval.id);
    assert.equal(q.paper, approval.paper, approval.id);
    if (approval.answer !== 'X') assert.equal(q.answer, approval.answer, approval.id);
    assert.equal(row.evidence[0].sha256, sourceHash, approval.id);
    continue;
  }
  assert.equal(hash(q), approval.expectedHash, approval.id);
  const before = structuredClone(q);
  if (approval.replacement) {
    q.sourceText = approval.replacement.sourceText;
    q.promptLines = q.sourceText.split('\n');
    q.options = approval.replacement.options;
    q.sourceTextHash = sha(q.sourceText);
  }
  if (approval.replaceText) {
    assert.ok(q.sourceText.includes(approval.replaceText[0]));
    q.sourceText = q.sourceText.replace(approval.replaceText[0], approval.replaceText[1]);
    q.promptLines = q.promptLines.map(line => line.replace(approval.replaceText[0], approval.replaceText[1]));
    q.sourceTextHash = sha(q.sourceText);
  }
  if (approval.optionChanges) q.options = { ...q.options, ...approval.optionChanges };
  q.exam = approval.exam; q.year = approval.year; q.paper = approval.paper;
  q.questionNumber = approval.questionNumber;
  q.source.paper = approval.paper;
  q.source.questionNumber = approval.questionNumber;
  if (approval.classification) Object.assign(q, approval.classification);
  if (approval.answer !== 'X') q.answer = approval.answer;
  q.explanation = approval.reason;
  if (before.answer !== q.answer) {
    revisions[q.id] = (revisions[q.id] ?? 0) + 1;
    q.source.answerCorrection = { previousAnswer: before.answer, correctedAt: '2026-10-19', reason: approval.reason };
    q.source.answerAudit = { date: '2026-10-19', evidenceSha256: key.sha256, series: key.series, page: key.page, ...(reasoned ? { method: 'primary-source-reasoning', reasonedAnswer: approval.answer } : { originalKeyAnswer: approval.answer }) };
  }
  q.source.answerStatus = reasoned ? 'reasoned-verified-primary-sources' : approval.status === 'official-provisional' ? 'official-provisional-key-and-reproduction-reviewed' : 'official-final-key-and-reproduction-reviewed';
  q.source.answerSource = key.source;
  const material = hash(q) !== hash(before);
  row.contentRevision += material ? 1 : 0;
  row.revision += 1;
  row.status = approval.canonicalId ? 'duplicate' : (approval.status ?? 'official-final'); row.reason = approval.reason;
  if (approval.canonicalId) row.canonicalId = approval.canonicalId;
  row.identity = { status: 'verified', exam: approval.exam, year: approval.year, paper: approval.paper, series: approval.series, questionNumber: approval.questionNumber, page: approval.page };
  row.reproduction = { status: 'verified', method: 'Original page visually compared with the full stem and all four displayed options.' };
  row.answer = { status: 'verified', value: approval.answer, originalKeyAnswer: approval.answer, reviewedAt: '2026-10-19' };
  if (reasoned) delete row.answer.originalKeyAnswer;
  if (approval.status === 'quarantined') {
    row.answer = { status: 'ambiguous', value: null, reviewedAt: '2026-10-19' };
    q.source.answerStatus = 'quarantined-after-primary-source-review';
  }
  row.secondPass = { status: 'verified', method: reasoned ? 'Second-pass option-by-option reasoning against the cited primary sources after a separate original-page reproduction comparison; no official answer-key claim.' : `Separate visual comparison of the corrected option or wording and the original source page, followed by the matching Series ${approval.series} key cell.` };
  row.evidence = [
    { kind: 'original-question-paper', localPdf: approval.sourcePdf, sha256: sourceHash, page: approval.page, series: approval.series, ...(approval.sourceUrl ? { url: approval.sourceUrl } : {}) },
    ...(reasoned ? approval.primaryEvidence.map(e => ({kind: 'primary-source-reasoning', ...e})) : [{ kind: approval.status === 'official-provisional' ? 'official-provisional-key-mirror' : 'official-final-key-mirror', localPdf: key.localPdf, url: key.source, sha256: key.sha256, page: key.page, series: key.series, keyValue: approval.answer }]),
  ];
  row.changes.push({ approvalHash: sha(JSON.stringify(approval)), beforeHash: hash(before), afterHash: hash(q), before, reason: approval.reason });
  changed += 1;
}
bank.sourceCounts = Object.fromEntries([...new Set(bank.questions.map(q => q.exam))].sort().map(exam => [exam, bank.questions.filter(q => q.exam === exam).length]));
fs.writeFileSync(bankFile, `${JSON.stringify(bank, null, 2)}\n`);
fs.writeFileSync(registerFile, `${JSON.stringify(register, null, 2)}\n`);
fs.writeFileSync(revisionsFile, `${JSON.stringify(revisions, null, 2)}\n`);
console.log({ changed });
