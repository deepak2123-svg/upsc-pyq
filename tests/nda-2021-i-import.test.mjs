import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionExclusion} from '../lib/question-review.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const paper=read('content/nda-2021-i-official-paper.json'),audit=read('content/audits/nda-2021-i-review.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function send(path,body){const{default:w}=await import('../dist/server/index.js');return w.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}

test('NDA I 2021: complete source register, authentic key and stable existing IDs',()=>{
 assert.equal(paper.questions.length,150);assert.equal(audit.questionSlots.length,150);assert.equal(Object.keys(paper.baselines).length,27);
 assert.equal(audit.reconciliation.newSourceOccurrences,123);assert.equal(audit.reconciliation.eligibleUniqueQuestionCount,149);
 assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);
 assert.equal(paper.questions.find(q=>q.questionNumber===57).id,'nda-2021-i-57');
 assert.equal(paper.questions.find(q=>q.questionNumber===138).id,'cds-2021-2021-1-138');
 assert.equal(paper.questions.find(q=>q.questionNumber===63).options.B,'−073° Celsius');
 assert.equal(paper.questions.find(q=>q.questionNumber===78).options.B,'IR²');
 for(const q of paper.questions){
  assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);
  assert.equal(questionEligible(q.id),q.questionNumber!==58);
  assert.equal(questionReview(q.id).status,q.questionNumber===58?'withdrawn':'official-final');
  assert.equal(hash(q.sourceText),q.sourceTextHash);
 }
 assert.match(questionExclusion('nda-2021-i-58'),/Withdrawn/);
 assert.equal(paper.questions.filter(q=>q.requiresFigure).length,0);
});

test('NDA I 2021: every one of 600 answer choices uses the official decision, including withdrawal',async()=>{
 const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));
 for(const a of ['A','B','C','D']){
  const r=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,a])),contentRevisions});
  assert.equal(r.status,200);const result=await r.json();assert.equal(result.scored,149);assert.equal(result.excluded,1);
  for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.questionNumber===58?null:q.answer===a,`Q${q.questionNumber}/${a}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer||null);}
 }
});

test('NDA I 2021: all eligible questions reachable, overlap deduplicates, no CSE leakage or answer payload',async()=>{
 const inv=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json(),cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const members=i=>new Set(i.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
 const all=members(inv),other=members(cse),ids=new Set(paper.questions.filter(q=>q.questionNumber!==58).map(q=>q.id));
 for(const q of paper.questions){assert.equal(all.has(q.id),q.questionNumber!==58,q.id);if(q.preparationScope!=='gs')assert.equal(other.has(q.id),false,q.id);}
 const leaves=inv.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some(id=>ids.has(id)));
 const r=await send('/api/practice-snapshots',{version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'});
 assert.equal(r.status,201);const s=await r.json();assert.equal(s.questions.length,149);assert.equal(new Set(s.questions.map(q=>q.id)).size,149);
 for(const q of s.questions)for(const field of ['answer','acceptedAnswers','explanation','source'])assert.equal(field in q,false);
 assert.ok(paper.questions.find(q=>q.questionNumber===141).additionalPaths.some(p=>p.subject==='Economy'));
});
