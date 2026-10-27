import {expect,test,type Page} from '@playwright/test';
import paper from '../../content/nda-2024-ii-reviewed-paper.json' with {type:'json'};
import raw from '../../content/question-bank.json' with {type:'json'};

async function snapshotFor(page:Page,scope='all'){
 const ids=new Set(paper.questions.filter(q=>scope==='all'||(scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope)).map(q=>q.id));
 const inv=await(await page.request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
 const leaves=inv.nodes.filter((n:any)=>n.kind==='subtopic'&&n.questionIdsByExam.NDA.some((id:string)=>ids.has(id)));
 const response=await page.request.post('/api/practice-snapshots',{data:{version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map((n:any)=>n.subjectId))],paths:leaves.map((n:any)=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map((n:any)=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter((id:string)=>ids.has(id))}})),count:'all',order:'newest'}});
 expect(response.status()).toBe(201);const snapshot=await response.json();expect(new Set(snapshot.questions.map((q:any)=>q.id))).toEqual(ids);return snapshot;
}
async function save(page:Page,snapshot:any,status='in_progress',answers={},includeAnswerKey=true){
 await page.evaluate(async({snapshot,status,answers,includeAnswerKey})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('upscpuraan-pyq',2);open.onupgradeneeded=()=>{const a=open.result.createObjectStore('attempts',{keyPath:'id'});a.createIndex('by-updated','updatedAt');const b=open.result.createObjectStore('bookmarks',{keyPath:'questionId'});b.createIndex('by-saved','savedAt');};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('attempts','readwrite');tx.objectStore('attempts').put({id:snapshot.id,snapshot,status,currentIndex:0,answers,feedback:{},elapsedSeconds:0,startedAt:snapshot.createdAt,updatedAt:snapshot.createdAt,...(status==='completed'?{completedAt:snapshot.createdAt}:{})});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
  sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey,paperTitle:'NDA II 2024 GAT · independently verified selection'}));
 },{snapshot,status,answers,includeAnswerKey});
}
test('136 cleared questions: answer, rapid navigation, reload, submission and mobile results',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}`);
 const answer=async(letter:string)=>page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${letter}\\b`)}).click();
 await answer(paper.questions.find(q=>q.id===snapshot.questions[0].id)!.answer);
 for(const n of [10,30,70]){await page.getByRole('button',{name:`Question ${n}, not answered`,exact:true}).click();await answer(paper.questions.find(q=>q.id===snapshot.questions[n-1].id)!.answer);}
 await page.reload();await expect(page.locator('.question-heading')).toContainText('Question 70 of 136');
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));await page.getByRole('button',{name:'Finish',exact:true}).click();const result=await(await graded).json();expect(result.correct).toBe(4);expect(result.incorrect).toBe(0);expect(result.scored).toBe(136);expect(result.excluded).toBe(0);
 await expect(page.getByRole('heading',{name:'Result sheet',exact:true})).toBeVisible();await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row')).toHaveCount(137);
 await page.reload();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
for(const [scope,count] of [['english',46],['science',43],['gs',47]] as const)test(`${scope}: exact section membership and mobile practice`,async({page})=>{
 await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page,scope);expect(snapshot.questions).toHaveLength(count);await save(page,snapshot);await page.setViewportSize({width:390,height:844});await page.goto(`/practice/${snapshot.id}`);await expect(page.locator('.question-heading')).toContainText(`Question 1 of ${count}`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('offline print preserves all 136 answers, five figures, English layout and matching tables',async({page},testInfo)=>{
 await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}/print`);
 await expect(page.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();await expect(page.locator('.print-question')).toHaveCount(136);await expect(page.locator('.print-question img')).toHaveCount(5);
 expect(await page.locator('.print-question img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);
 const q107=paper.questions.find(q=>q.questionNumber===107)!;await expect(page.locator(`[data-question-id="${q107.id}"] table`)).toBeVisible();await expect(page.locator('.print-question u').first()).toBeVisible();
 const rows=page.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(68);
  for(let i=0;i<68;i++){const cells=rows.nth(i).locator('td');for(const [offset,cell] of [[0,1],[68,4]]){const q=snapshot.questions[i+offset];await expect(cells.nth(cell)).toHaveText(`${paper.questions.find(r=>r.id===q.id)!.answer} ‡`);}}
 await page.pdf({path:testInfo.outputPath('nda-2024-ii-reviewed.pdf'),format:'A4',printBackground:true});await page.screenshot({path:testInfo.outputPath('print.png'),fullPage:true});
});
test.describe('missing-asset fault injection',()=>{
test.use({serviceWorkers:'block'});
test('required figure failure blocks printing; historical Q107 keeps old options and is excluded',async({page})=>{
 // Isolate asset failure from the separately tested full answer-key network request.
 await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/legal/terms',{waitUntil:'domcontentloaded'});const snapshot=await snapshotFor(page);await save(page,snapshot,'in_progress',{},false);
 await page.route('**/question-figures/nda-2024-ii-q64.png',route=>route.abort());await page.goto(`/practice/${snapshot.id}/print`,{waitUntil:'domcontentloaded'});await expect(page.getByRole('alert')).toContainText('A required diagram could not be loaded');await expect(page.getByRole('button',{name:'Paper not ready',exact:true})).toBeDisabled();await page.unroute('**/question-figures/nda-2024-ii-q64.png');
 const current=snapshot.questions.find((q:any)=>q.id==='nda-2024-ii-107');const old=raw.questions.find(q=>q.id===current.id)!;snapshot.id='nda-2024-ii-historical-107';snapshot.questions=[{...current,options:old.options,contentRevision:0}];await save(page,snapshot,'completed',{[current.id]:'A'});
 await page.goto(`/practice/${snapshot.id}/results`,{waitUntil:'domcontentloaded'});await expect(page.getByText('1 question excluded from score.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Review question 1',exact:true}).click();await expect(page.locator('.result-question-options')).toContainText(old.options.C);
 await page.goto(`/practice/${snapshot.id}/print`,{waitUntil:'domcontentloaded'});await expect(page.locator('.print-question')).toContainText(old.options.C);await expect(page.locator('.print-answer-key')).toContainText('Excluded');
});
});
