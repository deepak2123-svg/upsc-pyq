import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const bank = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
const file = 'content/audits/approved-question-reconstructions.json';
const approvals = JSON.parse(fs.readFileSync(file));
const register = JSON.parse(fs.readFileSync('content/question-review-state.json'));
// Manually transcribed from the visually inspected Series A official table, page 1.
const capf = {1:'A',8:'B',71:'A',72:'B',73:'C',74:'C',75:'A',76:'D',77:'D',78:'D',80:'C',81:'D',82:'D',85:'C',95:'A',121:'D',122:'C',123:'A',124:'B',125:'A'};
const page = n => n === 1 ? 3 : n === 8 ? 5 : n <= 75 ? 33 : n <= 80 ? 35 : n <= 85 ? 37 : n === 95 ? 39 : n === 121 ? 49 : 51;
for (const [number, answer] of Object.entries(capf)) {
  const id = `capf-2025-i-${number}`;
  if (approvals.corrections.some(r => r.id === id)) continue;
  const q = bank.find(q => q.id === id);
  assert.equal(register.records[id].status, 'pending');
  const sourcePdf = 'C:/Users/iamdj/Desktop/KIS NDA/PYP/CAPF PYP/2025.pdf';
  const localPdf = 'content/audits/CAPF-2025-official-final-key.pdf';
  approvals.corrections.push({id, expectedHash:sha(JSON.stringify({sourceText:q.sourceText,options:q.options})),exam:'CAPF',year:2025,paper:'I',questionNumber:Number(number),series:'A',page:page(Number(number)),sourcePdf,sourcePdfSha256:sha(fs.readFileSync(sourcePdf)),answer,
    key:{localPdf,sha256:sha(fs.readFileSync(localPdf)),series:'A',page:1,source:'https://www.upsc.gov.in/sites/default/files/AnsKey-CAPFACs-Exam-2025-GAI-110826.pdf'},
    reason:`Original Series A Q${number}, PDF page ${page(Number(number))}, full wording and all four displayed options compared with the original paper. Official final Series A key page 1 accepts ${answer}; separate second-pass comparison confirmed the cell and displayed option.${Number(number) === 123 ? ' Official answer A retained: statement 2 omits UNEP, which jointly established IPCC with WMO; the former C key is not retained.' : ''}`});
}
const nda = JSON.parse(fs.readFileSync('content/audits/nda-2025-i-primary-review.json'));
for (const item of nda.records) {
  const id = `nda-2025-i-${item.number}`;
  if (approvals.corrections.some(r => r.id === id)) continue;
  const q = bank.find(q => q.id === id);
  assert.equal(register.records[id].status, 'pending');
  const sourcePdf = 'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2025-1.pdf';
  const primaryEvidence = item.evidence.map(e => ({...e,...(e.localPdf ? {sha256:sha(fs.readFileSync(e.localPdf))} : {})}));
  const text = q.sourceText.replace('Longi- tude','Longitude').replace('per- centage','percentage').replace('unculti- vated','uncultivated');
  approvals.corrections.push({id,expectedHash:sha(JSON.stringify({sourceText:q.sourceText,options:q.options})),exam:'NDA',year:2025,paper:'I',questionNumber:item.number,series:'A',page:item.number<=90?25:item.number<=95?27:item.number<=102?29:31,sourcePdf,sourcePdfSha256:sha(fs.readFileSync(sourcePdf)),answer:item.answer,status:item.status??'reasoned-verified',reason:item.reason,primaryEvidence,...(text!==q.sourceText?{replacement:{sourceText:text,options:q.options}}:{})});
}
fs.writeFileSync(file, JSON.stringify(approvals,null,2)+'\n');
