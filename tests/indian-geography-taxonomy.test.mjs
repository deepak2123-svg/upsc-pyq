import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [registry, migration, bank] = await Promise.all([
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/indian-geography-v1.3-migration-draft.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/question-bank.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("Indian Geography draft has a complete ordered and unique registry", () => {
  assert.equal(registry.status, "migration-review-required");
  assert.equal(registry.chapters.length, 14);
  assert.equal(registry.chapters.flatMap((chapter) => chapter.subtopics).length, 118);
  assert.deepEqual(registry.chapters.map((chapter) => chapter.order), Array.from({ length: 14 }, (_, index) => index + 1));
  const labels = [];
  for (const chapter of registry.chapters) {
    assert.deepEqual(chapter.subtopics.map((subtopic) => subtopic.order), Array.from({ length: chapter.subtopics.length }, (_, index) => index + 1));
    labels.push(...chapter.subtopics.map((subtopic) => `${chapter.name}/${subtopic.name}`));
  }
  assert.equal(new Set(labels).size, labels.length);
});

test("Indian Geography migration draft covers every current question without claiming review", () => {
  assert.equal(migration.status, "draft-only-do-not-publish");
  assert.equal(migration.recordCount, 402);
  assert.equal(migration.records.length, 402);
  assert.equal(new Set(migration.records.map((record) => record.questionId)).size, 402);
  assert.deepEqual(migration.examCounts, { CSE: 110, CAPF: 59, CDS: 61, NDA: 172 });
  assert.ok(migration.records.every((record) => record.reviewStatus === "needs-review"));
  assert.ok(migration.records.every((record) => record.sourcePdfStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => record.verbatimStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => record.answerKeyStatus === "not-yet-verified"));
  assert.ok(migration.records.every((record) => bank.questions.some((question) => question.id === record.questionId)));
});
