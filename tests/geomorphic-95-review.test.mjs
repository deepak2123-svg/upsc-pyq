import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { combinedQuestions } from '../lib/combined-question-bank.ts';
import { canonicalSubjectLabel, prelimsPath } from '../lib/prelims-taxonomy.ts';
import { questionEligible, questionInGsScope } from '../lib/question-review.ts';

const readContent = path => JSON.parse(readFileSync(new URL(`../content/${path}`, import.meta.url), 'utf8'));
const { classificationRevision, records } = readContent('audits/geomorphic-95-review/decisions.json');

// Printed slots behind the 95-question NDA selection, captured before the reclassification.
const roster = {
  '2026-i': [111],
  '2026-ii': [102, 116],
  '2025-i': [88],
  '2025-ii': [118],
  '2024-i': [71],
  '2024-ii': [83, 112],
  '2022-i': [118, 119, 120, 134, 139, 140],
  '2022-ii': [127],
  '2021-i': [111, 119],
  '2021-ii': [54, 85],
  '2019-i': [104],
  '2019-ii': [103, 128, 129],
  '2018-i': [75, 76, 77, 78, 94, 95, 97, 98, 100, 110, 112, 113, 115, 116, 122, 123, 125, 127, 128, 130, 133, 134, 135, 139, 141],
  '2018-ii': [55, 56, 73, 74, 75, 99, 101, 102, 116, 117, 119, 122, 125, 127, 128, 134, 135, 136, 139, 143],
  '2017-ii': [58, 60, 61, 93, 98, 100, 141, 142, 143, 144, 146, 147],
  '2016-i': [107, 113],
  '2016-ii': [137, 138],
  '2015-i': [111, 112],
  '2015-ii': [89, 131, 139, 141, 146],
  '2014-i': [80, 111, 143],
  '2014-ii': [75],
};
const sourceById = new Map(Object.entries(roster).flatMap(([paper, numbers]) => {
  const kind = paper === '2024-ii' ? 'reviewed' : 'official';
  const { questions } = readContent(`nda-${paper}-${kind}-paper.json`);
  return numbers.map(number => {
    const id = `nda-${paper}-${number}`;
    const source = questions.find(question => question.id === id);
    assert.ok(source, `${id} must have an original source record`);
    return [id, source];
  });
}));
const bankById = new Map(combinedQuestions.map(question => [question.id, question]));

const screenshotPlacements = {
  'nda-2018-i-115': 'syllabus:geography/indian-geography/industry-and-transport/industrial-location',
  'nda-2018-i-133': 'syllabus:history/medieval-india/sources-and-chronology/literary-sources',
  'nda-2018-i-134': 'syllabus:history/medieval-india/sources-and-chronology/foreign-accounts',
  'nda-2018-i-135': 'syllabus:history/medieval-india/regional-kingdoms/rajput-states',
  'nda-2018-ii-73': 'syllabus:geography/physical-geography/latitudes-longitudes-time-and-motions-of-the-earth/rotation-and-time',
  'nda-2018-ii-116': 'syllabus:geography/indian-geography/industry-and-transport/road-and-rail-networks',
};

test('the audited 95 preserve original paper content, answers, figures and eligibility', () => {
  assert.equal(sourceById.size, 95);
  assert.deepEqual(records.map(row => row.questionId).sort(), [...sourceById.keys()].sort());
  assert.equal(bankById.size, combinedQuestions.length);
  assert.equal(records.filter(row => row.resolution === 'agreed').length, 59);
  assert.equal(records.filter(row => row.resolution === 'adjudicated').length, 36);
  for (const row of records) {
    assert.ok(row.reviewerA.reviewerId.trim() && row.reviewerB.reviewerId.trim(), row.questionId);
    assert.notEqual(row.reviewerA.reviewerId, row.reviewerB.reviewerId, row.questionId);
    assert.ok(row.rationale.trim() && row.reviewerA.rationale.trim() && row.reviewerB.rationale.trim(), row.questionId);
    assert.ok(row.additionalIds.length <= 1, row.questionId);
    const question = bankById.get(row.questionId);
    const source = sourceById.get(row.questionId);
    assert.ok(question && source, row.questionId);
    assert.equal(question.sourceTextHash, row.expectedSourceTextHash, row.questionId);
    for (const field of [
      'exam', 'year', 'paper', 'questionNumber', 'source', 'sourceText', 'sourceTextHash', 'sourceTextLocked',
      'promptLines', 'options', 'answer', 'acceptedAnswers', 'sharedContext',
      'requiresFigure', 'figureKey', 'figureAlt',
    ]) {
      if (Object.hasOwn(source, field)) {
        assert.deepEqual(question[field], source[field], `${row.questionId}/${field}`);
      }
    }
    assert.equal(questionEligible(row.questionId), true, row.questionId);
    assert.equal(questionInGsScope(row.questionId), row.scope === 'prelims', row.questionId);
    assert.deepEqual(question.classificationTags, [row.tag], row.questionId);
    assert.equal(question.classificationRevision, classificationRevision, row.questionId);
    if (row.scope !== 'original-paper-only') assert.equal(question.taxonomyId, row.primaryId, row.questionId);
    assert.deepEqual(question.additionalPaths.map(path => path.taxonomyId), row.additionalIds, row.questionId);
  }
  for (const [id, leaf] of Object.entries(screenshotPlacements)) {
    assert.equal(bankById.get(id).taxonomyId, leaf, id);
  }
});

async function workerFetch(path, init) {
  const { default: worker } = await import('../dist/server/index.js');
  return worker.fetch(new Request(`http://localhost${path}`, init), {
    ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

async function inventory(preparationExam) {
  const query = preparationExam ? `?preparationExam=${preparationExam}` : '';
  const response = await workerFetch(`/api/pyqs/inventory${query}`);
  assert.equal(response.status, 200);
  return response.json();
}

function liveLeaves(data) {
  return data.nodes.filter(node => node.kind === 'subtopic' && !node.legacyOnly);
}

function inventoryPaths(data) {
  const byId = new Map([...data.nodes, ...data.subjects].map(node => [node.id, node]));
  return new Map(liveLeaves(data).map(leaf => {
    const labels = [leaf.label];
    for (let parent = byId.get(leaf.parentId); parent; parent = byId.get(parent.parentId)) {
      labels.unshift(parent.label);
    }
    return [JSON.stringify(labels), leaf];
  }));
}

function labelPath(leaf) {
  return [canonicalSubjectLabel(leaf.subject), leaf.head, leaf.chapter, leaf.subtopic];
}

test('current Prelims and defence inventories expose the audited scope routes', async () => {
  const [prelims, cse, nda, cds] = await Promise.all([
    inventory(), inventory('CSE'), inventory('NDA'), inventory('CDS'),
  ]);
  const pathToLeaf = inventoryPaths(prelims);
  const prelimsNdaIds = new Set(liveLeaves(prelims).flatMap(leaf => leaf.questionIdsByExam.NDA));
  const cseNdaIds = new Set(liveLeaves(cse).flatMap(leaf => leaf.questionIdsByExam.NDA));
  const cseMagnetism = inventoryPaths(cse).get(JSON.stringify(labelPath(prelimsPath(
    'syllabus:science-technology/physics/light-and-electricity/magnetism',
  ))));
  assert.ok(cseMagnetism?.questionIdsByExam.NDA.includes('nda-2018-ii-122'));
  for (const row of records) {
    assert.equal(prelimsNdaIds.has(row.questionId), row.scope === 'prelims', row.questionId);
    if (row.scope === 'prelims') {
      for (const id of [row.primaryId, ...row.additionalIds]) {
        const path = prelimsPath(id);
        assert.ok(path, `${row.questionId}/${id}`);
        const leaf = pathToLeaf.get(JSON.stringify(labelPath(path)));
        assert.ok(leaf?.questionIdsByExam.NDA.includes(row.questionId), `${row.questionId}/${id}`);
      }
    } else {
      assert.ok(!cseNdaIds.has(row.questionId), row.questionId);
    }
    if (row.scope === 'defence-only' && row.primaryId.startsWith('subtopic:history:world-history:')) {
      for (const data of [nda, cds]) {
        const leaf = liveLeaves(data).find(node => node.id === row.primaryId);
        assert.ok(leaf?.questionIdsByExam.NDA.includes(row.questionId), `${data.preparationExam}/${row.questionId}`);
      }
    }
  }
});

test('search renders the historical biographies question with its History syllabus link', async () => {
  const response = await workerFetch('/?q=historical%20biographies');
  assert.equal(response.status, 200);
  const html = await response.text();
  const renderedQuestion = html.match(/<article class="pyq-search-card">[^]*?<\/article>/g)
    ?.find(card => card.includes('Vikramankadevacharita'));
  assert.ok(renderedQuestion);
  assert.match(renderedQuestion, /Medieval India.*Sources and Chronology.*Literary sources/);
  assert.doesNotMatch(renderedQuestion, /Geomorphic Processes and Landforms/);
});

test('a frozen CSE Geography draft retains Q133 with its corrected History badge', async () => {
  const data = await inventory('CSE');
  const oldLeaf = data.nodes.find(node => node.kind === 'subtopic' && !node.legacyOnly &&
    node.id.includes(':geomorphic-processes-and-landforms:major-landform-types'));
  assert.ok(oldLeaf);
  const questionId = 'nda-2018-i-133';
  const response = await workerFetch('/api/practice-snapshots', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      version: 4,
      preparationExam: 'CSE',
      taxonomyVersion: data.taxonomyVersion,
      subjectIds: [oldLeaf.subjectId],
      paths: [{ subtopicId: oldLeaf.id, exams: ['NDA'] }],
      frozenScopes: [{
        id: oldLeaf.id,
        subjectId: oldLeaf.subjectId,
        label: oldLeaf.label,
        parentId: oldLeaf.parentId,
        order: oldLeaf.order,
        questionIdsByExam: { CSE: [], CAPF: [], CDS: [], NDA: [questionId] },
      }],
      count: 'all',
      order: 'newest',
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  assert.deepEqual(body.questions.map(question => [question.id, question.subject, question.subtopic]),
    [[questionId, 'History', 'Literary sources']]);
});

async function currentNdaSnapshot(data, leaves) {
  const response = await workerFetch('/api/practice-snapshots', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      version: 4,
      taxonomyVersion: data.taxonomyVersion,
      subjectIds: [...new Set(leaves.map(leaf => leaf.subjectId))],
      paths: leaves.map(leaf => ({ subtopicId: leaf.id, exams: ['NDA'] })),
      count: 'all',
      order: 'newest',
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  return body;
}

test('fresh thematic sessions use corrected question membership and badges', async () => {
  const data = await inventory();
  const geomorphChapter = data.nodes.find(node => node.kind === 'topic' &&
    node.label === 'Geomorphic Processes and Landforms' && !node.legacyOnly);
  assert.ok(geomorphChapter);
  const geomorphLeaves = liveLeaves(data).filter(leaf =>
    leaf.parentId === geomorphChapter.id && leaf.questionIdsByExam.NDA.length > 0);
  const geomorphSnapshot = await currentNdaSnapshot(data, geomorphLeaves);
  const geomorphIds = geomorphSnapshot.questions.map(question => question.id);
  assert.equal(geomorphSnapshot.matchingCount, geomorphChapter.examCounts.NDA);
  assert.equal(new Set(geomorphIds).size, geomorphSnapshot.questions.length);
  assert.deepEqual(new Set(geomorphIds), new Set(geomorphLeaves.flatMap(leaf => leaf.questionIdsByExam.NDA)));
  const reviewedGeomorphIds = records.filter(row => row.scope === 'prelims' &&
    [row.primaryId, ...row.additionalIds].some(id =>
      id.startsWith('syllabus:geography/physical-geography/geomorphic-processes-and-landforms/')))
    .map(row => row.questionId);
  assert.deepEqual(new Set(geomorphIds.filter(id => sourceById.has(id))), new Set(reviewedGeomorphIds));
  for (const id of Object.keys(screenshotPlacements)) assert.ok(!geomorphIds.includes(id), id);

  const pathToLeaf = inventoryPaths(data);
  const correctedLeaves = Object.values(screenshotPlacements).map(id =>
    pathToLeaf.get(JSON.stringify(labelPath(prelimsPath(id)))));
  assert.ok(correctedLeaves.every(Boolean));
  const correctedSnapshot = await currentNdaSnapshot(data, correctedLeaves);
  const questions = new Map(correctedSnapshot.questions.map(question => [question.id, question]));
  for (const [id, leaf] of Object.entries(screenshotPlacements)) {
    const question = questions.get(id);
    assert.ok(question, id);
    assert.deepEqual([question.subject, question.section, question.topic, question.subtopic],
      labelPath(prelimsPath(leaf)), id);
  }
});

test('routing questions out of Prelims keeps them available in their original papers', async () => {
  const response = await workerFetch('/api/practice-snapshots', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      version: 5,
      paperKeys: ['NDA:I:GAT:2018', 'NDA:II:GAT:2018'],
      count: 'all',
      order: 'newest',
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  const questions = new Map(body.questions.map(question => [question.id, question]));
  for (const row of records.filter(row => row.scope !== 'prelims')) {
    const question = questions.get(row.questionId);
    assert.ok(question, row.questionId);
    assert.equal(question.sourceTextHash, row.expectedSourceTextHash, row.questionId);
  }
});
