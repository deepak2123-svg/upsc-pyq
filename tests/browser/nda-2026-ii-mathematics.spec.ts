import {expect,test} from '@playwright/test';
import paper from '../../content/nda-2026-ii-mathematics-official-paper.json' with {type:'json'};

test('NDA II 2026 Mathematics launches the complete original-order paper',async({page})=>{
 await page.goto('/papers/nda-2026-ii-mathematics');
 await expect(page.getByRole('heading',{name:'NDA II 2026 · Mathematics'})).toBeVisible();
 await expect(page.getByText('120 available / 120 source questions')).toBeVisible();
 await expect(page.getByText(/Official UPSC provisional key/)).toBeVisible();
 const key=await page.request.get(paper.evidence.asset);expect(key.status()).toBe(200);expect((await key.body()).byteLength).toBeGreaterThan(1_000_000);
 await page.getByRole('button',{name:'Start 120-question test →'}).click();
 await expect(page).toHaveURL(/\/practice\/[^/]+$/);
 await expect(page.getByText(/Question 1 of 120/).first()).toBeVisible();
 const question=page.locator('.practice-question');
 expect(await question.locator('.katex').count()).toBeGreaterThan(0);
 await expect(question.locator('.katex').first()).toBeVisible();
 await question.getByRole('button',{name:'Save & next →'}).click();
 await expect(page.getByText(/Question 2 of 120/).first()).toBeVisible();
 expect(await question.locator('.katex').count()).toBeGreaterThan(0);
 await expect(question.locator('.katex').first()).toBeVisible();
});

test('Sources lists the clickable 120-question Mathematics paper',async({page})=>{
 await page.goto('/legal/sources');
 const directory=page.getByRole('region',{name:'Added paper directory'});await directory.getByRole('button',{name:/^NDA/}).click();await directory.getByLabel('Year').selectOption('2026');
 const row=directory.getByRole('row',{name:/NDA 2026 · II Mathematics/});await expect(row).toContainText('120 / 120');await expect(row).toContainText('Official provisional');await row.getByRole('link',{name:/Practise full paper/}).click();await expect(page).toHaveURL(/\/papers\/nda-2026-ii-mathematics$/);
});
