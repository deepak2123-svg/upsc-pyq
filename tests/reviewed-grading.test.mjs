import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reviewedAnswer,scoreReviewedQuestions} from '../lib/reviewed-grading.ts';
import {questionContentRevision,questionCorrectionNotice} from '../lib/question-review.ts';

test('material source repair preserves raw and historical text while scoring only repaired revision',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const raw=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id==='cse-2013-gs-i-94');
  const current=combinedQuestions.find(q=>q.id===raw.id),legacy=legacyQuestions.find(q=>q.id===raw.id);
  assert.equal(legacy.sourceText,raw.sourceText);
  assert.ok(!raw.promptLines.join(' ').includes('Tiny leaves or no leaves'));
  assert.ok(current.promptLines.includes('2. Tiny leaves or no leaves'));
  assert.equal(current.promptLines[0],'Which of the following leaf modifications occurs/occur in the desert areas to inhibit water loss?');
  assert.equal(current.sourceTextHash,'97369ee809ad8800479020f311635658016bfc48b3f5617f2dbc115012d6b900');
  assert.deepEqual(current.options,raw.options);assert.equal(current.answer,'D');
  assert.equal(questionContentRevision(raw.id),1);
  const old={...raw,correctOption:raw.answer},saved=JSON.stringify(old);
  const scoring={marksPerQuestion:2,negativeMarksPerQuestion:2/3},answers=new Map([[raw.id,'D']]);
  const historical=scoreReviewedQuestions([old],answers,scoring);
  assert.equal(historical.excludedCount,1);assert.equal(historical.correctCount,0);assert.equal(historical.incorrectCount,0);
  assert.equal(JSON.stringify(old),saved);
  const repaired=scoreReviewedQuestions([{...current,correctOption:current.answer,contentRevision:1}],answers,scoring);
  assert.equal(repaired.correctCount,1);assert.equal(repaired.excludedCount,0);
});

test('2014 modal-stem and option-only repairs preserve historical text and exclude old snapshots',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  const ids=[13,19].map(n=>`cse-2014-gs-i-${n}`),current=[],old=[];
  for(const id of ids) {
    const raw=bank.find(q=>q.id===id),repaired=combinedQuestions.find(q=>q.id===id),legacy=legacyQuestions.find(q=>q.id===id);
    assert.equal(legacy.sourceText,raw.sourceText);assert.deepEqual(legacy.options,raw.options);
    assert.equal(questionContentRevision(id),1);assert.equal(repaired.answer,'C');
    old.push({...raw,correctOption:raw.answer});current.push({...repaired,correctOption:repaired.answer,contentRevision:1});
  }
  assert.ok(old[0].promptLines[0].includes('has/have'));
  assert.ok(current[0].promptLines[0].includes('might have'));
  assert.equal(old[1].options.C,'1, 2 and 4');assert.equal(current[1].options.C,'1, 2 and 4 only');
  const before=JSON.stringify(old),answers=new Map(ids.map(id=>[id,'C'])),scoring={marksPerQuestion:2,negativeMarksPerQuestion:2/3};
  const historical=scoreReviewedQuestions(old,answers,scoring);
  assert.equal(historical.excludedCount,2);assert.equal(historical.correctCount,0);assert.equal(historical.incorrectCount,0);
  assert.equal(JSON.stringify(old),before);
  const latest=scoreReviewedQuestions(current,answers,scoring);assert.equal(latest.correctCount,2);assert.equal(latest.excludedCount,0);
});

test('nonmaterial reproduction correction preserves old snapshots and their scoring',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const raw=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id==='cse-2013-gs-i-53');
  const current=combinedQuestions.find(q=>q.id===raw.id),legacy=legacyQuestions.find(q=>q.id===raw.id);
  assert.equal(current.sourceText,raw.sourceText.replace('kinds of an organism','kinds of organism'));
  assert.equal(legacy.sourceText,raw.sourceText,'Legacy compatibility keeps its original transcript');
  assert.deepEqual(current.options,raw.options);assert.equal(current.answer,raw.answer);
  assert.equal(questionContentRevision(raw.id),0);
  const saved={...raw,correctOption:raw.answer,contentRevision:0};
  const before=JSON.stringify(saved);
  const result=scoreReviewedQuestions([saved],new Map([[raw.id,'B']]),{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
  assert.equal(result.correctCount,1);assert.equal(result.excludedCount,0);
  assert.equal(JSON.stringify(saved),before,'Never rewrite the historical displayed question');
});

test('2015 introductory phrase and river spelling corrections preserve raw transcripts and historical grades',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const bank=JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
  for(const[n,answer]of [[33,'B'],[36,'D']]) {
    const id=`cse-2015-gs-i-${n}`,raw=bank.find(q=>q.id===id),before=JSON.stringify(raw);
    const current=combinedQuestions.find(q=>q.id===id),legacy=legacyQuestions.find(q=>q.id===id);
    assert.equal(legacy.sourceText,raw.sourceText);assert.deepEqual(current.options,raw.options);
    assert.equal(current.answer,answer);assert.equal(questionContentRevision(id),0);
    assert.notEqual(current.sourceTextHash,raw.sourceTextHash);
    if(n===33)assert.ok(current.sourceText.startsWith('The area known as'));
    else {assert.ok(current.sourceText.includes('Pranahita'));assert.ok(raw.sourceText.includes('Pranhita'));}
    const saved={...raw,correctOption:raw.answer,contentRevision:0},savedBefore=JSON.stringify(saved);
    const result=scoreReviewedQuestions([saved],new Map([[id,answer]]),{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
    assert.equal(result.correctCount,1);assert.equal(result.excludedCount,0);
    assert.equal(JSON.stringify(saved),savedBefore);assert.equal(JSON.stringify(raw),before);
  }
});

test('2016 NGRBA closing-quote restoration preserves original wording, saved answers and grades',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const raw=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id==='cse-2016-gs-i-23');
  const current=combinedQuestions.find(q=>q.id===raw.id),legacy=legacyQuestions.find(q=>q.id===raw.id);
  assert.equal(current.sourceText,raw.sourceText.replace('Authority (NGRBA)?',"Authority (NGRBA)'?"));
  assert.equal(legacy.sourceText,raw.sourceText);assert.deepEqual(current.options,raw.options);
  assert.equal(current.answer,'A');assert.equal(questionContentRevision(raw.id),0);
  const saved={...raw,correctOption:'A',contentRevision:0},before=JSON.stringify(saved);
  const scored=scoreReviewedQuestions([saved],new Map([[raw.id,'A']]),{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
  assert.equal(scored.correctCount,1);assert.equal(scored.excludedCount,0);assert.equal(JSON.stringify(saved),before);
});

test('Greenhouse Gas Protocol punctuation repair leaves old snapshots scoreable and their transcript unchanged',async()=>{
  const {combinedQuestions,legacyQuestions}=await import('../lib/combined-question-bank.ts');
  const raw=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id==='cse-2016-gs-i-55');
  const current=combinedQuestions.find(q=>q.id===raw.id),legacy=legacyQuestions.find(q=>q.id===raw.id);
  assert.equal(current.sourceText,"What is 'Greenhouse Gas Protocol'?");assert.equal(legacy.sourceText,raw.sourceText);
  assert.deepEqual(current.options,raw.options);assert.equal(current.answer,'A');assert.equal(questionContentRevision(raw.id),0);
  const saved={...raw,correctOption:'A',contentRevision:0},before=JSON.stringify(saved);
  const scored=scoreReviewedQuestions([saved],new Map([[raw.id,'A']]),{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
  assert.equal(scored.correctCount,1);assert.equal(scored.excludedCount,0);assert.equal(JSON.stringify(saved),before);
});

test('legacy/cloud grading uses corrected keys but preserves material historical exclusions',()=>{
  const oldKey={id:'nda-2021-ii-54',subject:'Geography',correctOption:'C'};
  const malformed={id:'nda-2015-ii-77',subject:'Geography',correctOption:'A'};
  const held={id:'nda-2025-i-94',subject:'Geography',correctOption:'B'};
  const questions=[oldKey,malformed,held];
  const answers=new Map(questions.map(q=>[q.id,q.id===held.id?'B':'A']));
  const result=scoreReviewedQuestions(questions,answers,{marksPerQuestion:4,negativeMarksPerQuestion:4/3});
  assert.equal(result.correctCount,1);
  assert.equal(result.incorrectCount,0);
  assert.equal(result.excludedCount,2);
  assert.equal(result.scoredCount,1);
  assert.equal(result.unattemptedCount,0);
  assert.equal(result.maxScore,4);
  assert.equal(result.accuracy,100);
  assert.equal(result.breakdown.Geography.total,1);
  assert.equal(result.breakdown.Geography.excluded,2);
  assert.equal(questions[0].correctOption,'C','never rewrite saved snapshot');
  assert.equal(reviewedAnswer({...malformed,contentRevision:questionContentRevision(malformed.id)}).correctOption,'A');
});

test('newly reviewed duplicate source aliases preserve saved answers and exclude only the alias',()=>{
  const alias={id:'nda-2016-i-138',subject:'Geography',correctOption:'A',contentRevision:0};
  const canonical={id:'cds-2016-2016-1-138',subject:'Geography',correctOption:'A',contentRevision:1};
  const answers=new Map([[alias.id,'A'],[canonical.id,'A']]);
  const before=JSON.stringify([alias,canonical]);
  const result=scoreReviewedQuestions([alias,canonical],answers,{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
  assert.equal(result.scoredCount,1);
  assert.equal(result.excludedCount,1);
  assert.equal(result.correctCount,1);
  assert.equal(result.maxScore,2);
  assert.equal(result.accuracy,100);
  assert.equal(JSON.stringify([alias,canonical]),before);
  assert.deepEqual([...answers],[[alias.id,'A'],[canonical.id,'A']]);
});

test('an entirely excluded cloud attempt has no denominator or weak-area penalty',()=>{
  const q={id:'cse-2024-gs-i-20',subject:'Environment',correctOption:'A'};
  const result=scoreReviewedQuestions([q],new Map([[q.id,'D']]),{marksPerQuestion:2,negativeMarksPerQuestion:2/3});
  assert.equal(result.maxScore,0);
  assert.equal(result.score,0);
  assert.equal(result.accuracy,0);
  assert.equal(result.unattemptedCount,0);
  assert.deepEqual(result.weakAreas,[]);
  assert.equal(reviewedAnswer(q).correctOption,null);
});

test('historical source attribution is corrected by a notice, not by rewriting the snapshot',()=>{
  const saved={id:'cds-2015-2-112',exam:'CDS',year:2015,paper:'2',questionNumber:112};
  assert.match(questionCorrectionNotice(saved),/CDS 2015 · 1 · Q112/);
  assert.equal(saved.paper,'2');
  assert.equal(questionCorrectionNotice({...saved,paper:'1'}),null);
});
