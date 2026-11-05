import {expect,test} from '@playwright/test';

test('spot-the-error geometry is faithful in online practice and printable papers',async({page,context})=>{
  await context.addInitScript(()=>{window.print=()=>undefined;});
  await page.goto('/papers/nda-2014-ii-gat');
  const created=page.waitForResponse(response=>response.url().endsWith('/api/practice-snapshots')&&response.request().method()==='POST');
  await page.getByRole('button',{name:'Start 150-question test →',exact:true}).click();
  await created;

  const line=page.locator('.practice-prompt .paper-error-line');
  await expect(line).toHaveCount(1);
  await expect(line.locator('.paper-error-segment')).toHaveCount(3);
  await expect(line.locator('.paper-error-segment > b')).toHaveText(['(a)','(b)','(c)']);
  await expect(line.locator('.paper-error-segment > span')).toHaveText([
    'It was nearly thirty years ago,',
    'since this magazine',
    'was first published.',
  ]);
  await expect(page.getByRole('group',{name:'Answer options',exact:true})).toContainText('No error');

  await page.goto('/papers/nda-2014-ii-gat');
  const popupPromise=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();
  const paper=await popupPromise;
  const printed=paper.locator('[data-question-id="nda-2014-ii-1"] .paper-error-line');
  await expect(printed.locator('.paper-error-segment')).toHaveCount(3);
  await expect(printed.locator('.paper-error-segment > b')).toHaveText(['(a)','(b)','(c)']);
  await paper.close();
});
