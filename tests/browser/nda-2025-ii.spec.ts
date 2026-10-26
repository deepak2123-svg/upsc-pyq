import {expect,test} from '@playwright/test';
import official from '../../content/nda-2025-ii-official-paper.json' with {type:'json'};

test('NDA II 2025 launches 149/150, preserves answers and accepts either Q58 option',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/papers/nda-2025-ii-gat');
 await expect(page.getByRole('heading',{name:'NDA II 2025 · GAT',exact:true})).toBeVisible();
 await expect(page.getByText(/149 available \/ 150 source questions/)).toBeVisible();
 const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Start 149-question test →',exact:true}).click();
 const snapshot=await(await created).json();expect(snapshot.questions).toHaveLength(149);expect(snapshot.questions.some((q:{questionNumber:number})=>q.questionNumber===85)).toBe(false);
 await expect(page.locator('.practice-prompt')).toContainText('Taking everything into consideration');
 const answer=async(letter:string)=>page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${letter}\\b`)}).click();
 await answer('B');
 for(const[number,letter]of [[58,'B'],[66,'B']] as const){await page.getByRole('button',{name:`Question ${number}, not answered`,exact:true}).click();await answer(letter);}
 await page.reload();await expect(page.locator('.question-heading')).toContainText('Question 66 of 149');
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));await page.getByRole('button',{name:'Finish',exact:true}).click();
 const result=await(await graded).json();expect(result.correct).toBe(2);expect(result.incorrect).toBe(1);expect(result.scored).toBe(149);expect(result.unattempted).toBe(146);
 expect(result.feedback['nda-2025-ii-58'].correctAnswers).toEqual(['A','B']);
 await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 const sheet=page.getByRole('table',{name:'Answer sheet',exact:true});await expect(sheet.getByRole('row')).toHaveCount(150);
 await expect(sheet.getByRole('row').nth(58)).toContainText('A / B');
 await page.getByRole('button',{name:'Review question 58',exact:true}).click();
 await expect(page.locator('.result-explanation')).toContainText('Official UPSC final key');
 await page.reload();await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('full offline paper retains passage, matching tables, original numbers and every accepted answer',async({page,context})=>{
 await context.addInitScript(()=>{window.print=()=>undefined;});
 await page.goto('/papers/nda-2025-ii-gat');
 const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();const paper=await popup;
 await expect(paper.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
 await expect(paper.locator('.print-question')).toHaveCount(149);
 await expect(paper.locator('[data-question-id="nda-2025-ii-1"]')).toContainText('Can agricultural productivity meet human needs');
 for(const n of [81,103,107,128])await expect(paper.locator(`[data-question-id="nda-2025-ii-${n}"] table`)).toBeVisible();
 await expect(paper.locator('[data-question-id="nda-2025-ii-19"] u')).toHaveText('dodgy');
 const eligible=official.questions.filter(q=>q.questionNumber!==85),rows=paper.locator('.print-answer-key tbody tr'),split=Math.ceil(eligible.length/2);
 await expect(rows).toHaveCount(split);
 for(let i=0;i<split;i++){const cells=rows.nth(i).locator('td');await expect(cells.nth(1)).toHaveText(eligible[i].questionNumber===58?'A / B':eligible[i].answer);if(eligible[i+split])await expect(cells.nth(4)).toHaveText(eligible[i+split].answer);}
 await paper.pdf({path:'tmp/nda-2025-ii/complete-official-paper.pdf',format:'A4',printBackground:true});
 await paper.close();
 for(const[label,count]of [['English',50],['Science',50],['GS',49]] as const){await page.getByRole('button',{name:`${label} · ${count}`,exact:true}).click();await expect(page.getByRole('button',{name:`Start ${count}-question test →`,exact:true})).toBeEnabled();}
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'tmp/nda-2025-ii/setup-mobile.png',fullPage:true});
});

for(const[label,count,scope]of [['English',50,'english'],['Science',50,'science'],['GS',49,'gs']] as const){
 test(`${label} section launches its exact reviewed membership`,async({page})=>{
  await page.goto('/papers/nda-2025-ii-gat');
  await page.getByRole('button',{name:`${label} · ${count}`,exact:true}).click();
  const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
  await page.getByRole('button',{name:`Start ${count}-question test →`,exact:true}).click();
  const snapshot=await(await created).json();
  expect(snapshot.questions.map((q:{id:string})=>q.id)).toEqual(official.questions.filter(q=>q.preparationScope===scope&&q.questionNumber!==85).map(q=>q.id));
  await expect(page.locator('.question-heading')).toContainText(`Question 1 of ${count}`);
 });
}
