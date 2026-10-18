import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Question library" })).toBeVisible();
  await expect(page.locator(".scope-library-browser").getByRole("button", { name: "Open Geography sections without changing your selection" })).toBeEnabled();
});

test("browsing stays separate from the committed selection", async ({ page }) => {
  const syllabus = page.getByRole("navigation", { name: "Syllabus" });
  const summary = page.locator(".scope-test-summary");
  const browser = page.locator(".scope-library-browser");

  await expect(syllabus).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Geography", exact: true })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Environment", exact: true })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Polity", exact: true })).toBeVisible();
  await expect(syllabus.locator(".scope-syllabus-check")).toHaveCount(0);
  await expect(page.locator(".scope-breadcrumbs")).toHaveCount(0);
  await expect(summary.getByTestId("test-scope-label")).toContainText("Full library");
  await expect(summary.getByTestId("test-scope-label")).toContainText("Question library");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("1,210");
  await expect(summary.getByRole("button", { name: "Set up full library test" })).toBeEnabled();

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await expect(browser.getByRole("heading", { name: "Sections" })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Geography", exact: true })).toHaveAttribute("aria-current", "location");
  for (const section of ["Physical Geography", "Human & Economic Geography", "Indian Geography", "World Geography", "Other Geography"]) {
    await expect(syllabus.getByRole("button", { name: section, exact: true })).toBeVisible();
  }
  await expect(syllabus.locator(".scope-syllabus-check")).toHaveCount(0);
  await expect(summary.getByTestId("test-scope-label")).toContainText("Full subject");
  await expect(summary.getByTestId("test-scope-label")).toContainText("Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("1,021");
  await expect(summary.getByRole("button", { name: "Set up full subject test" })).toBeEnabled();

  await browser.getByRole("button", { name: "Use Indian Geography as the test scope. 402 questions available." }).click();
  await expect(syllabus.getByRole("button", { name: "Remove Indian Geography from selection" })).toBeVisible();
  await expect(syllabus.locator(".scope-syllabus-check")).toHaveCount(1);
  await expect(summary.getByTestId("test-scope-label")).toContainText("Selected syllabus");
  await expect(summary.getByTestId("test-scope-label")).toContainText("Indian Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("402");
  await expect(summary.getByRole("button", { name: "Set up selected test" })).toBeEnabled();

  await syllabus.getByRole("button", { name: "Physical Geography", exact: true }).click();
  await expect(syllabus.getByRole("button", { name: "Physical Geography", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(syllabus.getByRole("button", { name: "Remove Indian Geography from selection" })).toBeVisible();
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("402");

  await syllabus.getByRole("button", { name: "Geography", exact: true }).click();
  await browser.getByRole("button", { name: "Use Physical Geography as the test scope. 363 questions available." }).click();
  await expect(syllabus.getByRole("button", { name: "Remove Physical Geography from selection" })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Remove Indian Geography from selection" })).toHaveCount(0);
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("363");

  const chapter = "Latitudes, Longitudes, Time and Motions of the Earth";
  await browser.getByRole("button", { name: `Open ${chapter} subparts without changing your selection` }).click();
  await expect(syllabus.getByRole("button", { name: chapter, exact: true })).toHaveAttribute("aria-current", "location");
  await expect(syllabus.getByRole("button", { name: "Rotation and Time", exact: true })).toBeVisible();
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("363");

  await syllabus.getByRole("button", { name: "Subjects" }).click();
  await browser.getByRole("button", { name: "Use Polity as the test scope. 17 questions available." }).click();
  await expect(syllabus.getByRole("button", { name: "Remove Polity from selection" })).toBeVisible();
  await expect(syllabus.getByRole("button", { name: "Remove Physical Geography from selection" })).toHaveCount(0);
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("17");
});

test("the empty selection offers and commits the full browsed scope", async ({ page }) => {
  const syllabus = page.getByRole("navigation", { name: "Syllabus" });
  const summary = page.locator(".scope-test-summary");
  const browser = page.locator(".scope-library-browser");

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await browser.getByRole("button", { name: "Open Physical Geography chapters without changing your selection" }).click();

  await expect(syllabus.locator(".scope-syllabus-check")).toHaveCount(0);
  await expect(summary.getByTestId("test-scope-label")).toContainText("Full section");
  await expect(summary.getByTestId("test-scope-label")).toContainText("Physical Geography");
  await expect(summary.getByTestId("matching-count").locator("strong")).toHaveText("363");

  await summary.getByRole("button", { name: "Set up full section test" }).click();
  await expect(syllabus.getByRole("button", { name: "Remove Physical Geography from selection" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "How would you like to attempt these questions?" })).toContainText("363 questions");
});

test("chapter cards keep both actions compact and distinct", async ({ page }) => {
  const browser = page.locator(".scope-library-browser");
  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await browser.getByRole("button", { name: "Open Physical Geography chapters without changing your selection" }).click();

  const cards = browser.locator(".scope-card");
  await expect(cards).toHaveCount(11);
  await expect(browser.locator(".scope-card-actions")).toHaveCount(0);
  await expect(cards.first().locator(".scope-card-main > .scope-card-select")).toBeVisible();
  await expect(cards.first().locator(".scope-card-main > .scope-card-open")).toBeVisible();

  const metrics = await cards.evaluateAll((nodes) => nodes.map((node) => {
    const card = node.getBoundingClientRect();
    const select = node.querySelector<HTMLElement>(".scope-card-select")!.getBoundingClientRect();
    const open = node.querySelector<HTMLElement>(".scope-card-open")!.getBoundingClientRect();
    return { height: card.height, selectWidth: select.width, selectHeight: select.height, openWidth: open.width, openHeight: open.height };
  }));
  expect(Math.max(...metrics.map(({ height }) => height))).toBeLessThan(190);
  for (const metric of metrics) {
    expect(metric.selectWidth).toBeGreaterThanOrEqual(44);
    expect(metric.selectHeight).toBeGreaterThanOrEqual(44);
    expect(metric.openWidth).toBeGreaterThanOrEqual(44);
    expect(metric.openHeight).toBeGreaterThanOrEqual(44);
  }
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

test("the full syllabus hierarchy is compact on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: /Syllabus/ });
  const syllabus = page.getByRole("navigation", { name: "Syllabus" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(syllabus).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(syllabus).toBeVisible();
  await syllabus.getByRole("button", { name: "Geography", exact: true }).click();
  await expect(syllabus.getByRole("button", { name: "Physical Geography", exact: true })).toBeVisible();
});

test("clicking the current syllabus level again folds it", async ({ page }) => {
  const browser = page.locator(".scope-library-browser");
  const syllabus = page.getByRole("navigation", { name: "Syllabus" });
  const geography = syllabus.getByRole("button", { name: "Geography", exact: true });

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await expect(geography).toHaveAttribute("aria-current", "location");
  await expect(geography).toHaveAttribute("aria-expanded", "true");
  await expect(syllabus.getByRole("button", { name: "Physical Geography", exact: true })).toBeVisible();

  await geography.click();
  await expect(syllabus.getByRole("button", { name: "Subjects" })).toHaveAttribute("aria-current", "location");
  await expect(geography).toHaveAttribute("aria-expanded", "false");
  await expect(syllabus.getByRole("button", { name: "Physical Geography", exact: true })).toHaveCount(0);
  await expect(browser.getByRole("heading", { name: "Subjects", exact: true })).toBeVisible();

  await geography.click();
  const physical = syllabus.getByRole("button", { name: "Physical Geography", exact: true });
  await physical.click();
  await expect(physical).toHaveAttribute("aria-current", "location");
  await expect(physical).toHaveAttribute("aria-expanded", "true");
  await expect(syllabus.getByRole("button", { name: "Universe, Solar System, Shape and Size of Earth", exact: true })).toBeVisible();

  const chapter = syllabus.getByRole("button", { name: "Latitudes, Longitudes, Time and Motions of the Earth", exact: true });
  await chapter.click();
  await expect(chapter).toHaveAttribute("aria-current", "location");
  await expect(chapter).toHaveAttribute("aria-expanded", "true");
  await expect(syllabus.getByRole("button", { name: "Rotation and Time", exact: true })).toBeVisible();

  await chapter.click();
  await expect(physical).toHaveAttribute("aria-current", "location");
  await expect(chapter).toHaveAttribute("aria-expanded", "false");
  await expect(syllabus.getByRole("button", { name: "Rotation and Time", exact: true })).toHaveCount(0);

  await physical.click();
  await expect(geography).toHaveAttribute("aria-current", "location");
  await expect(physical).toHaveAttribute("aria-expanded", "false");
  await expect(syllabus.getByRole("button", { name: "Universe, Solar System, Shape and Size of Earth", exact: true })).toHaveCount(0);

  await browser.getByRole("button", { name: "Use Indian Geography as the test scope. 402 questions available." }).click();
  const indian = syllabus.getByRole("button", { name: "Indian Geography", exact: true });
  await expect(indian).toHaveAttribute("aria-current", "location");
  await expect(page.locator(".scope-test-summary").getByTestId("matching-count").locator("strong")).toHaveText("402");

  await indian.click();
  await expect(geography).toHaveAttribute("aria-current", "location");
  await expect(syllabus.getByRole("button", { name: "Remove Indian Geography from selection" })).toBeVisible();
  await expect(page.locator(".scope-test-summary").getByTestId("matching-count").locator("strong")).toHaveText("402");
});

test("exam sources use the clear two-by-two card layout", async ({ page }) => {
  const browser = page.locator(".scope-library-browser");

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await browser.getByRole("button", { name: "Use Indian Geography as the test scope. 402 questions available." }).click();

  const sourceRail = page.locator(".scope-syllabus-rail .scope-sources-rail");
  const cards = sourceRail.getByRole("checkbox");
  await expect(sourceRail.getByRole("heading", { name: "Exam sources" })).toBeVisible();
  await expect(cards).toHaveCount(4);

  const metrics = await sourceRail.evaluate((rail) => {
    const sourceCards = [...rail.querySelectorAll<HTMLElement>(".scope-source")];
    const boxes = sourceCards.map((card) => card.getBoundingClientRect());
    const firstCardStyle = getComputedStyle(sourceCards[0]);
    const firstCheckStyle = getComputedStyle(sourceCards[0].querySelector<HTMLElement>(".scope-check")!);
    const firstCountStyle = getComputedStyle(sourceCards[0].querySelector<HTMLElement>(".scope-source-total strong")!);
    return {
      boxes: boxes.map(({ x, y, width, height }) => ({ x, y, width, height })),
      railOverflow: rail.scrollWidth - rail.clientWidth,
      borderWidth: Number.parseFloat(firstCardStyle.borderLeftWidth),
      borderColor: firstCardStyle.borderLeftColor,
      checkboxWidth: Number.parseFloat(firstCheckStyle.width),
      countSize: Number.parseFloat(firstCountStyle.fontSize),
      countColor: firstCountStyle.color,
    };
  });

  expect(Math.abs(metrics.boxes[0].y - metrics.boxes[1].y)).toBeLessThan(2);
  expect(Math.abs(metrics.boxes[2].y - metrics.boxes[3].y)).toBeLessThan(2);
  expect(metrics.boxes[2].y).toBeGreaterThan(metrics.boxes[0].y + 50);
  expect(Math.abs(metrics.boxes[0].x - metrics.boxes[2].x)).toBeLessThan(2);
  expect(metrics.railOverflow).toBeLessThanOrEqual(1);
  expect(metrics.boxes[0].height).toBeGreaterThanOrEqual(90);
  expect(metrics.borderWidth).toBeGreaterThanOrEqual(5);
  expect(metrics.checkboxWidth).toBeGreaterThanOrEqual(28);
  expect(metrics.countSize).toBeGreaterThanOrEqual(24);
  expect(metrics.countColor).toBe(metrics.borderColor);
  await expect(sourceRail.locator(".scope-source-state").first()).toBeHidden();
  await expect(sourceRail.locator(".scope-source-total small").first()).toBeHidden();
});

test("the selected scope opens the existing choose-mode-first setup", async ({ page }) => {
  const browser = page.locator(".scope-library-browser");
  const summary = page.locator(".scope-test-summary");

  await browser.getByRole("button", { name: "Open Geography sections without changing your selection" }).click();
  await browser.getByRole("button", { name: "Use Indian Geography as the test scope. 402 questions available." }).click();
  await summary.getByRole("button", { name: "Set up selected test" }).click();

  const dialog = page.getByRole("dialog", { name: "How would you like to attempt these questions?" });
  await expect(dialog).toContainText("402 questions");
  await dialog.getByRole("button", { name: /Take an online test/ }).click();
  await expect(dialog.getByRole("group", { name: "Exams to include" })).toBeVisible();
  await expect(dialog.getByRole("group", { name: "How many questions?" })).toBeVisible();
  await expect(dialog.getByRole("group", { name: "Time limit" })).toBeVisible();
});
