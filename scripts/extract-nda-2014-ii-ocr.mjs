import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const tesseract = 'C:/Program Files/Tesseract-OCR/tesseract.exe';
const pages = Array.from({ length: 18 }, (_, index) => 14 + index * 2);
const records = [];

for (const page of pages) {
  const image = `tmp/pdfs/nda-2014-ii/page-${String(page).padStart(2, '0')}.png`;
  const metadata = await sharp(image).metadata();
  const tsv = spawnSync(tesseract, [image, 'stdout', '-l', 'eng', '--psm', '3', 'tsv'], { encoding: 'utf8' });
  if (tsv.status !== 0) throw new Error(tsv.stderr);
  const starts = tsv.stdout.split(/\r?\n/).slice(1).flatMap((line) => {
    const columns = line.split('\t');
    if (columns.length < 12 || columns[0] !== '5') return [];
    const match = columns[11].match(/^(5[1-9]|[6-9]\d|1[0-4]\d|150)[.,]$/);
    if (!match) return [];
    return [{ number: Number(match[1]), x: Number(columns[6]), y: Number(columns[7]), width: Number(columns[8]), height: Number(columns[9]) }];
  });
  for (const start of starts) {
    const column = start.x < metadata.width / 2 ? 0 : 1;
    const left = column === 0 ? 0 : Math.floor(metadata.width / 2);
    const next = starts.filter((candidate) => (candidate.x < metadata.width / 2 ? 0 : 1) === column && candidate.y > start.y).sort((a, b) => a.y - b.y)[0];
    const top = Math.max(0, start.y - 18);
    const bottom = Math.min(metadata.height, next ? next.y - 20 : metadata.height - 90);
    const buffer = await sharp(image).extract({ left, top, width: Math.floor(metadata.width / 2), height: Math.max(30, bottom - top) }).png().toBuffer();
    const ocr = spawnSync(tesseract, ['stdin', 'stdout', '-l', 'eng', '--psm', '6'], { input: buffer, encoding: 'utf8', maxBuffer: 10_000_000 });
    records.push({ number: start.number, page, column, x: start.x, y: start.y, text: ocr.stdout.trim() });
  }
}

fs.writeFileSync('tmp/pdfs/nda-2014-ii/question-crops.json', `${JSON.stringify(records, null, 2)}\n`);
console.log(`Extracted ${records.length} numbered crops covering ${new Set(records.map((record) => record.number)).size} source numbers.`);
