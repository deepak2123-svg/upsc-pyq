import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions,legacyQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionInGsScope,questionExclusion} from '../lib/question-review.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const paper=read('content/nda-2024-ii-reviewed-paper.json');
const audit=read('content/audits/nda-2024-ii-review.json');
const research=read('content/audits/nda-2024-ii-reasoned-review.json');
async function send(path,body){const{default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
const members=inv=>new Set(inv.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
test('all 150 source occurrences have individually documented answer decisions, without fabricated official status',()=>{
 assert.equal(research.questions.length,150);assert.equal(research.progress.secondPassCompleted,150);
 assert.equal(audit.questionSlots.length,150);assert.equal(new Set(audit.questionSlots.map(q=>q.canonicalQuestionId)).size,150);
 assert.equal(paper.questions.length,136);assert.equal(audit.reconciliation.dispositions.quarantined,14);
 assert.equal(audit.reconciliation.newlyImportedEligible,116);assert.equal(audit.reconciliation.reusedEligible,20);
 assert.deepEqual(audit.reconciliation.quarantinedNumbers,[16,21,23,24,51,58,68,70,110,117,123,125,139,144]);
 for(const slot of audit.questionSlots){assert.equal(questionReview(slot.canonicalQuestionId).status,slot.disposition);assert.equal(questionEligible(slot.canonicalQuestionId),slot.disposition==='reasoned-verified');}
 for(const q of paper.questions){assert.equal(combinedQuestions.filter(x=>x.id===q.id).length,1);assert.equal(q.source.answerStatus,'reasoned-verified');assert.equal(q.source.candidateKeyAuthenticated,false);assert.equal(hash(q.sourceText),q.sourceTextHash);assert.ok(q.source.primaryEvidence.length);}
 assert.equal(paper.questions.find(q=>q.questionNumber===37).answer,'C');assert.equal(paper.questions.find(q=>q.questionNumber===42).answer,'A');
 for(const q of paper.questions.filter(q=>q.requiresFigure))assert.equal(hash(fs.readFileSync('public'+q.figureKey)),q.source.figureSha256);
});
test('all 544 cleared option decisions grade correctly and historical quarantine/repair cannot penalise old attempts',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(const option of ['A','B','C','D']){const response=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,option])),contentRevisions});assert.equal(response.status,200);const result=await response.json();assert.equal(result.scored,136);assert.equal(result.excluded,0);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.answer===option,`Q${q.questionNumber}/${option}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer);}}
 const historicalIds=['nda-2024-ii-107','nda-2024-ii-110','nda-2024-ii-139'];
 const result=await(await send('/api/practice/grade',{questionIds:historicalIds,answers:Object.fromEntries(historicalIds.map(id=>[id,'A']))})).json();assert.equal(result.excluded,3);assert.equal(result.scored,0);assert.equal(result.incorrect,0);
 for(const id of historicalIds){assert.equal(result.feedback[id].correct,null);assert.equal(result.feedback[id].correctAnswer,null);}
 assert.match(questionExclusion('nda-2024-ii-107',0),/material correction/);assert.equal(questionExclusion('nda-2024-ii-107',1),null);
 assert.equal(legacyQuestions.find(q=>q.id==='nda-2024-ii-107').options.C,'A-1, B-2, C-4, D-3');
 assert.equal(paper.questions.find(q=>q.questionNumber===107).options.C,'A-1, B-2, C-3, D-4');
});
test('NDA catalogue includes exactly the cleared paper, with deduplication and no CSE science/English leakage',async()=>{
 const inv=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json();
 const cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const all=members(inv),other=members(cse),ids=new Set(paper.questions.map(q=>q.id));
 for(const q of paper.questions){assert.ok(all.has(q.id),q.id);if(q.preparationScope!=='gs'){assert.equal(questionInGsScope(q.id),false);assert.equal(other.has(q.id),false);}}
 for(const slot of audit.questionSlots.filter(q=>q.disposition==='quarantined'))assert.equal(all.has(slot.canonicalQuestionId),false);
 const leaves=inv.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const recipe={version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest',durationMinutes:150};
 const response=await send('/api/practice-snapshots',recipe);assert.equal(response.status,201);const snapshot=await response.json();assert.equal(snapshot.questions.length,136);assert.equal(new Set(snapshot.questions.map(q=>q.id)).size,136);
 for(const q of snapshot.questions){assert.equal(q.answerKeyStatus,'reasoned-verified');for(const field of ['answer','acceptedAnswers','explanation','source'])assert.equal(field in q,false);}
 assert.equal(snapshot.questions.filter(q=>q.figure).length,5);
 const q150=paper.questions.find(q=>q.questionNumber===150);assert.ok(q150.additionalPaths.some(p=>p.subject==='Economy'));
});
