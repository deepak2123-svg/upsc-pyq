import {expect,test} from '@playwright/test';

test('rounded selector merges only the completed choice and reopens without duplicate summary',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/prepare/NDA');
 const summary=page.getByRole('button',{name:'Change preparation selection',exact:true});
 await expect(summary).toBeHidden();
 await page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'Science',exact:true}).click();
 await expect(page.locator('.preparation-selector-options')).toBeHidden();
 await expect(summary).toContainText('UPSC NDA');await expect(summary).toContainText('GAT');await expect(summary).toContainText('Science');
 await expect(summary).toBeFocused();
 await page.screenshot({path:'tmp/preparation-selector-collapsed.png',fullPage:true});
 await summary.click();await expect(summary).toBeHidden();
 await expect(page.getByRole('button',{name:'UPSC NDA',exact:true})).toBeFocused();
 await page.getByRole('group',{name:'Paper',exact:true}).getByRole('button',{name:'Mathematics',exact:true}).click();
 await expect(page.locator('.preparation-selector-options')).toBeHidden();await expect(summary).toContainText('Mathematics');
 await summary.click();await expect(summary).toBeHidden();
 await page.getByRole('button',{name:'GAT',exact:true}).click();
 await expect(page.getByRole('group',{name:'GAT section',exact:true})).toBeVisible();await expect(summary).toBeHidden();
 const english=page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'English',exact:true});
 await english.click();await expect(page.locator('.preparation-selector-options')).toBeHidden();
 await page.reload();await expect(english).toHaveAttribute('aria-pressed','true');
 await page.setViewportSize({width:390,height:844});await english.click();
 await expect(page.locator('.preparation-selector-options')).toBeHidden();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await summary.click();await expect(summary).toBeHidden();
 await page.screenshot({path:'tmp/preparation-selector-mobile.png',fullPage:true});expect(errors).toEqual([]);
});

test('selector keyboard/reduced-motion flow preserves source filters across CSE and CDS',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/prepare/CSE');
 const summary=page.getByRole('button',{name:'Change preparation selection',exact:true});
 await page.getByRole('button',{name:'GS Paper II / CSAT',exact:true}).click();await expect(summary).toContainText('GS Paper II / CSAT');
 await expect(page.locator('.preparation-selector-options')).toBeHidden();
 await summary.press('Enter');await expect(summary).toBeHidden();
 await page.getByRole('button',{name:'UPSC CDS',exact:true}).click();await expect(page).toHaveURL('/prepare/CDS');
 await page.getByRole('button',{name:'Elementary Mathematics',exact:true}).click();await expect(summary).toContainText('Elementary Mathematics');
 await summary.click();await expect(summary).toBeHidden();
 await page.getByRole('button',{name:'UPSC CDS',exact:true}).press('Escape');await expect(summary).toBeVisible();
 await expect(page.locator('.scope-source-grid button').filter({hasText:'CDS'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.scope-source-grid button').filter({hasText:'NDA'})).toHaveAttribute('aria-pressed','false');
 await page.setViewportSize({width:320,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
