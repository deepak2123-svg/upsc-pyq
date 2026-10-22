import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const read=p=>JSON.parse(fs.readFileSync(p));
const register=read('content/question-review-state.json'),bank=read('content/question-bank.json'),audit=read('content/audits/answer-key-audit.json');
const rows=Object.entries(register.records).map(([id,r])=>({id,...r}));
const statuses=['official-final','official-provisional','reasoned-verified','withdrawn','duplicate','quarantined','pending'];
const counts=Object.fromEntries(statuses.map(s=>[s,rows.filter(r=>r.status===s).length]));
assert.equal(rows.length,204);assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),204);assert.equal(counts.pending,0);
const cleared=new Set(['official-final','official-provisional','reasoned-verified']);
const active=bank.questions.filter(q=>!register.records[q.id]||cleared.has(register.records[q.id].status));
const identityChanges=rows.filter(r=>r.changes.length&&['exam','year','paper','questionNumber'].some(k=>r.changes[0].before[k]!==r.identity[k]));
const wrongExam=identityChanges.filter(r=>r.changes[0].before.exam!==r.identity.exam);
const keyChanges=audit.rows.filter(r=>register.records[r.id]&&r.currentAnswer!==r.answerAtAudit);
const batches=read('content/audits/legacy-review-batches.json').batches.map(b=>({batch:b.batch,total:b.records.length,dispositions:Object.fromEntries(statuses.map(s=>[s,b.records.filter(r=>register.records[r.id].status===s).length]))}));
const {default:worker}=await import(pathToFileURL(path.resolve('dist/server/index.js')));
const response=await worker.fetch(new Request('http://localhost/api/pyqs/inventory'),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});
const inventory=await response.json();assert.equal(inventory.totalCount,active.length);
const checks=fs.existsSync('content/audits/verification-validation.json')?read('content/audits/verification-validation.json'):null;
const result={date:'2026-10-19',originalCohort:204,dispositions:counts,cleared:rows.filter(r=>cleared.has(r.status)).length,held:rows.filter(r=>!cleared.has(r.status)).length,wholeBank:{historical:bank.questions.length,eligible:active.length,mapped:inventory.mappedCount,unmapped:inventory.unmappedCount,keyCorrections:audit.corrected},cohortAnswerCorrections:keyChanges,wrongExamCorrections:wrongExam.length,identityChanges:identityChanges.map(r=>({id:r.id,before:Object.fromEntries(['exam','year','paper','questionNumber'].map(k=>[k,r.changes[0].before[k]])),after:r.identity})),materialRevisions:rows.filter(r=>r.contentRevision>0).map(r=>({id:r.id,contentRevision:r.contentRevision,changes:r.changes.map(({beforeHash,afterHash,reason})=>({beforeHash,afterHash,reason}))})),batches,heldRecords:rows.filter(r=>!cleared.has(r.status)).map(r=>({id:r.id,status:r.status,canonicalId:r.canonicalId,reason:r.reason,evidence:r.evidence})),validation:checks,release:'Local only. Release approval required; no push or deployment performed.'};
fs.writeFileSync('content/audits/pending-204-reconciliation.json',JSON.stringify(result,null,2)+'\n');
const esc=s=>String(s??'').replaceAll('|','/').replaceAll('\n',' ');
const label=q=>`${q.exam} ${q.year} ${q.paper} Q${q.questionNumber}`;
const lines=['# Verification of the remaining 204 questions','',`Local review completed 2026-10-19. **${result.cleared} cleared; ${result.held} intentionally excluded.** No push, deployment or database mutation.`,
'','## Reconciliation','','| Disposition | Records |','|---|---:|',...statuses.map(s=>`| ${s} | ${counts[s]} |`),'| **Total** | **204** |','',
'Official-final and official-provisional are distinct. The 18 reasoned decisions are primary-source conclusions, not recovered official examination answers. All six ambiguous/evidence-conflicted records remain quarantined. A completed disposition register does not imply that all 204 were made publishable.',
'','## Applied changes','',
`- ${wrongExam.length} wrong-exam labels repaired; ${identityChanges.length} records have a source-identity correction (exam, session, or question number). Published IDs retained.`,
`- ${keyChanges.length} additional answer-letter corrections in this cohort; ${audit.corrected} corrections against the frozen original full bank, including the previous 114.`,
`- ${result.materialRevisions.length} cohort records have a material content revision. Old snapshots of those versions are excluded rather than graded against unseen repairs.`,
'- All 160 legacy imports processed in eight fixed batches. Complete stems, options and matching-list codes were reconstructed before key checks. Duplicate records retain their historical IDs and canonical links.',
'- CAPF 2025 Series A official final key recovered directly from UPSC. Twenty records cleared, including Q71 C → A and Q123 C → A. NDA I 2025 matching official key was not recovered; primary-source reasoning or quarantine was used instead.',
'','## Library impact','','| Measure | Count |','|---|---:|',`| Historical records retained | ${bank.questions.length} |`,`| Eligible for new tests | ${active.length} |`,`| In the syllabus browser | ${inventory.mappedCount} |`,`| Eligible but not mapped into the current syllabus | ${inventory.unmappedCount} |`,'',
'The original 1,315 eligible records plus 181 cleared cohort records produce 1,496 eligible records. Syllabus classification was not broadly rewritten; verified eligibility does not imply a new chapter assignment. Nine restored English records have a truthful English classification rather than general-studies placement.',
'','## Eight legacy batches','','| Batch | Records | Final | Provisional | Reasoned | Withdrawn | Duplicate | Quarantined |','|---|---:|---:|---:|---:|---:|---:|---:|',...batches.map(b=>`| ${b.batch} | ${b.total} | ${b.dispositions['official-final']} | ${b.dispositions['official-provisional']} | ${b.dispositions['reasoned-verified']} | ${b.dispositions.withdrawn} | ${b.dispositions.duplicate} | ${b.dispositions.quarantined} |`),
'','## Additional answer corrections','','| Published ID | Before | After | Basis |','|---|---|---|---|',...keyChanges.map(r=>`| ${r.id} | ${r.answerAtAudit} | ${r.currentAnswer} | ${esc(r.review.reason)} |`),
'','## Quarantined: evidence still needed','',...rows.filter(r=>r.status==='quarantined').flatMap(r=>[`### ${r.id} — ${label(r.identity)}`,'',r.reason,'',...r.evidence.filter(e=>e.url).map(e=>`- [${esc(e.locator??e.kind)}](${e.url})`),'']),
'## Withdrawn','','| ID | Decision |','|---|---|',...rows.filter(r=>r.status==='withdrawn').map(r=>`| ${r.id} | ${esc(r.reason)} |`),
'','## Duplicate canonical references','','| Historical ID | Active canonical ID |','|---|---|',...rows.filter(r=>r.status==='duplicate').map(r=>`| ${r.id} | ${r.canonicalId} |`),
'','## Source identity corrections','','| Published ID | Original displayed identity | Verified identity |','|---|---|---|',...identityChanges.map(r=>`| ${r.id} | ${label(r.changes[0].before)} | ${label(r.identity)} (Series ${r.identity.series}, PDF page ${r.identity.page}) |`),
'','## Reproduction changes and history','',
'Full before-values, original hashes, after-hashes, reasons, approval hashes and separate content/key revisions are in `content/question-review-state.json`. The following IDs have content revisions; snapshots without the new revision are excluded.',
'','| ID | Content revision |','|---|---:|',...result.materialRevisions.map(r=>`| ${r.id} | ${r.contentRevision} |`),
'','## Application safeguards','',
'- Server-owned eligibility gate for inventories, snapshot creation, direct routes and new database-backed tests. Legacy offline selection uses the same gate.',
'- Full historical lookup remains available. Submitted answers and original snapshot wording/source labels remain unchanged.',
'- Key-only repairs invalidate cached feedback; material repairs, withdrawn questions, duplicates and quarantined questions do not penalize historical attempts.',
'- Separate scored/excluded totals and nullable answers for exclusions. Legacy/cloud scoring applies current keys and content-revision exclusions on read without mutating submitted answers.',
'- Corrected source labels appear as notices on historical review, not silently rewritten snapshots.',
'- New PDFs and online tests share the cleared pool. Historical PDF keys print Excluded instead of a forced answer. Matching tables and original figures are retained.',
'- Raw legacy normalizer cannot overwrite audited content. Older bulk-key application skips records protected by the reconstruction register. Reapplication is hash-guarded and idempotent.',
'','## Verification and release gate','',checks?'```json\n'+JSON.stringify(checks,null,2)+'\n```':'Validation still running; do not release.',
'','The authenticated/database-backed flow was checked through its shared grading logic and code boundaries; a live database end-to-end run is not claimed. The current local online/results/PDF flows are covered by browser tests. Older `selection.spec.ts` targets the retired selection UI and is not part of the current-flow run.',
'','## Evidence files','',
'- `content/question-review-state.json`: frozen IDs, per-record decisions, primary URLs, original/key PDF hashes and locators, complete before-values and review passes.',
'- `content/audits/approved-question-reconstructions.json`: guarded approved restorations.',
'- `content/audits/answer-key-audit.json`: all 1,519 records and before/after answers. Whole-bank key-cell review is not whole-bank reproduction certification.',
'- `content/audits/pending-204-reconciliation.json`: machine-readable final reconciliation and library impact.',
'- `content/audits/nda-2025-i-primary-review.json`: individual reasoning, rejected alternatives and unresolved premises.',
'- `content/audits/reviewed-answer-keys.json`: previous official-key cells, including explicit option-remapping metadata where applicable. Newly cleared cohort official letters and displayed letters are stored together in the register; no undocumented conversion is used.',
'','Source PDFs remain local evidence; do not republish copyrighted textbooks. Review this local diff and report before authorizing a push or deployment.',''];
fs.writeFileSync('docs/pending-question-verification-implementation.md',lines.join('\n'));
console.log({dispositions:counts,eligible:active.length,mapped:inventory.mappedCount});
