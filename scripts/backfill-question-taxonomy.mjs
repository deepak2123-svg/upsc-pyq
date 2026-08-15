import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const bank = JSON.parse(await fs.readFile(path.join(root, "content", "question-bank.json"), "utf8")).questions ?? [];
const map = JSON.parse(await fs.readFile(path.join(root, "content", "taxonomy", "question-map.json"), "utf8"));
const parts = await Promise.all(map.parts.map((part) => fs.readFile(path.join(root, "content", "taxonomy", part), "utf8").then(JSON.parse)));
const mapped = new Set(parts.flatMap((part) => Object.keys(part.pairs)));
const unmatched = bank.filter((question) => !mapped.has(question.id));
const report = {
  taxonomyVersion: map.version,
  totalQuestions: bank.length,
  mappedQuestions: bank.length - unmatched.length,
  unmatchedQuestions: unmatched.length,
  unmatchedIds: unmatched.map((question) => question.id),
  message: "Unmatched records intentionally remain available only when no subsection filter is selected.",
};
console.log(JSON.stringify(report, null, 2));

if (process.argv.includes("--write-report")) {
  const output = path.join(root, "content", "taxonomy", "backfill-report.json");
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${output}`);
}
