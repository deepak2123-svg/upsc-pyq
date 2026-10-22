import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const baseline=read('content/taxonomy/prelims-classification-register.json');
const ledger=read('content/taxonomy/prelims-reviewed-placements.json');
const bank=read('content/question-bank.json').questions;
const byId=new Map(bank.map(q=>[q.id,q]));
const decisions=new Map(ledger.records.map(row=>[row.questionId,row]));
const records=Object.fromEntries(Object.entries(baseline.records).map(([id,old])=>{
  const question=byId.get(id);
  assert.ok(question,id);
  const digest=crypto.createHash('sha256').update(JSON.stringify(question)).digest('hex');
  assert.equal(digest,old.expectedRecordHash,`Frozen original record changed: ${id}`);
  const decision=decisions.get(id);
  if(decision)assert.equal(decision.expectedRecordHash,digest,id);
  return [id,{...old,classificationStatus:decision?.status||'pending',primaryId:decision?.primaryId||null,additionalIds:decision?.additionalIds||[],tags:decision?.tags||[],rationale:decision?.rationale||null,secondPass:decision?.secondPass||{status:'pending'},...(decision?.editorialFollowUps?{editorialFollowUps:decision.editorialFollowUps}:{}),...(decision?{decisionBasis:decision.basis,decisionLedger:'content/taxonomy/prelims-reviewed-placements.json'}:{})}];
}));
const batches=baseline.batches.map(batch=>{
  const pendingIds=batch.questionIds.filter(id=>!['approved','out-of-scope'].includes(records[id].classificationStatus));
  return {...batch,status:pendingIds.length?'pending':'complete',pendingIds,completedCount:batch.questionIds.length-pendingIds.length};
});
assert.equal(Object.keys(records).length,baseline.baselineCount);
const counts=Object.fromEntries(['approved','out-of-scope','pending'].map(status=>[status,Object.values(records).filter(row=>row.classificationStatus===status).length]));
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),baseline.baselineCount);
const output={version:1,taxonomyVersion:ledger.taxonomyVersion,status:counts.pending?'current-review-state-full-cohort-not-complete':'original-cohort-placement-decisions-complete-source-and-import-review-incomplete',originalCohort:baseline.baselineCount,counts,records,batches,
  additionalImportedRecords:ledger.records.filter(row=>!Object.hasOwn(baseline.records,row.questionId)),
  note:'Preserved Physical Geography decisions are explicitly distinguished from fresh source/option review. Answer eligibility remains in the independent review policy.'};
const value=`${JSON.stringify(output,null,2)}\n`,file='content/taxonomy/prelims-classification-current.json';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),value,'Stale current classification register');
else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==value)fs.writeFileSync(file,value);
console.log(JSON.stringify({originalCohort:baseline.baselineCount,counts,completedBatches:batches.filter(b=>b.status==='complete').length,pendingBatches:batches.filter(b=>b.status!=='complete').length,nextBatch:batches.find(b=>b.pendingIds.length)?.id}));
