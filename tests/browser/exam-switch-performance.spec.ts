import {expect,test} from '@playwright/test';

test('exam destinations prefetch without changing location and preserve separate carts',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const prefetch=page.waitForResponse(response=>response.url().includes('/prepare/CSE.rsc'));
 await page.goto('/prepare/NDA');
 await prefetch;
 await expect(page).toHaveURL(/\/prepare\/NDA/);
 await page.getByRole('group',{name:'GAT section',exact:true}).getByRole('button',{name:'Science',exact:true}).click();
 await page.getByRole('button',{name:'Add entire folder',exact:true}).click();
 const count=await page.locator('.test-cart-total strong').innerText();expect(Number(count.replaceAll(',',''))).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Change preparation selection',exact:true}).click();
 await page.getByRole('group',{name:'Preparing for',exact:true}).getByRole('button',{name:'UPSC CSE',exact:true}).click();
 await expect(page.getByRole('heading',{name:'CSE question library'})).toBeVisible();
 await expect(page.locator('.test-cart-total strong')).toHaveText('0');
 await page.getByRole('group',{name:'Preparing for',exact:true}).getByRole('button',{name:'UPSC NDA',exact:true}).click();
 await expect(page.locator('.test-cart-total strong')).toHaveText(count);
 await page.reload();await expect(page.locator('.test-cart-total strong')).toHaveText(count);
 expect(errors).toEqual([]);
});

test('slow navigation announces target immediately; save-data avoids background prefetch',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,effectiveType:'4g'}}));
 let requests=0;
 await page.route('**/prepare/CSE.rsc*',async route=>{requests++;await new Promise(resolve=>setTimeout(resolve,700));await route.continue();});
 await page.goto('/prepare/NDA');
 await expect(page.getByRole('button',{name:'UPSC NDA',exact:true})).toBeEnabled();
 await page.waitForTimeout(3000);expect(requests).toBe(0);
 await page.getByRole('button',{name:'UPSC CSE',exact:true}).click();
 await expect(page.getByRole('region',{name:'Preparation exam and paper'}).getByRole('status')).toHaveText('Switching to UPSC CSE…');
 await expect(page.getByRole('button',{name:'UPSC CSE',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('heading',{name:'CSE question library'})).toBeVisible();
 await expect(page.getByRole('button',{name:'UPSC CSE',exact:true})).toBeEnabled();
});
