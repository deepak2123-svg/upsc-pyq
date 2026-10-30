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

test('Sources links reviewed papers to full-paper practice',async()=>{
  const response=await workerFetch('/legal/sources');
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/Added PYQ papers/);
  assert.match(html,/Complete source review/);
  assert.match(html,/Official provisional/);
  assert.match(html,/Officially withdrawn/);
  assert.match(html,/Q85/);
  assert.match(html,/<table class="source-table"/);
  assert.match(html,/16, 21, 23, 24, 51, 58, 68, 70, 110, 117, 123, 125, 139, 144/);
  assert.match(html,/href="\/papers\/nda-2026-i-gat"/);
  assert.match(html,/Practise full paper/);
});

test('reviewed historical paper opens the original-order practice launcher',async()=>{
  const response=await workerFetch('/papers/nda-2019-i-gat');
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/NDA I 2019 · GAT/);
  assert.match(html,/150 available \/ 150 source questions/);
  assert.match(html,/Full GAT/);
  assert.match(html,/Start 150-question test/);
  assert.match(html,/Original wording, question numbers and option order are preserved/);
  const reviewed=await workerFetch('/papers/nda-2024-ii-gat');
  assert.equal(reviewed.status,200);
  const reviewedHtml=await reviewed.text();
  assert.match(reviewedHtml,/136 available \/ 150 source questions/);
  assert.match(reviewedHtml,/14 held for review/);
});

test("server-renders the browse-first official PYQ workspace", async () => {
  const response = await workerFetch();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Question library/i);
  assert.match(html, /placeholder="Search PYQs"/);
  assert.match(html, /role="search"/);
  assert.match(html, /UPSC\.PYQ\.Practise/);
  assert.doesNotMatch(html, /UPSCPuraan/);
  assert.match(html, /Subjects/);
  assert.match(html, /Geography/);
  assert.match(html, /Environment/);
  assert.match(html, /Polity/);
  assert.doesNotMatch(html, /Selected syllabus|Nothing selected yet/);
  assert.match(html, /class="library-column-label library-column-label-left">Library</);
  assert.match(html, /id="practice-summary-title">Test</);
  assert.doesNotMatch(html, /Browse freely|explicitly select|Opening a level|selection unchanged|Select adds|Open only|Question count, time|Choose MCQs and time next/i);
  assert.doesNotMatch(html, /Choose an examination|Year range|Difficulty/);
  assert.match(html, /PYQs/);
  assert.match(html, /Attempts/);
  assert.match(html, /Bookmarks/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /UPSC test lab|Guest mode|Sign in with Google/);
});

test('homepage search returns answer-free matching MCQs and supports option text',async()=>{
  const response=await workerFetch('/?q=HBrO%E2%82%84');
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/matching MCQ/);
  assert.match(html,/Hypobromous acid/);
  assert.match(html,/HBrO₄/);
  assert.match(html,/NDA<!-- --> <!-- -->2021/);
  assert.doesNotMatch(html,/Correct answer|officialAcceptedOptions|"answer"/);
});

test('homepage search reports no result without weakening the normal library',async()=>{
  const response=await workerFetch('/?q=term-that-cannot-exist-94721');
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/No reviewed MCQs match/);
  assert.match(html,/Question library/i);
});

test("server-renders an exam archive through the browse-first selector", async () => {
  const response = await workerFetch("/exams/CSE");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Subjects/);
  assert.match(html, /CSE(?:<!-- -->)? question library/);
  assert.doesNotMatch(html, /Selected syllabus/);
  assert.match(html, /Finalise test/);
  assert.match(html, /No questions added/);
  assert.doesNotMatch(html, /Browse freely|explicitly select|Opening a level|selection unchanged|Select adds|Open only|Question count, time|Choose MCQs and time next/i);
  assert.doesNotMatch(html, /Start 20-question (?:practice|test)/);
  assert.doesNotMatch(html, /difficulty|generated MCQ|source verbatim/i);
});

test("inventory returns cross-exam subjects and unique official PYQ flows", async () => {
  const response = await workerFetch("/api/pyqs/inventory");
  assert.equal(response.status, 200);
  const inventory = await response.json();
  assert.equal(inventory.totalCount, 2296);
  assert.equal(inventory.mappedCount + inventory.unmappedCount, inventory.totalCount);
  assert.deepEqual(inventory.subjects.filter(s=>!s.legacyOnly).map((subject) => subject.label), ["Geography", "History", "Polity & Governance", "Economy", "Environment & Ecology", "Science & Technology", "Social Development", "International Relations & Organisations", "Current Affairs"]);
  assert.ok(inventory.nodes.some((node) => node.kind === "topic"));
  assert.ok(inventory.nodes.some((node) => node.kind === "subtopic"));
  assert.ok(inventory.nodes.some((node) => node.kind === "subtopic" && node.examCounts.CDS > 0));
  assert.ok(inventory.nodes.every((node) => Object.values(node.examCounts).reduce((sum, count) => sum + count, 0) === node.questionCount));
  assert.ok(inventory.links.every((link) => link.questionCount >= 0));
  assert.ok(inventory.links.some(link=>link.questionCount===0));
  assert.equal(new Set(inventory.nodes.map((node) => node.id)).size, inventory.nodes.length);
  assert.ok(!inventory.subjects.some((subject) => subject.label === "General Studies"));
});

test("creates a deterministic mixed-exam snapshot from exact subtopic paths", async () => {
  const inventoryResponse = await workerFetch("/api/pyqs/inventory");
  const inventory = await inventoryResponse.json();
  const csePath = inventory.nodes.find((node) => node.kind === "subtopic" && node.examCounts.CSE > 0);
  const cdsPath = inventory.nodes.find((node) => node.kind === "subtopic" && node.examCounts.CDS > 0 && node.id !== csePath?.id);
  assert.ok(csePath && cdsPath);
  const subjectIds = [...new Set([csePath.subjectId, cdsPath.subjectId])];
  const response = await workerFetch("/api/practice-snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      version: 4,
      taxonomyVersion:inventory.taxonomyVersion,
      subjectIds,
      paths: [{ subtopicId: csePath.id, exams: ["CSE"] }, { subtopicId: cdsPath.id, exams: ["CDS"] }],
      count: "all",
      order: "newest",
    }),
  });
  assert.equal(response.status, 201);
  const snapshot = await response.json();
  assert.equal(snapshot.recipe.version, 4);
  assert.deepEqual(snapshot.recipe.subjectIds, subjectIds);
  assert.ok(snapshot.questions.some((question) => question.exam === "CSE"));
  assert.ok(snapshot.questions.some((question) => question.exam === "CDS"));
  assert.ok(snapshot.questions.every((question) => ["CSE", "CDS"].includes(question.exam)));
  assert.ok(snapshot.questions.every((question) => !("answer" in question) && !("explanation" in question)));
});

test("rejects a stale V2 count that exceeds the selected path inventory", async () => {
  const inventoryResponse = await workerFetch("/api/pyqs/inventory");
  const inventory = await inventoryResponse.json();
  const path = inventory.nodes.find(node=>node.id==='subtopic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth:planets');
  assert.ok(path);
  const exam = ["CSE", "CAPF", "CDS", "NDA"].find((value) => path.examCounts[value] > 0);
  const response = await workerFetch("/api/practice-snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version: 2, subjectIds: [path.subjectId], paths: [{ subtopicId: path.id, exams: [exam] }], count: 100, order: "newest" }),
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.ok(body.available < 100);
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
  assert.equal(manifest.name, "UPSC.PYQ.Practise");
  assert.equal(manifest.short_name, "UPSC.PYQ");
  assert.equal(manifest.display, "standalone");
  assert.equal(bank.total, 1519);
  assert.deepEqual(bank.sourceCounts, { CSE: 539, CAPF: 255, CDS: 184, NDA: 541 });
  for(const [exam,n] of Object.entries(bank.sourceCounts)) assert.equal(bank.questions.filter(q=>q.exam===exam).length,n);
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
  assert.match(archiveSource, /ScopeFlow/);
  assert.match(archiveSource, /SyllabusNavigation/);
  assert.doesNotMatch(archiveSource, /scope-breadcrumbs/);
  assert.match(archiveSource, /scope-sources/);
  assert.match(archiveSource, /matchingCount/);
  assert.match(localStoreSource, /openDB/);
  assert.match(localStoreSource, /attempts/);
  assert.match(localStoreSource, /bookmarks/);
});
