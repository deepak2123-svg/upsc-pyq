// Read-only release checks: no stored test, database or deployment mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=process.argv[2]??'http://127.0.0.1:4173';assert.ok(/^https?:\/\//.test(base));
const paper=JSON.parse(fs.readFileSync('content/nda-2024-i-official-paper.json','utf8'));
const policy=JSON.parse(fs.readFileSync('content/nda-2024-i-official-review-policy.json','utf8'));
const json=async(path,body)=>{const r=await fetch(base+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});assert.ok(r.ok,`${path}: ${r.status}`);return r.json();};
const inventory=await json('/api/pyqs/inventory?preparationExam=NDA');
const members=i=>new Set(i.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
const all=members(inventory),cse=members(await json('/api/pyqs/inventory?preparationExam=CSE'));
for(const q of paper.questions){assert.equal(all.has(q.id),q.questionNumber!==101,q.id);if(q.preparationScope!=='gs')assert.equal(cse.has(q.id),false,q.id);}
const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,policy[id].contentRevision]));
for(const a of ['A','B','C','D']){const result=await json('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,a])),contentRevisions});assert.equal(result.scored,149);assert.equal(result.excluded,1);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,q.questionNumber===101?null:q.answer===a,`${q.id}/${a}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer||null);}}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [path,expected] of [[paper.evidence.asset,paper.evidence.sha256],...paper.questions.filter(q=>q.requiresFigure).map(q=>[q.figureKey,q.source.figureSha256])]){const r=await fetch(base+path);assert.ok(r.ok,path);assert.equal(hash(Buffer.from(await r.arrayBuffer())),expected,path);}
const sources=await(await fetch(base+'/legal/sources')).text();assert.match(sources,/149\/150 available.*official final key.*Q101 withdrawn/);
console.log(JSON.stringify({base,paperId:paper.paperId,eligible:149,withdrawn:1,optionDecisions:600,figureHashes:8,officialKeyHash:paper.evidence.sha256,englishInventory:inventory.subjects.find(s=>s.id==='subject:english').questionCount,sourceDisclosure:true,result:'passed'},null,2));
