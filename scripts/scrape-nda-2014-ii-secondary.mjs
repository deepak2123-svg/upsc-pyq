import fs from 'node:fs';

const base = 'https://questions.examside.com';
const paperPath = '/past-years/year-wise/defence/nda/nda-general-ability-28-september-2014';
const source = fs.readFileSync('tmp/pdfs/nda-2014-ii/examside.html', 'utf8');

const decode = (value) => value
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&minus;/g, '−')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const text = (html) => decode(html
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
  .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n +/g, '\n')
  .trim());

const subjects = [];
for (const match of source.matchAll(/<section class="yp-group[^>]*id="subject-(\d+)"[^>]*><h2 class="section-title">([^<]+)[\s\S]*?<div class="preview-list">([\s\S]*?)<\/div>\s*<\/section>/g)) {
  const [, subjectIndex, subjectName, rows] = match;
  const links = [...rows.matchAll(/<a class="preview-row" href="([^"]+)"><span class="preview-index">(\d+)<\/span>/g)]
    .map(([, href, displayNumber]) => ({ href, displayNumber: Number(displayNumber) }));
  subjects.push({ subjectIndex: Number(subjectIndex), subjectName: subjectName.trim(), links });
}

if (subjects.length !== 3 || subjects.some((subject) => subject.links.length !== 50)) {
  throw new Error(`Expected 3 x 50 preview links, got ${subjects.map((subject) => `${subject.subjectName}:${subject.links.length}`).join(', ')}`);
}

const linkMeta = new Map(subjects.flatMap((subject) => subject.links.map((link) => [link.href, { ...link, subjectName: subject.subjectName }])));
const htmlByHref = new Map();
const links = [...linkMeta.keys()];
let cursor = 0;

async function worker() {
  while (cursor < links.length) {
    const href = links[cursor++];
    const response = await fetch(base + href, { headers: { 'user-agent': 'Mozilla/5.0', 'eg-app-id': 'questions-examside-com' } });
    if (!response.ok) throw new Error(`${response.status} ${href}`);
    htmlByHref.set(href, await response.text());
  }
}

await Promise.all(Array.from({ length: 8 }, worker));

const questions = new Map();
for (const [href, html] of htmlByHref) {
  const meta = linkMeta.get(href);
  const starts = [...html.matchAll(/<div class="question-component card" data-question data-qid="([^"]+)"/g)];
  for (let index = 0; index < starts.length; index += 1) {
    const qid = starts[index][1];
    const componentMeta = [...linkMeta.entries()].find(([link]) => link.endsWith(`/${qid}`))?.[1] ?? meta;
    const component = html.slice(starts[index].index, starts[index + 1]?.index ?? html.indexOf('<nav class="q-pager"', starts[index].index));
    const body = component.match(/<div class="q-body">([\s\S]*?)<div class="options">/)?.[1] ?? '';
    const optionBlock = component.match(/<div class="options">([\s\S]*?)<div class="when-unanswered/)?.[1] ?? '';
    const explanationBlock = component.match(/<div class="when-answered q-result">([\s\S]*?)(?:<nav class="q-pager"|$)/)?.[1] ?? '';
    const optionMatches = [...optionBlock.matchAll(/<span class="option-badge">([A-D])<\/span>\s*<div class="option-content question"><!-- HTML_TAG_START -->([\s\S]*?)<!-- HTML_TAG_END --><\/div>/g)];
    const explanation = text(explanationBlock.match(/<div class="question q-prose"><!-- HTML_TAG_START -->([\s\S]*?)<!-- HTML_TAG_END --><\/div>/)?.[1] ?? '');
    const answer = explanation.match(/(?:correct (?:option|answer)(?: is)?|answer is)\s*\(?([A-D])\)?/i)?.[1] ?? '';
    const questionBody = body.match(/<div class="question q-prose"><!-- HTML_TAG_START -->([\s\S]*?)<!-- HTML_TAG_END --><\/div>/)?.[1] ?? '';
    const record = {
      qid,
      subjectName: componentMeta.subjectName,
      displayNumber: componentMeta.displayNumber,
      href: base + paperPath + `/${qid}`,
      promptLines: text(questionBody).split('\n'),
      options: Object.fromEntries(optionMatches.map(([, letter, option]) => [letter, text(option)])),
      answer,
      explanation,
    };
    if (optionMatches.length === 4) questions.set(qid, record);
  }
}

const output = [...questions.values()].sort((a, b) => {
  const sa = subjects.findIndex((subject) => subject.subjectName === a.subjectName);
  const sb = subjects.findIndex((subject) => subject.subjectName === b.subjectName);
  return sa - sb || a.displayNumber - b.displayNumber;
});

let answerCursor = 0;
async function answerWorker() {
  while (answerCursor < output.length) {
    const question = output[answerCursor++];
    const response = await fetch(`${base}/api/check_answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0', 'eg-app-id': 'questions-examside-com' },
      body: JSON.stringify({ qid: question.qid, input: 0, options: [], timeSpent: 0 }),
    });
    const result = await response.json();
    if (result.status !== 'success' || result.err_code !== 0 || !Array.isArray(result.corrects) || result.corrects.length !== 1) {
      throw new Error(`Could not resolve answer for ${question.qid}`);
    }
    question.answer = 'ABCD'[result.corrects[0]];
  }
}
await Promise.all(Array.from({ length: 8 }, answerWorker));

fs.writeFileSync('tmp/pdfs/nda-2014-ii/secondary.json', `${JSON.stringify({ paperPath, subjects, questions: output }, null, 2)}\n`);
if (output.length !== 150 || output.some((question) => !question.answer)) {
  throw new Error(`Expected 150 answered questions, got ${output.length} records and ${output.filter((question) => question.answer).length} answers`);
}
console.log(`Captured ${output.length} complete secondary records.`);
