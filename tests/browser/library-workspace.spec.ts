import { expect, test, type Page } from "@playwright/test";

const chapter = "Universe, Solar System, Shape and Size of Earth";
const browser = (page: Page) => page.locator(".scope-library-browser");
const summary = (page: Page) => page.locator(".scope-test-summary");
const open = (page: Page, name: string) => browser(page).getByRole("button", { name: `Open ${name}`, exact: true }).click();
const add = (page: Page, name: string) => browser(page).getByRole("button", { name: `Add to test: ${name}`, exact: true }).click();
const count = (page: Page) => summary(page).getByTestId("matching-count").locator("strong");
const heading = (page: Page) => browser(page).locator(".scope-cards-heading h3");
const physicalCount=async(page:Page)=>{
  const data=await(await page.request.get('/api/pyqs/inventory')).json();
  return data.nodes.find((node:{kind:string;label:string;legacyOnly?:boolean})=>node.kind==='head'&&node.label==='Physical Geography'&&!node.legacyOnly).questionCount as number;
};
const chapterUnionCount=async(page:Page,labels:string[],exams=['CSE','CAPF','CDS','NDA'])=>{
  const data=await(await page.request.get('/api/pyqs/inventory')).json();
  const topics=new Set(data.nodes.filter((node:{kind:string;label:string;legacyOnly?:boolean})=>node.kind==='topic'&&!node.legacyOnly&&labels.includes(node.label)).map((node:{id:string})=>node.id));
  expect(topics.size).toBe(labels.length);
  return new Set(data.nodes.filter((node:{kind:string;parentId:string;legacyOnly?:boolean})=>node.kind==='subtopic'&&!node.legacyOnly&&topics.has(node.parentId)).flatMap((node:{questionIdsByExam:Record<string,string[]>})=>exams.flatMap(exam=>node.questionIdsByExam[exam]||[]))).size;
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(browser(page).getByRole("button", { name: "Open Geography", exact: true })).toBeEnabled();
});

test("opening and folding folders never adds questions", async ({ page }) => {
  const tree = page.getByRole("navigation", { name: "Syllabus" });
  const inventory=await(await page.request.get('/api/pyqs/inventory')).json();
  await expect(count(page)).toHaveText(inventory.mappedCount.toLocaleString('en-IN'));
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await expect(heading(page)).toHaveText("Physical Geography");
  await expect(count(page)).toHaveText(String(await physicalCount(page)));
  await expect(summary(page).getByTestId("test-scope-label")).toContainText("Current folder");
  await expect(page.locator(".explorer-test-items li")).toHaveCount(0);
  await expect(tree.getByRole("region", { name: "Subject and section" })).toContainText("Geography");
  await expect(tree.getByRole("region", { name: "Chapters & subchapters" })).toBeVisible();
  await tree.getByRole("button", { name: chapter, exact: true }).click();
  await expect(tree.getByRole("button", { name: `Collapse ${chapter}`, exact: true })).toBeVisible();
  await tree.getByRole("button", { name: "Interior of the Earth", exact: true }).click();
  await expect(tree.getByRole("button", { name: `Expand ${chapter}`, exact: true })).toBeVisible();
  await expect(tree.getByRole("button", { name: "The Sun", exact: true })).toHaveCount(0);
  await tree.getByRole("button", { name: "Collapse Interior of the Earth", exact: true }).click();
  await expect(heading(page)).toHaveText("Interior of the Earth");
  await expect(browser(page).getByRole("checkbox")).toHaveCount(0);
  await expect(tree.getByRole("checkbox")).toHaveCount(0);
  await expect(browser(page).locator(".explorer-folder svg")).toHaveCount(0);
});

test("unnumbered chapters use the panel width and the library heading fits", async ({ page }, testInfo) => {
  await open(page, "Geography");
  await open(page, "Human & Economic Geography");
  const label = page.locator(".syllabus-chapters-panel .syllabus-node-label").first();
  for (const width of [1600, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width <= 820) await page.locator(".scope-syllabus-mobile-toggle").click();
    await expect(label).toBeVisible();
    const bounds = await label.boundingBox();
    expect(bounds!.width).toBeGreaterThan(100);
    expect(bounds!.height).toBeLessThan(70);
    if (width <= 820) await page.keyboard.press("Escape");
    const title = page.getByRole("heading", { name: "Question library", exact: true });
    const titleBounds = await title.boundingBox();
    expect(titleBounds!.x + titleBounds!.width).toBeLessThanOrEqual(width);
    expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath("human-geography-panel.png"), fullPage: false });
});

test("adding parts is cumulative and keeps the folder open", async ({ page }, testInfo) => {
  const chapterCount=await chapterUnionCount(page,[chapter]);
  const combinedCount=await chapterUnionCount(page,[chapter,'Interior of the Earth']);
  const interiorCount=await chapterUnionCount(page,['Interior of the Earth']);
  const rocksCount=await chapterUnionCount(page,['Rocks and Minerals']);
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await add(page, chapter);
  await expect(heading(page)).toHaveText("Physical Geography");
  await expect(count(page)).toHaveText(String(chapterCount));
  await add(page, "Interior of the Earth");
  await expect(count(page)).toHaveText(String(combinedCount));
  await expect(page.locator(".explorer-test-items li")).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("explorer-desktop.png"), fullPage: true });
  await open(page, "Rocks and Minerals");
  await expect(count(page)).toHaveText(String(combinedCount));
  await summary(page).getByRole("button", { name: `Remove ${chapter} from test`, exact: true }).click();
  await expect(heading(page)).toHaveText("Rocks and Minerals");
  await expect(count(page)).toHaveText(String(interiorCount));
  await summary(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(heading(page)).toHaveText("Rocks and Minerals");
  await expect(count(page)).toHaveText(String(rocksCount));
  await expect(summary(page)).toContainText("Current folder");
});

test("adding a parent deduplicates a selected child and collapses the selection", async ({ page }) => {
  const chapterCount=await chapterUnionCount(page,[chapter]);
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await open(page, chapter);
  const first = browser(page).locator(".scope-card").first();
  await first.getByRole("button", { name: /^Add to test:/ }).click();
  await browser(page).getByRole("button", { name: "Add remaining", exact: true }).click();
  await expect(count(page)).toHaveText(String(chapterCount));
  await expect(page.locator(".explorer-test-items li")).toHaveCount(1);
  await expect(summary(page)).toContainText(chapter);
  await browser(page).getByRole("button", { name: "← Back", exact: true }).click();
  await expect(browser(page).getByRole("button", { name: `Added ${chapter}`, exact: true })).toBeDisabled();
});

test("different subjects combine into one paper and export the exact selection", async ({ page }) => {
  await page.context().addInitScript(() => { window.print = () => undefined; });
  const inventory=await(await page.request.get('/api/pyqs/inventory')).json();
  const chapterId=inventory.nodes.find((n:{label:string;kind:string})=>n.kind==='topic'&&n.label===chapter).id;
  const ids=new Set(inventory.nodes.filter((n:{kind:string;legacyOnly?:boolean;subjectId:string;parentId:string})=>n.kind==='subtopic'&&!n.legacyOnly&&(n.subjectId==='subject:polity'||n.parentId===chapterId)).flatMap((n:{questionIdsByExam:Record<string,string[]>})=>Object.values(n.questionIdsByExam).flat()));
  const expected=ids.size;
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await add(page, chapter);
  await page.getByRole("navigation", { name: "Syllabus" }).getByRole("button", { name: /^Subjects/ }).click();
  await add(page, "Polity & Governance");
  await expect(count(page)).toHaveText(expected.toLocaleString('en-IN'));
  await expect(page.locator(".explorer-test-items li")).toHaveCount(2);
  await summary(page).getByRole("button", { name: "Set up test" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Download a PDF with an answer key/ }).click();
  await dialog.getByRole("group", { name: "How many questions?" }).getByRole("button", { name: `All ${expected}`, exact: true }).click();
  await dialog.getByRole("checkbox", { name: /Add an answer key/ }).check();
  const popupPromise = page.waitForEvent("popup");
  await dialog.getByRole("button", { name: `Download ${expected}-question PDF`, exact: true }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/practice\/.+\/print/);
  await expect(popup.locator(".print-question")).toHaveCount(expected);
  await popup.close();
});

test("exam choices carry across branches and zero sources retain selection", async ({ page }) => {
  const noNda=await chapterUnionCount(page,[chapter],['CSE','CAPF','CDS']);
  const combinedNoNda=await chapterUnionCount(page,[chapter,'Interior of the Earth'],['CSE','CAPF','CDS']);
  const combinedCse=await chapterUnionCount(page,[chapter,'Interior of the Earth','Rocks and Minerals'],['CSE']);
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await add(page, chapter);
  const sources = summary(page).getByRole("region", { name: "Exam sources" });
  await sources.getByRole("button", { name: /^NDA\b/ }).click();
  await expect(count(page)).toHaveText(String(noNda));
  await add(page, "Interior of the Earth");
  await expect(count(page)).toHaveText(String(combinedNoNda));
  for (const exam of ["CSE", "CAPF", "CDS"]) await sources.getByRole("button", { name: new RegExp(`^${exam}\\b`) }).click();
  await expect(count(page)).toHaveText("0");
  await expect(page.locator(".explorer-test-items li")).toHaveCount(2);
  await expect(summary(page).getByRole("button", { name: "Set up test" })).toBeDisabled();
  await open(page, "Rocks and Minerals");
  await browser(page).getByRole("button", { name: "Add entire folder" }).click();
  await expect(count(page)).toHaveText("0");
  await sources.getByRole("button", { name: /^CSE\b/ }).click();
  await expect(count(page)).toHaveText(String(combinedCse));
});

test("current folder commits into online or PDF setup", async ({ page }) => {
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await summary(page).getByRole("button", { name: "Test this folder" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(`${await physicalCount(page)} questions`);
  await dialog.getByRole("button", { name: /Take an online test/ }).click();
  await expect(dialog.getByRole("group", { name: "How many questions?" })).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: /Add an answer key/ })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Change method" }).click();
  await dialog.getByRole("button", { name: /Download a PDF with an answer key/ }).click();
  await expect(dialog.getByRole("checkbox", { name: /Add an answer key/ })).toBeVisible();
});

test("selection, folder, expanded branches, and sources restore on reload", async ({ page }) => {
  const noNda=await chapterUnionCount(page,[chapter],['CSE','CAPF','CDS']);
  await open(page, "Geography");
  await open(page, "Physical Geography");
  await add(page, chapter);
  await summary(page).getByRole("button", { name: /^NDA\b/ }).click();
  await open(page, "Interior of the Earth");
  await page.reload();
  await expect(heading(page)).toHaveText("Interior of the Earth");
  await expect(count(page)).toHaveText(String(noNda));
  await expect(summary(page).getByRole("button", { name: /^NDA\b/ })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("navigation", { name: "Syllabus" }).getByRole("button", { name: "Collapse Interior of the Earth", exact: true })).toBeVisible();
});

test("deepest subpart renders once and keyboard navigation opens folders", async ({ page }) => {
  await browser(page).getByRole("button", { name: "Open Geography", exact: true }).focus();
  await page.keyboard.press("Enter");
  await open(page, "Physical Geography");
  await open(page, chapter);
  const leafName = await browser(page).locator(".explorer-folder").first().getAttribute("aria-label");
  await browser(page).locator(".explorer-folder").first().click();
  await expect(heading(page)).toHaveText(leafName!.replace(/^Open /, ""));
  await expect(browser(page).locator(".scope-card")).toHaveCount(0);
  await expect(browser(page).getByRole("button", { name: "Add entire folder" })).toBeVisible();
});

test("mobile library drawer and test panel remain independently usable", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".scope-syllabus-mobile-toggle").click();
  const tree = page.getByRole("navigation", { name: "Syllabus" });
  await tree.getByRole("button", { name: "Geography", exact: true }).click();
  await expect(heading(page)).toHaveText("Geography");
  await expect(tree).not.toBeVisible();
  await add(page, "Physical Geography");
  await page.locator(".explorer-test-toggle").click();
  await expect(summary(page)).toBeVisible();
  await expect(count(page)).toHaveText(String(await physicalCount(page)));
  await page.screenshot({ path: testInfo.outputPath("explorer-mobile.png"), fullPage: true });
  await summary(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(heading(page)).toHaveText("Geography");
  await summary(page).getByRole("button", { name: "Close ×", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".scope-mobile-bar").getByRole("button", { name: "Test this folder" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
