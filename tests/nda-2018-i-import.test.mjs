import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';import {questionEligible,questionReview,questionExclusion} from '../lib/question-review.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),paper=read('content/nda-2018-i-official-paper.json'),audit=read('content/audits/nda-2018-i-review.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function send(path,body){const{default:w}=await import('../dist/server/index.js');return w.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
test('NDA I 2018: complete Series A source, final key and stable reuse',()=>{assert.equal(paper.questions.length,150);assert.equal(audit.questionSlots.length,150);assert.equal(Object.keys(paper.baselines).length,22);assert.equal(audit.reconciliation.newSourceOccurrences,128);assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);assert.equal(paper.evidence.series,'A');assert.equal(paper.questions.find(q=>q.questionNumber===137).id,'cds-2018-2018-1-137');for(const q of paper.questions){assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),true);assert.equal(questionReview(q.id).status,'official-final');assert.equal(hash(q.sourceText),q.sourceTextHash);}assert.equal(questionExclusion(paper.questions[0].id),null);assert.deepEqual(paper.questions.filter(q=>q.requiresFigure),[]);});
test('NDA I 2018: all 600 answer choices follow the final key',async()=>{const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,questionReview(id).contentRevision]));for(const a of ['A','B','C','D']){const r=await send('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,a])),contentRevisions});assert.equal(r.status,200);const result=await r.json();assert.equal(result.scored,150);assert.equal(result.excluded,0);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.answer===a,`Q${q.questionNumber}/${a}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer);}}});
function assertAnswerFree(questions) {
  for (const question of questions) {
    for (const field of ['answer', 'acceptedAnswers', 'explanation', 'source']) {
      assert.equal(field in question, false, `${question.id}/${field}`);
    }
  }
}

test('NDA I 2018: thematic practice offers exactly 149 questions without answer leakage', async () => {
  const [nda, cse] = await Promise.all(['NDA', 'CSE'].map(async target =>
    (await send(`/api/pyqs/inventory?preparationExam=${target}`)).json()));
  const members = inventory => new Set(inventory.nodes.filter(node => node.kind === 'subtopic' && !node.legacyOnly)
    .flatMap(node => Object.values(node.questionIdsByExam).flat()));
  const ndaMembers = members(nda), cseMembers = members(cse);
  const originalOnlyId = 'nda-2018-i-95';
  const expectedIds = new Set(paper.questions.filter(q => q.id !== originalOnlyId).map(q => q.id));
  for (const q of paper.questions) {
    assert.equal(ndaMembers.has(q.id), expectedIds.has(q.id), q.id);
    if (q.preparationScope !== 'gs' || q.id === originalOnlyId) assert.equal(cseMembers.has(q.id), false, q.id);
  }
  const leaves = nda.nodes.filter(node => node.kind === 'subtopic' && !node.legacyOnly &&
    node.questionIdsByExam.NDA.some(id => expectedIds.has(id)));
  const response = await send('/api/practice-snapshots', {
    version: 4,
    preparationExam: 'NDA',
    taxonomyVersion: nda.taxonomyVersion,
    subjectIds: [...new Set(leaves.map(node => node.subjectId))],
    paths: leaves.map(node => ({ subtopicId: node.id, exams: ['NDA'] })),
    frozenScopes: leaves.map(node => ({
      id: node.id,
      subjectId: node.subjectId,
      label: node.label,
      parentId: node.parentId,
      order: node.order,
      questionIdsByExam: { CSE: [], CAPF: [], CDS: [], NDA: node.questionIdsByExam.NDA.filter(id => expectedIds.has(id)) },
    })),
    count: 'all',
    order: 'newest',
  });
  assert.equal(response.status, 201);
  const snapshot = await response.json();
  assert.equal(snapshot.matchingCount, 149);
  assert.equal(snapshot.questions.length, 149);
  assert.deepEqual(new Set(snapshot.questions.map(q => q.id)), expectedIds);
  assertAnswerFree(snapshot.questions);
});

test('NDA I 2018: original paper offers all 150 numbered questions without answer leakage', async () => {
  const response = await send('/api/practice-snapshots', {
    version: 5,
    paperKeys: ['NDA:I:GAT:2018'],
    count: 'all',
    order: 'newest',
  });
  assert.equal(response.status, 201);
  const snapshot = await response.json();
  assert.equal(snapshot.matchingCount, 150);
  assert.deepEqual(snapshot.questions.map(q => [q.id, q.questionNumber]),
    paper.questions.map(q => [q.id, q.questionNumber]));
  assertAnswerFree(snapshot.questions);
});
