import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Uses the caller's authenticated CLI; never reads or prints credentials.
const run = promisify(execFile);
const deployment = process.argv[2];
const cli = process.env.VERCEL_CLI_PATH;
if (!deployment || !cli) throw new Error("Pass the deployment URL and set VERCEL_CLI_PATH to the installed Vercel CLI entry point.");
const url = new URL(deployment);
assert.equal(url.protocol, "https:");
assert.equal(url.origin, deployment);
assert.ok(url.hostname.endsWith(".vercel.app"));

async function request(path, body) {
  const args = [cli, "curl", path, "--deployment", deployment, "--", "--silent", "--show-error", "--write-out", "\n%{http_code}"];
  if (body !== undefined) args.push("--request", "POST", "--header", "Content-Type: application/json", "--data", JSON.stringify(body));
  const { stdout } = await run(process.execPath, args, { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
  const split = stdout.lastIndexOf("\n");
  return { status: Number(stdout.slice(split + 1)), body: stdout.slice(0, split) };
}
async function json(path, body, expected = 200) {
  const response = await request(path, body);
  assert.equal(response.status, expected, `${path} returned ${response.status}`);
  return JSON.parse(response.body);
}

const home = await request("/");
assert.equal(home.status, 200);
assert.match(home.body, /Build your practice\./);
assert.match(home.body, /Test duration/);
const inventory = await json("/api/pyqs/inventory");
assert.equal(inventory.version, 3);
for (const parent of [...inventory.subjects, ...inventory.nodes.filter((node) => node.kind !== "subtopic")]) {
  const children = inventory.nodes.filter((node) => node.parentId === parent.id);
  assert.equal(children.reduce((sum, child) => sum + child.questionCount, 0), parent.questionCount);
  for (const exam of ["CSE", "CAPF", "CDS", "NDA"]) assert.equal(children.reduce((sum, child) => sum + child.examCounts[exam], 0), parent.examCounts[exam]);
}
console.log("PASS production page, duration controls, inventory conservation");

const earth = "subtopic:geography:physical-geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
const weather = "subtopic:geography:physical-geography:geomorphology-earth-structure:weathering-erosion-landforms";
const geomLeaves = inventory.nodes.filter((node) => node.kind === "subtopic" && node.parentId === "topic:geography:physical-geography:geomorphology-earth-structure");
const paths = (leaves) => leaves.map((leaf) => ({ subtopicId: leaf.id, exams: ["CSE", "CAPF", "CDS", "NDA"].filter((exam) => leaf.examCounts[exam] > 0) }));
const base = { version: 3, subjectIds: ["subject:geography"], paths: paths(geomLeaves), count: "all", order: "newest", durationMinutes: null };
const all = await json("/api/practice-snapshots", base, 201);
assert.equal(all.matchingCount, 140);
assert.equal(all.questions.length, 140);
assert.equal(all.recipe.durationMinutes, null);
assert.ok(all.questions.every((question) => question.section === "Physical Geography" && !("answer" in question) && !("explanation" in question)));
const timed = await json("/api/practice-snapshots", { ...base, count: 20, durationMinutes: 20 }, 201);
assert.equal(timed.matchingCount, 140);
assert.equal(timed.questions.length, 20);
assert.equal(timed.recipe.durationMinutes, 20);
const combined = await json("/api/practice-snapshots", { ...base, paths: paths(inventory.nodes.filter((node) => node.id === earth || node.id === weather)) }, 201);
assert.equal(combined.questions.length, 117);
assert.equal(new Set(combined.questions.map((question) => question.id)).size, 117);
const cse = await json("/api/practice-snapshots", { ...base, paths: geomLeaves.filter((leaf) => leaf.examCounts.CSE > 0).map((leaf) => ({ subtopicId: leaf.id, exams: ["CSE"] })) }, 201);
assert.equal(cse.questions.length, 12);
assert.ok(cse.questions.every((question) => question.exam === "CSE"));
console.log("PASS exact 140/all, 20/timed, 117/combined, 12/CSE and answer-free snapshots");

const invalid = await json("/api/practice-snapshots", { ...base, durationMinutes: 0 }, 400);
assert.match(invalid.error, /duration|minutes/i);
const ids = timed.questions.slice(0, 3).map((question) => question.id);
const submitted = Object.keys(timed.questions[0].options)[0];
const grade = await json("/api/practice/grade", { questionIds: ids, answers: { [ids[0]]: submitted } });
assert.equal(grade.total, 3);
assert.equal(grade.correct + grade.incorrect, 1);
assert.equal(grade.unattempted, 2);
assert.equal(Object.keys(grade.feedback).length, 3);
for (const item of Object.values(grade.feedback)) {
  assert.equal(typeof item.correctAnswer, "string");
  assert.ok(item.explanation === null || !/pending editorial review/i.test(item.explanation));
}
await json("/api/practice/grade", { questionIds: [...ids, ids[0]], answers: {} }, 400);
console.log("PASS duration rejection, complete result grading, skipped counts and invalid-ID rejection");
