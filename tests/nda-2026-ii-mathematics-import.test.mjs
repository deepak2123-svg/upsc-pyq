import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview} from '../lib/question-review.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const paper=read('content/nda-2026-ii-mathematics-official-paper.json');
const audit=read('content/audits/nda-2026-ii-mathematics-review.json');
const placements=read('content/nda-2026-ii-mathematics-preparation-placements.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function send(path,body){const{default:w}=await import('../dist/server/index.js');return w.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}

test('NDA II 2026 Mathematics preserves all 120 reviewed Series A occurrences',()=>{
 assert.equal(paper.paperId,'nda-2026-ii-mathematics');assert.equal(paper.questions.length,120);assert.equal(audit.questionSlots.length,120);
 assert.deepEqual(paper.questions.map(q=>q.questionNumber),Array.from({length:120},(_,i)=>i+1));assert.equal(new Set(paper.questions.map(q=>q.id)).size,120);
 assert.equal(paper.evidence.status,'official-provisional');assert.equal(paper.evidence.series,'A');assert.equal(paper.evidence.dropped,0);
 assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);assert.equal(hash(fs.readFileSync('public'+paper.questionPaper.asset)),paper.questionPaper.sha256);
 for(const q of paper.questions){assert.deepEqual(Object.keys(q.options),['A','B','C','D']);assert.ok(Object.values(q.options).every(Boolean));assert.equal(hash(q.sourceText),q.sourceTextHash);assert.equal(q.requiresFigure,false);assert.equal(questionEligible(q.id),true);assert.equal(questionReview(q.id).status,'official-provisional');assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);}
 assert.equal(audit.reconciliation.newSourceOccurrences,120);assert.equal(audit.reconciliation.reusedSourceOccurrences,0);assert.equal(audit.reconciliation.awaitingReviewCount,0);assert.equal(audit.reconciliation.dispositionCounts['official-provisional'],120);
});

test('all 480 Mathematics answer choices grade strictly against the provisional key',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,0]));
 for(const choice of ['A','B','C','D']){const response=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,choice])),contentRevisions});assert.equal(response.status,200);const result=await response.json();assert.equal(result.scored,120);assert.equal(result.excluded,0);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.answer===choice,`Q${q.questionNumber}/${choice}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer);}}
});

test('every question has reviewed NDA Mathematics placement with canonical-union deduplication and no GAT/CSE leakage',async()=>{
 const nda=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json(),ids=new Set(paper.questions.map(q=>q.id));
 const mathsLeaves=nda.nodes.filter(n=>n.kind==='subtopic'&&n.subjectId==='subject:nda-mathematics');
 const ndaMembers=mathsLeaves.flatMap(n=>n.questionIdsByExam.NDA.filter(id=>ids.has(id))),gatMembers=nda.nodes.filter(n=>n.kind==='subtopic'&&n.subjectId!=='subject:nda-mathematics').flatMap(n=>n.questionIdsByExam.NDA.filter(id=>ids.has(id))),cseMembers=cse.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()).filter(id=>ids.has(id));
 assert.equal(new Set(ndaMembers).size,120);assert.ok(ndaMembers.length>120,'secondary placements should overlap but conserve canonical IDs');assert.deepEqual(gatMembers,[]);assert.deepEqual(cseMembers,[]);
 for(const q of paper.questions){const rows=placements.filter(p=>p.questionId===q.id&&p.target==='NDA'&&p.status==='approved');assert.ok(rows.length>=1,q.id);assert.ok(rows.every(p=>p.subtopicId.startsWith('subtopic:nda-mathematics:')&&p.rationale&&p.secondPass));}
});

test('answer-free full-paper snapshots retain original membership and mathematical source text',async()=>{
 const inventory=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),ids=new Set(paper.questions.map(q=>q.id));
 const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.subjectId==='subject:nda-mathematics'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const response=await send('/api/practice-snapshots',{version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:['subject:nda-mathematics'],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({...n,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'});
 assert.equal(response.status,201);const snapshot=await response.json();assert.equal(snapshot.questions.length,120);assert.equal(new Set(snapshot.questions.map(q=>q.id)).size,120);
 for(const q of snapshot.questions)for(const field of ['answer','acceptedAnswers','explanation','source'])assert.equal(field in q,false);
 assert.match(snapshot.questions.find(q=>q.id==='nda-2026-ii-maths-17').promptLines.join(' '),/begin\{bmatrix\}/);assert.match(snapshot.questions.find(q=>q.id==='nda-2026-ii-maths-71').promptLines.join(' '),/\\int/);
});
