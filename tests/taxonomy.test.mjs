import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [bank, taxonomy, previousTaxonomy, review] = await Promise.all([
  readFile(new URL("../content/question-bank.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/upsc-geography-v1.2.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/upsc-geography-v1.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../content/taxonomy/physical-geography-v1.2-review.json", import.meta.url), "utf8").then(JSON.parse),
]);

const physical = taxonomy.meta_heads.find((head) => head.name === "Physical Geography");
const chapterNames = [
  "Universe, Solar System, Shape and Size of Earth",
  "Latitudes, Longitudes, Time and Motions of the Earth",
  "Interior of the Earth",
  "Rocks and Minerals",
  "Plate Tectonics, Earthquakes, Volcanoes and Mountain Building",
  "Geomorphic Processes and Landforms",
  "The Atmosphere, Insolation, Heat Budget and Temperature",
  "Atmospheric Pressure, Winds and Circulation",
  "Condensation, Clouds, Precipitation, Air Masses, Fronts and Cyclones",
  "World Climate Regions and the Köppen Classification",
  "Oceanography",
];

test("Physical Geography registry contains the ordered PDF chapters and 92 unnumbered subparts", () => {
  assert.equal(taxonomy.version, "upsc-geography-v1.2");
  assert.deepEqual(physical.chapters.map((chapter) => chapter.name), chapterNames);
  assert.deepEqual(physical.chapters.map((chapter) => chapter.order), Array.from({ length: 11 }, (_, index) => index + 1));
  assert.equal(physical.chapters.flatMap((chapter) => chapter.subtopics).length, 92);
  for (const chapter of physical.chapters) {
    assert.deepEqual(chapter.subtopics.map((subtopic) => subtopic.order), Array.from({ length: chapter.subtopics.length }, (_, index) => index + 1));
    assert.doesNotMatch(chapter.name, /^\s*(?:chapter\s*)?\d+/i);
    for (const subtopic of chapter.subtopics) assert.doesNotMatch(subtopic.name, /^\s*\d+[A-Za-z.]*/);
  }
});
test("all 363 historical Physical Geography questions have one reviewed primary home", () => {
  assert.equal(review.records.length, 363);
  assert.equal(new Set(review.records.map((record) => record.questionId)).size, 363);
  assert.ok(review.records.every((record) => record.reviewStatus !== "needs-review"));
  const knownIds = new Set(physical.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) => {
    const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `physical-geography/${slug(chapter.name)}/${slug(subtopic.name)}`;
  })));
  assert.ok(review.records.every((record) => knownIds.has(record.newTaxonomyId)));
  assert.ok(review.records.every((record) => bank.questions.some((question) => question.id === record.questionId)));
  const byExam = Object.fromEntries(["CSE", "CAPF", "CDS", "NDA"].map((exam) => [exam, review.records.filter((record) => bank.questions.find((question) => question.id === record.questionId)?.exam === exam).length]));
  assert.deepEqual(byExam, { CSE: 50, CAPF: 70, CDS: 55, NDA: 188 });
});
test("chapters 12-14 are excluded from the Physical Geography migration", () => {
  const labels = JSON.stringify(physical);
  assert.doesNotMatch(labels, /Natural Vegetation|Agriculture|India.*Climate/i);
  assert.equal(new Set(review.records.map((record) => record.newTaxonomyId.split("/")[1])).size, 11);
});
test("every non-Physical Geography hierarchy is structurally unchanged", () => {
  for (const previousHead of previousTaxonomy.meta_heads.filter((head) => head.name !== "Physical Geography")) {
    const currentHead = taxonomy.meta_heads.find((head) => head.name === previousHead.name);
    assert.ok(currentHead);
    assert.deepEqual(
      currentHead.chapters.map((chapter) => [chapter.name, chapter.subtopics.map((subtopic) => typeof subtopic === "string" ? subtopic : subtopic.name)]),
      Object.entries(previousHead.chapters),
      previousHead.name,
    );
  }
});
