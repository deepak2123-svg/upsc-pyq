import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {cse2013Batch1} from './prelims-reviewed-cse-2013-batch-1.mjs';
import {cse2013Batch2} from './prelims-reviewed-cse-2013-batch-2.mjs';
import {cse2014Review} from './prelims-reviewed-cse-2014.mjs';
import {cse2015Review} from './prelims-reviewed-cse-2015.mjs';
import {cse2016Review} from './prelims-reviewed-cse-2016.mjs';
import {cse2017Review} from './prelims-reviewed-cse-2017.mjs';
import {cse2018Review} from './prelims-reviewed-cse-2018.mjs';
import {cse2019Review} from './prelims-reviewed-cse-2019.mjs';
import {cse2020Review} from './prelims-reviewed-cse-2020.mjs';
import {cse2021Review} from './prelims-reviewed-cse-2021.mjs';
import {cse2022Review} from './prelims-reviewed-cse-2022.mjs';
import {cse2023Review} from './prelims-reviewed-cse-2023.mjs';
import {cse2024Review} from './prelims-reviewed-cse-2024.mjs';
import {cse2025Batch1} from './prelims-reviewed-cse-2025-batch-1.mjs';
import {cse2025Batch2} from './prelims-reviewed-cse-2025-batch-2.mjs';
import {cse2026Review} from './prelims-reviewed-cse-2026.mjs';
import {capf2017Review} from './prelims-reviewed-capf-2017.mjs';
import {capf2018Review} from './prelims-reviewed-capf-2018.mjs';
import {capf2019Review} from './prelims-reviewed-capf-2019.mjs';
import {capf2020Review} from './prelims-reviewed-capf-2020.mjs';
import {capf2021Review} from './prelims-reviewed-capf-2021.mjs';
import {capf2022Review} from './prelims-reviewed-capf-2022.mjs';
import {capf2023Review} from './prelims-reviewed-capf-2023.mjs';
import {capf2024Review} from './prelims-reviewed-capf-2024.mjs';
import {capf2025Review} from './prelims-reviewed-capf-2025.mjs';
import {capf2026Review} from './prelims-reviewed-capf-2026.mjs';
import {cds2014Session1} from './prelims-reviewed-cds-2014-1.mjs';
import {cds2014Session2} from './prelims-reviewed-cds-2014-2.mjs';
import {cds2015Session1} from './prelims-reviewed-cds-2015-1.mjs';
import {cds2015Session2} from './prelims-reviewed-cds-2015-2.mjs';
import {cds2016Session1} from './prelims-reviewed-cds-2016-1.mjs';
import {cds2016Session2} from './prelims-reviewed-cds-2016-2.mjs';
import {cds2017Session1} from './prelims-reviewed-cds-2017-1.mjs';
import {cds2017Session2} from './prelims-reviewed-cds-2017-2.mjs';
import {cds2018Session1} from './prelims-reviewed-cds-2018-1.mjs';
import {nda2014SessionI} from './prelims-reviewed-nda-2014-i.mjs';
import {nda2014SessionII} from './prelims-reviewed-nda-2014-ii.mjs';
import {nda2015SessionI} from './prelims-reviewed-nda-2015-i.mjs';
import {nda2015SessionII} from './prelims-reviewed-nda-2015-ii.mjs';
import {nda2016SessionI} from './prelims-reviewed-nda-2016-i.mjs';
import {nda2016SessionII} from './prelims-reviewed-nda-2016-ii.mjs';
import {nda2017SessionI} from './prelims-reviewed-nda-2017-i.mjs';
import {nda2017SessionII} from './prelims-reviewed-nda-2017-ii.mjs';
import {nda2018SessionI,nda2018SessionII} from './prelims-reviewed-nda-2018.mjs';
import {nda2019SessionI,nda2019SessionII} from './prelims-reviewed-nda-2019.mjs';
import {nda2020Combined} from './prelims-reviewed-nda-2020.mjs';
import {nda2021SessionI,nda2021SessionII} from './prelims-reviewed-nda-2021.mjs';
import {nda2022SessionI,nda2022SessionII} from './prelims-reviewed-nda-2022.mjs';
import {nda2023SessionI,nda2023SessionII} from './prelims-reviewed-nda-2023.mjs';
import {nda2024SessionI,nda2024SessionII} from './prelims-reviewed-nda-2024.mjs';
import {nda2025SessionI,nda2025SessionII} from './prelims-reviewed-nda-2025.mjs';
import {nda2026SessionI} from './prelims-reviewed-nda-2026.mjs';

const read = name => JSON.parse(fs.readFileSync(name,'utf8'));
const hash = value => crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json');
const rawBank=read('content/question-bank.json').questions;
const frozenCohort=read('content/taxonomy/prelims-classification-register.json');
assert.equal(hash(fs.readFileSync('content/question-bank.json','utf8')),frozenCohort.baselineBankSha256,'Historical bank changed; review and migrate the frozen classification baseline explicitly.');
assert.equal(hash(fs.readFileSync('content/taxonomy/physical-geography-v1.2-review.json','utf8')),'fe554233fa3c3a3d565b435aab5fba67d1852cc2b23f6b488fda6fad4e9f8d7f','Preserved Physical Geography review changed unexpectedly.');
const imports=read('content/reviewed-prelims-imports.json');
const completeNda=read('content/nda-2026-i-official-paper.json');
const completeNdaII=read('content/nda-2026-ii-official-paper.json');
const completeNda2025II=read('content/nda-2025-ii-official-paper.json');
const originalIds=new Set([...rawBank,...imports.questions].map(q=>q.id));
const completeNdaNew=[...completeNda.questions,...completeNdaII.questions,...completeNda2025II.questions].filter(q=>!originalIds.has(q.id));
const bank=new Map([...rawBank,...imports.questions].map(q=>[q.id,q]));
for(const q of completeNdaNew)bank.set(q.id,q);
const answerReview=read('content/question-review-state.json').records;
const physical=read('content/taxonomy/physical-geography-v1.2-review.json');
const pilot=read('content/taxonomy/prelims-classification-pilot.json');
const nodeById=new Map(registry.nodes.map(n=>[n.id,n]));
const leaves=registry.nodes.filter(n=>n.kind==='subpart');
const labelsFor=id=>{const labels=[];let node=nodeById.get(id);while(node){labels.unshift(node.label);node=nodeById.get(node.parentId);}return labels;};
const byPath=new Map(leaves.map(n=>[labelsFor(n.id).join('/'),n.id]));
const byPhysical=new Map(leaves.filter(n=>n.legacyTaxonomyId).map(n=>[n.legacyTaxonomyId,n.id]));
const resolve=path=>{assert.ok(byPath.has(path),`Unknown reviewed path: ${path}`);return byPath.get(path);};
const records=new Map();
function approved(questionId,primaryId,additionalIds,basis,rationale,secondPass,tags=[],extra={}) {
  assert.ok(bank.has(questionId),`Unknown record: ${questionId}`);
  for(const id of [primaryId,...additionalIds]) assert.equal(nodeById.get(id)?.kind,'subpart',id);
  records.set(questionId,{questionId,expectedRecordHash:hash(bank.get(questionId)),primaryId,additionalIds:[...new Set(additionalIds)].filter(id=>id!==primaryId),status:'approved',basis,rationale,secondPass:{status:'approved',rationale:secondPass},tags,...extra});
}
for(const previous of physical.records) {
  const primaryId=byPhysical.get(previous.newTaxonomyId);
  assert.ok(primaryId,`Lost preserved Physical Geography leaf: ${previous.newTaxonomyId}`);
  if((answerReview[previous.questionId]?.contentRevision??0)>0) {
    records.set(previous.questionId,{questionId:previous.questionId,expectedRecordHash:hash(bank.get(previous.questionId)),primaryCandidate:primaryId,status:'pending',basis:'material-repair-after-physical-review',rationale:'Repaired source content needs a fresh classification comparison; do not automatically inherit the old approval.'});
    continue;
  }
  approved(previous.questionId,primaryId,[],'preserved-physical-v1.2-review',previous.reviewReason,
    'Migration check: existing reviewed primary ID resolves to the preserved chapter/subpart. No post-review material content repair is recorded. This is preservation, not a claim of a new original-paper review.',[],
    {previousReview:{file:'content/taxonomy/physical-geography-v1.2-review.json',version:physical.version,status:previous.reviewStatus,legacyId:previous.newTaxonomyId}});
}

// The entire stem and every option were reread in the second pass. Corrections
// below are explicit editorial decisions, not automated keyword inference.
const changes={
  'cse-2022-gs-i-42':{primary:'Environment & Ecology/Environmental Governance/International Framework/Environmental organisations and initiatives',reason:'Second pass: Climate Group and its networks are initiatives, not an assessment agency. Retain mitigation as a second tested concept.'},
  'cse-2023-gs-i-23':{primary:'Environment & Ecology/Environmental Governance/International Framework/Environmental organisations and initiatives',additional:['Environment & Ecology/Biodiversity/Species and Relationships/Invasive species'],reason:'Second pass: the accepted task is identifying the parent organisation of a named invasive-species specialist group. Give institutional ownership primacy; retain the specialist invasive-species home.'},
  'cse-2025-gs-i-35':{primary:'Current Affairs/Economy & Development/Finance and Economic Policy/Nature and climate finance initiatives',additional:['Environment & Ecology/Climate Change/Climate Responses/Climate finance'],reason:'Second pass: a newly launched nature-finance hub is not generic financial regulation. Use the new bounded nature/climate-finance initiative leaf; institution names are alternative sponsors, not additional placements.'},
  'cse-2025-gs-i-90':{primary:'Current Affairs/Environment & Geography/Climate and Conservation Developments/Environmental policy',additional:['Environment & Ecology/Conservation/Conservation Programmes/Ecosystem restoration'],reason:'Second pass: Nature Restoration Law is ecosystem-wide, not exclusively forest restoration. The explicit restoration leaf resolves the first-pass scope defect.'},
};
for(const candidate of pilot.records) {
  const question=bank.get(candidate.questionId);
  assert.equal(hash(question),candidate.expectedRecordHash,`Question changed since first pass: ${candidate.questionId}`);
  const change=changes[candidate.questionId];
  const primary=change?.primary?resolve(change.primary):candidate.primaryCandidate;
  const additional=change?.additional?change.additional.map(resolve):candidate.additionalCandidates;
  assert.ok(primary,`Unresolved pilot gap: ${candidate.questionId}`);
  approved(candidate.questionId,primary,additional,'complete-stem-and-options-second-pass',change?.reason??candidate.rationale,
    change?.reason??'Second pass: complete stem and all four options compared with the proposed leaf boundaries; primary ownership and each additional placement test material concepts. No answer or event date inferred from exam year.',candidate.tags,
    {firstPassEvidence:{file:'content/taxonomy/prelims-classification-pilot.json',status:candidate.firstPassStatus,rationale:candidate.rationale},...(candidate.eventDate?{eventDate:candidate.eventDate,eventDateEvidence:candidate.eventDateEvidence}:{})});
}
approved('nda-2025-i-86',resolve('Geography/Physical Geography/Latitudes, Longitudes, Time and Motions of the Earth/The Grid: Latitudes and Longitudes'),[],
  'complete-stem-after-material-repair','The repaired stem and all four options ask about meridians, parallels and great circles. The correct concept home is the geographical grid, independently of the unresolved official answer convention.',
  'Second pass reread the complete repaired stem: Prime Meridian, Tropic of Cancer and Equator identify the grid subpart, not Earth rotation or seasons. Approve placement only; retain the existing quarantined answer disposition and exclusion from new scored tests.',['Static'],
  {materialRepairReviewed:true,answerEligibilityUnchanged:true});
approved('cse-2014-gs-i-68',resolve('Science & Technology/Space/Space Programmes/International missions'),[],
  'complete-stem-and-options-second-pass','The three pairs test Cassini-Huygens, Messenger and Voyager mission purposes. It is space-programme knowledge rather than a broad Geography bucket.',
  'Second pass: all three named missions and the four combination options concern programme objectives; no separate geography placement is needed.',['Static']);
approved('cse-2020-gs-i-10',resolve('International Relations & Organisations/Agreements & Global Governance/International Cooperation/Agreements and initiatives by mandate'),
  [resolve('Social Development/Health & Nutrition/Public Health/Health systems'),resolve('Environment & Ecology/Environmental Governance/International Framework/Climate conventions')],
  'complete-stem-and-options-second-pass','The four agreement/setup-to-subject pairs test mandates. Alma-Ata healthcare and climate-governance initiatives are directly tested, supporting the two subject homes.',
  'Second pass: distinguish a genuine mandate-matching question from a named-location mention. Healthcare delivery and climate institutional process are explicit propositions; do not classify it as news or infer an event date.',['Static']);
for(const place of imports.placements) {
  const subject=place.subject==='Polity'?'Polity & Governance':place.subject;
  approved(place.questionId,resolve([subject,place.taxonomyHead,place.topic,place.subtopic].join('/')),[],'original-page-reviewed-existing-reuse',place.rationale,place.secondPass,['Static']);
}
for(const question of imports.questions) {
  const subject=question.subject==='Polity'?'Polity & Governance':question.subject;
  approved(question.id,resolve([subject,question.taxonomyHead,question.topic,question.subtopic].join('/')),
    (question.additionalPaths||[]).map(p=>resolve([p.subject,p.head,p.chapter,p.subtopic].join('/'))),
    'original-page-and-key-reviewed-import',question.source.classificationRationale,question.source.secondPass,question.classificationTags??['Static']);
}
const editorialBatches=[
  ['CSE/2013/GS-I/existing-1',cse2013Batch1],['CSE/2013/GS-I/existing-2',cse2013Batch2],
  ['CSE/2014/GS-I/existing-1',cse2014Review],['CSE/2015/GS-I/existing-1',cse2015Review],
  ['CSE/2016/GS-I/existing-1',cse2016Review],['CSE/2017/GS-I/existing-1',cse2017Review],
  ['CSE/2018/GS-I/existing-1',cse2018Review],['CSE/2019/GS-I/existing-1',cse2019Review],
  ['CSE/2020/GS-I/existing-1',cse2020Review],['CSE/2021/GS-I/existing-1',cse2021Review],
  ['CSE/2022/GS-I/existing-1',cse2022Review],['CSE/2023/GS-I/existing-1',cse2023Review],
  ['CSE/2024/GS-I/existing-1',cse2024Review],
  ['CSE/2025/GS-I/existing-1',cse2025Batch1],
  ['CSE/2025/GS-I/existing-2',cse2025Batch2],
  ['CSE/2026/GS-I/existing-1',cse2026Review],
  ['CAPF/2017/I/existing-1',capf2017Review],
  ['CAPF/2018/I/existing-1',capf2018Review],
  ['CAPF/2019/I/existing-1',capf2019Review],
  ['CAPF/2020/I/existing-1',capf2020Review],
  ['CAPF/2021/I/existing-1',capf2021Review],
  ['CAPF/2022/I/existing-1',capf2022Review],
  ['CAPF/2023/I/existing-1',capf2023Review],
  ['CAPF/2024/I/existing-1',capf2024Review],
  ['CAPF/2025/I/existing-1',capf2025Review],
  ['CAPF/2026/I/existing-1',capf2026Review],
  ['CDS/2014/1/existing-1',cds2014Session1],
  ['CDS/2014/2/existing-1',cds2014Session2],
  ['CDS/2015/1/existing-1',cds2015Session1],
  ['CDS/2015/2/existing-1',cds2015Session2],
  ['CDS/2016/1/existing-1',cds2016Session1],
  ['CDS/2016/2/existing-1',cds2016Session2],
  ['CDS/2017/1/existing-1',cds2017Session1],
  ['CDS/2017/2/existing-1',cds2017Session2],
  ['CDS/2018/1/existing-1',cds2018Session1],
  ['NDA/2014/I/existing-1',nda2014SessionI],
  ['NDA/2014/II/existing-1',nda2014SessionII],
  ['NDA/2015/I/existing-1',nda2015SessionI],
  ['NDA/2015/II/existing-1',nda2015SessionII],
  ['NDA/2016/I/existing-1',nda2016SessionI],
  ['NDA/2016/II/existing-1',nda2016SessionII],
  ['NDA/2017/I/existing-1',nda2017SessionI],
  ['NDA/2017/II/existing-1',nda2017SessionII],
  ['NDA/2018/I/existing-1',nda2018SessionI],
  ['NDA/2018/II/existing-1',nda2018SessionII],
  ['NDA/2019/I/existing-1',nda2019SessionI],
  ['NDA/2019/II/existing-1',nda2019SessionII],
  ['NDA/2020/I/II/existing-1',nda2020Combined],
  ['NDA/2021/I/existing-1',nda2021SessionI],
  ['NDA/2021/II/existing-1',nda2021SessionII],
  ['NDA/2022/I/existing-1',nda2022SessionI],
  ['NDA/2022/II/existing-1',nda2022SessionII],
  ['NDA/2023/I/existing-1',nda2023SessionI],
  ['NDA/2023/II/existing-1',nda2023SessionII],
  ['NDA/2024/I/existing-1',nda2024SessionI],
  ['NDA/2024/II/existing-1',nda2024SessionII],
  ['NDA/2025/I/existing-1',nda2025SessionI],
  ['NDA/2025/II/existing-1',nda2025SessionII],
  ['NDA/2026/I/existing-1',nda2026SessionI],
];
for(const [batch,decisions] of editorialBatches) {
assert.ok(decisions.length<=50,`Review batch exceeds 50 records: ${batch}`);
const [exam,year,...identityTail]=batch.split('/');
const paper=identityTail.slice(0,-1).join('/');
assert.ok(['CSE','CAPF','CDS','NDA'].includes(exam),`Unregistered editorial exam: ${exam}`);
assert.ok(exam==='NDA'?['I','II','I/II'].includes(paper):exam==='CDS'?['1','2'].includes(paper):paper===(exam==='CSE'?'GS-I':'I'),`Unexpected editorial paper: ${batch}`);
if(exam==='NDA'&&paper==='I/II')assert.equal(year,'2020','Only the recorded combined 2020 NDA paper uses I/II');
for(const [id,primary,additional,rationale,secondPass,tags=['Static'],extra={}] of decisions) {
  assert.equal(bank.get(id)?.exam,exam);
  assert.equal(bank.get(id)?.year,Number(year));
  assert.equal(bank.get(id)?.paper,paper);
  approved(id,resolve(primary),additional.map(resolve),'complete-stem-and-options-second-pass',rationale,secondPass,tags,
    {...extra,editorialBatch:batch,answerEligibilityUnchanged:true});
}
}
for(const question of rawBank.filter(q=>q.subject==='English')) {
  records.set(question.id,{questionId:question.id,expectedRecordHash:hash(question),status:'out-of-scope',basis:'complete-stem-and-options-scope-review',scopeReason:'English language is outside this GS phase.',rationale:'Complete question and options test vocabulary, idiom, grammatical completion or sentence ordering. A reference to a constitution, economy or civil service does not turn the language task into GS.',secondPass:{status:'approved',rationale:'All ten English-labelled records reread in full, including the paragraph-ordering and fill-in-the-blank options. Keep historical grading available; exclude only from new GS selections.'}});
}
// Verified preparation-only topics do not silently become CSE GS topics.
for(const q of completeNdaNew){
 if(q.preparationScope==='gs')approved(q.id,resolve([q.subject,q.taxonomyHead,q.topic,q.subtopic].join('/')),(q.additionalPaths??[]).map(p=>resolve([p.subject,p.head,p.chapter,p.subtopic].join('/'))), 'official-complete-paper-second-pass',q.source.classificationRationale,q.source.secondPass,q.classificationTags??['Static']);
 else records.set(q.id,{questionId:q.id,expectedRecordHash:hash(q),status:'out-of-scope',basis:'verified-preparation-only-scope',scopeReason:'Verified for NDA/CDS preparation; outside the CSE GS syllabus projection.',rationale:q.source.classificationRationale,secondPass:{status:'approved',rationale:q.source.secondPass}});
}
for(const q of completeNdaII.questions.filter(q=>q.preparationScope==='defence-world-history')){
 records.set(q.id,{questionId:q.id,expectedRecordHash:hash(bank.get(q.id)),status:'out-of-scope',basis:'verified-preparation-only-scope',scopeReason:'Verified World History for NDA/CDS, not automatically CSE GS.',rationale:q.source.classificationRationale,secondPass:{status:'approved',rationale:q.source.secondPass}});
}
for(const q of completeNda2025II.questions){
 const baseline=bank.get(q.id);
 if(q.preparationScope==='gs')approved(q.id,resolve([q.subject,q.taxonomyHead,q.topic,q.subtopic].join('/')),(q.additionalPaths??[]).map(p=>resolve([p.subject,p.head,p.chapter,p.subtopic].join('/'))),'nda-2025-ii-complete-source-review',q.source.classificationRationale,'Fresh original-page second pass and reviewed concept boundaries; see content/audits/nda-2025-ii-review.json.',q.classificationTags);
 else records.set(q.id,{questionId:q.id,expectedRecordHash:hash(baseline),status:'out-of-scope',basis:'verified-preparation-only-scope',scopeReason:'NDA/CDS English or school Science; not automatically CSE GS.',rationale:q.source.classificationRationale,secondPass:{status:'approved',rationale:'Fresh complete source reread with explicit preparation boundaries; see paper review ledger.'}});
}
// Explicit category cross-listing requested by the editor. Existing reviewed
// Current Affairs placements are retained; no raw question, primary placement,
// source verification decision or answer eligibility is changed.
for (const record of records.values()) {
  if (record.status !== 'approved') continue;
  const sourceIds = [record.primaryId, ...record.additionalIds].filter(id => id.startsWith('syllabus:current-affairs/economy-development/'));
  if (!sourceIds.length) continue;
  const sharedIds = sourceIds.map(id => id.replace('syllabus:current-affairs/economy-development/', 'syllabus:economy/current-affairs/'));
  for (const id of sharedIds) assert.equal(nodeById.get(id)?.kind, 'subpart', `Missing Economy cross-list: ${id}`);
  record.additionalIds = [...new Set([...record.additionalIds, ...sharedIds])];
  record.sharedEconomyCurrentAffairs = {sourceIds, additionalIds: sharedIds, basis: 'editor-requested-shared-category', rationale: 'Also browse the approved Economy & Development current-affairs category from Economy. Retain canonical IDs, original placements and independent verification eligibility.'};
}
const rows=[...records.values()].sort((a,b)=>a.questionId.localeCompare(b.questionId));
const coverage=new Set(rows.filter(r=>r.status==='approved').flatMap(r=>[r.primaryId,...r.additionalIds].map(id=>labelsFor(id)[0])));
assert.equal(coverage.size,9,'Pilot must include material placements in all nine subjects');
const output={version:1,taxonomyVersion:registry.version,status:'partially-applied-reviewed-placement-ledger-full-corpus-incomplete',active:true,
  rules:{sourceAndAnswerUnchanged:true,verificationEligibilityIndependent:true,preservedReviewsNotFreshSourceReviews:true},
  pilotSubjects:[...coverage].sort(),records:rows};
const file='content/taxonomy/prelims-reviewed-placements.json';
const bytes=`${JSON.stringify(output,null,2)}\n`;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Stale reviewed placement ledger');
else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==bytes)fs.writeFileSync(file,bytes);
const scopePolicy=Object.fromEntries(rows.filter(row=>row.status==='out-of-scope').map(row=>[row.questionId,{inGsScope:false,reason:row.scopeReason}]));
const scopeFile='content/prelims-gs-scope-policy.json';
const scopeBytes=`${JSON.stringify(scopePolicy,null,2)}\n`;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(scopeFile,'utf8'),scopeBytes);
else if(!fs.existsSync(scopeFile)||fs.readFileSync(scopeFile,'utf8')!==scopeBytes)fs.writeFileSync(scopeFile,scopeBytes);
console.log(JSON.stringify({records:rows.length,approved:rows.filter(r=>r.status==='approved').length,preserved:rows.filter(r=>r.basis==='preserved-physical-v1.2-review').length,freshReviewed:rows.filter(r=>r.status==='approved'&&r.basis!=='preserved-physical-v1.2-review').length,pendingAfterRepair:rows.filter(r=>r.status==='pending').length,outOfScope:rows.filter(r=>r.status==='out-of-scope').length,pilotSubjects:coverage.size}));
