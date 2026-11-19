import {expect,test} from '@playwright/test';

test('searches reviewed PYQ stems and option text without exposing answers',async({page})=>{
 await page.goto('/');const search=page.getByRole('search');await search.getByLabel('PYQ term').fill('HBrO₄');await search.getByRole('button',{name:'Search'}).click();
 await expect(page).toHaveURL(/\?q=HBrO/);await expect(page.getByText('1 matching MCQ',{exact:true})).toBeVisible();const card=page.locator('.pyq-search-card');await expect(card).toHaveCount(1);await expect(card).toContainText('Hypobromous acid');await expect(card).toContainText('HBrO₄');await expect(card).not.toContainText('Correct answer');
 await expect(card.getByText('Syllabus location')).toBeVisible();
 await card.getByRole('radio',{name:/HBrO₄/}).click();
 await card.getByRole('button',{name:'Check answer'}).click();
 await expect(card.getByRole('status')).toContainText(/Correct|Incorrect/);
 const location=card.getByRole('link',{name:/Open .* in the NDA syllabus/});
 await expect(location).toHaveAttribute('href',/\/prepare\/NDA\?scope=/);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('keeps search focused for an unmatched term',async({page})=>{
 await page.goto('/?q=term-that-cannot-exist-94721');await expect(page.getByText(/No reviewed MCQs match/)).toBeVisible();await expect(page.getByText('CSE question library',{exact:true})).toHaveCount(0);
});

test('checks a materially corrected live search question at its current revision',async({page})=>{
 await page.goto('/?q=asean');
 const card=page.locator('.pyq-search-card').filter({hasText:'became the 11th member of ASEAN in 2025'});
 await expect(card).toHaveCount(1);
 await card.getByRole('radio',{name:/Timor-Leste/}).click();
 await card.getByRole('button',{name:'Check answer'}).click();
 await expect(card.getByRole('status')).toHaveText('Correct.');
 await expect(card).not.toContainText('excluded from scoring');
 await expect(card).not.toContainText('provisional key');
});

test('summarises all four exams and groups matching MCQs newest first',async({page})=>{
 await page.goto('/?q=india');
 const summary=page.getByLabel('Matches for india by exam');
 await expect(summary.locator(':scope > a')).toHaveCount(4);
 expect(await summary.locator(':scope > a').evaluateAll(items=>items.map(item=>item.querySelector('strong')?.textContent))).toEqual(['CSE','CAPF','CDS','NDA']);
 const pillBox=await summary.locator(':scope > a').first().boundingBox();
 expect(pillBox?.width).toBeLessThanOrEqual(160);
 const groups=page.locator('.pyq-search-exam-group');
 expect(await groups.count()).toBeGreaterThan(1);
 await expect(groups.first().locator('.pyq-search-exam-cards')).toHaveCSS('column-count','2');
 for(const group of await groups.all()){
  await expect(group.locator(':scope > header')).toContainText('Most recent first');
  await expect(group).toHaveCSS('border-top-style','solid');
  const years=(await group.locator('.pyq-search-card>header>span').allTextContents()).map(label=>Number(label.match(/\b(20\d{2})\b/)?.[1]));
  expect(years).toEqual([...years].sort((a,b)=>b-a));
 }
 await page.setViewportSize({width:390,height:844});
 await expect(groups.first().locator('.pyq-search-exam-cards')).toHaveCSS('column-count','1');
});
