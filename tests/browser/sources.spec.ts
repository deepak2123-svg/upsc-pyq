import {expect,test} from '@playwright/test';

test('compact source directory filters and paginates every paper without inflating totals',async({page,request})=>{
 const inventory=await(await request.get('/api/pyqs/inventory')).json();
 await page.goto('/');
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Sources',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Added PYQ papers'})).toBeVisible();
 await expect(page.locator('article')).toContainText(`${inventory.totalCount.toLocaleString('en-IN')} available GS questions`);
 const rows=page.locator('.source-paper-card'), next=page.getByRole('button',{name:'Next →',exact:true});
 await expect(rows).toHaveCount(12);
 const identities=new Set<string>();let sum=0;
 do {
  for(const row of await rows.all()){
   const identity=await row.locator('.source-paper-heading').innerText();
   expect(identities.has(identity)).toBe(false);identities.add(identity);
   sum+=Number((await row.locator('.source-paper-heading > span:last-child').innerText()).split(' ')[0]);
  }
  if(await next.isDisabled())break;
  await next.click();
 }while(true);
 expect(sum).toBe(inventory.totalCount);
 await page.getByRole('button',{name:/^NDA\b/}).click();
 await page.getByRole('combobox').nth(0).selectOption('2026');
 const nda=rows.filter({hasText:'2026 · II'});
 await expect(nda).toContainText('100 MCQs');
 await expect(nda).toContainText('Official provisional key');
 await expect(nda).toContainText('Complete source review');
 await page.getByRole('combobox').nth(1).selectOption('complete');
 await expect(rows).toHaveCount(1);
 await page.getByRole('combobox').nth(0).selectOption('2025');
 await expect(page.getByText('No added papers match these filters.')).toBeVisible();
 await page.getByRole('button',{name:/^All exams/}).click();
 await page.getByRole('combobox').nth(0).selectOption('all');
 await page.getByRole('combobox').nth(1).selectOption('all');
 await expect(rows).toHaveCount(12);
 await page.screenshot({path:'tmp/source-directory-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/source-directory-mobile.png',fullPage:true});
 await page.getByText('What do the review labels mean?',{exact:true}).click();
 await expect(page.locator('details')).toHaveAttribute('open','');
});
