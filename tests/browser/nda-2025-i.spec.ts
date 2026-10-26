import {expect,test} from '@playwright/test';
import official from '../../content/nda-2025-i-official-paper.json' with {type:'json'};

test('NDA I 2025 full paper preserves saved choices and scores the official key',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/papers/nda-2025-i-gat');
 await expect(page.getByRole('heading',{name:'NDA I 2025 · GAT',exact:true})).toBeVisible();
 const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Start 150-question test →',exact:true}).click();
 const snapshot=await(await created).json();expect(snapshot.questions).toHaveLength(150);
 expect(snapshot.questions.every((q:Record<string,unknown>)=>!('answer'in q)&&!('explanation'in q))).toBe(true);
 const answer=async(letter:string)=>page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${letter}\\b`)}).click();
 await answer('D');
 for(const[number,letter]of [[7,'B'],[86,'C'],[102,'C']] as const){await page.getByRole('button',{name:`Question ${number}, not answered`,exact:true}).click();await answer(letter);}
 await page.reload();await expect(page.locator('.question-heading')).toContainText('Question 102 of 150');
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));await page.getByRole('button',{name:'Finish',exact:true}).click();
 const result=await(await graded).json();expect(result.correct).toBe(3);expect(result.incorrect).toBe(1);expect(result.scored).toBe(150);expect(result.excluded).toBe(0);expect(result.unattempted).toBe(146);
 expect(result.feedback['nda-2025-i-86'].correctAnswer).toBe('D');expect(result.feedback['nda-2025-i-102'].correctAnswer).toBe('C');
 await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row')).toHaveCount(151);
 await page.getByRole('button',{name:'Review question 102',exact:true}).click();await expect(page.locator('.result-explanation')).toContainText('Editorial caveat');
 await page.reload();await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('offline full paper contains every question, matching table and official answer',async({page,context})=>{
 await context.addInitScript(()=>{window.print=()=>undefined;});
 await page.goto('/papers/nda-2025-i-gat');
 const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();const paper=await popup;
 await expect(paper.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();await expect(paper.locator('.print-question')).toHaveCount(150);
 const id=(n:number)=>official.questions.find(q=>q.questionNumber===n)!.id;
 for(const n of [62,81,84])await expect(paper.locator(`[data-question-id="${id(n)}"] table`)).toBeVisible();
 for(const n of [16,41])await expect(paper.locator(`[data-question-id="${id(n)}"] u`).first()).toBeVisible();
 const rows=paper.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(75);
 for(let i=0;i<75;i++){const cells=rows.nth(i).locator('td');await expect(cells.nth(1)).toHaveText(official.questions[i].answer);await expect(cells.nth(4)).toHaveText(official.questions[i+75].answer);}
 await paper.pdf({path:'tmp/nda-2025-i/complete-official-paper.pdf',format:'A4',printBackground:true});await paper.close();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'tmp/nda-2025-i/setup-mobile.png',fullPage:true});
});

for(const[label,count,scope]of [['English',50,'english'],['Science',49,'science'],['GS',51,'gs']] as const){
 test(`${label} launches only its exact reviewed source membership`,async({page})=>{
  await page.goto('/papers/nda-2025-i-gat');await page.getByRole('button',{name:`${label} · ${count}`,exact:true}).click();
  const created=page.waitForResponse(r=>r.url().endsWith('/api/practice-snapshots')&&r.request().method()==='POST');await page.getByRole('button',{name:`Start ${count}-question test →`,exact:true}).click();
  const snapshot=await(await created).json();expect(snapshot.questions.map((q:{id:string})=>q.id)).toEqual(official.questions.filter(q=>scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope).map(q=>q.id));
  await expect(page.locator('.question-heading')).toContainText(`Question 1 of ${count}`);
 });
}
