import {expect,test,type Page} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

type Question={id:string;questionNumber:number;preparationScope:string;requiresFigure?:boolean};
type Paper={paperId:string;questions:Question[]};
type Policy=Record<string,{status:string}>;
type AuditPaper={slug:string;paper:Paper;policy:Policy;available:Question[];withdrawn:number[]};

const accepted=new Set(['official-final','official-provisional','reasoned-verified']);
const content=join(process.cwd(),'content');
const officialFiles=readdirSync(content).filter(name=>/^nda-\d{4}-(?:i|ii|i-ii)-official-paper\.json$/.test(name)&&!name.includes('mathematics'));
const papers:AuditPaper[]=[...officialFiles.map(name=>{
 const base=name.replace('-official-paper.json','');
 const paper=JSON.parse(readFileSync(join(content,name),'utf8')) as Paper;
 const policy=JSON.parse(readFileSync(join(content,`${base}-official-review-policy.json`),'utf8')) as Policy;
 return {slug:paper.paperId??`${base}-gat`,paper,policy};
}),(()=>{
 const paper=JSON.parse(readFileSync(join(content,'nda-2024-ii-reviewed-paper.json'),'utf8')) as Paper;
 const policy=JSON.parse(readFileSync(join(content,'nda-2024-ii-review-policy.json'),'utf8')) as Policy;
 return {slug:paper.paperId,paper,policy};
})()].map(({slug,paper,policy})=>({
 slug,paper,policy,
 available:paper.questions.filter(question=>accepted.has(policy[question.id]?.status)),
 withdrawn:Object.entries(policy).filter(([,review])=>review.status==='withdrawn').map(([id])=>Number(id.match(/-(\d+)$/)?.[1])).sort((a,b)=>a-b),
})).sort((a,b)=>a.slug.localeCompare(b.slug));

expect(papers,'exactly 25 NDA GAT source-paper sets').toHaveLength(25);

function idsFor(paper:AuditPaper,scope:'all'|'english'|'science'|'gs'){
 if(scope!=='all'&&/^nda-2026-(?:i|ii)-gat$/.test(paper.slug)){
  const [from,to]=scope==='english'?[1,50]:scope==='science'?[51,100]:[101,150];
  return paper.available.filter(question=>question.questionNumber>=from&&question.questionNumber<=to).map(question=>question.id);
 }
 return paper.available.filter(question=>scope==='all'||(scope==='gs'?['gs','defence-world-history'].includes(question.preparationScope):question.preparationScope===scope)).map(question=>question.id);
}

async function createSnapshot(page:Page,paper:AuditPaper,scope:'all'|'english'|'science'|'gs'){
 const expected=idsFor(paper,scope);
 await page.goto(`/papers/${paper.slug}`,{waitUntil:'domcontentloaded'});
 await expect(page.locator('main.original-paper-page')).toBeVisible();
 if(scope!=='all')await page.getByRole('button',{name:new RegExp(`^${scope==='gs'?'GS':scope[0].toUpperCase()+scope.slice(1)} · ${expected.length}$`)}).click();
 const responsePromise=page.waitForResponse(response=>response.url().endsWith('/api/practice-snapshots')&&response.request().method()==='POST');
 await page.getByRole('button',{name:`Start ${expected.length}-question test →`,exact:true}).click();
 const response=await responsePromise;
 expect(response.status(),`${paper.slug} ${scope} snapshot status`).toBe(201);
 const snapshot=await response.json();
 expect(snapshot.questions,`${paper.slug} ${scope} question count`).toHaveLength(expected.length);
 expect(snapshot.matchingCount,`${paper.slug} ${scope} matching count`).toBe(expected.length);
 expect(snapshot.questions.map((question:{id:string})=>question.id),`${paper.slug} ${scope} membership and order`).toEqual(expected);
 expect(new Set(snapshot.questions.map((question:{id:string})=>question.id)).size,`${paper.slug} ${scope} unique membership`).toBe(expected.length);
 expect(snapshot.questions.filter((question:{id:string;answer?:unknown})=>question.answer!==undefined).map((question:{id:string})=>question.id),`${paper.slug} ${scope} answer leakage`).toEqual([]);
 expect(snapshot.questions.filter((question:{id:string;options?:Record<string,string>})=>{const count=Object.keys(question.options??{}).length;return count<3||count>4;}).map((question:{id:string})=>question.id),`${paper.slug} ${scope} invalid option counts`).toEqual([]);
 await expect(page).toHaveURL(/\/practice\//);
 return snapshot;
}

test.describe('NDA GAT live production audit',()=>{
 test.use({serviceWorkers:'block'});
 test('Sources exposes the complete 25-paper GAT collection and every withdrawal',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/legal/sources');
  await page.getByRole('button',{name:/^NDA\b/}).click();
  const rows=page.locator('.source-table tbody tr').filter({hasText:'GAT'}).filter({hasNotText:'Mathematics'});
  await expect(rows).toHaveCount(25);
  for(const paper of papers){
   const parts=paper.slug.match(/^nda-(\d{4})-(i|ii|i-ii)-gat$/)!;
   const label=parts[2]==='i'?'I':parts[2]==='ii'?'II':'I/II';
   const row=rows.filter({hasText:new RegExp(`${parts[1]} · ${label.replace('/','\\/')}($|[^I])`)});
   await expect(row,`${paper.slug} source row`).toHaveCount(1);
   await expect(row.locator('.source-count')).toContainText(`${paper.available.length} / 150`);
   await expect(row.getByRole('link',{name:/Practise full paper/})).toHaveAttribute('href',`/papers/${paper.slug}`);
   for(const number of paper.withdrawn)await expect(row.locator('.source-gaps')).toContainText(`Q${number}`);
   if(!paper.withdrawn.length)await expect(row.locator('.source-gaps')).toContainText('None');
  }
  expect(errors).toEqual([]);
 });

 for(const paper of papers)test(`${paper.slug}: launch, sections, withdrawal, figures, PDF and responsive formatting`,async({page,context})=>{
  test.setTimeout(120_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const full=await createSnapshot(page,paper,'all');
  expect(full.questions.map((question:{questionNumber:number})=>question.questionNumber),`${paper.slug} source order`).toEqual(paper.available.map(question=>question.questionNumber));
  for(const number of paper.withdrawn)expect(full.questions.some((question:{questionNumber:number})=>question.questionNumber===number),`${paper.slug} excludes withdrawn Q${number}`).toBe(false);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${paper.slug} mobile practice overflow`).toBe(true);
  for(const scope of ['english','science','gs'] as const)await createSnapshot(page,paper,scope);

  await page.setViewportSize({width:1600,height:1000});
  await page.goto(`/papers/${paper.slug}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${paper.slug} desktop setup overflow`).toBe(true);
  const popupPromise=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Offline - PDF paper',exact:true}).click();
  const printable=await popupPromise;
  await expect(printable.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
  await expect(printable.locator('.print-question')).toHaveCount(paper.available.length);
  await expect(printable.locator('.print-answer-key tbody tr')).toHaveCount(Math.ceil(paper.available.length/2));
  const images=printable.locator('.print-question img');
  await expect(images).toHaveCount(paper.available.filter(question=>question.requiresFigure).length);
  expect(await images.evaluateAll(nodes=>nodes.every(node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth>0)),`${paper.slug} all figure assets decoded`).toBe(true);
  expect(await printable.locator('.print-question').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)),`${paper.slug} printable question overflow`).toBe(true);
  const pdf=await printable.pdf({format:'A4',printBackground:true});
  expect(pdf.subarray(0,4).toString(),`${paper.slug} generated PDF signature`).toBe('%PDF');
  expect(pdf.length,`${paper.slug} generated PDF size`).toBeGreaterThan(50_000);
  await printable.close();

  await page.setViewportSize({width:390,height:844});
  await page.goto(`/papers/${paper.slug}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${paper.slug} mobile setup overflow`).toBe(true);
  expect(errors,`${paper.slug} page errors`).toEqual([]);
 });
});
