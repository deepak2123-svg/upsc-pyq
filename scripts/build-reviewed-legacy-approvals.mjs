import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const batchNumber = Number(process.argv[2]);
const review = JSON.parse(fs.readFileSync(`content/audits/legacy-batch-${batchNumber}-review.json`, 'utf8'));
const draft = JSON.parse(fs.readFileSync('tmp/legacy-verification/candidates.json', 'utf8')).records;
const batches = JSON.parse(fs.readFileSync('content/audits/legacy-review-batches.json', 'utf8')).batches;
assert.deepEqual(review.records.map(r => r.id).sort(), batches.find(b => b.batch === batchNumber).records.map(r => r.id).sort());
const bank = JSON.parse(fs.readFileSync('content/question-bank.json', 'utf8')).questions;
const file = 'content/audits/approved-question-reconstructions.json';
const approvals = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const item of review.records) {
  const d = draft.find(d => d.id === item.id);
  const candidate = d.candidate ?? d.original;
  const canonical = item.canonicalId ? bank.find(q => q.id === item.canonicalId) : null;
  const text = item.text ?? canonical?.sourceText ?? candidate.question_text;
  const options = item.options ?? canonical?.options ?? candidate.options;
  assert.deepEqual(Object.keys(options).sort(), ['A', 'B', 'C', 'D']);
  assert.ok(options[item.answer] || (item.status === 'withdrawn' && item.answer === 'X'));
  const paper = d.source.exam === 'CAPF' ? 'I' : d.source.exam === 'CSE' ? 'GS-I' : d.source.exam === 'CDS' ? d.source.paper.split('-').at(-1) : d.source.year === 2020 ? 'I/II' : d.source.paper.endsWith('-2') ? 'II' : 'I';
  const approval = { id: item.id, expectedHash: d.expectedHash, exam: d.source.exam, year: d.source.year, paper, questionNumber: d.source.questionNumber, series: 'A', page: d.source.page, sourcePdf: d.original.source_pdf, sourcePdfSha256: d.source.pdfSha256, replacement: { sourceText: text, options }, answer: item.answer, ...(item.canonicalId ? { canonicalId: item.canonicalId } : {}), reason: item.note ?? `Original ${d.source.exam} ${d.source.paper} Q${d.source.questionNumber}, page ${d.source.page}, visually checked against its complete stem and options; the matching Series A final key accepts ${item.answer}.` };
  if (item.series) approval.series = item.series;
  if (!fs.existsSync(approval.sourcePdf) && d.source.exam === 'NDA') approval.sourcePdf = approval.sourcePdf.replace('NDA PYP\\', 'NDA PYP\\GAT\\');
  if (item.questionNumber) approval.questionNumber = item.questionNumber;
  if (item.page) approval.page = item.page;
  if (item.status) approval.status = item.status;
  if (item.classification) approval.classification = item.classification;
  if (item.primaryEvidence) approval.primaryEvidence = item.primaryEvidence;
  const key = item.key ?? review.records.find(r => r.key && draft.find(x => x.id === r.id)?.source.paper === d.source.paper && draft.find(x => x.id === r.id)?.source.exam === d.source.exam)?.key;
  if (key) approval.key = { ...key, sha256: crypto.createHash('sha256').update(fs.readFileSync(key.localPdf)).digest('hex') };
  const existing = approvals.corrections.find(r => r.id === item.id);
  if (existing) {
    const state = JSON.parse(fs.readFileSync('content/question-review-state.json', 'utf8')).records[item.id];
    if (state.status === 'pending') Object.assign(existing, approval);
    else assert.deepEqual(existing, approval);
  }
  else approvals.corrections.push(approval);
}
fs.writeFileSync(file, `${JSON.stringify(approvals, null, 2)}\n`);
