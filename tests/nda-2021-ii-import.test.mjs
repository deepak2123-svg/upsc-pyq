import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview} from '../lib/question-review.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const paper=read('content/nda-2021-ii-official-paper.json'),audit=read('content/audits/nda-2021-ii-review.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function send(path,body){const{default:w}=await import('../dist/server/index.js');return w.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
test('NDA II 2021: complete source register, authentic key and stable existing IDs',()=>{
 assert.equal(paper.questions.length,150);assert.equal(audit.questionSlots.length,150);assert.equal(Object.keys(paper.baselines).length,24);
 assert.equal(audit.reconciliation.newSourceOccurrences,126);assert.equal(audit.reconciliation.eligibleUniqueQuestionCount,150);
 assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);
 assert.equal(paper.questions.find(q=>q.questionNumber===68).id,'cds-2021-2021-2-68');
 assert.deepEqual(paper.questions.filter(q=>q.acceptedAnswers).map(q=>[q.questionNumber,q.acceptedAnswers]),[[102,['B','C']]]);
 for(const q of paper.questions){assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),true);assert.equal(questionReview(q.id).status,'official-final');assert.equal(hash(q.sourceText),q.sourceTextHash);if(q.requiresFigure)assert.equal(hash(fs.readFileSync('public'+q.figureKey)),q.source.figureSha256);}
 assert.equal(paper.questions.filter(q=>q.requiresFigure).length,1);
 for(const [n,a] of [[54,'A'],[65,'D'],[84,'A'],[85,'B'],[86,'D']])assert.equal(paper.questions.find(q=>q.questionNumber===n).answer,a,`Enlarged official cell Q${n}`);
});
test('NDA II 2021: every one of 600 answer choices uses the official decision, with no withdrawals',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(const a of ['A','B','C','D']){const r=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,a])),contentRevisions});assert.equal(r.status,200);const result=await r.json();assert.equal(result.scored,150);assert.equal(result.excluded,0);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,(q.acceptedAnswers??[q.answer]).includes(a),`Q${q.questionNumber}/${a}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer||null);if(q.acceptedAnswers)assert.deepEqual(result.feedback[q.id].correctAnswers,q.acceptedAnswers);}}
});
test('NDA II 2021: all eligible questions reachable, overlap deduplicates, no CSE leakage or answer payload',async()=>{
 const inv=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const members=i=>new Set(i.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
 const all=members(inv),other=members(cse),ids=new Set(paper.questions.map(q=>q.id));
 for(const q of paper.questions){assert.equal(all.has(q.id),true,q.id);if(q.preparationScope!=='gs')assert.equal(other.has(q.id),false,q.id);}
 const leaves=inv.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const r=await send('/api/practice-snapshots',{version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'});
 assert.equal(r.status,201);const s=await r.json();assert.equal(s.questions.length,150);assert.equal(new Set(s.questions.map(q=>q.id)).size,150);assert.equal(s.questions.filter(q=>q.figure).length,1);
 for(const q of s.questions)for(const field of ['answer','acceptedAnswers','explanation','source'])assert.equal(field in q,false);
 assert.ok(paper.questions.find(q=>q.questionNumber===75).additionalPaths.some(p=>p.subtopic==='Commercial crops'));
});
test('NDA II 2021: material Q84 repair protects historical choices and only new snapshots use original codes',async()=>{
 const id='nda-2021-ii-84',q=paper.questions.find(q=>q.id===id),revision=questionReview(id).contentRevision;
 assert.equal(revision,paper.baselines[id].contentRevision+1);assert.equal(q.answer,'A');
 assert.deepEqual(q.options,{A:'A-3, B-4, C-2, D-1',B:'A-3, B-2, C-4, D-1',C:'A-1, B-2, C-4, D-3',D:'A-1, B-4, C-2, D-3'});
 const old=await(await send('/api/practice/grade',{questionIds:[id,'nda-2021-ii-85'],answers:{[id]:'C','nda-2021-ii-85':'B'},contentRevisions:{[id]:paper.baselines[id].contentRevision,'nda-2021-ii-85':questionReview('nda-2021-ii-85').contentRevision}})).json();
 assert.equal(old.excluded,1);assert.equal(old.scored,1);assert.equal(old.correct,1);assert.equal(old.feedback[id].correct,null);assert.equal(old.feedback[id].correctAnswer,null);
 const fresh=await(await send('/api/practice/grade',{questionIds:[id],answers:{[id]:'A'},contentRevisions:{[id]:revision}})).json();assert.equal(fresh.correct,1);assert.equal(fresh.excluded,0);
});
