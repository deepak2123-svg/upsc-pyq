import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type {PracticeSnapshot} from '../../lib/practice-types';

const bank = JSON.parse(readFileSync(new URL('../../content/question-bank.json', import.meta.url), 'utf8'));
const register=JSON.parse(readFileSync(new URL('../../content/question-review-state.json',import.meta.url),'utf8'));

test('2014 modal and option repairs preserve historical snapshots through results and printable keys',async({page},testInfo)=>{
  await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/');
  const ids=['cse-2014-gs-i-13','cse-2014-gs-i-19'];
  const inventory=await(await page.request.get('/api/pyqs/inventory')).json();
  const leaves=inventory.nodes.filter((n:any)=>n.kind==='subtopic'&&!n.legacyOnly&&ids.some(id=>n.questionIdsByExam.CSE.includes(id)));
  const response=await page.request.post('/api/practice-snapshots',{data:{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map((n:any)=>n.subjectId))],paths:leaves.map((n:any)=>({subtopicId:n.id,exams:['CSE']})),count:'all',order:'newest'}});
  expect(response.status()).toBe(201);const snapshot=await response.json();
  snapshot.questions=snapshot.questions.filter((q:any)=>ids.includes(q.id));snapshot.id='material-2014-current';snapshot.matchingCount=2;
  expect(snapshot.questions).toHaveLength(2);expect(snapshot.questions.every((q:any)=>q.contentRevision===1)).toBe(true);
  const answers=Object.fromEntries(ids.map(id=>[id,'C']));
  const graded=await page.request.post('/api/practice/grade',{data:{questionIds:ids,answers,contentRevisions:Object.fromEntries(ids.map(id=>[id,1]))}});
  expect((await graded.json()).correct).toBe(2);
  await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toHaveCount(2);
  await expect(page.locator('.print-question').filter({hasText:'evolution of organisms'})).toContainText('might have influenced');
  await expect(page.locator('.print-question').filter({hasText:'carbon cycle'})).toContainText('1, 2 and 4 only');
  await expect(page.locator('.print-answer-key').getByRole('cell',{name:'C',exact:true})).toHaveCount(2);
  await expect(page.getByRole('button',{name:'Print / Save as PDF',exact:true})).toBeEnabled();
  await expect(page.locator('.print-answer-key')).not.toContainText('Excluded');
  await page.pdf({path:testInfo.outputPath('material-2014-current.pdf'),format:'A4',printBackground:true});
  snapshot.id='material-2014-historical';snapshot.questions=snapshot.questions.map((q:any)=>{
    const raw=bank.questions.find((r:any)=>r.id===q.id);return {...q,promptLines:raw.promptLines,options:raw.options,sourceTextHash:raw.sourceTextHash,contentRevision:0};
  });
  await page.evaluate(async({snapshot,answers})=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('upscpuraan-pyq',2);open.onupgradeneeded=()=>{const a=open.result.createObjectStore('attempts',{keyPath:'id'});a.createIndex('by-updated','updatedAt');const b=open.result.createObjectStore('bookmarks',{keyPath:'questionId'});b.createIndex('by-saved','savedAt');};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('attempts','readwrite');tx.objectStore('attempts').put({id:snapshot.id,snapshot,status:'completed',currentIndex:0,answers,feedback:Object.fromEntries(Object.keys(answers).map(id=>[id,{correct:true,correctAnswer:'C',explanation:null}])),elapsedSeconds:30,startedAt:snapshot.createdAt,updatedAt:snapshot.createdAt,completedAt:snapshot.createdAt});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
    sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true}));
  },{snapshot,answers});
  await page.goto(`/practice/${snapshot.id}/results`);
  await expect(page.getByText('2 questions excluded from score.',{exact:false})).toBeVisible();
  await expect(page.getByRole('table',{name:'Answer sheet',exact:true}).getByRole('row').filter({hasText:'Excluded from score'})).toHaveCount(2);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question').filter({hasText:'evolution of organisms'})).toContainText('has/have influenced');
  await expect(page.locator('.print-question').filter({hasText:'carbon cycle'})).not.toContainText('1, 2 and 4 only');
  await expect(page.locator('.print-answer-key').getByRole('cell',{name:'Excluded',exact:true})).toHaveCount(2);
  await page.pdf({path:testInfo.outputPath('material-2014-historical.pdf'),format:'A4',printBackground:true});
});

test('material Q94 repair reaches new prints while old snapshots keep their text and lose scoring penalties',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.print=()=>{};});await page.goto('/');
  const inventory=await(await page.request.get('/api/pyqs/inventory')).json();
  const leaf=inventory.nodes.find((n:any)=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam.CSE.includes('cse-2013-gs-i-94'));
  const response=await page.request.post('/api/practice-snapshots',{data:{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:[leaf.subjectId],paths:[{subtopicId:leaf.id,exams:['CSE']}],count:'all',order:'newest'}});
  expect(response.status()).toBe(201);const snapshot=await response.json();
  snapshot.questions=snapshot.questions.filter((q:any)=>q.id==='cse-2013-gs-i-94');snapshot.id='material-source-current';snapshot.matchingCount=1;
  expect(snapshot.questions[0].contentRevision).toBe(1);
  await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toContainText('Tiny leaves or no leaves');
  await expect(page.locator('.print-answer-key')).toContainText('D');
  await expect(page.locator('.print-answer-key')).not.toContainText('Excluded');
  await page.pdf({path:testInfo.outputPath('material-source-current.pdf'),format:'A4',printBackground:true});
  const raw=bank.questions.find((q:any)=>q.id==='cse-2013-gs-i-94');
  snapshot.id='material-source-historical';snapshot.questions=snapshot.questions.map((q:any)=>({...q,promptLines:raw.promptLines,sourceTextHash:raw.sourceTextHash,contentRevision:0}));
  await page.evaluate(async snapshot=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      const open=indexedDB.open('upscpuraan-pyq',2);
      open.onupgradeneeded=()=>{const attempts=open.result.createObjectStore('attempts',{keyPath:'id'});attempts.createIndex('by-updated','updatedAt');const bookmarks=open.result.createObjectStore('bookmarks',{keyPath:'questionId'});bookmarks.createIndex('by-saved','savedAt');};
      open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);
    });
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('attempts','readwrite');
      tx.objectStore('attempts').put({id:snapshot.id,snapshot,status:'completed',currentIndex:0,answers:{'cse-2013-gs-i-94':'A'},feedback:{},elapsedSeconds:20,startedAt:snapshot.createdAt,updatedAt:snapshot.createdAt,completedAt:snapshot.createdAt});
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
    });db.close();
    sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true}));
  },snapshot);
  await page.goto(`/practice/${snapshot.id}/results`);
  await expect(page.getByText('1 question excluded from score.',{exact:false})).toBeVisible();
  await expect(page.getByRole('table',{name:'Answer sheet',exact:true})).toContainText('Excluded from score');
  await page.getByRole('button',{name:'Review question 1',exact:true}).click();
  await expect(page.locator('.result-question-options .is-correct')).toHaveCount(0);
  await expect(page.locator('.result-explanation')).toContainText('predates a material correction');
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toContainText('Tiny leaves');
  await expect(page.locator('.print-question')).not.toContainText('or no leaves');
  await expect(page.locator('.print-answer-key')).toContainText('Excluded');
  await page.pdf({path:testInfo.outputPath('material-source-historical.pdf'),format:'A4',printBackground:true});
  expect(errors).toEqual([]);
});

test('nonmaterial source corrections reach new PDFs without rewriting historical print snapshots',async({page},testInfo)=>{
  await page.addInitScript(()=>{window.print=()=>{};});
  await page.goto('/');
  const inventory=await(await page.request.get('/api/pyqs/inventory')).json();
  const leaf=inventory.nodes.find((n:any)=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionIdsByExam.CSE.includes('cse-2013-gs-i-53'));
  const response=await page.request.post('/api/practice-snapshots',{data:{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:[leaf.subjectId],paths:[{subtopicId:leaf.id,exams:['CSE']}],count:'all',order:'newest'}});
  expect(response.status()).toBe(201);
  const snapshot=await response.json();
  snapshot.questions=snapshot.questions.filter((q:any)=>q.id==='cse-2013-gs-i-53');
  snapshot.id='nonmaterial-source-current';snapshot.matchingCount=1;
  await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toHaveCount(1);
  await expect(page.locator('.print-question')).toContainText('kinds of organism');
  await expect(page.locator('.print-question')).not.toContainText('kinds of an organism');
  await expect(page.locator('.print-answer-key')).toContainText('B');
  await page.pdf({path:testInfo.outputPath('nonmaterial-source-current.pdf'),format:'A4',printBackground:true});
  const raw=bank.questions.find((q:any)=>q.id==='cse-2013-gs-i-53');
  snapshot.id='nonmaterial-source-historical';
  snapshot.questions=snapshot.questions.map((q:any)=>({...q,promptLines:raw.promptLines,sourceTextHash:raw.sourceTextHash}));
  await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toContainText('kinds of an organism');
  await expect(page.locator('.print-answer-key')).not.toContainText('Excluded');
  await expect(page.locator('.print-answer-key')).toContainText('B');
});

test('historical pending questions are excluded in results, question review and PDF keys', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.print = () => {}; });
  await page.goto('/');
  const ids = ['cse-2024-gs-i-20', 'nda-2021-ii-54','nda-2015-ii-77','cds-2015-2-112','nda-2016-i-138'];
  const questions = ids.map(id => {
    const q = id==='nda-2015-ii-77'?register.records[id].changes[0].before:bank.questions.find((row: { id: string }) => row.id === id);
    return { id: q.id, exam: q.exam, year: q.year, paper: id==='cds-2015-2-112'?'2':q.paper, questionNumber: q.questionNumber, subject: q.subject, topic: q.topic, subtopic: q.subtopic, promptLines: q.promptLines, options: q.options, sourceTextHash: q.sourceTextHash };
  });
  const snapshot = { id: 'audit-historical-exclusion', contentVersion: 'historical', createdAt: new Date().toISOString(), recipe: { version: 3, subjectIds: ['subject:geography'], paths: [], count: 'all', order: 'newest' }, questions };
  await page.evaluate(async snapshot => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('upscpuraan-pyq', 2);
      open.onupgradeneeded = () => {
        const attempts = open.result.createObjectStore('attempts', { keyPath: 'id' }); attempts.createIndex('by-updated', 'updatedAt');
        const bookmarks = open.result.createObjectStore('bookmarks', { keyPath: 'questionId' }); bookmarks.createIndex('by-saved', 'savedAt');
      };
      open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('attempts', 'readwrite');
      transaction.objectStore('attempts').put({ id: snapshot.id, snapshot, status: 'completed', currentIndex: 0, answers: Object.fromEntries(snapshot.questions.map(q=>[q.id,'A'])), feedback: { 'cse-2024-gs-i-20': { correct: false, correctAnswer: 'C', explanation: null } }, elapsedSeconds: 20, startedAt: snapshot.createdAt, updatedAt: snapshot.createdAt, completedAt: snapshot.createdAt });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`, JSON.stringify({ snapshot, includeAnswerKey: true }));
  }, snapshot);
  await page.goto(`/practice/${snapshot.id}/results`);
  await expect(page.getByText('3 questions excluded from score.', { exact: false })).toBeVisible();
  await expect(page.getByText(/Source corrected to CDS 2015 · 1 · Q112/)).toBeVisible();
  const sheet = page.getByRole('table', { name: 'Answer sheet', exact: true });
  await expect(sheet).toContainText('Excluded from score');
  await expect(page.locator('.result-numbers')).toContainText('100%');
  await sheet.getByRole('button', { name: 'Review question 1', exact: true }).click();
  await expect(page.locator('.result-question-options .is-correct')).toHaveCount(0);
  await expect(page.locator('.result-question-options .is-selected')).toHaveCSS('background-color', 'rgb(238, 242, 255)');
  await expect(page.locator('.result-explanation')).toContainText('Withdrawn');
  await page.screenshot({ path: testInfo.outputPath('excluded-result.png'), fullPage: true });
  await page.reload();
  await expect(sheet).toContainText('Excluded from score');
  await page.goto(`/practice/${snapshot.id}?q=0`);
  await expect(page.locator('.answer-feedback')).toContainText('Excluded from score');
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-answer-key table')).toContainText('Excluded');
  await expect(page.locator('.print-question')).toHaveCount(5);
  await expect(page.locator('.print-question').nth(2)).toContainText(questions[2].options.A);
  await page.pdf({path:testInfo.outputPath('historical-exclusions.pdf'),format:'A4',printBackground:true});
  await page.screenshot({ path: testInfo.outputPath('excluded-print.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('new printable papers preserve original maps, matching tables and corrected answer keys',async({page},testInfo)=>{
  await page.addInitScript(()=>{window.print=()=>{};});
  await page.goto('/');
  const inventory:{taxonomyVersion:string;subjects:{id:string;legacyOnly?:boolean}[];nodes:{id:string;kind:string;legacyOnly?:boolean;questionCount:number;examCounts:Record<string,number>}[]}=await (await page.request.get('/api/pyqs/inventory')).json();
  const result=await page.request.post('/api/practice-snapshots',{data:{version:4,taxonomyVersion:inventory.taxonomyVersion,subjectIds:inventory.subjects.filter(s=>!s.legacyOnly).map(s=>s.id),paths:inventory.nodes.filter(n=>n.kind==='subtopic'&&!n.legacyOnly&&n.questionCount>0).map(n=>({subtopicId:n.id,exams:['CSE','CAPF','CDS','NDA'].filter(e=>n.examCounts[e]>0)})),count:'all',order:'newest'}});
  expect(result.status()).toBe(201);
  const snapshot:PracticeSnapshot=await result.json();
  const ids=['capf-2019-i-120','nda-2015-ii-77','capf-2025-i-71','nda-2025-i-92'];
  snapshot.questions=ids.map(id=>snapshot.questions.find(q=>q.id===id)!);
  expect(snapshot.questions.every(Boolean)).toBe(true);
  snapshot.id='audit-new-paper';
  snapshot.matchingCount=4;
  await page.evaluate(snapshot=>sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true})),snapshot);
  await page.goto(`/practice/${snapshot.id}/print`);
  await expect(page.locator('.print-question')).toHaveCount(4);
  await expect(page.locator('.print-question').first().locator('img')).toBeVisible();
  await expect(page.locator('.print-question').nth(1).locator('table')).toBeVisible();
  await expect(page.locator('.print-answer-key')).not.toContainText('Excluded');
  const cells=page.locator('.print-answer-key tbody tr');
  await expect(cells.first()).toContainText('Q120');
  await expect(cells.nth(1)).toContainText('Q77');
  await expect(cells.first().locator('td').nth(4)).toHaveText('A');
  await expect(cells.nth(1).locator('td').nth(1)).toHaveText('A');
  await page.pdf({path:testInfo.outputPath('verified-map-and-matching.pdf'),format:'A4',printBackground:true});
});
