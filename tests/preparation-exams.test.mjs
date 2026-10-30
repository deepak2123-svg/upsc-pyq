import assert from 'node:assert/strict';
import test from 'node:test';

const workerModule = import(new URL('../dist/server/index.js', import.meta.url).href);
async function fetchApp(path, body) {
  const { default: worker } = await workerModule;
  return worker.fetch(new Request(`http://localhost${path}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
    { ASSETS: { fetch: async () => new Response('', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}
async function inventory(target) { return (await fetchApp(`/api/pyqs/inventory?preparationExam=${target}`)).json(); }
const sources = ['CSE', 'CAPF', 'CDS', 'NDA'];

test('lean explorer omits graph edges without changing the public inventory contract',async()=>{
 const full=await inventory('NDA');
 assert.equal(full.links.length,full.nodes.length);
 const response=await fetchApp('/prepare/NDA.rsc');
 assert.equal(response.status,200);
 const text=await response.text();
 assert.ok(text.includes('"links":[]'));
 assert.ok(Buffer.byteLength(text)<800000,'explorer payload must stay below its old 1.06 MB size');
 const repeat=await inventory('NDA');
 assert.deepEqual(repeat,full,'rendering must not mutate cached eligibility or membership');
});

test('NDA Science has detailed section-local chapters with immutable concept membership',async()=>{
 const nda=await inventory('NDA');
 for(const [label,count] of [['Physics',18],['Chemistry',12],['Biology',18]]){
  const head=nda.nodes.find(n=>n.kind==='head'&&n.subjectId==='subject:science'&&n.label===label);
  const chapters=nda.nodes.filter(n=>n.parentId===head.id).sort((a,b)=>a.order-b.order);
  assert.equal(chapters.length,count);
  assert.deepEqual(chapters.map(n=>n.order),Array.from({length:count},(_,i)=>i+1));
  for(const chapter of chapters){const parts=nda.nodes.filter(n=>n.parentId===chapter.id).sort((a,b)=>a.order-b.order);assert.ok(parts.length);assert.deepEqual(parts.map(n=>n.order),Array.from({length:parts.length},(_,i)=>i+1));}
 }
 const optics=nda.nodes.find(n=>n.id==='subtopic:science:physics:light-and-electricity:optics');
 const chapter=nda.nodes.find(n=>n.id===optics.parentId);
 assert.equal(chapter.label,'Light and Optics');assert.equal(chapter.order,12);
 assert.ok(optics.questionIdsByExam.NDA.includes('nda-2026-ii-54'));
 const result=await fetchApp('/api/practice-snapshots',recipe(nda,[optics],'NDA'));
 assert.equal(result.status,201);const snapshot=await result.json();
 assert.ok(snapshot.questions.every(q=>q.topic==='Light and Optics'));
 assert.ok(snapshot.questions.some(q=>q.id==='nda-2026-ii-54'));
 const cse=await inventory('CSE');assert.ok(cse.nodes.some(n=>n.label==='Light and Electricity'));
});
function recipe(data, leaves, exam) {
  return { version: 4, preparationExam: data.preparationExam, taxonomyVersion: data.taxonomyVersion,
    subjectIds: [...new Set(leaves.map(n => n.subjectId))], paths: leaves.map(n => ({ subtopicId: n.id, exams: [exam] })), count: 'all', order: 'newest' };
}

test('three target syllabuses expose the agreed paper structure and bounded empty subjects', async () => {
  const nda = await inventory('NDA'), cds = await inventory('CDS'), cse = await inventory('CSE');
  assert.deepEqual(nda.preparationViews.filter(v => v.paper === 'GAT').map(v => v.label), ['English', 'GS', 'Science']);
  assert.deepEqual([...new Set(nda.preparationViews.map(v => v.paper))], ['Mathematics', 'GAT']);
  assert.deepEqual(cds.preparationViews.map(v => v.paper), ['English', 'General Knowledge', 'Elementary Mathematics']);
  assert.deepEqual(cse.preparationViews.map(v => v.paper), ['GS Paper I', 'GS Paper II / CSAT']);
  for (const data of [nda, cds, cse]) {
    const ids = new Set([...data.subjects, ...data.nodes].map(n => n.id));
    assert.equal(ids.size, data.subjects.length + data.nodes.length);
    assert.ok(data.nodes.every(n => ids.has(n.parentId)));
    const all = new Set(data.nodes.filter(n => n.kind === 'subtopic').flatMap(n => sources.flatMap(e => n.questionIdsByExam[e])));
    assert.equal(all.size, data.totalCount);
    for (const subject of data.subjects) {
      const leaves = data.nodes.filter(n => n.kind === 'subtopic' && n.subjectId === subject.id);
      for (const exam of sources) assert.equal(subject.examCounts[exam], new Set(leaves.flatMap(n => n.questionIdsByExam[exam])).size);
    }
    assert.equal(data.nodes.filter(n => n.subjectId === 'subject:geography' && n.kind === 'subtopic' && n.id.includes(':physical-geography:')).length, 92);
  }
  assert.ok(nda.nodes.some(n => n.label === 'Synonyms'));
  assert.ok(nda.nodes.some(n => n.label === 'Differential Calculus'));
  assert.ok(!cds.nodes.some(n => n.label === 'Differential Calculus'));
  assert.ok(cse.nodes.some(n => n.label === 'Data Interpretation'));
  assert.equal(nda.subjects.find(n => n.id === 'subject:english').questionCount, 796);
});

test('CSE science cannot inherit NDA physics, while NDA keeps its own science', async () => {
  const cse = await inventory('CSE'), nda = await inventory('NDA');
  const cseIds = new Set(cse.nodes.filter(n => n.kind === 'subtopic').flatMap(n => sources.flatMap(e => n.questionIdsByExam[e])));
  assert.ok(!cseIds.has('nda-2026-i-51'));
  assert.ok(cse.nodes.filter(n => n.subjectId === 'subject:science').every(n => n.examCounts.NDA === 0 && n.examCounts.CDS === 0 && n.examCounts.CAPF === 0));
  const leaves = nda.nodes.filter(n => n.kind === 'subtopic' && n.questionIdsByExam.NDA.includes('nda-2026-i-51'));
  const response = await fetchApp('/api/practice-snapshots', recipe(nda, leaves, 'NDA'));
  assert.equal(response.status, 201);
  const snapshot = await response.json();
  assert.equal(snapshot.recipe.preparationExam, 'NDA');
  assert.ok(snapshot.questions.some(q => q.id === 'nda-2026-i-51'));
  assert.ok(snapshot.questions.every(q => !('answer' in q)));
  const scope = cse.nodes.find(n => n.subjectId === 'subject:science' && n.kind === 'subtopic');
  const tampered = recipe(cse, [scope], 'NDA');
  tampered.frozenScopes = [{ ...scope, questionIdsByExam: { CSE: [], CAPF: [], CDS: [], NDA: ['nda-2026-i-51'] } }];
  assert.equal((await fetchApp('/api/practice-snapshots', tampered)).status, 409);
});

test('cross-source GS remains optional and deduplicates shared concepts', async () => {
  const data = await inventory('NDA');
  const leaf = data.nodes.find(n => n.kind === 'subtopic' && n.subjectId === 'subject:geography' && n.examCounts.CSE > 0 && n.examCounts.NDA > 0);
  assert.ok(leaf);
  const own = await (await fetchApp('/api/practice-snapshots', recipe(data, [leaf], 'NDA'))).json();
  assert.ok(own.questions.every(q => q.exam === 'NDA'));
  const mixed = recipe(data, [leaf], 'NDA'); mixed.paths[0].exams.push('CSE');
  const response = await fetchApp('/api/practice-snapshots', mixed);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.ok(body.questions.some(q => q.exam === 'CSE'));
  assert.equal(new Set(body.questions.map(q => q.id)).size, body.questions.length);
});

test('GS cannot be smuggled into an empty English topic; invalid targets fail closed', async () => {
  const data = await inventory('NDA');
  const leaf = data.nodes.find(n => n.kind === 'subtopic' && n.subjectId === 'subject:english' && n.questionCount === 0);
  const other = data.nodes.find(n => n.kind === 'subtopic' && n.examCounts.NDA > 0);
  const body = recipe(data, [leaf], 'NDA');
  body.frozenScopes = [{ ...leaf, questionIdsByExam: { CSE: [], CAPF: [], CDS: [], NDA: [other.questionIdsByExam.NDA[0]] } }];
  assert.equal((await fetchApp('/api/practice-snapshots', body)).status, 400);
  assert.equal((await fetchApp('/api/pyqs/inventory?preparationExam=CAPF')).status, 400);
  assert.equal((await fetchApp('/api/practice-snapshots', { ...body, preparationExam: 'CAPF' })).status, 400);
});
