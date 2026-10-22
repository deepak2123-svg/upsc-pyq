import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const file = 'content/question-bank.json';
const bank = JSON.parse(fs.readFileSync(file, 'utf8'));
const protectedReviews=fs.existsSync('content/question-review-state.json')?JSON.parse(fs.readFileSync('content/question-review-state.json')).records:{};
const reviewFile = 'content/audits/reviewed-answer-keys.json';
const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
const cellReview = JSON.parse(fs.readFileSync('content/audits/reviewed-answer-key-cells.json', 'utf8'));
for (const paper of cellReview.papers) {
  const existingIndex = review.papers.findIndex(existing => existing.exam === paper.exam && existing.year === paper.year && existing.paper === paper.paper);
  const expanded = { ...paper, evidenceTier: paper.evidenceTier ?? 'official-key-mirror-visually-reviewed', source: paper.source ?? '', page: paper.page ?? 1,
    answers: Object.fromEntries(paper.cells.split(' ').map(cell => {
      const [, number, letter] = cell.match(/^(\d+)([ABCD])$/);
      return [number, [letter, paper.reasons?.[number] ?? `Displayed options compared with the mirrored official ${paper.series}-series key, question ${number}.`, ...(paper.originalKeyAnswers?.[number] ? [paper.originalKeyAnswers[number]] : [])]];
    })) };
  if (existingIndex < 0) review.papers.push(expanded);
  else review.papers[existingIndex] = { ...expanded, sha256: review.papers[existingIndex].sha256 };
}
const revisionsFile = 'content/answer-key-revisions.json';
const revisions = fs.existsSync(revisionsFile) ? JSON.parse(fs.readFileSync(revisionsFile, 'utf8')) : { 'nda-2021-ii-54': 1 };
const changes = [];
const sourceIndex = [
  ...JSON.parse(fs.readFileSync('../.tmp/full_reaudit_reference/ndli_reference_index.json', 'utf8')).records,
  ...JSON.parse(fs.readFileSync('../.tmp/full_reaudit_answer_keys/answer_key_index.json', 'utf8')).records,
  ...JSON.parse(fs.readFileSync('../data/polity/polity_answer_maps_archived_official.json', 'utf8')).records.map(row => ({ ...row, kind: 'official-answer-key-mirror', document_url: row.source, output: `../.tmp/polity_archived_official_keys/${row.exam}_${row.year}_${row.paper}.pdf` })),
];
for (const paper of review.papers) {
  const acquired = sourceIndex.find(row => row.exam === paper.exam && ['answer-key', 'official-answer-key-mirror'].includes(row.kind) && row.output && path.basename(row.output) === path.basename(paper.localPdf));
  if (!acquired && !['https://cdn-images.prepp.in/public/image/', 'https://www.upsc.gov.in/sites/default/files/'].some(prefix => paper.source.startsWith(prefix))) throw new Error('Missing acquisition manifest entry');
  if (acquired) paper.source = acquired.document_url ?? acquired.download_url;
  const digest = crypto.createHash('sha256').update(fs.readFileSync(paper.localPdf)).digest('hex');
  if (acquired?.sha256 && acquired.sha256 !== digest) throw new Error('Acquired evidence hash changed');
  if (paper.sha256 && paper.sha256 !== digest) throw new Error('Evidence changed');
  paper.sha256 = digest;
  for (const [number, [answer, reason, originalKeyAnswer]] of Object.entries(paper.answers)) {
    const question = bank.questions.find(q => q.exam === paper.exam && q.year === paper.year && q.paper === paper.paper && q.questionNumber === Number(number));
    if (!question || !Object.hasOwn(question.options, answer)) throw new Error(`Invalid review ${number}`);
    // Reconstructed source identity/booklet reviews take precedence over the old bulk registry.
    if(protectedReviews[question.id]?.status && protectedReviews[question.id].status!=='pending') continue;
    if (question.answer === answer) {
      if (question.source.answerAudit?.evidenceSha256 === digest) {
        question.source.answerSource = paper.source;
        if (paper.evidenceTier === 'official-provisional-key-visually-reviewed') question.source.answerStatus = 'official-provisional-key-reviewed';
      }
      continue;
    }
    const previousAnswer = question.answer;
    question.source.answerCorrection = { previousAnswer, correctedAt: review.reviewedAt, reason, previousAnswerSource: question.source.answerSource, previousAnswerStatus: question.source.answerStatus };
    question.source.answerStatus = originalKeyAnswer ? 'official-mirror-key-option-remapped' : paper.evidenceTier === 'official-provisional-key-visually-reviewed' ? 'official-provisional-key-reviewed' : 'official-mirror-key-reviewed';
    question.source.answerSource = paper.source;
    question.source.answerAudit = { date: review.reviewedAt, evidenceSha256: digest, series: paper.series, page: paper.page, originalKeyAnswer: originalKeyAnswer ?? answer };
    question.answer = answer;
    question.explanation = reason;
    revisions[question.id] = (revisions[question.id] ?? 0) + 1;
    changes.push({ id: question.id, previousAnswer, answer, reason });
  }
}
fs.writeFileSync(file, `${JSON.stringify(bank, null, 2)}\n`);
fs.writeFileSync(reviewFile, `${JSON.stringify(review, null, 2)}\n`);
fs.writeFileSync(revisionsFile, `${JSON.stringify(revisions, null, 2)}\n`);
console.log(JSON.stringify(changes, null, 2));
