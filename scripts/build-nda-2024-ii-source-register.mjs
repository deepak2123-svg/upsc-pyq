// Source-only checkpoint. Never mutates the live bank or publishes answer evidence.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {english,directions,clozePassage,readingPassage} from './nda-2024-ii-english-transcription.mjs';
import {partB} from './nda-2024-ii-part-b-transcription.mjs';
import {classifications} from './nda-2024-ii-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=v=>crypto.createHash('sha256').update(Buffer.isBuffer(v)||typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const source='C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2024-2.pdf';
const originalHash='f29ca30df4cc2a58ab10f0784041075444edf1e3631fbde47e96a05482c7e819';
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(source)),originalHash);
const key=read('content/audits/nda-2024-ii-key-transcriptions.json');
assert.equal(hash(fs.readFileSync(key.retrievedLocalPath)),key.sha256);
const first=key.firstPassColumns.flatMap(s=>s.split(' ')),second=[];
key.secondPassRows.forEach((row,i)=>row.split(' ').forEach((value,j)=>second[j*20+i]=value));
assert.deepEqual(first,second);assert.equal(first.length,150);assert.deepEqual(first.flatMap((v,i)=>v==='X'?[i+1]:[]),[123]);
const raw=[...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions];
const all=[...english,...partB];assert.deepEqual(all.map(q=>q.number),Array.from({length:150},(_,i)=>i+1));
const questions=all.map(row=>{
 const old=raw.filter(q=>q.exam==='NDA'&&q.year===2024&&q.paper==='II'&&q.questionNumber===row.number);assert.ok(old.length<=1);
 const dir=directions.find(d=>row.number>=d.from&&row.number<=d.to);
 const shared=dir?[dir.text,...(row.number>=6&&row.number<=15?[clozePassage]:row.number>=41&&row.number<=45?[readingPassage]:[])]:[];
 const pages=row.number>=6&&row.number<=15?[2,3]:row.number>=41&&row.number<=45?[7,8]:[row.page];
 const c=classifications[row.number];assert.ok(c);assert.deepEqual(Object.keys(row.options),['A','B','C','D']);
 return {...row,canonicalQuestionId:old[0]?.id??`nda-2024-ii-${row.number}`,accountingAction:old.length?'reused':'new',expectedBeforeRecordHash:old[0]?hash(old[0]):null,sourcePages:pages,
   sharedContext:dir?{id:`nda-2024-ii-context-${dir.from}-${dir.to}`,label:row.number>=6&&row.number<=15||row.number>=41&&row.number<=45?'Passage and instructions':'Instructions',promptLines:shared}:null,
   sourceTextHash:hash([...shared,...row.promptLines].join('\n')),optionsHash:hash(row.options),
   reproduction:{firstPass:'transcribed from original rendered source pages',secondPass:'2026-10-27: fresh reverse-page visual comparison by the same AI reviewer; stem, statements, all options, shared directions/passages and underlines checked against original renders',sourceTextReviewed:true,approved:false,remainingGate:'Final rendered application/PDF comparison, including required figures'},
   classification:{...c,status:'draft',secondPass:'pending'},
   answerEvidence:{candidateLetter:first[row.number-1],evidenceReference:'content/audits/nda-2024-ii-key-transcriptions.json',officialStatus:'not authenticated for this release',publicationApproved:false},
   finalDisposition:null,eligibleForNewScoredTests:false};
});
const reused=questions.filter(q=>q.accountingAction==='reused');assert.equal(reused.length,22);
const figureNotes=[64,67,69,70,71,72,125];assert.deepEqual(questions.filter(q=>q.figure).map(q=>q.number),figureNotes);
const searchLog=[
 {url:'https://www.upsc.gov.in/examinations/answer-key/archives',result:'Accessible listing returned only CISF 2026. Does not establish absence of an older NDA key.'},
 {url:'https://upsc.gov.in/examinations/answer-key/archives',result:'Redirected to homepage.'},
 ...['AnsKey-NDANA-II-2024-GAT-170425','AnsKey-NDANA-II-2024-GAT-160425','AnsKey-NDA-II-2024-GAT-170425','NDA_NA_II_EXAM_2024_GAT_Ans_Key','AnsKey-NDANA-II-2024-GAT-220425','AnsKey-NDANA-II-2024-GAT-230425','AnsKey-NDA-II-2024-GAT-220425','AnsKey-NDANA-II-2024-GAT-240425'].map(stem=>({url:`https://www.upsc.gov.in/sites/default/files/${stem}.pdf`,result:'HTTP 404 on 2026-10-27; filename variant is a search attempt, not a claimed source URL.'})),
 {url:key.candidateUrl,result:'Preserved four-page scan with A/B/C/D tables, source-matching A header, 150 total/149 scored and Q123 X. Both transcriptions agree. Earlier local review accepted 20 cells; that earlier decision is not blanket approval of all 150.'},
 {url:'https://prepp.in/nda-exam/question%20paper%202024',result:'Explicit NDA II 2024 GAT answer-key row links to the candidate scan; not a direct official-origin URL.'},
 {url:'https://www.pw.live/defence/exams/nda-2-2024-answer-key',result:'Article explicitly labels its model table unofficial and contains conflicting later answers. Not used as official authority.'},
 {url:'https://www.defencestudy.com/blog/nda-previous-year-questions-last-10-years-papers-with-answers',result:'Official-key link is a generic UPSC archive, not paper-specific provenance.'}
];
const registry=read('docs/templates/paper-register.template.json');delete registry.notice;delete registry.questionSlotFields;delete registry.sectionFields;delete registry.officialKeyDocumentFields;
Object.assign(registry,{paperId:'nda-2024-ii-gat',workflowState:'in-progress',active:false,
 sourceIdentity:{exam:'NDA',year:2024,session:'II',paperName:'General Ability Test',paperNumber:'II (paper number, independently distinguished from session)',bookletSeries:'A',language:'Part A English; Part B English and Hindi',examinationDate:'2024-09-01',identityEvidence:['Original cover and English instructions PDF 48: SURN-A-GAT, Series A, 150 questions, 600 marks, 150 minutes.','UPSC previous-paper listing explicitly identifies NDA II 2024 GAT; question content matches prior source records.'],originalPdfUrl:'https://www.upsc.gov.in/examinations/previous-question-papers',originalPdfLocalPath:source,originalPdfSha256:originalHash,pdfPageCount:48,missingPages:[],printedToPdfPageMap:'Printed page number equals PDF page index (one-based). Part A English 2–9; Part B English 11–43 odd; Hindi counterparts 10–42 even; rough work 44–47; English instructions 48.'},
 expectedQuestionCount:150,expectedQuestionNumbers:all.map(q=>q.number),sections:[{sourceLabel:'Part A — English',firstPrintedNumber:1,lastPrintedNumber:50,expected:50},{sourceLabel:'Part B',firstPrintedNumber:51,lastPrintedNumber:150,expected:100}],
 questionSlots:questions.map(q=>({printedQuestionNumber:q.number,sourcePages:q.sourcePages,canonicalQuestionId:q.canonicalQuestionId,accountingAction:q.accountingAction,expectedBeforeRecordHash:q.expectedBeforeRecordHash,questionReviewReference:`content/staging/nda-2024-ii-source-draft.json#${q.number}`,finalDisposition:null,blocker:'Classification second pass, key provenance/revision review and application/PDF reproduction checks pending.'})),
 officialKeySearchLog:searchLog,officialKeyDocuments:[{...key,firstPassColumns:undefined,secondPassRows:undefined,status:'candidate mirror; not yet authenticated for publication'}],
 keyTranscription:{firstPassReference:'content/audits/nda-2024-ii-key-transcriptions.json#firstPassColumns',secondPassReference:'content/audits/nda-2024-ii-key-transcriptions.json#secondPassRows',comparisonResult:'150 matching cells; Q123 is X; 149 letter cells; no multiple-answer cells observed',dropAndMultipleAnswerCellsChecked:true},
 review:{reviewer:'codex-main',reviewerKind:'AI',date:'2026-10-27',firstSourcePass:'All 150 stems/options read from original page renders and transcribed; figures separately cropped and inspected.',secondSourcePass:'Fresh reverse-page visual comparison completed for all 150 by the same AI reviewer, not an independent human review. Q91 duplicated printed option label retained as an explicit source caveat.',classificationSecondPass:'pending',figureCropManifest:'tmp/nda-2024-ii/figures/manifest.json',requiredFigureNumbers:figureNotes},
 reconciliation:{newSourceOccurrences:128,reusedSourceOccurrences:22,unresolvedSourceSlots:0,reproductionFirstPassCount:150,reproductionSecondSourcePassCount:150,classificationDraftCount:150,answerAwaitingReviewCount:150,eligibleNewlyPublished:0,sourceReviewComplete:false},
 rawBefore:reused.map(q=>({id:q.canonicalQuestionId,sha256:q.expectedBeforeRecordHash,value:raw.find(r=>r.id===q.canonicalQuestionId)})),
 sourceInputs:Object.fromEntries(['scripts/nda-2024-ii-english-transcription.mjs','scripts/nda-2024-ii-part-b-transcription.mjs','scripts/nda-2024-ii-classification.mjs','content/audits/nda-2024-ii-key-transcriptions.json'].map(p=>[p,hash(fs.readFileSync(p))]))});
const answerReviewPath='content/audits/nda-2024-ii-reasoned-review.json';
if(fs.existsSync(answerReviewPath)){
 const review=read(answerReviewPath);
 registry.answerReviewReference=answerReviewPath;
 registry.reconciliation.answerAwaitingReviewCount=150-review.progress.secondPassCompleted;
 registry.reconciliation.answerSecondPassCount=review.progress.secondPassCompleted;
 registry.reconciliation.reasonedVerifiedCount=review.progress.secondPassApproved;
 registry.reconciliation.quarantinedCount=review.progress.secondPassQuarantined;
 registry.runtimeReviewReference='content/audits/nda-2024-ii-review.json';
 registry.review.classificationSecondPass='2026-10-27: fresh same-AI concept/applicability pass recorded per slot in the runtime review; staged first-pass classifications retained as history.';
 registry.review.figureCropManifest='content/audits/nda-2024-ii-figure-manifest.json';
 registry.reconciliation.sourceReviewComplete=review.progress.secondPassCompleted===150;
 registry.reconciliation.eligibleAfterApprovedOverlay=review.progress.secondPassApproved;
 registry.reconciliation.note='eligibleNewlyPublished=0 describes this immutable source-only staging artifact, not the reviewed runtime overlay or production release state.';
 registry.workflowState=review.progress.secondPassCompleted===150?'individual-answer-review-complete-release-checks-pending':'in-progress';
 registry.questionSlots=registry.questionSlots.map(slot=>{
  const decision=review.questions.find(q=>q.number===slot.printedQuestionNumber);
  return {...slot,finalDisposition:decision?.answerReviewDisposition??null,answerReviewReference:`${answerReviewPath}#${slot.printedQuestionNumber}`,blocker:decision?.answerReviewDisposition==='quarantined'?decision.secondPass.note:'Application/PDF and production release checks are separate from answer approval.'};
 });
}
const outputs=[['content/audits/nda-2024-ii-paper-register.json',registry],['content/staging/nda-2024-ii-source-draft.json',{paperId:registry.paperId,active:false,questions}]];
for(const [path,value]of outputs){const bytes=JSON.stringify(value,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),bytes);else fs.writeFileSync(path,bytes);}
console.log(JSON.stringify(registry.reconciliation));
