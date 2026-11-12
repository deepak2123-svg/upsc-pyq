import assert from 'node:assert/strict';
import test from 'node:test';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {normalizeMathDelimiters} from '../lib/math-text-normalizer.ts';

const outsideMath=value=>value.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g,'');

test('shared MCQ renderer repairs raw TeX scripts for every question surface',()=>{
  assert.equal(normalizeMathDelimiters('Let (x+y)^{p+q} = x^{p} y^{q}.'),'Let \\((x+y)^{p+q}\\) = \\(x^{p}\\) \\(y^{q}\\).');
  assert.equal(normalizeMathDelimiters('Use (1011)_{2}, |M|^{2}, and {f(π)}^{2}.'),'Use \\((1011)_{2}\\), \\(|M|^{2}\\), and \\({f(π)}^{2}\\).');
  assert.equal(normalizeMathDelimiters('Already \\((x+y)^{n}\\).'),'Already \\((x+y)^{n}\\).');
  for(const question of combinedQuestions){
    const values=[...question.promptLines,...Object.values(question.options),question.explanation].filter(value=>typeof value==='string');
    for(const value of values)assert.doesNotMatch(outsideMath(normalizeMathDelimiters(value)),/[\^_]\{/,question.id);
  }
});
