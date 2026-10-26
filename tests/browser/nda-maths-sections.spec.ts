import {expect,test} from '@playwright/test';

test('NDA maths lands directly on eight numbered sections, then chapters and subparts',async({page})=>{
 await page.goto('/prepare/NDA');
 await page.getByRole('group',{name:'Paper',exact:true}).getByRole('button',{name:'Mathematics',exact:true}).click();
 const middle=page.locator('.scope-library-browser');
 await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Mathematics');
 await expect(middle.locator('.scope-card-number')).toHaveText(Array.from({length:8},(_,i)=>`Section ${i+1}`));
 await expect(page.locator('.syllabus-sections > li > button > span')).toHaveText([
  'Section 1 · Algebra','Section 2 · Matrices and Determinants','Section 3 · Trigonometry','Section 4 · Analytical Geometry',
  'Section 5 · Differential Calculus','Section 6 · Integral Calculus and Differential Equations','Section 7 · Vector Algebra','Section 8 · Statistics and Probability'
 ]);
 await expect(middle.getByRole('button',{name:'Open Mathematics',exact:true})).toHaveCount(0);
 for(const button of await middle.getByRole('button',{name:/^Add to test:/}).all())await expect(button).toBeDisabled();
 await middle.getByRole('button',{name:'Open Algebra',exact:true}).click();
 await expect(middle.locator('.scope-cards-heading small')).toHaveText('Section 1');
 await expect(middle.locator('.scope-card-number')).toHaveText(['Chapter 1','Chapter 2','Chapter 3']);
 await middle.getByRole('button',{name:'Open Foundations',exact:true}).click();
 await expect(middle.locator('.scope-card-number')).toHaveText(['1.1','1.2','1.3','1.4']);
 await page.reload();await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Foundations');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('a fresh NDA maths view opens its section list directly',async({page})=>{
 await page.goto('/prepare/NDA?view=nda-maths');
 await expect(page.locator('.scope-library-browser .scope-cards-heading h3')).toHaveText('Mathematics');
 await expect(page.locator('.scope-library-browser .scope-card-number')).toHaveText(Array.from({length:8},(_,i)=>`Section ${i+1}`));
});
