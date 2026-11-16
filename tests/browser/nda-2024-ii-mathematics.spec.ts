import {expect,test} from '@playwright/test';

test('NDA II 2024 Mathematics launches only the 116 verified questions',async({page})=>{
 await page.goto('/papers/nda-2024-ii-mathematics');
 await expect(page.getByRole('heading',{name:'NDA II 2024 · Mathematics'})).toBeVisible();
 await expect(page.getByText('116 available / 120 source questions')).toBeVisible();
 await expect(page.getByText(/Q26, Q79, Q94 and Q100/)).toBeVisible();
 await page.getByRole('button',{name:'Start 116-question test →'}).click();
 await expect(page.getByText(/Question 1 of 116/).first()).toBeVisible();
});
