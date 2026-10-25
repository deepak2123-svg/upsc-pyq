import {expect,test} from '@playwright/test';
import official from '../../content/nda-2026-ii-official-paper.json' with {type:'json'};

test('each NDA II section launches exactly its original 50 source numbers',async({page})=>{
 for(const [label,first] of [['English',1],['Science',51],['GS',101]] as const){
  await page.goto('/papers/nda-2026-ii-gat');
  await page.getByRole('button',{name:`${label} · 50`,exact:true}).click();
  const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Start 50-question test →',exact:true}).click();
  const snapshot=await(await created).json();expect(snapshot.matchingCount).toBe(50);
  expect(snapshot.questions.map((q:{questionNumber:number})=>q.questionNumber)).toEqual(Array.from({length:50},(_,i)=>first+i));
  await expect(page.locator('.question-heading')).toContainText('Question 1 of 50');
 }
});

test('NDA II full scored paper preserves English markup, tables, choices and saved results',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/papers/nda-2026-ii-gat');
 await expect(page.getByRole('heading',{name:'NDA II 2026 · GAT',exact:true})).toBeVisible();
 const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Start 150-question test →',exact:true}).click();
 const snapshot=await(await created).json();expect(snapshot.questions).toHaveLength(150);
 expect(snapshot.questions.map((q:{questionNumber:number})=>q.questionNumber)).toEqual(Array.from({length:150},(_,i)=>i+1));
 expect(snapshot.questions.every((q:{answer?:string;answerKeyStatus:string})=>q.answer===undefined&&q.answerKeyStatus==='official-provisional')).toBe(true);
 await expect(page.locator('.practice-prompt u')).toHaveText('equivocal');
 await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:/^C\b/}).click();
 for(const number of [29,43,84,90,126]){
  await page.getByRole('button',{name:`Question ${number}, not answered`,exact:true}).click();
  if(number===29)await expect(page.locator('.practice-prompt u')).toHaveText('in spite');
  if([43,84,90].includes(number))await expect(page.locator('.paired-row-table')).toBeVisible();
  if(number===126)await expect(page.locator('.matching-list-table tbody tr')).toHaveCount(4);
  const answer=official.questions[number-1].answer;
  await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${answer}\\b`)}).click();
 }
 await page.reload();await expect(page.getByRole('button',{name:'Finish',exact:true})).toBeVisible();
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 const result=await(await graded).json();expect(result.correct).toBe(6);expect(result.excluded).toBe(0);expect(result.scored).toBe(150);
 await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row')).toHaveCount(151);
 await page.getByRole('button',{name:'Review question 29',exact:true}).click();
 await expect(page.locator('.result-explanation')).toContainText('Editorial caveat');
 await page.reload();await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test('NDA II full offline paper has all 150 official answers and original table labels',async({page,context})=>{
 await context.addInitScript(()=>{window.print=()=>undefined;});
 await page.goto('/papers/nda-2026-ii-gat');
 for(const label of ['English','Science','GS']){
  await page.getByRole('button',{name:`${label} · 50`,exact:true}).click();
  await expect(page.getByRole('button',{name:'Start 50-question test →',exact:true})).toBeEnabled();
 }
 await page.getByRole('button',{name:'Full GAT · 150',exact:true}).click();
 const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();
 const paper=await popupPromise;await expect(paper.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
 await expect(paper.locator('.print-question')).toHaveCount(150);
 await expect(paper.getByRole('heading',{name:'NDA II 2026 · GAT',exact:true})).toBeVisible();
 await expect(paper.locator('[data-question-id="nda-2026-ii-29"] u')).toHaveText('in spite');
  for(const number of [43,44,45,46,47,48])await expect(paper.locator(`[data-question-id="nda-2026-ii-${number}"] .paired-row-table tbody tr`)).toHaveCount(number<47?2:3);
 await expect(paper.locator('[data-question-id="nda-2026-ii-126"] .matching-list-table tbody tr')).toHaveCount(4);
 const rows=paper.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(75);
 for(let i=0;i<75;i++){const cells=rows.nth(i).locator('td');await expect(cells.nth(1)).toHaveText(official.questions[i].answer+' †');await expect(cells.nth(4)).toHaveText(official.questions[i+75].answer+' †');}
 await paper.pdf({path:'tmp/nda-2026-ii/full-review/complete-official-paper.pdf',format:'A4',printBackground:true});
 await paper.close();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/nda-2026-ii/full-review/setup-mobile.png',fullPage:true});
});
