import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {nda2026IIEnglish} from './nda-2026-ii-english-transcription.mjs';
import {nda2026IIKey as previousKey,nda2026IIEvidence as previousEvidence} from './prelims-reviewed-nda-2026-ii-imports.mjs';
import {officialNda2026IIKey as key,officialNda2026IIEvidence as evidence} from './nda-2026-ii-official-key.mjs';
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const hash = value => crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
// Source verification is explicit locally; reproducible cloud checks use the
// recorded source hash and the preserved public key, not a developer's drive.
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(previousEvidence.originalPdf)),previousEvidence.originalPdfSha256);
const pilot=read('content/reviewed-prelims-imports.json');
const existing=pilot.questions.filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='II');
assert.equal(existing.length,100);
const oldByNumber=new Map(existing.map(q=>[q.questionNumber,q]));
assert.deepEqual([...oldByNumber.keys()],Array.from({length:100},(_,i)=>i+51));
for(const q of existing){assert.equal(q.answer,key[q.questionNumber]);assert.equal(previousKey[q.questionNumber],key[q.questionNumber]);}
const priorPolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const baselines=Object.fromEntries(existing.map(q=>[q.id,{sha256:hash(q),answer:q.answer,contentRevision:priorPolicy[q.id]?.contentRevision??0,reviewRevision:priorPolicy[q.id]?.revision??0}]));
const resultFile='content/nda-2026-ii-official-paper.json';
if(fs.existsSync(resultFile))assert.deepEqual(read(resultFile).baselines,baselines,'Previously reviewed NDA II source changed. Stop before overwriting the overlay.');
const english=new Map(nda2026IIEnglish.map(q=>[q.number,q]));
assert.equal(english.size,50);
const classificationChanges={
 123:{path:'History/World History/Industrial Revolution/Labour movements',rationale:'The complete question tests Luddism in Britain and its labour demands, not Indian industrial policy. Place primarily in defence-exam World History; do not automatically broaden CSE GS applicability.'},
 124:{path:'History/World History/Industrial Revolution/Conditions in Britain',rationale:'Coal, iron resources and blast-furnace chronology in Britain test the Industrial Revolution. The specific World History branch is more precise than a general Economy industrial-history leaf; keep explicit NDA/CDS applicability.'},
};
const questions=Array.from({length:150},(_,i)=>{
 const number=i+1,old=oldByNumber.get(number),draft=english.get(number);
 assert.ok(old||draft,`Missing Q${number}`);
 const change=classificationChanges[number];
 const path=change?.path??(old?[old.subject,old.taxonomyHead,old.topic,old.subtopic].join('/'):draft.path);
 const [subject,head,chapter,subpart]=path.split('/');assert.ok(subpart);
 const scope=number<=50?'english':change?'defence-world-history':'gs';
 const promptLines=old?.promptLines??draft.promptLines,options=old?.options??draft.options;
 assert.deepEqual(Object.keys(options),['A','B','C','D']);assert.ok(options[key[number]]);
 const rationale=change?.rationale??old?.source.classificationRationale??`The complete stem and alternatives test ${subpart}, within ${head} / ${chapter}. This language skill is explicitly appropriate to NDA GAT English and CDS English; it is not a GS question.`;
 const note=draft?.note??old?.source.editorialCaveat??null;
 const sourceText=old?.sourceText??promptLines.join(' ');
 return {...(old??{}),id:old?.id??`nda-2026-ii-${number}`,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:old?.sourceTextHash??hash(sourceText),exam:'NDA',year:2026,paper:'II',questionNumber:number,
  subject,taxonomyHead:head,topic:chapter,subtopic:subpart,taxonomyChapter:chapter,taxonomySubtopic:subpart,difficulty:old?.difficulty??'Moderate',promptLines,options,answer:key[number],
  explanation:`Official UPSC provisional key, released 16 September 2026: Series A Q${number} accepts ${key[number]} (${options[key[number]]}). Subject to revision by UPSC.${note?' Editorial caveat: '+note:''}`,
  requiresFigure:false,additionalPaths:old?.additionalPaths??[],classificationTags:old?.classificationTags??['Static'],
  ...(draft?.underlined.length?{underlined:draft.underlined}:{}),preparationScope:scope,
  source:{...(old?.source??{}),dataset:'Complete NDA II 2026 GAT, official provisional key',exam:'NDA',year:2026,paper:'II',questionNumber:number,
   originalPdf:previousEvidence.originalPdf,originalPdfSha256:previousEvidence.originalPdfSha256,
   originalPage:old?.source.originalPage??draft.page,bookletSeries:'A',answerStatus:'official-provisional',answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,
   officialAnswer:key[number],displayedAnswer:key[number],optionsReordered:false,
   reproductionReview:'Complete original Series A stem, every statement and A–D option compared visually, including English directions/underlining and tables. Original words, false propositions, symbols and source IDs retained; no original figure is required in this paper.',
   classificationRationale:rationale,
   secondPass:'Fresh original-page reread by the same AI reviewer, not independent human review; all options and classification boundaries rechecked. Official key read column-first and row-first, agreeing for all 150 cells. See the paper review ledger for source pages and review method.',
   reviewedAt:'2026-10-25',...(note?{editorialCaveat:note}:{}),
  },
 };
});
assert.equal(new Set(questions.map(q=>q.id)).size,150);
const policy=Object.fromEntries(questions.map(q=>[q.id,{...(priorPolicy[q.id]??{}),status:'official-provisional',revision:(priorPolicy[q.id]?.revision??0)+1,contentRevision:priorPolicy[q.id]?.contentRevision??0,preparationScope:q.preparationScope}]));
const placements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:q.source.secondPass})));
const sections=[{label:'English',from:1,to:50},{label:'Science',from:51,to:100},{label:'GS',from:101,to:150}];
const reviewer={reviewerId:'codex-main',reviewerKind:'AI',date:'2026-10-25',sameReviewerFreshPassOrDifferentReviewer:'same-reviewer-fresh-pass',sourceReopened:true};
const ledger={
 templateVersion:1,paperId:'nda-2026-ii-gat',workflowState:'source-review-complete',
 sourceIdentity:{...previousEvidence,paperName:'General Ability Test',paperNumber:'II',session:'II',bookletSeries:'A',languages:['English','Hindi'],reviewedLanguage:'English',pdfPageCount:52,originalPdfUrl:null,originalPdfUrlNote:'Local supplied original and verified printed cover. No guessed official question-paper URL is asserted.',
  identityEvidence:'Cover page 1 explicitly identifies N.D.A. & N.A. Examination (II), 2026, General Ability Test, Series A, 150 questions, 150-minute time limit. English Part A occupies pages 2–7; Part B English pages are 9–47 odd-numbered.',
  printedToPdfPageMap:'Printed N-A page number equals one-based PDF page N for the reviewed cover/English pages.',missingPages:[],duplicateCopies:[]},
 expectedQuestionCount:150,expectedQuestionNumbers:Array.from({length:150},(_,i)=>i+1),sections,
 officialKeyDocuments:[evidence],keyTranscription:{firstPassReference:'scripts/nda-2026-ii-official-key.mjs:columns',secondPassReference:'scripts/nda-2026-ii-official-key.mjs:rows',comparisonCommand:'node scripts/nda-2026-ii-official-key.mjs',comparisonResult:'passed',dropAndMultipleAnswerCellsChecked:true,mismatches:[]},
 reviews:[{...reviewer,area:'reproduction',method:'Every original English page and all options read against the current transcript, then reopened for a fresh second visual pass.',decision:'approved'},
  {...reviewer,area:'classification',method:'Every complete task reviewed for the most-specific concept and target scope; new English leaves checked, Luddism and British industrial conditions moved to defence World History; existing justified cross-placements retained.',decision:'approved'},
  {...reviewer,area:'answer-key',method:'Fresh UPSC download hashed and matched; cover/key header compared and every cell transcribed in two orientations, with programmatic agreement and existing Q51–150 keys compared.',decision:'approved'}],
 questionSlots:questions.map(q=>({printedQuestionNumber:q.questionNumber,canonicalQuestionId:q.id,sourcePages:[q.source.originalPage],accountingAction:oldByNumber.has(q.questionNumber)?'reused':'new',finalDisposition:'official-provisional',
  reproduction:{decision:'approved',sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),allSourcePagesCompared:true,allStatementsAndOptionsCompared:true,requiredAssetsCompared:true},
  classification:{status:'approved',primaryPath:[q.subject,q.taxonomyHead,q.topic,q.subtopic].join('/'),additionalPlacements:q.additionalPaths,preparationScope:q.preparationScope,rationale:q.source.classificationRationale,secondPass:q.source.secondPass},
  answerEvidence:{status:'official-provisional',keySha256:evidence.sha256,keyPage:1,keySeries:'A',officialAcceptedOptions:[q.answer],displayedAcceptedOptions:[q.answer],optionsReordered:false,optionText: q.options[q.answer],editorialCaveat:q.source.editorialCaveat??null},blocker:null})),
 reconciliation:{newSourceOccurrences:50,reusedSourceOccurrences:100,unresolvedSourceSlots:0,duplicateAliasRecordsNotExtraSourceSlots:0,
  dispositionCounts:{'official-final':0,'official-provisional':150,'reasoned-verified':0,withdrawn:0,duplicate:0,quarantined:0},awaitingReviewCount:0,eligibleUniqueQuestionCount:150,sectionTotals:sections.map(s=>({...s,reviewed:50,eligible:50,excluded:0})),sourceReviewComplete:true},
 answerChanges:[],classificationChanges:Object.entries(classificationChanges).map(([number,change])=>({id:oldByNumber.get(Number(number)).id,before:[oldByNumber.get(Number(number)).subject,oldByNumber.get(Number(number)).taxonomyHead,oldByNumber.get(Number(number)).topic,oldByNumber.get(Number(number)).subtopic].join('/'),after:change.path,rationale:change.rationale})),
 application:{rawBankChanged:false,priorPilotImportsChanged:false,existingSourceContentChanged:false,existingAnswerKeysChanged:false,historicalSnapshotsChanged:false,releaseReportReference:'docs/nda-2026-ii-completion.md'},
};
for(const [file,value] of [[resultFile,{version:1,evidence,baselines,questions}],['content/nda-2026-ii-official-review-policy.json',policy],['content/nda-2026-ii-preparation-placements.json',placements],['content/audits/nda-2026-ii-review.json',ledger]]){
 const bytes=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,`Stale official-paper output ${file}`);
 else fs.writeFileSync(file,bytes);
}
console.log(JSON.stringify(ledger.reconciliation));
