import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {nda2026IEnglish} from './nda-2026-i-english-transcription.mjs';
import {nda2026IGsFinal} from './nda-2026-i-gs-final-transcription.mjs';
import {nda2026IBatch1} from './prelims-nda-2026-i-review-batch-1.mjs';
import {nda2026IBatch2} from './prelims-nda-2026-i-review-batch-2.mjs';
import {officialNda2026IKey as key,officialNda2026IKeyEvidence as evidence} from './nda-2026-i-official-key.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const originalHash='1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930';
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
const raw=read('content/question-bank.json').questions,imports=read('content/reviewed-prelims-imports.json').questions;
const existing=[...raw,...imports].filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='I');
assert.equal(existing.length,63);assert.equal(new Set(existing.map(q=>q.questionNumber)).size,63);
const oldByNumber=new Map(existing.map(q=>[q.questionNumber,q]));
const priorPolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-question-alias-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const priorKeyRevisions=read('content/answer-key-revisions.json');
const pages=read('content/nda-2026-i-source-pages.json');
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json');
const nodeById=new Map(registry.nodes.map(n=>[n.id,n]));
const labelPath=id=>{let n=nodeById.get(id),out=[];while(n){out.unshift(n.label);n=nodeById.get(n.parentId);}return out.join('/');};
const validPaths=new Set(registry.nodes.filter(n=>n.kind==='subpart').map(n=>labelPath(n.id)));
const idByPath=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>[labelPath(n.id),n.id]));
const approved=new Map(read('content/taxonomy/prelims-reviewed-placements.json').records.filter(r=>r.status==='approved').map(r=>[r.questionId,r]));
const staged=new Map([...nda2026IEnglish,...nda2026IBatch1.map(r=>({...r,path:r.placement})),...nda2026IBatch2.map(r=>({...r,path:r.placement})),...nda2026IGsFinal].map(r=>[r.number,r]));
assert.equal(staged.size,126); // The remaining 24 source occurrences are preserved existing records.
const notes={
 58:'Official provisional key A supersedes our previously published reasoned C. The printed moving-frame wording raises a Galilean kinetic-energy-change objection; that disagreement is recorded rather than silently substituting our answer for UPSC’s examination answer.',
 60:'The official proportionality assumes the usual rest-start model. Without that assumption constant power gives v²=v₀²+2Pt/m. Original wording is retained.',
 64:'The official answer is retained for the examination; image motion requires care about the object’s domain relative to the centre and focus.',
 68:'The official answer is retained; the printed liquid/periscope geometry is not further specified.',
 73:'Official provisional key D supersedes our previously published reasoned C. All four original diagram choices retain their original labels; no option-letter remapping has been invented.',
 75:'UPSC accepts 40 m/s. The original graph gives an impulse of 400 N s and Δv=40 m/s for 10 kg; the printed moving-object stem does not state the initial speed. This caveat does not change UPSC’s published provisional examination answer.',
 88:'The printed statement II reverses the usual causal description of catenation/isomerism and organic-compound diversity. UPSC nevertheless provisionally accepts all three statements, D. The source wording has not been silently repaired.',
 95:'UPSC accepts II only, B, using the generic-cell convention. The literal all-cells assertion has mature mammalian erythrocyte exceptions. The official examination answer and this scientific caveat are distinct.',
};
const layoutOnly={
 111:['Consider the following pairs:','Types of Chemical Weathering | Characteristics','I. Solution | Results in leaching of minerals','II. Carbonation | Helps in breaking down feldspars','III. Hydration | Causes an increase in the volume of rocks','IV. Oxidation | Changes the colour of rocks','How many pairs given above are correctly matched?'],
 120:['Consider the following pairs:','Layers of Atmosphere | Characteristics','I. Troposphere | Absorbs ultraviolet radiation','II. Stratosphere | Changes in weather and climate','III. Mesosphere | Reflects radio waves back to the Earth','How many of the pairs given above are correctly matched?'],
 139:['With reference to the territorial jurisdictions of High Courts in India, consider the following pairs:','High Courts | Territorial Jurisdictions','I. Calcutta High Court | Lakshadweep','II. Madras High Court | Puducherry','III. Gauhati High Court | Manipur','IV. Kerala High Court | Andaman and Nicobar Islands','How many of the pairs given above are correctly matched?'],
};
const baselines=Object.fromEntries(existing.map(q=>[q.id,{sha256:hash(q),answer:q.answer,contentRevision:priorPolicy[q.id]?.contentRevision??0,reviewRevision:priorPolicy[q.id]?.revision??0}]));
const resultFile='content/nda-2026-i-official-paper.json';
if(fs.existsSync(resultFile))assert.deepEqual(read(resultFile).baselines,baselines,'An existing record changed since the official-paper review. Stop; do not overwrite it.');
const questions=Array.from({length:150},(_,i)=>{
 const number=i+1,old=oldByNumber.get(number),draft=staged.get(number);
 assert.ok(old||draft,`Missing source question ${number}`);
 const previousPlacement=old?approved.get(old.id):null;
 const path=previousPlacement?labelPath(previousPlacement.primaryId):draft?.path;
 assert.ok(path,`Missing reviewed syllabus path Q${number}`);
 const scope=number<=50?'english':path.startsWith('History/World History/')?'defence-world-history':'gs';
 if(scope==='gs')assert.ok(validPaths.has(path),`Unknown syllabus path Q${number}: ${path}`);
 const [subject,head,topic,subtopic]=path.split('/');assert.ok(subtopic);
 const promptLines=layoutOnly[number]??old?.promptLines??draft.promptLines,options=old?.options??draft.options;
 assert.deepEqual(Object.keys(options),['A','B','C','D']);assert.ok(options[key[number]]);
 const note=notes[number]??draft?.note??null;
 const unchangedReasoning=draft?.proposedAnswer===key[number]?draft.reasoning:null;
 const explanation=`Official UPSC provisional key, released 16 April 2026: Series A Q${number} accepts ${key[number]} (${options[key[number]]}). Subject to revision by UPSC.${unchangedReasoning?' '+unchangedReasoning:''}${note?' Editorial caveat: '+note:''}`;
 const sourceText=old?.sourceText??promptLines.join(' ');
 const figureNumber=[72,73,74,75].includes(number)?number:null;
 const source={...(old?.source??{}),dataset:'Complete NDA I 2026 GAT, official provisional key',exam:'NDA',year:2026,paper:'I',questionNumber:number,
  originalPdf:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf',originalPdfSha256:originalHash,
  originalPage:pages.pages.find(p=>number>=p.first&&number<=p.last).page,bookletSeries:'A',answerStatus:'official-provisional',answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,
  officialAnswer:key[number],displayedAnswer:key[number],optionsReordered:false,
  reproductionReview:'Original Series A page compared visually: complete stem, all statements, original A–D options, directions, underlining and any required figures. Existing canonical IDs and stored original wording preserved.',
  secondPass:'Separate reread of the original source page and all options; official page-1 cell checked in independent column-first and row-first transcriptions, which agree for all 150 numbers.',
  classificationRationale:`The complete task tests ${subtopic} within ${head} / ${topic}; ${scope==='gs'?'existing reviewed GS concept registry':'explicit NDA/CDS preparation branch, not automatic CSE applicability'}.`,
  reviewedAt:'2026-10-25',...(note?{editorialCaveat:note}:{}),
  ...(figureNumber?{figureSha256:hash(fs.readFileSync(`public/figures/nda-2026-i/q${number}.png`))}:{}),
 };
 const record={...(old??{}),id:old?.id??`nda-2026-i-${number}`,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:old?.sourceTextHash??hash(sourceText),exam:'NDA',year:2026,paper:'I',questionNumber:number,
  subject,taxonomyHead:head,topic,subtopic,taxonomyChapter:topic,taxonomySubtopic:subtopic,difficulty:old?.difficulty??'Moderate',promptLines,options,answer:key[number],explanation,
  requiresFigure:Boolean(figureNumber),...(figureNumber?{figureKey:`/figures/nda-2026-i/q${number}.png`,figureAlt:old?.figureAlt??(number===75?'Original force–time graph: F rises from 0 to 20 N over 0–5 s, remains 20 N until 20 s, and falls to zero at 25 s. Both labelled axes and all printed ticks are preserved.':`Original diagram supplied with Series A question ${number}.`)}:{}),
  ...(draft?.underlined?.length?{underlined:draft.underlined}:{}),
  additionalPaths:old?.additionalPaths??(number===121?[{subject:'History',head:'Art & Culture',chapter:'Literature and Languages',subtopic:'Regional literature'}]:[]),source,preparationScope:scope,
  ...(scope==='gs'?{taxonomyId:previousPlacement?.primaryId??idByPath.get(path),taxonomyVersion:registry.version}:{}),
 };
 if(!old&&scope==='gs')record.classificationTags=[[144,147,149,150].includes(number)?'Event-based':'Static'];
 return record;
});
assert.equal(new Set(questions.map(q=>q.id)).size,150);
const policy=Object.fromEntries(questions.map(q=>[q.id,{...(priorPolicy[q.id]??{}),status:'official-provisional',revision:(priorPolicy[q.id]?.revision??0)+1,contentRevision:priorPolicy[q.id]?.contentRevision??0,preparationScope:q.preparationScope}]));
const keyRevisions=Object.fromEntries(questions.filter(q=>oldByNumber.has(q.questionNumber)&&q.answer!==oldByNumber.get(q.questionNumber).answer).map(q=>[q.id,(priorKeyRevisions[q.id]??0)+1]));
assert.deepEqual(Object.keys(keyRevisions).sort(),['nda-2026-i-58','nda-2026-i-73']);
const preparationPlacements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:q.source.secondPass})));
const ledger={version:2,status:'complete-official-provisional',reviewedAt:'2026-10-25',evidence:{originalPdfSha256:originalHash,officialKey:evidence},counts:{total:150,officialProvisional:150,officialFinal:0,dropped:0,newImports:87,reusedIds:63,english:50,science:50,gs:50},
 priorAuditCommit:'9f684be',answerChanges:Object.keys(keyRevisions).map(id=>({id,before:baselines[id].answer,after:questions.find(q=>q.id===id).answer,revision:keyRevisions[id],evidence:evidence.url})),
 records:questions.map(q=>({questionNumber:q.questionNumber,id:q.id,disposition:'official-provisional',sourcePage:q.source.originalPage,series:'A',officialAnswer:q.answer,displayedAnswer:q.answer,optionsReordered:false,editorialCaveat:q.source.editorialCaveat??null,sourceIdentity:'verified-original-cover',reproduction:'complete-original-page-and-options-reviewed',syllabusPath:[q.subject,q.taxonomyHead,q.topic,q.subtopic].join('/')}))};
for(const [file,value] of [[resultFile,{version:1,evidence,baselines,questions}],['content/nda-2026-i-official-review-policy.json',policy],['content/nda-2026-i-key-revisions.json',keyRevisions],['content/nda-2026-i-preparation-placements.json',preparationPlacements],['content/audits/nda-2026-i-review.json',ledger]]){
 const bytes=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,`Stale official-paper output ${file}`);
 else fs.writeFileSync(file,bytes);
}
console.log(JSON.stringify(ledger.counts));
