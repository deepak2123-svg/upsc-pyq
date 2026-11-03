import {test,expect} from '@playwright/test';

test('whole-paper practice keeps term and subject selections exact',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('.source-year-matrix')).toHaveCount(0);
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Practice Official Papers'}).click();
 await expect(page).toHaveURL('/papers');
 await expect(page.getByRole('heading',{name:'Paper bank'})).toBeVisible();
 const years=await page.locator('.source-year-column').allTextContents();
 expect(years.slice(0,3)).toEqual(['2026','2025','2024']);
 await expect(page.getByRole('button',{name:'2026',exact:true})).toBeVisible();
 const gridBox=await page.locator('.paper-year-matrix').boundingBox(),cartBox=await page.locator('.paper-selection-bar').boundingBox();
 expect(gridBox&&cartBox&&cartBox.x>=gridBox.x+gridBox.width).toBeTruthy();
 expect(gridBox?.y).toBeLessThan(320);
 expect(await page.locator('.source-year-scroll').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 await expect(page.getByRole('button',{name:'Finalise practice →'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Finalise practice →'})).toBeDisabled();
 await expect(page.getByRole('button',{name:'NDA II · Mathematics 2026, 120 questions, not selected'})).toBeVisible();
 expect(errors).toEqual([]);
 await page.getByRole('button',{name:'NDA II · Mathematics 2026, 120 questions, not selected'}).click();
 await expect(page.getByRole('button',{name:'NDA II · Mathematics 2026, 120 questions, selected'})).toBeVisible();
 await page.getByRole('button',{name:'NDA II · GAT 2026, 150 questions, not selected'}).click();
 await expect(page.locator('.paper-cart-footer')).toContainText('270');
 await expect(page.locator('.paper-cart-footer')).toContainText('questions');
 await expect(page.getByRole('button',{name:'Finalise practice →'})).toBeEnabled();
 const response=page.waitForResponse(value=>value.url().endsWith('/api/practice-snapshots')&&value.request().method()==='POST');
 await page.getByRole('button',{name:'Finalise practice →'}).click();
 const snapshot=await (await response).json();
 expect(snapshot.recipe.version).toBe(5);
 expect(snapshot.questions).toHaveLength(270);
 expect(new Set(snapshot.questions.map((question:{year:number})=>question.year))).toEqual(new Set([2026]));
 expect(new Set(snapshot.questions.map((question:{exam:string})=>question.exam))).toEqual(new Set(['NDA']));
 await expect(page).toHaveURL(/\/practice\//);
});

test('paper grid lists all CDS subjects for both terms',async({page})=>{
 await page.goto('/papers');
 for(const label of ['CDS I · English','CDS I · General Knowledge','CDS I · Elementary Mathematics','CDS II · English','CDS II · General Knowledge','CDS II · Elementary Mathematics'])await expect(page.getByRole('button',{name:label,exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('.source-year-scroll')).toBeVisible();
 await expect(page.locator('.paper-selection-bar')).toHaveCSS('position','static');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
