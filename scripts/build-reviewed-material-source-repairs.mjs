import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifest=read('content/reviewed-material-source-repairs.json');
const reviewedPapers=read('content/prelims-reviewed-papers.json').records;
const basePolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-question-alias-policy.json')};
const bank=new Map([...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions].map(q=>[q.id,q]));
const cleared=new Set(['official-final','official-provisional','reasoned-verified']);
const overrides={},policy={};
for(const row of manifest.records) {
  assert.ok(!overrides[row.questionId],'Repeated material-repair approval');
  const question=bank.get(row.questionId),previous=basePolicy[row.questionId];
  assert.ok(question);assert.equal(hash(JSON.stringify(question)),row.expectedRecordHash,'Changed raw record: re-review required');
  assert.ok(!previous||cleared.has(previous.status),'A held record needs independent eligibility clearance, not a text-only repair');
  assert.equal(previous?.revision??0,row.expectedPreviousReviewRevision);
  assert.equal(previous?.contentRevision??0,row.expectedPreviousContentRevision);
  assert.equal(row.status,'official-final');assert.equal(row.material,true);
  assert.equal(row.historicalDisposition,'exclude-before-content-revision');
  assert.equal(row.revision,row.expectedPreviousReviewRevision+1);
  assert.equal(row.contentRevision,row.expectedPreviousContentRevision+1);
  assert.ok(row.rationale&&row.secondPass&&(row.changes.length||row.optionChanges?.length));
  assert.equal(row.evidence.series,'A');assert.equal(row.evidence.optionsReordered,false);
  const paper=reviewedPapers.find(p=>p.originalPdfSha256===row.evidence.originalPdfSha256);
  assert.ok(paper,'Material repair requires a reviewed paper identity');
  assert.equal(paper.keySha256,row.evidence.keySha256);assert.equal(paper.series,row.evidence.series);
  assert.equal(question.exam,paper.exam);assert.equal(question.year,paper.year);assert.equal(question.paper,paper.paper);
  assert.equal(question.questionNumber,row.evidence.questionNumber);
  assert.equal(question.answer,row.acceptedAnswer,'Answer changes require a separate key-correction decision');
  assert.equal(row.evidence.keyAnswer,row.acceptedAnswer);
  let sourceText=question.sourceText,promptLines=[...question.promptLines];
  for(const {from,to}of row.changes) {
    assert.ok(from&&from!==to);assert.equal(sourceText.split(from).length,2,'Raw phrase must occur exactly once');
    sourceText=sourceText.replace(from,to);
    let matches=0;
    promptLines=promptLines.map(line=>{if(!line.includes(from))return line;assert.equal(line.split(from).length,2);matches++;return line.replace(from,to);});
    assert.equal(matches,1,'Displayed phrase must occur exactly once');
  }
  assert.equal(hash(sourceText),row.expectedCorrectedSourceTextHash);
  const compact=text=>text.replace(/\s+/g,' ').trim();
  assert.equal(compact(promptLines.join(' ')),compact(sourceText),'Current display and reviewed transcript diverge');
  const options={...question.options},changedLetters=new Set();
  for(const change of row.optionChanges??[]) {
    assert.ok(['A','B','C','D'].includes(change.letter)&&!changedLetters.has(change.letter),'Invalid or repeated repaired option');
    assert.equal(options[change.letter],change.from,'Option before-value changed');assert.ok(change.to&&change.from!==change.to);
    options[change.letter]=change.to;changedLetters.add(change.letter);
  }
  if(changedLetters.size)assert.equal(hash(JSON.stringify(options)),row.expectedCorrectedOptionsHash,'Repaired options do not match approved hash');
  assert.ok(Number.isInteger(row.evidence.sourcePage)&&row.evidence.sourcePage>0);
  assert.ok(Number.isInteger(row.evidence.keyPage)&&row.evidence.keyPage>0);
  if(process.argv.includes('--verify-local-sources')) {
    assert.equal(hash(fs.readFileSync(row.evidence.originalPdf)),row.evidence.originalPdfSha256);
    assert.equal(hash(fs.readFileSync(row.evidence.keyPdf)),row.evidence.keySha256);
  }
  overrides[row.questionId]={revision:row.revision,contentRevision:row.contentRevision,material:true,promptLines,sourceText,sourceTextHash:hash(sourceText),...(changedLetters.size?{options}:{} )};
  policy[row.questionId]={status:row.status,revision:row.revision,contentRevision:row.contentRevision};
}
for(const [file,value]of [['content/prelims-material-source-repairs.json',overrides],['content/prelims-material-source-repair-policy.json',policy]]) {
  const bytes=JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,`Stale material-repair artifact: ${file}`);
  else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==bytes)fs.writeFileSync(file,bytes);
}
console.log(JSON.stringify({reviewedMaterialSourceRepairs:Object.keys(overrides).length,rawBankChanged:false,oldSnapshotsExcluded:true}));
