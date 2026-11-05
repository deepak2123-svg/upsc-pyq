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

test("restores spot-the-error fragments as one labelled sentence without changing source text", () => {
  const question=JSON.parse(fs.readFileSync('content/nda-2015-i-official-paper.json')).questions.find(q=>q.id==='nda-2015-i-3');
  const before=JSON.stringify(question.promptLines);
  const blocks=formatPracticePrompt(question.promptLines);
  assert.equal(blocks.length,1);
  assert.equal(blocks[0].kind,'error-line');
  assert.deepEqual(blocks[0].segments.map(segment=>segment.marker),['(a)','(b)','(c)']);
  assert.deepEqual(blocks[0].segments.map(segment=>segment.text),[
    'Since it was his first election campaign, the candidate was confused;',
    'none could clearly understand',
    'either the principles he stood for or the benefits he promised.',
  ]);
  assert.equal(JSON.stringify(question.promptLines),before);
});

test("restores flattened inline spot-the-error fragments for every completed source paper", () => {
  const files=fs.readdirSync('content').filter(file=>file.endsWith('-official-paper.json'));
  let checked=0;
  for(const file of files) {
    const paper=JSON.parse(fs.readFileSync(`content/${file}`));
    for(const question of paper.questions??[]) {
      const line=(question.promptLines??[]).join(' ');
      const markerOptions=Object.values(question.options??{}).filter(value=>/^\([abc]\)$/i.test(String(value).trim()));
      if(markerOptions.length!==3 || !/\(a\).*\(b\).*\(c\)/i.test(line))continue;
      const before=JSON.stringify(question);
      const blocks=formatPracticePrompt(question.promptLines);
      assert.equal(blocks.length,1,question.id);
      assert.equal(blocks[0].kind,'error-line',question.id);
      assert.deepEqual(blocks[0].segments.map(segment=>segment.marker),['(a)','(b)','(c)'],question.id);
      assert.ok(blocks[0].segments.every(segment=>segment.text&&!/\([a-d]\)/i.test(segment.text)),question.id);
      assert.equal(JSON.stringify(question),before,question.id);
      checked+=1;
    }
  }
  assert.ok(checked>=34,'the corpus gate must retain all currently completed inline error-spotting records');
});

test("inline error formatting is conservative and preserves ordinary option-like prose",()=>{
  assert.deepEqual(formatPracticePrompt(['Choose (a) Alpha (b) Beta (c) Gamma']),[
    {kind:'text',text:'Choose (a) Alpha (b) Beta (c) Gamma'},
  ]);
});

test('restores ordering-of-words fragments with paper-style P Q R S labels',()=>{
  const sequenceOptions={A:'PQRS',B:'QPRS',C:'RQPS',D:'SRQP'};
  const inline=formatPracticePrompt(['His uncle for success in life, (P) always advised his son, (Q) who was a self-made man (R) to depend on his own efforts (S) The proper sequence should be:'],{options:sequenceOptions});
  assert.equal(inline[0].kind,'word-order');
  assert.deepEqual(inline[0].segments.map(segment=>segment.marker),['P','Q','R','S']);
  assert.equal(inline[0].segments[0].text,'His uncle for success in life,');
  assert.equal(inline[1].text,'The proper sequence should be:');
  const labelled=formatPracticePrompt(['The following parts are jumbled. Select the proper sequence.','P : participate in the function','Q : many of the people who had come to','R : the auditorium was over-crowded','S : could not find a seat because'],{options:sequenceOptions});
  assert.equal(labelled[1].kind,'word-order');
  assert.deepEqual(labelled[1].segments.map(segment=>segment.text),['participate in the function','many of the people who had come to','the auditorium was over-crowded','could not find a seat because']);
});

test('completed NDA sentence-improvement items retain every source-reviewed underline',()=>{
  const files=['nda-2014-ii','nda-2015-i','nda-2015-ii','nda-2016-ii','nda-2017-i'];
  let checked=0;
  for(const id of files){
    const paper=JSON.parse(fs.readFileSync(`content/${id}-official-paper.json`));
    for(const question of paper.questions){
      if(!/^no improvement\.?$/i.test(String(question.options?.D??'').trim()))continue;
      assert.ok(question.underlined?.length,question.id);
      const prompt=question.promptLines.join(' ');
      for(const span of question.underlined)assert.ok(prompt.includes(span),`${question.id}: ${span}`);
      checked+=1;
    }
  }
  assert.equal(checked,58);
});

test('every completed error-spotting record reconstructs its printed labelled fragments',()=>{
  let checked=0;
  for(const file of fs.readdirSync('content').filter(file=>file.endsWith('-official-paper.json'))){
    const paper=JSON.parse(fs.readFileSync(`content/${file}`));
    for(const question of paper.questions??[]){
      const directions=question.promptLines.join(' ');
      const noError=/^no\s+error\.?$/i.test(String(question.options?.D??'').trim());
      const fourParts=/underlined parts? label|sentence (?:is )?given in (?:three|four) parts/i.test(directions);
      if(!noError&&!fourParts)continue;
      const block=formatPracticePrompt(question.promptLines,{options:question.options}).find(block=>block.kind==='error-line');
      assert.ok(block,question.id);
      assert.ok(block.segments.length===3||block.segments.length===4,question.id);
      assert.deepEqual(block.segments.map(segment=>segment.text),Object.values(question.options).slice(0,block.segments.length),question.id);
      checked+=1;
    }
  }
  assert.ok(checked>=166);
});

test('every completed ordering-of-words record reconstructs four paper strips',()=>{
  let checked=0;
  for(const file of fs.readdirSync('content').filter(file=>file.endsWith('-official-paper.json'))){
    const paper=JSON.parse(fs.readFileSync(`content/${file}`));
    for(const question of paper.questions??[]){
      const sequences=Object.values(question.options??{}).map(value=>String(value).replace(/[^PQRS]/g,''));
      const prompt=question.promptLines.join(' ');
      if(sequences.length!==4||!sequences.every(value=>value.length===4)||!/jumbled|proper sequence|rearrange/i.test(prompt)||/S1\s*:/i.test(prompt))continue;
      const block=formatPracticePrompt(question.promptLines,{options:question.options}).find(block=>block.kind==='word-order');
      assert.ok(block,question.id);
      assert.deepEqual(block.segments.map(segment=>segment.marker),['P','Q','R','S'],question.id);
      assert.ok(block.segments.every(segment=>segment.text),question.id);
      checked+=1;
    }
  }
  assert.ok(checked>=100);
});

test('whole-sentence ordering keeps S1 S6 and P Q R S as labelled statements, not underlined strips',()=>{
  let checked=0;
  for(const file of fs.readdirSync('content').filter(file=>file.endsWith('-official-paper.json'))){
    const paper=JSON.parse(fs.readFileSync(`content/${file}`));
    for(const question of paper.questions??[]){
      const prompt=question.promptLines.join(' ');
      if(!/S1\s*:/i.test(prompt)||!/S6\s*:/i.test(prompt))continue;
      const blocks=formatPracticePrompt(question.promptLines,{options:question.options});
      const markers=blocks.filter(block=>block.kind==='statement').map(block=>block.marker);
      for(const marker of ['S1','S6','P','Q','R','S'])assert.ok(markers.includes(marker),`${question.id}: ${marker}`);
      assert.ok(!blocks.some(block=>block.kind==='word-order'),question.id);
      checked+=1;
    }
  }
  assert.ok(checked>=18);
});

test('reviewed vocabulary and improvement underlines point to visible source text',()=>{
  let checked=0;
  for(const file of fs.readdirSync('content').filter(file=>file.endsWith('-official-paper.json'))){
    const paper=JSON.parse(fs.readFileSync(`content/${file}`));
    for(const question of paper.questions??[]){
      for(const span of question.underlined??[]){
        assert.ok(question.promptLines.some(line=>line.includes(span))||Object.values(question.options).includes(span),`${question.id}: ${span}`);
        checked+=1;
      }
    }
  }
  assert.ok(checked>=570);
});
