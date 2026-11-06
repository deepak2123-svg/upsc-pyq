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

test('official paper practice uses one paper heading and a ten-column section navigator',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('/papers/nda-2014-ii-gat');
  await page.getByRole('button',{name:'Start 150-question test →',exact:true}).click();

  await expect(page.locator('.practice-paper-title')).toContainText('NDA · GAT II · 2014');
  await expect(page.locator('.question-origin')).toHaveCount(0);
  await expect(page.locator('.palette-section')).toHaveCount(3);
  await expect(page.locator('.palette-section-heading strong')).toHaveText(['English','Science','General Studies']);
  await expect.poll(()=>page.locator('.palette-grid').first().evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(10);
});
