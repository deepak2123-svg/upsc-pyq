import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const reviewerA = read('content/audits/nda-2015-ii-classification-reviewer-a.json');
const reviewerB = read('content/audits/nda-2015-ii-classification-reviewer-b.json');
const adjudication = read('content/audits/nda-2015-ii-classification-adjudication.json');

export const classificationAuditVersion = 'classification-audit-v1';

for (const review of [reviewerA, reviewerB]) {
  assert.equal(review.auditVersion, classificationAuditVersion);
  assert.equal(review.paperId, 'nda-2015-ii-gat');
  assert.equal(review.reviewer.independent, true);
  assert.ok(review.reviewer.id && review.reviewer.method && review.reviewer.reviewedAt);
  assert.equal(new Set(review.decisions.map(row => row.questionId)).size, review.decisions.length);
}
assert.notEqual(reviewerA.reviewer.id, reviewerB.reviewer.id);
assert.equal(adjudication.auditVersion, classificationAuditVersion);
assert.equal(adjudication.paperId, 'nda-2015-ii-gat');
assert.ok(![reviewerA.reviewer.id, reviewerB.reviewer.id].includes(adjudication.adjudicator.id));

const reviewerBById = new Map(reviewerB.decisions.map(row => [row.questionId, row]));
const adjudicationById = new Map(adjudication.decisions.map(row => [row.questionId, row]));
const decisionKey = row => JSON.stringify([
  row.primaryLeaf,
  [...row.additionalLeaves].sort(),
  row.tag,
  row.taxonomyChangeNeeded,
]);

export const classificationAudits = Object.fromEntries(reviewerA.decisions.map(first => {
  const second = reviewerBById.get(first.questionId);
  assert.ok(second, `Reviewer B did not classify ${first.questionId}`);
  const agreed = decisionKey(first) === decisionKey(second);
  const final = agreed ? first : adjudicationById.get(first.questionId);
  assert.ok(final, `Reviewer disagreement is not adjudicated: ${first.questionId}`);
  if (agreed) assert.ok(!adjudicationById.has(first.questionId), `Agreement must not be overwritten by adjudication: ${first.questionId}`);
  else assert.ok(['reviewer-disagreement', 'taxonomy-change'].includes(final.resolves));
  const number = Number(first.questionId.split('-').at(-1));
  assert.ok(Number.isInteger(number));
  return [number, {
    auditVersion: classificationAuditVersion,
    reviewerA: { ...reviewerA.reviewer, decision: first },
    reviewerB: { ...reviewerB.reviewer, decision: second },
    adjudication: agreed ? null : { ...adjudication.adjudicator, decision: final },
    status: agreed ? 'independent-agreement' : 'adjudicated',
    final,
    classificationRevision: 1,
  }];
}));

assert.equal(Object.keys(classificationAudits).length, 28);
assert.deepEqual(
  Object.keys(classificationAudits).map(Number).sort((a, b) => a - b),
  [53, 121, 122, 124, 125, 126, 127, 129, 130, 131, 132, 133, 134, 135, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150],
);
