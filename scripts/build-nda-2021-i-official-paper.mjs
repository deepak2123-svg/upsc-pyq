import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {questions as rows,directions} from './nda-2021-i-transcription.mjs';
import {classifications} from './nda-2021-i-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const output=(p,v)=>{const bytes=JSON.stringify(v,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(p,'utf8'),bytes,p);else fs.writeFileSync(p,bytes);};
const original={path:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2021-1.pdf',sha256:'0730204c0c25bd47171c7d45a44fbd25ab4bea70289f4d96f372e149098065b9'};
const key=read('content/audits/nda-2021-i-key-transcriptions.json');
const evidence={status:'official-final',issuer:key.issuer,releasedAt:null,filenameDate:'2021-12-23',retrievedAt:key.retrievedAt,url:key.url,asset:'/papers/nda-2021-i-gat/official-final-key.pdf',sha256:key.sha256,page:1,series:'A',session:'I',subject:'GAT',totalQuestions:150,dropped:1,scored:149,authentication:key.authentication};
const raw=['content/question-bank.json','content/reviewed-prelims-imports.json'].flatMap(p=>read(p).questions);
const existing=raw.filter(q=>q.exam==='NDA'&&q.year===2021&&q.paper==='I');
const registerPath='content/audits/nda-2021-i-paper-register.json';
if(process.argv.includes('--establish')){
 assert.ok(!fs.existsSync(registerPath),'Never overwrite the frozen before register');
 assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
 assert.equal(existing.length,27);
 output(registerPath,{paperId:'nda-2021-i-gat',identity:{exam:'NDA',year:2021,session:'I',paper:'GAT',paperCode:'FJY-U-GTA',series:'A',language:'English page extract',examDate:'2021-04-18',expected:150},original,pdfPageMapping:{pages:21,cover:1,english:'PDF 2–7 = printed 2–7',partB:'PDF 8–21 = printed (2 × PDF page − 7)',extractCaveat:'Hindi counterpart pages and the back-cover English instructions are absent; all 150 English numbered questions are present.'},key:evidence,rawBefore:existing.map(value=>({id:value.id,sha256:hash(value),value}))});
 console.log('Frozen 27 existing source records.');process.exit(0);
}
const register=read(registerPath);
assert.equal(register.rawBefore.length,27);
for(const b of register.rawBefore){assert.equal(hash(b.value),b.sha256);assert.equal(hash(raw.find(q=>q.id===b.id)),b.sha256);}
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
const cells=key.firstPassColumns.flatMap(c=>c.split(' '));
const second=Array(150);key.secondPassRows.forEach((r,i)=>r.split(' ').forEach((v,j)=>second[j*15+i]=v));
assert.deepEqual(cells,second);assert.equal(cells.length,150);assert.deepEqual(cells.flatMap((v,i)=>v==='X'?[i+1]:[]),[58]);
const signoff=read('content/audits/nda-2021-i-source-signoff.json');
assert.equal(signoff.originalPdfSha256,original.sha256);assert.equal(signoff.keyPdfSha256,evidence.sha256);
assert.deepEqual(signoff.reviewedQuestionNumbers,Array.from({length:150},(_,i)=>i+1));
assert.equal(signoff.reproductionSecondPass,'approved');assert.equal(signoff.classificationSecondPass,'approved');
for(const file of ['scripts/nda-2021-i-transcription.mjs','scripts/nda-2021-i-classification.mjs'])assert.equal(hash(fs.readFileSync(file)),signoff.reviewedInputHashes[file]);
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json'),nodes=new Map(registry.nodes.map(n=>[n.id,n]));
const paths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const a=[];for(let c=n;c;c=nodes.get(c.parentId))a.unshift(c.label);return[a.join('/'),n.id];}));
const basePolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const priorKeys=read('content/answer-key-revisions.json');
const baselines={},policy={},keyRevisions={};
const comparable=s=>s.toLowerCase().replace(/[’‘“”"']/g,'').replace(/[—–−-]/g,'').replace(/[·.,:;?()\s]/g,'');
assert.deepEqual(rows.map(r=>r.number),Array.from({length:150},(_,i)=>i+1));
const questions=rows.map(row=>{
 const n=row.number,c=classifications[n];assert.ok(c);
 const matches=existing.filter(q=>q.questionNumber===n);assert.ok(matches.length<=1);const old=matches[0],id=old?.id??`nda-2021-i-${n}`;
 if(old){
  assert.ok(register.rawBefore.some(b=>b.id===id));
  baselines[id]={sha256:hash(old),answer:old.answer,reviewRevision:basePolicy[id]?.revision??0,contentRevision:basePolicy[id]?.contentRevision??0};
  assert.equal(comparable(old.promptLines.join(' ')),comparable(row.promptLines.join(' ')),`Review material stem change Q${n}`);
  for(const a of ['A','B','C','D'])assert.equal(comparable(old.options[a]),comparable(row.options[a]),`Review material option change Q${n}/${a}`);
 }
 const dir=directions.find(d=>n>=d.from&&n<=d.to),context=dir?[dir.text]:[];
 const promptLines=[...context,...row.promptLines],sourceText=promptLines.join('\n');
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);
 if(c.scope==='gs'||c.scope==='science')assert.ok(paths.has(c.path),c.path);
 const additionalPaths=c.additional.map(p=>{assert.ok(paths.has(p),p);const [subject,head,chapter,subtopic]=p.split('/');return{subject,head,chapter,subtopic,taxonomyId:paths.get(p)};});
 if(subject==='Current Affairs'&&head==='Economy & Development'){const mirror=['Economy','Current Affairs',chapter,subpart].join('/');assert.ok(paths.has(mirror));additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart,taxonomyId:paths.get(mirror)});}
 const accepted=cells[n-1]==='X'?[]:[cells[n-1]],status=n===58?'withdrawn':'official-final';assert.ok(accepted.every(a=>row.options[a]));
 policy[id]={status,revision:(basePolicy[id]?.revision??0)+1,contentRevision:basePolicy[id]?.contentRevision??0,preparationScope:c.scope};
 if(old&&old.answer!==(accepted[0]??''))keyRevisions[id]=(priorKeys[id]??0)+1;
 return{...old,id,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2021,paper:'I',questionNumber:n,subject,topic:chapter,subtopic:subpart,taxonomyHead:head,taxonomyChapter:chapter,taxonomySubtopic:subpart,taxonomyId:paths.get(c.path)??null,taxonomyVersion:registry.version,difficulty:old?.difficulty??'Moderate',promptLines,options:row.options,answer:accepted[0]??'',explanation:n===58?'Withdrawn in the official UPSC final key, Series A Q58 (X). Excluded from score.':`Official UPSC final key, Series A Q${n}: ${accepted[0]} (${row.options[accepted[0]]}).`,requiresFigure:false,figureKey:null,figureAlt:null,additionalPaths,preparationScope:c.scope,underlined:row.underlined??[],...(dir?{sharedContext:{id:`nda-2021-i-context-${dir.from}-${dir.to}`,label:'Instructions',promptLines:context}}:{}),classificationTags:[[135,141,142,143,144,145,146,147,148,149,150].includes(n)?'Event-based':'Static'],source:{...old?.source,dataset:'Complete NDA I 2021 GAT, official final key',exam:'NDA',year:2021,paper:'I',questionNumber:n,originalPdf:original.path,originalPdfSha256:original.sha256,originalPage:row.page,originalPages:[row.page],printedPage:row.page<=7?row.page:2*row.page-7,bookletSeries:'A',answerStatus:status,answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,officialAcceptedOptions:accepted,displayedAcceptedOptions:accepted,optionsReordered:false,classificationRationale:c.rationale,secondPass:signoff.reviewerMethod,reviewedAt:'2026-10-28',...(n>=31&&n<=40?{layoutNote:'Original lowercase segment labels map individually to displayed A/B/C; D retains the original No error choice.'}:{})}};
});
assert.equal(new Set(questions.map(q=>q.id)).size,150);assert.equal(Object.keys(baselines).length,27);
const placements=questions.filter(q=>q.preparationScope!=='gs'&&q.questionNumber!==58).flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod})));
const reconciliation={expected:150,newSourceOccurrences:123,reusedSourceOccurrences:27,duplicateAliases:0,awaitingReviewCount:0,dispositionCounts:{'official-final':149,'official-provisional':0,'reasoned-verified':0,withdrawn:1,duplicate:0,quarantined:0},eligibleUniqueQuestionCount:149,sectionTotals:{english:50,science:49,gs:50},correctedExistingKeys:questions.filter(q=>baselines[q.id]&&baselines[q.id].answer!==q.answer).map(q=>({id:q.id,number:q.questionNumber,before:baselines[q.id].answer,after:q.answer})),materialHistoricalRepairs:[]};
for(const [file,value] of [
 ['content/nda-2021-i-official-paper.json',{version:1,paperId:register.paperId,evidence,baselines,questions}],
 ['content/nda-2021-i-official-review-policy.json',policy],
 ['content/nda-2021-i-key-revisions.json',keyRevisions],
 ['content/nda-2021-i-preparation-placements.json',placements],
 ['content/audits/nda-2021-i-review.json',{paperId:register.paperId,register:registerPath,evidence,signoff,reconciliation,questionSlots:questions.map(q=>({number:q.questionNumber,canonicalQuestionId:q.id,accountingAction:baselines[q.id]?'reused':'new',disposition:q.source.answerStatus,reproduction:{approved:true,sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),sourcePages:q.source.originalPages,printedPage:q.source.printedPage},classification:{primary:classifications[q.questionNumber].path,additional:q.additionalPaths,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod},answerEvidence:{...evidence,officialAcceptedOptions:q.source.officialAcceptedOptions,optionTexts:q.source.officialAcceptedOptions.map(a=>q.options[a])},revision:policy[q.id]}))}]
])output(file,value);
console.log(JSON.stringify(reconciliation));
