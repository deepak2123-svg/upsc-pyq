import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedAnswerOptions,feedbackAnswerLabel,feedbackAcceptsOption} from '../lib/answer-options.ts';
import {scoreReviewedQuestions} from '../lib/reviewed-grading.ts';
import {hasCompleteFeedback} from '../lib/practice-session.ts';
const options={A:'one',B:'ten',C:'hundred',D:'three hundred'};
test('malformed cached accepted-answer sets are rejected',()=>{
 const question={id:'unit-multiple-answer',subject:'Physics',correctOption:'A',acceptedOptions:['A','B'],options};
 const attempt={snapshot:{questions:[question]},answers:{[question.id]:'B'},feedback:{[question.id]:{correct:true,correctAnswer:'A',correctAnswers:['A','B']}}};
 assert.equal(hasCompleteFeedback(attempt),true);
 for(const invalid of [[],['A'],['A','A'],['B','C'],['A','E']]){
  attempt.feedback[question.id].correctAnswers=invalid;
  assert.equal(hasCompleteFeedback(attempt),false);
 }
});
test('official multiple-answer sets accept every permitted choice and reject all others',()=>{
 const accepted=acceptedAnswerOptions({answer:'A',acceptedAnswers:['A','B'],options});
 assert.deepEqual(accepted,['A','B']);
 const feedback={correctAnswer:'A',correctAnswers:accepted};
 assert.equal(feedbackAnswerLabel(feedback),'A / B');
 for(const key of Object.keys(options))assert.equal(feedbackAcceptsOption(feedback,key),key==='A'||key==='B');
 assert.equal(feedbackAcceptsOption(feedback,undefined),false);
 assert.deepEqual(acceptedAnswerOptions({answer:'C',options}),['C']);
 assert.throws(()=>acceptedAnswerOptions({answer:'A',acceptedAnswers:['B'],options}));
 assert.throws(()=>acceptedAnswerOptions({answer:'A',acceptedAnswers:['A','E'],options}));
 assert.throws(()=>acceptedAnswerOptions({answer:'A',acceptedAnswers:['A','A'],options}));
});
test('legacy/cloud scoring supports multiple answers without changing selected answers',()=>{
 const questions=[{id:'unit-multiple-answer',subject:'Physics',correctOption:'A',acceptedOptions:['A','B']}];
 for(const answer of ['A','B','C','D']){
  const choice=new Map([['unit-multiple-answer',answer]]);
  const result=scoreReviewedQuestions(questions,choice,{marksPerQuestion:4,negativeMarksPerQuestion:4/3});
  assert.equal(result.correctCount,['A','B'].includes(answer)?1:0);assert.equal(choice.get('unit-multiple-answer'),answer);
 }
});
