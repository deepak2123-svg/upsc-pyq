import {expect,test,type APIRequestContext} from '@playwright/test';

// Fault injection must intercept the image request itself, not a PWA worker's
// independent fetch/cache path. Ordinary production flows test the PWA normally.
test.use({serviceWorkers:'block'});

async function figureSnapshot(request:APIRequestContext){
 const inventory=await(await request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
 const leaf=inventory.nodes.find((n:any)=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.includes('nda-2026-i-72'));
 const response=await request.post('/api/practice-snapshots',{data:{version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[leaf.subjectId],paths:[{subtopicId:leaf.id,exams:['NDA']}],frozenScopes:[{id:leaf.id,subjectId:leaf.subjectId,label:leaf.label,parentId:leaf.parentId,order:leaf.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:['nda-2026-i-72']}}],count:'all',order:'newest'}});
 expect(response.status()).toBe(201);return response.json();
}

test('printing waits for a delayed original diagram, not a fixed font timer',async({page,request})=>{
 const snapshot=await figureSnapshot(request);
 await page.addInitScript(()=>{(window as any).printCalls=0;window.print=()=>{(window as any).printCalls++;};});
 await page.goto('/');
 await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
 let release!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/figures/nda-2026-i/q72.png',async route=>{await gate;await route.continue();});
 try{
  await page.goto(`/practice/${snapshot.id}/print`,{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Preparing diagrams…',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>(window as any).printCalls)).toBe(0);
  release();
  await expect(page.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>(window as any).printCalls)).toBe(1);
  await expect.poll(()=>page.locator('.question-figure img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 }finally{release();}
});

test('a missing required diagram blocks both manual and automatic printing',async({page,request})=>{
 const snapshot=await figureSnapshot(request);
 await page.addInitScript(()=>{(window as any).printCalls=0;window.print=()=>{(window as any).printCalls++;};});
 await page.goto('/');
 await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:false})),snapshot);
 await page.route('**/figures/nda-2026-i/q72.png',route=>route.abort());
 await page.goto(`/practice/${snapshot.id}/print`);
 await expect(page.getByRole('alert')).toContainText('A required diagram could not be loaded');
 await expect(page.getByRole('button',{name:'Paper not ready',exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>(window as any).printCalls)).toBe(0);
 await expect(page.getByRole('button',{name:'Reload paper',exact:true})).toBeEnabled();
});
