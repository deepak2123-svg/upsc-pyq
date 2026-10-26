import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {sourcePatches,directions,passage,englishPages,partBPages,sourceLineBreaks,underlined} from './nda-2025-ii-source-review.mjs';
import {classifications} from './nda-2025-ii-classification.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const draft=read('content/audits/nda-2025-ii-source-baseline.json');
const registry=read('content/taxonomy/upsc-prelims-v2-draft.json');
const nodes=new Map(registry.nodes.map(n=>[n.id,n]));
const registryPaths=new Map(registry.nodes.filter(n=>n.kind==='subpart').map(n=>{const labels=[];let current=n;while(current){labels.unshift(current.label);current=nodes.get(current.parentId);}return[labels.join('/'),n.id];}));
const transcriptions=read('content/audits/nda-2025-ii-key-transcriptions.json');
const cells=transcriptions.firstPassColumns.flatMap(c=>c.split(' '));
const reread=Array(150);transcriptions.secondPassRows.forEach((r,i)=>r.split(' ').forEach((v,j)=>reread[j*20+i]=v));
assert.deepEqual(cells,reread);assert.equal(cells.length,150);
const evidence={status:'official-final',issuer:'Union Public Service Commission',releasedAt:null,filenameDate:'2026-04-15',retrievedAt:'2026-10-26',url:'https://www.upsc.gov.in/sites/default/files/AnsKey-NDANA-II-2025-GAT-150426.pdf',asset:'/papers/nda-2025-ii-gat/official-final-key.pdf',sha256:'c997b581dccc26287dfb7746a287ccdbfbdc270c356e835eda7b5641fcfe811f',page:1,series:'A',session:'II',subject:'GAT',totalQuestions:150,dropped:1,scored:149,authentication:'Downloaded directly from www.upsc.gov.in; four-page A/B/C/D document. Series A page visually compared cell-by-cell with both earlier transcriptions. Exact filename case matters: AnsKey, not Anskey. No release date inferred from PDF metadata alone.'};
assert.equal(hash(fs.readFileSync('public'+evidence.asset)),evidence.sha256);
if(process.argv.includes('--source-check'))assert.equal(hash(fs.readFileSync(draft.original.path)),draft.original.sha256);
const raw=[...read('content/question-bank.json').questions,...read('content/reviewed-prelims-imports.json').questions];
const baselines={};
const policyBase={...read('content/question-review-policy.json'),...read('content/prelims-import-review-policy.json'),...read('content/prelims-material-source-repair-policy.json')};
const fixes={...read('content/prelims-reproduction-overrides.json'),...read('content/prelims-material-source-repairs.json')};
const clean=value=>{
 let s=value;for(const [from,to] of Object.entries(sourceLineBreaks))s=s.replaceAll(from,to);
 // Explicit typographic conversion of the reviewed equations, not a new formula.
 const subs={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
 return s.replaceAll('\\rightarrow','→').replaceAll('\\times','×').replace(/\^\\circ/g,'°').replace(/\^([3456])/g,(_,n)=>({'3':'³','4':'⁴','5':'⁵','6':'⁶'}[n])).replace(/\^2/g,'²').replace(/_\{(\d+)\}|_(\d+)/g,(_,a,b)=>(a??b).split('').map(c=>subs[c]).join('')).replace(/\$([^$]+)\$/g,'$1').replace(/\u00a0/g,' ').trim();
};
const caveats={66:'The official key accepts A, the printed “increases” option. The apparent temperature-dependence issue is retained for editorial discussion; neither the source option nor the official scoring is silently changed.',72:'The official key accepts A. The other printed charging propositions are retained; the official examination decision is not replaced by an editorial solution.',75:'The source gives no explicit potential-energy reference level or air-resistance condition. Official A is retained without inserting either condition into the PYQ.',108:'Option A prints CO₂ + 2O₂ as its products. This original equation is preserved, not silently repaired to a combustion equation.',113:'The official key accepts D (all three pairs), including the printed geyserite/organically-formed pair. This source/key issue is not silently rewritten.',125:'The official key accepts D (Tapti). The source’s northernmost-basin wording and all options are preserved for examination-faithful scoring.',126:'The official key accepts D (Potash). The original laterite proposition is retained rather than replaced by a teaching question.'};
const questions=draft.questions.map(row=>{
 const n=row.number,c=classifications[n];assert.ok(c,`Missing classification ${n}`);
 const candidates=raw.filter(q=>q.exam==='NDA'&&q.year===2025&&q.paper==='II'&&q.questionNumber===n);assert.ok(candidates.length<=1);
 const old=candidates[0];if(old){assert.equal(hash(old),row.candidateExisting[0].beforeHash);baselines[old.id]={sha256:hash(old),answer:old.answer,contentRevision:policyBase[old.id]?.contentRevision??0,reviewRevision:policyBase[old.id]?.revision??0};}
 const patch=sourcePatches[n]??{};
 let promptLines=(patch.promptLines??row.promptLines).flatMap(s=>s.split('\n')).map(clean);
 const options=Object.fromEntries(Object.entries({...row.options,...patch.options}).map(([k,v])=>[k,clean(v)]));
 const dir=directions.find(d=>n>=d.from&&n<=d.to);if(dir)promptLines.unshift(dir.text);
 if(n<=5)promptLines.splice(1,0,passage);
 const pages=[...englishPages,...partBPages].find(([from,to])=>n>=from&&n<=to);assert.ok(pages);
 const sourcePages=n>=4&&n<=5?[2,3]:n===22?[6]:n===24||n===25?[6,7]:[pages[2]];
 const [subject,head,chapter,subpart]=c.path.split('/');assert.ok(subpart);
 const accepted=cells[n-1]==='X'?[]:cells[n-1].split('/');for(const a of accepted)assert.ok(options[a]);
 const id=old?.id??row.tentativeId,sourceText=promptLines.join('\n');
 const additionalPaths=c.additional.map(path=>{const [subject,head,chapter,subtopic]=path.split('/');return {subject,head,chapter,subtopic};});
 if(subject==='Current Affairs'&&head==='Economy & Development')additionalPaths.push({subject:'Economy',head:'Current Affairs',chapter,subtopic:subpart});
 return {...old,id,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2025,paper:'II',questionNumber:n,subject,taxonomyHead:head,topic:chapter,subtopic:subpart,taxonomyChapter:chapter,taxonomySubtopic:subpart,
  taxonomyId:registryPaths.get(c.path),difficulty:old?.difficulty??'Moderate',promptLines,...(dir?{sharedContext:{id:`nda-2025-ii-context-${dir.from}-${dir.to}`,label:n<=5?'Passage and instructions':'Instructions',promptLines:n<=5?[dir.text,passage]:[dir.text]}}:{}),options,answer:accepted[0]??'',...(accepted.length>1?{acceptedAnswers:accepted}:{}),requiresFigure:false,additionalPaths,preparationScope:c.scope,
  ...(underlined[n]?{underlined:underlined[n]}:n>=41&&n<=45?{underlined:promptLines.slice(1).map(s=>s.replace(/^[PQRS]\. /,''))}:{}),classificationTags:[n>=142&&n<=145||n===147||n===148?'Event-based':'Static'],
  explanation:n===85?'Withdrawn in the official UPSC final key (Series A Q85, X). Excluded from score.':`Official UPSC final key, Series A Q${n}: ${accepted.join(' / ')} (${accepted.map(a=>options[a]).join(' / ')}).${caveats[n]?' Editorial caveat: '+caveats[n]:''}`,
  source:{...old?.source,dataset:'Complete NDA II 2025 GAT, official final key',exam:'NDA',year:2025,paper:'II',questionNumber:n,originalPdf:draft.original.path,originalPdfSha256:draft.original.sha256,originalPage:pages[2],originalPages:sourcePages,bookletSeries:'A',answerStatus:n===85?'withdrawn':'official-final',answerSource:evidence.url,keySha256:evidence.sha256,keyPage:1,officialAcceptedOptions:accepted,displayedAcceptedOptions:accepted,optionsReordered:false,classificationRationale:c.rationale,...(caveats[n]?{editorialCaveat:caveats[n]}:{}),reviewedAt:'2026-10-26'}
 };
});
assert.equal(questions.length,150);assert.equal(new Set(questions.map(q=>q.id)).size,150);assert.equal(Object.keys(baselines).length,27);
// Publication is gated on an explicit completed second visual review record.
const signoff=read('content/audits/nda-2025-ii-source-signoff.json');
assert.equal(signoff.originalPdfSha256,draft.original.sha256);assert.equal(signoff.keyPdfSha256,evidence.sha256);
assert.deepEqual(signoff.reviewedQuestionNumbers,Array.from({length:150},(_,i)=>i+1));
assert.equal(signoff.reproductionSecondPass,'approved');assert.equal(signoff.classificationSecondPass,'approved');
const policy=Object.fromEntries(questions.map(q=>[q.id,{status:q.source.answerStatus,revision:(policyBase[q.id]?.revision??0)+1,contentRevision:policyBase[q.id]?.contentRevision??0,preparationScope:q.preparationScope}]));
// Compare prior reviewed option text explicitly. An order/content repair protects old snapshots.
for(const q of questions){const old=raw.find(r=>r.id===q.id);if(!old)continue;const beforeOptions=fixes[q.id]?.options??old.options;
 const comparable=v=>clean(v).replace(/[’‘]/g,"'").replace(/\s/g,'');
 // Q91's old OCR used capital I for the printed numeral 1; this is a
 // marker-only repair, not a materially different alternative or answer.
 const before=a=>q.questionNumber===91?beforeOptions[a].replace(/\bI\b/g,'1'):beforeOptions[a];
 if(Object.keys(q.options).some(a=>comparable(before(a))!==comparable(q.options[a])))policy[q.id].contentRevision++;
}
const placements=questions.filter(q=>q.preparationScope!=='gs'&&q.questionNumber!==85).flatMap(q=>['NDA','CDS'].map(target=>({questionId:q.id,target,status:'approved',subtopicId:`subtopic:${q.subject==='Science & Technology'?'science':slug(q.subject)}:${slug(q.taxonomyHead)}:${slug(q.topic)}:${slug(q.subtopic)}`,rationale:q.source.classificationRationale,secondPass:signoff.classificationMethod})));
const reconciliation={expected:150,newSourceOccurrences:123,reusedSourceOccurrences:27,awaitingReviewCount:0,dispositionCounts:{'official-final':149,'official-provisional':0,'reasoned-verified':0,withdrawn:1,duplicate:0,quarantined:0},eligibleUniqueQuestionCount:149};
const ledger={paperId:draft.paperId,workflowState:'source-review-complete',sourceIdentity:draft.original,evidence,signoff,searchLog:signoff.searchLog,reconciliation,questionSlots:questions.map(q=>({printedQuestionNumber:q.questionNumber,canonicalQuestionId:q.id,sourcePages:q.source.originalPages,accountingAction:baselines[q.id]?'reused':'new',finalDisposition:q.source.answerStatus,reproduction:{status:'approved',sourceTextHash:q.sourceTextHash,optionsHash:hash(q.options),optionsReordered:false},classification:{status:'approved',primaryPath:classifications[q.questionNumber].path,rationale:q.source.classificationRationale,additional:q.additionalPaths,preparationScope:q.preparationScope},answerEvidence:{...evidence,officialAcceptedOptions:q.source.officialAcceptedOptions,optionTexts:q.source.officialAcceptedOptions.map(a=>q.options[a])},revision:policy[q.id]}))};
for(const [file,value] of [['content/nda-2025-ii-official-paper.json',{version:1,evidence,baselines,questions}],['content/nda-2025-ii-official-review-policy.json',policy],['content/nda-2025-ii-preparation-placements.json',placements],['content/audits/nda-2025-ii-review.json',ledger]]){
 const bytes=JSON.stringify(value,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes);else fs.writeFileSync(file,bytes);
}
console.log(JSON.stringify(reconciliation));
