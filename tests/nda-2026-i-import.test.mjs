import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {nda2026IQuestions,nda2026ISecondPass,validateNda2026IEvidence} from '../scripts/prelims-reviewed-nda-2026-i-imports.mjs';
import {nda2026IBatch2SecondPass,nda2026IBatch2Figures} from '../scripts/prelims-reviewed-nda-2026-i-batch-2-imports.mjs';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview} from '../lib/question-review.ts';
import {formatPracticePrompt} from '../lib/practice-prompt.ts';
const read=file=>JSON.parse(fs.readFileSync(file));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const approved=[51,52,53,54,55,56,57,58,61,62,63,65,66,69,70,72,73,74,76,77,78,79,80,81,82,83,84,87,89,90,91,92,93,94,96,97,98,99,100];
const held=[59,60,64,67,68,71,75,85,86,88,95];
const secondPass={...nda2026ISecondPass,...nda2026IBatch2SecondPass};

test('NDA I opening batch clears only independently reasoned, second-pass reviewed occurrences',()=>{
 validateNda2026IEvidence();
 assert.deepEqual(nda2026IQuestions.map(q=>q.questionNumber),approved);
 const imports=read('content/reviewed-prelims-imports.json').questions.filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='I');
 assert.deepEqual(imports,nda2026IQuestions);
 const ledger=read('content/taxonomy/prelims-reviewed-placements.json');
 for(const q of imports){
  assert.equal(questionReview(q.id).status,'reasoned-verified');assert.equal(questionEligible(q.id),true);
  assert.equal(q.source.officialAnswer,null);assert.equal(q.source.optionsReordered,false);
  assert.equal(q.sourceTextHash,hash(q.promptLines.join(' ')));
  assert.match(q.explanation,/no matching official key recovered/);
  assert.equal(q.source.secondPass,secondPass[q.questionNumber]);
  assert.ok(q.source.primaryEvidence.length);
  assert.equal(combinedQuestions.filter(row=>row.id===q.id).length,1);
  assert.equal(ledger.records.find(row=>row.questionId===q.id).status,'approved');
 }
 for(const number of held)assert.ok(!combinedQuestions.some(q=>q.id===`nda-2026-i-${number}`));
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
});

test('NDA I source accounting does not turn English exclusions or old records into verified answers',()=>{
 const register=read('content/audits/nda-2026-i-review.json');
 assert.equal(register.records.length,150);assert.equal(new Set(register.records.map(r=>r.questionNumber)).size,150);
 assert.deepEqual(register.counts,{total:150,outOfScope:50,reasonedVerified:39,quarantined:11,pendingCurrentSourceReview:50,existingOccurrences:24});
 assert.equal(register.records.filter(r=>r.disposition==='reasoned-verified').length,39);
 assert.deepEqual(register.records.filter(r=>r.disposition==='quarantined').map(r=>r.questionNumber),held);
 assert.equal(register.records.filter(r=>r.existingId).length,24);
 assert.ok(register.records.filter(r=>r.existingId).every(r=>r.publicationDecisionThisPass==='not-newly-cleared'));
 const coverage=read('content/taxonomy/prelims-source-coverage.json');
 const paper=coverage.papers.find(p=>p.relativePath==='NDA PYP/GAT/2026-1.pdf');
 assert.equal(paper.coverageStatus,'current-source-review-in-progress');
 assert.equal(paper.reviewedSlots,89);assert.equal(paper.pendingSlots,61);
 assert.equal(paper.verifiedImports,39);assert.equal(paper.outOfScope,50);
 const rows=coverage.questionSlots.filter(r=>r.slotId.startsWith('NDA/2026-1/'));
 for(const number of approved){const slot=rows.find(r=>r.printedQuestionNumber===number);assert.match(slot.note,/No official key recovered/);assert.doesNotMatch(slot.note,/official-key page/);}
 for(const number of held)assert.equal(rows.find(r=>r.printedQuestionNumber===number).disposition,'pending-current-source-review');
});

test('independent physics calculations guard against the rejected secondary answer table',()=>{
 const n=10000,h=Math.PI/(2*n);let integral=0;
 for(let i=0;i<=n;i++){const y=1/Math.sqrt(1-.25*Math.sin(i*h)**2);integral+=y*(i===0||i===n?1:i%2?4:2);}
 const ratio=(2/Math.PI)*h*integral/3;
 assert.ok(Math.abs(ratio-1.073182007)<1e-8);
 assert.equal(nda2026IQuestions.find(q=>q.questionNumber===51).answer,'A');
 assert.ok(Math.abs(Math.acos(-.5)-2*Math.PI/3)<1e-12);
 assert.equal(nda2026IQuestions.find(q=>q.questionNumber===52).answer,'C');
 assert.equal(nda2026IQuestions.find(q=>q.questionNumber===53).answer,'D');
 const waterMass=.005*(2100*20+335000)/(4186*30);
 assert.ok(Math.abs(waterMass-.015)<.0001);
 assert.ok(Math.abs(8**(2/3)-4)<1e-12);
 assert.equal(60*9.8,588);
});

test('all thirty-nine reasoned imports grade correctly without leaking answers into snapshots',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const send=(path,body)=>worker.fetch(new Request('http://localhost'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 const response=await worker.fetch(new Request('http://localhost/api/pyqs/inventory'),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 const inventory=await response.json(),wanted=new Set(nda2026IQuestions.map(q=>q.id));
 const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
 const frozenScopes=leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>wanted.has(id))}}));
 const created=await send('/api/practice-snapshots',{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes,count:'all',order:'newest',durationMinutes:null});
 assert.equal(created.status,201);const snapshot=await created.json();
 assert.deepEqual(snapshot.questions.map(q=>q.id).sort(),[...wanted].sort());
 assert.ok(snapshot.questions.every(q=>q.answer===undefined&&q.explanation===undefined&&q.answerKeyStatus==='reasoned-verified'));
 for(const q of nda2026IQuestions){const checked=await send('/api/practice/check',{questionId:q.id,selectedOption:q.answer,contentRevision:0});assert.equal(checked.status,200);const result=await checked.json();assert.equal(result.correct,true,q.id);assert.match(result.explanation,/Reasoned verification/);}
});

test('batch two retains original figure bytes, four diagram options and the missing-speed exclusion',()=>{
 for(const [number,figure]of Object.entries(nda2026IBatch2Figures)){
  const q=nda2026IQuestions.find(q=>q.questionNumber===Number(number));
  assert.equal(q.requiresFigure,true);assert.equal(hash(fs.readFileSync('public'+q.figureKey)),figure.sha256);
  assert.equal(q.source.figureSha256,figure.sha256);
 }
 assert.deepEqual(Object.keys(nda2026IQuestions.find(q=>q.questionNumber===73).options),['A','B','C','D']);
 assert.equal(nda2026IQuestions.find(q=>q.questionNumber===72).answer,'A');
 assert.equal(nda2026IQuestions.find(q=>q.questionNumber===74).answer,'B');
 assert.equal((5*20/2+15*20+5*20/2)/10,40);
 const ledger=read('content/audits/nda-2026-i-review.json');
 assert.match(ledger.records.find(q=>q.questionNumber===75).secondPass.reason,/initial speed/i);
 assert.match(ledger.records.find(q=>q.questionNumber===95).secondPass.reason,/exceptions/);
 const q90=nda2026IQuestions.find(q=>q.questionNumber===90);
 const table=formatPracticePrompt(q90.promptLines).find(block=>block.kind==='pair-table');
 assert.ok(table);assert.equal(table.rows.length,4);assert.equal(table.leftTitle,'Reactions');assert.equal(table.rightTitle,'Properties');
 assert.equal(table.rows[2].right,'Br₂ is reductant');
});

test('all 150 original source numbers are available without promoting pending questions',()=>{
 const manifest=read('content/nda-2026-i-source-pages.json');
 assert.equal(manifest.mode,'unscored-original-paper');
 assert.equal(manifest.answerVerification,'in-progress');
 assert.equal(manifest.sourcePdfSha256,'1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930');
 assert.deepEqual(manifest.pages.flatMap(page=>Array.from({length:page.last-page.first+1},(_,i)=>page.first+i)),Array.from({length:150},(_,i)=>i+1));
 for(const page of manifest.pages)assert.equal(hash(fs.readFileSync('public'+page.src)),page.sha256);
 const ledger=read('content/audits/nda-2026-i-review.json');
 assert.equal(ledger.onlineAvailability.scoredImportComplete,false);
 assert.equal(ledger.onlineAvailability.originalQuestions,150);
 for(const record of ledger.records){
  assert.equal(record.onlineOriginal.mode,'unscored-original-paper');
  const page=manifest.pages.find(page=>page.page===record.onlineOriginal.page);
  assert.ok(page&&record.questionNumber>=page.first&&record.questionNumber<=page.last);
 }
 assert.equal(nda2026IQuestions.length,39,'An online scan must never silently become a cleared import');
});
