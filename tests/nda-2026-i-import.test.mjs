import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {officialNda2026IKey as key,officialNda2026IKeyEvidence as evidence} from '../scripts/nda-2026-i-official-key.mjs';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview,questionInGsScope} from '../lib/question-review.ts';
import {answerKeyRevision,hasCompleteFeedback} from '../lib/practice-session.ts';
import {formatPracticePrompt} from '../lib/practice-prompt.ts';
const read=file=>JSON.parse(fs.readFileSync(file));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const paper=read('content/nda-2026-i-official-paper.json');
async function send(path,body){const {default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
function recipe(inventory,questions=paper.questions){
 const wanted=new Set(questions.map(q=>q.id));
 const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
 return {version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:null};
}

test('official UPSC key is byte-checked and all 150 Series A cells have two matching visual transcriptions',()=>{
 assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
 assert.match(evidence.url,/^https:\/\/www\.upsc\.gov\.in\/sites\/default\/files\//);
 assert.match(evidence.url,/%E2%80%93/);
 assert.equal(evidence.status,'official-provisional');assert.equal(evidence.dropped,0);
 assert.equal(Object.keys(key).length,150);assert.equal(paper.questions.length,150);
 assert.equal(new Set(paper.questions.map(q=>q.id)).size,150);
 for(const q of paper.questions){
  assert.equal(q.answer,key[q.questionNumber]);assert.equal(q.source.officialAnswer,q.answer);
  assert.equal(q.source.displayedAnswer,q.answer);assert.equal(q.source.optionsReordered,false);
  assert.equal(q.source.keySha256,evidence.sha256);assert.equal(q.source.keyPage,1);
  assert.equal(q.source.bookletSeries,'A');assert.equal(questionReview(q.id).status,'official-provisional');assert.ok(questionEligible(q.id));
  assert.match(q.explanation,/Official UPSC provisional key/);assert.ok(q.source.secondPass);
  assert.equal(combinedQuestions.filter(row=>row.id===q.id).length,1);
 }
});

test('63 existing IDs and source text survive; 87 genuinely missing occurrences are added once',()=>{
 const originals=[...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions];
 assert.equal(Object.keys(paper.baselines).length,63);
 for(const [id,baseline] of Object.entries(paper.baselines)){
  const old=originals.find(q=>q.id===id),current=combinedQuestions.find(q=>q.id===id);
  assert.ok(old&&current);assert.equal(hash(JSON.stringify(old)),baseline.sha256);
  assert.equal(current.sourceTextHash,old.sourceTextHash);assert.equal(current.sourceText,old.sourceText);
  assert.deepEqual(current.options,old.options);assert.equal(questionReview(id).contentRevision,baseline.contentRevision);
 }
 assert.equal(paper.questions.filter(q=>!paper.baselines[q.id]).length,87);
 assert.equal(paper.questions.find(q=>q.questionNumber===139).id,'cds-2026-2026-1-139');
 assert.equal(paper.questions.find(q=>q.questionNumber===146).id,'cds-2026-2026-1-146');
 assert.equal(hash(fs.readFileSync('content/question-bank.json')),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
});

test('the complete paper register accounts for every question with no deferred or unscored substitute',()=>{
 const audit=read('content/audits/nda-2026-i-review.json');
 assert.equal(audit.status,'complete-official-provisional');
 assert.deepEqual(audit.counts,{total:150,officialProvisional:150,officialFinal:0,dropped:0,newImports:87,reusedIds:63,english:50,science:50,gs:50});
 assert.equal(audit.records.length,150);assert.ok(audit.records.every(r=>r.disposition==='official-provisional'));
 const coverage=read('content/taxonomy/prelims-source-coverage.json').papers.find(p=>p.relativePath==='NDA PYP/GAT/2026-1.pdf');
 assert.equal(coverage.reviewedSlots,150);assert.equal(coverage.pendingSlots,0);
 assert.equal(coverage.verifiedImports,87);assert.equal(coverage.verifiedReuses,63);assert.equal(coverage.outOfScope,0);
 assert.equal(coverage.coverageStatus,'current-source-content-and-key-reviewed');
});

test('all 150 are present in NDA preparation without leaking English or NDA world history into CSE GS',async()=>{
 const nda=await(await send('/api/pyqs/inventory?preparationExam=NDA')).json();
 const cse=await(await send('/api/pyqs/inventory?preparationExam=CSE')).json();
 const allIds=new Set(nda.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>n.questionIdsByExam.NDA));
 const cseIds=new Set(cse.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
 for(const q of paper.questions){assert.ok(allIds.has(q.id),q.id);if(q.preparationScope!=='gs'||q.subject==='Science & Technology')assert.ok(!cseIds.has(q.id),q.id);}
 assert.equal(nda.subjects.find(s=>s.id==='subject:english').examCounts.NDA,150);
 const english=paper.questions.filter(q=>q.subject==='English');assert.equal(english.length,50);
 assert.ok(english.every(q=>!questionInGsScope(q.id)));
 const response=await send('/api/practice-snapshots',recipe(nda));assert.equal(response.status,201);
 const snapshot=await response.json();assert.equal(snapshot.questions.length,150);
 assert.deepEqual(snapshot.questions.map(q=>q.questionNumber),Array.from({length:150},(_,i)=>i+1));
 assert.ok(snapshot.questions.every(q=>q.answer===undefined&&q.explanation===undefined&&q.answerKeyStatus==='official-provisional'));
 assert.deepEqual(snapshot.questions[0].underlined,['allegories']);
 assert.equal(snapshot.questions.filter(q=>q.figure).length,4);
});

test('all 150 official answers grade correct and every one of 450 nonaccepted options grades incorrect',async()=>{
 const ids=paper.questions.map(q=>q.id),correct=Object.fromEntries(paper.questions.map(q=>[q.id,q.answer]));
 const contentRevisions=Object.fromEntries(paper.questions.map(q=>[q.id,questionReview(q.id).contentRevision]));
 const goodResponse=await send('/api/practice/grade',{questionIds:ids,answers:correct,contentRevisions});assert.equal(goodResponse.status,200);
 const good=await goodResponse.json();assert.equal(good.correct,150);assert.equal(good.incorrect,0);assert.equal(good.excluded,0);assert.equal(good.scored,150);
 for(const q of paper.questions){assert.equal(good.feedback[q.id].correctAnswer,key[q.questionNumber]);assert.equal(good.feedback[q.id].correct,true);assert.equal(good.feedback[q.id].disposition,'scored');}
 for(let alternative=0;alternative<3;alternative++){
  const wrong=Object.fromEntries(paper.questions.map(q=>[q.id,Object.keys(q.options).filter(option=>option!==q.answer)[alternative]]));
  const badResponse=await send('/api/practice/grade',{questionIds:ids,answers:wrong,contentRevisions});assert.equal(badResponse.status,200);
  const bad=await badResponse.json();assert.equal(bad.correct,0);assert.equal(bad.incorrect,150);assert.equal(bad.excluded,0);
  for(const q of paper.questions){assert.equal(bad.feedback[q.id].correct,false);assert.equal(bad.feedback[q.id].correctAnswer,q.answer);}
 }
});

test('Q58 and Q73 official-key corrections invalidate cached feedback without changing selected answers',async()=>{
 for(const number of [58,73]){
  const q=paper.questions.find(q=>q.questionNumber===number),baseline=paper.baselines[q.id];
  assert.equal(q.answer,number===58?'A':'D');assert.equal(baseline.answer,'C');assert.ok(answerKeyRevision(q.id)>0);
  const attempt={snapshot:{questions:[{...q,contentRevision:0}]},answers:{[q.id]:'C'},feedback:{[q.id]:{correct:true,correctAnswer:'C',answerKeyRevision:0,reviewRevision:baseline.reviewRevision}}};
  assert.equal(hasCompleteFeedback(attempt),false);
  const response=await send('/api/practice/grade',{questionIds:[q.id],answers:attempt.answers,contentRevisions:{[q.id]:0}});
  const result=await response.json();assert.equal(result.feedback[q.id].correct,false);
  assert.equal(result.feedback[q.id].correctAnswer,q.answer);assert.equal(attempt.answers[q.id],'C');
  assert.equal(hasCompleteFeedback({...attempt,feedback:result.feedback}),true);
 }
});

test('figures, English pair tables and original matching-list labels survive online/PDF formatting',()=>{
 for(const number of [72,73,74,75]){const q=paper.questions.find(q=>q.questionNumber===number);assert.equal(hash(fs.readFileSync('public'+q.figureKey)),q.source.figureSha256);}
 for(const number of [46,47,48,49,90,111,120,121,123,138,139]){
  const q=paper.questions.find(q=>q.questionNumber===number);assert.ok(formatPracticePrompt(q.promptLines).some(block=>block.kind==='pair-table'),`Q${number} table`);
 }
 const q150=paper.questions.find(q=>q.questionNumber===150);
 const matching=formatPracticePrompt(q150.promptLines).find(block=>block.kind==='match-table');assert.ok(matching);assert.equal(matching.left.items.length,4);assert.equal(matching.right.items.length,4);assert.equal(matching.right.items[3].label,'IV');
 for(const number of [58,60,75,88,95]){const q=paper.questions.find(q=>q.questionNumber===number);assert.ok(q.source.editorialCaveat);assert.match(q.explanation,/Editorial caveat:/);}
});
