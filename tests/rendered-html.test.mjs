import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the public UPSCPuraan landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /UPSCPuraan/);
  assert.match(html, /Your syllabus\./);
  assert.match(html, /Build a test/);
  assert.match(html, /Editorially reviewed content/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("server-renders the anonymous test lab route", async () => {
  const response = await render("/app/build");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Build your test/);
  assert.match(html, /All subjects/);
  assert.match(html, /All types/);
});

test("anonymous API surfaces fail closed until Supabase is configured", async () => {
  const me = await render("/api/me");
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { authenticated: false, guest: false, role: null });

  const testsResponse = await render("/api/tests");
  assert.equal(testsResponse.status, 405);
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api", "api-test");
  const { default: worker } = await import(workerUrl.href);
  const createResponse = await worker.fetch(
    new Request("http://localhost/api/tests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipe: { exam: "CSE", count: 5 } }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(createResponse.status, 503);
  assert.equal((await createResponse.json()).code, "DATABASE_UNCONFIGURED");
});

test("ships the PWA manifest and normalized database model", async () => {
  const [manifestText, schema, appSource, bankText] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/upscpuraan-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../content/question-bank.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const bank = JSON.parse(bankText);
  assert.equal(manifest.name, "UPSCPuraan");
  assert.equal(manifest.display, "standalone");
  assert.match(schema, /questions/);
  assert.match(schema, /sourceFingerprint/);
  assert.match(schema, /questionSnapshot/);
  assert.match(schema, /editorialEvents/);
  assert.match(schema, /promptLines/);
  assert.match(schema, /sourceTextHash/);
  assert.match(schema, /sourceTextLocked/);

  assert.equal(bank.total, 1519);
  assert.deepEqual(bank.sourceCounts, { CSE: 485, CAPF: 241, CDS: 313, NDA: 480 });
  assert.equal(bank.questions.length, bank.total);
  for (const question of bank.questions) {
    assert.equal(question.origin, "pyq");
    assert.equal(question.sourceTextLocked, true);
    assert.match(question.sourceTextHash, /^[a-f0-9]{64}$/);
    assert.ok(question.sourceText.length > 0);
    assert.equal(Object.keys(question.options).length, 4);
    assert.ok(question.options[question.answer]);
  }
  const capf = bank.questions.find((question) => question.id === "capf-2017-i-1");
  assert.ok(capf);
  assert.equal(capf.sourceText, "The following items consist of two statements, Statement I and Statement II Examine these two statements carefully and select the correct answer using the code given below :\nStatement I : Plantation farming has mostly been practiced in humid tropics\nStatement II : The soil of humid tropics is highly fertile");
  assert.deepEqual(capf.promptLines, [
    "The following items consist of two statements, Statement I and Statement II Examine these two statements carefully and select the correct answer using the code given below :",
    "Statement I : Plantation farming has mostly been practiced in humid tropics",
    "Statement II : The soil of humid tropics is highly fertile",
  ]);
  assert.equal(capf.options.B, "Both the statements are individually true but Statement II is NOT the correct explanation of Statement I");
  assert.doesNotMatch(capf.sourceText, /Which statement is correct\?/);
  assert.doesNotMatch(capf.options.A, /Both are true and the second explains the first/);
  assert.ok(bank.questions.some((question) => question.exam === "NDA" && question.source.dataset.includes("NDA")));
  assert.ok(bank.questions.some((question) => question.exam === "CDS" && question.source.dataset.includes("CDS")));
  assert.match(appSource, /questionBank\.questions/);
  assert.match(appSource, /\["All subjects", \.\.\.props\.availableSubjects\]/);
  assert.match(appSource, /\["All types","Easy","Moderate","Hard","Mixed"\]/);
  assert.match(appSource, /useState<string\[\]>\(\[\]\)/);
  assert.match(appSource, /useState<Difficulty>\("All types"\)/);
  assert.match(appSource, /subjects\.length === 0 \|\| subjects\.includes\(q\.subject\)/);
  assert.match(appSource, /if \(difficulty === "All types"\) return subjectPool/);
  assert.match(appSource, /eligibleQuestions\.slice\(0, count\)/);
  assert.match(appSource, /sourceMix \? questions : questions\.filter\(\(q\) => q\.exam === exam\)/);
  assert.match(appSource, /Balanced selection/);
  assert.match(appSource, /className="timer-block"/);
  assert.match(appSource, /className="question-source"/);
  assert.match(appSource, /attempt-app-shell/);
  assert.doesNotMatch(appSource, /PYQ · Source verbatim/);
  assert.doesNotMatch(appSource, /\{q\.subject\} · \{q\.difficulty\}/);
});
