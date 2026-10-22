import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = name => JSON.parse(fs.readFileSync(new URL(`../content/${name}`, import.meta.url), 'utf8'));
const bank = read('question-bank.json');
const audit = read('audits/answer-key-audit.json');
const baseline = new Map(read('audits/answer-key-baseline.json').questions.map(row => [row.id, row]));
const revisions = read('answer-key-revisions.json');
const questions = new Map(bank.questions.map(row => [row.id, row]));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

test('the frozen pending register accounts for precisely 160 legacy, 39 key checks and 5 exceptions', () => {
  const register = read('question-review-state.json');
  assert.equal(register.originalIds.length, 204);
  assert.equal(new Set(register.originalIds).size, 204);
  assert.deepEqual(Object.keys(register.records).sort(), [...register.originalIds].sort());
  const rows = Object.values(register.records);
  assert.equal(rows.filter(row => row.category === 'legacy-reconstruction').length, 160);
  assert.equal(rows.filter(row => row.category === 'pending-key').length, 39);
  assert.equal(rows.filter(row => row.category === 'identified-exception').length, 5);
  assert.equal(rows.filter(row => row.status === 'withdrawn').length, 3);
  const policy = read('question-review-policy.json');
  for(const [id,row] of Object.entries(register.records)) {
    assert.equal(policy[id].status,row.status,id);
    assert.equal(policy[id].revision,row.revision,id);
    assert.equal(policy[id].contentRevision,row.contentRevision,id);
    assert.ok(!Object.keys(policy[id]).some(k=>/answer|evidence|reason/.test(k)),id);
  }
  assert.deepEqual(Object.fromEntries(['official-final','official-provisional','reasoned-verified','duplicate','withdrawn','quarantined','pending'].map(s=>[s,rows.filter(r=>r.status===s).length])), {'official-final':161,'official-provisional':2,'reasoned-verified':18,duplicate:14,withdrawn:3,quarantined:6,pending:0});
});

test('answer audit accounts for the entire bank and permits only approved source restorations', () => {
  assert.equal(audit.total, baseline.size);
  assert.equal(audit.rows.length, bank.questions.length);
  assert.equal(new Set(audit.rows.map(row => row.id)).size, bank.questions.length);
  for (const row of audit.rows) {
    const question = questions.get(row.id);
    assert.ok(question, row.id);
    assert.equal(row.currentAnswer, question.answer, row.id);
    assert.equal(row.answerAtAudit, baseline.get(row.id).answer, row.id);
    const hash = digest(JSON.stringify({ sourceText: question.sourceText, options: question.options }));
    assert.equal(row.contentHash, hash, row.id);
    if (baseline.get(row.id).hash !== hash) {
      const state = read('question-review-state.json').records[row.id];
      assert.notEqual(state.status, 'pending', row.id);
      let prior = baseline.get(row.id).hash;
      for (const change of state.changes) {
        assert.equal(change.beforeHash, prior, row.id);
        assert.equal(digest(JSON.stringify({sourceText:change.before.sourceText,options:change.before.options})), prior, row.id);
        prior = change.afterHash;
      }
      assert.equal(prior, hash, row.id);
    }
  }
});

test('every applied answer correction has evidence, an explanation and a cache revision', () => {
  const changed = audit.rows.filter(row => row.currentAnswer !== row.answerAtAudit);
  assert.equal(changed.length, audit.corrected);
  for (const row of changed) {
    const question = questions.get(row.id);
    assert.ok(row.review, row.id);
    assert.equal(row.review.answer, question.answer, row.id);
    assert.match(row.review.sha256, /^[a-f0-9]{64}$/);
    assert.match(row.review.source, /^https?:\/\//);
    assert.ok(question.explanation.length > 20, row.id);
    assert.ok(revisions[row.id] >= 1, row.id);
    assert.equal(question.source.answerAudit.evidenceSha256, row.review.sha256, row.id);
    if (row.review.evidenceTier.includes('provisional') && row.disposition !== 'duplicate') assert.match(question.source.answerStatus, /official-provisional-key/ , row.id);
  }
});

test('complete cohort dispositions do not misrepresent held records or whole-bank reproduction', () => {
  assert.equal(audit.reviewed, audit.rows.filter(row => row.review).length);
  assert.equal(audit.phase, 'pending-cohort-dispositioned');
  const register = read('question-review-state.json');
  for (const [id,r] of Object.entries(register.records)) {
    assert.notEqual(r.status,'pending',id);
    if (['official-final','official-provisional','reasoned-verified'].includes(r.status)) {
      assert.equal(r.identity.status,'verified',id);
      assert.equal(r.reproduction.status,'verified',id);
      assert.equal(r.answer.status,'verified',id);
      assert.equal(r.secondPass.status,'verified',id);
    }
    for(const e of r.evidence) if(e.localPdf) assert.equal(digest(fs.readFileSync(e.localPdf)),e.sha256,id);
    if(r.status==='quarantined') { assert.equal(r.answer.value,null,id); assert.ok(r.reason.length>40,id); }
    if(r.status==='duplicate') assert.ok(questions.has(r.canonicalId),id);
  }
  for (const id of ['cse-2024-gs-i-20', 'capf-2018-i-41']) {
    const row = audit.rows.find(row => row.id === id);
    assert.ok(row?.reproductionDefect, id);
    assert.equal(row.review, undefined, id);
  }
  for (const id of ['nda-2015-ii-77', 'cse-2013-gs-i-87', 'cds-2015-2-112']) {
    const row = audit.rows.find(row => row.id === id);
    assert.equal(row.reconstruction.status, 'resolved', id);
    assert.ok(row.review, id);
    assert.equal(row.reproductionDefect, undefined, id);
  }
});
