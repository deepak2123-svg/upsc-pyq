import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {nda2026IIKey} from '../scripts/prelims-reviewed-nda-2026-ii-imports.mjs';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible} from '../lib/question-review.ts';
const read=f=>JSON.parse(fs.readFileSync(f));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');

test('NDA II 2026 has exactly 100 unique original GS occurrences with provisional keys',()=>{
 const q=read('content/reviewed-prelims-imports.json').questions.filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='II');
 assert.deepEqual(q.map(q=>q.questionNumber),Array.from({length:100},(_,i)=>i+51));
 const policy=read('content/prelims-import-review-policy.json');
 const ledger=read('content/taxonomy/prelims-reviewed-placements.json');
 for(const row of q){
  assert.equal(row.id,`nda-2026-ii-${row.questionNumber}`);
  assert.equal(row.answer,nda2026IIKey[row.questionNumber]);
  assert.equal(row.source.officialAnswer,row.source.displayedAnswer);
  assert.equal(row.source.optionsReordered,false);
  assert.equal(row.sourceTextHash,hash(row.sourceText));
  assert.equal(row.sourceText,row.promptLines.join(' '));
  assert.equal(policy[row.id].status,'official-provisional');
  assert.equal(questionEligible(row.id),true);
  assert.equal(row.source.bookletSeries,'A');
  assert.ok(row.source.secondPass&&row.source.classificationRationale);
  assert.equal(ledger.records.find(r=>r.questionId===row.id).status,'approved');
  assert.equal(combinedQuestions.filter(r=>r.id===row.id).length,1);
 }
 assert.ok(q.find(q=>q.questionNumber===56).explanation.includes('inverse-cube'));
 assert.ok(q.find(q=>q.questionNumber===107).explanation.includes('sin(latitude)'));
 assert.equal(combinedQuestions.filter(q=>q.id.startsWith('nda-2026-ii-')&&q.questionNumber<=50).length,0);
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
});

test('all 150 NDA II source slots have a defensible GS import or English exclusion',()=>{
 const coverage=read('content/taxonomy/prelims-source-coverage.json');
 const rows=coverage.questionSlots.filter(r=>r.slotId.startsWith('NDA/2026-2/'));
 assert.equal(rows.length,150);
 assert.equal(rows.filter(r=>r.disposition==='out-of-scope').length,50);
 assert.equal(rows.filter(r=>r.disposition==='verified-local-import').length,100);
 assert.ok(rows.every(r=>r.disposition!=='pending-current-source-review'));
 const paper=coverage.papers.find(p=>p.relativePath==='NDA PYP/GAT/2026-2.pdf');
 assert.equal(paper.pendingSlots,0);assert.equal(paper.verifiedImports,100);assert.equal(paper.outOfScope,50);
 const temple=read('content/taxonomy/prelims-reviewed-placements.json').records.find(r=>r.questionId==='nda-2026-ii-130');
 assert.equal(temple.additionalIds.length,1);
});
