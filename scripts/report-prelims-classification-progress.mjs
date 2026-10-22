import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {sourceReuseFiles} from './prelims-source-review-registers.mjs';

const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const baseline = read('content/taxonomy/prelims-classification-register.json');
const bytes = fs.readFileSync('content/question-bank.json');
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), baseline.baselineBankSha256);
const imported = read('content/reviewed-prelims-imports.json');
const coverage = read('content/taxonomy/prelims-source-coverage.json');
const staging = read('content/taxonomy/prelims-import-staging.json');
const syllabus = read('content/taxonomy/upsc-prelims-v2-draft.json');
const placements = read('content/taxonomy/prelims-reviewed-placements.json');
const reviewedAliases = read('content/reviewed-question-aliases.json');
const sourceReuse={records:sourceReuseFiles.flatMap(file=>read(file).records)};
const reproductionCorrections=read('content/reviewed-prelims-reproduction-corrections.json');
const materialRepairs=read('content/reviewed-material-source-repairs.json');
const {default:worker} = await import('../dist/server/index.js');
const response = await worker.fetch(new Request('http://localhost/api/pyqs/inventory'), {ASSETS:{fetch:async()=>new Response('Not found',{status:404})}}, {waitUntil(){},passThroughOnException(){}});
assert.equal(response.status,200);
const inventory=await response.json();
const reviewedIds=new Set(placements.records.filter(p=>p.status==='approved'&&Object.hasOwn(baseline.records,p.questionId)).map(p=>p.questionId));
const outsideIds=new Set(placements.records.filter(p=>p.status==='out-of-scope'&&Object.hasOwn(baseline.records,p.questionId)).map(p=>p.questionId));
assert.ok([...reviewedIds].every(id=>Object.hasOwn(baseline.records,id)));
const output = {
  phase: reviewedIds.size+outsideIds.size===baseline.baselineCount?'original-placement-decisions-complete-syllabus-source-and-import-review-incomplete':'nine-subject-working-library-full-corpus-classification-and-imports-incomplete',
  syllabus: { version:syllabus.version, active:inventory.taxonomyVersion===syllabus.version, editorialReviewComplete:false, counts:Object.fromEntries(['subject','section','chapter','subpart'].map(kind=>[kind,syllabus.nodes.filter(n=>n.kind===kind).length])) },
  originalClassificationCohort: { total:baseline.baselineCount, approvedPlacements:reviewedIds.size, preservedPhysicalDecisions:placements.records.filter(r=>r.basis==='preserved-physical-v1.2-review').length, freshReviewedDecisions:placements.records.filter(r=>r.status==='approved'&&r.basis!=='preserved-physical-v1.2-review'&&Object.hasOwn(baseline.records,r.questionId)).length, outOfScope:outsideIds.size, remainingCurrentReview:baseline.baselineCount-reviewedIds.size-outsideIds.size, preservedReviewsNotFreshSourceReviews:true },
  editorialFollowUps:placements.records.flatMap(row=>(row.editorialFollowUps||[]).map(followUp=>({questionId:row.questionId,classificationStatus:row.status,...followUp}))),
  newApprovedImports: imported.questions.map(q=>q.id),
  reusedLegacyIds: imported.placements.map(p=>p.questionId),
  additionalSourceReviewedReuseIds:sourceReuse.records.map(row=>row.questionId),
  reproductionCorrections:{records:reproductionCorrections.records.map(row=>({questionId:row.questionId,revision:row.revision,material:row.material})),note:'Nonmaterial current-display corrections preserve raw records, legacy transcripts and historical snapshots; material repairs require separate grading revisions.'},
  materialSourceRepairs:{records:materialRepairs.records.map(row=>({questionId:row.questionId,revision:row.revision,contentRevision:row.contentRevision})),note:'Reviewed current-display source repairs preserve raw records and exclude historical snapshots predating the material-content revision.'},
  sourceCoverage: { files:coverage.papers.length, questionSlots:coverage.questionSlots.length,
    explicitReviewedSlotDecisions:coverage.questionSlots.filter(slot=>slot.disposition!=='pending-current-source-review').length,
    pendingCurrentSourceReviewSlots:coverage.questionSlots.filter(slot=>slot.disposition==='pending-current-source-review').length,
    completedPapers:coverage.papers.filter(p=>p.coverageStatus==='current-source-content-and-key-reviewed').map(p=>({exam:p.exam,year:p.year,paper:p.paper,series:p.series,reviewedLanguage:p.reviewedLanguage,reviewedSlots:p.reviewedSlots,verifiedImports:p.verifiedImports,verifiedReuses:p.verifiedReuses})),
    note:'Slot accounting is not complete reproduction, classification or answer verification.' },
  secondaryStaging: { candidates:staging.candidates.length, held:staging.candidates.filter(c=>c.publicationStatus==='held').length, note:'Includes out-of-scope and existing-question leads; these are not approved import totals.' },
  reviewedSourceAliases: { count:reviewedAliases.records.length, records:reviewedAliases.records.map(row=>({aliasId:row.aliasId,canonicalId:row.canonicalId})), note:'Additional reviewed source-occurrence duplicates; frozen 204 answer-cohort decisions are unchanged and historical IDs remain available.' },
  activeLocalLibrary: { inventoryVersion:inventory.version, historicalRecords:baseline.baselineCount+imported.questions.length, eligible:inventory.totalCount, mapped:inventory.mappedCount, unmapped:inventory.unmappedCount },
  checks: { historicalBankHashUnchanged:true, approvedImportsCheck:'node scripts/build-reviewed-prelims-pilot-imports.mjs --check', reviewedAliasCheck:'node scripts/build-reviewed-question-aliases.mjs --check', reproductionOverridesCheck:'node scripts/build-prelims-reproduction-overrides.mjs --check', materialRepairCheck:'node scripts/build-reviewed-material-source-repairs.mjs --check', sourceQueueCheck:'node scripts/build-prelims-source-coverage.mjs --check' },
  release: { githubPushed:false, deployed:false, databaseRowsImported:false },
};
fs.writeFileSync('content/taxonomy/prelims-classification-progress.json', `${JSON.stringify(output,null,2)}\n`);
console.log(JSON.stringify(output,null,2));
