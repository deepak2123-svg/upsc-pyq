import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview} from '../lib/question-review.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),paper=read('content/nda-2023-ii-mathematics-official-paper.json'),audit=read('content/audits/nda-2023-ii-mathematics-review.json'),placements=read('content/nda-2023-ii-mathematics-preparation-placements.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('NDA II 2023 Mathematics preserves all 120 official Series A questions',()=>{
 assert.equal(paper.paperId,'nda-2023-ii-mathematics');assert.equal(paper.questions.length,120);assert.equal(audit.questionSlots.length,120);assert.deepEqual(paper.questions.map(q=>q.questionNumber),Array.from({length:120},(_,i)=>i+1));assert.equal(new Set(paper.questions.map(q=>q.id)).size,120);assert.equal(paper.evidence.status,'official-final');assert.equal(paper.evidence.scored,120);assert.equal(paper.evidence.dropped,0);assert.equal(hash(fs.readFileSync('public'+paper.questionPaper.asset)),paper.questionPaper.sha256);assert.equal(hash(fs.readFileSync('public'+paper.evidence.asset)),paper.evidence.sha256);
 for(const q of paper.questions){assert.deepEqual(Object.keys(q.options),['A','B','C','D']);assert.ok(Object.values(q.options).every(Boolean),q.id);assert.equal(hash(q.sourceText),q.sourceTextHash);assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),true);assert.equal(questionReview(q.id).status,'official-final');assert.equal(combinedQuestions.find(r=>r.id===q.id).taxonomyVersion,'nda-mathematics-v2');}
 assert.equal(placements.length,120);assert.equal(audit.reconciliation.eligibleUniqueQuestionCount,120);assert.equal(audit.reconciliation.dispositionCounts['official-final'],120);assert.equal(audit.reconciliation.dispositionCounts.quarantined,0);
});
