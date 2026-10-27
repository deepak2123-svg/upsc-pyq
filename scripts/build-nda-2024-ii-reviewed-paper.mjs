import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {classifications} from './nda-2024-ii-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const draft=read('content/staging/nda-2024-ii-source-draft.json');
const register=read('content/audits/nda-2024-ii-paper-register.json');
const reviews=read('content/audits/nda-2024-ii-reasoned-review.json');
assert.equal(reviews.progress.secondPassCompleted,150);
assert.equal(reviews.progress.remainingSecondPass.length,0);
assert.equal(reviews.progress.secondPassApproved,136);
const reviewByNumber=new Map(reviews.questions.map(q=>[q.number,q]));
const raw=[...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions];
const before=new Map(register.rawBefore.map(b=>[b.id,b]));
for(const b of before.values()){assert.equal(hash(b.value),b.sha256);assert.equal(hash(raw.find(q=>q.id===b.id)),b.sha256,`Original record changed: ${b.id}`);}
const policies={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const oldKeyRevisions=read('content/answer-key-revisions.json');
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json');
const nodeById=new Map(registry.nodes.map(n=>[n.id,n]));
const paths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const labels=[];let current=n;while(current){labels.unshift(current.label);current=nodeById.get(current.parentId);}return[labels.join('/'),n.id];}));
const cropPath='content/audits/nda-2024-ii-figure-manifest.json';
const crops=read(cropPath);
for(const crop of crops)assert.equal(hash(fs.readFileSync('public'+crop.asset)),crop.sha256);
const figureByNumber=new Map(crops.map(c=>[c.number,c]));
const policy={},keyRevisions={},baselines={};
const questions=[],slots=[];
for(const row of draft.questions){
 const n=row.number,review=reviewByNumber.get(n),c=classifications[n];
 assert.ok(review?.secondPass);assert.equal(review.canonicalQuestionId,row.canonicalQuestionId);
 assert.equal(review.sourceQuestionHash,hash({promptLines:row.promptLines,options:row.options,sharedContext:row.sharedContext,figure:row.figure}));
 const old=before.get(row.canonicalQuestionId)?.value;
 const prior=policies[row.canonicalQuestionId];
 // Added directions/layout and removed separator dashes are non-material.
 // Q107 alone has two materially mistranscribed matching-code distractors.
 const norm=s=>s.replace(/[’‘]/g,"'").replace(/[—–]/g,'-').replace(/[-\s]+$/g,'').replace(/\s/g,'');
 if(old)for(const letter of ['A','B','C','D']){
  if(n===107&&['C','D'].includes(letter)){
   const repairs={C:['A-1, B-2, C-4, D-3','A-1, B-2, C-3, D-4'],D:['A-1, B-3, C-4, D-2 ---','A-1, B-3, C-2, D-4']};
   assert.equal(old.options[letter],repairs[letter][0]);assert.equal(row.options[letter],repairs[letter][1]);
  }else assert.equal(norm(old.options[letter]),norm(row.options[letter]),`Material option repair requires separate review: Q${n}/${letter}`);
 }
 const status=review.answerReviewDisposition;
 assert.ok(['reasoned-verified','quarantined'].includes(status));
 const revision={status,revision:(prior?.revision??0)+1,contentRevision:(prior?.contentRevision??0)+(n===107?1:0),preparationScope:c.scope};
 policy[row.canonicalQuestionId]=revision;
 if(old)baselines[old.id]={sha256:hash(old),answer:old.answer,reviewRevision:prior?.revision??0,contentRevision:prior?.contentRevision??0};
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);
 if(c.scope==='gs')assert.ok(paths.has(c.path),`Unbounded GS placement: ${c.path}`);
 const additionalPaths=c.additional.map(p=>{assert.ok(paths.has(p));const [subject,head,chapter,subtopic]=p.split('/');return{subject,head,chapter,subtopic,taxonomyId:paths.get(p)};});
 if(subject==='Current Affairs'&&head==='Economy & Development'){
  const mirror=['Economy','Current Affairs',chapter,subpart].join('/');assert.ok(paths.has(mirror));additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart,taxonomyId:paths.get(mirror)});
 }
 const slot={number:n,canonicalQuestionId:row.canonicalQuestionId,accountingAction:row.accountingAction,disposition:status,answerReviewReference:`content/audits/nda-2024-ii-reasoned-review.json#${n}`,classification:{primary:c.path,additional:additionalPaths,rationale:c.rationale,secondPass:'Same AI reviewer fresh concept review: complete tested task, not incidental wording; target applicability reviewed separately.',approved:true},sourcePages:row.sourcePages,expectedBeforeRecordHash:row.expectedBeforeRecordHash,revision};
 slots.push(slot);
 if(status!=='reasoned-verified')continue;
 assert.ok(/^[ABCD]$/.test(review.effectiveAnswer));
 const context=row.sharedContext?.promptLines??[];
 const promptLines=[...context,...row.promptLines],sourceText=promptLines.join('\n');
 const figure=figureByNumber.get(n);assert.equal(Boolean(row.figure),Boolean(figure));
 const caveat=review.strongestCounterargument;
 const explanation=`Independently verified (primary-source reasoning; not an authenticated official key): ${review.effectiveAnswer} (${row.options[review.effectiveAnswer]}). ${review.secondPass.note}`;
 const q={...old,id:row.canonicalQuestionId,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2024,paper:'II',questionNumber:n,subject,topic:chapter,subtopic:subpart,taxonomyHead:head,taxonomyChapter:chapter,taxonomySubtopic:subpart,taxonomyId:paths.get(c.path)??null,taxonomyVersion:registry.version,difficulty:old?.difficulty??'Moderate',promptLines,options:row.options,answer:review.effectiveAnswer,explanation,requiresFigure:Boolean(figure),figureKey:figure?.asset??null,figureAlt:figure?.description??null,additionalPaths,preparationScope:c.scope,underlined:row.underlined??[],...(row.sharedContext?{sharedContext:row.sharedContext}:{}),classificationTags:[[143,144,145,146,147,148,150].includes(n)?'Event-based':'Static'],source:{...old?.source,dataset:'NDA II 2024 GAT, individual primary-source review',exam:'NDA',year:2024,paper:'II',questionNumber:n,originalPdf:register.sourceIdentity.originalPdfLocalPath,originalPdfSha256:register.sourceIdentity.originalPdfSha256,originalPage:row.page,originalPages:row.sourcePages,bookletSeries:'A',answerStatus:'reasoned-verified',answerEvidence:slot.answerReviewReference,primaryEvidence:[...review.evidence,...review.secondPass.extraEvidence],candidateKeyAuthenticated:false,optionsReordered:false,classificationRationale:c.rationale,secondPass:'Fresh pass by the same AI reviewer; not independent human review',reviewedAt:'2026-10-27',...(caveat?{firstPassCaution:caveat}:{}),...(row.sourceCaveat?{sourceCaveat:row.sourceCaveat}:{}),...(row.originalOptionLabels?{originalOptionLabels:row.originalOptionLabels}:{}),...(figure?{figureSha256:figure.sha256}:{} )}};
 if(old&&old.answer!==q.answer)keyRevisions[q.id]=(oldKeyRevisions[q.id]??0)+1;
 questions.push(q);
}
assert.equal(questions.length,136);assert.equal(slots.length,150);
assert.equal(questions.filter(q=>q.preparationScope==='english').length,46);
assert.equal(questions.filter(q=>q.preparationScope==='science').length,43);
const placements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:'Fresh same-AI concept/applicability review, source examination retained; no automatic CSE science transfer.'})));
const reconciliation={expected:150,newSourceOccurrences:128,reusedSourceOccurrences:22,duplicateAliases:0,answerReviewed:150,dispositions:{'official-final':0,'official-provisional':0,'reasoned-verified':136,withdrawn:0,duplicate:0,quarantined:14},eligible:136,newlyImportedEligible:questions.filter(q=>!before.has(q.id)).length,reusedEligible:questions.filter(q=>before.has(q.id)).length,sectionTotals:{english:46,science:43,gs:47},quarantinedNumbers:slots.filter(q=>q.disposition==='quarantined').map(q=>q.number)};
const outputs=[['content/nda-2024-ii-reviewed-paper.json',{version:1,paperId:'nda-2024-ii-gat',evidenceStatus:'Individual primary-source reasoning, fresh second pass; candidate official-key scan remains unauthenticated',baselines,questions}],['content/nda-2024-ii-review-policy.json',policy],['content/nda-2024-ii-key-revisions.json',keyRevisions],['content/nda-2024-ii-preparation-placements.json',placements],['content/audits/nda-2024-ii-review.json',{paperId:'nda-2024-ii-gat',sourceRegister:'content/audits/nda-2024-ii-paper-register.json',reconciliation,questionSlots:slots,releaseState:'local-verification-pending'}]];
for(const [path,value] of outputs){const bytes=JSON.stringify(value,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),bytes);else fs.writeFileSync(path,bytes);}
console.log(JSON.stringify(reconciliation));
