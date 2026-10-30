import assert from "node:assert/strict";
import test from "node:test";
import { formatPracticePrompt, formatPracticeText } from "../lib/practice-prompt.ts";
import fs from 'node:fs';

test('NDA II 2026 preserves chemical tables and Roman-to-letter matching lists',()=>{
  const questions=JSON.parse(fs.readFileSync('content/reviewed-prelims-imports.json')).questions;
  for(const number of [84,90]) {
    const q=questions.find(q=>q.id===`nda-2026-ii-${number}`),before=JSON.stringify(q);
    const table=formatPracticePrompt(q.promptLines).find(b=>b.kind==='pair-table');
    assert.ok(table);assert.equal(table.rows.length,4);
    assert.deepEqual(table.rows.map(r=>r.marker),['I.','II.','III.','IV.']);
    assert.equal(JSON.stringify(q),before);
  }
  const q=questions.find(q=>q.id==='nda-2026-ii-126');
  const blocks=formatPracticePrompt(q.promptLines),table=blocks.find(b=>b.kind==='match-table');
  assert.ok(table);assert.deepEqual(table.left.items.map(r=>r.label),['I','II','III','IV']);
  assert.deepEqual(table.right.items.map(r=>r.label),['A','B','C','D']);
  assert.equal(table.right.items[3].text,'1891');
  assert.equal(blocks.at(-1).text,'Select the answer using the code given below:');
});

test('explicit source pairs become two columns without losing long descriptions or instructions',()=>{
  const imports=JSON.parse(fs.readFileSync('content/reviewed-prelims-imports.json')).questions;
  for(const n of [85,89,97]) {
    const question=imports.find(q=>q.id===`cse-2014-gs-i-${n}`),before=JSON.stringify(question.promptLines);
    const blocks=formatPracticePrompt(question.promptLines),table=blocks.find(b=>b.kind==='pair-table');
    assert.ok(table);assert.equal(table.rows.length,3);
    assert.deepEqual(table.rows.map(r=>r.marker),['1.','2.','3.']);
    assert.equal(blocks.at(-1).text,'Which of the pairs given above is/are correctly matched?');
    assert.equal(JSON.stringify(question.promptLines),before);
    for(const row of table.rows)assert.ok(question.promptLines.some(line=>formatPracticeText(line).includes(`${row.left}: ${row.right}`)));
  }
  const sculpture=formatPracticePrompt(imports.find(q=>q.id==='cse-2014-gs-i-85').promptLines).find(b=>b.kind==='pair-table');
  assert.equal(sculpture.leftTitle,'Famous work of sculpture');assert.equal(sculpture.rightTitle,'Site');
  assert.ok(sculpture.rows[0].left.includes('sorrowful figures of his followers below'));
  assert.equal(sculpture.rows[1].right,'Mount Abu');
});

test('paired-row formatting refuses guessed headings, incomplete pairs and broken numbering',()=>{
  const cases=[
    ['Consider the following:','1. Claim: explanation','2. Claim: explanation'],
    ['Consider the following pairs:','Vitamin : Deficiency disease','1. C : Scurvy','3. D : Rickets'],
    ['Consider the following pairs:','Vitamin : Deficiency disease','1. C : Scurvy','2. D'],
    ['Consider the following pairs:','1. Garba : Gujarat','2. Mohiniattam : Odisha'],
  ];
  for(const lines of cases)assert.ok(!formatPracticePrompt(lines).some(b=>b.kind==='pair-table'));
});

test('source-reviewed pilgrimage heading restores its two columns without editing the legacy transcript',()=>{
  const q=JSON.parse(fs.readFileSync('content/question-bank.json')).questions.find(q=>q.id==='cse-2015-gs-i-15');
  const before=JSON.stringify(q),blocks=formatPracticePrompt(q.promptLines),table=blocks.find(b=>b.kind==='pair-table');
  assert.equal(table.leftTitle,'Place of Pilgrimage');assert.equal(table.rightTitle,'Location');
  assert.deepEqual(table.rows.map(r=>[r.left,r.right]),[['Srisailam','Nallamala Hills'],['Omkareshwar','Satmala Hills'],['Pushkar','Mahadeo Hills']]);
  assert.equal(blocks.at(-1).text,'Which of the above pairs is/are correctly matched?');
  assert.equal(JSON.stringify(q),before);
});

test("prints legacy coordinate notation as conventional paper symbols", () => {
  assert.equal(
    formatPracticeText(String.raw`\\(15^{\circ}48^{\prime}00^{\prime\prime}\\) N`),
    "15°48′00″ N",
  );
  assert.equal(formatPracticeText(String.raw`\\(180^{\circ}\\) angle`), "180° angle");
  assert.equal(formatPracticeText(String.raw`\\(\\vec r + \\hat i\\)`), 'r⃗ + î');
});

test("separates statements even when dates contain numbered punctuation", () => {
  const blocks = formatPracticePrompt([
    "Which statements are correct? 1. Vernal equinox occurs on March 21. 2. Summer solstice occurs on December 22. 3. Autumnal equinox occurs on September 23. 4. Winter solstice occurs on June 21. Select the correct answer using the code given below:",
  ]);
  assert.deepEqual(blocks.map((block) => block.kind), ["text", "statement", "statement", "statement", "statement", "text"]);
  assert.deepEqual(blocks.filter((block) => block.kind === "statement").map((block) => block.marker), ["1.", "2.", "3.", "4."]);
  assert.equal(blocks[1].text, "Vernal equinox occurs on March 21.");
});
