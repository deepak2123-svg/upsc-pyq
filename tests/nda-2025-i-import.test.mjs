import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {combinedQuestions,legacyQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionInGsScope} from '../lib/question-review.ts';
import {answerKeyRevision,hasCompleteFeedback} from '../lib/practice-session.ts';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const paper=read('content/nda-2025-i-official-paper.json'),key=read('content/audits/nda-2025-i-key-transcriptions.json').firstPassColumns.flatMap(c=>c.split(' '));
async function send(path,body){const{default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
const members=inv=>new Set(inv.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
test('NDA I 2025 preserves all 150 occurrences and 24 prior IDs, authenticating the exact final-key bytes',()=>{
 assert.equal(paper.questions.length,150);assert.equal(Object.keys(paper.baselines).length,24);assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
 for(const q of paper.questions){assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),true);assert.equal(q.answer,key[q.questionNumber-1]);assert.equal(hash(q.sourceText),q.sourceTextHash);if(paper.baselines[q.id])assert.ok(legacyQuestions.some(r=>r.id===q.id));}
 assert.match(paper.questions[0].promptLines.join(' '),/lingua franca/);assert.equal(paper.questions[6].answer,'B');assert.equal(paper.questions[6].options.B,'Nitin wondered before his brother that it was a beautiful painting');
 assert.match(paper.questions[86].promptLines.join(' '),/Amphibolite/);assert.equal(paper.questions[101].answer,'C');assert.match(paper.questions[101].explanation,/previously reasoned A/);
 const audit=read('content/audits/nda-2025-i-review.json');assert.equal(audit.reconciliation.awaitingReviewCount,0);assert.equal(audit.reconciliation.dispositionCounts['official-final'],150);
});
test('all 600 option decisions grade to the authentic final key, with no arbitrary held or unscored records',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(const option of ['A','B','C','D']){const response=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,option])),contentRevisions});assert.equal(response.status,200);const result=await response.json();assert.equal(result.scored,150);assert.equal(result.excluded,0);assert.equal(result.correct+result.incorrect,150);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,key[q.questionNumber-1]===option,`Q${q.questionNumber}/${option}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer);}}
 for(const[number,former]of [[86,'C'],[102,'A']]){const q=paper.questions[number-1],f=await(await send('/api/practice/check',{questionId:q.id,selectedOption:former,contentRevision:questionReview(q.id).contentRevision})).json();assert.equal(f.correct,false);assert.equal(f.correctAnswer,q.answer);}
});
test('all preparation branches launch deduplicated membership and do not silently become CSE GS',async()=>{
 const nda=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json(),all=members(nda),other=members(cse);
 for(const q of paper.questions){assert.ok(all.has(q.id),q.id);if(q.preparationScope!=='gs'){assert.equal(other.has(q.id),false,q.id);assert.equal(questionInGsScope(q.id),false);}}
 const ids=new Set(paper.questions.map(q=>q.id)),leaves=nda.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const recipe={version:4,preparationExam:'NDA',taxonomyVersion:nda.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest',durationMinutes:150};
 const response=await send('/api/practice-snapshots',recipe);assert.equal(response.status,201);const snapshot=await response.json();assert.equal(snapshot.questions.length,150);assert.equal(new Set(snapshot.questions.map(q=>q.id)).size,150);assert.deepEqual(snapshot.questions.map(q=>q.questionNumber),Array.from({length:150},(_,i)=>i+1));
 for(const q of snapshot.questions)for(const field of ['answer','acceptedAnswers','correctAnswer','explanation','source'])assert.equal(field in q,false);
 const sources=await send('/legal/sources');assert.equal(sources.status,200);
});
test('key-only revisions refresh old answers while preserving content revisions and submitted choices',()=>{
 for(const number of [86,102]){const q=paper.questions[number-1],before=paper.baselines[q.id],now=questionReview(q.id);assert.equal(now.contentRevision,before.contentRevision);assert.ok(now.revision>before.reviewRevision);const answers={[q.id]:before.answer};assert.ok(answerKeyRevision(q.id));const attempt={snapshot:{questions:[{...q,contentRevision:now.contentRevision}]},answers,feedback:{[q.id]:{correctAnswer:before.answer,correct:true,answerKeyRevision:answerKeyRevision(q.id)-1,reviewRevision:before.reviewRevision}}};assert.equal(hasCompleteFeedback(attempt),false);attempt.feedback[q.id]={correctAnswer:q.answer,correct:false,answerKeyRevision:answerKeyRevision(q.id),reviewRevision:now.revision};assert.equal(hasCompleteFeedback(attempt),true);assert.equal(answers[q.id],before.answer);}
});
