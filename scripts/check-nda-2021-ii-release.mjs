// Read-only release checks: no stored test, database or deployment mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=process.argv[2]??'http://127.0.0.1:4173';assert.ok(/^https?:\/\//.test(base));
const paper=JSON.parse(fs.readFileSync('content/nda-2021-ii-official-paper.json','utf8'));
const policy=JSON.parse(fs.readFileSync('content/nda-2021-ii-official-review-policy.json','utf8'));
// Only transport errors are retried, with a bounded timeout; HTTP/assertion
// failures are never suppressed. Grading and these snapshots are read-only.
const transport=async(path,body,decode)=>{for(let attempt=1;attempt<=3;attempt++){try{const r=await fetch(base+path,{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});assert.ok(r.ok,`${path}: ${r.status}`);return await decode(r);}catch(error){if(!(error instanceof TypeError||['TimeoutError','AbortError'].includes(error.name))||attempt===3)throw error;console.error(`Transport attempt ${attempt} failed for ${path}: ${error.cause?.code??error.name}`);}}};
const json=(path,body)=>transport(path,body,r=>r.json());
const inventory=await json('/api/pyqs/inventory?preparationExam=NDA');
const members=i=>new Set(i.nodes.filter(n=>n.kind==='subtopic').flatMap(n=>Object.values(n.questionIdsByExam).flat()));
const all=members(inventory),cse=members(await json('/api/pyqs/inventory?preparationExam=CSE'));
for(const q of paper.questions){assert.equal(all.has(q.id),true,q.id);if(q.preparationScope!=='gs')assert.equal(cse.has(q.id),false,q.id);}
const ids=paper.questions.map(q=>q.id),contentRevisions=Object.fromEntries(ids.map(id=>[id,policy[id].contentRevision]));
for(const a of ['A','B','C','D']){const result=await json('/api/practice/grade',{questionIds:ids,answers:Object.fromEntries(ids.map(id=>[id,a])),contentRevisions});assert.equal(result.scored,150);assert.equal(result.excluded,0);for(const q of paper.questions){assert.equal(result.feedback[q.id].correct,(q.acceptedAnswers??[q.answer]).includes(a),`${q.id}/${a}`);assert.equal(result.feedback[q.id].correctAnswer,q.answer||null);}}
const multiple=await json('/api/practice/grade',{questionIds:['nda-2021-ii-102'],answers:{'nda-2021-ii-102':'C'},contentRevisions:{'nda-2021-ii-102':policy['nda-2021-ii-102'].contentRevision}});
assert.equal(multiple.correct,1);assert.deepEqual(multiple.feedback['nda-2021-ii-102'].correctAnswers,['B','C']);
const historic=await json('/api/practice/grade',{questionIds:['nda-2021-ii-84'],answers:{'nda-2021-ii-84':'C'},contentRevisions:{'nda-2021-ii-84':0}});
assert.equal(historic.excluded,1);assert.equal(historic.scored,0);assert.equal(historic.feedback['nda-2021-ii-84'].correct,null);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [path,expected] of [[paper.evidence.asset,paper.evidence.sha256],...paper.questions.filter(q=>q.requiresFigure).map(q=>[q.figureKey,q.source.figureSha256])])assert.equal(hash(await transport(path,null,async r=>Buffer.from(await r.arrayBuffer()))),expected,path);
const sources=await transport('/legal/sources',null,r=>r.text());assert.match(sources,/150\/150 available.*official final key.*English 50.*Science 50.*GS 50/);
console.log(JSON.stringify({base,paperId:paper.paperId,eligible:150,withdrawn:0,optionDecisions:600,figureHashes:1,multipleAnswer102:true,historical84Protected:true,officialKeyHash:paper.evidence.sha256,englishInventory:inventory.subjects.find(s=>s.id==='subject:english').questionCount,sourceDisclosure:true,result:'passed'},null,2));
