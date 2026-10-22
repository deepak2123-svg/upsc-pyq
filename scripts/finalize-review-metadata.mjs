import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const bankFile='content/question-bank.json', registerFile='content/question-review-state.json';
const bank=JSON.parse(fs.readFileSync(bankFile)), register=JSON.parse(fs.readFileSync(registerFile));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const hash=q=>sha(JSON.stringify({sourceText:q.sourceText,options:q.options}));
let changed=0;
for(const [id,row] of Object.entries(register.records)) {
  const q=bank.questions.find(q=>q.id===id);
  if(row.metadataFinalized) continue;
  const beforeReason=row.reason;
  if(row.identity.series==='B') row.reason=row.reason.replace(/Series A/g,'Series B');
  if(row.reason!==beforeReason) {
    row.metadataChanges??=[];
    row.metadataChanges.push({field:'reason',before:beforeReason,after:row.reason,reason:'Correct the prose booklet label to match the already-reviewed Series B evidence; no key/content change.'});
    q.explanation=row.reason;
  }
  if(row.status==='reasoned-verified' && q.source.answerAudit?.originalKeyAnswer) {
    q.source.answerAudit.reasonedAnswer=q.source.answerAudit.originalKeyAnswer;
    delete q.source.answerAudit.originalKeyAnswer;
    q.source.answerAudit.method='primary-source-reasoning';
  }
  if(['duplicate','withdrawn','quarantined'].includes(row.status)) q.source.answerStatus=row.status;
  // A provisional canonical identity remains provisional even when this copy is excluded.
  if(id==='cds-2026-2026-88') for(const e of row.evidence) if(e.kind==='official-final-key-mirror') e.kind='official-provisional-key-mirror';
  if(id==='cds-2016-2016-51') {
    const before=structuredClone(q);
    assert.equal(q.sourceText,"Doctors Without Borders (Medecins Sans Frontiercs)', often in the news, is");
    q.sourceText="'Doctors Without Borders (Medecins Sans Frontieres)', often in the news, is";
    q.promptLines=[q.sourceText];q.sourceTextHash=sha(q.sourceText);
    q.options.A='a division of World Health Organization';
    q.options.C='an inter-governmental agency sponsored by European Union';
    row.contentRevision++;
    row.changes.push({approvalHash:sha('final-visual-ocr-pass-2016-q51-v1'),beforeHash:hash(before),afterHash:hash(q),before,reason:'Final visual comparison with original CSE 2016 PDF page 21 corrects OCR Frontieres, inter-governmental and case of of; official B unchanged.',followup:true});
  }
  row.metadataFinalized=true;
  row.revision++;
  changed++;
}
fs.writeFileSync(bankFile,JSON.stringify(bank,null,2)+'\n');
fs.writeFileSync(registerFile,JSON.stringify(register,null,2)+'\n');
console.log({metadataFinalized:changed});
