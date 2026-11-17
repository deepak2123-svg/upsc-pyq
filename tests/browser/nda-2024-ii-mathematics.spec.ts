import {expect,test} from '@playwright/test';

test('NDA II 2024 Mathematics launches all 120 reviewed questions',async({page})=>{
 await page.goto('/papers/nda-2024-ii-mathematics');
 await expect(page.getByRole('heading',{name:'NDA II 2024 · Mathematics'})).toBeVisible();
 await expect(page.getByText('120 available / 120 source questions')).toBeVisible();
 await expect(page.getByText(/explicit intended-reading notes/)).toBeVisible();
 await page.getByRole('button',{name:'Start 120-question test →'}).click();
 await expect(page.getByText(/Question 1 of 120/).first()).toBeVisible();
});
