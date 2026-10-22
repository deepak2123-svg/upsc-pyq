import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Discovery only. Filename candidates must never be treated as verified identity.
const rootArg = process.argv.indexOf('--source-root');
const sourceRoot = rootArg >= 0 ? process.argv[rootArg + 1] : 'C:/Users/iamdj/Desktop/KIS NDA/PYP';
if (!sourceRoot || !fs.existsSync(sourceRoot)) throw new Error('Missing source root; supply --source-root PATH');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const bankBytes = fs.readFileSync('content/question-bank.json');
const bank = JSON.parse(bankBytes).questions;
const reviews = JSON.parse(fs.readFileSync('content/question-review-state.json', 'utf8'));
const locations = [['CSE', 'CSE PYP'], ['CAPF', 'CAPF PYP'], ['CDS', 'CDS PYP'], ['NDA', 'NDA PYP/GAT']];
const sources = [];
for (const [examCandidate, relativeDirectory] of locations) {
  const directory = path.resolve(sourceRoot, relativeDirectory);
  if (!fs.existsSync(directory)) throw new Error(`Missing dedicated collection: ${directory}`);
  for (const name of fs.readdirSync(directory).filter(name => /\.pdf$/i.test(name)).sort()) {
    const file = path.join(directory, name);
    const bytes = fs.readFileSync(file);
    const sha256 = hash(bytes);
    sources.push({ discoveryId: `pdf:${sha256}`, relativePath: `${relativeDirectory}/${name}`, bytes: bytes.length, sha256, examCandidate, identityStatus: 'pending-document-review', verifiedIdentity: null, questionRange: null, keyStatus: 'not-assessed-in-this-register', coverageStatus: 'not-yet-accounted-question-by-question' });
  }
}
const copies = Object.fromEntries([...new Set(sources.map(s => s.sha256))].map(digest => [digest, sources.filter(s => s.sha256 === digest).map(s => s.relativePath)]).filter(([, paths]) => paths.length > 1));
const records = Object.fromEntries(bank.map(question => [question.id, {
  id: question.id,
  expectedRecordHash: hash(JSON.stringify(question)),
  sourceAtBaseline: { exam: question.exam, year: question.year, paper: question.paper, questionNumber: question.questionNumber },
  labelsAtBaseline: { subject: question.subject, topic: question.topic, subtopic: question.subtopic },
  answerReviewAtBaseline: reviews.records[question.id]?.status ?? 'outside-frozen-204-cohort',
  classificationStatus: 'pending', primaryId: null, additionalIds: [], tags: [],
  rationale: null, secondPass: 'pending',
}]));
const groups = new Map();
for (const question of bank) {
  const key = `${question.exam}/${question.year}/${question.paper}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(question);
}
const batches = [];
const order = ['CSE', 'CAPF', 'CDS', 'NDA'];
for (const [paper, questions] of [...groups].sort(([a], [b]) => order.indexOf(a.split('/')[0]) - order.indexOf(b.split('/')[0]) || a.localeCompare(b, 'en', { numeric: true }))) {
  questions.sort((a, b) => a.questionNumber - b.questionNumber || a.id.localeCompare(b.id));
  for (let start = 0; start < questions.length; start += 50) batches.push({ id: `existing:${paper}:${Math.floor(start / 50) + 1}`, paper, questionIds: questions.slice(start, start + 50).map(q => q.id), status: 'pending' });
}
const outputs = [
  ['content/taxonomy/prelims-source-discovery.json', { version: 1, status: 'discovery-not-source-verification', sourceRoot, sources, identicalFileCopies: copies }],
  ['content/taxonomy/prelims-classification-register.json', { version: 1, taxonomyVersion: 'upsc-prelims-v2-draft', baselineBankSha256: hash(bankBytes), baselineCount: bank.length, records, batches }],
];
for (const [file, data] of outputs) {
  const value = `${JSON.stringify(data, null, 2)}\n`;
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== value) throw new Error(`Refusing to replace existing register: ${file}. Use an explicitly reviewed migration.`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, value);
}
console.log(JSON.stringify({ discoveredPdfFiles: sources.length, uniquePdfHashes: new Set(sources.map(s => s.sha256)).size, byCollection: Object.fromEntries(order.map(exam => [exam, sources.filter(s => s.examCandidate === exam).length])), baselineRecords: bank.length, pendingClassificationBatches: batches.length }));
