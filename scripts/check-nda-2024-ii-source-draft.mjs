// Staging checks do not approve answers or modify the published question bank.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const draft=read('content/staging/nda-2024-ii-source-draft.json');
const register=read('content/audits/nda-2024-ii-paper-register.json');
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json');
const nodes=new Map(registry.nodes.map(node=>[node.id,node]));
const paths=new Set(registry.nodes.filter(node=>node.kind==='subpart').map(node=>{
 const labels=[];while(node){labels.unshift(node.label);node=nodes.get(node.parentId);}return labels.join('/');
}));
const proposedPath='History/Modern India & National Movement/Colonial Economy/Modern industries';
assert.equal(draft.active,false);
assert.deepEqual(draft.questions.map(question=>question.number),Array.from({length:150},(_,i)=>i+1));
assert.equal(new Set(draft.questions.map(question=>question.canonicalQuestionId)).size,150);
for(const question of draft.questions){
 assert.equal(question.eligibleForNewScoredTests,false);
 assert.equal(question.answerEvidence.publicationApproved,false);
 assert.equal(question.finalDisposition,null);
 assert.equal(question.reproduction.sourceTextReviewed,true);
 assert.deepEqual(Object.keys(question.options),['A','B','C','D']);
 assert.ok(question.sourcePages.every(page=>page>=2&&page<=43));
 if(question.classification.scope==='gs'){
  assert.ok(paths.has(question.classification.path)||(question.number===100&&question.classification.path===proposedPath),`Unknown primary path Q${question.number}`);
  for(const path of question.classification.additional)assert.ok(paths.has(path),`Unknown additional path Q${question.number}: ${path}`);
 }
 if(question.number<=50){
  assert.ok(question.sharedContext?.promptLines[0].startsWith('Directions :'));
  for(const text of question.underlined)assert.ok(question.promptLines.join('\n').includes(text));
 }
 if(question.number>=6&&question.number<=15){
  assert.ok(question.standaloneCue);
  assert.ok(question.sharedContext.promptLines[1].includes(`(${question.number})`));
  assert.deepEqual(question.sourcePages,[2,3]);
 }
 if(question.number>=41&&question.number<=45){
  assert.ok(question.sharedContext.promptLines[1].endsWith('around the world.'));
  assert.deepEqual(question.sourcePages,[7,8]);
 }
}
assert.deepEqual(draft.questions[90].originalOptionLabels,['(a)','(c)','(c)','(d)']);
assert.equal(draft.questions[122].answerEvidence.candidateLetter,'X');
assert.equal(register.rawBefore.length,22);
const figures=read('tmp/nda-2024-ii/figures/manifest.json');
const crops=Array.isArray(figures)?figures:figures.figures;
assert.ok(crops,'Figure manifest must expose its crops');
for(const crop of crops){
 assert.equal(hash(fs.readFileSync(crop.path)),crop.sha256);
 assert.equal(draft.questions[crop.number-1].figure.sourcePage,crop.page);
}
assert.deepEqual(crops.map(crop=>crop.number),[64,67,69,70,71,72,125]);
console.log('PASS: 150 unique source slots, 22 preserved IDs, directions/passages/underlines, existing GS paths (Q100 proposal explicit), seven crop hashes, Q91 source defect, and no accidental publication.');
