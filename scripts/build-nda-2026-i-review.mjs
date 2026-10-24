import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {nda2026IBatch1} from './prelims-nda-2026-i-review-batch-1.mjs';
import {nda2026IEvidence,nda2026IPrimaryEvidence,nda2026IQuestions,nda2026ISecondPass,validateNda2026IEvidence} from './prelims-reviewed-nda-2026-i-imports.mjs';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
validateNda2026IEvidence();
const rawBytes=fs.readFileSync('content/question-bank.json');
assert.equal(hash(rawBytes),'af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d');
const bank=JSON.parse(rawBytes).questions.filter(q=>q.exam==='NDA'&&q.year===2026&&q.paper==='I');
assert.equal(bank.length,24);
const legacy=new Map(bank.map(q=>[q.questionNumber,q]));
assert.equal(legacy.size,bank.length);
const imports=new Map(nda2026IQuestions.map(q=>[q.questionNumber,q]));
const firstPass=new Map(nda2026IBatch1.map(q=>[q.number,q]));
assert.equal(firstPass.size,20);
const rows=Array.from({length:150},(_,index)=>{
 const questionNumber=index+1,old=legacy.get(questionNumber),draft=firstPass.get(questionNumber),approved=imports.get(questionNumber);
 if(approved)assert.equal(old,undefined,'Do not duplicate an existing source occurrence');
 return {questionNumber,existingId:old?.id??null,existingRecordHash:old?hash(JSON.stringify(old)):null,
  disposition:questionNumber<=50?'out-of-scope':approved?'reasoned-verified':draft?'quarantined':'pending-current-source-review',
  ...(questionNumber<=50?{reason:'English Part A; GS-only scope exclusion, not an answer verification',sourcePages:[2,3,4,5,6,7]}:{}),
  ...(draft?{originalPage:draft.page,firstPass:draft,secondPass:nda2026ISecondPass[questionNumber]??{status:'held',reason:draft.caveat},approvedId:approved?.id??null}:{}),
  publicationDecisionThisPass:approved?'approved-local-import':'not-newly-cleared',
 };
});
const ledger={version:1,status:'paper-review-in-progress',reviewedAt:'2026-10-24',evidence:nda2026IEvidence,primaryEvidence:nda2026IPrimaryEvidence,
 rejectedSecondaryKey:{localFile:'../.tmp/full_reaudit_clean_cache/NDA_1_2026_GAT_Answer_Key_SET_A.pdf',status:'secondary-only-not-clearance-evidence',
  reason:'Prepp-branded table is not an official UPSC key. Opening Q51/Q52/Q53 cells C/B/B conflict with independently derived displayed A/C/D; no blanket remapping is inferred.'},
 existingMetadataFlags:[{questionId:'cds-2026-2026-1-139',issue:'Prior official-provisional label cites a Prepp-hosted PDF; reassess source/key status when reviewing Q139. Original ID and attempt references retained.'},{questionId:'cds-2026-2026-1-146',issue:'Prior official-provisional label cites a Prepp-hosted PDF; reassess source/key status when reviewing Q146. Original ID and attempt references retained.'}],
 counts:{total:150,outOfScope:50,reasonedVerified:15,quarantined:5,pendingCurrentSourceReview:80,existingOccurrences:24},records:rows,
 nextBatch:{from:71,to:100,note:'Q72 requires its original circuit figure. Do not import it as text-only.'},
};
for(const [status,count]of [['out-of-scope',50],['reasoned-verified',15],['quarantined',5],['pending-current-source-review',80]])assert.equal(rows.filter(row=>row.disposition===status).length,count);
const file='content/audits/nda-2026-i-review.json',bytes=JSON.stringify(ledger,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Stale NDA I review register');
else fs.writeFileSync(file,bytes);
console.log(JSON.stringify(ledger.counts));
