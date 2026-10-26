import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions,legacyQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionInGsScope} from '../lib/question-review.ts';
const read=f=>JSON.parse(fs.readFileSync(f));
const paper=read('content/nda-2025-ii-official-paper.json');
const key=read('content/audits/nda-2025-ii-key-transcriptions.json').firstPassColumns.flatMap(c=>c.split(' '));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
async function send(path,body){const{default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
const membership=inv=>new Set(inv.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
test('NDA II 2025 accounts for all 150 original occurrences and preserves 27 IDs',()=>{
 assert.equal(paper.questions.length,150);assert.equal(Object.keys(paper.baselines).length,27);
 assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
 for(const q of paper.questions){assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),q.questionNumber!==85);assert.equal(q.sourceTextHash,hash(q.sourceText));
  if(paper.baselines[q.id])assert.ok(legacyQuestions.some(r=>r.id===q.id));
  assert.deepEqual(q.source.officialAcceptedOptions,key[q.questionNumber-1]==='X'?[]:key[q.questionNumber-1].split('/'));
 }
 assert.match(paper.questions[0].promptLines.join(' '),/Taking everything into consideration/);
 assert.equal(paper.questions[18].options.C,'dishonest');assert.equal(paper.questions[18].answer,'C');
 assert.equal(paper.questions[65].options.A,'It increases when temperature increases');assert.equal(paper.questions[65].answer,'A');
 assert.match(paper.questions[33].promptLines.join(' '),/\$1·3 billion/);
 const ledger=read('content/audits/nda-2025-ii-review.json');assert.equal(ledger.reconciliation.awaitingReviewCount,0);assert.equal(ledger.reconciliation.eligibleUniqueQuestionCount,149);
});
test('all accepted and rejected options follow the final key, including A/B and withdrawal',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(const option of ['A','B','C','D']){
  const answers=Object.fromEntries(ids.map(id=>[id,option]));const response=await send('/api/practice/grade',{questionIds:ids,answers,contentRevisions});assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.scored,149);assert.equal(result.excluded,1);assert.equal(result.correct+result.incorrect,149);
  for(const q of paper.questions){const f=result.feedback[q.id];if(q.questionNumber===85){assert.equal(f.disposition,'excluded');assert.equal(f.correct,null);assert.equal(f.correctAnswer,null);}else assert.equal(f.correct,key[q.questionNumber-1].split('/').includes(option),`Q${q.questionNumber} ${option}`);}
  assert.deepEqual(result.feedback['nda-2025-ii-58'].correctAnswers,['A','B']);
 }
 for(const option of ['A','B','C','D']){const f=await(await send('/api/practice/check',{questionId:'nda-2025-ii-58',selectedOption:option})).json();assert.equal(f.correct,['A','B'].includes(option));}
});
test('NDA paper memberships are unique and pure school science does not leak to CSE',async()=>{
 const nda=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json();const cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const all=membership(nda),other=membership(cse);
 for(const q of paper.questions){assert.equal(all.has(q.id),q.questionNumber!==85,q.id);if(q.preparationScope!=='gs'){assert.equal(other.has(q.id),false,q.id);assert.equal(questionInGsScope(q.id),false);}}
 const ids=new Set(paper.questions.filter(q=>q.questionNumber!==85).map(q=>q.id));
 const leaves=nda.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const recipe={version:4,preparationExam:'NDA',taxonomyVersion:nda.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest',durationMinutes:null};
 const response=await send('/api/practice-snapshots',recipe);assert.equal(response.status,201);const snapshot=await response.json();assert.equal(snapshot.questions.length,149);assert.equal(new Set(snapshot.questions.map(q=>q.id)).size,149);
 assert.deepEqual(snapshot.questions.map(q=>q.questionNumber),Array.from({length:150},(_,i)=>i+1).filter(n=>n!==85));
 for(const q of snapshot.questions)for(const field of ['answer','acceptedAnswers','correctAnswer','correctAnswers','explanation','source'])assert.equal(field in q,false,`${q.id} leaks ${field}`);
});
