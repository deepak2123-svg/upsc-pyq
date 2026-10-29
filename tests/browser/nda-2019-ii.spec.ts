import {expect,test,type Page} from '@playwright/test';
import paper from '../../content/nda-2019-ii-official-paper.json' with {type:'json'};
import type {PracticeSnapshot} from '../../lib/practice-types';
import type {PreparationInventory} from '../../lib/preparation-catalog';

async function snapshotFor(page:Page,scope='all'){
 const ids=new Set(paper.questions.filter(q=>q.questionNumber!==119&&(scope==='all'||(scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope))).map(q=>q.id));
 const inv:PreparationInventory=await(await page.request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
 const leaves=inv.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>ids.has(id)));
 const response=await page.request.post('/api/practice-snapshots',{data:{version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'}});
 expect(response.status()).toBe(201);const snapshot:PracticeSnapshot=await response.json();expect(new Set(snapshot.questions.map(q=>q.id))).toEqual(ids);return snapshot;
}
async function save(page:Page,snapshot:PracticeSnapshot,status='in_progress',answers:Record<string,string>={},includeAnswerKey=true){
 await page.evaluate(async({snapshot,status,answers,includeAnswerKey})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('upscpuraan-pyq',2);open.onupgradeneeded=()=>{const a=open.result.createObjectStore('attempts',{keyPath:'id'});a.createIndex('by-updated','updatedAt');const b=open.result.createObjectStore('bookmarks',{keyPath:'questionId'});b.createIndex('by-saved','savedAt');};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('attempts','readwrite');tx.objectStore('attempts').put({id:snapshot.id,snapshot,status,currentIndex:0,answers,feedback:{},elapsedSeconds:0,startedAt:snapshot.createdAt,updatedAt:snapshot.createdAt,...(status==='completed'?{completedAt:snapshot.createdAt}:{})});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
  sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey,paperTitle:'NDA II 2019 GAT · official final key selection'}));
 },{snapshot,status,answers,includeAnswerKey});
}
test('149 cleared questions grade, persist and fit mobile results',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}`);
 const first=paper.questions.find(q=>q.id===snapshot.questions[0].id)!;await page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${first.answer}\\b`)}).click();
 await page.reload();const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));await page.getByRole('button',{name:'Finish',exact:true}).click();const result=await(await graded).json();expect(result.correct).toBe(1);expect(result.scored).toBe(149);expect(result.excluded).toBe(0);
 await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row')).toHaveCount(150);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
for(const [scope,count] of [['english',50],['science',50],['gs',49]] as const)test(`${scope}: exact preparation membership`,async({page})=>{
 await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page,scope);expect(snapshot.questions).toHaveLength(count);
});
test('withdrawn Q119 remains reviewable and unpenalised historically',async({page})=>{
 await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);const withdrawn=paper.questions.find(q=>q.questionNumber===119)!;const current=snapshot.questions[0];const old={...current,id:withdrawn.id,questionNumber:119,promptLines:withdrawn.promptLines,options:withdrawn.options,contentRevision:0};snapshot.id='nda-2019-ii-historical-withdrawn';snapshot.questions=[old];await save(page,snapshot,'completed',{[old.id]:'A'});
 await page.goto(`/practice/${snapshot.id}/results`);await expect(page.getByText('1 question excluded from score.',{exact:false})).toBeVisible();
});
test('print preserves all questions, key answers, passage formatting and circuit',async({page},testInfo)=>{
 await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}/print`);
 await expect(page.locator('.print-question')).toHaveCount(149);await expect(page.locator('.print-question img')).toHaveCount(1);expect(await page.locator('.print-question img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);await expect(page.locator('.print-question u').first()).toBeVisible();await expect(page.getByText('Studies serve for delight',{exact:false}).first()).toBeVisible();
 const rows=page.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(75);for(let i=0;i<75;i++){const cells=rows.nth(i).locator('td');for(const [offset,cell] of [[0,1],[75,4]]){const q=snapshot.questions[i+offset];if(q)await expect(cells.nth(cell)).toHaveText(paper.questions.find(r=>r.id===q.id)!.answer);}}
 await page.pdf({path:testInfo.outputPath('nda-2019-ii-reviewed.pdf'),format:'A4',printBackground:true});
});
test('Sources discloses official accounting',async({page})=>{
 await page.goto('/legal/sources');const directory=page.getByRole('region',{name:'Added paper directory'});await directory.getByRole('button',{name:/^NDA/}).click();await directory.getByLabel('Year').selectOption('2019');const row=directory.getByRole('row',{name:/NDA 2019 · II GAT/});await expect(row).toContainText('149 / 150');await expect(row).toContainText('Q119');await row.getByText('Review details').click();await expect(row).toContainText('Q119 withdrawn');
});
