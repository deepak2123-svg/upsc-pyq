import test from 'node:test';
import {freezeSelectionMembership,restoreFrozenSelection} from '../lib/practice-draft-membership.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildSelectionIndex,restoreVersionedPaths,addScope,removeScope,selectionCounts,scopeDisplayNumber} from '../lib/practice-selection.ts';
const frozen=JSON.parse(fs.readFileSync('content/taxonomy/prelims-legacy-inventory.json')).inventory;
async function fetchWorker(url,init={}) {
  const {default:worker}=await import('../dist/server/index.js');
  return worker.fetch(new Request(`http://localhost${url}`,init),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
}
async function inventory(){return(await fetchWorker('/api/pyqs/inventory')).json();}
test('every syllabus chapter and subpart has stable section-local display numbering',async()=>{
 const data=await inventory(), index=buildSelectionIndex(data);
 for(const node of data.nodes.filter(n=>!n.legacyOnly)){
  if(node.kind==='topic')assert.equal(scopeDisplayNumber(node.id,index),`Chapter ${node.order}`);
  if(node.kind==='subtopic')assert.equal(scopeDisplayNumber(node.id,index),`${index.nodesById.get(node.parentId).order}.${node.order}`);
 }
});
async function snapshot(recipe){const response=await fetchWorker('/api/practice-snapshots',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(recipe)});return{response,body:await response.json()};}
test('working syllabus exposes all nine GS subjects, every empty subpart and precisely seven Current Affairs sections',async()=>{
  const data=await inventory();
  assert.equal(data.subjects.filter(s=>!s.legacyOnly).length,9);
  assert.ok(!data.subjects.some(s=>s.label==='English'));
  const ca=data.subjects.find(s=>s.label==='Current Affairs');
  const heads=data.nodes.filter(n=>n.parentId===ca.id&&!n.legacyOnly);
  assert.equal(heads.length,7);
  assert.ok(!heads.some(n=>/miscellaneous|general awareness|^other$/i.test(n.label)));
  const empty=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionCount===0);
  assert.ok(empty.length>0,'Unpopulated syllabus concepts must remain represented');
  const registry=JSON.parse(fs.readFileSync('content/taxonomy/upsc-prelims-v2-draft.json'));
  const sourceById=new Map(registry.nodes.map(node=>[node.id,node]));
  const liveById=new Map([...data.subjects,...data.nodes].map(node=>[node.id,node]));
  const fullPath=(node,index)=>{const labels=[];while(node){labels.unshift(node.label);node=index.get(node.parentId);}return labels.join('/');};
  assert.deepEqual(data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly).map(n=>fullPath(n,liveById)).sort(),registry.nodes.filter(n=>n.kind==='subpart').map(n=>fullPath(n,sourceById)).sort(),'Every registry leaf must remain visible, whether populated or empty');
  assert.ok(empty.every(n=>Object.values(n.questionIdsByExam).every(ids=>ids.length===0)));
});
test('Economy Current Affairs mirrors every approved economic current-affairs leaf without duplicate MCQs',async()=>{
  const data=await inventory(),index=buildSelectionIndex(data);
  const economy=data.subjects.find(s=>s.label==='Economy'),ca=data.subjects.find(s=>s.label==='Current Affairs');
  const source=data.nodes.find(n=>n.parentId===ca.id&&n.label==='Economy & Development'&&!n.legacyOnly);
  const target=data.nodes.find(n=>n.parentId===economy.id&&n.label==='Current Affairs'&&!n.legacyOnly);
  assert.ok(source&&target);
  const children=id=>data.nodes.filter(n=>n.parentId===id&&!n.legacyOnly);
  const sourceChapters=children(source.id),targetChapters=children(target.id);
  assert.deepEqual(targetChapters.map(n=>n.label),sourceChapters.map(n=>n.label));
  for(const sourceChapter of sourceChapters){
    const targetChapter=targetChapters.find(n=>n.label===sourceChapter.label);
    const sourceLeaves=children(sourceChapter.id),targetLeaves=children(targetChapter.id);
    assert.deepEqual(targetLeaves.map(n=>n.label),sourceLeaves.map(n=>n.label));
    for(const leaf of sourceLeaves){
      const mirror=targetLeaves.find(n=>n.label===leaf.label);
      for(const exam of ['CSE','CAPF','CDS','NDA'])assert.deepEqual([...mirror.questionIdsByExam[exam]].sort(),[...leaf.questionIdsByExam[exam]].sort());
    }
  }
  const sourcePaths=addScope({},source.id,index),both=addScope(sourcePaths,target.id,index);
  const membership=paths=>{const counts=selectionCounts(paths,index);return {matchingCount:counts.matchingCount,examTotals:counts.examTotals};};
  assert.deepEqual(membership(both),membership(sourcePaths));
  const remaining=removeScope(both,source.id,index);
  assert.deepEqual(membership(remaining),membership(sourcePaths));
  const selectedLeaves=Object.entries(both).filter(([,exams])=>exams.length);
  const result=await snapshot({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[ca.id,economy.id],paths:selectedLeaves.map(([subtopicId,exams])=>({subtopicId,exams})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  const ids=result.body.questions.map(q=>q.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.length,selectionCounts(sourcePaths,index).matchingCount);
  assert.equal(data.totalCount,1884,'Shared categories do not duplicate records; two NDA II World History questions are preparation-only');
});

test('older V4 and V3 scopes retain frozen membership after a question moves to another subject',async()=>{
  const data=await inventory();
  const old=frozen.nodes.find(n=>n.kind==='subtopic'&&n.questionIdsByExam.CSE.includes('cse-2022-gs-i-41'));
  const paths=[{subtopicId:old.id,exams:['CSE']}];
  const recipe={version:4,subjectIds:[old.subjectId],paths,count:'all',order:'newest'};
  const current=await snapshot(recipe);
  assert.equal(current.response.status,201,JSON.stringify(current.body));
  assert.deepEqual(current.body.questions.map(q=>q.id).sort(),[...old.questionIdsByExam.CSE].sort());
  const legacy=await snapshot({...recipe,version:3});
  assert.equal(legacy.response.status,201,JSON.stringify(legacy.body));
  assert.deepEqual(legacy.body.questions.map(q=>q.id).sort(),[...old.questionIdsByExam.CSE].sort());
  const scopeId=data.legacyRestoreAliases[old.id]||old.id;
  assert.equal(data.nodes.find(n=>n.id===scopeId).legacyOnly,true);
});
test('every saved pre-expansion leaf retains exact membership; migrated and new selections deduplicate together',async()=>{
  const data=await inventory();
  const nodes=new Map(data.nodes.map(n=>[n.id,n]));
  const outside=new Set(Object.keys(JSON.parse(fs.readFileSync('content/prelims-gs-scope-policy.json'))));
  const policy={...JSON.parse(fs.readFileSync('content/question-review-policy.json')),...JSON.parse(fs.readFileSync('content/prelims-question-alias-policy.json'))};
  const allowed=id=>!outside.has(id)&&(!policy[id]||['official-final','official-provisional','reasoned-verified'].includes(policy[id].status));
  for(const old of frozen.nodes.filter(n=>n.kind==='subtopic'))for(const exam of ['CSE','CAPF','CDS','NDA']) {
    const expected=old.questionIdsByExam[exam].filter(allowed).sort();
    const target=nodes.get(data.legacyRestoreAliases[old.id]||old.id);
    if(expected.length)assert.ok(target,old.id);
    assert.deepEqual([...(target?.questionIdsByExam?.[exam]||[])].sort(),expected,`${old.id}/${exam}`);
  }
  const old=frozen.nodes.find(n=>n.kind==='subtopic'&&n.questionIdsByExam.CSE.includes('cse-2022-gs-i-41'));
  const index=buildSelectionIndex(data);
  const restored=restoreVersionedPaths({[old.id]:['CSE']},index,data.legacyAliases,data.legacyRestoreAliases,true);
  const oldId=data.legacyRestoreAliases[old.id]||old.id;
  assert.equal(selectionCounts(restored,index).matchingCount,old.questionIdsByExam.CSE.filter(allowed).length);
  const current=data.nodes.find(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam.CSE.includes('cse-2022-gs-i-41'));
  const mixed=addScope(restored,current.id,index);
  const expected=new Set([...old.questionIdsByExam.CSE.filter(allowed),...Object.values(current.questionIdsByExam).flat()]);
  assert.equal(selectionCounts(mixed,index).matchingCount,expected.size);
  assert.equal(selectionCounts(removeScope(mixed,oldId,index),index).matchingCount,current.questionCount);
});
test('all current visible leaves produce the unique mapped pool with no held or out-of-scope records',async()=>{
  const data=await inventory();
  const paths=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionCount>0).map(n=>({subtopicId:n.id,exams:Object.keys(n.examCounts).filter(e=>n.examCounts[e]>0)}));
  const result=await snapshot({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:data.subjects.filter(s=>!s.legacyOnly).map(s=>s.id),paths,count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  assert.equal(result.body.matchingCount,data.mappedCount);
  const ids=result.body.questions.map(q=>q.id);
  assert.equal(new Set(ids).size,ids.length);
  const outside=new Set(Object.keys(JSON.parse(fs.readFileSync('content/prelims-gs-scope-policy.json'))));
  const review=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.ok(ids.every(id=>!outside.has(id)&&(!review[id]||['official-final','official-provisional','reasoned-verified'].includes(review[id].status))));
  assert.ok(result.body.questions.every(q=>!('answer'in q)&&!('correctOption'in q)));
});
test('review ledger checks hashes and separates preserved decisions, fresh passes and answer eligibility',()=>{
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const imports=JSON.parse(fs.readFileSync('content/reviewed-prelims-imports.json')).questions;
  const official=JSON.parse(fs.readFileSync('content/nda-2026-i-official-paper.json')).questions;
  official.push(...JSON.parse(fs.readFileSync('content/nda-2026-ii-official-paper.json')).questions);
  const oldIds=new Set([...bank,...imports].map(q=>q.id));
  const byId=new Map([...bank,...imports,...official.filter(q=>!oldIds.has(q.id))].map(q=>[q.id,q]));
  assert.equal(new Set(ledger.records.map(r=>r.questionId)).size,ledger.records.length);
  assert.equal(ledger.pilotSubjects.length,9);
  assert.equal(ledger.records.filter(r=>r.basis==='preserved-physical-v1.2-review').length,362);
  const repaired=ledger.records.find(r=>r.questionId==='nda-2025-i-86');
  assert.equal(repaired.status,'approved');
  assert.equal(repaired.materialRepairReviewed,true);
  assert.equal(repaired.answerEligibilityUnchanged,true);
  assert.equal(JSON.parse(fs.readFileSync('content/question-review-policy.json'))['nda-2025-i-86'].status,'quarantined');
  assert.equal(ledger.records.filter(r=>r.status==='out-of-scope').length,115);
  for(const r of ledger.records) {
    assert.ok(byId.has(r.questionId));
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(byId.get(r.questionId))).digest('hex'),r.expectedRecordHash,r.questionId);
    if(r.status==='approved')assert.equal(r.secondPass.status,'approved');
  }
});

test('GS scope exclusion never invalidates a previously saved verified English question',async()=>{
  const id='cds-2015-2015-2-41';
  const q=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id===id);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  const response=await fetchWorker('/api/practice/grade',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({questionIds:[id],answers:{[id]:q.answer},contentRevisions:{[id]:policy[id]?.contentRevision??0}})});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.scored,1);
  assert.equal(result.correct,1);
  assert.equal(result.excluded,0);
});

test('CSE 2013 existing-record review is complete without clearing the duplicate alias or changing keys',async()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const rows=new Map(ledger.records.map(r=>[r.questionId,r]));
  const cohort=bank.filter(q=>q.exam==='CSE'&&q.year===2013);
  assert.ok(cohort.length>40);
  assert.ok(cohort.every(q=>rows.get(q.id)?.status==='approved'));
  assert.equal(ledger.records.filter(r=>r.editorialBatch?.startsWith('CSE/2013/GS-I/')).length,39);
  assert.match(rows.get('cse-2013-gs-i-34').primaryId,/nutrient-cycles$/);
  assert.match(rows.get('cse-2013-gs-i-48').primaryId,/ecological-niche$/);
  assert.match(rows.get('cse-2013-gs-i-23').primaryId,/productivity$/);
  const data=await inventory();
  const visible=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly);
  assert.ok(visible.some(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-26')));
  assert.ok(visible.every(n=>!n.questionIdsByExam.CSE.includes('cds-2013-2013-26')));
  assert.equal(JSON.parse(fs.readFileSync('content/question-review-policy.json'))['cds-2013-2013-26'].status,'duplicate');
});

test('CSE 2014 complete-stem decisions use precise homes and retain original records',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const rows=new Map(ledger.records.map(r=>[r.questionId,r]));
  const cohort=bank.filter(q=>q.exam==='CSE'&&q.year===2014);
  assert.ok(cohort.length>45);
  assert.ok(cohort.every(q=>rows.get(q.id)?.status==='approved'));
  assert.equal(ledger.records.filter(r=>r.editorialBatch==='CSE/2014/GS-I/existing-1').length,46);
  assert.match(rows.get('cds-2014-2014-15').primaryId,/history\/modern-india-national-movement\/independence-and-integration\/partition$/);
  assert.match(rows.get('cse-2014-gs-i-35').primaryId,/polar-forums$/);
  assert.match(rows.get('cse-2014-gs-i-9').primaryId,/tiger-reserves$/);
  assert.ok(rows.get('cse-2014-gs-i-48').additionalIds.some(id=>id.endsWith('/north-eastern-hills')));
  assert.equal(rows.get('cse-2014-gs-i-4').additionalIds.length,0,'Ministry ownership alone does not test watershed science');
  assert.ok(ledger.records.filter(r=>r.editorialBatch==='CSE/2014/GS-I/existing-1').every(r=>r.answerEligibilityUnchanged));
});

test('CSE 2015 reviews preserve duplicate holds and distinguish an event from static news-location knowledge',async()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const rows=new Map(ledger.records.map(r=>[r.questionId,r]));
  const cohort=bank.filter(q=>q.exam==='CSE'&&q.year===2015);
  assert.ok(cohort.every(q=>rows.get(q.id)?.status==='approved'));
  assert.equal(ledger.records.filter(r=>r.editorialBatch==='CSE/2015/GS-I/existing-1').length,36);
  assert.deepEqual(rows.get('cse-2015-gs-i-43').tags,['Event-based']);
  assert.equal(rows.get('cse-2015-gs-i-43').eventDate,undefined);
  assert.deepEqual(rows.get('cse-2015-gs-i-33').tags,['Static']);
  const data=await inventory();
  const ids=new Set(data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly).flatMap(n=>Object.values(n.questionIdsByExam).flat()));
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  for(const number of [40,43,49,52]) {
    const canonical=`cse-2015-gs-i-${number}`,alias=`cds-2015-2015-${number}`;
    assert.deepEqual(rows.get(canonical).primaryId,rows.get(alias).primaryId);
    assert.deepEqual(rows.get(canonical).additionalIds,rows.get(alias).additionalIds);
    assert.equal(policy[alias].status,'duplicate');
    assert.ok(ids.has(canonical));assert.ok(!ids.has(alias));
  }
});

test('CSE 2016 entire existing cohort is classified with explicit events and unchanged answer holds',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const rows=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json')).records;
  const byId=new Map(rows.map(r=>[r.questionId,r]));
  assert.ok(bank.filter(q=>q.exam==='CSE'&&q.year===2016).every(q=>byId.get(q.id)?.status==='approved'));
  assert.equal(rows.filter(r=>r.editorialBatch==='CSE/2016/GS-I/existing-1').length,36);
  assert.match(byId.get('cds-2016-2016-25').primaryId,/civil-services$/);
  assert.match(byId.get('cds-2016-2016-51').primaryId,/international-ngos$/);
  assert.match(byId.get('cse-2016-gs-i-55').primaryId,/emissions-accounting$/);
  assert.deepEqual(byId.get('cse-2016-gs-i-45').tags,['Event-based']);
  assert.equal(byId.get('cse-2016-gs-i-45').eventDate,undefined);
  assert.equal(JSON.parse(fs.readFileSync('content/question-review-policy.json'))['cds-2016-2016-54'].status,'duplicate');
});

test('V4 exact-membership request does not expand when the current leaf has more questions',async()=>{
  const data=await inventory(),index=buildSelectionIndex(data);
  const leaf=data.nodes.find(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam.CSE.length>2);
  const old=freezeSelectionMembership({[leaf.id]:['CSE']},index);
  old[0].questionIdsByExam.CSE=old[0].questionIdsByExam.CSE.slice(0,1);
  const restored=restoreFrozenSelection(data,{[leaf.id]:['CSE']},old);
  const scopes=freezeSelectionMembership(restored.paths,buildSelectionIndex(restored.inventory));
  const recipe={version:4,taxonomyVersion:'a-prior-editorial-version',subjectIds:[leaf.subjectId],paths:Object.entries(restored.paths).map(([subtopicId,exams])=>({subtopicId,exams})),frozenScopes:scopes,count:'all',order:'newest'};
  const result=await snapshot(recipe);
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  assert.equal(result.body.matchingCount,1);
  assert.deepEqual(result.body.questions.map(q=>q.id),old[0].questionIdsByExam.CSE);
  assert.ok(!('answer'in result.body.questions[0]));
  assert.deepEqual(result.body.recipe.frozenScopes,scopes);
  const held=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  const badId=Object.keys(held).find(id=>held[id].status==='quarantined');
  const bad=structuredClone(recipe);bad.frozenScopes[0].questionIdsByExam.CSE=[badId];
  assert.equal((await snapshot(bad)).response.status,409);
  const wrongExam=structuredClone(recipe);wrongExam.frozenScopes[0].questionIdsByExam.CAPF=wrongExam.frozenScopes[0].questionIdsByExam.CSE;
  assert.equal((await snapshot(wrongExam)).response.status,400);
  const absent=structuredClone(recipe);absent.frozenScopes=[];
  assert.equal((await snapshot(absent)).response.status,400);
  const unpinned=structuredClone(recipe);unpinned.paths=[{subtopicId:leaf.id,exams:['CSE']}];unpinned.frozenScopes=[];
  assert.equal((await snapshot(unpinned)).response.status,400);
});

test('CSE 2021–2026 cohorts retain independent verification decisions and precise concept homes',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,count]of [[2021,31],[2022,32],[2023,41],[2024,38]]) {
    assert.ok(bank.filter(q=>q.exam==='CSE'&&q.year===year).every(q=>byId.get(q.id)?.status==='approved'),String(year));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CSE/${year}/GS-I/existing-1`).length,count);
  }
  assert.equal(ledger.records.filter(row=>row.editorialBatch==='CSE/2025/GS-I/existing-1').length,8);
  assert.equal(ledger.records.filter(row=>row.editorialBatch==='CSE/2025/GS-I/existing-2').length,32);
  assert.ok(bank.filter(q=>q.exam==='CSE'&&q.year===2025).every(q=>byId.get(q.id)?.status==='approved'));
  assert.equal(ledger.records.filter(row=>row.editorialBatch==='CSE/2026/GS-I/existing-1').length,30);
  assert.ok(bank.filter(q=>q.exam==='CSE').every(q=>byId.get(q.id)?.status==='approved'));
  assert.match(byId.get('cse-2026-gs-i-11').primaryId,/drainage-evolution$/);
  assert.match(byId.get('cse-2026-gs-i-83').primaryId,/industrial-developments$/);
  assert.equal(byId.get('cds-2026-2026-88').primaryId,byId.get('cse-2026-gs-i-38').primaryId);
  assert.equal(byId.get('cds-2026-2026-88').eventDate,'2025-06');
  assert.match(byId.get('cse-2025-gs-i-43').primaryId,/electrochemistry$/);
  assert.match(byId.get('cse-2025-gs-i-39').primaryId,/plant-morphology$/);
  assert.match(byId.get('cse-2025-gs-i-80').primaryId,/regions-and-countries$/);
  assert.ok(byId.get('cse-2025-gs-i-50').additionalIds.some(id=>id.endsWith('/surface-chemistry-and-adsorption')));
  assert.ok(byId.get('cds-2025-2025-55').additionalIds.some(id=>id.endsWith('/protection-from-exploitation')));
  assert.match(byId.get('cse-2025-gs-i-31').primaryId,/construction-materials$/);
  assert.ok(byId.get('cse-2025-gs-i-17').additionalIds.some(id=>id.endsWith('/himalayan-rivers')));
  assert.deepEqual(byId.get('cse-2025-gs-i-24').tags,['Event-based']);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy['cse-2024-gs-i-20'].status,'withdrawn');
  assert.equal(policy['cds-2023-2023-24'].status,'duplicate');
  assert.equal(policy['cds-2025-2025-21'].status,'duplicate');
  assert.equal(policy['cds-2025-2025-52'].status,'duplicate');
  assert.equal(policy['cds-2026-2026-88'].status,'duplicate');
  assert.equal(byId.get('cds-2025-2025-21').primaryId,byId.get('cse-2025-gs-i-21').primaryId);
  assert.equal(byId.get('cse-2024-gs-i-5').editorialFollowUps[0].status,'pending');
  assert.ok(ledger.records.filter(row=>/CSE\/(2021|2022|2023|2024|2025)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('CAPF 2017–2018 complete-stem reviews retain figures, historical references and answer exclusions',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,count]of [[2017,29],[2018,25]]) {
    assert.ok(bank.filter(q=>q.exam==='CAPF'&&q.year===year).every(q=>byId.get(q.id)?.status==='approved'),String(year));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CAPF/${year}/I/existing-1`).length,count);
  }
  assert.match(byId.get('capf-2017-i-106').primaryId,/biomagnification$/);
  assert.match(byId.get('capf-2017-i-105').primaryId,/aquatic-life-form-groups$/);
  assert.match(byId.get('capf-2017-i-97').primaryId,/ecological-study-approaches$/);
  assert.match(byId.get('cds-2018-2018-74').primaryId,/special-state-provisions$/);
  assert.match(byId.get('capf-2018-i-123').primaryId,/household-energy-access$/);
  assert.ok(byId.get('cds-2018-2018-119').additionalIds.some(id=>id.endsWith('/literature-and-languages/pali-and-prakrit')));
  assert.ok(fs.existsSync(byId.get('capf-2017-i-120').classificationFigureEvidence.path));
  const hotspot=byId.get('capf-2018-i-52').editorialFollowUps[0];
  assert.equal(hotspot.status,'closed-official-answer-retained');
  assert.equal(hotspot.paper.page,19);
  assert.equal(hotspot.paper.series,hotspot.key.series);
  assert.equal(hotspot.key.accepted,'A');
  assert.equal(bank.find(q=>q.id==='capf-2018-i-52').answer,hotspot.key.displayed);
  assert.equal(byId.get('cds-2018-2018-99').eventDate,'2018-05');
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy['capf-2018-i-41'].status,'withdrawn');
  assert.equal(policy['cds-2017-2017-26'].status,'duplicate');
  assert.equal(policy['cds-2018-2018-116'].status,'duplicate');
  assert.equal(byId.get('cds-2018-2018-116').primaryId,byId.get('capf-2018-i-116').primaryId);
  assert.ok(ledger.records.filter(row=>/^CAPF\/(2017|2018)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('CAPF 2019–2021 reviews preserve maps and distinguish close concepts without changing source records',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,count]of [[2019,16],[2020,18],[2021,16]]) {
    assert.ok(bank.filter(q=>q.exam==='CAPF'&&q.year===year).every(q=>byId.get(q.id)?.status==='approved'),String(year));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CAPF/${year}/I/existing-1`).length,count);
  }
  for(const id of ['capf-2019-i-113','capf-2019-i-120']) {
    assert.ok(fs.existsSync(byId.get(id).classificationFigureEvidence.path));
    assert.ok(bank.find(q=>q.id===id).requiresFigure);
  }
  assert.match(byId.get('capf-2019-i-77').primaryId,/ozone-protection-agreements$/);
  assert.match(byId.get('capf-2019-i-19').primaryId,/metallurgy-and-ores$/);
  assert.match(byId.get('capf-2020-i-45').primaryId,/language-geography\/language-families$/);
  assert.match(byId.get('capf-2020-i-87').primaryId,/ecotones-and-edge-effects$/);
  assert.match(byId.get('capf-2021-i-81').primaryId,/food-crises-and-famine$/);
  assert.ok(byId.get('capf-2020-i-86').additionalIds.some(id=>id.endsWith('/biosafety')));
  assert.equal(byId.get('capf-2020-i-40').eventDate,'2020-05');
  assert.equal(byId.get('capf-2021-i-111').eventDate,'2021-01');
  assert.equal(byId.get('capf-2021-i-116').eventDate,undefined);
  assert.ok(ledger.records.filter(row=>/^CAPF\/(2019|2020|2021)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('all existing CAPF records are classified through 2026 with precise homes and unchanged source eligibility',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,count]of [[2022,16],[2023,20],[2024,13],[2025,10],[2026,22]]) {
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CAPF/${year}/I/existing-1`).length,count);
  }
  assert.ok(bank.filter(q=>q.exam==='CAPF').every(q=>byId.get(q.id)?.status==='approved'));
  assert.match(byId.get('capf-2022-i-87').primaryId,/linguistic-regions$/);
  assert.match(byId.get('capf-2022-i-66').primaryId,/census-and-surveys$/);
  assert.match(byId.get('capf-2023-i-114').primaryId,/soil-formation-processes$/);
  assert.match(byId.get('capf-2026-i-81').primaryId,/urban-climate$/);
  assert.match(byId.get('capf-2026-i-90').primaryId,/eutrophication$/);
  assert.equal(byId.get('capf-2023-i-44').editorialFollowUps[0].status,'pending');
  assert.ok(byId.get('capf-2024-i-84').additionalIds.some(id=>id.endsWith('/maritime-initiatives')));
  assert.equal(byId.get('capf-2026-i-84').eventDate,undefined);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy['capf-2018-i-41'].status,'withdrawn');
  assert.equal(policy['capf-2025-i-8'].status,'official-final');
  assert.ok(ledger.records.filter(row=>/^CAPF\/(2022|2023|2024|2025|2026)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('CDS 2014–2015 session reviews preserve source identities and genuinely shared subject placements',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,paper,count]of [[2014,'1',30],[2014,'2',10],[2015,'1',14],[2015,'2',12]]) {
    assert.ok(bank.filter(q=>q.exam==='CDS'&&q.year===year&&q.paper===paper).every(q=>byId.get(q.id)?.status==='approved'),`${year}/${paper}`);
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CDS/${year}/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2014-2014-1-30').primaryId,/political-concepts\/political-theory$/);
  assert.match(byId.get('cds-2014-2014-1-42').primaryId,/provincial-autonomy-and-ministries$/);
  assert.match(byId.get('cds-2014-2-30').primaryId,/floods-and-river-hazards$/);
  assert.match(byId.get('cds-2014-2-45').primaryId,/dam-safety$/);
  assert.match(byId.get('cds-2014-2014-1-11').primaryId,/tirthankaras-and-teachings$/);
  assert.equal(byId.get('cds-2014-1-72').editorialFollowUps[0].status,'pending');
  assert.ok(byId.get('cds-2014-2014-1-70').additionalIds.some(id=>id.endsWith('/scheduled-tribes')));
  assert.ok(byId.get('cds-2014-2014-1-70').additionalIds.some(id=>id.endsWith('/scheduled-castes')));
  assert.ok(byId.get('cds-2015-2015-1-53').additionalIds.some(id=>id.endsWith('/judicial-review')));
  assert.equal(byId.get('cds-2015-2-112').editorialBatch,'CDS/2015/1/existing-1');
  assert.equal(bank.find(q=>q.id==='cds-2015-2-112').paper,'1');
  assert.equal(byId.get('cds-2015-2015-1-61').eventDate,'2013-03');
  assert.equal(byId.get('cds-2015-2015-1-92').eventDate,undefined);
  assert.ok(ledger.records.filter(row=>/^CDS\/(2014|2015)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('all existing CDS records have reviewed placements while historical facts and holds stay separate',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,paper,count]of [[2016,'1',13],[2016,'2',15],[2017,'1',12],[2017,'2',19],[2018,'1',4]]) {
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CDS/${year}/${paper}/existing-1`).length,count);
  }
  assert.ok(bank.filter(q=>q.exam==='CDS').every(q=>byId.get(q.id)?.status==='approved'));
  assert.match(byId.get('cds-2016-2-43').primaryId,/fishing-grounds$/);
  assert.match(byId.get('cds-2016-2-50').primaryId,/regional-place-mapping$/);
  assert.match(byId.get('cds-2016-1-47').primaryId,/antarctica$/);
  assert.match(byId.get('cds-2017-2-2').primaryId,/urban-systems$/);
  assert.match(byId.get('cds-2018-2018-1-88').primaryId,/special-state-provisions$/);
  assert.ok(byId.get('cds-2017-2-97').additionalIds.some(id=>id.endsWith('/warming-impacts')));
  assert.deepEqual(byId.get('cds-2017-2-27').tags,['Event-based']);
  assert.equal(byId.get('cds-2018-2018-1-70').eventDate,undefined);
  assert.ok(ledger.records.filter(row=>/^CDS\/(2016|2017|2018)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2014–2015 reviews preserve legacy IDs and material-repair grading boundaries',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,paper,count]of [[2014,'I',16],[2014,'II',6],[2015,'I',13],[2015,'II',16]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===year&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)),`${year}/${paper}`);
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/${year}/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('nda-2014-i-112').primaryId,/cultural-regions$/);
  assert.match(byId.get('nda-2014-i-132').primaryId,/pastoral-nomadism$/);
  assert.match(byId.get('nda-2014-i-135').primaryId,/biome-classification-and-distribution$/);
  assert.match(byId.get('nda-2014-ii-86').primaryId,/bioindicators-and-biomonitoring$/);
  assert.match(byId.get('nda-2014-ii-104').primaryId,/industrial-history-and-development$/);
  assert.equal(byId.get('cds-2015-2015-2-128').editorialBatch,'NDA/2015/II/existing-1');
  assert.equal(bank.find(q=>q.id==='cds-2015-2015-2-128').exam,'NDA');
  assert.equal(byId.get('nda-2015-ii-77').additionalIds.length,3);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy['nda-2015-ii-77'].contentRevision,1);
  assert.equal(bank.find(q=>q.id==='nda-2015-ii-77').answer,'A');
  assert.ok(ledger.records.filter(row=>/^NDA\/(2014|2015)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('original cohort has 1519 placement dispositions without claiming source and import completion',()=>{
  const current=JSON.parse(fs.readFileSync('content/taxonomy/prelims-classification-current.json'));
  assert.deepEqual(current.counts,{approved:1509,'out-of-scope':10,pending:0});
  assert.equal(Object.keys(current.records).length,1519);
  assert.equal(current.batches.length,58);
  assert.ok(current.batches.every(row=>row.status==='complete'&&row.pendingIds.length===0));
  assert.equal(current.status,'original-cohort-placement-decisions-complete-source-and-import-review-incomplete');
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const cohort=ledger.records.filter(row=>row.editorialBatch==='NDA/2026/I/existing-1');
  assert.equal(cohort.length,24);
  const byId=new Map(cohort.map(row=>[row.questionId,row]));
  assert.match(byId.get('cds-2026-2026-1-139').primaryId,/high-courts$/);
  assert.match(byId.get('nda-2026-i-103').primaryId,/seismic-waves-and-what-they-reveal$/);
  assert.match(byId.get('nda-2026-i-115').primaryId,/energy-technologies$/);
  assert.match(byId.get('nda-2026-i-148').primaryId,/metropolitan-regions$/);
  assert.ok(cohort.every(row=>row.answerEligibilityUnchanged));
  assert.ok(ledger.records.some(row=>row.editorialFollowUps?.some(f=>f.status==='pending')),'Classification completion cannot erase reproduction debt');
  const source=JSON.parse(fs.readFileSync('content/taxonomy/prelims-source-coverage.json'));
  assert.ok(source.questionSlots.some(row=>row.disposition==='pending-current-source-review'));
});

test('NDA 2025 placement approvals preserve all six independent answer quarantines',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',13],['II',11]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2025&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2025/${paper}/existing-1`).length,count);
  }
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  const held=bank.filter(q=>q.exam==='NDA'&&q.year===2025&&q.paper==='I'&&policy[q.id]?.status==='quarantined');
  assert.equal(held.length,6);
  assert.equal(held.filter(q=>byId.get(q.id)?.status==='approved').length,5,'GS placement is possible without publishing a quarantined answer');
  assert.equal(byId.get('cds-2025-2025-1-49').status,'out-of-scope','The sixth quarantined record is English and must not become a GS placement');
  assert.equal(policy['nda-2025-i-94'].status,'quarantined');
  assert.equal(policy['nda-2025-i-100'].status,'quarantined');
  assert.match(byId.get('cds-2025-2025-1-62').primaryId,/five-year-plans$/);
  assert.match(byId.get('cds-2025-2025-2-145').primaryId,/development-programmes$/);
  assert.ok(byId.get('nda-2025-ii-148').tags.includes('Event-based'));
  assert.ok(byId.get('nda-2025-ii-126').editorialFollowUps.some(row=>row.status==='pending'));
  assert.ok(ledger.records.filter(row=>/^NDA\/2025\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2024 review distinguishes nominations, regulatory restrictions and source follow-ups',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',10],['II',13]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2024&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2024/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2024-2024-1-144').primaryId,/urban-environmental-recognition$/);
  assert.ok(byId.get('cds-2024-2024-1-147').additionalIds.some(id=>id.endsWith('/electoral-reforms')));
  assert.match(byId.get('cds-2024-2024-2-132').primaryId,/reasonable-restrictions$/);
  assert.ok(byId.get('nda-2024-i-117').additionalIds.some(id=>id.endsWith('/tropical-humid-climates')));
  assert.ok(byId.get('nda-2024-ii-136').additionalIds.some(id=>id.endsWith('/revolution-and-seasons')));
  for(const id of ['nda-2024-ii-81','nda-2024-ii-107','nda-2024-ii-139','nda-2024-ii-140']) {
    assert.ok(byId.get(id).editorialFollowUps.some(row=>row.status==='pending'));
  }
  assert.ok(bank.find(q=>q.id==='nda-2024-ii-81').options.D.endsWith('---'),'Classification cannot silently edit source markers');
  assert.ok(ledger.records.filter(row=>/^NDA\/2024\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2023 review supports mixed concepts without a catch-all and records source concerns separately',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',8],['II',15]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2023&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2023/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2023-2023-1-141').primaryId,/anglo-burmese-wars$/);
  assert.match(byId.get('cds-2023-2023-2-150').primaryId,/symbols-and-regalia$/);
  assert.ok(byId.get('cds-2023-2023-2-150').additionalIds.some(id=>id.endsWith('/cholas-and-local-administration')));
  const mixed=byId.get('nda-2023-ii-102');
  assert.equal(mixed.additionalIds.length,3);
  assert.ok(mixed.additionalIds.some(id=>id.startsWith('syllabus:history/')));
  assert.ok(mixed.additionalIds.some(id=>id.startsWith('syllabus:economy/')));
  assert.ok(byId.get('nda-2023-ii-127').editorialFollowUps.some(row=>row.status==='pending'));
  assert.match(byId.get('nda-2023-ii-126').primaryId,/secondary-winds$/);
  assert.ok(ledger.records.filter(row=>/^NDA\/2023\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2022 review gives aquifers, NAM and historical ESZ directions precise homes',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',9],['II',11]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2022&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2022/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('nda-2022-ii-57').primaryId,/groundwater-basins$/);
  assert.match(byId.get('cds-2022-2022-1-127').primaryId,/non-aligned-movement$/);
  assert.ok(byId.get('cds-2022-2022-2-84').additionalIds.some(id=>id.endsWith('/eco-sensitive-zones')));
  assert.ok(byId.get('cds-2022-2022-2-84').tags.includes('Event-based'));
  assert.equal(byId.get('cds-2022-2022-2-84').eventDate,undefined);
  assert.match(byId.get('cds-2022-2022-2-140').primaryId,/anglo-maratha-wars$/);
  assert.match(byId.get('nda-2022-ii-126').primaryId,/population-indicators$/);
  assert.ok(byId.get('nda-2022-i-140').additionalIds.some(id=>id.endsWith('/regional-place-mapping')));
  assert.ok(ledger.records.filter(row=>/^NDA\/2022\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2021 review distinguishes constitutional offices, recognition and political events',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',14],['II',13]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2021&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2021/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2021-2021-1-139').primaryId,/presiding-officers$/);
  assert.match(byId.get('cds-2021-2021-1-144').primaryId,/political-developments$/);
  assert.match(byId.get('cds-2021-2021-1-145').primaryId,/international-awards$/);
  assert.match(byId.get('cds-2021-2021-2-69').primaryId,/attorney-general$/);
  assert.ok(byId.get('nda-2021-ii-75').additionalIds.some(id=>id.endsWith('/commercial-crops')));
  assert.ok(byId.get('cds-2021-2021-1-144').tags.includes('Event-based'));
  const keyRevisions=JSON.parse(fs.readFileSync('content/answer-key-revisions.json'));
  assert.equal(bank.find(q=>q.id==='nda-2021-ii-54').answer,'A');
  assert.equal(keyRevisions['nda-2021-ii-54'],1,'Existing Playa correction remains independently revisioned');
  assert.ok(ledger.records.filter(row=>/^NDA\/2021\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('combined NDA 2020 review retains one source session and the reconstructed duplicate exclusion',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  const cohort=ledger.records.filter(row=>row.editorialBatch==='NDA/2020/I/II/existing-1');
  assert.equal(cohort.length,26);
  assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2020).every(q=>q.paper==='I/II'&&['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
  assert.match(byId.get('cds-2020-2020-1-and-2-102').primaryId,/united-nations-charter-and-founding$/);
  const legacy=byId.get('cds-2020-2020-1-and-2-3'),canonical=byId.get('nda-2020-i-ii-119');
  assert.equal(legacy.primaryId,canonical.primaryId);
  assert.deepEqual(legacy.additionalIds,canonical.additionalIds);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy[legacy.questionId].status,'duplicate');
  assert.equal(policy[legacy.questionId].contentRevision,1);
  assert.ok(canonical.tags.includes('Event-based'));
  assert.equal(canonical.eventDate,undefined);
  assert.match(byId.get('nda-2020-i-ii-81').primaryId,/language-families$/);
  assert.ok(byId.get('nda-2020-i-ii-136').additionalIds.some(id=>id.endsWith('/community-conservation')));
  assert.ok(cohort.every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2019 complete-stem decisions preserve exam-period facts and material overlaps',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',14],['II',10]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2019&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2019/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2019-2019-1-133').primaryId,/availability-of-rights$/);
  assert.match(byId.get('cds-2019-2019-2-122').primaryId,/social-justice-directives$/);
  assert.match(byId.get('nda-2019-ii-117').primaryId,/language-families$/);
  assert.match(byId.get('nda-2019-ii-101').primaryId,/physical-geography\/rocks-and-minerals\/minerals$/);
  assert.ok(byId.get('nda-2019-ii-112').additionalIds.some(id=>id.endsWith('/islands-and-peninsulas')));
  assert.ok(byId.get('nda-2019-ii-116').tags.includes('Event-based'));
  assert.equal(byId.get('nda-2019-ii-116').eventDate,undefined);
  assert.ok(byId.get('nda-2019-i-105').tags.includes('Event-based'));
  assert.ok(ledger.records.filter(row=>/^NDA\/2019\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2018 cohorts preserve historical wording and distinguish tested concepts from incidental news',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [paper,count]of [['I',15],['II',14]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===2018&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/2018/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('cds-2018-2018-2-149').primaryId,/theosophical-movement$/);
  assert.equal(byId.get('cds-2018-2018-1-34').status,'out-of-scope','Sentence ordering remains English, despite its civil-service passage');
  assert.match(byId.get('cds-2018-2018-1-137').primaryId,/parliament\/composition$/);
  assert.match(byId.get('nda-2018-ii-55').primaryId,/productivity$/);
  assert.ok(byId.get('nda-2018-ii-73').additionalIds.some(id=>id.endsWith('/latitudes-and-longitudes')));
  assert.match(byId.get('nda-2018-ii-134').primaryId,/islands-and-peninsulas$/);
  assert.ok(!byId.get('nda-2018-ii-134').tags.includes('Event-based'));
  assert.ok(byId.get('nda-2018-i-141').tags.includes('Event-based'));
  assert.equal(byId.get('nda-2018-i-141').eventDate,undefined);
  assert.ok(ledger.records.filter(row=>/^NDA\/2018\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('NDA 2016–2017 cohorts use precise map, policy and human-geography homes without changing duplicate holds',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,paper,count]of [[2016,'I',19],[2016,'II',17],[2017,'I',19],[2017,'II',16]]) {
    assert.ok(bank.filter(q=>q.exam==='NDA'&&q.year===year&&q.paper===paper).every(q=>['approved','out-of-scope'].includes(byId.get(q.id)?.status)),`${year}/${paper}`);
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`NDA/${year}/${paper}/existing-1`).length,count);
  }
  assert.match(byId.get('nda-2016-i-83').primaryId,/mapping-institutions$/);
  assert.match(byId.get('nda-2016-i-106').primaryId,/industrial-zones-and-sezs$/);
  assert.ok(byId.get('nda-2016-ii-140').additionalIds.some(id=>id.endsWith('/urbanisation-patterns')));
  assert.match(byId.get('nda-2016-ii-136').primaryId,/e-governance$/);
  assert.match(byId.get('nda-2017-i-69').primaryId,/specialised-agencies$/);
  assert.match(byId.get('nda-2017-i-141').primaryId,/indigenous-peoples$/);
  assert.ok(byId.get('nda-2017-ii-141').primaryId.endsWith('/rotation-and-time'));
  assert.equal(byId.get('cds-2016-2016-1-138').primaryId,byId.get('nda-2016-i-138').primaryId);
  assert.deepEqual(byId.get('cds-2016-2016-1-138').additionalIds,byId.get('nda-2016-i-138').additionalIds);
  const policy=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(policy['cds-2016-2016-1-138'].status,'official-final');
  const aliases=JSON.parse(fs.readFileSync('content/prelims-question-alias-policy.json'));
  assert.equal(aliases['nda-2016-i-138'].status,'duplicate');
  assert.equal(aliases['nda-2016-i-138'].canonicalId,'cds-2016-2016-1-138');
  assert.equal(byId.get('nda-2016-i-138').eventDate,undefined);
  assert.equal(byId.get('cds-2017-2017-1-75').eventDate,undefined);
  assert.ok(ledger.records.filter(row=>/^NDA\/(2016|2017)\//.test(row.editorialBatch||'')).every(row=>row.answerEligibilityUnchanged));
});

test('CSE 2017–2020 reviewed cohorts are complete while reproduction follow-ups remain explicit',()=>{
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  const byId=new Map(ledger.records.map(row=>[row.questionId,row]));
  for(const [year,count]of [[2017,26],[2018,24],[2019,23],[2020,27]]) {
    assert.ok(bank.filter(q=>q.exam==='CSE'&&q.year===year).every(q=>byId.get(q.id)?.status==='approved'),String(year));
    assert.equal(ledger.records.filter(row=>row.editorialBatch===`CSE/${year}/GS-I/existing-1`).length,count);
  }
  assert.match(byId.get('cse-2017-gs-i-25').primaryId,/carbon-capture-and-storage$/);
  assert.match(byId.get('cse-2018-gs-i-99').primaryId,/plant-diseases$/);
  assert.match(byId.get('cse-2019-gs-i-28').primaryId,/animal-biology\/feeding-and-digestion$/);
  assert.match(byId.get('cse-2020-gs-i-85').primaryId,/externalities$/);
  assert.ok(byId.get('cse-2020-gs-i-97').additionalIds.some(id=>id.includes('/medieval-india/')));
  assert.ok(byId.get('cse-2020-gs-i-97').additionalIds.some(id=>id.endsWith('/regional-place-mapping')));
  assert.equal(byId.get('cse-2017-gs-i-98').editorialFollowUps[0].status,'pending');
  assert.ok(ledger.records.filter(row=>row.editorialBatch&&/CSE\/(2017|2018|2019|2020)\//.test(row.editorialBatch)).every(row=>row.answerEligibilityUnchanged));
});
