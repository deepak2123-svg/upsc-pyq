import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifest=read('content/reviewed-prelims-reproduction-corrections.json');
const bank=new Map([...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions].map(q=>[q.id,q]));
const output={};
for(const row of manifest.records) {
  assert.ok(!output[row.questionId],`Repeated reproduction correction: ${row.questionId}`);
  const question=bank.get(row.questionId);
  assert.ok(question);assert.equal(hash(JSON.stringify(question)),row.expectedRecordHash,'Reviewed source record changed');
  assert.equal(row.status,'approved');assert.equal(row.material,false,'Material repairs require the separate historical-grading revision workflow');
  assert.ok(row.rationale&&row.secondPass&&row.changes.length);
  assert.ok(Number.isSafeInteger(row.revision)&&row.revision>0);
  assert.equal(question.answer,row.acceptedAnswer);assert.equal(row.evidence.keyAnswer,row.acceptedAnswer);
  assert.equal(question.questionNumber,row.evidence.questionNumber);
  let sourceText=question.sourceText;
  let promptLines=[...question.promptLines];
  for(const change of row.changes) {
    assert.ok(change.from&&change.from!==change.to);
    assert.equal(sourceText.split(change.from).length,2,'Correction must match exactly one reviewed phrase');
    sourceText=sourceText.replace(change.from,change.to);
    let count=0;
    promptLines=promptLines.map(line=>{if(line.includes(change.from)){count++;return line.replace(change.from,change.to);}return line;});
    assert.equal(count,1,'Display phrase must also match exactly once');
  }
  const sourceTextHash=hash(sourceText);
  assert.equal(sourceTextHash,row.expectedCorrectedSourceTextHash);
  const words=value=>value.replace(/\s+/g,' ').trim();
  assert.equal(words(promptLines.join(' ')),words(sourceText),'Corrected display and source transcript diverge');
  if(process.argv.includes('--verify-local-sources')) {
    assert.equal(hash(fs.readFileSync(row.evidence.originalPdf)),row.evidence.originalPdfSha256);
    assert.equal(hash(fs.readFileSync(row.evidence.keyPdf)),row.evidence.keySha256);
  }
  output[row.questionId]={revision:row.revision,material:false,promptLines,sourceText,sourceTextHash};
}
const file='content/prelims-reproduction-overrides.json',bytes=`${JSON.stringify(output,null,2)}\n`;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Stale reviewed reproduction overrides');
else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==bytes)fs.writeFileSync(file,bytes);
console.log(JSON.stringify({nonmaterialReproductionOverrides:Object.keys(output).length,rawBankChanged:false,answerRevisionsChanged:false}));
