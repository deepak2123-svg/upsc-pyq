import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPlacementIndex, placementSelection } from '../lib/question-placements.ts';
import {matchesPlacementLocations} from '../lib/placement-recipe-core.ts';

const nodes = [
  { id: 'history', parentId: null, kind: 'subject' },
  ...['ancient', 'art'].flatMap(section => [
    { id: section, parentId: 'history', kind: 'section' },
    { id: `${section}-chapter`, parentId: section, kind: 'chapter' },
    { id: `${section}-leaf`, parentId: `${section}-chapter`, kind: 'subpart' },
  ]),
];
const questions = [{ id: 'shared', exam: 'CSE', eligible: true }, { id: 'held', exam: 'NDA', eligible: false }, { id: 'unreviewed', exam: 'CDS', eligible: true }];
const placements = questions.map(q => ({ questionId: q.id, primaryId: 'ancient-leaf', additionalIds: ['art-leaf'], status: q.id === 'unreviewed' ? 'pending' : 'approved', rationale: 'Both religious history and architecture are explicitly tested.', secondPass: 'approved' }));
test('server recipe filtering matches complete locations rather than unrelated halves of two placements',()=>{
  const paths=[{subject:'History',topic:'Architecture',taxonomyId:'art'},{subject:'History',topic:'Mauryan Empire',taxonomyId:'ancient'}];
  const recipe={exam:'CSE',sourceMix:false,subjects:['History'],topics:['Mauryan Empire'],subtopics:['ancient']};
  assert.equal(matchesPlacementLocations('CSE',paths,recipe),true);
  assert.equal(matchesPlacementLocations('CSE',paths,{...recipe,topics:['Architecture']}),false);
  assert.equal(matchesPlacementLocations('NDA',paths,recipe),false);
  assert.equal(matchesPlacementLocations('NDA',paths,{...recipe,sourceMix:true}),true);
  assert.equal(matchesPlacementLocations('CSE',[{subject:'Environment & Ecology',topic:'Ecology',taxonomyId:'eco'}],{exam:'CSE',sourceMix:false,subjects:['Environment'],subtopics:['eco']}),true);
});
test('overlap counts once; held and pending placements are not published', () => {
  const index = buildPlacementIndex(nodes, questions, placements);
  const selected = placementSelection(index, { ancient: ['CSE', 'NDA', 'CDS'], art: ['CSE'] });
  assert.deepEqual(selected.questionIds, ['shared']);
  assert.equal(index.questionIdsByScope.get('history').size, 1);
  assert.equal(selected.examCounts.CSE, 1);
});
test('removing a selected branch retains coverage through the other branch', () => {
  const index = buildPlacementIndex(nodes, questions, placements);
  assert.equal(placementSelection(index, { art: ['CSE'] }).count, 1);
  assert.equal(placementSelection(index, { ancient: [] }).count, 0);
  assert.equal(placementSelection(index, {}).count, 0);
});
test('invalid approvals and unknown IDs fail closed', () => {
  assert.throws(() => buildPlacementIndex(nodes, questions, [{ ...placements[0], secondPass: 'pending' }]));
  assert.throws(() => buildPlacementIndex(nodes, questions, [{ ...placements[0], additionalIds: ['missing'] }]));
  assert.throws(() => buildPlacementIndex(nodes, questions, [placements[0], placements[0]]));
  const index = buildPlacementIndex(nodes, questions, placements);
  assert.throws(() => placementSelection(index, { missing: ['CSE'] }));
});
test('cross-subject placements deduplicate and keep source masks independent', () => {
  const crossNodes = [...nodes,
    { id: 'current', parentId: null, kind: 'subject' },
    { id: 'current-section', parentId: 'current', kind: 'section' },
    { id: 'current-chapter', parentId: 'current-section', kind: 'chapter' },
    { id: 'current-leaf', parentId: 'current-chapter', kind: 'subpart' },
  ];
  const cross = [{ ...placements[0], additionalIds: ['art-leaf', 'current-leaf'] }];
  const index = buildPlacementIndex(crossNodes, questions, cross);
  assert.equal(placementSelection(index, { history: ['CSE'], current: ['CSE'] }).count, 1);
  assert.equal(placementSelection(index, { history: [], current: ['CSE'] }).count, 1);
  assert.equal(placementSelection(index, { history: [], current: ['NDA'] }).count, 0);
  assert.equal(index.primaryIdByQuestion.get('shared'), 'ancient-leaf');
});
test('source discovery and existing-record queue do not claim reviews are complete', () => {
  const register = JSON.parse(fs.readFileSync('content/taxonomy/prelims-classification-register.json'));
  const bank = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  assert.equal(register.baselineCount, bank.length);
  assert.deepEqual(Object.keys(register.records).sort(), bank.map(q => q.id).sort());
  const batchIds = register.batches.flatMap(batch => batch.questionIds);
  assert.equal(new Set(batchIds).size, bank.length);
  assert.equal(batchIds.length, bank.length);
  assert.ok(register.batches.every(batch => batch.questionIds.length <= 50));
  const manifest = JSON.parse(fs.readFileSync('content/taxonomy/prelims-source-discovery.json'));
  assert.ok(manifest.sources.length > 0);
  assert.ok(manifest.sources.every(source => source.identityStatus === 'pending-document-review' && source.verifiedIdentity === null));
});
test('syllabus preserves all 92 physical subparts and exactly seven Current Affairs sections', () => {
  const registry = JSON.parse(fs.readFileSync('content/taxonomy/upsc-prelims-v2-draft.json'));
  assert.equal(new Set(registry.nodes.map(n => n.id)).size, registry.nodes.length);
  assert.equal(registry.nodes.filter(n => n.legacyTaxonomyId).length, 92);
  const sections = registry.nodes.filter(n => n.parentId === 'syllabus:current-affairs');
  assert.equal(sections.length, 7);
  assert.ok(sections.every(n => !/miscellaneous|general awareness|^other$/i.test(n.label)));
  assert.equal(registry.nodes.filter(n => n.kind === 'subject').length, 9);
  buildPlacementIndex(registry.nodes, [], []);
});

test('reviewed pilot reuses legacy source identities instead of adding copies', () => {
  const bank = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const imports = JSON.parse(fs.readFileSync('content/reviewed-prelims-imports.json'));
  const policy = JSON.parse(fs.readFileSync('content/prelims-import-review-policy.json'));
  assert.deepEqual(imports.questions.filter(q=>q.year===2013).map(q=>q.id), [4,5,6,9,10,11,12,19,20,25,27,36,37,39,40,41,42,43,44,45,46,47,50,52,56,57,58,59,66,67,68,70,71,74,75,76,79,80,81,82,83,84,85,86,88,89,91,92,93,95,96,99,100].map(n=>`cse-2013-gs-i-${n}`));
  assert.deepEqual(imports.questions.filter(q=>q.year===2014).map(q=>q.id),[7,8,11,12,18,21,25,27,28,29,30,31,32,33,34,37,44,47,49,54,58,59,60,61,63,64,65,66,67,70,72,74,75,76,81,82,83,84,85,86,87,88,89,90,91,92,93,94,97,99,100].map(n=>`cse-2014-gs-i-${n}`));
  assert.deepEqual(imports.placements.map(p=>p.questionId), ['cds-2013-2013-1','cds-2013-2013-2']);
  assert.deepEqual(imports.questions.filter(q=>q.year===2016).map(q=>q.id),[1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,20,21,26,29,31,32,34,35,36,37,38,39,40,41,42,43,46,47,49,50,56,58,59,60,61,62,63,64,65,66,67,69,70,71,72,73,76,78,79,80,82,84,87,88,89].map(n=>`cse-2016-gs-i-${n}`));
  for(const q of imports.questions.filter(q=>q.year===2016)) {
    assert.equal(q.source.originalPage,q.questionNumber<=5?3:q.questionNumber<=11?5:q.questionNumber<=16?7:q.questionNumber<=22?9:q.questionNumber<=27?11:q.questionNumber<=32?13:q.questionNumber<=39?15:q.questionNumber<=45?17:q.questionNumber<=50?19:q.questionNumber<=56?21:q.questionNumber<=62?23:q.questionNumber<=69?25:q.questionNumber<=75?27:q.questionNumber<=80?29:q.questionNumber<=85?31:33);assert.equal(q.source.bookletSeries,'A');
    assert.equal(q.source.originalPdfSha256,'9ecc3d665b9a3df9bd6b46b7f5730bbd989574439474a86f75cd072bc07781f3');
    assert.equal(q.source.keySha256,'376ec3a203b1f9589f70c6d1d5d98a1676bee85a043e1f6dec9c46beb72b4971');
  }
  assert.deepEqual(imports.questions.filter(q=>q.year===2015).map(q=>q.id),[1,2,3,4,7,8,10,16,17,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,37,39,41,44,46,47,48,50,51,53,54,55,56,57,59,60,64,65,67,68,73,75,81,82,83,85,86,87,88,90,92,94,95,96,97,98,99,100].map(n=>`cse-2015-gs-i-${n}`));
  for(const q of imports.questions.filter(q=>q.year===2015)) {
    assert.equal(q.source.originalPdfSha256,'cb82d062ee48ab46ef5e8796c3ed3fff4c28cad7e96af4a27dc7e10e62492e17');
    assert.equal(q.source.keySha256,'6190bfb2d8b2a0d930c43dc1c1a5c813610fc737bb261ebf5015358dc93c4d5a');
    assert.equal(q.source.originalPage,q.questionNumber<=7?2:q.questionNumber<=12?4:q.questionNumber<=18?6:q.questionNumber<=25?8:q.questionNumber<=31?10:q.questionNumber<=37?12:q.questionNumber<=44?14:q.questionNumber<=50?16:q.questionNumber<=56?18:q.questionNumber<=61?20:q.questionNumber<=66?22:q.questionNumber<=71?24:q.questionNumber<=75?26:q.questionNumber<=80?28:q.questionNumber<=85?30:q.questionNumber<=91?32:q.questionNumber<=96?34:36);assert.equal(q.source.bookletSeries,'A');
  }
  for (const q of imports.questions) {
    assert.ok(!bank.some(old=>old.exam===q.exam && old.year===q.year && old.paper===q.paper && old.questionNumber===q.questionNumber));
    assert.equal(policy[q.id].status,q.source.answerStatus==='reasoned-verified'?'reasoned-verified':q.exam==='NDA'&&q.year===2026&&q.paper==='II'?'official-provisional':'official-final');
    assert.equal(q.source.optionsReordered,false);
    assert.equal(q.source.officialAnswer,q.source.answerStatus==='reasoned-verified'?null:q.answer);
    assert.ok(q.source.secondPass);
  }
  assert.ok(imports.placements.every(p=>bank.some(q=>q.id===p.questionId)));
  const ledger=JSON.parse(fs.readFileSync('content/taxonomy/prelims-reviewed-placements.json'));
  for(const number of [8,11]) {
    const id=`cse-2014-gs-i-${number}`,question=imports.questions.find(q=>q.id===id),placement=ledger.records.find(p=>p.questionId===id);
    assert.deepEqual(question.classificationTags,['Event-based']);assert.deepEqual(placement.tags,['Event-based']);
    assert.equal(placement.additionalIds.length,1);assert.equal(placement.eventDate,undefined,'Exam year must not become an event date');
    assert.equal(question.source.originalPdfSha256,'8920775971a7101d3f96fa2f4cf25ee9370ffc55b0997f6f063b54d542d7343b');
    assert.equal(question.source.keySha256,'2c4a77531961fd5798fa9df743d2d54a65e7ca4dfb9b930a73e15c1873500eeb');
  }
  const coverage=JSON.parse(fs.readFileSync('content/taxonomy/prelims-source-coverage.json'));
  const batchAnswers={27:'D',28:'B',29:'D',30:'C',31:'A',32:'C',33:'A',34:'D',37:'A'};
  for(const [number,answer] of Object.entries(batchAnswers)) {
    const question=imports.questions.find(q=>q.id===`cse-2014-gs-i-${number}`);
    assert.equal(question.answer,answer);
    assert.equal(question.source.officialAnswer,answer);
  }
  const arabSpring=ledger.records.find(p=>p.questionId==='cse-2014-gs-i-34');
  assert.deepEqual(arabSpring.tags,['Event-based']);assert.equal(arabSpring.eventDate,undefined);
  assert.deepEqual(ledger.records.find(p=>p.questionId==='cse-2014-gs-i-37').tags,['Static']);
  const cse2013=coverage.questionSlots.filter(row=>row.slotId.startsWith('CSE/2013/'));
  const done=cse2013.filter(row=>row.disposition!=='pending-current-source-review');
  assert.deepEqual(done.map(row=>row.printedQuestionNumber),Array.from({length:100},(_,i)=>i+1));
  assert.equal(done.filter(row=>row.disposition==='verified-local-import').length,53);
  assert.equal(done.filter(row=>row.disposition==='verified-existing-reuse').length,47);
  assert.equal(cse2013.filter(row=>row.disposition==='pending-current-source-review').length,0);
  const paper=coverage.papers.find(row=>row.relativePath==='CSE PYP/2013.pdf');
  assert.equal(paper.identityStatus,'cover-key-and-question-identity-reviewed');
  assert.equal(paper.coverageStatus,'current-source-content-and-key-reviewed');
  assert.equal(paper.reviewedSlots,100);assert.equal(paper.pendingSlots,0);
  assert.equal(paper.verifiedImports,53);assert.equal(paper.verifiedReuses,47);
  assert.equal(paper.year,2013);assert.equal(paper.series,'A');assert.equal(paper.reviewedLanguage,'English');
  assert.equal(coverage.papers.filter(row=>row.coverageStatus==='current-source-content-and-key-reviewed').length,5,'Three complete CSE papers and both source/key-reviewed NDA 2026 GAT papers are complete');
  const next=coverage.papers.find(row=>row.relativePath==='CSE PYP/2014.pdf');
  assert.equal(next.identityStatus,'cover-key-and-question-identity-reviewed');assert.equal(next.coverageStatus,'current-source-content-and-key-reviewed');
  assert.equal(next.reviewedSlots,100);assert.equal(next.pendingSlots,0);
  assert.equal(next.verifiedImports,51);assert.equal(next.verifiedReuses,49);
  const nextSlots=coverage.questionSlots.filter(row=>row.slotId.startsWith('CSE/2014/'));
  assert.deepEqual(nextSlots.filter(row=>row.disposition!=='pending-current-source-review').map(row=>row.printedQuestionNumber),Array.from({length:100},(_,i)=>i+1));
  assert.equal(nextSlots.filter(row=>row.disposition==='pending-current-source-review').length,0);
  for(const n of [55,57,62,71])assert.equal(nextSlots.find(row=>row.printedQuestionNumber===n).reviewedRecordId,`cds-2014-2014-${n}`);
  const report=ledger.records.find(row=>row.questionId==='cse-2014-gs-i-99');
  assert.deepEqual(report.tags,['Static']);assert.equal(report.eventDate,undefined);
  const start2015=coverage.papers.find(row=>row.relativePath==='CSE PYP/2015.pdf');
  assert.equal(start2015.coverageStatus,'current-source-content-and-key-reviewed');
  assert.equal(start2015.reviewedSlots,100);assert.equal(start2015.pendingSlots,0);
  assert.equal(start2015.verifiedImports,62);assert.equal(start2015.verifiedReuses,38);
  const start2016=coverage.papers.find(row=>row.relativePath==='CSE PYP/2016.pdf');
  assert.equal(start2016.coverageStatus,'current-source-review-in-progress');
  assert.equal(start2016.reviewedSlots,90);assert.equal(start2016.pendingSlots,10);
  assert.equal(start2016.verifiedImports,61);assert.equal(start2016.verifiedReuses,29);
  const slots2016=coverage.questionSlots.filter(row=>row.slotId.startsWith('CSE/2016/'));
  assert.deepEqual(slots2016.filter(row=>row.disposition!=='pending-current-source-review').map(row=>row.printedQuestionNumber),Array.from({length:90},(_,i)=>i+1));
  assert.equal(slots2016.find(row=>row.printedQuestionNumber===54).reviewedRecordId,'cse-2016-gs-i-54');
  assert.equal(JSON.parse(fs.readFileSync('content/question-review-policy.json'))['cds-2016-2016-54'].status,'duplicate');
  assert.equal(slots2016.find(row=>row.printedQuestionNumber===25).reviewedRecordId,'cds-2016-2016-25');
  const slots2015=coverage.questionSlots.filter(row=>row.slotId.startsWith('CSE/2015/'));
  assert.deepEqual(slots2015.filter(row=>row.disposition!=='pending-current-source-review').map(row=>row.printedQuestionNumber),Array.from({length:100},(_,i)=>i+1));
  assert.equal(slots2015.find(row=>row.printedQuestionNumber===61).reviewedRecordId,'cds-2015-2015-61');
  for(const n of [40,43,49,52]) {
    assert.equal(slots2015.find(row=>row.printedQuestionNumber===n).reviewedRecordId,`cse-2015-gs-i-${n}`);
    assert.equal(JSON.parse(fs.readFileSync('content/question-review-policy.json'))[`cds-2015-2015-${n}`].status,'duplicate');
  }
  assert.equal(slots2015.find(row=>row.printedQuestionNumber===13).reviewedRecordId,'cds-2015-2015-13');
  for(const n of [2,3]) {
    const p=ledger.records.find(p=>p.questionId===`cse-2015-gs-i-${n}`);
    assert.deepEqual(p.tags,['Event-based']);assert.equal(p.eventDate,undefined);
  }
  assert.equal(done.find(row=>row.printedQuestionNumber===26).reviewedRecordId,'cse-2013-gs-i-26');
  const review=JSON.parse(fs.readFileSync('content/question-review-policy.json'));
  assert.equal(review['cds-2013-2013-26'].status,'duplicate','Source accounting must retain the held alias');
});

test('full-paper work queue accounts for slots but does not promote OCR or transcripts to verification', () => {
  const coverage=JSON.parse(fs.readFileSync('content/taxonomy/prelims-source-coverage.json'));
  assert.equal(coverage.papers.length,74);
  assert.equal(coverage.questionSlots.length,9400);
  assert.equal(new Set(coverage.questionSlots.map(slot=>slot.slotId)).size,9400);
  assert.equal(coverage.papers.filter(p=>p.originalHashMatchesPriorInventory).length,73);
  const staging=JSON.parse(fs.readFileSync('content/taxonomy/prelims-import-staging.json'));
  assert.equal(staging.candidates.length,7210);
  assert.ok(staging.candidates.every(c=>c.publicationStatus==='held'&&c.answerStatus==='secondary-transcript-not-verification'));
});
