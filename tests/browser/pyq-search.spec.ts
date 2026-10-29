import {expect,test} from '@playwright/test';

test('searches reviewed PYQ stems and option text without exposing answers',async({page})=>{
 await page.goto('/');const search=page.getByRole('search');await search.getByLabel('PYQ term').fill('HBrO₄');await search.getByRole('button',{name:'Search'}).click();
 await expect(page).toHaveURL(/\?q=HBrO/);await expect(page.getByText('1 matching MCQ',{exact:true})).toBeVisible();const card=page.locator('.pyq-search-card');await expect(card).toHaveCount(1);await expect(card).toContainText('Hypobromous acid');await expect(card).toContainText('HBrO₄');await expect(card).not.toContainText('Correct answer');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('keeps the question library visible for an unmatched term',async({page})=>{
 await page.goto('/?q=term-that-cannot-exist-94721');await expect(page.getByText(/No reviewed MCQs match/)).toBeVisible();await expect(page.getByText('CSE question library',{exact:true})).toBeVisible();
});
