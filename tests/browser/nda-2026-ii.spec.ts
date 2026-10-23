import {expect,test} from '@playwright/test';

test('NDA II 2026 source tables and expressions render online and in printable papers',async({page,request})=>{
 const inventory=await(await request.get('/api/pyqs/inventory')).json();
 const wanted=new Set([73,84,90,126].map(n=>`nda-2026-ii-${n}`));
 const leaves=inventory.nodes.filter((n:any)=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam?.NDA.some((id:string)=>wanted.has(id)));
 const frozenScopes=leaves.map((n:any)=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam.NDA.filter((id:string)=>wanted.has(id))}}));
 const response=await request.post('/api/practice-snapshots',{data:{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map((n:any)=>n.subjectId))],paths:leaves.map((n:any)=>({subtopicId:n.id,exams:['NDA']})),frozenScopes,count:'all',order:'newest',durationMinutes:null}});
 expect(response.status()).toBe(201);const snapshot=await response.json();expect(snapshot.questions).toHaveLength(4);
 await page.goto('/');
 await page.evaluate(({snapshot})=>{
  sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true}));
  window.print=()=>undefined;
 },{snapshot});
 await page.goto(`/practice/${snapshot.id}/print`);
 await expect(page.locator('.print-question')).toHaveCount(4);
 await expect(page.getByText('† Official provisional key; subject to revision.',{exact:true})).toBeVisible();
 for(const number of [84,90,126])await expect(page.locator(`[data-question-id="nda-2026-ii-${number}"] table`)).toBeVisible();
 await expect(page.locator('[data-question-id="nda-2026-ii-73"]')).toContainText('N C⁻¹');
 await page.screenshot({path:'tmp/nda-2026-ii/print-preview.png',fullPage:true});
 // Same source snapshot in the existing local-only attempt store.
 await page.evaluate(async({snapshot})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('upscpuraan-pyq',2);open.onupgradeneeded=()=>{const db=open.result;if(!db.objectStoreNames.contains('attempts')){const s=db.createObjectStore('attempts',{keyPath:'id'});s.createIndex('by-updated','updatedAt');}if(!db.objectStoreNames.contains('bookmarks')){const s=db.createObjectStore('bookmarks',{keyPath:'questionId'});s.createIndex('by-saved','savedAt');}};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
  const now=new Date().toISOString();
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('attempts','readwrite');tx.objectStore('attempts').put({id:snapshot.id,snapshot,status:'in_progress',currentIndex:0,answers:{},feedback:{},elapsedSeconds:0,startedAt:now,updatedAt:now,timingMode:'wall_clock'});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
 },{snapshot});
 await page.goto(`/practice/${snapshot.id}`);
 await expect(page.locator('.question-heading')).toContainText('Question 1 of 4');
 await expect(page.getByRole('progressbar')).toHaveCount(0);
  const matchingIndex=snapshot.questions.findIndex((q:{id:string})=>q.id==='nda-2026-ii-126');
  await page.getByRole('button',{name:`Question ${matchingIndex+1}, not answered`,exact:true}).click();
 await expect(page.getByRole('table')).toBeVisible();
 await page.screenshot({path:'tmp/nda-2026-ii/online-preview.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
