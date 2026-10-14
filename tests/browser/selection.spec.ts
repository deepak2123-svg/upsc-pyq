import { expect, test, type Page } from "@playwright/test";

const EARTH = "Earth Interior, Rocks & Tectonics";
const WEATHER = "Weathering, Erosion & Landforms";
const GEOMORPHOLOGY = "Geomorphology & Earth Structure";
const formatted = (value: number) => value.toLocaleString("en-IN");
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const summary = (page: Page) => page.getByTestId("matching-count");
const start = (page: Page) => page.locator(".scope-dock").getByRole("button", { name: /^Start / });
const scope = (page: Page) => page.locator((page.viewportSize()?.width || 1600) < 1100 ? ".scope-flow-mobile" : ".scope-flow-scroll");

async function matching(page: Page, count: number) {
  await expect(summary(page).locator("strong")).toHaveText(formatted(count));
}
async function choose(page: Page, label: string) {
  await scope(page).getByRole("button", { name: new RegExp(`^Choose ${escape(label)}\\.`) }).click();
}
async function geography(page: Page) {
  await page.getByRole("button", { name: /^Geography\b/ }).first().click();
  await matching(page, 1021);
}
async function geomorphology(page: Page) {
  await geography(page);
  await choose(page, "Physical Geography");
  await matching(page, 363);
  await choose(page, GEOMORPHOLOGY);
  await matching(page, 140);
}
async function addition(page: Page, subtopic = WEATHER) {
  await page.getByRole("button", { name: /Add (?:another )?topic/ }).click();
  const dialog = page.getByRole("dialog", { name: "Add to your current selection" });
  await dialog.getByRole("combobox", { name: "Section", exact: true }).selectOption({ label: "Physical Geography · 363" });
  await dialog.getByRole("combobox", { name: "Topic", exact: true }).selectOption({ label: `${GEOMORPHOLOGY} · 140` });
  await dialog.getByRole("combobox", { name: "Subtopic", exact: true }).selectOption({ label: `${subtopic} · ${subtopic === WEATHER ? 76 : 41}` });
  return dialog;
}
async function snapshotResponse(page: Page) {
  return page.waitForResponse((response) => response.url().endsWith("/api/practice-snapshots") && response.request().method() === "POST");
}

test.beforeEach(async ({ page }) => {
  // Playwright creates a fresh context per test: no attempts, drafts or bookmarks leak.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build your test." })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Geography\b/ }).first()).toBeEnabled();
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:all") !== null);
  await expect(page.locator(".scope-size-options").getByRole("button", { name: "20", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("scope clicks narrow 1021 → 363 → 140 → 41, preserving ancestry and honest context", async ({ page }, testInfo) => {
  await geomorphology(page);
  const breadcrumbs = page.getByRole("navigation", { name: "Current syllabus path" });
  await expect(breadcrumbs).toContainText("Geography");
  await expect(breadcrumbs).toContainText("Physical Geography");
  await expect(breadcrumbs).toContainText(GEOMORPHOLOGY);
  await expect(scope(page).getByRole("button", { name: /Show other sections, 658 available/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("physical-geomorphology.png"), fullPage: true });
  await choose(page, EARTH);
  await matching(page, 41);
  await expect(breadcrumbs).toContainText(EARTH);
  await page.getByRole("button", { name: /Back.*selection unchanged/ }).click();
  await matching(page, 41);
  await expect(page.getByRole("status")).toContainText("selection is unchanged");
  await choose(page, GEOMORPHOLOGY);
  await matching(page, 140);
});

test("source filtering gives 12 CSE questions, retains scope, and leaves geometry unchanged", async ({ page }) => {
  await geomorphology(page);
  const positions = await page.locator(".scope-flow-node").evaluateAll((nodes) => nodes.map((node) => ({
    id: (node as HTMLElement).dataset.scopeId,
    top: (node as HTMLElement).style.top,
    left: (node as HTMLElement).style.left,
  })));
  for (const exam of ["CAPF", "CDS", "NDA"]) {
    await page.locator(".scope-sources").getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) }).click();
  }
  await matching(page, 12);
  await expect(page.locator(".scope-sources").getByRole("checkbox", { name: /^CSE\b/ })).toBeChecked();
  expect(await page.locator(".scope-flow-node").evaluateAll((nodes) => nodes.map((node) => ({
    id: (node as HTMLElement).dataset.scopeId,
    top: (node as HTMLElement).style.top,
    left: (node as HTMLElement).style.left,
  })))).toEqual(positions);
  await expect(start(page)).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("You chose 20, but only 12 questions match.");
  await page.getByRole("button", { name: "Use all 12 available" }).click();
  await expect(start(page)).toHaveText("Start 12-question practice →");
});

test("topic replacement preserves another selected subject", async ({ page }) => {
  await geography(page);
  await page.getByRole("button", { name: /^Polity\b/ }).first().click();
  await matching(page, 1038);
  await page.locator(".scope-subject-tabs").getByRole("button", { name: /^Geography\b/ }).click();
  await choose(page, "Physical Geography");
  await matching(page, 380);
  await choose(page, GEOMORPHOLOGY);
  await matching(page, 157);
  await choose(page, EARTH);
  await matching(page, 58);
  await expect(page.locator(".scope-selection-list")).toContainText("Polity");
  await expect(page.locator(".scope-selection-list")).toContainText(EARTH);
});

test("add picker previews unique additions; Cancel, overlap and remove/re-add preserve the recipe", async ({ page }) => {
  await geomorphology(page);
  await choose(page, EARTH);
  let dialog = await addition(page);
  await expect(dialog).toContainText("76 new questions");
  await matching(page, 41);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await matching(page, 41);
  dialog = await addition(page);
  await dialog.getByRole("button", { name: "Add 76 questions", exact: true }).click();
  await matching(page, 117);
  dialog = await addition(page);
  await expect(dialog).toContainText("Already included or unavailable.");
  await expect(dialog.getByRole("button", { name: "Add 0 questions", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: `Remove ${WEATHER}`, exact: true }).click();
  await matching(page, 41);
  dialog = await addition(page);
  await dialog.getByRole("button", { name: "Add 76 questions", exact: true }).click();
  await matching(page, 117);
});

test("tiny branches keep requested size 20 until the student explicitly chooses All", async ({ page }) => {
  await geomorphology(page);
  await choose(page, "Earthquakes, Volcanoes & Geological Hazards");
  await matching(page, 23);
  for (const exam of ["CAPF", "CDS", "NDA"]) {
    const checkbox = page.locator(".scope-sources").getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) });
    if (await checkbox.isEnabled()) await checkbox.click();
  }
  const available = Number((await summary(page).locator("strong").innerText()).replace(/,/g, ""));
  expect(available).toBeGreaterThan(0);
  expect(available).toBeLessThan(20);
  await expect(page.locator(".scope-size-options").getByRole("button", { name: "20", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(start(page)).toBeDisabled();
  await page.getByRole("button", { name: `Use all ${available} available`, exact: true }).click();
  await expect(start(page)).toBeEnabled();
  const responsePromise = snapshotResponse(page);
  await start(page).click();
  const snapshot = await (await responsePromise).json();
  expect(snapshot.matchingCount).toBe(available);
  expect(snapshot.questions).toHaveLength(available);
});

test("draft reload restores selection, sources, size, focus and question order", async ({ page }) => {
  await geomorphology(page);
  await choose(page, EARTH);
  await page.locator(".scope-size-options").getByRole("button", { name: "30", exact: true }).click();
  await page.getByRole("combobox", { name: "Question order", exact: true }).selectOption("shuffle");
  await page.reload();
  await matching(page, 41);
  await expect(page.getByRole("navigation", { name: "Current syllabus path" })).toContainText(EARTH);
  await expect(page.getByRole("combobox", { name: "Question order", exact: true })).toHaveValue("shuffle");
  await expect(page.locator(".scope-size-options").getByRole("button", { name: "30", exact: true })).toHaveAttribute("aria-pressed", "true");
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("upsc-pyq-builder:v3:all") || "{}"));
  expect(draft.version).toBe(3);
  expect(draft.inventoryVersion).toBe(3);
  expect(Object.keys(draft.paths)).toHaveLength(1);
});

test("posted version-3 recipe exactly matches the displayed scope, for size 20 and All", async ({ page }) => {
  await geomorphology(page);
  let responsePromise = snapshotResponse(page);
  await start(page).click();
  let response = await responsePromise;
  expect(response.status()).toBe(201);
  const recipe = response.request().postDataJSON();
  expect(recipe.version).toBe(3);
  expect(recipe.count).toBe(20);
  expect(recipe.subjectIds).toEqual(["subject:geography"]);
  expect(recipe.paths).toHaveLength(3);
  expect(recipe.paths.every((path: { subtopicId: string }) => path.subtopicId.includes(":physical-geography:geomorphology-earth-structure:"))).toBe(true);
  let snapshot = await response.json();
  expect(snapshot.matchingCount).toBe(140);
  expect(snapshot.questions).toHaveLength(20);
  expect(snapshot.questions.every((question: { topic: string }) => question.topic === GEOMORPHOLOGY)).toBe(true);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 20");
  await page.goBack();
  await matching(page, 140);
  await page.locator(".scope-size-options").getByRole("button", { name: "All", exact: true }).click();
  responsePromise = snapshotResponse(page);
  await start(page).click();
  response = await responsePromise;
  snapshot = await response.json();
  expect(snapshot.recipe.count).toBe("all");
  expect(snapshot.questions).toHaveLength(140);
  expect(new Set(snapshot.questions.map((question: { id: string }) => question.id)).size).toBe(140);
});

test("a saved practice finishes, retakes with its version-3 recipe and restores the builder", async ({ page }) => {
  await geomorphology(page);
  await choose(page, EARTH);
  await start(page).click();
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 20");
  const firstUrl = page.url();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByText("Practice complete", { exact: true })).toBeVisible();
  const retake = snapshotResponse(page);
  await page.getByRole("button", { name: "Retake selection", exact: true }).click();
  const response = await retake;
  expect(response.request().postDataJSON().version).toBe(3);
  expect((await response.json()).matchingCount).toBe(41);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 20");
  expect(page.url()).not.toBe(firstUrl);
  await page.goto("/");
  await matching(page, 41);
});

test("in-flight creation freezes controls and server failure retains the visible selection", async ({ page }) => {
  await geomorphology(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/practice-snapshots", async (route) => {
    await gate;
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Practice service is temporarily unavailable." }) });
  });
  await start(page).click();
  await expect(page.locator("main.scope-workspace")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: /^Geography\b/ }).first()).toBeDisabled();
  await expect(scope(page).getByRole("button", { name: new RegExp(`^Choose ${escape(EARTH)}\\.`) })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Question order", exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole("alert")).toHaveText("Practice service is temporarily unavailable.");
  await matching(page, 140);
  await expect(start(page)).toBeEnabled();
  await expect(page).toHaveURL("/");
});

test("browser storage failure explains the problem without navigating to a missing attempt", async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === "attempts") throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      return put.apply(this, args);
    };
  });
  await page.reload();
  await geomorphology(page);
  await start(page).click();
  await expect(page.getByRole("alert")).toContainText("This browser could not save your practice.");
  await expect(page).toHaveURL("/");
  await matching(page, 140);
  await expect(start(page)).toBeEnabled();
});

test("CSE entry retains a zero-source branch until another examination is explicitly enabled", async ({ page }) => {
  await page.goto("/exams/CSE");
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:CSE") !== null);
  await page.getByRole("button", { name: /^Geography\b/ }).first().click();
  await choose(page, "Other Geography");
  await matching(page, 0);
  await expect(start(page)).toBeDisabled();
  await expect(page.locator(".scope-selection-list")).toContainText("Other Geography");
  await expect(page.locator(".scope-dock")).toContainText("No questions match the enabled sources.");
  const emptyDraft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("upsc-pyq-builder:v3:CSE") || "{}"));
  expect(Object.keys(emptyDraft.paths).length).toBeGreaterThan(0);
  expect(Object.values(emptyDraft.paths).every((exams) => Array.isArray(exams) && exams.length === 0)).toBe(true);
  const nda = page.locator(".scope-sources").getByRole("checkbox", { name: /^NDA\b/ });
  await expect(nda).not.toBeChecked();
  await nda.click();
  const enabledCount = Number((await summary(page).locator("strong").innerText()).replace(/,/g, ""));
  expect(enabledCount).toBeGreaterThan(0);
  const sourceDraft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("upsc-pyq-builder:v3:CSE") || "{}"));
  expect(Object.values(sourceDraft.paths).every((exams) => Array.isArray(exams) && exams.every((exam) => exam === "NDA"))).toBe(true);
});

test("newly added leaves inherit the subject's chosen sources without resetting existing overrides", async ({ page, request }) => {
  const inventory = await (await request.get("/api/pyqs/inventory")).json();
  const earth = inventory.nodes.find((node: { id: string; label: string }) => node.id.includes(":physical-geography:") && node.label === EARTH);
  const weather = inventory.nodes.find((node: { id: string; label: string }) => node.id.includes(":physical-geography:") && node.label === WEATHER);
  await geomorphology(page);
  await choose(page, EARTH);
  for (const exam of ["CAPF", "CDS", "NDA"]) {
    await page.locator(".scope-sources").getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) }).click();
  }
  await matching(page, earth.examCounts.CSE);
  const dialog = await addition(page);
  await expect(dialog).toContainText(`${weather.examCounts.CSE} new questions`);
  await dialog.getByRole("button", { name: `Add ${weather.examCounts.CSE} questions`, exact: true }).click();
  await matching(page, earth.examCounts.CSE + weather.examCounts.CSE);
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("upsc-pyq-builder:v3:all") || "{}"));
  expect(draft.paths[earth.id]).toEqual(["CSE"]);
  expect(draft.paths[weather.id]).toEqual(["CSE"]);
});

test("a previously saved version-2 attempt resumes and retakes through its legacy alias", async ({ page, request }) => {
  const recipe = {
    version: 2, subjectIds: ["subject:geography"],
    paths: [{ subtopicId: "subtopic:geography:geomorphology-earth-structure:earth-interior-rocks-tectonics", exams: ["CSE", "CAPF", "CDS", "NDA"] }],
    count: 10, order: "newest",
  };
  const response = await request.post("/api/practice-snapshots", { data: recipe });
  expect(response.status()).toBe(201);
  const snapshot = await response.json();
  // Existing attempts retain their historical recipe, rather than the API's normalized IDs.
  snapshot.recipe = recipe;
  await page.evaluate(async (savedSnapshot) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("upscpuraan-pyq", 2);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const now = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("attempts", "readwrite");
      transaction.objectStore("attempts").put({
        id: savedSnapshot.id, snapshot: savedSnapshot, status: "in_progress",
        currentIndex: 0, answers: {}, feedback: {}, elapsedSeconds: 0,
        startedAt: now, updatedAt: now,
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, snapshot);
  await page.goto(`/practice/${snapshot.id}`);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 10");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByText("Practice complete", { exact: true })).toBeVisible();
  const retake = snapshotResponse(page);
  await page.getByRole("button", { name: "Retake selection", exact: true }).click();
  const retaken = await retake;
  expect(retaken.status()).toBe(201);
  expect(retaken.request().postDataJSON()).toEqual(recipe);
  const next = await retaken.json();
  expect(next.matchingCount).toBe(41);
  expect(next.questions).toHaveLength(10);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 10");
  expect(page.url()).not.toContain(snapshot.id);
});

test("actual Sankey cards do not overlap at every ancestry level or for long environmental names", async ({ page }) => {
  async function assertCards() {
    // Wait for the implemented 200ms transitions to settle before checking final geometry.
    await page.locator(".scope-flow").evaluate(async (flow) => {
      flow.getBoundingClientRect();
      await Promise.all(flow.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)));
    });
    const overlaps = await page.locator(".scope-flow-node").evaluateAll((nodes) => {
      const cards = nodes.map((node) => ({ id: (node as HTMLElement).dataset.scopeId, label: node.textContent, rect: node.getBoundingClientRect() }));
      return cards.flatMap((card, position) => cards.slice(position + 1).filter((other) => (
        card.rect.width > 0 && other.rect.width > 0 &&
        Math.min(card.rect.right, other.rect.right) - Math.max(card.rect.left, other.rect.left) > 1 &&
        Math.min(card.rect.bottom, other.rect.bottom) - Math.max(card.rect.top, other.rect.top) > 1
      )).map((other) => [card.id, other.id]));
    });
    expect(overlaps).toEqual([]);
    for (const button of await scope(page).locator(".scope-flow-select, .scope-flow-browse").all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
  await geography(page);
  await assertCards();
  await choose(page, "Physical Geography");
  await assertCards();
  await choose(page, GEOMORPHOLOGY);
  await assertCards();
  await choose(page, EARTH);
  await assertCards();
  await page.getByRole("button", { name: /^Environment\b/ }).first().click();
  await choose(page, "Environment & Ecology");
  await assertCards();
  await page.locator(".scope-subject-tabs").getByRole("button", { name: /^Geography\b/ }).click();
  await choose(page, "Other Geography");
  await assertCards();
  await choose(page, GEOMORPHOLOGY);
  await assertCards();
  const tiny = scope(page).getByRole("button", { name: /^Choose Earth Structure & Folding\./ });
  await tiny.focus();
  await page.keyboard.press("Enter");
  await matching(page, 173); // 172 Environment questions + one independent tiny branch.
});

for (const width of [390, 768, 1024, 1600]) {
  test(`at ${width}px, ancestry and summary remain readable without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await geomorphology(page);
    const path = page.getByRole("navigation", { name: "Current syllabus path" });
    await expect(path).toContainText("Geography");
    await expect(path).toContainText("Physical Geography");
    await expect(path).toContainText(GEOMORPHOLOGY);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    if (width < 1100) {
      await expect(page.locator(".scope-flow-mobile")).toBeVisible();
      await expect(page.locator(".scope-mobile-bar")).toContainText("140 matching");
      await expect(page.locator(".scope-flow-scroll")).toBeHidden();
      await expect(page.locator(".scope-mobile-level").first()).toBeVisible();
      await page.getByRole("button", { name: "Diagram view" }).click();
      const diagram = page.locator(".scope-flow-scroll");
      await expect(diagram).toBeVisible();
      const activeInView = await diagram.locator('.scope-flow-node [aria-current="true"]').evaluate((button) => {
        const node = button.closest<HTMLElement>(".scope-flow-node")!;
        const container = button.closest<HTMLElement>(".scope-flow-scroll")!;
        const nodeRect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return nodeRect.left >= containerRect.left - 2 && nodeRect.right <= containerRect.right + 2;
      });
      expect(activeInView).toBe(true);
      await page.getByRole("button", { name: "List view" }).click();
      await expect(page.locator(".scope-flow-mobile")).toBeVisible();
    }
    const earthquake = scope(page).getByRole("button", { name: /^Choose Earthquakes, Volcanoes & Geological Hazards\./ });
    const box = await earthquake.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await earthquake.focus();
    await expect(earthquake).toBeFocused();
    await page.keyboard.press("Enter");
    await matching(page, 23);
    const font = await scope(page).locator(".scope-flow-node-label").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(font).toBeGreaterThanOrEqual(13);
  });
}

test("reduced-motion users can refine and navigate with the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const subject = page.getByRole("button", { name: /^Geography\b/ }).first();
  await subject.focus();
  await page.keyboard.press("Enter");
  await matching(page, 1021);
  const physical = scope(page).getByRole("button", { name: /^Choose Physical Geography\./ });
  await physical.focus();
  await page.keyboard.press("Enter");
  await matching(page, 363);
  await expect(page.getByRole("heading", { name: "Physical Geography", exact: true }).first()).toBeFocused();
  await choose(page, GEOMORPHOLOGY);
  await matching(page, 140);
});
