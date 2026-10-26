import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {nda2025IEnglish,directions,passage} from './nda-2025-i-english-transcription.mjs';
import {nda2025IPartB} from './nda-2025-i-part-b-transcription.mjs';
import {classifications} from './nda-2025-i-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const baseline=read('content/audits/nda-2025-i-source-baseline.json');
for(const [p,h]of Object.entries(baseline.sourceInputs))assert.equal(hash(fs.readFileSync(p)),h,`Reviewed source input changed: ${p}; review before re-freezing.`);
const signoff=read('content/audits/nda-2025-i-source-signoff.json');
for(const gate of ['reproductionFirstPass','reproductionSecondPass','classificationSecondPass'])assert.equal(signoff[gate],'approved');
const key=read('content/audits/nda-2025-i-key-transcriptions.json');
const answers=key.firstPassColumns.flatMap(s=>s.split(' ')),reread=[];
key.secondPassRows.forEach((line,i)=>line.split(' ').forEach((a,j)=>reread[j*20+i]=a));assert.deepEqual(answers,reread);assert.equal(answers.length,150);assert.ok(answers.every(a=>/^[ABCD]$/.test(a)));
const evidence={...key};delete evidence.firstPassColumns;delete evidence.secondPassRows;
evidence.asset='/papers/nda-2025-i-gat/official-final-key.pdf';evidence.session='I';evidence.subject='GAT';
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),key.sha256);assert.equal(signoff.keyPdfSha256,key.sha256);
const original={path:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2025-1.pdf',sha256:signoff.originalPdfSha256,pdfPages:48,series:'A',exam:'NDA',year:2025,session:'I',paper:'GAT',expectedNumbers:Array.from({length:150},(_,i)=>i+1)};
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
const raw=[...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions];
for(const b of baseline.rawBefore){const current=raw.find(q=>q.id===b.id);assert.ok(current);assert.equal(hash(current),b.sha256);assert.equal(hash(b.value),b.sha256);}
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json'),nodeMap=new Map(registry.nodes.map(n=>[n.id,n]));
const paths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const labels=[];let current=n;while(current){labels.unshift(current.label);current=nodeMap.get(current.parentId);}return[labels.join('/'),n.id];}));
const policyBase={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const sourceRows=[...nda2025IEnglish,...nda2025IPartB];assert.deepEqual(sourceRows.map(q=>q.number),original.expectedNumbers);
const caveats={
 3:'The official final cell accepts B. The passage itself says a few languages continue to be discovered; retain that wording and the official examination decision without claiming a stronger literal conclusion.',
 7:'The official final cell accepts the printed B construction. Its reporting expression is awkward; no alternative is silently rewritten into a different reported-speech question.',
 18:'The official key accepts D (inevitable). Imminent ordinarily concerns temporal nearness, not logical inevitability; retain the original alternatives and official nearest-option adjudication.',
 47:'The official key accepts B (a picnic). Other noun phrases can be grammatical with different prior context; no such extra context is inserted.',
 50:'The official key accepts D (shall), retaining the source’s traditional first-person future convention. Modern use of will is not silently substituted for the official decision.',
 87:'The source prints Amphibolite, a rock, rather than amphibole, a mineral. Official C is retained without silently changing the printed item.',
 91:'The source’s first statement says Coriolis force is perpendicular to pressure-gradient force. The familiar general relation is perpendicularity to velocity; the official C decision and both printed statements are retained separately from this caveat.',
 94:'Official B locates Mahendragiri in Odisha. The source’s highest-peak premise is problematic; it is retained rather than silently rewritten.',
 100:'The official key accepts B (Bokaro). The original bundle of foundation/collaboration, ore-region and power claims remains unchanged; the key establishes examination adjudication, not a repair of every historical premise.',
 102:'Official C is Sikkim in the preserved Series A option order. The previously reasoned A answer followed the ISFR percentage comparison; this disagreement is documented, but official scoring is not silently replaced.',
 103:'Official C accepts both surface-wave propositions. Real surface-wave speeds depend on the medium and wavelength; retain the source’s qualified “more or less” wording.',
 106:'The official key accepts pyruvate. The traditional muscle-cramps premise is preserved as printed, not presented as a resolution of current physiological debate.',
 129:'Official D uses the usual ideal long-solenoid interior-field model; the original alternatives and unqualified wording remain unchanged.',
 150:'Official C is zero. Uniform speed alone does not exclude acceleration when direction changes; no unstated straight-line condition is inserted.'
};
const baselines={};
const questions=sourceRows.map(row=>{
 const n=row.number,c=classifications[n];assert.ok(c);const old=raw.find(q=>q.exam==='NDA'&&q.year===2025&&q.paper==='I'&&q.questionNumber===n);
 if(old){assert.ok(baseline.rawBefore.some(b=>b.id===old.id));baselines[old.id]={sha256:hash(old),answer:old.answer,contentRevision:policyBase[old.id]?.contentRevision??0,reviewRevision:policyBase[old.id]?.revision??0};}
 const dir=directions.find(d=>n>=d.from&&n<=d.to),context=dir?[dir.text,...(n<=5?[passage]:[])]:[];
 const promptLines=[...context,...row.promptLines],sourceText=promptLines.join('\n');
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);const taxonomyId=paths.get(c.path);if(c.scope==='gs')assert.ok(taxonomyId,`Unknown GS path: ${c.path}`);
 const additionalPaths=c.additional.map(path=>{const [subject,head,chapter,subtopic]=path.split('/');assert.ok(paths.has(path));return{subject,head,chapter,subtopic,taxonomyId:paths.get(path)};});
 if(subject==='Current Affairs'&&head==='Economy & Development'){const mirror=['Economy','Current Affairs',chapter,subpart].join('/');assert.ok(paths.has(mirror));additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart,taxonomyId:paths.get(mirror)});}
 const underlined=n>=41&&n<=45?row.promptLines.map(s=>s.replace(/^[PQRS] : /,'')):row.underlined??[];
 const id=old?.id??`nda-2025-i-${n}`;assert.deepEqual(Object.keys(row.options),['A','B','C','D']);
 return {...old,id,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2025,paper:'I',questionNumber:n,subject,topic:chapter,subtopic:subpart,taxonomyHead:head,taxonomyChapter:chapter,taxonomySubtopic:subpart,taxonomyId,taxonomyVersion:registry.version,difficulty:old?.difficulty??'Moderate',promptLines,options:row.options,answer:answers[n-1],requiresFigure:false,additionalPaths,preparationScope:c.scope,underlined,
  ...(dir?{sharedContext:{id:`nda-2025-i-context-${dir.from}-${dir.to}`,label:n<=5?'Passage and instructions':'Instructions',promptLines:context}}:{}),
  classificationTags:[([58,117,118,120,121,122,125].includes(n))?'Event-based':'Static'],
  explanation:`Official UPSC final key, Series A Q${n}: ${answers[n-1]} (${row.options[answers[n-1]]}).${caveats[n]?' Editorial caveat: '+caveats[n]:''}`,
  source:{...old?.source,dataset:'Complete NDA I 2025 GAT, official final key',exam:'NDA',year:2025,paper:'I',questionNumber:n,originalPdf:original.path,originalPdfSha256:original.sha256,originalPage:row.page,originalPages:n<=5?[...new Set([2,row.page])]:[row.page],bookletSeries:'A',answerStatus:'official-final',answerSource:key.url,keySha256:key.sha256,keyPage:1,officialAcceptedOptions:[answers[n-1]],displayedAcceptedOptions:[answers[n-1]],optionsReordered:false,classificationRationale:c.rationale,secondPass:signoff.classificationMethod,reviewedAt:'2026-10-26',...(caveats[n]?{editorialCaveat:caveats[n]}:{})}
 };
});
assert.equal(questions.length,150);assert.equal(Object.keys(baselines).length,24);assert.equal(new Set(questions.map(q=>q.id)).size,150);
const policy=Object.fromEntries(questions.map(q=>[q.id,{status:'official-final',revision:(policyBase[q.id]?.revision??0)+1,contentRevision:policyBase[q.id]?.contentRevision??0,preparationScope:q.preparationScope}]));
// All 24 prior option sets retain their exact meaning/order. Q62 changes only
// printed ABCD column-code layout to explicit A-2/B-3 pairs; no material repair.
const normalize=(s,n)=>n===62?s.replace(/[ABCD,\-\s]/g,''):s.replace(/[’‘]/g,"'").replace(/\s/g,'');
for(const q of questions){const old=raw.find(r=>r.id===q.id);if(!old)continue;for(const a of ['A','B','C','D'])assert.equal(normalize(old.options[a],q.questionNumber),normalize(q.options[a],q.questionNumber),`Prior option materially changed ${q.id}/${a}`);}
const placements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod})));
const oldKeyRevisions=read('content/answer-key-revisions.json');
const keyRevisions=Object.fromEntries(questions.filter(q=>baselines[q.id]&&baselines[q.id].answer!==q.answer).map(q=>[q.id,(oldKeyRevisions[q.id]??0)+1]));
const reconciliation={expected:150,newSourceOccurrences:126,reusedSourceOccurrences:24,unresolvedSourceSlots:0,awaitingReviewCount:0,dispositionCounts:{'official-final':150,'official-provisional':0,'reasoned-verified':0,withdrawn:0,duplicate:0,quarantined:0},eligibleUniqueQuestionCount:150,sectionTotals:{english:50,science:49,gs:51}};
const slots=questions.map(q=>({printedQuestionNumber:q.questionNumber,canonicalQuestionId:q.id,sourcePages:q.source.originalPages,accountingAction:baselines[q.id]?'reused':'new',expectedBeforeRecordHash:baselines[q.id]?.sha256??null,finalDisposition:'official-final',reproduction:{status:'approved',sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),optionsReordered:false},classification:{status:'approved',primaryPath:classifications[q.questionNumber].path,rationale:q.source.classificationRationale,additional:q.additionalPaths,preparationScope:q.preparationScope},answerEvidence:{evidenceReference:'content/audits/nda-2025-i-key-transcriptions.json',keyPage:1,keySeries:'A',questionNumber:q.questionNumber,officialAcceptedOptions:[q.answer],displayedAcceptedOptions:[q.answer],optionTexts:[q.options[q.answer]],editorialCaveat:q.source.editorialCaveat??null},revision:policy[q.id]}));
const ledger={paperId:original.expectedNumbers&&'nda-2025-i-gat',workflowState:'source-review-complete',sourceIdentity:original,evidence,signoff,searchLog:baseline.searchLog,reconciliation,questionSlots:slots};
const register={paperId:ledger.paperId,workflowState:ledger.workflowState,sourceIdentity:original,expectedQuestionNumbers:original.expectedNumbers,questionSlots:slots.map(({printedQuestionNumber,canonicalQuestionId,sourcePages,accountingAction,finalDisposition,expectedBeforeRecordHash})=>({printedQuestionNumber,canonicalQuestionId,sourcePages,accountingAction,finalDisposition,expectedBeforeRecordHash,questionReviewReference:`content/audits/nda-2025-i-review.json#${printedQuestionNumber}`})),reconciliation,officialKeySearchLog:baseline.searchLog,officialKeyDocuments:[evidence],keyTranscription:{firstPassReference:'content/audits/nda-2025-i-key-transcriptions.json#firstPassColumns',secondPassReference:'content/audits/nda-2025-i-key-transcriptions.json#secondPassRows',comparisonResult:'all 150 cells agree; zero drops/multiple answers'},review:signoff,release:{reportReference:'docs/nda-2025-i-completion.md',state:'pending local/runtime/PDF/production gates'}};
for(const[file,value]of [['content/nda-2025-i-official-paper.json',{version:1,evidence,baselines,questions}],['content/nda-2025-i-official-review-policy.json',policy],['content/nda-2025-i-key-revisions.json',keyRevisions],['content/nda-2025-i-preparation-placements.json',placements],['content/audits/nda-2025-i-review.json',ledger],['content/audits/nda-2025-i-paper-register.json',register]]){const bytes=JSON.stringify(value,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes);else fs.writeFileSync(file,bytes);}
console.log(JSON.stringify(reconciliation));
