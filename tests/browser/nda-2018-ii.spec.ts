import {expect,test} from '@playwright/test';
import paper from '../../content/nda-2018-ii-official-paper.json' with {type:'json'};
import type {PreparationInventory} from '../../lib/preparation-catalog';

test('NDA II 2018 exposes all 150 reviewed questions and both source figures',async({page})=>{
  await page.goto('/prepare/NDA');
  const ids=new Set(paper.questions.map(question=>question.id));
  const inventory:PreparationInventory=await(await page.request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
  const leaves=inventory.nodes.filter(node=>node.kind==='subtopic'&&node.questionIdsByExam?.NDA.some(id=>ids.has(id)));
  const response=await page.request.post('/api/practice-snapshots',{data:{version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(node=>node.subjectId))],paths:leaves.map(node=>({subtopicId:node.id,exams:['NDA']})),frozenScopes:leaves.map(node=>({id:node.id,subjectId:node.subjectId,label:node.label,parentId:node.parentId,order:node.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:node.questionIdsByExam!.NDA.filter(id=>ids.has(id))}})),count:'all',order:'newest'}});
  expect(response.status()).toBe(201);
  const snapshot=await response.json();
  expect(new Set(snapshot.questions.map((question:{id:string})=>question.id))).toEqual(ids);
  expect(snapshot.questions).toHaveLength(150);
  for(const question of paper.questions.filter(question=>question.requiresFigure)){
    const asset=await page.request.get(question.figureKey!);
    expect(asset.status()).toBe(200);
    expect((await asset.body()).byteLength).toBeGreaterThan(10000);
  }
});

test('Sources links NDA II 2018 to the complete original-order paper',async({page})=>{
  await page.goto('/legal/sources');
  const directory=page.getByRole('region',{name:'Added paper directory'});
  await directory.getByRole('button',{name:/^NDA/}).click();
  await directory.getByLabel('Year').selectOption('2018');
  const row=directory.getByRole('row',{name:/NDA 2018 · II GAT/});
  await expect(row).toContainText('150 / 150');
  await row.getByText('Review details').click();
  await expect(row).toContainText('official final key');
  await row.getByRole('link',{name:/Practise full paper/}).click();
  await expect(page).toHaveURL(/\/papers\/nda-2018-ii-gat$/);
  await expect(page.getByRole('heading',{name:'NDA II 2018 · GAT'})).toBeVisible();
});
