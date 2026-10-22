import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bank=new Map(read('content/question-bank.json').questions.map(q=>[q.id,q]));
const manifest=read('content/reviewed-question-aliases.json');
const evidence=read('content/question-review-state.json').records;
const aliases=new Set(manifest.records.map(r=>r.aliasId));
assert.equal(aliases.size,manifest.records.length,'Repeated alias approval');
const policy={};
for(const row of manifest.records) {
  const alias=bank.get(row.aliasId),canonical=bank.get(row.canonicalId);
  assert.ok(alias&&canonical,'Alias and canonical records must remain available historically');
  assert.notEqual(row.aliasId,row.canonicalId);
  assert.ok(!aliases.has(row.canonicalId),'Canonical alias chains are not allowed');
  assert.equal(hash(alias),row.expectedAliasHash,'Alias changed; re-review before applying');
  assert.equal(hash(canonical),row.expectedCanonicalHash,'Canonical changed; re-review before applying');
  assert.equal(row.review.status,'approved');
  assert.ok(row.review.rationale&&row.review.secondPass);
  for(const key of ['exam','year','paper','questionNumber']) {
    assert.equal(alias[key],canonical[key],`Different source occurrence: ${key}`);
    assert.equal(alias[key],row.review.source[key]);
  }
  assert.deepEqual(alias.promptLines,canonical.promptLines,'Displayed stems differ');
  assert.deepEqual(alias.options,canonical.options,'Displayed options differ');
  assert.equal(alias.answer,canonical.answer,'Conflicting key requires separate resolution');
  const prior=evidence[row.review.evidenceReviewRecordId];
  assert.equal(row.review.evidenceReviewRecordId,row.canonicalId);
  assert.equal(prior.status,'official-final');
  assert.equal(prior.identity.status,'verified');
  assert.equal(prior.reproduction.status,'verified');
  assert.equal(prior.answer.status,'verified');
  assert.ok(prior.evidence.some(e=>e.sha256===row.review.paperSha256));
  assert.ok(prior.evidence.some(e=>e.sha256===row.review.keySha256));
  assert.ok(Number.isInteger(row.revision)&&row.revision>0);
  policy[row.aliasId]={status:'duplicate',revision:row.revision,contentRevision:0,canonicalId:row.canonicalId};
}
const file='content/prelims-question-alias-policy.json';
const bytes=JSON.stringify(policy,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Stale reviewed alias policy');
else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==bytes)fs.writeFileSync(file,bytes);
console.log(JSON.stringify({reviewedDuplicateAliases:manifest.records.length,historicalIdsPreserved:true,rawBankChanged:false}));
