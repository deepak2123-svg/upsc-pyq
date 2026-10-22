import fs from 'node:fs';
import crypto from 'node:crypto';
const file = 'content/question-review-state.json';
const register = JSON.parse(fs.readFileSync(file, 'utf8'));
const papers = JSON.parse(fs.readFileSync('content/audits/reviewed-answer-keys.json', 'utf8')).papers;
for (const [id, exam, year, paper, questionNumber] of [
  ['cse-2024-gs-i-20', 'CSE', 2024, 'GS-I', 20],
  ['capf-2018-i-41', 'CAPF', 2018, 'I', 41],
]) {
  const source = papers.find(row => row.exam === exam && row.year === year && row.paper === paper);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(source.localPdf)).digest('hex');
  if (sha256 !== source.sha256) throw new Error('Evidence changed');
  const row = register.records[id];
  row.identity = { status: 'verified', exam, year, paper, series: 'A', questionNumber };
  row.answer = { status: 'withdrawn', originalKeyValue: 'X', reviewedAt: '2026-10-19', method: 'Direct visual recheck of the Series A cell on page 1.' };
  row.evidence = [{ kind: 'official-final-key-mirror', url: source.source, localPdf: source.localPdf, sha256, page: 1, series: 'A', questionNumber, keyValue: 'X' }];
}
fs.writeFileSync(file, `${JSON.stringify(register, null, 2)}\n`);
