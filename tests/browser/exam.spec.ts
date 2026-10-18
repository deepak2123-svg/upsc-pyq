import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const CHAPTER = "Universe, Solar System, Shape and Size of Earth";
const GEO = "subject:geography";
const EARTH_ID = "subtopic:geography:physical-geography:universe-solar-system-shape-and-size-of-earth:planets";
const EXAMS = ["CSE", "CAPF", "CDS", "NDA"];
const COLORS = { CSE: "#2563eb", CAPF: "#b45309", CDS: "#0f766e", NDA: "#7c3aed" };
type FixtureQuestion = { id: string; exam: string; options: Record<string, string> };
type FixtureSnapshot = { id: string; questions: FixtureQuestion[]; recipe: Record<string, unknown> };
const records = JSON.parse(readFileSync(new URL("../../content/question-bank.json", import.meta.url), "utf8")) as { questions: { id: string; answer: string }[] };
const correctAnswer = (id: string) => records.questions.find((question) => question.id === id)!.answer;
const start = (page: Page) => page.locator(".practice-setup-dialog .confirm-practice");
const choose = (page: Page, label: string) => page.locator(".scope-cards").getByRole("button", { name: `Open ${label}`, exact: true }).click();

async function openOnlineSetup(page: Page) {
  await page.locator(".scope-test-summary .start-practice").click();
  const dialog = page.getByRole("dialog", { name: "How would you like to attempt these questions?" });
  await dialog.getByRole("button", { name: /Take an online test/ }).click();
  return dialog;
}

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
  await expect(page.getByRole("heading", { name: "Question library" })).toBeVisible();
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:all") !== null);
});

test("sources live in the test panel with four honest exam colors", async ({ page, request }, testInfo) => {
  await choose(page, "Geography");
  await expect(page.locator(".scope-dock .scope-sources")).toHaveCount(1);
  await expect(page.locator(".scope-workspace .scope-sources")).toHaveCount(1);
  await expect(page.locator(".scope-card-grid")).toBeVisible();
  await expect(page.locator(".scope-cards")).not.toContainText("↗");
  const inventory = await (await request.get("/api/pyqs/inventory")).json();
  const geo = inventory.subjects.find((subject: { id: string }) => subject.id === GEO);
  const sourceRail = page.locator(".scope-test-summary .scope-sources");
  for (const exam of EXAMS) {
    await expect(sourceRail).toContainText(exam);
    await expect(sourceRail.getByRole("button", { name: new RegExp(`^${exam}\\b`) })).toHaveAttribute("aria-pressed", "true");
    const sources = page.locator(`.scope-card-source-counts span[data-exam="${exam}"]`);
    expect(await sources.count()).toBeGreaterThan(0);
    const values = await sources.allTextContents();
    expect(values.reduce((sum, value) => sum + Number(value.match(/[\d,]+$/)?.[0].replaceAll(",", "") || 0), 0)).toBe(geo.examCounts[exam]);
    const colors = await sources.locator("i").evaluateAll((dots) => dots.map((dot) => (dot as HTMLElement).style.getPropertyValue("--exam-color")));
    expect(colors.every((color) => color === COLORS[exam as keyof typeof COLORS])).toBe(true);
  }
  const cardOrder = await page.locator(".scope-card").evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset.scopeId));
  await sourceRail.getByRole("button", { name: /^NDA\b/ }).click();
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText((1021 - geo.examCounts.NDA).toLocaleString("en-IN"));
  expect(await page.locator(".scope-card").evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset.scopeId))).toEqual(cardOrder);
  await page.locator(".scope-library-layout").evaluate((layout) => {
    window.scrollTo(0, layout.getBoundingClientRect().top + window.scrollY - 100);
  });
  const setupButton = page.locator(".scope-test-summary .start-practice");
  await expect(setupButton).toBeInViewport();
  const button = await setupButton.boundingBox();
  expect(button!.y).toBeGreaterThanOrEqual(0);
  expect(button!.y + button!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 3);
  await page.locator(".scope-dock-body").evaluate((body) => { body.scrollTop = body.scrollHeight; });
  await expect(setupButton).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("practice-dock.png"), fullPage: false });
});

test("test duration defaults to untimed and survives draft reload and snapshot creation", async ({ page }) => {
  await choose(page, "Geography");
  await choose(page, "Physical Geography");
  await choose(page, CHAPTER);
  let dialog = await openOnlineSetup(page);
  let timeOptions = dialog.getByRole("group", { name: "Time limit" });
  await expect(timeOptions.getByRole("button", { name: "No time limit", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("group", { name: "How many questions?" }).getByRole("button", { name: "20", exact: true }).click();
  await timeOptions.getByRole("button", { name: "20 min", exact: true }).click();
  await page.reload();
  dialog = await openOnlineSetup(page);
  timeOptions = dialog.getByRole("group", { name: "Time limit" });
  await expect(timeOptions.getByRole("button", { name: "20 min", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("28");
  await timeOptions.getByRole("button", { name: "Custom", exact: true }).click();
  let minutes = dialog.getByRole("spinbutton", { name: "Custom minutes", exact: true });
  for (const value of ["0", "1.5", "721"]) {
    await minutes.fill(value);
    await expect(start(page)).toBeDisabled();
    await expect(page.getByRole("alert")).toContainText("Enter 1–720 whole minutes.");
  }
  await minutes.fill("15");
  await expect(start(page)).toBeEnabled();
  await page.reload();
  dialog = await openOnlineSetup(page);
  timeOptions = dialog.getByRole("group", { name: "Time limit" });
  await expect(timeOptions.getByRole("button", { name: "Custom", exact: true })).toHaveAttribute("aria-pressed", "true");
  minutes = dialog.getByRole("spinbutton", { name: "Custom minutes", exact: true });
  await expect(minutes).toHaveValue("15");
  await timeOptions.getByRole("button", { name: "20 min", exact: true }).click();
  const created = page.waitForResponse((response) => response.url().endsWith("/api/practice-snapshots") && response.request().method() === "POST");
  await start(page).click();
  const snapshot = await (await created).json();
  expect(snapshot.recipe.durationMinutes).toBe(20);
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 20");
  const saved = await storedAttempt(page, snapshot.id);
  expect(Date.parse(saved.deadlineAt as string) - Date.parse(saved.startedAt as string)).toBe(20 * 60_000);
  await expect(page.locator(".practice-topbar")).not.toContainText("Practice");
  await expect(page.getByRole("complementary", { name: "Question palette" }).getByRole("button")).toHaveCount(20);
  const textSize = page.getByRole("group", { name: "Question text size" });
  await expect(textSize.getByRole("button", { name: "Default question text" })).toHaveAttribute("aria-pressed", "true");
  const defaultSize = await page.locator(".practice-question .practice-prompt").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  await textSize.getByRole("button", { name: "Large question text" }).click();
  expect(await page.locator(".practice-question .practice-prompt").evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(defaultSize);
  await page.reload();
  await expect(textSize.getByRole("button", { name: "Large question text" })).toHaveAttribute("aria-pressed", "true");
});

test("Exit restores the exam-specific builder's scope, sources, size and duration", async ({ page }) => {
  await page.goto("/exams/CSE");
  await page.waitForFunction(() => sessionStorage.getItem("upsc-pyq-builder:v3:CSE") !== null);
  await choose(page, "Geography");
  await choose(page, "Physical Geography");
  await choose(page, CHAPTER);
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("5");
  let dialog = await openOnlineSetup(page);
  await dialog.getByRole("group", { name: "How many questions?" }).getByRole("button", { name: "All 5", exact: true }).click();
  await dialog.getByRole("group", { name: "Time limit" }).getByRole("button", { name: "20 min", exact: true }).click();
  await start(page).click();
  await expect(page.locator(".question-heading")).toContainText("Question 1 of 5");
  await page.getByRole("link", { name: "Exit test", exact: true }).click();
  await expect(page).toHaveURL(/\/exams\/CSE$/);
  await expect(page.getByTestId("matching-count").locator("strong")).toHaveText("5");
  const syllabus = page.getByRole("navigation", { name: "Syllabus" });
  await expect(syllabus.getByRole("button", { name: "Physical Geography", exact: true })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: CHAPTER, exact: true })).toHaveAttribute("aria-current", "location");
  dialog = await openOnlineSetup(page);
  await expect(dialog.getByRole("group", { name: "How many questions?" }).getByRole("button", { name: "All 5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("group", { name: "Time limit" }).getByRole("button", { name: "20 min", exact: true })).toHaveAttribute("aria-pressed", "true");
  const exams = dialog.getByRole("group", { name: "Exams to include" });
  await expect(exams.getByRole("checkbox", { name: /^CSE\b/ })).toBeChecked();
  for (const exam of ["CAPF", "CDS", "NDA"]) await expect(exams.getByRole("checkbox", { name: new RegExp(`^${exam}\\b`) })).not.toBeChecked();
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
  const palette = page.getByRole("complementary", { name: "Question palette" });
  await expect(palette.getByRole("button")).toHaveCount(3);
  await expect(palette.getByRole("button", { name: /^Question 1,/ })).toHaveClass(/current/);
  await options.getByRole("button", { name: new RegExp(`^${firstWrong}\\b`) }).click();
  await expect(options.locator("button.selected")).toContainText(firstWrong);
  await expect(palette.getByRole("button", { name: /^Question 1,/ })).toHaveClass(/answered/);
  await page.getByRole("button", { name: "Clear answer", exact: true }).click();
  await expect(options.locator("button.selected")).toHaveCount(0);
  await expect(page.locator(".practice-topbar")).toContainText("0 answered");
  await options.getByRole("button", { name: new RegExp(`^${firstCorrect}\\b`) }).click();
  await expect(options.locator("button.selected")).toContainText(firstCorrect);
  await page.reload();
  await expect(options.locator("button.selected")).toContainText(firstCorrect);
  await expect(options.locator("button.correct, button.incorrect")).toHaveCount(0);
  await expect(page.locator(".answer-feedback")).toHaveCount(0);
  await expect(page.locator(".practice-topbar")).toContainText("1 answered");
  await expect(page.locator(".practice-topbar")).not.toContainText(first.exam);
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: /^Save & next\b/i }).click();
  await expect(page.locator(".question-heading")).toContainText("Question 2 of 3");
  await expect(palette.getByRole("button", { name: /^Question 2,/ })).toHaveClass(/current/);
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
  await expect(topicTable).toContainText(CHAPTER);
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

test("editing an old fully graded in-progress attempt invalidates cached feedback and grades the new answers", async ({ page, request }) => {
  const snapshot = await fixture(page, request);
  const answers = Object.fromEntries(snapshot.questions.map((question) => [question.id, correctAnswer(question.id)]));
  const previousGrading = await request.post("/api/practice/grade", { data: { questionIds: snapshot.questions.map((question) => question.id), answers } });
  expect(previousGrading.status()).toBe(200);
  const { feedback } = await previousGrading.json();
  expect(Object.values(feedback).every((item) => (item as { correct: boolean }).correct)).toBe(true);
  await page.evaluate(async ({ id, oldAnswers, oldFeedback }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("upscpuraan-pyq", 2);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("attempts", "readwrite");
      const store = transaction.objectStore("attempts");
      const get = store.get(id);
      get.onsuccess = () => {
        const legacy: Record<string, unknown> = { ...get.result, answers: oldAnswers, feedback: oldFeedback };
        const savedSnapshot = legacy.snapshot as Record<string, unknown>;
        legacy.snapshot = { ...savedSnapshot, recipe: { ...savedSnapshot.recipe as Record<string, unknown>, version: 2 } };
        delete legacy.timingMode;
        delete legacy.deadlineAt;
        delete legacy.returnPath;
        store.put(legacy);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { id: snapshot.id, oldAnswers: answers, oldFeedback: feedback });
  const calls: string[] = [];
  page.on("request", (request) => { if (/\/api\/practice\/(check|grade)$/.test(request.url())) calls.push(request.url()); });
  await page.reload();
  await expect(page.locator(".practice-topbar")).toContainText("3 answered");
  expect(Object.keys((await storedAttempt(page, snapshot.id)).feedback as object)).toHaveLength(3);
  const first = snapshot.questions[0];
  const wrong = Object.keys(first.options).find((option) => option !== correctAnswer(first.id))!;
  const options = page.getByRole("group", { name: "Answer options" });
  const changedOption = options.getByRole("button", { name: new RegExp(`^${wrong}\\b`) });
  await changedOption.click();
  await expect(changedOption).toBeEnabled();
  await expect(options.locator("button.selected")).toContainText(wrong);
  expect((await storedAttempt(page, snapshot.id)).feedback).toEqual({});
  await expect(page.locator(".answer-feedback")).toHaveCount(0);
  await expect(options.locator("button.correct, button.incorrect")).toHaveCount(0);
  expect(calls).toEqual([]);
  const graded = page.waitForResponse((response) => response.url().endsWith("/api/practice/grade"));
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const response = await graded;
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.correct).toBe(2);
  expect(result.incorrect).toBe(1);
  expect(result.unattempted).toBe(0);
  expect(response.request().postDataJSON().answers).toEqual({ ...answers, [first.id]: wrong });
  const sheet = page.getByRole("table", { name: "Answer sheet", exact: true });
  await expect(sheet.getByRole("row").nth(1)).toContainText("Incorrect");
  await expect(sheet.getByRole("row").nth(2)).toContainText("Correct");
  await expect(sheet.getByRole("row").nth(3)).toContainText("Correct");
  await expect(page.getByRole("table", { name: "Subject and topic performance", exact: true }).getByRole("row").nth(1).getByRole("cell")).toHaveText(["3", "3", "2", "1", "0", "67%"]);
  expect(calls).toHaveLength(1);
  expect(((await storedAttempt(page, snapshot.id)).feedback as Record<string, { correct: boolean }>)[first.id].correct).toBe(false);
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
    const paletteToggle = page.getByRole("button", { name: "Show all numbers", exact: true });
    if (width < 960) {
      await expect(paletteToggle).toBeVisible();
      await paletteToggle.click();
      await expect(page.getByRole("complementary", { name: "Question palette" }).getByRole("button", { name: /^Question 1,/ })).toBeVisible();
    } else {
      await expect(paletteToggle).toBeHidden();
    }
    const reading = await page.locator(".practice-question .practice-prompt").evaluate((element) => {
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
