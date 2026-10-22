import fs from 'node:fs';
import assert from 'node:assert/strict';

const target = 'content/question-review-state.json';
if (fs.existsSync(target)) throw new Error('The frozen review register already exists; do not regenerate it from a changing audit.');
const audit = JSON.parse(fs.readFileSync('content/audits/answer-key-audit.json', 'utf8'));
const pending = audit.rows.filter(row => !row.review);
assert.equal(pending.length, 204);
assert.equal(pending.filter(row => row.sourceReconstructionRequired).length, 160);
assert.equal(pending.filter(row => row.reproductionDefect).length, 5);
assert.equal(pending.filter(row => !row.sourceReconstructionRequired && !row.reproductionDefect).length, 39);
const withdrawn = new Set(['cse-2024-gs-i-20', 'capf-2018-i-41']);
const records = Object.fromEntries(pending.map(row => [row.id, {
  status: withdrawn.has(row.id) ? 'withdrawn' : 'pending',
  revision: 1,
  contentRevision: 0,
  category: row.sourceReconstructionRequired ? 'legacy-reconstruction' : row.reproductionDefect ? 'identified-exception' : 'pending-key',
  reason: row.reproductionDefect ?? (row.sourceReconstructionRequired ? 'Source identity, complete wording and options require reconstruction.' : 'The matching answer key and displayed options require verification.'),
  ...(row.originalSourceIdentity ? { originalSourceIdentity: row.originalSourceIdentity } : {}),
  identity: { status: 'pending' }, reproduction: { status: 'pending' }, answer: { status: withdrawn.has(row.id) ? 'withdrawn' : 'pending' },
  evidence: [], changes: [],
}]));
fs.writeFileSync(target, `${JSON.stringify({ version: 1, frozenAt: '2026-10-19', originalIds: pending.map(row => row.id), records }, null, 2)}\n`);
