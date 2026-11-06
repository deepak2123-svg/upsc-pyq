import fs from 'node:fs';

const workspace='tmp/pdfs/nda-2014-i';
const secondary=JSON.parse(fs.readFileSync(`${workspace}/secondary.json`,'utf8')).questions;
const crops=JSON.parse(fs.readFileSync(`${workspace}/question-crops.json`,'utf8'));
const banks=['content/question-bank.json','content/reviewed-prelims-imports.json']
  .flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).questions)
  .filter(question=>question.exam==='NDA'&&question.year===2014&&question.paper==='I');
const normalize=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens=value=>new Set(normalize(value).split(' ').filter(word=>word.length>2));
const score=(left,right)=>{
  const a=tokens(left),b=tokens(right);
  const overlap=[...a].filter(word=>b.has(word)).length;
  return overlap/Math.max(1,a.size);
};
const mapping=secondary.map(question=>({...question,sourceNumber:null,mappingScore:0,mappingPage:null,ocrMatch:''}));
const assignedNumbers=new Set(),assignedQuestions=new Set();
const assign=(row,number,confidence=1,page=null,ocrMatch='')=>{
  if(!row||assignedQuestions.has(row.qid)||assignedNumbers.has(number))return false;
  Object.assign(row,{sourceNumber:number,mappingScore:confidence,mappingPage:page,ocrMatch});
  assignedQuestions.add(row.qid);assignedNumbers.add(number);return true;
};

for(const row of mapping.filter(question=>question.subjectName==='English')){
  const display=row.displayNumber;
  const number=display<=12?display+11:display<=20?display+11:display<=31?display-20:display;
  assign(row,number);
}
for(const row of mapping.filter(question=>question.subjectName!=='English')){
  const canonical=row.qid.match(/^nd-g141-(\d{3})$/)?.[1];
  if(canonical)assign(row,Number(canonical));
}
for(const [qid,number] of Object.entries({
  '1ktww2md2':58,
  '1kt4hcb0c':95,
  '1kszsv5dt':100,
  '1kszw8egw':114,
}))assign(mapping.find(row=>row.qid===qid),number);
for(const existing of banks){
  const text=(existing.promptLines??[existing.sourceText??'']).join(' ');
  const candidates=mapping.filter(row=>!assignedQuestions.has(row.qid)).map(row=>({row,score:score(text,row.promptLines.join(' '))})).sort((a,b)=>b.score-a.score);
  if(candidates[0]?.score>=0.45)assign(candidates[0].row,existing.questionNumber,candidates[0].score);
}

const pairs=mapping.filter(question=>question.subjectName!=='English'&&!assignedQuestions.has(question.qid)).flatMap(question=>crops
  .filter(candidate=>candidate.number>=51&&!assignedNumbers.has(candidate.number))
  .map(candidate=>({question,candidate,score:score(question.promptLines.join(' '),candidate.text)})))
  .sort((a,b)=>b.score-a.score);
for(const pair of pairs){
  if(pair.score<0.12||assignedQuestions.has(pair.question.qid)||assignedNumbers.has(pair.candidate.number))continue;
  assign(pair.question,pair.candidate.number,pair.score,pair.candidate.page,pair.candidate.text);
}

mapping.sort((a,b)=>(a.sourceNumber??999)-(b.sourceNumber??999));
fs.writeFileSync(`${workspace}/source-mapping.json`,`${JSON.stringify(mapping,null,2)}\n`);
const missing=mapping.filter(row=>!row.sourceNumber).map(row=>({qid:row.qid,subject:row.subjectName,display:row.displayNumber,prompt:row.promptLines[0]}));
const missingNumbers=Array.from({length:150},(_,index)=>index+1).filter(number=>!assignedNumbers.has(number));
const duplicateNumbers=[...new Set(mapping.filter(row=>row.sourceNumber&&mapping.filter(other=>other.sourceNumber===row.sourceNumber).length>1).map(row=>row.sourceNumber))];
console.log(JSON.stringify({mapped:mapping.length-missing.length,missing,missingNumbers,duplicateNumbers},null,2));
