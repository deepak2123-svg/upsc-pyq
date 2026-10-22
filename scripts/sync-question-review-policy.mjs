import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const register = JSON.parse(fs.readFileSync('content/question-review-state.json', 'utf8'));
const valid = new Set(['pending', 'official-final', 'official-provisional', 'reasoned-verified', 'withdrawn', 'duplicate', 'quarantined']);
const bank = new Map(JSON.parse(fs.readFileSync('content/question-bank.json')).questions.map(q => [q.id, q]));
assert.equal(register.originalIds.length, 204);
assert.deepEqual(Object.keys(register.records).sort(), [...register.originalIds].sort());
for (const [id, row] of Object.entries(register.records)) {
  assert.ok(valid.has(row.status), id);
  assert.ok(Number.isInteger(row.revision) && row.revision > 0, id);
  assert.ok(Number.isInteger(row.contentRevision) && row.contentRevision >= 0, id);
  if (['official-final', 'official-provisional', 'reasoned-verified'].includes(row.status)) {
    assert.equal(row.identity.status, 'verified', id);
    assert.equal(row.reproduction.status, 'verified', id);
    assert.equal(row.answer.status, 'verified', id);
    assert.ok(row.evidence.length > 0 && row.secondPass?.status === 'verified', id);
  }
  if (row.status === 'withdrawn') assert.ok(row.evidence.some(item => item.keyValue === 'X' && /^[a-f0-9]{64}$/.test(item.sha256)), id);
  if (row.status === 'duplicate') {
    const canonical = bank.get(row.canonicalId);
    assert.ok(canonical && row.canonicalId !== id, id);
    assert.ok(!['pending','withdrawn','duplicate','quarantined'].includes(register.records[row.canonicalId]?.status), id);
    assert.equal(canonical.exam, row.identity.exam, id);
    assert.equal(canonical.year, row.identity.year, id);
    assert.equal(canonical.paper, row.identity.paper, id);
    assert.equal(bank.get(id).sourceText,canonical.sourceText,id);
    assert.deepEqual(bank.get(id).options,canonical.options,id);
    assert.equal(bank.get(id).answer,canonical.answer,id);
    // Booklet question numbers may differ; content matching is recorded in the rationale.
  }
  if (row.status === 'reasoned-verified') {
    assert.ok(row.evidence.some(e => e.kind === 'primary-source-reasoning' && /^https:\/\//.test(e.url) && e.locator), id);
    assert.equal(row.answer.originalKeyAnswer, undefined, id);
  }
  for (const evidence of row.evidence) if (evidence.localPdf) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(evidence.localPdf)).digest('hex'), evidence.sha256, id);
}
// This client-safe policy intentionally excludes source text, keys and reasoning.
const policy = Object.fromEntries(Object.entries(register.records).map(([id, row]) => {
  const before=row.changes[0]?.before;
  const identity=row.identity;
  const changed=before&&['exam','year','paper','questionNumber'].some(k=>before[k]!==identity[k]);
  return [id,{status:row.status,revision:row.revision,contentRevision:row.contentRevision,...(changed?{sourceCorrection:{exam:identity.exam,year:identity.year,paper:identity.paper,questionNumber:identity.questionNumber}}:{})}];
}));
fs.writeFileSync('content/question-review-policy.json', `${JSON.stringify(policy, null, 2)}\n`);
