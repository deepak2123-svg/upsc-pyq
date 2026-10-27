// Read-only release checks. No import, deployment or database mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=process.argv[2]??'http://127.0.0.1:4173';
assert.ok(/^https?:\/\//.test(base));
const paper=JSON.parse(fs.readFileSync('content/nda-2024-ii-reviewed-paper.json','utf8'));
const audit=JSON.parse(fs.readFileSync('content/audits/nda-2024-ii-review.json','utf8'));
const policy=JSON.parse(fs.readFileSync('content/nda-2024-ii-review-policy.json','utf8'));
const json=async(path,body)=>{const r=await fetch(base+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});assert.ok(r.ok,`${path}: ${r.status}`);return r.json();};
const inventory=await json('/api/pyqs/inventory?preparationExam=NDA');
const members=new Set(inventory.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
for(const q of paper.questions)assert.ok(members.has(q.id),q.id);
for(const q of audit.questionSlots.filter(q=>q.disposition==='quarantined'))assert.equal(members.has(q.canonicalQuestionId),false,q.canonicalQuestionId);
const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,policy[id].contentRevision]));
for(const option of ['A','B','C','D']){
 const result=await json('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,option])),contentRevisions});
 assert.equal(result.scored,136);assert.equal(result.excluded,0);
 for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.answer===option,`${q.id}/${option}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer);}
}
const historical=await json('/api/practice/grade',{questionIds:['nda-2024-ii-107','nda-2024-ii-110','nda-2024-ii-139'],answers:{'nda-2024-ii-107':'A','nda-2024-ii-110':'A','nda-2024-ii-139':'A'}});
assert.equal(historical.scored,0);assert.equal(historical.excluded,3);assert.equal(historical.incorrect,0);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const q of paper.questions.filter(q=>q.requiresFigure)){
 const asset=await fetch(base+q.figureKey);assert.ok(asset.ok);assert.equal(hash(Buffer.from(await asset.arrayBuffer())),q.source.figureSha256);
}
const sources=await(await fetch(base+'/legal/sources')).text();assert.match(sources,/136 independently verified questions/);assert.match(sources,/14 remain quarantined/);
console.log(JSON.stringify({base,paperId:paper.paperId,eligible:136,quarantined:14,optionDecisions:544,figureHashes:5,historicalExcluded:3,sourceDisclosure:true,result:'passed'},null,2));
