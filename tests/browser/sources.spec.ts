import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('compact source directory filters and paginates every paper without inflating totals',async({page,request})=>{
 const inventory=await(await request.get('/api/pyqs/inventory')).json();
 await page.goto('/');
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Sources',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Added PYQ papers'})).toBeVisible();
 const ids=new Set<string>(inventory.nodes.filter((n:{kind:string;legacyOnly?:boolean})=>n.kind==='subtopic'&&!n.legacyOnly).flatMap((n:{questionIdsByExam:Record<string,string[]>})=>Object.values(n.questionIdsByExam).flat()));
 for(const paperId of ['nda-2026-i','nda-2026-ii','nda-2025-i','nda-2025-ii','nda-2024-i']){
  const paper=JSON.parse(readFileSync(`content/${paperId}-official-paper.json`,'utf8'));
  const policy=JSON.parse(readFileSync(`content/${paperId}-official-review-policy.json`,'utf8'));
  for(const q of paper.questions)if(['official-final','official-provisional','reasoned-verified'].includes(policy[q.id].status))ids.add(q.id);
 }
 const reviewed=JSON.parse(readFileSync('content/nda-2024-ii-reviewed-paper.json','utf8'));
 for(const q of reviewed.questions)ids.add(q.id);
 const available=ids.size;
 await expect(page.locator('article')).toContainText(`${available.toLocaleString('en-IN')} available questions`);
 const rows=page.locator('.source-table tbody tr'), next=page.getByRole('button',{name:'Next →',exact:true});
 await expect(rows).toHaveCount(12);
 await expect(page.locator('.source-directory').getByRole('link')).toHaveCount(0);
 const identities=new Set<string>();let sum=0;
 do {
  for(const row of await rows.all()){
   const identity=await row.getByRole('rowheader').innerText();
   expect(identities.has(identity)).toBe(false);identities.add(identity);
   sum+=Number(await row.locator('.source-count > strong').innerText());
  }
  if(await next.isDisabled())break;
  await next.click();
 }while(true);
 expect(sum).toBe(available);
 await page.getByRole('button',{name:/^NDA\b/}).click();
 await page.getByRole('combobox').nth(0).selectOption('2026');
 const nda=rows.filter({hasText:'2026 · II'});
 await expect(nda.locator('.source-count')).toContainText('150 / 150');
 await expect(nda).toContainText('Official provisional');
 await expect(nda).toContainText('Complete source review');
 await page.getByRole('combobox').nth(1).selectOption('complete');
 await expect(rows).toHaveCount(2);
 await page.getByRole('combobox').nth(0).selectOption('2025');
 await expect(rows).toHaveCount(2);
 await expect(rows.filter({hasText:'2025 · II'})).toContainText('Q85');
 await page.getByRole('combobox').nth(0).selectOption('2024');
 const held=rows.filter({hasText:'2024 · II'});
 await expect(held).toContainText('14 held for review');
 await expect(held).toContainText('16, 21, 23, 24, 51, 58, 68, 70, 110, 117, 123, 125, 139, 144');
 await expect(held).not.toContainText('Officially withdrawn');
 await expect(rows.filter({hasText:'2024 · I'}).first()).toContainText('Q101');
 await page.screenshot({path:'tmp/source-directory-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/^All exams/}).click();
 await page.getByRole('combobox').nth(0).selectOption('all');
 await page.getByRole('combobox').nth(1).selectOption('all');
 await expect(rows).toHaveCount(12);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/source-directory-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/^NDA\b/}).click();
 await page.getByRole('combobox').nth(0).selectOption('2024');
 const scroller=page.getByRole('region',{name:'Source papers table, scroll horizontally on small screens'});
 await scroller.focus();await page.keyboard.press('End');
 await scroller.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 await expect(rows.filter({hasText:'2024 · II'}).locator('.source-gaps')).toContainText('Question numbers · Series A');
 const bounds=await rows.filter({hasText:'2024 · II'}).locator('.source-gaps').boundingBox();
 expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(390);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByText('What do the review labels mean?',{exact:true}).click();
 await expect(page.locator('.source-review-notes')).toHaveAttribute('open','');
});
