import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [bank, taxonomy, cdsAliases, ...questionMapParts] = await Promise.all([
  readFile(new URL("../content/question-bank.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/upsc-geography-v1.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/cds-geography-aliases.json", import.meta.url), "utf8").then(JSON.parse),
  ...Array.from({ length: 6 }, (_, index) => readFile(new URL(`../content/taxonomy/question-map-0${index + 1}.json`, import.meta.url), "utf8").then(JSON.parse)),
]);

const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const idFor = (head, chapter, subtopic) => `${slug(head)}/${slug(chapter)}/${slug(subtopic)}`;
const canonicalIds = new Set(taxonomy.meta_heads.flatMap((head) => Object.entries(head.chapters).flatMap(([chapter, subtopics]) => subtopics.map((subtopic) => idFor(head.name, chapter, subtopic)))));
const questionTaxonomy = new Map(questionMapParts.flatMap((part) => Object.entries(part.pairs)).map(([questionId, taxonomyIndex]) => [questionId, questionMapParts[0].ids[taxonomyIndex]]));

test("geography taxonomy keeps PDF heads and subjects separate", () => {
  assert.equal(taxonomy.version, "upsc-geography-v1.1");
  assert.equal(taxonomy.meta_heads.filter((head) => head.name !== "Environment & Ecology").length, 4);
  assert.equal(taxonomy.meta_heads.find((head) => head.name === "Environment & Ecology")?.name, "Environment & Ecology");
  assert.deepEqual(questionMapParts[0].ids.filter((id) => !canonicalIds.has(id)), []);
});

test("unrestricted and OR subsection filtering preserve unresolved records", () => {
  const unrestricted = bank.questions;
  const [first, second] = questionMapParts[0].ids;
  const narrowed = unrestricted.filter((question) => [first, second].includes(questionTaxonomy.get(question.id)));
  assert.equal(unrestricted.length, bank.total);
  assert.ok(narrowed.length > 0);
  assert.ok(narrowed.length < unrestricted.length);
  assert.ok(narrowed.every((question) => [first, second].includes(questionTaxonomy.get(question.id))));
  assert.equal(questionTaxonomy.has("capf-2017-i-1"), false);
  assert.ok(unrestricted.some((question) => question.id === "capf-2017-i-1"));
});

test("chapter selection expands to all canonical child subtopics", () => {
  const head = taxonomy.meta_heads[0];
  const [chapter, subtopics] = Object.entries(head.chapters)[0];
  const chapterIds = new Set(subtopics.map((subtopic) => idFor(head.name, chapter, subtopic)));
  const selected = bank.questions.filter((question) => chapterIds.has(questionTaxonomy.get(question.id)));
  assert.ok(selected.length > 0);
  assert.ok(selected.every((question) => chapterIds.has(questionTaxonomy.get(question.id))));
});

test("every legacy CDS Geography question resolves to a canonical subtopic", () => {
  const canonicalSubtopics = new Set(taxonomy.meta_heads.flatMap((head) => Object.values(head.chapters).flat()));
  const cdsQuestions = bank.questions.filter((question) => question.exam === "CDS" && question.subject === "Geography");
  assert.ok(cdsQuestions.length > 0);
  for (const question of cdsQuestions) {
    const canonical = cdsAliases.questions[question.id] || cdsAliases.subtopics[question.subtopic];
    assert.ok(canonical, `Missing CDS taxonomy alias for ${question.id}: ${question.subtopic}`);
    assert.ok(canonicalSubtopics.has(canonical), `Unknown canonical subtopic for ${question.id}: ${canonical}`);
  }
});
