import {expect,test} from '@playwright/test';

test('Sources declares available papers and partial coverage without inflated totals',async({page,request})=>{
 const inventory=await(await request.get('/api/pyqs/inventory')).json();
 await page.goto('/');
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Sources',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Added PYQ papers'})).toBeVisible();
 await expect(page.locator('article')).toContainText(`${inventory.totalCount.toLocaleString('en-IN')} available GS questions`);
 const rows=page.locator('.source-paper');
 const sum=await rows.evaluateAll(nodes=>nodes.reduce((total,node)=>total+Number(node.querySelector(':scope > span')!.textContent!.split(' ')[0]),0));
 expect(sum).toBe(inventory.totalCount);
 const nda=rows.filter({hasText:'2026 · II'});
 await expect(nda).toContainText('100 MCQs');
 await expect(nda).toContainText('Official provisional key');
 await expect(nda).toContainText('Complete source review');
 await expect(rows.filter({hasText:'Partial collection'}).first()).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
