import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {questionEligible,questionReview} from '../lib/question-review.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),paper=read('content/nda-2024-ii-mathematics-official-paper.json'),audit=read('content/audits/nda-2024-ii-mathematics-review.json'),placements=read('content/nda-2024-ii-mathematics-preparation-placements.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');

test('NDA II 2024 Mathematics accounts for all 120 source questions and admits 116',()=>{
 assert.equal(paper.paperId,'nda-2024-ii-mathematics');
 assert.equal(paper.questions.length,120);assert.equal(audit.questionSlots.length,120);
 assert.deepEqual(paper.questions.map(q=>q.questionNumber),Array.from({length:120},(_,i)=>i+1));
 assert.equal(new Set(paper.questions.map(q=>q.id)).size,120);
 assert.equal(paper.evidence.status,'reasoned-verified');assert.equal(paper.evidence.asset,null);
 assert.equal(hash(fs.readFileSync('public'+paper.questionPaper.asset)),paper.questionPaper.sha256);
 const held=[26,79,94,100];
 for(const q of paper.questions){assert.deepEqual(Object.keys(q.options),['A','B','C','D']);assert.ok(Object.values(q.options).every(Boolean));assert.equal(hash(q.sourceText),q.sourceTextHash);assert.equal(combinedQuestions.filter(r=>r.id===q.id).length,1);assert.equal(questionEligible(q.id),!held.includes(q.questionNumber));assert.equal(questionReview(q.id).status,held.includes(q.questionNumber)?'quarantined':'reasoned-verified');}
 assert.equal(placements.length,116);assert.equal(audit.reconciliation.eligibleUniqueQuestionCount,116);assert.equal(audit.reconciliation.dispositionCounts.quarantined,4);
 assert.equal(paper.questions[117].answer,'D');assert.equal(paper.questions[117].options.D,'1/2');
 assert.equal(paper.questions[20].source.originalPage,11);assert.equal(paper.questions[115].source.originalPage,43);assert.equal(paper.questions[119].source.originalPage,43);
});

test('shared directions are retained on every affected question',()=>{
 for(const n of [41,43,45,47,49,61,63,65,67,69,81,83,85,87,89,91,93,95,97,99])assert.match(paper.questions[n-1].sourceText,/following|items|questions/i,`Q${n}`);
});
