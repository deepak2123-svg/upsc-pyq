import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const bank = JSON.parse(readFileSync(path.join(root, "content", "question-bank.json"), "utf8"));
const audit = JSON.parse(readFileSync(path.join(root, "content", "taxonomy", "geography-figure-audit-v1.json"), "utf8"));

test("the Geography figure audit covers the entire current inventory with no unresolved records", () => {
  const geography = bank.questions.filter((question) => question.subject === "Geography");
  assert.equal(audit.entries.length, geography.length);
  assert.equal(new Set(audit.entries.map((entry) => entry.questionId)).size, geography.length);
  assert.equal(audit.totals.audited, geography.length);
  assert.equal(audit.totals.unresolved, 0);
  assert.deepEqual(audit.entries.filter((entry) => /missing|manual-review/.test(entry.status)), []);
});

test("every figure-dependent Geography question has provenance and a substantive local asset", () => {
  const figureQuestions = bank.questions.filter((question) => question.subject === "Geography" && question.requiresFigure);
  assert.equal(figureQuestions.length, audit.totals.figureDependent);
  for (const question of figureQuestions) {
    assert.match(question.figureKey, /^\/question-figures\/.+\.png$/);
    assert.ok(question.figureAlt?.length > 20);
    assert.match(question.source?.figureSource ?? "", /Original .+ Question \d+/);
    assert.match(question.source?.figureExtraction ?? "", /Lossless crop/);
    const asset = path.join(root, "public", question.figureKey.replace(/^\//, ""));
    assert.equal(existsSync(asset), true, `${question.id} is missing ${asset}`);
    assert.ok(statSync(asset).size > 1000, `${question.id} asset is unexpectedly small`);
  }
});
