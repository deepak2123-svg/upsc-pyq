import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const templates = 'docs/templates/';

test('paper and question templates start unapproved with separate evidence, placement and release decisions', () => {
  const paper = readJson(templates + 'paper-register.template.json');
  const question = readJson(templates + 'question-review.template.json');
  const exception = readJson(templates + 'ambiguous-mcq-case.template.json');
  assert.equal(paper.workflowState, 'not-started');
  assert.equal(paper.expectedQuestionCount, null);
  assert.deepEqual(paper.expectedQuestionNumbers, []);
  assert.deepEqual(paper.questionSlots, []);
  assert.equal(paper.keyTranscription.comparisonResult, 'pending');
  assert.equal(paper.reconciliation.sourceReviewComplete, false);
  assert.equal(paper.release.localVerified, false);
  assert.equal(paper.release.liveVerified, false);
  assert.deepEqual(Object.keys(paper.reconciliation.dispositionCounts).sort(),
    ['official-final', 'official-provisional', 'reasoned-verified', 'withdrawn', 'duplicate', 'quarantined'].sort());
  assert.ok(Object.values(paper.reconciliation.dispositionCounts).every(value => value === null));
  assert.equal(question.workflowState, 'awaiting-review');
  assert.equal(question.reproduction.decision, 'not-reviewed');
  assert.equal(question.classification.status, 'not-reviewed');
  assert.equal(question.answerEvidence.status, 'not-established');
  assert.equal(question.publication.disposition, null);
  assert.equal(question.publication.eligibleForNewScoredTests, false);
  assert.equal(question.application.applied, false);
  assert.equal(exception.workflowState, 'awaiting-review');
  assert.equal(exception.publicationDecision.eligibleForNewScoredTests, false);
  assert.equal(exception.application.applied, false);
  for (const evidence of [question.answerEvidence, exception.officialAnswerEvidence]) {
    assert.deepEqual(evidence.officialAcceptedOptions, []);
    assert.deepEqual(evidence.displayedAcceptedOptions, []);
    assert.equal(evidence.doubleTranscriptionComparisonReference, null);
  }
  assert.equal(question.publication.multipleAcceptedOptionsRuntimeVerified, false);
  assert.equal(exception.publicationDecision.multipleAcceptedOptionsRuntimeVerified, false);
});

test('standing SOP, checklist and template links resolve locally', () => {
  const documents = ['AGENTS.md', 'README.md', 'docs/paper-processing-sop.md',
    'docs/paper-release-checklist.md', 'docs/ambiguous-mcq-sop.md',
    'docs/mcq-reproduction-sop.md', templates + 'README.md',
    templates + 'paper-release-report.template.md'];
  for (const file of documents) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z]+:|#)/i.test(target)) continue;
      const destination = path.resolve(path.dirname(file), target.split('#')[0]);
      assert.ok(fs.existsSync(destination), `${file}: broken local link ${target}`);
    }
  }
  assert.match(fs.readFileSync('AGENTS.md', 'utf8'), /docs\/paper-processing-sop\.md/);
  const checklist = fs.readFileSync('docs/paper-release-checklist.md', 'utf8');
  for (const gate of [...Array.from({length: 10}, (_, index) => `R${index + 1}`), 'P1', 'P2', 'P3']) {
    assert.ok(checklist.includes(`## ${gate} —`), `Missing checklist gate ${gate}`);
  }
});

test('ambiguity guidance no longer calls the completed NDA I Q75 quarantined', () => {
  const text = fs.readFileSync('docs/ambiguous-mcq-sop.md', 'utf8');
  assert.ok(!text.includes('**Current decision:** `quarantined`'));
  assert.ok(!text.includes('## 10. What we do next for this paper'));
  assert.ok(!text.includes('NDA I 2026 now has a separate original-page viewer'));
  const paper = readJson('content/nda-2026-i-official-paper.json');
  const policy = readJson('content/nda-2026-i-official-review-policy.json');
  const q75 = paper.questions.find(question => question.questionNumber === 75);
  assert.equal(q75.answer, 'D');
  assert.equal(policy[q75.id].status, 'official-provisional');
  assert.ok(text.includes('**D (40 m/s)**'));
});
