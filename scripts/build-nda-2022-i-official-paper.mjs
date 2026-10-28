import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {english,directions} from './nda-2022-i-english-transcription.mjs';
import {partB} from './nda-2022-i-part-b-transcription.mjs';
import {classifications} from './nda-2022-i-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const output=(p,v)=>{const bytes=JSON.stringify(v,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(p,'utf8'),bytes,p);else fs.writeFileSync(p,bytes);};
const original={path:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2022-1.pdf',sha256:'bbad095a0e5a323aef8f839bd9ac2fbfa9a255c5ba8cd0479a5d17d93d569002'};
const keyDocument=read('content/audits/nda-2022-i-key-transcriptions.json');
const evidence={status:'official-final',issuer:keyDocument.issuer,releasedAt:null,filenameDate:'2022-11-25',retrievedAt:'2026-10-28',url:keyDocument.url,asset:'/papers/nda-2022-i-gat/official-final-key.pdf',sha256:keyDocument.sha256,page:1,series:'A',session:'I',subject:'GAT',totalQuestions:150,dropped:0,scored:150,authentication:keyDocument.authentication};
const raw=['content/question-bank.json','content/reviewed-prelims-imports.json'].flatMap(p=>read(p).questions);
const existing=raw.filter(q=>q.exam==='NDA'&&q.year===2022&&q.paper==='I');
const registerPath='content/audits/nda-2022-i-paper-register.json';
if(process.argv.includes('--establish')){
 assert.ok(!fs.existsSync(registerPath),'Never overwrite the frozen before register');
 assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
 assert.equal(existing.length,21);
 output(registerPath,{paperId:'nda-2022-i-gat',identity:{exam:'NDA',year:2022,session:'I',paper:'GAT',paperCode:'SDFR-F-TAG',series:'A',language:'English page extract',examDate:null,expected:150},original,pdfPageMapping:{pages:26,cover:1,english:'PDF 2–9 = printed 2–9',partB:'PDF 10–26 = printed (2 × PDF page − 9)',extractCaveat:'Hindi counterpart pages and back instructions are absent; all 150 English numbered questions are present.'},key:evidence,rawBefore:existing.map(value=>({id:value.id,sha256:hash(value),value}))});
 console.log('Frozen 21 existing source records.');process.exit(0);
}
const register=read(registerPath);
assert.equal(register.rawBefore.length,21);
for(const b of register.rawBefore){assert.equal(hash(b.value),b.sha256);assert.equal(hash(raw.find(q=>q.id===b.id)),b.sha256);}
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
const key=read('content/audits/nda-2022-i-key-transcriptions.json');
const cells=key.firstPassColumns.flatMap(c=>c.split(' '));
const second=Array(150);key.secondPassRows.forEach((r,i)=>r.split(' ').forEach((v,j)=>second[j*15+i]=v));
assert.deepEqual(cells,second);assert.equal(cells.length,150);assert.ok(cells.every(c=>/^[ABCD](\/[ABCD])?$/.test(c)));
assert.deepEqual(cells.flatMap((v,i)=>v.includes('/')?[i+1]:[]),[]);
const signoff=read('content/audits/nda-2022-i-source-signoff.json');
assert.equal(signoff.originalPdfSha256,original.sha256);assert.equal(signoff.keyPdfSha256,evidence.sha256);
assert.deepEqual(signoff.reviewedQuestionNumbers,Array.from({length:150},(_,i)=>i+1));
assert.equal(signoff.reproductionSecondPass,'approved');assert.equal(signoff.classificationSecondPass,'approved');
for(const file of ['scripts/nda-2022-i-english-transcription.mjs','scripts/nda-2022-i-part-b-transcription.mjs','scripts/nda-2022-i-classification.mjs'])assert.equal(hash(fs.readFileSync(file)),signoff.reviewedInputHashes[file]);
// Every original page was visually inspected: no figure-dependent question.
const crops=[];
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json'),nodes=new Map(registry.nodes.map(n=>[n.id,n]));
const paths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const a=[];for(let c=n;c;c=nodes.get(c.parentId))a.unshift(c.label);return[a.join('/'),n.id];}));
const basePolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const priorKeys=read('content/answer-key-revisions.json');
const baselines={},policy={},keyRevisions={};
// Only source punctuation/typography and line separation are normalised here.
// A changed word, number or option would require an explicit material repair.
const comparable=s=>s.toLowerCase().replace(/[’‘“”"']/g,'').replace(/[—–]/g,'-').replace(/·/g,'.').replace(/\s/g,'');
const rows=[...english,...partB];assert.deepEqual(rows.map(r=>r.number),Array.from({length:150},(_,i)=>i+1));
const questions=rows.map(row=>{
 const n=row.number,c=classifications[n];assert.ok(c);
 const matches=existing.filter(q=>q.questionNumber===n);assert.ok(matches.length<=1);const old=matches[0],id=old?.id??`nda-2022-i-${n}`;
 if(old){assert.ok(register.rawBefore.some(b=>b.id===id));baselines[id]={sha256:hash(old),answer:old.answer,reviewRevision:basePolicy[id]?.revision??0,contentRevision:basePolicy[id]?.contentRevision??0};
  const stem=comparable;
  assert.equal(stem(old.promptLines.join(' ')),stem(row.promptLines.join(' ')),`Review material stem change Q${n}`);
  for(const a of ['A','B','C','D'])assert.equal(comparable(old.options[a]),comparable(row.options[a]),`Review material option change Q${n}/${a}`);
 }
 const dir=directions.find(d=>n>=d.from&&n<=d.to);
 const context=dir?[dir.text]:[];
 const promptLines=[...context,...row.promptLines],sourceText=promptLines.join('\n');
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);
 if(c.scope==='gs'||c.scope==='science')assert.ok(paths.has(c.path),c.path);
 const additionalPaths=c.additional.map(p=>{assert.ok(paths.has(p),p);const [subject,head,chapter,subtopic]=p.split('/');return{subject,head,chapter,subtopic,taxonomyId:paths.get(p)};});
 if(subject==='Current Affairs'&&head==='Economy & Development'){const mirror=['Economy','Current Affairs',chapter,subpart].join('/');assert.ok(paths.has(mirror));additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart,taxonomyId:paths.get(mirror)});}
 const accepted=cells[n-1].split('/'),status='official-final';assert.ok(accepted.every(a=>row.options[a]));
 policy[id]={status,revision:(basePolicy[id]?.revision??0)+1,contentRevision:basePolicy[id]?.contentRevision??0,preparationScope:c.scope};
 if(old&&old.answer!==accepted[0])keyRevisions[id]=(priorKeys[id]??0)+1;
 const figure=crops.find(f=>f.number===n);assert.equal(Boolean(row.figure),Boolean(figure));
 return{...old,id,...(accepted.length>1?{acceptedAnswers:accepted}:{}),origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2022,paper:'I',questionNumber:n,subject,topic:chapter,subtopic:subpart,taxonomyHead:head,taxonomyChapter:chapter,taxonomySubtopic:subpart,taxonomyId:paths.get(c.path)??null,taxonomyVersion:registry.version,difficulty:old?.difficulty??'Moderate',promptLines,options:row.options,answer:accepted[0]??'',explanation:`Official UPSC final key, Series A Q${n}: ${accepted.join(' / ')} (${accepted.map(a=>row.options[a]).join(' / ')}).`,requiresFigure:Boolean(figure),figureKey:figure?.asset??null,figureAlt:figure?.description??null,additionalPaths,preparationScope:c.scope,underlined:row.underlined??[],...(dir?{sharedContext:{id:`nda-2022-i-context-${dir.from}-${dir.to}`,label:'Instructions',promptLines:context}}:{}),classificationTags:[[129,130,131,141,142,143,144,145,146,148,149,150].includes(n)?'Event-based':'Static'],source:{...old?.source,dataset:'Complete NDA I 2022 GAT, official final key',exam:'NDA',year:2022,paper:'I',questionNumber:n,originalPdf:original.path,originalPdfSha256:original.sha256,originalPage:row.page,originalPages:[row.page],printedPage:row.page<=9?row.page:2*row.page-9,bookletSeries:'A',answerStatus:status,answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,officialAcceptedOptions:accepted,displayedAcceptedOptions:accepted,optionsReordered:false,classificationRationale:c.rationale,secondPass:signoff.reviewerMethod,reviewedAt:'2026-10-28',...(figure?{figureSha256:figure.sha256}:{}),...(n>=1&&n<=10?{layoutNote:'Original lowercase segment labels map individually to displayed A/B/C; D retains the original No error choice.'}:{})}};
});
assert.equal(new Set(questions.map(q=>q.id)).size,150);assert.equal(Object.keys(baselines).length,21);
const placements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod})));
const reconciliation={expected:150,newSourceOccurrences:129,reusedSourceOccurrences:21,duplicateAliases:0,awaitingReviewCount:0,dispositionCounts:{'official-final':150,'official-provisional':0,'reasoned-verified':0,withdrawn:0,duplicate:0,quarantined:0},eligibleUniqueQuestionCount:150,sectionTotals:{english:50,science:50,gs:50},correctedExistingKeys:questions.filter(q=>baselines[q.id]&&baselines[q.id].answer!==q.answer).map(q=>({id:q.id,number:q.questionNumber,before:baselines[q.id].answer,after:q.answer})),materialHistoricalRepairs:[]};
for(const [file,value] of [['content/nda-2022-i-official-paper.json',{version:1,paperId:register.paperId,evidence,baselines,questions}],['content/nda-2022-i-official-review-policy.json',policy],['content/nda-2022-i-key-revisions.json',keyRevisions],['content/nda-2022-i-preparation-placements.json',placements],['content/audits/nda-2022-i-review.json',{paperId:register.paperId,register:registerPath,evidence,signoff,reconciliation,questionSlots:questions.map(q=>({number:q.questionNumber,canonicalQuestionId:q.id,accountingAction:baselines[q.id]?'reused':'new',disposition:q.source.answerStatus,reproduction:{approved:true,sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),sourcePages:q.source.originalPages,printedPage:q.source.printedPage},classification:{primary:classifications[q.questionNumber].path,additional:q.additionalPaths,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod},answerEvidence:{...evidence,officialAcceptedOptions:q.source.officialAcceptedOptions,optionTexts:q.source.officialAcceptedOptions.map(a=>q.options[a])},revision:policy[q.id]}))}]])output(file,value);
console.log(JSON.stringify(reconciliation));
