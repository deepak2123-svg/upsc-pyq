import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const file='content/taxonomy/prelims-legacy-inventory.json';
if(fs.existsSync(file)) {
  const saved=JSON.parse(fs.readFileSync(file));
  assert.equal(saved.purpose,'exact pre-expansion leaf membership for saved selections');
  console.log(`Existing frozen inventory retained: ${saved.inventory.nodes.length} nodes`);
} else {
  const {default:worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('http://localhost/api/pyqs/inventory'),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const inventory=await response.json();
  assert.equal(inventory.version,4);
  assert.equal(inventory.totalCount,1497);
  const bankSha256=crypto.createHash('sha256').update(fs.readFileSync('content/question-bank.json')).digest('hex');
  fs.writeFileSync(file,`${JSON.stringify({version:1,purpose:'exact pre-expansion leaf membership for saved selections',bankSha256,inventory},null,2)}\n`);
  console.log(`Frozen ${inventory.nodes.length} nodes with exact answer-free leaf memberships`);
}
