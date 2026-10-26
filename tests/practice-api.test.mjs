import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {questionEligible} from '../lib/question-review.ts';

// Reuse the application instance, as production does. A unique import URL per
// request permanently retains another complete bundled catalogue in ESM cache.
const workerModule = import(new URL("../dist/server/index.js", import.meta.url).href);
async function workerFetch(pathname, init = {}) {
  const { default: worker } = await workerModule;
  return worker.fetch(
    new Request("http://localhost" + pathname, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function inventory() {
  const response = await workerFetch("/api/pyqs/inventory");
  assert.equal(response.status, 200);
  return response.json();
}

async function create(recipe) {
  const response = await workerFetch("/api/practice-snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(recipe),
  });
  return { response, body: await response.json() };
}

test('NDA II 2026 original 100 Part B questions reach NDA snapshots including defence World History',async()=>{
 const data=await(await workerFetch('/api/pyqs/inventory?preparationExam=NDA')).json();
 const imports=JSON.parse(await readFile(new URL('../content/reviewed-prelims-imports.json',import.meta.url),'utf8')).questions.filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='II');
 const ids=new Set(imports.map(q=>q.id));
 const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam?.NDA.some(id=>ids.has(id)));
 const frozenScopes=leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter(id=>ids.has(id))}}));
 const {response,body}=await create({version:4,preparationExam:'NDA',taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes,count:'all',order:'newest',durationMinutes:null});
 assert.equal(response.status,201);assert.equal(body.matchingCount,100);assert.equal(body.questions.length,100);
 assert.deepEqual(new Set(body.questions.map(q=>q.id)),ids);
 for(const q of body.questions){assert.ok(!('answer'in q));assert.ok(!('explanation'in q));assert.equal(q.paper,'II');assert.equal(q.year,2026);}
 for(const q of imports){
  const response=await workerFetch('/api/practice/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({questionId:q.id,selectedOption:q.answer})});
  assert.equal(response.status,200,q.id);const feedback=await response.json();assert.equal(feedback.correct,true,q.id);assert.equal(feedback.correctAnswer,q.answer);
 }
});

const geo = "subject:geography";
const physical = "head:geography:physical-geography";
const other = "head:geography:other-geography";
const firstPhysicalChapter = "topic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth";
const otherGeomorphology = "topic:geography:other-geography:geomorphology-earth-structure";
const planets = "subtopic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth:planets";
const oldEarthInterior = "subtopic:geography:physical-geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
const seismology = "subtopic:geography:other-geography:geomorphology-earth-structure:earthquakes-seismology";
const allExams = ["CSE", "CAPF", "CDS", "NDA"];

function recipeFor(paths, overrides = {}) {
  return { version: 3, subjectIds: [geo], paths, count: "all", order: "newest", ...overrides };
}

function pathsFor(nodes) {
  return nodes.map((node) => ({ subtopicId: node.id, exams: allExams.filter((exam) => node.examCounts[exam] > 0) }));
}

test("multi-placement inventory conserves every unique parent and examination count", async () => {
  const data = await inventory();
  assert.equal(data.version, 4);
  assert.equal(data.totalCount, 1942);
  assert.equal(data.mappedCount + data.unmappedCount, data.totalCount);
  assert.ok(data.mappedCount >= 1208, 'Reviewed mappings must not disappear');
  assert.equal(new Set(data.nodes.map((node) => node.id)).size, data.nodes.length);
  const byId = new Map([...data.subjects, ...data.nodes].map((node) => [node.id, node]));
  assert.ok(byId.get(geo).questionCount > 900);
  const placementLedger=JSON.parse(await readFile(new URL('../content/taxonomy/prelims-reviewed-placements.json',import.meta.url),'utf8'));
  const expectedPhysical=new Set(placementLedger.records.filter(row=>row.status==='approved'&&[row.primaryId,...row.additionalIds].some(id=>id.startsWith('syllabus:geography/physical-geography/'))&&questionEligible(row.questionId)).map(row=>row.questionId));
  assert.equal(byId.get(physical).questionCount, expectedPhysical.size);
  // Other Geography shrinks when reviewed records receive precise subject homes.
  // Its exact count, like every parent, is checked against unique leaf IDs below.
  assert.ok(data.nodes.some(node=>node.kind==='subtopic'&&!node.legacyOnly&&node.id.includes(':world-geography:')&&node.questionIdsByExam.CAPF.includes('capf-2017-i-125')));
  const expectedFirstChapter=new Set(placementLedger.records.filter(row=>row.status==='approved'&&[row.primaryId,...row.additionalIds].some(id=>id.startsWith('syllabus:geography/physical-geography/universe-solar-system-shape-and-size-of-earth/'))&&questionEligible(row.questionId)).map(row=>row.questionId));
  assert.equal(byId.get(firstPhysicalChapter).questionCount,expectedFirstChapter.size);
  assert.equal(byId.get(otherGeomorphology).questionCount, 7);
  assert.equal(byId.get(planets).questionCount, 11);
  assert.ok(byId.get(planets).questionIdsByExam.NDA.includes('nda-2026-i-119'),'Fresh terrestrial-planet placement must reach the live leaf');
  assert.ok(data.legacyQuestionSets[oldEarthInterior].length < 41);
  assert.ok(data.legacyAliases[oldEarthInterior].length > 1);

  for (const parent of [...data.subjects, ...data.nodes.filter((node) => node.kind !== "subtopic")]) {
    const children = data.nodes.filter((node) => node.parentId === parent.id);
    const leavesUnder = (id) => data.nodes.filter(node => node.parentId === id&&(byId.get(id).legacyOnly||!node.legacyOnly)).flatMap(node => node.kind === 'subtopic' ? [node] : leavesUnder(node.id));
    const leaves = leavesUnder(parent.id);
    assert.equal(new Set(leaves.flatMap(leaf => allExams.flatMap(exam => leaf.questionIdsByExam[exam]))).size, parent.questionCount, parent.id);
    for (const exam of allExams) {
      assert.equal(new Set(leaves.flatMap(leaf => leaf.questionIdsByExam[exam])).size, parent.examCounts[exam], parent.id + " " + exam);
    }
  }
  for (const link of data.links) {
    const target = byId.get(link.target);
    assert.ok(target);
    assert.equal(target.parentId, link.source);
    assert.equal(link.questionCount, target.questionCount);
    assert.deepEqual(link.examCounts, target.examCounts);
  }
});

test('new original-page-reviewed CSE imports reach Science, History and Polity and grade their displayed options',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-5':'D','cse-2013-gs-i-6':'B','cse-2013-gs-i-9':'C'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.subjectId==='subject:science'));
  assert.ok(leaves.some(n=>n.subjectId==='subject:history'));
  assert.ok(leaves.some(n=>n.subjectId==='subject:polity'));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const history=result.body.questions.find(q=>q.id==='cse-2013-gs-i-6');
  assert.ok(history.promptLines.some(line=>line.includes('completely immune from robbery')));
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);
  assert.equal(graded.body.correct,3);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE page-six and page-eight imports preserve cross-column statements and deduplicate planning overlap',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-10':'B','cse-2013-gs-i-11':'D','cse-2013-gs-i-12':'C','cse-2013-gs-i-19':'D','cse-2013-gs-i-20':'A'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-19')).length>=2);
  const attorney=result.body.questions.find(q=>q.id==='cse-2013-gs-i-12');
  assert.ok(attorney.promptLines.some(line=>line==='4. vote in the Lok Sabha'));
  assert.equal(attorney.options.C,'1, 2 and 3');
  const amendment=result.body.questions.find(q=>q.id==='cse-2013-gs-i-11');
  assert.ok(amendment.promptLines.some(line=>line.includes('all the States of India')),'Preserve assessed false statements');
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);
  assert.equal(graded.body.correct,5);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('PESA and aflatoxin source-reviewed imports use exact wording and preserve the Forest Rights duplicate hold',async()=>{
  const data=await inventory();
  const ids=['cse-2013-gs-i-25','cse-2013-gs-i-27'];
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(result.body.questions.find(q=>q.id===ids[0]).promptLines[0].includes('not identified as its objective'));
  assert.equal(result.body.questions.find(q=>q.id===ids[1]).options.C,'moulds');
  const graded=await grade({questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,'C']))});
  assert.equal(graded.response.status,200);assert.equal(graded.body.correct,2);
  assert.ok(data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly).every(n=>!n.questionIdsByExam.CSE.includes('cds-2013-2013-26')));
});

test('new Buddhist, nationalist and external-account imports preserve examined wording and shared homes',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-36':'B','cse-2013-gs-i-37':'A','cse-2013-gs-i-39':'C','cse-2013-gs-i-40':'B','cse-2013-gs-i-41':'A'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-36')).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.equal(result.body.questions.find(q=>q.id==='cse-2013-gs-i-41').options.A,'all import and export transactions of a country during a given period of time, normally a year');
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);assert.equal(graded.body.correct,5);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('banking, Harappan, Jain and physiology imports reproduce the original options and examination keys',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-42':'D','cse-2013-gs-i-43':'D','cse-2013-gs-i-44':'A','cse-2013-gs-i-45':'B','cse-2013-gs-i-46':'B','cse-2013-gs-i-47':'D','cse-2013-gs-i-50':'D'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.label==='Muscles and movement'&&n.questionIdsByExam.CSE.includes('cse-2013-gs-i-50')));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-45')).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(result.body.questions.find(q=>q.id==='cse-2013-gs-i-45').promptLines.some(line=>line.includes('horse-drawn chariots')),'Preserve the assessed historical claim');
  assert.equal(result.body.questions.find(q=>q.id==='cse-2013-gs-i-50').options.D,'1, 2 and 3');
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);assert.equal(graded.body.correct,7);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('new history, capital-account and cabinet imports coexist with a nonmaterial source correction',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-52':'B','cse-2013-gs-i-56':'B','cse-2013-gs-i-57':'B','cse-2013-gs-i-58':'B','cse-2013-gs-i-59':'A','cse-2013-gs-i-53':'B'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const corrected=result.body.questions.find(q=>q.id==='cse-2013-gs-i-53');
  assert.ok(corrected.promptLines.join(' ').includes('kinds of organism'));
  assert.ok(!corrected.promptLines.join(' ').includes('kinds of an organism'));
  assert.equal(corrected.sourceTextHash,'fe11ee0daac2360e9c3b9001973c73a59ac714ba360ae3f86236d0d904035eb0');
  assert.equal(corrected.contentRevision,0,'A nonmaterial article correction must not acquire a material repair revision');
  const raw=JSON.parse(await readFile(new URL('../content/question-bank.json',import.meta.url),'utf8')).questions.find(q=>q.id===corrected.id);
  assert.ok(raw.promptLines.join(' ').includes('kinds of an organism'),'The immutable source bank is retained');
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);assert.equal(graded.body.correct,6);
  assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('inflation, unemployment and executive/legal-aid imports retain unique shared homes and official answers',async()=>{
  const data=await inventory();
  const answers={'cse-2013-gs-i-66':'A','cse-2013-gs-i-67':'C','cse-2013-gs-i-68':'B','cse-2013-gs-i-70':'B','cse-2013-gs-i-71':'C'};
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&Object.keys(answers).some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.label==='Legal aid'&&n.questionIdsByExam.CSE.includes('cse-2013-gs-i-71')));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-68')).length,2);
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2013-gs-i-70')).length,3);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of Object.keys(answers))assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.equal(result.body.questions.find(q=>q.id==='cse-2013-gs-i-67').options.C,'marginal productivity of labour is zero');
  assert.ok(result.body.questions.find(q=>q.id==='cse-2013-gs-i-68').promptLines.some(line=>line.includes('collectively responsible to the Parliament.')),'Preserve the assessed Parliament claim');
  const graded=await grade({questionIds:Object.keys(answers),answers});
  assert.equal(graded.response.status,200);assert.equal(graded.body.correct,5);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
  const wrong=await grade({questionIds:Object.keys(answers),answers:Object.fromEntries(Object.keys(answers).map(id=>[id,'D']))});
  assert.equal(wrong.body.correct,0);assert.equal(wrong.body.incorrect,5);
});

test('remaining CSE 2013 imports reproduce full statements and score official keys without overlap duplicates',async()=>{
  const data=await inventory();
  const answers=Object.fromEntries(Object.entries({74:'D',75:'C',76:'D',79:'A',80:'C',81:'C',82:'D',83:'B',84:'D',85:'B',86:'C',88:'C',89:'C',91:'C',92:'C',93:'A',95:'A',96:'A',99:'D',100:'C',94:'D'}).map(([n,a])=>[`cse-2013-gs-i-${n}`,a]));
  const ids=Object.keys(answers);
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const number of [80,84,100])assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes(`cse-2013-gs-i-${number}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const q94=result.body.questions.find(q=>q.id==='cse-2013-gs-i-94');
  assert.ok(q94.promptLines.includes('2. Tiny leaves or no leaves'));assert.equal(q94.contentRevision,1);
  assert.equal(q94.sourceTextHash,'97369ee809ad8800479020f311635658016bfc48b3f5617f2dbc115012d6b900');
  assert.ok(result.body.questions.find(q=>q.id==='cse-2013-gs-i-93').promptLines.some(line=>line.includes('biological vectors only')));
  assert.ok(result.body.questions.find(q=>q.id==='cse-2013-gs-i-95').promptLines.join(' ').includes('not correct'));
  assert.ok(result.body.questions.find(q=>q.id==='cse-2013-gs-i-96').promptLines.some(line=>line.includes('without traversing the physical space')));
  const contentRevisions=Object.fromEntries(ids.map(id=>[id,result.body.questions.find(q=>q.id===id).contentRevision]));
  const correct=await grade({questionIds:ids,answers,contentRevisions});
  assert.equal(correct.response.status,200);assert.equal(correct.body.correct,21);assert.equal(correct.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(correct.body.feedback[id].correctAnswer,answer);
  const wrong=await grade({questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,answers[id]==='A'?'B':'A'])),contentRevisions});
  assert.equal(wrong.body.correct,0);assert.equal(wrong.body.incorrect,21);
  const historical=await grade({questionIds:[q94.id],answers:{[q94.id]:'D'}});
  assert.equal(historical.body.excluded,1);assert.equal(historical.body.feedback[q94.id].correctAnswer,null);
  assert.equal(historical.body.feedback[q94.id].correct,null);
});

test('CSE 2014 imports retain examination-date wording and deduplicate Current Affairs homes',async()=>{
  const data=await inventory();
  const answers={'cse-2014-gs-i-7':'A','cse-2014-gs-i-8':'C','cse-2014-gs-i-11':'B','cse-2014-gs-i-12':'B'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [8,11])assert.equal(leaves.filter(leaf=>leaf.questionIdsByExam.CSE.includes(`cse-2014-gs-i-${n}`)).length,2);
  assert.ok(leaves.some(n=>n.label==='Disease eradication'));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(result.body.questions.find(q=>q.id==='cse-2014-gs-i-11').promptLines.some(line=>line.includes('South Africa was the last to join')));
  assert.ok(result.body.questions.find(q=>q.id==='cse-2014-gs-i-7').promptLines.some(line=>line.includes('but not for Photovoltaics')));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,4);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2014 committee and history imports coexist with revision-protected source/option repairs',async()=>{
  const data=await inventory();
  const answers={'cse-2014-gs-i-18':'B','cse-2014-gs-i-21':'B','cse-2014-gs-i-25':'C','cse-2014-gs-i-13':'C','cse-2014-gs-i-19':'C'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.label==='Village administration'&&n.questionIdsByExam.CSE.includes('cse-2014-gs-i-21')));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.equal(current.get('cse-2014-gs-i-13').promptLines[0],'Which of the following phenomena might have influenced the evolution of organisms?');
  assert.equal(current.get('cse-2014-gs-i-19').options.C,'1, 2 and 4 only');
  for(const n of [13,19])assert.equal(current.get(`cse-2014-gs-i-${n}`).contentRevision,1);
  const contentRevisions=Object.fromEntries(ids.map(id=>[id,current.get(id).contentRevision]));
  const graded=await grade({questionIds:ids,answers,contentRevisions});assert.equal(graded.body.correct,5);assert.equal(graded.body.excluded,0);
  const oldIds=[13,19].map(n=>`cse-2014-gs-i-${n}`);
  const historical=await grade({questionIds:oldIds,answers:Object.fromEntries(oldIds.map(id=>[id,'C']))});
  assert.equal(historical.body.excluded,2);assert.equal(historical.body.correct,0);assert.equal(historical.body.incorrect,0);
  for(const id of oldIds)assert.equal(historical.body.feedback[id].correctAnswer,null);
});

test('CSE 2014 Q27-Q37 imports reach snapshots and retain official keys and historical propositions',async()=>{
  const data=await inventory();
  const answers=Object.fromEntries([[27,'D'],[28,'B'],[29,'D'],[30,'C'],[31,'A'],[32,'C'],[33,'A'],[34,'D'],[37,'A']].map(([n,a])=>[`cse-2014-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.label==='Business correspondents'&&n.questionIdsByExam.CSE.includes('cse-2014-gs-i-32')));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(result.body.questions.find(q=>q.id==='cse-2014-gs-i-37').promptLines.some(line=>line.includes('7500 km')));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,9);assert.equal(graded.body.excluded,0);
  assert.equal(graded.body.feedback['cse-2014-gs-i-33'].correctAnswer,'A');
});

test('CSE 2014 Q41-Q69 source review adds concept-specific imports without duplicating legacy source identities',async()=>{
  const data=await inventory();
  const entries=[[44,'C'],[47,'C'],[49,'D'],[54,'D'],[58,'C'],[59,'B'],[60,'B'],[61,'C'],[63,'C'],[64,'C'],[65,'B'],[66,'D'],[67,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2014-gs-i-${n}`,a]));
  Object.assign(answers,{'cds-2014-2014-55':'B','cds-2014-2014-57':'C','cds-2014-2014-62':'A'});
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const [label,n] of [['Cabinet Secretariat',58],['Economic uses of plants',64],['Biometric identification',66]])assert.ok(leaves.some(leaf=>leaf.label===label&&leaf.questionIdsByExam.CSE.includes(`cse-2014-gs-i-${n}`)));
  for(const n of [47,54])assert.equal(leaves.filter(leaf=>leaf.questionIdsByExam.CSE.includes(`cse-2014-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  for(const n of [55,57,62])assert.ok(!result.body.questions.some(q=>q.id===`cse-2014-gs-i-${n}`));
  assert.ok(result.body.questions.find(q=>q.id==='cse-2014-gs-i-47').promptLines[0].includes('does not form part'));
  assert.ok(result.body.questions.find(q=>q.id==='cse-2014-gs-i-67').promptLines.some(line=>line.includes('eliminating the virus')));
  const contentRevisions=Object.fromEntries(ids.map(id=>[id,result.body.questions.find(q=>q.id===id).contentRevision]));
  const graded=await grade({questionIds:ids,answers,contentRevisions});assert.equal(graded.body.correct,16);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
  const oldIds=['cds-2014-2014-57','cds-2014-2014-62'];
  const old=await grade({questionIds:oldIds,answers:Object.fromEntries(oldIds.map(id=>[id,answers[id]]))});
  assert.equal(old.body.excluded,2);assert.equal(old.body.incorrect,0);
});

test('complete CSE 2014 source imports preserve long tables, historical fiscal wording and three-way dance overlap',async()=>{
  const data=await inventory();
  const entries=[[70,'B'],[72,'B'],[74,'A'],[75,'B'],[76,'B'],[81,'B'],[82,'B'],[83,'B'],[84,'A'],[85,'C'],[86,'A'],[87,'D'],[88,'C'],[89,'C'],[90,'D'],[91,'B'],[92,'A'],[93,'C'],[94,'B'],[97,'A'],[99,'A'],[100,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2014-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2014-gs-i-88')).length,3);
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2014-gs-i-97')).length,2);
  for(const [n,label] of [[82,'Congress sessions and resolutions'],[84,'Calendars and eras'],[92,'Crown rule and proclamations'],[94,'Seeds and seed policy']])assert.ok(leaves.some(leaf=>leaf.label===label&&leaf.questionIdsByExam.CSE.includes(`cse-2014-gs-i-${n}`)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2014-gs-i-85').promptLines.some(line=>line.includes('sorrowful figures of his followers below')));
  assert.ok(current.get('cse-2014-gs-i-89').promptLines.some(line=>line.includes('Nako : Zanskar Valley')));
  assert.equal(current.get('cse-2014-gs-i-84').options.A,'22nd March (or 21st March)');
  assert.ok(current.get('cse-2014-gs-i-100').promptLines[0].includes('Non-Plan Expenditure'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,22);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
  assert.ok(data.nodes.some(n=>n.label==='Eco-sensitive zones'&&n.questionIdsByExam.CSE.includes('cse-2014-gs-i-95')));
  assert.ok(data.nodes.some(n=>n.label==='Economic uses of plants'&&n.questionIdsByExam.CSE.includes('cse-2014-gs-i-73')));
});

test('CSE 2015 first page reaches current snapshots with separate source evidence and overlapping fiscal placements',async()=>{
  const data=await inventory();
  const answers={'cse-2015-gs-i-1':'C','cse-2015-gs-i-2':'A','cse-2015-gs-i-3':'B','cse-2015-gs-i-4':'A','cse-2015-gs-i-5':'B','cse-2015-gs-i-6':'D','cse-2015-gs-i-7':'C'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2015-gs-i-2')).length,4);
  for(const [label,n]of [['Access and objectives',1],['Fiscal policy and devolution',2],['Tax revenue indicators',4],['Nature and enforceability',7]])assert.ok(leaves.some(leaf=>leaf.label===label&&leaf.questionIdsByExam.CSE.includes(`cse-2015-gs-i-${n}`)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-2').promptLines.some(line=>line.includes('32 percent to 42 percent')));
  assert.equal(current.get('cse-2015-gs-i-4').options.D,'Neither 1 nor 2');
  assert.equal(current.get('cse-2015-gs-i-4').promptLines.at(-1),'Select the correct answer using the code given below.');
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,7);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 Q8-Q25 imports preserve historical weights, cross-column statements and research/medical placements',async()=>{
  const data=await inventory();
  const entries=[[8,'B'],[10,'A'],[16,'B'],[17,'B'],[20,'D'],[21,'D'],[22,'C'],[23,'C'],[24,'B'],[25,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2015-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.ok(leaves.some(n=>n.label==='Innovation institutions'&&n.questionIdsByExam.CSE.includes('cse-2015-gs-i-10')));
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2015-gs-i-23')).length,3);
  assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes('cse-2015-gs-i-16')).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-16').promptLines.some(line=>line.includes('Simon Commission coincided with Rowlatt')));
  assert.ok(current.get('cse-2015-gs-i-10').promptLines.some(line=>line.includes('highly advanced foreign scientific institutions')));
  assert.equal(current.get('cse-2015-gs-i-22').options.C,'Scheduled Commercial Banks may cut their lending rates');
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,10);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 Q26-Q44 imports retain year-specific option order, cross-column claims and nonmaterial source repairs',async()=>{
  const data=await inventory();
  const entries=[[26,'D'],[27,'B'],[28,'B'],[29,'C'],[30,'D'],[31,'C'],[32,'C'],[34,'C'],[35,'B'],[37,'A'],[39,'D'],[41,'B'],[44,'D']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2015-gs-i-${n}`,a]));
  Object.assign(answers,{'cse-2015-gs-i-33':'B','cse-2015-gs-i-36':'D','cse-2014-gs-i-25':'C'});
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-33').promptLines[0].startsWith('The area known as'));
  assert.ok(current.get('cse-2015-gs-i-36').promptLines.includes('3. Pranahita'));
  assert.equal(current.get('cse-2014-gs-i-25').options.C,'3 and 4 only');assert.equal(current.get('cse-2015-gs-i-39').options.D,'3 and 4 only');
  assert.ok(current.get('cse-2015-gs-i-41').promptLines.at(-1).startsWith('Select the correct answer'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,16);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 page 16 additions preserve false statements, award context and official answers',async()=>{
  const data=await inventory();
  const answers={'cse-2015-gs-i-46':'B','cse-2015-gs-i-47':'C','cse-2015-gs-i-48':'B','cse-2015-gs-i-50':'C'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-48').promptLines[1].endsWith('was Sarojini Naidu.'));
  assert.ok(current.get('cse-2015-gs-i-50').promptLines[0].includes('for 2014'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,4);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 pages 18-20 imports deduplicate shared homes and grade official keys',async()=>{
  const data=await inventory();
  const answers={'cse-2015-gs-i-51':'A','cse-2015-gs-i-53':'B','cse-2015-gs-i-54':'B','cse-2015-gs-i-55':'B','cse-2015-gs-i-56':'D','cse-2015-gs-i-57':'B','cse-2015-gs-i-59':'A','cse-2015-gs-i-60':'C'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const id of ['cse-2015-gs-i-54','cse-2015-gs-i-56','cse-2015-gs-i-59','cse-2015-gs-i-60'])assert.equal(leaves.filter(n=>n.questionIdsByExam.CSE.includes(id)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  assert.ok(result.body.questions.find(q=>q.id==='cse-2015-gs-i-55').promptLines[1].includes('very strong centralized'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,8);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 Q62-Q71 imports keep negative membership and original westerly assertions intact',async()=>{
  const data=await inventory();
  const answers={'cse-2015-gs-i-64':'C','cse-2015-gs-i-65':'B','cse-2015-gs-i-67':'D','cse-2015-gs-i-68':'A','cse-2015-gs-i-66':'B'};
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-64').promptLines[0].includes('not a participant'));
  assert.ok(current.get('cse-2015-gs-i-66').promptLines[1].includes('30° N and 60° S'));
  assert.ok(current.get('cse-2015-gs-i-67').promptLines[2].includes('maritime security only'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,5);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 Q72-Q91 imports preserve historical recognition, fiscal distractors and shared scientific homes',async()=>{
  const data=await inventory();
  const entries=[[73,'D'],[75,'A'],[81,'B'],[82,'D'],[83,'D'],[85,'C'],[86,'C'],[87,'C'],[88,'A'],[90,'B']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2015-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [73,75,87])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2015-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-81').promptLines[1].includes('last decade'));
  assert.ok(current.get('cse-2015-gs-i-82').promptLines[1].includes('larger in size than half'));
  assert.equal(current.get('cse-2015-gs-i-75').options.D,'Assamese');
  assert.equal(current.get('cse-2015-gs-i-88').options.A,'1 and 2 only');
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,10);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2015 final imports retain full source alternatives, shared homes and official keys',async()=>{
  const data=await inventory(),entries=[[92,'D'],[94,'C'],[95,'A'],[96,'A'],[97,'B'],[98,'A'],[99,'C'],[100,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2015-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [95,96,100])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2015-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2015-gs-i-95').promptLines[3].includes('Alternating Current (AC)'));
  assert.ok(current.get('cse-2015-gs-i-97').options.B.endsWith('appropriate time and affordable cost'));
  assert.ok(current.get('cse-2015-gs-i-99').promptLines.includes('2. Rajasthani Daal-Bati-Churma'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,8);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 opening pages keep source offset, shared homes and year-specific deficit alternatives',async()=>{
  const data=await inventory(),entries=[[1,'B'],[2,'C'],[3,'C'],[4,'B'],[5,'C'],[7,'D'],[8,'C'],[9,'C'],[10,'B'],[11,'A']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  answers['cse-2015-gs-i-98']='A';
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes('cse-2016-gs-i-2')).length,2);
  for(const n of [7,8,10])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-1').promptLines[1].endsWith('prorogation.'));
  assert.ok(current.get('cse-2016-gs-i-3').promptLines.includes('4. Reducing import duty'));
  assert.ok(current.get('cse-2015-gs-i-98').promptLines.includes('4. Expanding industries'));
  assert.equal(current.get('cse-2016-gs-i-3').options.C,'1 and 3 only');assert.equal(current.get('cse-2015-gs-i-98').options.A,'1 and 3 only');
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,11);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q12-Q22 additions preserve original doctrinal, regulatory and historical event claims',async()=>{
  const data=await inventory(),entries=[[12,'D'],[14,'D'],[15,'C'],[16,'C'],[17,'C'],[18,'D'],[20,'B'],[21,'B']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [14,15,17,20,21])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,n===14?3:2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-14').promptLines[0].includes('proposed'));
  assert.ok(current.get('cse-2016-gs-i-20').promptLines[1].includes('European Union'));
  assert.ok(current.get('cse-2016-gs-i-21').promptLines[1].includes('any crop they cultivate in any season'));
  assert.ok(current.get('cse-2016-gs-i-17').promptLines[1].includes('Siddhas (Sittars)'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,8);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q23-Q32 imports preserve full claims and nonmaterial NGRBA restoration',async()=>{
  const data=await inventory(),entries=[[26,'C'],[29,'A'],[31,'B'],[32,'A'],[23,'A']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [26,32,23])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-23').promptLines[0].endsWith("Authority (NGRBA)'?"));
  assert.ok(current.get('cse-2016-gs-i-29').promptLines[3].includes('non-performing assets'));
  assert.equal(current.get('cse-2016-gs-i-31').options.B,'the full range of mRNA molecules expressed by an organism');
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,5);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q33-Q45 imports retain named historical regimes and full original alternatives',async()=>{
  const data=await inventory(),entries=[[34,'C'],[35,'B'],[36,'A'],[37,'C'],[38,'D'],[39,'B'],[40,'B'],[41,'D'],[42,'A'],[43,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [39,42])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-34').promptLines[0].includes('Regulations, 2011'));
  assert.ok(current.get('cse-2016-gs-i-41').promptLines[1].includes('all the Pacific Rim countries except China and Russia'));
  assert.ok(current.get('cse-2016-gs-i-42').promptLines.includes('2. was actually initiated by Jawaharlal Nehru in 1951'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,10);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q46-Q56 imports preserve Buddhist propositions and distinguish emissions accounting from treaties',async()=>{
  const data=await inventory(),entries=[[46,'C'],[47,'A'],[49,'A'],[50,'B'],[55,'A'],[56,'C']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [49,50])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-50').promptLines[1].includes('Hinayana'));
  assert.ok(current.get('cse-2016-gs-i-55').options.C.endsWith('year 2022'));
  assert.equal(current.get('cse-2016-gs-i-55').promptLines[0],"What is 'Greenhouse Gas Protocol'?");
  assert.ok(current.get('cse-2016-gs-i-56').promptLines[1].includes('NITI Aayog'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,6);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q57-Q69 imports retain historical cryptocurrency, NIMZ and monument comparisons',async()=>{
  const data=await inventory(),entries=[[58,'C'],[59,'D'],[60,'B'],[61,'A'],[62,'B'],[63,'D'],[64,'D'],[65,'B'],[66,'B'],[67,'B'],[69,'B']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [61,63,66])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,n===61?3:2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-61').promptLines[0].includes('was proposed'));
  assert.ok(current.get('cse-2016-gs-i-65').promptLines.includes('2. Both belong to the same religious denomination.'));
  assert.ok(current.get('cse-2016-gs-i-66').promptLines.includes('1. Bitcoins are tracked by the Central Banks of the countries.'));
  assert.ok(current.get('cse-2016-gs-i-67').promptLines.includes('1. New Development Bank has been set up by APEC.'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,11);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q70-Q75 imports preserve negative membership and gold mobilisation objectives',async()=>{
  const data=await inventory(),entries=[[70,'A'],[71,'C'],[72,'D'],[73,'A']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [71,73])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-70').promptLines[0].includes('not a member'));
  assert.ok(current.get('cse-2016-gs-i-71').promptLines.includes('2. To promote FDI in the gold and jewellery sector'));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,4);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q76-Q80 preserve pension, appliance and historical matching claims',async()=>{
  const data=await inventory(),entries=[[76,'C'],[78,'D'],[79,'D'],[80,'D']];
  const answers=Object.fromEntries(entries.map(([n,a])=>[`cse-2016-gs-i-${n}`,a]));
  const ids=Object.keys(answers),leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  for(const n of [76,79])assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(`cse-2016-gs-i-${n}`)).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.ok(current.get('cse-2016-gs-i-76').promptLines.includes('2. Only one member of a family can join the scheme.'));
  assert.equal(current.get('cse-2016-gs-i-78').options.D,'1, 2 and 3');
  assert.ok(current.get('cse-2016-gs-i-80').promptLines.some(line=>line.includes('Taniyurs : Villages donated to a single Brahmin')));
  const graded=await grade({questionIds:ids,answers});assert.equal(graded.body.correct,4);assert.equal(graded.body.excluded,0);
  for(const [id,answer]of Object.entries(answers))assert.equal(graded.body.feedback[id].correctAnswer,answer);
});

test('CSE 2016 Q82 and Q84 preserve the institutional description and digital-access claims',async()=>{
  const data=await inventory(),ids=['cse-2016-gs-i-82','cse-2016-gs-i-84'];
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  assert.equal(leaves.filter(l=>l.questionIdsByExam.CSE.includes(ids[1])).length,2);
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'});
  assert.equal(result.response.status,201,JSON.stringify(result.body));
  for(const id of ids)assert.equal(result.body.questions.filter(q=>q.id===id).length,1);
  const current=new Map(result.body.questions.map(q=>[q.id,q]));
  assert.equal(current.get(ids[0]).options.B,'agency of EU that provides financial assistance to eurozone countries');
  assert.ok(current.get(ids[1]).promptLines.includes('2. It allows you to access your e-documents irrespective of your physical location.'));
  const graded=await grade({questionIds:ids,answers:{[ids[0]]:'B',[ids[1]]:'C'}});
  assert.equal(graded.body.correct,2);assert.equal(graded.body.excluded,0);
});

test('V4 History overlap retains each canonical question once while V3 semantics remain primary-only', async () => {
  const data = await inventory();
  const leaves = data.nodes.filter(node => node.kind === 'subtopic' && node.subjectId === 'subject:history'&&!node.legacyOnly&&node.questionIdsByExam.CSE.includes('cse-2013-gs-i-4'));
  assert.equal(leaves.length, 2);
  assert.deepEqual(leaves.map(leaf=>leaf.questionCount).sort((a,b)=>a-b),[2,3]);
  const recipe = { version: 4, taxonomyVersion:data.taxonomyVersion, subjectIds: ['subject:history'], paths: leaves.map(leaf => ({subtopicId:leaf.id, exams:['CSE']})), count:'all', order:'newest', durationMinutes:30 };
  const {response, body} = await create(recipe);
  assert.equal(response.status,201);
  assert.equal(body.recipe.version,4);
  assert.equal(body.matchingCount,4);
  assert.deepEqual(body.questions.map(q=>q.id).sort(),['cse-2013-gs-i-36','cse-2013-gs-i-4','cse-2015-gs-i-54','cse-2016-gs-i-65'].sort());
  assert.ok(!('answer' in body.questions[0]));
  const ancient = leaves.find(leaf => leaf.id.includes('ancient-india'));
  const old = await create({...recipe, version:3, paths:[{subtopicId:ancient.id,exams:['CSE']}]});
  assert.equal(old.response.status,400);
  const legacyPrimary = leaves.find(leaf => leaf.id.includes('art-culture'));
  assert.equal((await create({...recipe,version:3,paths:[{subtopicId:legacyPrimary.id,exams:['CSE']}]})).response.status,201);
});

test("V3 topic and leaf snapshots match exact scoped inventories", async () => {
  // A historical V3 draft must use the frozen pre-expansion source masks,
  // not newly added examination sources from the live V4 catalogue.
  const data = JSON.parse(await readFile(new URL('../content/taxonomy/prelims-legacy-inventory.json',import.meta.url),'utf8')).inventory;
  for (const [topicId, expected] of [[firstPhysicalChapter, 28], [otherGeomorphology, 7]]) {
    const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && node.parentId === topicId));
    const { response, body } = await create(recipeFor(paths));
    assert.equal(response.status, 201);
    assert.equal(body.recipe.version, 3);
    assert.equal(body.matchingCount, expected);
    assert.equal(body.questions.length, expected);
    assert.equal(new Set(body.questions.map((question) => question.id)).size, expected);
  }
  const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }]));
  assert.equal(response.status, 201);
  assert.equal(body.matchingCount, 10);
  assert.equal(body.questions.length, 10);
  assert.ok(body.questions.every((question) => question.subtopic === "Planets"));
  assert.ok(body.questions.every((question) => !("answer" in question) && !("explanation" in question)));
  assert.ok(body.questions.every((question) => /^[a-f0-9]{64}$/.test(question.sourceTextHash)));
});

test("matchingCount remains the full pool when sampling or narrowing exam sources", async () => {
  const legacy = JSON.parse(await readFile(new URL('../content/taxonomy/prelims-legacy-inventory.json',import.meta.url),'utf8')).inventory;
  const sampled = await create(recipeFor(pathsFor(legacy.nodes.filter((node) => node.parentId === firstPhysicalChapter)), { count: 20 }));
  assert.equal(sampled.response.status, 201);
  assert.equal(sampled.body.matchingCount, 28);
  assert.equal(sampled.body.questions.length, 20);
  const cse = await create(recipeFor([{ subtopicId: planets, exams: ["CSE"] }]));
  assert.equal(cse.response.status, 201);
  assert.equal(cse.body.matchingCount, 2);
  assert.equal(cse.body.questions.length, 2);
  assert.ok(cse.body.questions.every((question) => question.exam === "CSE"));
  const unavailableCount = await create(recipeFor([{ subtopicId: planets, exams: ["CSE"] }], { count: 10 }));
  assert.equal(unavailableCount.response.status, 409);
  assert.equal(unavailableCount.body.available, 2);
});

test("mixed subjects and duplicate paths use a unique union of question records", async () => {
  const data = await inventory();
  const selectedSubjects = [geo, "subject:environment"];
  const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && !node.legacyOnly&&node.questionCount>0&&selectedSubjects.includes(node.subjectId)));
  paths.push({ subtopicId: planets, exams: ["CSE", "CSE"] });
  const { response, body } = await create(recipeFor(paths, { version:4,taxonomyVersion:data.taxonomyVersion,subjectIds: [geo, geo, "subject:environment"] }));
  assert.equal(response.status, 201);
  const expected = new Set(paths.flatMap(path=>path.exams.flatMap(exam=>data.nodes.find(n=>n.id===path.subtopicId).questionIdsByExam[exam]))).size;
  assert.equal(body.matchingCount, expected);
  assert.equal(body.questions.length, expected);
  assert.equal(new Set(body.questions.map((question) => question.id)).size, expected);
  assert.deepEqual(body.recipe.subjectIds, selectedSubjects);
});

test("questions that depend on an original figure carry that asset into snapshots", async () => {
  const data = await inventory();
  const capfGeography = data.nodes
    .filter((node) => node.kind === "subtopic" && !node.legacyOnly && node.subjectId === geo && node.examCounts.CAPF > 0)
    .map((node) => ({ subtopicId: node.id, exams: ["CAPF"] }));
  const { response, body } = await create(recipeFor(capfGeography, {version:4, taxonomyVersion:data.taxonomyVersion}));
  assert.equal(response.status, 201);
  const question = body.questions.find((item) => item.id === "capf-2019-i-120");
  assert.ok(question, "CAPF 2019 Q120 should remain in the Geography snapshot");
  assert.deepEqual(question.figure, {
    src: "/question-figures/capf-2019-i-q120-map.png",
    alt: "Original CAPF 2019 map of Sikkim with four numbered border locations",
  });
  const figure = await readFile(new URL("../public/question-figures/capf-2019-i-q120-map.png", import.meta.url));
  assert.ok(figure.length > 10_000, "the original map crop should be a substantive image asset");
});

test("retired V3 Physical Geography leaves retain only eligible historical questions for new attempts", async () => {
  const old = await create(recipeFor([{ subtopicId: oldEarthInterior, exams: allExams }]));
  assert.equal(old.response.status, 201);
  assert.equal(old.body.recipe.version, 3);
  const data = await inventory();
  assert.equal(old.body.matchingCount, data.legacyQuestionSets[oldEarthInterior].length);
  assert.deepEqual(new Set(old.body.questions.map((question) => question.id)), new Set(data.legacyQuestionSets[oldEarthInterior]));
  assert.deepEqual(old.body.recipe.paths, [{ subtopicId: oldEarthInterior, exams: allExams }]);
});

test("V3 rejects malformed counts rather than coercing or clamping them", async () => {
  for (const count of [0, -1, 101, 20.5, "20", null, {}, [], true]) {
    const { response } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count }));
    assert.equal(response.status, 400, JSON.stringify(count));
  }
});

test("V3 rejects invalid subjects, leaf IDs and sources without fallback", async () => {
  const basePaths = [{ subtopicId: planets, exams: allExams }];
  const invalidRecipes = [
    recipeFor(basePaths, { subjectIds: [] }),
    recipeFor(basePaths, { subjectIds: [geo, "subject:unknown"] }),
    recipeFor(basePaths, { subjectIds: ["subject:environment"] }),
    recipeFor(basePaths, { subjectIds: [3] }),
    recipeFor([]),
    recipeFor([null]),
    recipeFor([{ subtopicId: firstPhysicalChapter, exams: allExams }]),
    recipeFor([{ subtopicId: "unknown", exams: allExams }]),
    recipeFor([{ subtopicId: planets, exams: [] }]),
    recipeFor([{ subtopicId: planets, exams: [null] }]),
    recipeFor([{ subtopicId: planets, exams: [7] }]),
    recipeFor([{ subtopicId: planets, exams: ["cse"] }]),
    recipeFor([{ subtopicId: planets, exams: ["JEE"] }]),
    recipeFor([{ subtopicId: seismology, exams: ["CSE"] }]),
    recipeFor(basePaths, { order: "invalid" }),
    recipeFor(basePaths, { version: 5 }),
  ];
  for (const value of invalidRecipes) {
    const { response } = await create(value);
    assert.equal(response.status, 400, JSON.stringify(value));
  }
});

test("malformed payloads and older non-string exam values do not throw", async () => {
  for (const value of [null, [], "invalid", 42, { version: 2, subjectIds: [geo], paths: [{ subtopicId: oldEarthInterior, exams: [null, 3] }], count: "all", order: "newest" }, { exam: 3 }]) {
    const { response } = await create(value);
    assert.equal(response.status, 400, JSON.stringify(value));
  }
});

test("V3 preserves optional duration without changing the selected question pool", async () => {
  for (const durationMinutes of [null, 1, 60, 720]) {
    const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3, durationMinutes }));
    assert.equal(response.status, 201);
    assert.equal(body.recipe.durationMinutes, durationMinutes);
    assert.equal(body.matchingCount, 10);
    assert.equal(body.questions.length, 3);
    assert.ok(body.questions.every((question) => !Object.hasOwn(question, "answer") && !Object.hasOwn(question, "explanation")));
  }
  const untimed = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3 }));
  assert.equal(untimed.response.status, 201);
  assert.equal(untimed.body.recipe.durationMinutes ?? null, null);
});

test("V3 rejects malformed durations with an actionable error", async () => {
  for (const durationMinutes of [0, -1, 721, 1.5, "20", false, {}, []]) {
    const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { durationMinutes }));
    assert.equal(response.status, 400, JSON.stringify(durationMinutes));
    assert.match(body.error, /duration|minute|time/i);
  }
});

async function grade(payload) {
  const response = await workerFetch("/api/practice/grade", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() };
}

test("final grading returns a complete answer sheet while keeping skipped questions separate", async () => {
  const bank = JSON.parse(await readFile(new URL("../content/question-bank.json", import.meta.url), "utf8"));
  const { body: snapshot } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3 }));
  const records = snapshot.questions.map((question) => bank.questions.find((candidate) => candidate.id === question.id));
  const wrong = Object.keys(records[1].options).find((option) => option !== records[1].answer);
  const { response, body } = await grade({
    questionIds: records.map((question) => question.id),
    answers: { [records[0].id]: records[0].answer, [records[1].id]: wrong },
  });
  assert.equal(response.status, 200);
  assert.equal(body.total, 3);
  assert.equal(body.correct, 1);
  assert.equal(body.incorrect, 1);
  assert.equal(body.unattempted, 1);
  assert.deepEqual(Object.keys(body.feedback).sort(), records.map((question) => question.id).sort());
  for (const record of records) {
    assert.equal(body.feedback[record.id].correctAnswer, record.answer);
    assert.equal(typeof body.feedback[record.id].correct, "boolean");
    assert.notEqual(body.feedback[record.id].explanation, "Explanation pending editorial review.");
  }
  assert.equal(body.feedback[records[0].id].correct, true);
  assert.equal(body.feedback[records[1].id].correct, false);
  assert.equal(body.feedback[records[2].id].correct, false);
});

test("final grading rejects malformed or ambiguous question and answer sets", async () => {
  const id = "cse-2013-gs-i-14";
  const invalid = [
    null, [], "bad", {},
    { questionIds: [], answers: {} },
    { questionIds: [id, id], answers: {} },
    { questionIds: [id, "unknown"], answers: {} },
    { questionIds: [3], answers: {} },
    { questionIds: [id], answers: [] },
    { questionIds: [id], answers: null },
    { questionIds: [id], answers: { [id]: "Z" } },
    { questionIds: [id], answers: { [id]: null } },
    { questionIds: [id], answers: { [id]: 1 } },
    { questionIds: [id], answers: { "unknown": "A" } },
  ];
  for (const payload of invalid) {
    const { response, body } = await grade(payload);
    assert.equal(response.status, 400, JSON.stringify(payload));
    assert.equal(typeof body.error, "string");
    assert.ok(body.error.length);
  }
});

test("NDA 2021 II Q54 grades Playa as A and publishes its key revision", async () => {
  const id = "nda-2021-ii-54";
  const accepted = await grade({ questionIds: [id], answers: { [id]: "A" } });
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.body.correct, 1);
  assert.equal(accepted.body.feedback[id].correctAnswer, "A");
  assert.equal(accepted.body.feedback[id].answerKeyRevision, 1);
  assert.match(accepted.body.feedback[id].explanation, /playa.*temporary lake/i);
  const rejected = await grade({ questionIds: [id], answers: { [id]: "C" } });
  assert.equal(rejected.body.incorrect, 1);
  assert.equal(rejected.body.feedback[id].correct, false);
});

test('a reviewed source alias counts once in new tests and remains reviewable without scoring penalties',async()=>{
  const alias='nda-2016-i-138',canonical='cds-2016-2016-1-138';
  const data=await inventory();
  const leaves=data.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly);
  assert.ok(leaves.every(n=>!allExams.some(exam=>n.questionIdsByExam[exam].includes(alias))));
  const leaf=leaves.find(n=>n.questionIdsByExam.NDA.includes(canonical));
  assert.ok(leaf,'Canonical remains in the correct exam pool');
  const result=await create({version:4,taxonomyVersion:data.taxonomyVersion,subjectIds:[leaf.subjectId],paths:[{subtopicId:leaf.id,exams:['NDA']}],count:'all',order:'newest'});
  assert.equal(result.response.status,201);
  assert.equal(result.body.questions.filter(q=>q.id===canonical).length,1);
  assert.ok(result.body.questions.every(q=>q.id!==alias));
  const historical=await grade({questionIds:[alias,canonical],answers:{[alias]:'A',[canonical]:'A'},contentRevisions:{[alias]:0,[canonical]:1}});
  assert.equal(historical.response.status,200);
  assert.equal(historical.body.total,2);
  assert.equal(historical.body.excluded,1);
  assert.equal(historical.body.scored,1);
  assert.equal(historical.body.correct,1);
  assert.equal(historical.body.incorrect,0);
  assert.equal(historical.body.feedback[alias].correctAnswer,null);
  assert.match(historical.body.feedback[alias].exclusionReason,/duplicate/i);
  assert.equal(historical.body.feedback[canonical].correctAnswer,'A');
});

test('held IDs stay gradeable historically without forced answers or penalties', async () => {
  const register = JSON.parse(await readFile(new URL('../content/question-review-state.json', import.meta.url), 'utf8'));
  const known = 'nda-2021-ii-54';
  const heldIds = register.originalIds.filter(id => !questionEligible(id));
  const ids = [...heldIds, known];
  const result = await grade({ questionIds: ids, answers: Object.fromEntries(ids.map(id => [id, 'A'])) });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.total, heldIds.length + 1);
  assert.equal(result.body.excluded, heldIds.length);
  assert.equal(result.body.scored, 1);
  assert.equal(result.body.correct, 1);
  assert.equal(result.body.incorrect, 0);
  assert.equal(result.body.unattempted, 0);
  for (const id of heldIds) {
    assert.equal(result.body.feedback[id].disposition, 'excluded', id);
    assert.equal(result.body.feedback[id].correctAnswer, null, id);
    assert.equal(result.body.feedback[id].correct, null, id);
  }
  const data = await inventory();
  const paths = pathsFor(data.nodes.filter(node => node.kind === 'subtopic'&&!node.legacyOnly&&node.questionCount>0));
  const snapshot = await create(recipeFor(paths, { version: 4, taxonomyVersion:data.taxonomyVersion, subjectIds: data.subjects.filter(subject=>!subject.legacyOnly).map(subject => subject.id) }));
  assert.equal(snapshot.response.status, 201);
  const held = new Set(heldIds);
  assert.ok(snapshot.body.questions.every(question => !held.has(question.id)));
  assert.ok(snapshot.body.questions.every(question => Number.isInteger(question.contentRevision)));
});

test('restored material content scores only the corrected snapshot revision', async () => {
  for (const [id, answer] of [['nda-2015-ii-77', 'A'], ['cse-2013-gs-i-87', 'C']]) {
    const old = await grade({ questionIds: [id], answers: { [id]: answer } });
    assert.equal(old.body.excluded, 1, id);
    assert.equal(old.body.feedback[id].correctAnswer, null, id);
    const repaired = await grade({ questionIds: [id], answers: { [id]: answer }, contentRevisions: { [id]: 1 } });
    assert.equal(repaired.body.correct, 1, id);
    assert.equal(repaired.body.excluded, 0, id);
    assert.equal(repaired.body.feedback[id].correctAnswer, answer, id);
  }
  const identityOnly = await grade({ questionIds: ['cds-2015-2-112'], answers: { 'cds-2015-2-112': 'A' } });
  assert.equal(identityOnly.body.correct, 1);
  assert.match(identityOnly.body.feedback['cds-2015-2-112'].explanation, /CDS I 2015/);
});

test('single-question checks respect restored content revisions and held dispositions', async () => {
  const check = async payload => {
    const r=await workerFetch('/api/practice/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    return {status:r.status,body:await r.json()};
  };
  const repaired=await check({questionId:'nda-2015-ii-77',selectedOption:'A',contentRevision:1});
  assert.equal(repaired.body.correct,true);
  assert.equal(repaired.body.disposition,'scored');
  const old=await check({questionId:'nda-2015-ii-77',selectedOption:'A'});
  assert.equal(old.body.disposition,'excluded');
  assert.equal(old.body.correctAnswer,null);
  for(const contentRevision of [-1,'1',null,1.5]) assert.equal((await check({questionId:'nda-2015-ii-77',selectedOption:'A',contentRevision})).status,400);
  const cleared=await check({questionId:'nda-2025-i-94',selectedOption:'B',contentRevision:0});
  assert.equal(cleared.body.disposition,'scored');
  assert.equal(cleared.body.correct,true);
  const held=await check({questionId:'cse-2024-gs-i-20',selectedOption:'B',contentRevision:0});
  assert.equal(held.body.disposition,'excluded');
  assert.equal(held.body.correct,null);
});

test("every reviewed correction grades the displayed option and rejects the former answer", async () => {
  const ledger = JSON.parse(await readFile(new URL("../content/audits/answer-key-audit.json", import.meta.url), "utf8"));
  const policy = JSON.parse(await readFile(new URL('../content/question-review-policy.json', import.meta.url), 'utf8'));
  const changed = ledger.rows.filter(row => row.currentAnswer !== row.answerAtAudit);
  assert.ok(changed.length >= 27);
  for (const row of changed) {
    const contentRevisions = {[row.id]:policy[row.id]?.contentRevision??0};
    const accepted = await grade({ questionIds: [row.id], answers: { [row.id]: row.currentAnswer }, contentRevisions });
    assert.equal(accepted.response.status, 200, row.id);
    if (['withdrawn','quarantined','duplicate','pending'].includes(policy[row.id]?.status)) {
      assert.equal(accepted.body.excluded,1,row.id);
      assert.equal(accepted.body.feedback[row.id].correctAnswer,null,row.id);
      continue;
    }
    assert.equal(accepted.body.correct, 1, row.id);
    assert.ok(accepted.body.feedback[row.id].answerKeyRevision > 0, row.id);
    const rejected = await grade({ questionIds: [row.id], answers: { [row.id]: row.answerAtAudit }, contentRevisions });
    assert.equal(rejected.body.incorrect, 1, row.id);
  }
});
