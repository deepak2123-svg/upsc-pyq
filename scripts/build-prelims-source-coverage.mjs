import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {sourceReuseFiles} from './prelims-source-review-registers.mjs';
import {nda2026IPrimaryEvidence,validateNda2026IEvidence} from './prelims-reviewed-nda-2026-i-imports.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g, ' ').trim();
const sourceRegister = JSON.parse(fs.readFileSync('content/taxonomy/prelims-source-discovery.json'));
const oldPath = '../data/polity/polity_content_reaudit_snapshot.json';
const oldBytes = fs.readFileSync(oldPath);
const old = JSON.parse(oldBytes);
const bank = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
const reviewedPilot = JSON.parse(fs.readFileSync('content/reviewed-prelims-imports.json'));
const reuseGroups=sourceReuseFiles.map(file=>({...JSON.parse(fs.readFileSync(file)),file}));
const reproductionOverrides=JSON.parse(fs.readFileSync('content/prelims-reproduction-overrides.json'));
const materialRepairs=JSON.parse(fs.readFileSync('content/prelims-material-source-repairs.json'));
const materialRepairPolicy=JSON.parse(fs.readFileSync('content/prelims-material-source-repair-policy.json'));
const reviewedPapers=JSON.parse(fs.readFileSync('content/prelims-reviewed-papers.json')).records;
assert.equal(new Set(reviewedPapers.map(row=>row.originalPdfSha256)).size,reviewedPapers.length,'Repeated reviewed-paper identity');
for(const row of reviewedPapers) {
  assert.equal(hash(fs.readFileSync(row.originalPdf)),row.originalPdfSha256);
  if(row.answerVerificationMethod==='primary-source-reasoning') {
    assert.equal(row.identityStatus,'cover-and-question-identity-reviewed');
    assert.equal(row.keyStatus,'not-recovered');
    assert.equal(row.primaryEvidenceModule,'scripts/prelims-reviewed-nda-2026-i-imports.mjs');
    validateNda2026IEvidence();
    assert.ok(Object.keys(nda2026IPrimaryEvidence).length);
  } else {
    assert.equal(hash(fs.readFileSync(row.keyPdf)),row.keySha256);
    assert.equal(row.identityStatus,'cover-key-and-question-identity-reviewed');
    assert.equal(row.series,row.keySeries);assert.equal(row.questionCount,row.keyQuestionCount);
  }
  assert.ok(row.identityRationale&&row.secondPass&&row.questionPages.length);
}
for(const reuse of reuseGroups) {
const reuseEvidence=reuse.evidence;
assert.equal(hash(fs.readFileSync(reuseEvidence.originalPdf)),reuseEvidence.originalPdfSha256);
assert.equal(hash(fs.readFileSync(reuseEvidence.keyPdf)),reuseEvidence.keySha256);
for(const row of reuse.records) {
  const question=bank.find(q=>q.id===row.questionId);
  assert.ok(question&&hash(JSON.stringify(question))===row.expectedRecordHash,`Changed reviewed source reuse: ${row.questionId}`);
  assert.ok(row.reproduction&&row.secondPass&&row.status==='verified-existing-reuse');
  assert.equal(question.exam,reuseEvidence.exam);assert.equal(question.year,reuseEvidence.year);assert.equal(question.paper,reuseEvidence.paper);
  assert.equal(question.questionNumber,row.questionNumber);assert.equal(question.answer,row.displayedAnswer);
  assert.equal(row.officialAnswer,row.displayedAnswer);assert.equal(row.optionsReordered,false);
  if(row.reproductionOverrideRevision) {
    const patch=reproductionOverrides[row.questionId];
    assert.equal(patch?.revision,row.reproductionOverrideRevision);assert.equal(patch?.material,false);
    assert.equal(patch?.sourceTextHash,row.reviewedDisplaySourceTextHash);
    assert.equal(hash(patch.sourceText),row.reviewedDisplaySourceTextHash);
  }
  if(row.materialRepairRevision) {
    const patch=materialRepairs[row.questionId],policy=materialRepairPolicy[row.questionId];
    assert.equal(patch?.revision,row.materialRepairRevision);assert.equal(patch?.material,true);
    assert.equal(patch?.sourceTextHash,row.reviewedDisplaySourceTextHash);
    assert.equal(hash(patch.sourceText),row.reviewedDisplaySourceTextHash);
    assert.equal(policy?.status,'official-final');assert.equal(policy?.contentRevision,patch.contentRevision);
    assert.ok(policy.contentRevision>0,'Material repair must protect historical scoring');
    if(row.reviewedDisplayOptionsHash)assert.equal(hash(JSON.stringify(patch.options)),row.reviewedDisplayOptionsHash);
  }
}
}
const reviewedEntries = [
  ...reviewedPapers.flatMap(paper=>(paper.outOfScopeRanges||[]).flatMap(range=>Array.from({length:range.to-range.from+1},(_,i)=>[`${paper.originalPdfSha256}/${range.from+i}`,{disposition:'out-of-scope',page:range.evidencePages[0],evidence:'content/prelims-reviewed-papers.json',reason:range.reason}]))),
  ...reviewedPilot.questions.map(q => [`${q.source.originalPdfSha256}/${q.questionNumber}`, { id:q.id, disposition:'verified-local-import',page:q.source.originalPage,evidence:'content/reviewed-prelims-imports.json',verificationMethod:q.source.answerStatus==='reasoned-verified'?'primary-source-reasoning':'official-key' }]),
  ...reviewedPilot.placements.map(p => {
    const q=bank.find(q=>q.id===p.questionId);
    assert.ok(q && hash(JSON.stringify(q))===p.expectedRecordHash,`Stale placement evidence: ${p.questionId}`);
    const evidence=reuseGroups.find(group=>group.evidence.exam===q.exam&&group.evidence.year===q.year&&group.evidence.paper===q.paper)?.evidence;
    assert.ok(evidence&&q.year===2013,'Frozen pilot placement context must be explicitly reviewed');
    return [`${evidence.originalPdfSha256}/${q.questionNumber}`, {id:q.id,disposition:'verified-existing-reuse',page:2,evidence:'content/reviewed-prelims-imports.json'}];
  }),
  ...reuseGroups.flatMap(group=>group.records.map(row=>[`${group.evidence.originalPdfSha256}/${row.questionNumber}`,{id:row.questionId,disposition:row.status,page:row.sourcePage,evidence:group.file}])),
];
assert.equal(new Set(reviewedEntries.map(([id])=>id)).size,reviewedEntries.length,'Repeated approved source occurrence');
const reviewedOccurrences=new Map(reviewedEntries);
const files = ['../.tmp/full_reaudit_clean_questions.json', '../.tmp/full_reaudit_clean_cds_questions.json', '../.tmp/full_reaudit_clean_nda_questions.json'];
const cleanSources = files.map(file => {
  const bytes = fs.readFileSync(file);
  return { file, sha256: hash(bytes), rows: JSON.parse(bytes).records };
});
const bankByStem = new Map();
for (const q of bank) {
  const key = `${q.exam}/${q.year}/${normalize(q.sourceText)}`;
  const ids = bankByStem.get(key) || [];
  ids.push(q.id); bankByStem.set(key, ids);
}
const rowsByHash = new Map();
for (const row of old.coverage_records) {
  const rows = rowsByHash.get(row.pdf_sha256) || [];
  rows.push(row); rowsByHash.set(row.pdf_sha256, rows);
}
const papers = [];
const questionSlots = [];
for (const source of sourceRegister.sources) {
  const oldInventory = old.inventory.find(item => item.sha256 === source.sha256);
  const prior = rowsByHash.get(source.sha256) || [];
  // The NDA II 2026 cover was inspected directly in this pass; no inferred range
  // is assigned to an unobserved document merely from its filename.
  const newlyObserved = source.relativePath === 'NDA PYP/GAT/2026-2.pdf';
  const expected = oldInventory ? (source.examCandidate === 'CSE' ? 100 : source.examCandidate === 'CDS' ? 120 : source.examCandidate === 'CAPF' ? 125 : 150) : newlyObserved ? 150 : null;
  const numbers = prior.map(row => row.printed_question_number);
  if (oldInventory) {
    assert.equal(prior.length, expected, `Incomplete prior slot coverage: ${source.relativePath}`);
    assert.equal(new Set(numbers).size, expected, `Repeated printed number: ${source.relativePath}`);
    assert.deepEqual([...numbers].sort((a,b) => a-b), Array.from({ length: expected }, (_,i) => i+1));
  }
  const paperId = oldInventory?.paper_id ?? (newlyObserved ? '2026-2' : null);
  const exam = oldInventory?.exam ?? (newlyObserved ? 'NDA' : null);
  const reviewedPaper=reviewedPapers.find(row=>row.originalPdfSha256===source.sha256);
  const completedDecisions=reviewedPaper?Array.from({length:expected},(_,i)=>reviewedOccurrences.get(`${source.sha256}/${i+1}`)).filter(Boolean):[];
  if(reviewedPaper) {
    assert.equal(reviewedPaper.exam,exam);assert.equal(reviewedPaper.questionCount,expected);
    const evidence=reuseGroups.find(group=>group.evidence.originalPdfSha256===source.sha256)?.evidence
      ?? reviewedPilot.questions.find(q=>q.source.originalPdfSha256===source.sha256)?.source;
    assert.ok(evidence);assert.equal(reviewedPaper.series,evidence.series??evidence.bookletSeries);
    if(reviewedPaper.answerVerificationMethod!=='primary-source-reasoning')assert.equal(reviewedPaper.keySha256,evidence.keySha256);
    assert.ok(completedDecisions.every(row=>row.disposition==='out-of-scope'||reviewedPaper.questionPages.includes(row.page)));
  }
  papers.push({ discoveryId: source.discoveryId, relativePath: source.relativePath, sha256: source.sha256, expectedQuestionCount: expected,
    exam, paperId,
    identityStatus: reviewedPaper?.identityStatus??(newlyObserved ? 'cover-visually-confirmed-series-a' : 'prior-hash-matched-identity-needs-current-review'),
    coverEvidence: reviewedPaper?{page:reviewedPaper.coverPage,registry:'content/prelims-reviewed-papers.json',observed:reviewedPaper.identityRationale}:newlyObserved ? { page: 1, localRender: 'tmp/prelims-source-review/NDA-2026-II-page-1.png', observed: 'N.D.A. & N.A. Examination (II), 2026; General Ability Test; Series A; 150 questions' } : null,
    originalHashMatchesPriorInventory: Boolean(oldInventory),
    priorSlotCount: prior.length,
    coverageStatus: reviewedPaper&&completedDecisions.length===expected?(reviewedPaper.answerVerificationMethod==='primary-source-reasoning'?'current-source-content-and-reasoning-reviewed':'current-source-content-and-key-reviewed'):reviewedPaper&&completedDecisions.length?'current-source-review-in-progress':'slots-accounted-not-question-content-verified',
    ...(reviewedPaper?{year:reviewedPaper.year,paper:reviewedPaper.paper,series:reviewedPaper.series,languages:reviewedPaper.languages,reviewedLanguage:reviewedPaper.reviewedLanguage,
      reviewedSlots:completedDecisions.length,pendingSlots:expected-completedDecisions.length,
      verifiedImports:completedDecisions.filter(row=>row.disposition==='verified-local-import').length,
      outOfScope:completedDecisions.filter(row=>row.disposition==='out-of-scope').length,
      verifiedReuses:completedDecisions.filter(row=>row.disposition==='verified-existing-reuse').length}:{}),
  });
  for (let number = 1; number <= (expected ?? 0); number++) {
    const previous = prior.find(row => row.printed_question_number === number);
    const completed = reviewedPaper?reviewedOccurrences.get(`${source.sha256}/${number}`):undefined;
    const exactStemIds = previous ? bankByStem.get(`${exam}/${previous.year}/${normalize(previous.question_text)}`) || [] : [];
    questionSlots.push({ slotId: `${exam}/${paperId}/Q${number}`, discoveryId: source.discoveryId, printedQuestionNumber: number,
      priorSourcePage: previous?.source_page ?? null,
      priorReconstructionStatus: previous?.reconstruction_status ?? null,
      existingStemMatchIds: exactStemIds,
      disposition: completed?.disposition ?? 'pending-current-source-review',
      ...(completed ? { ...(completed.id?{reviewedRecordId:completed.id}:{}), reviewedSourcePage:completed.page, decisionEvidence: completed.evidence } : {}),
      note: completed?.disposition==='out-of-scope'?completed.reason:completed?.verificationMethod==='primary-source-reasoning'?`Original Series A page ${completed.page} visually reread; independently verified using hashed primary references and explicit second-pass reasoning. No official key recovered.`:completed ? `Original Series A page ${completed.page} and official-key page 1 visually reviewed; retained the existing ID where the occurrence was already represented.` : 'A prior slot or matching stem is a review lead, not a confirmed booklet-series conversion, correct reproduction, answer verification, or scope decision.',
    });
  }
}
const candidates = cleanSources.flatMap(({ file, sha256, rows }) => rows.map((row, index) => {
  const stem = row.full_question_text || row.question_text;
  const stemIds = bankByStem.get(`${row.exam}/${row.year}/${normalize(stem)}`) || [];
  const exactRecordIds = stemIds.filter(id => {
    const q = bank.find(q => q.id === id);
    return ['A','B','C','D'].every(letter => normalize(q.options[letter]) === normalize(row.options?.[letter]));
  });
  const number = row.canonical_question_number ?? row.structured_question_number;
  return {
    candidateId: `transcript:${sha256}:${index}`, transcriptFile: file, transcriptFileSha256: sha256, transcriptIndex: index,
    identityCandidate: { exam: row.exam, year: row.year, paper: row.paper, questionNumber: number },
    sourceText: stem, options: row.options, secondaryAnswer: row.answer,
    secondaryUrl: row.clean_source_url,
    existingStemMatchIds: stemIds, exactTextAndOptionMatchIds: exactRecordIds,
    originalPdfMatchStatus: 'pending-page-and-series-comparison',
    action: exactRecordIds.length === 1 ? 'review-reuse-existing' : exactRecordIds.length > 1 ? 'review-duplicate-existing' : stemIds.length ? 'review-option-or-reproduction-conflict' : 'review-potential-missing-import',
    classificationStatus: 'pending', answerStatus: 'secondary-transcript-not-verification', publicationStatus: 'held',
  };
}));
const coverage = {
  version: 1, status: 'source-review-work-queue-not-verified-coverage',
  priorEvidence: { file: oldPath, sha256: hash(oldBytes), reusedAs: 'question-slot and provenance leads only; prior classifications and publication flags are not accepted' },
  papers, questionSlots,
};
const staging = { version: 1, status: 'held-import-staging-not-active-bank', sources: cleanSources.map(({file,sha256,rows}) => ({file,sha256,records: rows.length})), candidates };
for (const [file, value] of [['content/taxonomy/prelims-source-coverage.json', coverage], ['content/taxonomy/prelims-import-staging.json', staging]]) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file,'utf8'), bytes, `Stale source-review queue: ${file}`);
  else if (!fs.existsSync(file) || fs.readFileSync(file,'utf8') !== bytes) fs.writeFileSync(file, bytes);
}
console.log(JSON.stringify({ papers: papers.length, questionSlots: questionSlots.length, priorHashMatchedPapers: papers.filter(p => p.originalHashMatchesPriorInventory).length, heldTranscriptCandidates: candidates.length, candidateActions: Object.fromEntries([...new Set(candidates.map(c=>c.action))].map(action => [action, candidates.filter(c=>c.action===action).length])) }));
