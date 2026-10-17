import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function workerFetch(pathname, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + Date.now() + "-" + Math.random());
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost" + pathname, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function inventory() {
  const response = await workerFetch("/api/pyqs/inventory");
  assert.equal(response.status, 200);
  return response.json();
}

async function create(recipe) {
  const response = await workerFetch("/api/practice-snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(recipe),
  });
  return { response, body: await response.json() };
}

const geo = "subject:geography";
const physical = "head:geography:physical-geography";
const other = "head:geography:other-geography";
const firstPhysicalChapter = "topic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth";
const otherGeomorphology = "topic:geography:other-geography:geomorphology-earth-structure";
const planets = "subtopic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth:planets";
const oldEarthInterior = "subtopic:geography:physical-geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
const seismology = "subtopic:geography:other-geography:geomorphology-earth-structure:earthquakes-seismology";
const allExams = ["CSE", "CAPF", "CDS", "NDA"];

function recipeFor(paths, overrides = {}) {
  return { version: 3, subjectIds: [geo], paths, count: "all", order: "newest", ...overrides };
}

function pathsFor(nodes) {
  return nodes.map((node) => ({ subtopicId: node.id, exams: allExams.filter((exam) => node.examCounts[exam] > 0) }));
}

test("ancestry-scoped inventory conserves every parent and examination count", async () => {
  const data = await inventory();
  assert.equal(data.version, 3);
  assert.equal(data.totalCount, 1519);
  assert.equal(data.mappedCount, 1210);
  assert.equal(data.unmappedCount, 309);
  assert.equal(new Set(data.nodes.map((node) => node.id)).size, data.nodes.length);
  const byId = new Map([...data.subjects, ...data.nodes].map((node) => [node.id, node]));
  assert.equal(byId.get(geo).questionCount, 1021);
  assert.equal(byId.get(physical).questionCount, 363);
  assert.equal(byId.get(other).questionCount, 23);
  assert.equal(byId.get(firstPhysicalChapter).questionCount, 28);
  assert.equal(byId.get(otherGeomorphology).questionCount, 7);
  assert.equal(byId.get(planets).questionCount, 10);
  assert.equal(data.legacyQuestionSets[oldEarthInterior].length, 41);
  assert.ok(data.legacyAliases[oldEarthInterior].length > 1);

  for (const parent of [...data.subjects, ...data.nodes.filter((node) => node.kind !== "subtopic")]) {
    const children = data.nodes.filter((node) => node.parentId === parent.id);
    assert.equal(children.reduce((sum, child) => sum + child.questionCount, 0), parent.questionCount, parent.id);
    for (const exam of allExams) {
      assert.equal(children.reduce((sum, child) => sum + child.examCounts[exam], 0), parent.examCounts[exam], parent.id + " " + exam);
    }
  }
  for (const link of data.links) {
    const target = byId.get(link.target);
    assert.ok(target);
    assert.equal(target.parentId, link.source);
    assert.equal(link.questionCount, target.questionCount);
    assert.deepEqual(link.examCounts, target.examCounts);
  }
});

test("V3 topic and leaf snapshots match exact scoped inventories", async () => {
  const data = await inventory();
  for (const [topicId, expected] of [[firstPhysicalChapter, 28], [otherGeomorphology, 7]]) {
    const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && node.parentId === topicId));
    const { response, body } = await create(recipeFor(paths));
    assert.equal(response.status, 201);
    assert.equal(body.recipe.version, 3);
    assert.equal(body.matchingCount, expected);
    assert.equal(body.questions.length, expected);
    assert.equal(new Set(body.questions.map((question) => question.id)).size, expected);
  }
  const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }]));
  assert.equal(response.status, 201);
  assert.equal(body.matchingCount, 10);
  assert.equal(body.questions.length, 10);
  assert.ok(body.questions.every((question) => question.subtopic === "Planets"));
  assert.ok(body.questions.every((question) => !("answer" in question) && !("explanation" in question)));
  assert.ok(body.questions.every((question) => /^[a-f0-9]{64}$/.test(question.sourceTextHash)));
});

test("matchingCount remains the full pool when sampling or narrowing exam sources", async () => {
  const sampled = await create(recipeFor(pathsFor((await inventory()).nodes.filter((node) => node.parentId === firstPhysicalChapter)), { count: 20 }));
  assert.equal(sampled.response.status, 201);
  assert.equal(sampled.body.matchingCount, 28);
  assert.equal(sampled.body.questions.length, 20);
  const cse = await create(recipeFor([{ subtopicId: planets, exams: ["CSE"] }]));
  assert.equal(cse.response.status, 201);
  assert.equal(cse.body.matchingCount, 2);
  assert.equal(cse.body.questions.length, 2);
  assert.ok(cse.body.questions.every((question) => question.exam === "CSE"));
  const unavailableCount = await create(recipeFor([{ subtopicId: planets, exams: ["CSE"] }], { count: 10 }));
  assert.equal(unavailableCount.response.status, 409);
  assert.equal(unavailableCount.body.available, 2);
});

test("mixed subjects and duplicate paths use a unique union of question records", async () => {
  const data = await inventory();
  const selectedSubjects = [geo, "subject:environment"];
  const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && selectedSubjects.includes(node.subjectId)));
  paths.push({ subtopicId: planets, exams: ["CSE", "CSE"] });
  const { response, body } = await create(recipeFor(paths, { subjectIds: [geo, geo, "subject:environment"] }));
  assert.equal(response.status, 201);
  assert.equal(body.matchingCount, 1193);
  assert.equal(body.questions.length, 1193);
  assert.equal(new Set(body.questions.map((question) => question.id)).size, 1193);
  assert.deepEqual(body.recipe.subjectIds, selectedSubjects);
});

test("questions that depend on an original figure carry that asset into snapshots", async () => {
  const data = await inventory();
  const capfGeography = data.nodes
    .filter((node) => node.kind === "subtopic" && node.subjectId === geo && node.examCounts.CAPF > 0)
    .map((node) => ({ subtopicId: node.id, exams: ["CAPF"] }));
  const { response, body } = await create(recipeFor(capfGeography));
  assert.equal(response.status, 201);
  const question = body.questions.find((item) => item.id === "capf-2019-i-120");
  assert.ok(question, "CAPF 2019 Q120 should remain in the Geography snapshot");
  assert.deepEqual(question.figure, {
    src: "/question-figures/capf-2019-i-q120-map.png",
    alt: "Original CAPF 2019 map of Sikkim with four numbered border locations",
  });
  const figure = await readFile(new URL("../public/question-figures/capf-2019-i-q120-map.png", import.meta.url));
  assert.ok(figure.length > 10_000, "the original map crop should be a substantive image asset");
});

test("retired V3 Physical Geography leaves preserve their exact historical question sets", async () => {
  const old = await create(recipeFor([{ subtopicId: oldEarthInterior, exams: allExams }]));
  assert.equal(old.response.status, 201);
  assert.equal(old.body.recipe.version, 3);
  assert.equal(old.body.matchingCount, 41);
  const data = await inventory();
  assert.deepEqual(new Set(old.body.questions.map((question) => question.id)), new Set(data.legacyQuestionSets[oldEarthInterior]));
  assert.deepEqual(old.body.recipe.paths, [{ subtopicId: oldEarthInterior, exams: allExams }]);
});

test("V3 rejects malformed counts rather than coercing or clamping them", async () => {
  for (const count of [0, -1, 101, 20.5, "20", null, {}, [], true]) {
    const { response } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count }));
    assert.equal(response.status, 400, JSON.stringify(count));
  }
});

test("V3 rejects invalid subjects, leaf IDs and sources without fallback", async () => {
  const basePaths = [{ subtopicId: planets, exams: allExams }];
  const invalidRecipes = [
    recipeFor(basePaths, { subjectIds: [] }),
    recipeFor(basePaths, { subjectIds: [geo, "subject:unknown"] }),
    recipeFor(basePaths, { subjectIds: ["subject:environment"] }),
    recipeFor(basePaths, { subjectIds: [3] }),
    recipeFor([]),
    recipeFor([null]),
    recipeFor([{ subtopicId: firstPhysicalChapter, exams: allExams }]),
    recipeFor([{ subtopicId: "unknown", exams: allExams }]),
    recipeFor([{ subtopicId: planets, exams: [] }]),
    recipeFor([{ subtopicId: planets, exams: [null] }]),
    recipeFor([{ subtopicId: planets, exams: [7] }]),
    recipeFor([{ subtopicId: planets, exams: ["cse"] }]),
    recipeFor([{ subtopicId: planets, exams: ["JEE"] }]),
    recipeFor([{ subtopicId: seismology, exams: ["CSE"] }]),
    recipeFor(basePaths, { order: "invalid" }),
    recipeFor(basePaths, { version: 4 }),
  ];
  for (const value of invalidRecipes) {
    const { response } = await create(value);
    assert.equal(response.status, 400, JSON.stringify(value));
  }
});

test("malformed payloads and older non-string exam values do not throw", async () => {
  for (const value of [null, [], "invalid", 42, { version: 2, subjectIds: [geo], paths: [{ subtopicId: oldEarthInterior, exams: [null, 3] }], count: "all", order: "newest" }, { exam: 3 }]) {
    const { response } = await create(value);
    assert.equal(response.status, 400, JSON.stringify(value));
  }
});

test("V3 preserves optional duration without changing the selected question pool", async () => {
  for (const durationMinutes of [null, 1, 60, 720]) {
    const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3, durationMinutes }));
    assert.equal(response.status, 201);
    assert.equal(body.recipe.durationMinutes, durationMinutes);
    assert.equal(body.matchingCount, 10);
    assert.equal(body.questions.length, 3);
    assert.ok(body.questions.every((question) => !Object.hasOwn(question, "answer") && !Object.hasOwn(question, "explanation")));
  }
  const untimed = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3 }));
  assert.equal(untimed.response.status, 201);
  assert.equal(untimed.body.recipe.durationMinutes ?? null, null);
});

test("V3 rejects malformed durations with an actionable error", async () => {
  for (const durationMinutes of [0, -1, 721, 1.5, "20", false, {}, []]) {
    const { response, body } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { durationMinutes }));
    assert.equal(response.status, 400, JSON.stringify(durationMinutes));
    assert.match(body.error, /duration|minute|time/i);
  }
});

async function grade(payload) {
  const response = await workerFetch("/api/practice/grade", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() };
}

test("final grading returns a complete answer sheet while keeping skipped questions separate", async () => {
  const bank = JSON.parse(await readFile(new URL("../content/question-bank.json", import.meta.url), "utf8"));
  const { body: snapshot } = await create(recipeFor([{ subtopicId: planets, exams: allExams }], { count: 3 }));
  const records = snapshot.questions.map((question) => bank.questions.find((candidate) => candidate.id === question.id));
  const wrong = Object.keys(records[1].options).find((option) => option !== records[1].answer);
  const { response, body } = await grade({
    questionIds: records.map((question) => question.id),
    answers: { [records[0].id]: records[0].answer, [records[1].id]: wrong },
  });
  assert.equal(response.status, 200);
  assert.equal(body.total, 3);
  assert.equal(body.correct, 1);
  assert.equal(body.incorrect, 1);
  assert.equal(body.unattempted, 1);
  assert.deepEqual(Object.keys(body.feedback).sort(), records.map((question) => question.id).sort());
  for (const record of records) {
    assert.equal(body.feedback[record.id].correctAnswer, record.answer);
    assert.equal(typeof body.feedback[record.id].correct, "boolean");
    assert.notEqual(body.feedback[record.id].explanation, "Explanation pending editorial review.");
  }
  assert.equal(body.feedback[records[0].id].correct, true);
  assert.equal(body.feedback[records[1].id].correct, false);
  assert.equal(body.feedback[records[2].id].correct, false);
});

test("final grading rejects malformed or ambiguous question and answer sets", async () => {
  const id = "cse-2013-gs-i-14";
  const invalid = [
    null, [], "bad", {},
    { questionIds: [], answers: {} },
    { questionIds: [id, id], answers: {} },
    { questionIds: [id, "unknown"], answers: {} },
    { questionIds: [3], answers: {} },
    { questionIds: [id], answers: [] },
    { questionIds: [id], answers: null },
    { questionIds: [id], answers: { [id]: "Z" } },
    { questionIds: [id], answers: { [id]: null } },
    { questionIds: [id], answers: { [id]: 1 } },
    { questionIds: [id], answers: { "unknown": "A" } },
  ];
  for (const payload of invalid) {
    const { response, body } = await grade(payload);
    assert.equal(response.status, 400, JSON.stringify(payload));
    assert.equal(typeof body.error, "string");
    assert.ok(body.error.length);
  }
});
