import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Question library" })).toBeVisible();
  await expect(page.locator(".scope-library-browser").getByRole("button", { name: "Open Geography sections without changing your selection" })).toBeEnabled();
});

test("browsing stays separate from the committed selection", async ({ page }) => {
  const selection = page.locator(".scope-selection-rail");
  const summary = page.locator(".scope-test-summary");
  const browser = page.locator(".scope-library-browser");

  await expect(selection).toHaveCount(0);
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("0");
  await expect(summary.getByRole("button", { name: "Set up test" })).toBeDisabled();

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await expect(browser.getByRole("heading", { name: "Sections" })).toBeVisible();
  await expect(selection).toHaveCount(0);
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("0");

  await browser.getByRole("button", { name: "Select Indian Geography. 402 questions available." }).click();
  await expect(selection).toHaveCount(1);
  await expect(selection).toContainText("Indian Geography");
  await expect(selection).not.toContainText("Human & Economic Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("402");
  await expect(summary.getByRole("button", { name: "Set up test" })).toBeEnabled();
  const openSelection = selection.getByRole("button", { name: "Open Indian Geography in syllabus" });
  await expect(openSelection).toBeVisible();
  await expect(openSelection).toHaveText("Open");
  expect(await openSelection.evaluate((button) => button.scrollWidth <= button.clientWidth + 1)).toBe(true);
  expect(await selection.locator(".scope-selection-list").evaluate((list) => list.scrollHeight <= list.clientHeight + 1)).toBe(true);

  await browser.getByRole("button", { name: "Back" }).click();
  await browser.getByRole("button", { name: "Select Physical Geography. 363 questions available." }).click();
  await expect(selection).toContainText("Physical Geography");
  await expect(selection).not.toContainText("Indian Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("363");

  await browser.getByRole("button", { name: "All subjects" }).click();
  await browser.getByRole("button", { name: "Select Polity. 17 questions available." }).click();
  await expect(selection).toContainText("Polity");
  await expect(selection).not.toContainText("Physical Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("17");
});

test("exam archive cards show only that exam's inventory", async ({ page }) => {
  await page.goto("/exams/CSE");
  await expect(page.getByRole("heading", { name: "CSE question library" })).toBeVisible();

  const geography = page.locator(".scope-card").filter({ has: page.getByRole("heading", { name: "Geography" }) });
  await expect(geography.locator(".scope-card-source-counts [data-exam]")).toHaveCount(1);
  await expect(geography.locator(".scope-card-source-counts [data-exam=\"CSE\"]")).toBeVisible();
  await expect(geography.locator(".scope-card-source-counts [data-exam=\"CAPF\"]")).toHaveCount(0);
});

test("the homepage relies on controls instead of instructional prose", async ({ page }) => {
  const main = page.getByRole("main");
  for (const phrase of [
    "Browse freely",
    "explicitly select",
    "Opening a level",
    "selection unchanged",
    "Select adds",
    "Open only",
    "Question count, time",
    "Choose MCQs and time next",
  ]) {
    await expect(main.getByText(phrase, { exact: false })).toHaveCount(0);
  }
});

test("the selected scope opens the existing choose-mode-first setup", async ({ page }) => {
  const browser = page.locator(".scope-library-browser");
  const summary = page.locator(".scope-test-summary");

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await browser.getByRole("button", { name: "Select Indian Geography. 402 questions available." }).click();
  await summary.getByRole("button", { name: "Set up test" }).click();

  const dialog = page.getByRole("dialog", { name: "How would you like to attempt these questions?" });
  await expect(dialog).toContainText("402 questions");
  await dialog.getByRole("button", { name: /Take an online test/ }).click();
  await expect(dialog.getByRole("group", { name: "Exams to include" })).toBeVisible();
  await expect(dialog.getByRole("group", { name: "How many questions?" })).toBeVisible();
  await expect(dialog.getByRole("group", { name: "Time limit" })).toBeVisible();
});
