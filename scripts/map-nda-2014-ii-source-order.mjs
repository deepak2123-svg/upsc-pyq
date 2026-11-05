import fs from 'node:fs';

const secondary = JSON.parse(fs.readFileSync('tmp/pdfs/nda-2014-ii/secondary.json', 'utf8')).questions;
const cropCandidates = JSON.parse(fs.readFileSync('tmp/pdfs/nda-2014-ii/question-crops.json', 'utf8'));
const englishPages = [...Array.from({ length: 11 }, (_, index) => index + 2), ...Array.from({ length: 18 }, (_, index) => 14 + index * 2)];
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (value) => new Set(normalize(value).split(' ').filter((word) => word.length > 2));
const score = (left, right) => {
  const a = tokens(left);
  const b = tokens(right);
  const overlap = [...a].filter((word) => b.has(word)).length;
  return overlap / Math.max(1, a.size);
};

const candidates = [];
for (const page of englishPages) {
  const path = `tmp/pdfs/nda-2014-ii/page-${String(page).padStart(2, '0')}-p3.txt`;
  const content = fs.readFileSync(path, 'utf8');
  const starts = page <= 12
    ? [...content.matchAll(/(?:^|\n)\s*[•»*]?\s*(\d{1,2})\s*[\.,]/g)].filter((match) => Number(match[1]) >= 1 && Number(match[1]) <= 50)
    : [...content.matchAll(/\b(5[1-9]|[6-9]\d|1[0-4]\d|150)\s*[\.,]/g)];
  for (let index = 0; index < starts.length; index += 1) {
    candidates.push({
      number: Number(starts[index][1]),
      page,
      text: content.slice(starts[index].index, starts[index + 1]?.index ?? content.length),
    });
  }
}

const canonical = new Map(secondary.flatMap((question) => {
  const number = question.qid.match(/^nd-g142-(\d+)$/)?.[1];
  return number ? [[question.qid, Number(number)]] : [];
}));
const manual = new Map(Object.entries({
  '1ku2csy8a': 51,
  '1kt7d3w08': 52,
  '1ktwuqd1h': 53,
  '1ktwvbrhz': 54,
  '1ktwvfq9o': 55,
  '1kszq4iio': 56,
  '1kszq7fmv': 57,
  '1ku2cxsp4': 58,
  '1ku6u76vz': 59,
  '1kt4eo34o': 60,
  '1kszqjgjl': 114,
  '1kszqv1io': 117,
  '1ku7tv3tg': 124,
  '1ku7txzmz': 125,
  '1ku7u56cp': 128,
  '1ku7uewxl': 129,
  '1ku7ujskk': 130,
  '1ku55ap25': 141,
}));
const mapping = secondary.map((question) => ({ ...question, sourceNumber: null, mappingScore: 0, mappingPage: null, ocrMatch: '' }));
const assignedNumbers = new Set();
const assignedQuestions = new Set();
for (const row of mapping.filter((question) => question.subjectName === 'English')) {
  const display = row.displayNumber;
  row.sourceNumber = display <= 10 ? display + 40 : display <= 20 ? display + 20 : display <= 30 ? display - 10 : display <= 40 ? display - 10 : display - 40;
  row.mappingScore = 1;
  assignedNumbers.add(row.sourceNumber);
  assignedQuestions.add(row.qid);
}
for (const [qid, number] of canonical) {
  const row = mapping.find((question) => question.qid === qid);
  row.sourceNumber = number;
  row.mappingScore = 1;
  assignedNumbers.add(number);
  assignedQuestions.add(qid);
}
for (const [qid, number] of manual) {
  const row = mapping.find((question) => question.qid === qid);
  row.sourceNumber = number;
  row.mappingScore = 1;
  assignedNumbers.add(number);
  assignedQuestions.add(qid);
}
const pairs = mapping.filter((question) => question.subjectName !== 'English' && !assignedQuestions.has(question.qid)).flatMap((question) => cropCandidates
  .filter((candidate) => candidate.number >= 51 && !assignedNumbers.has(candidate.number))
  .map((candidate) => ({ question, candidate, score: score(question.promptLines.join(' '), candidate.text) })))
  .sort((a, b) => b.score - a.score);
for (const pair of pairs) {
  if (pair.score < 0.12 || assignedQuestions.has(pair.question.qid) || assignedNumbers.has(pair.candidate.number)) continue;
  Object.assign(pair.question, { sourceNumber: pair.candidate.number, mappingScore: pair.score, mappingPage: pair.candidate.page, ocrMatch: pair.candidate.text });
  assignedQuestions.add(pair.question.qid);
  assignedNumbers.add(pair.candidate.number);
}

mapping.sort((a, b) => (a.sourceNumber ?? 999) - (b.sourceNumber ?? 999));
fs.writeFileSync('tmp/pdfs/nda-2014-ii/source-mapping.json', `${JSON.stringify(mapping, null, 2)}\n`);
const duplicateNumbers = [...new Set(mapping.filter((row) => row.sourceNumber && mapping.filter((other) => other.sourceNumber === row.sourceNumber).length > 1).map((row) => row.sourceNumber))];
console.log(JSON.stringify({ candidates: candidates.length, mapped: mapping.filter((row) => row.sourceNumber).length, missing: mapping.filter((row) => !row.sourceNumber).map((row) => ({ qid: row.qid, prompt: row.promptLines[0], score: row.mappingScore })), duplicateNumbers }, null, 2));
