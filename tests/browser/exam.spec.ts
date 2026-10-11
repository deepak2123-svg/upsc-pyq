import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const EARTH = "Earth Interior, Rocks & Tectonics";
const GEO = "subject:geography";
const EARTH_ID = "subtopic:geography:physical-geography:geomorphology-earth-structure:earth-interior-rocks-tectonics";
const EXAMS = ["CSE", "CAPF", "CDS", "NDA"];
const COLORS = { CSE: "#2563eb", CAPF: "#b45309", CDS: "#0f766e", NDA: "#7c3aed" };
type FixtureQuestion = { id: string; exam: string; options: Record<string, string> };
type FixtureSnapshot = { id: string; questions: FixtureQuestion[]; recipe: Record<string, unknown> };
const records = JSON.parse(readFileSync(new URL("../../content/question-bank.json", import.meta.url), "utf8")) as { questions: { id: string; answer: string }[] };
const correctAnswer = (id: string) => records.questions.find((question) => question.id === id)!.answer;
const start = (page: Page) => page.locator(".scope-dock").getByRole("button", { name: /^Start / });
const choose = (page: Page, label: string) => page.locator(".scope-flow-scroll").getByRole("button", { name: new RegExp(`^Choose ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`) }).click();

async function fixture(page: Page, request: APIRequestContext, durationMinutes: number | null = null) {
  const response = await request.post("/api/practice-snapshots", {
    data: { version: 3, subjectIds: [GEO], paths: [{ subtopicId: EARTH_ID, exams: EXAMS }], count: 3, order: "newest", durationMinutes },
  });
  expect(response.status()).toBe(201);
  const snapshot = await response.json() as FixtureSnapshot;
  await page.evaluate(async ({ savedSnapshot, duration }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("upscpuraan-pyq", 2);
      open.onupgradeneeded = () => {
        const attempts = open.result.createObjectStore("attempts", { keyPath: "id" });
        attempts.createIndex("by-updated", "updatedAt");
        const bookmarks = open.result.createObjectStore("bookmarks", { keyPath: "questionId" });
        bookmarks.createIndex("by-saved", "savedAt");
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const now = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("attempts", "readwrite");
      transaction.objectStore("attempts").put({
        id: savedSnapshot.id, snapshot: savedSnapshot, status: "in_progress", currentIndex: 0,
        answers: {}, feedback: {}, elapsedSeconds: 0, startedAt: now, updatedAt: now,
        timingMode: "wall_clock", ...(duration ? { deadlineAt: new Date(Date.now() + duration * 60_000).toISOString() } : {}),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { savedSnapshot: snapshot, duration: durationMinutes });
  await page.goto(`/practice/${snapshot.id}`);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 3");
  return snapshot;
}

async function storedAttempt(page: Page, id: string) {
  return page.evaluate(async (attemptId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("upscpuraan-pyq", 2);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const value = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const get = database.transaction("attempts").objectStore("attempts").get(attemptId);
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    });
    database.close();
    return value;
  }, id);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build your practice." })).toBeVisible();
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:all") !== null);
});

test("sources live in the practice dock; four honest exam colors replace chart browse arrows", async ({ page, request }, testInfo) => {
  await page.getByRole("button", { name: /^Geography\b/ }).first().click();
  await expect(page.locator(".scope-dock .scope-sources")).toHaveCount(1);
  await expect(page.locator(".scope-workspace .scope-sources")).toHaveCount(1);
  await expect(page.locator(".scope-flow-browse")).toHaveCount(0);
  await expect(page.locator(".scope-flow")).not.toContainText("↗");
  const inventory = await (await request.get("/api/pyqs/inventory")).json();
  const geo = inventory.subjects.find((subject: { id: string }) => subject.id === GEO);
  for (const exam of EXAMS) {
    await expect(page.locator(".scope-flow-legend")).toContainText(exam);
    await expect(page.locator(".scope-dock .scope-sources").getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) })).toBeChecked();
    const ribbons = page.locator(`.scope-flow-scroll path[data-exam="${exam}"][data-layer="available"][data-source-id="${GEO}"]`);
    const lanes = await ribbons.evaluateAll((paths) => paths.map((path) => ({ color: path.getAttribute("stroke"), count: Number((path as SVGElement).dataset.questionCount) })));
    expect(lanes.length).toBeGreaterThan(0);
    expect(lanes.every((lane) => lane.color === COLORS[exam as keyof typeof COLORS])).toBe(true);
    expect(lanes.reduce((sum, lane) => sum + lane.count, 0)).toBe(geo.examCounts[exam]);
  }
  const geometry = await page.locator('path[data-layer="available"]').evaluateAll((paths) => paths.map((path) => ({ d: path.getAttribute("d"), width: path.getAttribute("stroke-width") })));
  await page.locator(".scope-sources").getByRole("checkbox", { name: /^NDA\b/ }).click();
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText((1021 - geo.examCounts.NDA).toLocaleString("en-IN"));
  await expect(page.locator('path[data-exam="NDA"][data-layer="selected"]')).toHaveCount(0);
  expect(await page.locator('path[data-layer="available"]').evaluateAll((paths) => paths.map((path) => ({ d: path.getAttribute("d"), width: path.getAttribute("stroke-width") })))).toEqual(geometry);
  await page.locator(".scope-builder-layout").evaluate((layout) => {
    window.scrollTo(0, layout.getBoundingClientRect().top + window.scrollY - 100);
  });
  await expect(start(page)).toBeInViewport();
  const button = await start(page).boundingBox();
  expect(button!.y).toBeGreaterThanOrEqual(0);
  expect(button!.y + button!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.locator(".scope-dock-body").evaluate((body) => { body.scrollTop = body.scrollHeight; });
  await expect(start(page)).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("practice-dock.png"), fullPage: false });
});

test("test duration defaults to untimed and survives draft reload and snapshot creation", async ({ page }) => {
  const duration = page.getByRole("combobox", { name: "Test duration", exact: true });
  await expect(duration).toHaveValue("untimed");
  await page.getByRole("button", { name: /^Geography\b/ }).first().click();
  await choose(page, "Physical Geography");
  await choose(page, "Geomorphology & Earth Structure");
  await choose(page, EARTH);
  await duration.selectOption("20");
  await page.reload();
  await expect(duration).toHaveValue("20");
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("41");
  await duration.selectOption("custom");
  const minutes = page.getByRole("spinbutton", { name: "Minutes", exact: true });
  for (const value of ["0", "1.5", "721"]) {
    await minutes.fill(value);
    await expect(start(page)).toBeDisabled();
    await expect(page.getByRole("alert")).toContainText("Choose a whole number of minutes from 1 to 720.");
  }
  await minutes.fill("15");
  await expect(start(page)).toBeEnabled();
  await page.reload();
  await expect(duration).toHaveValue("custom");
  await expect(minutes).toHaveValue("15");
  await duration.selectOption("20");
  const created = page.waitForResponse((response) => response.url().endsWith("/api/practice-snapshots") && response.request().method() === "POST");
  await start(page).click();
  const snapshot = await (await created).json();
  expect(snapshot.recipe.durationMinutes).toBe(20);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 20");
  const saved = await storedAttempt(page, snapshot.id);
  expect(Date.parse(saved.deadlineAt as string) - Date.parse(saved.startedAt as string)).toBe(20 * 60_000);
  await expect(page.locator(".practice-topbar")).toContainText("Practice");
});

test("Exit restores the exam-specific builder's scope, sources, size and duration", async ({ page }) => {
  await page.goto("/exams/CSE");
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:CSE") !== null);
  await page.getByRole("button", { name: /^Geography\b/ }).first().click();
  await choose(page, "Physical Geography");
  await choose(page, "Geomorphology & Earth Structure");
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("12");
  await page.locator(".scope-size-options").getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("combobox", { name: "Test duration", exact: true }).selectOption("20");
  await start(page).click();
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 12");
  await page.getByRole("link", { name: "Exit practice", exact: true }).click();
  await expect(page).toHaveURL(/\/exams\/CSE$/);
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("12");
  await expect(page.getByRole("navigation", { name: "Current syllabus path" })).toContainText("Physical Geography");
  await expect(page.getByRole("navigation", { name: "Current syllabus path" })).toContainText("Geomorphology & Earth Structure");
  await expect(page.locator(".scope-size-options").getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Test duration", exact: true })).toHaveValue("20");
  await expect(page.locator(".scope-sources").getByRole("checkbox", { name: /^CSE\b/ })).toBeChecked();
  for (const exam of ["CAPF", "CDS", "NDA"]) await expect(page.locator(".scope-sources").getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) })).not.toBeChecked();
});

test("answers remain editable and hidden until submission; result sheet grades answered and skipped questions", async ({ page, request }, testInfo) => {
  const calls: string[] = [];
  page.on("request", (response) => { if (/\/api\/practice\/(check|grade)$/.test(response.url())) calls.push(response.url()); });
  const snapshot = await fixture(page, request);
  const first = snapshot.questions[0];
  const second = snapshot.questions[1];
  const firstCorrect = correctAnswer(first.id);
  const firstWrong = Object.keys(first.options).find((option) => option !== firstCorrect)!;
  const options = page.getByRole("group", { name: "Answer options" });
  await options.getByRole("button", { name: new RegExp(`^${firstWrong}\\b`) }).click();
  await expect(options.locator("button.selected")).toContainText(firstWrong);
  await page.getByRole("button", { name: "Clear answer", exact: true }).click();
  await expect(options.locator("button.selected")).toHaveCount(0);
  await expect(page.locator(".practice-topbar")).toContainText("0 of 3 answered");
  await options.getByRole("button", { name: new RegExp(`^${firstCorrect}\\b`) }).click();
  await expect(options.locator("button.selected")).toContainText(firstCorrect);
  await page.reload();
  await expect(options.locator("button.selected")).toContainText(firstCorrect);
  await expect(options.locator("button.correct, button.incorrect")).toHaveCount(0);
  await expect(page.locator(".answer-feedback")).toHaveCount(0);
  await expect(page.locator(".practice-topbar")).toContainText("1 of 3 answered");
  await expect(page.locator(".practice-topbar")).not.toContainText(first.exam);
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: /^Next\b/ }).click();
  await expect(page.locator(".question-heading")).toContainText("Question 2 of 3");
  const secondWrong = Object.keys(second.options).find((option) => option !== correctAnswer(second.id))!;
  await options.getByRole("button", { name: new RegExp(`^${secondWrong}\\b`) }).focus();
  await page.keyboard.press("Enter");
  expect(calls).toEqual([]);
  const graded = page.waitForResponse((response) => response.url().endsWith("/api/practice/grade"));
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  expect((await graded).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Result sheet", exact: true })).toBeVisible();
  await expect(page.getByText("Practice complete", { exact: true })).toBeVisible();
  const sheet = page.getByRole("table", { name: "Answer sheet", exact: true });
  await expect(sheet.getByRole("row")).toHaveCount(4);
  await expect(sheet).toContainText("Correct answer");
  await expect(sheet.getByRole("row").nth(1)).toContainText("Correct");
  await expect(sheet.getByRole("row").nth(2)).toContainText("Incorrect");
  await expect(sheet.getByRole("row").nth(3)).toContainText("Unattempted");
  await expect(page.locator(".result-summary")).toContainText("50%");
  await expect(page.locator(".result-summary")).toContainText("Correct");
  await expect(page.getByRole("heading", { name: "Performance by exam source", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Performance by subject and topic", exact: true })).toBeVisible();
  const examTable = page.getByRole("table", { name: "Exam source performance", exact: true });
  const selectedExams = [...new Set(snapshot.questions.map((question) => question.exam))];
  await expect(examTable.getByRole("row")).toHaveCount(selectedExams.length + 1);
  for (const exam of selectedExams) {
    const count = snapshot.questions.filter((question) => question.exam === exam).length;
    const correct = Number(first.exam === exam);
    const incorrect = Number(second.exam === exam);
    const answered = correct + incorrect;
    const row = examTable.getByRole("row").filter({ has: page.getByRole("rowheader", { name: exam, exact: true }) });
    await expect(row.getByRole("cell")).toHaveText([String(count), String(answered), String(correct), String(incorrect), String(count - answered), answered ? `${Math.round(correct / answered * 100)}%` : "—"]);
  }
  const topicTable = page.getByRole("table", { name: "Subject and topic performance", exact: true });
  await expect(topicTable).toContainText("Geography");
  await expect(topicTable).toContainText("Geomorphology & Earth Structure");
  await expect(topicTable.getByRole("row").nth(1).getByRole("cell")).toHaveText(["3", "2", "1", "1", "1", "50%"]);
  const saved = await storedAttempt(page, snapshot.id);
  expect(saved.status).toBe("completed");
  expect(saved.answers).toEqual({ [first.id]: firstCorrect, [second.id]: secondWrong });
  expect(Object.keys(saved.feedback as object)).toHaveLength(3);
  await expect(page.getByRole("button", { name: "Print result sheet", exact: true })).toBeVisible();
  await page.evaluate(() => { (window as unknown as { printed: boolean }).printed = false; window.print = () => { (window as unknown as { printed: boolean }).printed = true; }; });
  await page.getByRole("button", { name: "Print result sheet", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("result-sheet.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  await expect(sheet).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("result-sheet-print.png"), fullPage: true });
});

test("an unfinished attempt cannot reveal its answer sheet through the results URL", async ({ page, request }) => {
  const calls: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith("/api/practice/grade")) calls.push(request.url()); });
  const snapshot = await fixture(page, request);
  await page.goto(`/practice/${snapshot.id}/results`);
  await expect(page.getByRole("table", { name: "Answer sheet" })).toHaveCount(0);
  await expect(page.getByText(/Continue practice|Return to practice/)).toBeVisible();
  expect(calls).toEqual([]);
});

test("a countdown retains its deadline on reload and submits when wall-clock time expires", async ({ page, request }) => {
  await page.clock.install();
  const snapshot = await fixture(page, request, 1);
  const original = await storedAttempt(page, snapshot.id);
  await page.clock.fastForward(20_000);
  await page.reload();
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 3");
  const resumed = await storedAttempt(page, snapshot.id);
  expect(resumed.deadlineAt).toBe(original.deadlineAt);
  await page.clock.fastForward(45_000);
  await expect(page.getByRole("heading", { name: "Result sheet", exact: true })).toBeVisible();
  await expect(page.getByText(/Time expired/, { exact: false }).first()).toBeVisible();
  const completed = await storedAttempt(page, snapshot.id);
  expect(completed.status).toBe("completed");
  expect(completed.completionReason).toBe("time_expired");
  expect(completed.elapsedSeconds).toBe(60);
  await expect(page.getByRole("table", { name: "Answer sheet" }).getByRole("row")).toHaveCount(4);
});

test("failed final grading retains submitted answers and permits a results retry", async ({ page, request }) => {
  const snapshot = await fixture(page, request);
  const first = snapshot.questions[0];
  await page.getByRole("group", { name: "Answer options" }).getByRole("button", { name: new RegExp(`^${correctAnswer(first.id)}\\b`) }).click();
  let failures = 0;
  await page.route("**/api/practice/grade", async (route) => {
    failures += 1;
    if (failures === 1) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Result service unavailable. Please retry." }) });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Result service unavailable");
  const saved = await storedAttempt(page, snapshot.id);
  expect(saved.status).toBe("completed");
  expect(saved.answers).toEqual({ [first.id]: correctAnswer(first.id) });
  await page.getByRole("button", { name: /Retry/i }).click();
  await expect(page.getByRole("table", { name: "Answer sheet" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Answer sheet" }).getByRole("row").nth(1)).toContainText("Correct");
});

test("expired submission stays recoverable when browser storage fails", async ({ page, request }) => {
  await page.clock.install();
  const calls: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith("/api/practice/grade")) calls.push(request.url()); });
  const snapshot = await fixture(page, request, 1);
  const first = snapshot.questions[0];
  await page.getByRole("group", { name: "Answer options" }).getByRole("button", { name: new RegExp(`^${correctAnswer(first.id)}\\b`) }).click();
  await page.evaluate(() => {
    const state = window as unknown as { failPracticeSaves: boolean };
    state.failPracticeSaves = true;
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof originalPut>) {
      if (this.name === "attempts" && state.failPracticeSaves) throw new DOMException("Storage unavailable", "QuotaExceededError");
      return originalPut.apply(this, args);
    };
  });
  await page.clock.fastForward(65_000);
  await expect(page.getByRole("alert")).toContainText("Your submission could not be saved");
  await expect(page).toHaveURL(new RegExp(`/practice/${snapshot.id}$`));
  await expect(page.getByRole("table", { name: "Answer sheet" })).toHaveCount(0);
  for (const button of await page.getByRole("group", { name: "Answer options" }).getByRole("button").all()) await expect(button).toBeDisabled();
  expect(calls).toEqual([]);
  await page.evaluate(() => { (window as unknown as { failPracticeSaves: boolean }).failPracticeSaves = false; });
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(page.getByRole("table", { name: "Answer sheet" })).toBeVisible();
  const saved = await storedAttempt(page, snapshot.id);
  expect(saved.status).toBe("completed");
  expect(saved.completionReason).toBe("time_expired");
  expect(saved.elapsedSeconds).toBe(60);
  expect(saved.answers).toEqual({ [first.id]: correctAnswer(first.id) });
});

for (const width of [390, 768, 1024, 1600]) {
  test(`practice and result sheet remain readable at ${width}px`, async ({ page, request }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await fixture(page, request);
    const reading = await page.locator(".practice-question h1").evaluate((element) => {
      const style = getComputedStyle(element);
      return { font: style.fontFamily, size: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
    });
    expect(reading.size).toBeGreaterThanOrEqual(18);
    expect(reading.lineHeight / reading.size).toBeGreaterThanOrEqual(1.5);
    expect(reading.font.toLowerCase()).toContain("serif");
    expect(reading.font).not.toMatch(/\bsans-serif\b/);
    const choiceFont = await page.getByRole("group", { name: "Answer options" }).locator("button strong").first().evaluate((element) => getComputedStyle(element).fontFamily);
    expect(choiceFont.toLowerCase()).toContain("serif");
    expect(choiceFont).not.toMatch(/\bsans-serif\b/);
    for (const button of await page.getByRole("group", { name: "Answer options" }).getByRole("button").all()) {
      expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`practice-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(page.getByRole("table", { name: "Answer sheet" })).toBeVisible();
    if (width < 600) await expect(page.getByText("Swipe to view all columns.", { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`results-${width}.png`), fullPage: true });
  });
}
