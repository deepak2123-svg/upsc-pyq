import assert from "node:assert/strict";
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
const physicalGeomorphology = "topic:geography:physical-geography:geomorphology-earth-structure";
const otherGeomorphology = "topic:geography:other-geography:geomorphology-earth-structure";
const earthInterior = "subtopic:geography:physical-geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
const oldEarthInterior = "subtopic:geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
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
  assert.equal(byId.get(physicalGeomorphology).questionCount, 140);
  assert.equal(byId.get(otherGeomorphology).questionCount, 7);
  assert.equal(byId.get(earthInterior).questionCount, 41);
  assert.deepEqual(data.legacyAliases[oldEarthInterior], [earthInterior]);

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
  for (const [topicId, expected] of [[physicalGeomorphology, 140], [otherGeomorphology, 7]]) {
    const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && node.parentId === topicId));
    const { response, body } = await create(recipeFor(paths));
    assert.equal(response.status, 201);
    assert.equal(body.recipe.version, 3);
    assert.equal(body.matchingCount, expected);
    assert.equal(body.questions.length, expected);
    assert.equal(new Set(body.questions.map((question) => question.id)).size, expected);
  }
  const { response, body } = await create(recipeFor([{ subtopicId: earthInterior, exams: allExams }]));
  assert.equal(response.status, 201);
  assert.equal(body.matchingCount, 41);
  assert.equal(body.questions.length, 41);
  assert.ok(body.questions.every((question) => question.subtopic === "Earth Interior, Rocks & Tectonics"));
  assert.ok(body.questions.every((question) => !("answer" in question) && !("explanation" in question)));
  assert.ok(body.questions.every((question) => /^[a-f0-9]{64}$/.test(question.sourceTextHash)));
});

test("matchingCount remains the full pool when sampling or narrowing exam sources", async () => {
  const sampled = await create(recipeFor([{ subtopicId: earthInterior, exams: allExams }], { count: 20 }));
  assert.equal(sampled.response.status, 201);
  assert.equal(sampled.body.matchingCount, 41);
  assert.equal(sampled.body.questions.length, 20);
  const cse = await create(recipeFor([{ subtopicId: earthInterior, exams: ["CSE"] }]));
  assert.equal(cse.response.status, 201);
  assert.equal(cse.body.matchingCount, 3);
  assert.equal(cse.body.questions.length, 3);
  assert.ok(cse.body.questions.every((question) => question.exam === "CSE"));
  const unavailableCount = await create(recipeFor([{ subtopicId: earthInterior, exams: ["CSE"] }], { count: 10 }));
  assert.equal(unavailableCount.response.status, 409);
  assert.equal(unavailableCount.body.available, 3);
});

test("mixed subjects and duplicate paths use a unique union of question records", async () => {
  const data = await inventory();
  const selectedSubjects = [geo, "subject:environment"];
  const paths = pathsFor(data.nodes.filter((node) => node.kind === "subtopic" && selectedSubjects.includes(node.subjectId)));
  paths.push({ subtopicId: earthInterior, exams: ["CSE", "CSE"] });
  const { response, body } = await create(recipeFor(paths, { subjectIds: [geo, geo, "subject:environment"] }));
  assert.equal(response.status, 201);
  assert.equal(body.matchingCount, 1193);
  assert.equal(body.questions.length, 1193);
  assert.equal(new Set(body.questions.map((question) => question.id)).size, 1193);
  assert.deepEqual(body.recipe.subjectIds, selectedSubjects);
});

test("old V2 and legacy recipe IDs still resolve to the same retake questions", async () => {
  const modern = await create(recipeFor([{ subtopicId: earthInterior, exams: allExams }]));
  const old = await create(recipeFor([
    { subtopicId: oldEarthInterior, exams: allExams },
    { subtopicId: earthInterior, exams: ["CSE"] },
  ], { version: 2 }));
  assert.equal(old.response.status, 201);
  assert.equal(old.body.recipe.version, 2);
  assert.equal(old.body.matchingCount, 41);
  assert.deepEqual(old.body.questions.map((question) => question.id), modern.body.questions.map((question) => question.id));
  assert.deepEqual(old.body.recipe.paths, [{ subtopicId: earthInterior, exams: allExams }]);
  assert.notEqual(old.body.id, modern.body.id);

  const legacy = await create({ exam: "CSE", yearFrom: 2013, yearTo: 2026, taxonomyIds: [oldEarthInterior, earthInterior], count: "all", order: "newest" });
  assert.equal(legacy.response.status, 201);
  assert.equal(legacy.body.matchingCount, 3);
  assert.ok(legacy.body.questions.every((question) => question.exam === "CSE" && question.subtopic === "Earth Interior, Rocks & Tectonics"));
});

test("V3 rejects malformed counts rather than coercing or clamping them", async () => {
  for (const count of [0, -1, 101, 20.5, "20", null, {}, [], true]) {
    const { response } = await create(recipeFor([{ subtopicId: earthInterior, exams: allExams }], { count }));
    assert.equal(response.status, 400, JSON.stringify(count));
  }
});

test("V3 rejects invalid subjects, leaf IDs and sources without fallback", async () => {
  const basePaths = [{ subtopicId: earthInterior, exams: allExams }];
  const invalidRecipes = [
    recipeFor(basePaths, { subjectIds: [] }),
    recipeFor(basePaths, { subjectIds: [geo, "subject:unknown"] }),
    recipeFor(basePaths, { subjectIds: ["subject:environment"] }),
    recipeFor(basePaths, { subjectIds: [3] }),
    recipeFor([]),
    recipeFor([null]),
    recipeFor([{ subtopicId: oldEarthInterior, exams: allExams }]),
    recipeFor([{ subtopicId: physicalGeomorphology, exams: allExams }]),
    recipeFor([{ subtopicId: "unknown", exams: allExams }]),
    recipeFor([{ subtopicId: earthInterior, exams: [] }]),
    recipeFor([{ subtopicId: earthInterior, exams: [null] }]),
    recipeFor([{ subtopicId: earthInterior, exams: [7] }]),
    recipeFor([{ subtopicId: earthInterior, exams: ["cse"] }]),
    recipeFor([{ subtopicId: earthInterior, exams: ["JEE"] }]),
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
