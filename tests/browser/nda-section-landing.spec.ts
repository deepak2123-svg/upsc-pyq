import {expect,test} from '@playwright/test';

test('NDA Science and English open their sections directly and preserve deep links and cart',async({page})=>{
 await page.goto('/prepare/NDA');
 const middle=page.locator('.scope-library-browser');
 const summary=page.getByRole('button',{name:'Change preparation selection',exact:true});
 await page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'Science',exact:true}).click();
 await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Science & Technology');
 await expect(middle.getByRole('button',{name:'Open Physics',exact:true})).toBeVisible();
 await expect(middle.getByRole('button',{name:'Open Science & Technology',exact:true})).toHaveCount(0);
 await expect(page.locator('.scope-inventory-info')).toHaveCount(0);
 await expect(page.locator('.scope-syllabus-root strong')).toHaveCount(0);
 await middle.getByRole('button',{name:'Add entire folder',exact:true}).click();
 const count=await page.locator('.test-cart-total strong').innerText();expect(count).not.toBe('0');
 await middle.getByRole('button',{name:'Open Physics',exact:true}).click();
 const deepUrl=page.url();await page.reload();await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Physics');
 await page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'English',exact:true}).click();
 await expect(middle.locator('.scope-cards-heading h3')).toHaveText('English');
 for(const label of ['Vocabulary','Grammar','Usage and Sentence Skills','Comprehension'])await expect(middle.getByRole('button',{name:`Open ${label}`,exact:true})).toBeVisible();
 await expect(page.locator('.test-cart-total strong')).toHaveText(count);
 await page.reload();await expect(middle.locator('.scope-cards-heading h3')).toHaveText('English');
 await summary.isVisible().then(async visible=>{if(visible){await summary.click();await expect(summary).toBeHidden();}});
 await page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'GS',exact:true}).click();
 await expect(middle.getByRole('button',{name:'Open Geography',exact:true})).toBeVisible();
 await page.goBack();await expect(middle.locator('.scope-cards-heading h3')).toHaveText('English');
 await page.goto(deepUrl);await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Physics');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('bare Science/English view URLs start at sections and totals remain on Sources only',async({page})=>{
 const middle=page.locator('.scope-library-browser');
 await page.goto('/prepare/NDA?view=nda-science');await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Science & Technology');
 await page.goto('/prepare/NDA?view=nda-english');await expect(middle.locator('.scope-cards-heading h3')).toHaveText('English');
 // Current six processed NDA papers add English/Science beyond the shared GS inventory.
 await page.goto('/legal/sources');await expect(page.getByText(/2,489 available questions across 58 source papers/)).toBeVisible();
 await expect(page.locator('.source-directory').getByRole('link')).toHaveCount(0);
});
