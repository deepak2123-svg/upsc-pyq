import {expect,test} from '@playwright/test';

test('NDA Science displays numbered chapters and subtopics without extra horizontal scrolling',async({page})=>{
 await page.goto('/prepare/NDA?view=nda-science&scope=subject%3Ascience');
 const middle=page.locator('.scope-library-browser');
 for(const [subject,count] of [['Physics',18],['Chemistry',12],['Biology',17]] as const){
  await middle.getByRole('button',{name:`Open ${subject}`,exact:true}).click();
  await expect(middle.locator('.scope-card')).toHaveCount(count);
  await expect(middle.locator('.scope-card-number')).toHaveText(Array.from({length:count},(_,i)=>`Chapter ${i+1}`));
  if(subject==='Physics'){
   await middle.getByRole('button',{name:'Open Light and Optics',exact:true}).click();
   await expect(middle.locator('.scope-card-number')).toHaveText(['12.1','12.2','12.3','12.4','12.5','12.6']);
   await middle.getByRole('button',{name:'Physics',exact:true}).click();
  }
  await middle.getByRole('button',{name:'Science & Technology',exact:true}).click();
 }
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/nda-science-mobile.png',fullPage:true});
});
