import {expect,test,type Page} from '@playwright/test';
import paper from '../../content/nda-2021-i-official-paper.json' with {type:'json'};
import type {PracticeSnapshot} from '../../lib/practice-types';
import type {PreparationInventory} from '../../lib/preparation-catalog';

async function snapshotFor(page:Page,scope='all'){
 const ids=new Set(paper.questions.filter(q=>q.questionNumber!==58&&(scope==='all'||(scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope))).map(q=>q.id));
 const inv:PreparationInventory=await(await page.request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
 const leaves=inv.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>ids.has(id)));
 const response=await page.request.post('/api/practice-snapshots',{data:{version:4,preparationExam:'NDA',taxonomyVersion:inv.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'}});
 expect(response.status()).toBe(201);const snapshot:PracticeSnapshot=await response.json();expect(new Set(snapshot.questions.map(q=>q.id))).toEqual(ids);return snapshot;
}
async function save(page:Page,snapshot:PracticeSnapshot,status='in_progress',answers={},includeAnswerKey=true){
 await page.evaluate(async({snapshot,status,answers,includeAnswerKey})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('upscpuraan-pyq',2);open.onupgradeneeded=()=>{const a=open.result.createObjectStore('attempts',{keyPath:'id'});a.createIndex('by-updated','updatedAt');const b=open.result.createObjectStore('bookmarks',{keyPath:'questionId'});b.createIndex('by-saved','savedAt');};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('attempts','readwrite');tx.objectStore('attempts').put({id:snapshot.id,snapshot,status,currentIndex:0,answers,feedback:{},elapsedSeconds:0,startedAt:snapshot.createdAt,updatedAt:snapshot.createdAt,...(status==='completed'?{completedAt:snapshot.createdAt}:{})});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
  sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey,paperTitle:'NDA I 2021 GAT · official final key selection'}));
 },{snapshot,status,answers,includeAnswerKey});
}
test('149 cleared questions: answer, navigate, reload, submit and view mobile results',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}`);
 const answer=async(letter:string)=>page.getByRole('group',{name:'Answer options',exact:true}).getByRole('button',{name:new RegExp(`^${letter}\\b`)}).click();
 await answer(paper.questions.find(q=>q.id===snapshot.questions[0].id)!.answer);
 for(const n of [10,30,70]){await page.getByRole('button',{name:`Question ${n}, not answered`,exact:true}).click();await answer(paper.questions.find(q=>q.id===snapshot.questions[n-1].id)!.answer);}
 await page.reload();await expect(page.locator('.question-heading')).toContainText('Question 70 of 149');
 const graded=page.waitForResponse(r=>r.url().endsWith('/api/practice/grade'));await page.getByRole('button',{name:'Finish',exact:true}).click();const result=await(await graded).json();expect(result.correct).toBe(4);expect(result.incorrect).toBe(0);expect(result.scored).toBe(149);expect(result.excluded).toBe(0);
 await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row')).toHaveCount(150);await page.reload();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
for(const [scope,count] of [['english',50],['science',48],['gs',51]] as const)test(`${scope}: exact preparation membership and mobile practice`,async({page})=>{
 await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page,scope);expect(snapshot.questions).toHaveLength(count);await save(page,snapshot);await page.setViewportSize({width:390,height:844});await page.goto(`/practice/${snapshot.id}`);await expect(page.locator('.question-heading')).toContainText(`Question 1 of ${count}`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('withdrawn Q58 remains reviewable and unpenalised in a historical saved result',async({page})=>{
 await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);const withdrawn=paper.questions.find(q=>q.questionNumber===58)!;const current=snapshot.questions[0];const old={...current,id:withdrawn.id,questionNumber:58,promptLines:withdrawn.promptLines,options:withdrawn.options,contentRevision:0};snapshot.id='nda-2021-i-historical-withdrawn';snapshot.questions=[old];await save(page,snapshot,'completed',{[old.id]:'A'});
 await page.goto(`/practice/${snapshot.id}/results`);await expect(page.getByText('1 question excluded from score.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Review question 1',exact:true}).click();await expect(page.locator('.result-question-options')).toContainText('Alumina');
});
test('offline print preserves all 149 answers and the original English formatting',async({page},testInfo)=>{
 await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/prepare/NDA');const snapshot=await snapshotFor(page);await save(page,snapshot);await page.goto(`/practice/${snapshot.id}/print`);
 await expect(page.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();await expect(page.locator('.print-question')).toHaveCount(149);await expect(page.locator('.print-question u').first()).toBeVisible();
 const rows=page.locator('.print-answer-key tbody tr');await expect(rows).toHaveCount(75);for(let i=0;i<75;i++){const cells=rows.nth(i).locator('td');for(const [offset,cell] of [[0,1],[75,4]]){const q=snapshot.questions[i+offset];if(!q)continue;await expect(cells.nth(cell)).toHaveText(`${paper.questions.find(r=>r.id===q.id)!.answer}`);}}
 await page.pdf({path:testInfo.outputPath('nda-2021-i-reviewed.pdf'),format:'A4',printBackground:true});await page.screenshot({path:testInfo.outputPath('print.png'),fullPage:true});
});
