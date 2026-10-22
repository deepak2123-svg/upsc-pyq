import fs from 'node:fs';
const register = JSON.parse(fs.readFileSync('content/question-review-state.json', 'utf8'));
const bank = JSON.parse(fs.readFileSync('content/question-bank.json', 'utf8')).questions;
const raw = JSON.parse(fs.readFileSync('../data/polity/polity_legacy_160_baseline.json', 'utf8')).questions;
const candidates = JSON.parse(fs.readFileSync('../outputs/polity/Polity_MCQ_Bank_database.json', 'utf8')).questions;
const batches = JSON.parse(fs.readFileSync('content/audits/legacy-review-batches.json', 'utf8')).batches;
const records = batches.flatMap(batch => batch.records.map(item => {
  const original = raw.find(q => q.exam === item.source.exam && q.year === item.source.year && q.session_paper === item.source.paper && q.printed_question_number === item.source.questionNumber);
  const matches = candidates.filter(q => [q.source, ...(q.source_refs ?? [])].some(s => s.exam === item.source.exam && s.year === item.source.year && s.paper_id === item.source.paper && s.question_number === item.source.questionNumber));
  const exact = matches.filter(q => q.source.exam === item.source.exam && q.source.paper_id === item.source.paper && q.source.question_number === item.source.questionNumber);
  return { id: item.id, batch: batch.batch, expectedHash: item.expectedHash, source: item.source, original, published: bank.find(q => q.id === item.id), candidate: exact.length === 1 ? exact[0] : matches.length === 1 ? matches[0] : null, candidateCount: matches.length, primaryMatch: exact.length === 1, reviewStatus: register.records[item.id].status };
}));
fs.mkdirSync('tmp/legacy-verification', { recursive: true });
fs.writeFileSync('tmp/legacy-verification/candidates.json', JSON.stringify({ records }, null, 2));
console.log({ total: records.length, primary: records.filter(r => r.primaryMatch).length, referenceOnly: records.filter(r => r.candidate && !r.primaryMatch).length, missing: records.filter(r => !r.candidate).map(r => r.id) });
for (const r of records.slice(0, 20)) console.log(JSON.stringify({ id: r.id, source: r.source, text: r.candidate?.question_text, options: r.candidate?.options, answer: r.candidate?.answer, provenance: r.candidate?.original_pdf_provenance, key: r.candidate?.answer_evidence }));
