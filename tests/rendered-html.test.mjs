import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the UPSCPuraan product dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /UPSCPuraan/);
  assert.match(html, /Your syllabus\./);
  assert.match(html, /Create a test/);
  assert.match(html, /Recent attempts/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("ships the PWA manifest and normalized database model", async () => {
  const [manifestText, schema, appSource] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/upscpuraan-app.tsx", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.name, "UPSCPuraan");
  assert.equal(manifest.display, "standalone");
  assert.match(schema, /questions/);
  assert.match(schema, /sourceFingerprint/);
  assert.match(schema, /questionSnapshotJson/);
  assert.match(schema, /editorialEvents/);
  assert.match(schema, /promptLinesJson/);
  assert.match(schema, /sourceTextHash/);
  assert.match(schema, /sourceTextLocked/);

  for (const exam of ["CSE", "CAPF", "CDS", "NDA"]) {
    assert.match(appSource, new RegExp(`exam: "${exam}"`));
  }
  assert.match(appSource, /sourceTextLocked: true/);
  assert.match(appSource, /Statement I : Plantation farming has mostly been practiced in humid tropics/);
  assert.match(appSource, /Statement II is NOT the correct explanation of Statement I/);
  assert.doesNotMatch(appSource, /Which statement is correct\?/);
  assert.doesNotMatch(appSource, /Both are true and the second explains the first/);
  assert.doesNotMatch(appSource, /The Fourth Buddhist Council, associated with/);
  assert.match(appSource, /\["All subjects","Polity","History","Geography","Economy","Environment","Science"\]/);
  assert.match(appSource, /\["All types","Easy","Moderate","Hard","Mixed"\]/);
  assert.match(appSource, /useState<string\[\]>\(\[\]\)/);
  assert.match(appSource, /useState<Difficulty>\("All types"\)/);
});
