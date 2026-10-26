import {expect,test} from '@playwright/test';

test('Geography sections are numbered 1–4 consistently without changing navigation',async({page})=>{
 await page.goto('/prepare/NDA');
 await page.getByRole('button',{name:'Open Geography',exact:true}).click();
 const labels=['Physical Geography','Indian Geography','World Geography','Human & Economic Geography'];
 for(const [i,label]of labels.entries()){
  await expect(page.getByRole('button',{name:`Open ${label}`,exact:true})).toHaveText(`${i+1}. ${label}›`);
  await expect(page.locator('.syllabus-sections').getByRole('button',{name:label,exact:true}).locator('span').first()).toHaveText(`${i+1}. ${label}`);
 }
 await page.getByRole('button',{name:'Open Indian Geography',exact:true}).click();
 await expect(page.locator('.scope-cards-heading h3')).toHaveText('Indian Geography');
 await expect(page.locator('.test-cart-total strong')).toHaveText('0');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
