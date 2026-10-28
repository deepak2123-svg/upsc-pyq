import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {english,directions} from './nda-2021-ii-english-transcription.mjs';
import {partB} from './nda-2021-ii-part-b-transcription.mjs';
import {classifications} from './nda-2021-ii-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const output=(p,v)=>{const bytes=JSON.stringify(v,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(p,'utf8'),bytes,p);else fs.writeFileSync(p,bytes);};
const original={path:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2021-2.pdf',sha256:'392786e935d3f058441c894feed1ad3549021a899808c661ec55692d4d4807a8'};
const keyDocument=read('content/audits/nda-2021-ii-key-transcriptions.json');
const evidence={status:'official-final',issuer:keyDocument.issuer,releasedAt:null,filenameDate:'2022-09-14',retrievedAt:'2026-10-28',url:keyDocument.url,asset:'/papers/nda-2021-ii-gat/official-final-key.pdf',sha256:keyDocument.sha256,page:1,series:'A',session:'II',subject:'GAT',totalQuestions:150,dropped:0,scored:150,authentication:keyDocument.authentication};
const raw=['content/question-bank.json','content/reviewed-prelims-imports.json'].flatMap(p=>read(p).questions);
const existing=raw.filter(q=>q.exam==='NDA'&&q.year===2021&&q.paper==='II');
const registerPath='content/audits/nda-2021-ii-paper-register.json';
if(process.argv.includes('--establish')){
 assert.ok(!fs.existsSync(registerPath),'Never overwrite the frozen before register');
 assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
 assert.equal(existing.length,24);
 output(registerPath,{paperId:'nda-2021-ii-gat',identity:{exam:'NDA',year:2021,session:'II',paper:'GAT',paperCode:'DFGT-U-GTA',series:'A',language:'English page extract',examDate:null,expected:150},original,pdfPageMapping:{pages:22,cover:1,english:'PDF 2–9 = printed 2–9',partB:'PDF 10–22 = printed (2 × PDF page − 9)',extractCaveat:'Hindi counterpart pages and back instructions are absent; all 150 English numbered questions are present.'},key:evidence,rawBefore:existing.map(value=>({id:value.id,sha256:hash(value),value}))});
 console.log('Frozen 24 existing source records.');process.exit(0);
}
const register=read(registerPath);
assert.equal(register.rawBefore.length,24);
for(const b of register.rawBefore){assert.equal(hash(b.value),b.sha256);assert.equal(hash(raw.find(q=>q.id===b.id)),b.sha256);}
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(original.path)),original.sha256);
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
const key=read('content/audits/nda-2021-ii-key-transcriptions.json');
const cells=key.firstPassColumns.flatMap(c=>c.split(' '));
const second=Array(150);key.secondPassRows.forEach((r,i)=>r.split(' ').forEach((v,j)=>second[j*15+i]=v));
assert.deepEqual(cells,second);assert.equal(cells.length,150);assert.ok(cells.every(c=>/^[ABCD](\/[ABCD])?$/.test(c)));
assert.deepEqual(cells.flatMap((v,i)=>v.includes('/')?[i+1]:[]),[102]);
const signoff=read('content/audits/nda-2021-ii-source-signoff.json');
assert.equal(signoff.originalPdfSha256,original.sha256);assert.equal(signoff.keyPdfSha256,evidence.sha256);
assert.deepEqual(signoff.reviewedQuestionNumbers,Array.from({length:150},(_,i)=>i+1));
assert.equal(signoff.reproductionSecondPass,'approved');assert.equal(signoff.classificationSecondPass,'approved');
for(const file of ['scripts/nda-2021-ii-english-transcription.mjs','scripts/nda-2021-ii-part-b-transcription.mjs','scripts/nda-2021-ii-classification.mjs'])assert.equal(hash(fs.readFileSync(file)),signoff.reviewedInputHashes[file]);
const crops=[{number:146,asset:'/papers/nda-2021-ii-gat/q146-prism-options.png',sha256:'1b81c0869591278ec98efe792a48975ca9730b339e771ee68ac109d9a264c16d',description:'Original Series A Q146 option diagrams (a), (b), (c), (d): four ray paths through glass prisms.',sourcePdfPage:22,printedPage:35,pdfClip:[53,422,180,650],renderScale:3}];
for(const crop of crops)assert.equal(hash(fs.readFileSync('public'+crop.asset)),crop.sha256);
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json'),nodes=new Map(registry.nodes.map(n=>[n.id,n]));
const paths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const a=[];for(let c=n;c;c=nodes.get(c.parentId))a.unshift(c.label);return[a.join('/'),n.id];}));
const basePolicy={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const priorKeys=read('content/answer-key-revisions.json');
const baselines={},policy={},keyRevisions={};
// Only source punctuation/typography and line separation are normalised here.
// A changed word, number or option would require an explicit material repair.
const comparable=s=>s.toLowerCase().replace(/[’‘“”"']/g,'').replace(/[—–]/g,'-').replace(/·/g,'.').replace(/[.,:;\s]/g,'');
const rows=[...english,...partB];assert.deepEqual(rows.map(r=>r.number),Array.from({length:150},(_,i)=>i+1));
const questions=rows.map(row=>{
 const n=row.number,c=classifications[n];assert.ok(c);
 const matches=existing.filter(q=>q.questionNumber===n);assert.ok(matches.length<=1);const old=matches[0],id=old?.id??`nda-2021-ii-${n}`;
 if(old){assert.ok(register.rawBefore.some(b=>b.id===id));baselines[id]={sha256:hash(old),answer:old.answer,reviewRevision:basePolicy[id]?.revision??0,contentRevision:basePolicy[id]?.contentRevision??0};
  const stem=comparable;
  assert.equal(stem(old.promptLines.join(' ')),stem(row.promptLines.join(' ')),`Review material stem change Q${n}`);
  if(n===84){
   assert.deepEqual(old.options,{A:'2 4 1 3',B:'1 4 2 3',C:'3 4 2 1',D:'3 2 4 1'});
   assert.deepEqual(row.options,{A:'A-3, B-4, C-2, D-1',B:'A-3, B-2, C-4, D-1',C:'A-1, B-2, C-4, D-3',D:'A-1, B-4, C-2, D-3'});
  }else for(const a of ['A','B','C','D'])assert.equal(comparable(old.options[a]),comparable(n===52?row.options[a].replace(/[ABCD]-/g,''):row.options[a]),`Review material option change Q${n}/${a}`);
 }
 const dir=directions.find(d=>n>=d.from&&n<=d.to);
 const context=dir?[dir.text]:[];
 const promptLines=[...context,...row.promptLines],sourceText=promptLines.join('\n');
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);
 if(c.scope==='gs'||c.scope==='science')assert.ok(paths.has(c.path),c.path);
 const additionalPaths=c.additional.map(p=>{assert.ok(paths.has(p),p);const [subject,head,chapter,subtopic]=p.split('/');return{subject,head,chapter,subtopic,taxonomyId:paths.get(p)};});
 if(subject==='Current Affairs'&&head==='Economy & Development'){const mirror=['Economy','Current Affairs',chapter,subpart].join('/');assert.ok(paths.has(mirror));additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart,taxonomyId:paths.get(mirror)});}
 const accepted=cells[n-1].split('/'),status='official-final';assert.ok(accepted.every(a=>row.options[a]));
 policy[id]={status,revision:(basePolicy[id]?.revision??0)+1,contentRevision:(basePolicy[id]?.contentRevision??0)+(n===84?1:0),preparationScope:c.scope};
 if(old&&old.answer!==accepted[0])keyRevisions[id]=(priorKeys[id]??0)+1;
 const figure=crops.find(f=>f.number===n);assert.equal(Boolean(row.figure),Boolean(figure));
 return{...old,id,...(accepted.length>1?{acceptedAnswers:accepted}:{}),origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2021,paper:'II',questionNumber:n,subject,topic:chapter,subtopic:subpart,taxonomyHead:head,taxonomyChapter:chapter,taxonomySubtopic:subpart,taxonomyId:paths.get(c.path)??null,taxonomyVersion:registry.version,difficulty:old?.difficulty??'Moderate',promptLines,options:row.options,answer:accepted[0]??'',explanation:`Official UPSC final key, Series A Q${n}: ${accepted.join(' / ')} (${accepted.map(a=>row.options[a]).join(' / ')}).`+(n===54&&old?.explanation?' '+old.explanation:''),requiresFigure:Boolean(figure),figureKey:figure?.asset??null,figureAlt:figure?.description??null,additionalPaths,preparationScope:c.scope,underlined:row.underlined??[],...(dir?{sharedContext:{id:`nda-2021-ii-context-${dir.from}-${dir.to}`,label:'Instructions',promptLines:context}}:{}),classificationTags:[[91,92,94,95,96,98,99,100].includes(n)?'Event-based':'Static'],source:{...old?.source,dataset:'Complete NDA II 2021 GAT, official final key',exam:'NDA',year:2021,paper:'II',questionNumber:n,originalPdf:original.path,originalPdfSha256:original.sha256,originalPage:row.page,originalPages:[row.page],printedPage:row.page<=9?row.page:2*row.page-9,bookletSeries:'A',answerStatus:status,answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,officialAcceptedOptions:accepted,displayedAcceptedOptions:accepted,optionsReordered:false,classificationRationale:c.rationale,secondPass:signoff.reviewerMethod,reviewedAt:'2026-10-28',...(figure?{figureSha256:figure.sha256}:{}),...(n>=1&&n<=10?{layoutNote:'Original lowercase segment labels map individually to displayed A/B/C; D retains the original No error choice.'}:{})}};
});
assert.equal(new Set(questions.map(q=>q.id)).size,150);assert.equal(Object.keys(baselines).length,24);
const placements=questions.filter(q=>q.preparationScope!=='gs').flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod})));
const reconciliation={expected:150,newSourceOccurrences:126,reusedSourceOccurrences:24,duplicateAliases:0,awaitingReviewCount:0,dispositionCounts:{'official-final':150,'official-provisional':0,'reasoned-verified':0,withdrawn:0,duplicate:0,quarantined:0},eligibleUniqueQuestionCount:150,sectionTotals:{english:50,science:50,gs:50},correctedExistingKeys:questions.filter(q=>baselines[q.id]&&baselines[q.id].answer!==q.answer).map(q=>({id:q.id,number:q.questionNumber,before:baselines[q.id].answer,after:q.answer})),materialHistoricalRepairs:signoff.materialHistoricalRepairs};
for(const [file,value] of [['content/nda-2021-ii-official-paper.json',{version:1,paperId:register.paperId,evidence,baselines,questions}],['content/nda-2021-ii-official-review-policy.json',policy],['content/nda-2021-ii-key-revisions.json',keyRevisions],['content/nda-2021-ii-preparation-placements.json',placements],['content/audits/nda-2021-ii-review.json',{paperId:register.paperId,register:registerPath,evidence,signoff,reconciliation,questionSlots:questions.map(q=>({number:q.questionNumber,canonicalQuestionId:q.id,accountingAction:baselines[q.id]?'reused':'new',disposition:q.source.answerStatus,reproduction:{approved:true,sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),sourcePages:q.source.originalPages,printedPage:q.source.printedPage},classification:{primary:classifications[q.questionNumber].path,additional:q.additionalPaths,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod},answerEvidence:{...evidence,officialAcceptedOptions:q.source.officialAcceptedOptions,optionTexts:q.source.officialAcceptedOptions.map(a=>q.options[a])},revision:policy[q.id]}))}]])output(file,value);
console.log(JSON.stringify(reconciliation));
