import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function workerFetch(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html", ...init.headers }, ...init }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the archive-first official PYQ home", async () => {
  const response = await workerFetch();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Official previous-year questions/);
  assert.match(html, /Choose an examination/);
  assert.match(html, /Civil Services Examination/);
  assert.match(html, />485</);
  assert.match(html, />241</);
  assert.match(html, />313</);
  assert.match(html, />480</);
  assert.match(html, /PYQs/);
  assert.match(html, /Attempts/);
  assert.match(html, /Bookmarks/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /Your syllabus|UPSC test lab|Guest mode|Sign in with Google/);
});

test("server-renders the continuous Sankey archive workspace", async () => {
  const response = await workerFetch("/exams/CSE");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Build a practice session/);
  assert.match(html, /Subject/);
  assert.match(html, /Topic/);
  assert.match(html, /Subtopic/);
  assert.match(html, /Newest first/);
  assert.match(html, />Shuffle</);
  assert.match(html, /Start practice/);
  assert.doesNotMatch(html, /difficulty|generated MCQ|source verbatim/i);
});

test("inventory returns unique official PYQ flows and unresolved records separately", async () => {
  const response = await workerFetch("/api/pyqs/inventory?exam=CSE");
  assert.equal(response.status, 200);
  const inventory = await response.json();
  assert.equal(inventory.exam, "CSE");
  assert.equal(inventory.totalCount, 485);
  assert.equal(inventory.mappedCount + inventory.unmappedCount, inventory.totalCount);
  assert.ok(inventory.nodes.some((node) => node.kind === "subject"));
  assert.ok(inventory.nodes.some((node) => node.kind === "topic"));
  assert.ok(inventory.nodes.some((node) => node.kind === "subtopic"));
  assert.ok(inventory.links.every((link) => link.questionCount > 0));
  assert.equal(new Set(inventory.nodes.map((node) => node.id)).size, inventory.nodes.length);
});

test("creates a fixed, answer-free official-PYQ practice snapshot", async () => {
  const response = await workerFetch("/api/practice-snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ exam: "CSE", yearFrom: 2011, yearTo: 2025, taxonomyIds: [], count: 10, order: "newest" }),
  });
  assert.equal(response.status, 201);
  const snapshot = await response.json();
  assert.equal(snapshot.questions.length, 10);
  assert.equal(snapshot.recipe.exam, "CSE");
  assert.equal(snapshot.recipe.order, "newest");
  assert.match(snapshot.questions[0].sourceTextHash, /^[a-f0-9]{64}$/);
  assert.ok(snapshot.questions.every((question) => question.exam === "CSE"));
  assert.ok(snapshot.questions.every((question) => !("answer" in question) && !("explanation" in question)));
});

test("checks answers without leaking placeholder explanations", async () => {
  const response = await workerFetch("/api/practice/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId: "cse-2013-gs-i-14", selectedOption: "A" }),
  });
  assert.equal(response.status, 200);
  const feedback = await response.json();
  assert.equal(typeof feedback.correct, "boolean");
  assert.match(feedback.correctAnswer, /^[A-D]$/);
  assert.notEqual(feedback.explanation, "Explanation pending editorial review.");
});

test("ships exact, locked source records and the local-only PWA model", async () => {
  const [manifestText, bankText, practiceSource, resultsSource, archiveSource, localStoreSource, cssSource] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../content/question-bank.json", import.meta.url), "utf8"),
    readFile(new URL("../app/components/practice-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/results-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/archive-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/practice-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const bank = JSON.parse(bankText);
  assert.equal(manifest.name, "UPSCPuraan");
  assert.equal(manifest.display, "standalone");
  assert.equal(bank.total, 1519);
  assert.deepEqual(bank.sourceCounts, { CSE: 485, CAPF: 241, CDS: 313, NDA: 480 });
  for (const question of bank.questions) {
    assert.equal(question.origin, "pyq");
    assert.equal(question.sourceTextLocked, true);
    assert.match(question.sourceTextHash, /^[a-f0-9]{64}$/);
    assert.equal(Object.keys(question.options).length, 4);
    assert.ok(question.options[question.answer]);
  }

  const capf = bank.questions.find((question) => question.id === "capf-2017-i-1");
  assert.ok(capf);
  assert.match(capf.sourceText, /Statement I : Plantation farming/);
  assert.match(capf.sourceText, /Statement II : The soil of humid tropics/);
  assert.match(capf.options.B, /NOT the correct explanation/);
  assert.doesNotMatch(capf.sourceText, /Which statement is correct\?/);

  const studentSources = `${practiceSource}\n${resultsSource}\n${archiveSource}`;
  assert.doesNotMatch(studentSources, /Explanation pending editorial review|source verbatim|Sign in with Google|Needs attention|difficulty filter/i);
  assert.match(practiceSource, /question-heading/);
  assert.match(cssSource, /font-family: var\(--font-reading\)/);
  assert.match(archiveSource, /sankey/);
  assert.match(localStoreSource, /openDB/);
  assert.match(localStoreSource, /attempts/);
  assert.match(localStoreSource, /bookmarks/);
});
