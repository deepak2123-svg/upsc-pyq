import {expect,test} from '@playwright/test';
import official from '../../content/nda-2026-i-official-paper.json' with {type:'json'};

test('the full 150-question official-key paper gives correct/incorrect results and preserves recorded choices',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/papers/nda-2026-i-gat');
 await expect(page.getByRole('heading',{name:'NDA I 2026 · GAT',exact:true})).toBeVisible();
 await expect(page.getByText('Unscored practice.',{exact:true})).toHaveCount(0);
 const oldDraftKey='upsc-original-paper:v1:nda-2026-i-gat';
 await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({version:1,sourceHash:'legacy',answers:{1:'B'}})),oldDraftKey);
 const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Start 150-question test →',exact:true}).click();
 const snapshot=await(await created).json();expect(snapshot.questions).toHaveLength(150);
 expect(snapshot.questions.map((q:any)=>q.questionNumber)).toEqual(Array.from({length:150},(_,i)=>i+1));
 expect(snapshot.questions.every((q:any)=>q.answer===undefined&&q.answerKeyStatus==='official-provisional')).toBe(true);
 await expect(page.locator('.practice-prompt u')).toHaveText('allegories');
 await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:/^D\b/}).click();
 await page.getByRole('button',{name:/^Save & next/}).click();
 await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:/^A\b/}).click();
 for(const [number,answer] of [[58,'A'],[73,'D'],[75,'D'],[150,'C']] as const){
  await page.getByRole('button',{name:`Question ${number}, not answered`,exact:true}).click();
  if(number===75)await expect(page.locator('.question-figure img')).toHaveAttribute('src','/figures/nda-2026-i/q75.png');
  if(number===150)await expect(page.locator('.matching-list-table tbody tr')).toHaveCount(4);
  await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${answer}\\b`)}).click();
 }
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 const result=await(await graded).json();
 expect(result.correct).toBe(5);expect(result.incorrect).toBe(1);expect(result.unattempted).toBe(144);expect(result.excluded).toBe(0);expect(result.scored).toBe(150);
 await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 const sheet=page.getByRole('table',{name:'Answer sheet',exact:true});
 await expect(sheet.getByRole('row')).toHaveCount(151);
 await expect(sheet.getByRole('row').nth(1)).toContainText('Correct');
 await expect(sheet.getByRole('row').nth(2)).toContainText('Incorrect');
 await expect(sheet.getByRole('row').nth(58)).toContainText('A');
 await expect(sheet.getByRole('row').nth(73)).toContainText('D');
 await page.getByRole('button',{name:'Review question 1',exact:true}).click();
 await expect(page.locator('.result-answer-detail-row u')).toHaveText('allegories');
 await expect(page.locator('.result-explanation')).toContainText('Official UPSC provisional key');
 await page.reload();await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).answers[1],oldDraftKey)).toBe('B');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('all 150 printed questions retain English underlining, four original figures and official-key answers',async({page,context})=>{
 await context.addInitScript(()=>{window.print=()=>undefined;});
 await page.goto('/papers/nda-2026-i-gat');
 const popupPromise=page.waitForEvent('popup');
 await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();
 const paper=await popupPromise;
 await expect(paper.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
 await expect(paper.locator('.print-question')).toHaveCount(150);
 await expect(paper.getByRole('heading',{name:'NDA I 2026 · GAT',exact:true})).toBeVisible();
 expect((await paper.locator('.print-paper-header').boundingBox())!.height).toBeLessThan(180);
 await expect(paper.locator('.question-figure img')).toHaveCount(4);
 await expect(paper.locator('[data-question-id="nda-2026-i-1"] u')).toHaveText('allegories');
 await expect(paper.locator('[data-question-id="nda-2026-i-46"] .paired-row-table tbody tr')).toHaveCount(2);
 await expect(paper.locator('[data-question-id="nda-2026-i-150"] .matching-list-table tbody tr')).toHaveCount(4);
 await expect(paper.locator('.print-answer-key')).toContainText('† Official provisional key');
 const rows=paper.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(75);
 for(let index=0;index<75;index++){
  const cells=rows.nth(index).locator('td');
  await expect(cells.nth(1)).toHaveText(official.questions[index].answer+' †');
  await expect(cells.nth(4)).toHaveText(official.questions[index+75].answer+' †');
 }
 await paper.pdf({path:'tmp/nda-2026-i/complete-official-paper.pdf',format:'A4',printBackground:true});
 await paper.close();
 await page.getByRole('button',{name:'English · 50',exact:true}).click();
 await expect(page.getByRole('button',{name:'Start 50-question test →',exact:true})).toBeEnabled();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/nda-2026-i/official-setup-mobile.png',fullPage:true});
});
