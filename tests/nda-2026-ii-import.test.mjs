import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {officialNda2026IIKey as key,officialNda2026IIEvidence as evidence} from '../scripts/nda-2026-ii-official-key.mjs';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionInGsScope} from '../lib/question-review.ts';
const read=f=>JSON.parse(fs.readFileSync(f));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const paper=read('content/nda-2026-ii-official-paper.json');
async function send(path,body){const {default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
test('complete NDA II GAT preserves 100 imports and adds exactly 50 English occurrences',()=>{
 assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
 assert.equal(paper.questions.length,150);assert.equal(Object.keys(paper.baselines).length,100);
 const originals=read('content/reviewed-prelims-imports.json').questions;
 for(const q of paper.questions){
  assert.equal(combinedQuestions.filter(row=>row.id===q.id).length,1);
  assert.equal(q.answer,key[q.questionNumber]);assert.equal(q.source.officialAnswer,q.answer);assert.equal(q.source.optionsReordered,false);
  assert.equal(q.sourceTextHash,hash(q.sourceText));assert.equal(questionReview(q.id).status,'official-provisional');assert.ok(questionEligible(q.id));
  assert.ok(q.source.secondPass&&q.source.classificationRationale);
  const baseline=paper.baselines[q.id];if(baseline){const old=originals.find(row=>row.id===q.id);assert.equal(hash(JSON.stringify(old)),baseline.sha256);assert.equal(q.sourceText,old.sourceText);assert.deepEqual(q.options,old.options);assert.equal(q.answer,old.answer);assert.equal(questionReview(q.id).contentRevision,baseline.contentRevision);}
 }
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
 const audit=read('content/audits/nda-2026-ii-review.json');assert.equal(audit.questionSlots.length,150);assert.equal(audit.reconciliation.awaitingReviewCount,0);assert.equal(audit.reconciliation.dispositionCounts['official-provisional'],150);
 const coverage=read('content/taxonomy/prelims-source-coverage.json').papers.find(p=>p.relativePath==='NDA PYP/GAT/2026-2.pdf');
 assert.equal(coverage.pendingSlots,0);assert.equal(coverage.verifiedImports,50);assert.equal(coverage.verifiedReuses,100);assert.equal(coverage.outOfScope,0);
});
test('all 150 available to NDA without CSE English or defence World History leakage',async()=>{
 const nda=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const membership=inv=>new Set(inv.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
 const ndaIds=membership(nda),cseIds=membership(cse);
 for(const q of paper.questions){assert.ok(ndaIds.has(q.id),q.id);if(q.preparationScope!=='gs'||q.subject==='Science & Technology')assert.ok(!cseIds.has(q.id),q.id);}
 assert.equal(nda.subjects.find(s=>s.id==='subject:english').examCounts.NDA,796);
 for(const q of paper.questions.filter(q=>q.preparationScope!=='gs'))assert.ok(!questionInGsScope(q.id));
 assert.deepEqual(paper.questions[28].underlined,['in spite']);
 assert.match(paper.questions[28].explanation,/Editorial caveat/);assert.match(paper.questions[42].explanation,/Editorial caveat/);
});
test('all 150 accepted answers and all 450 wrong choices score against the authentic key',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(let pass=0;pass<4;pass++){
  const answers=Object.fromEntries(paper.questions.map(q=>[q.id,pass===0?q.answer:Object.keys(q.options).filter(letter=>letter!==q.answer)[pass-1]]));
  const response=await send('/api/practice/grade',{questionIds:ids,answers,contentRevisions});assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.correct,pass===0?150:0);assert.equal(result.incorrect,pass===0?0:150);assert.equal(result.excluded,0);assert.equal(result.scored,150);
  for(const q of paper.questions){assert.equal(result.feedback[q.id].correctAnswer,key[q.questionNumber]);assert.equal(result.feedback[q.id].correct,pass===0);}
 }
});
