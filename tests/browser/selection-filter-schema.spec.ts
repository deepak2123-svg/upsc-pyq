import { expect, test } from '@playwright/test';

type Exam = 'CSE'|'CAPF'|'CDS'|'NDA';
type Node = {id:string;kind:string;label:string;subjectId:string;parentId?:string;order:number;questionIdsByExam?:Record<Exam,string[]>};

function descendants(inventory:{nodes:Node[]},scopeId:string) {
  const byId=new Map(inventory.nodes.map(node=>[node.id,node]));
  return inventory.nodes.filter(node=>node.kind==='subtopic'&&(()=>{
    let current:Node|undefined=node;
    while(current){if(current.id===scopeId)return true;current=current.parentId?byId.get(current.parentId):undefined;}
    return false;
  })());
}

test('every preparation-syllabus question has year metadata for filtering',async({request})=>{
  for(const exam of ['NDA','CDS','CSE']) {
    const inventory=await (await request.get(`/api/pyqs/inventory?preparationExam=${exam}`)).json();
    const ids=new Set<string>(inventory.nodes.filter((node:Node)=>node.kind==='subtopic')
      .flatMap((node:Node)=>Object.values(node.questionIdsByExam||{}).flat()));
    const missing=[...ids].filter(id=>!Number.isInteger(inventory.questionYearsById[id]));
    expect(missing,`${exam} preparation questions missing year metadata`).toEqual([]);
  }
});

test('legacy hidden source and year filters recover the selected NDA membership and can start',async({page,request})=>{
  const inventory=await (await request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
  const foundations=inventory.nodes.find((node:Node)=>node.label==='Foundations');
  expect(foundations).toBeTruthy();
  const leaves=descendants(inventory,foundations.id);
  const expected=new Set(leaves.flatMap((leaf:Node)=>leaf.questionIdsByExam?.NDA||[])).size;
  expect(expected).toBeGreaterThan(0);

  await page.goto('/prepare/NDA');
  await page.evaluate(({inventory,foundations,leaves})=>{
    const empty={CSE:[],CAPF:[],CDS:[],NDA:[]};
    sessionStorage.setItem('upsc-pyq-builder:preparation-v1:NDA',JSON.stringify({
      version:6,inventoryVersion:inventory.version,taxonomyVersion:inventory.taxonomyVersion,
      paths:Object.fromEntries(leaves.map((leaf:{id:string})=>[leaf.id,[]])),
      frozenScopes:leaves.map((leaf:{id:string;subjectId:string;label:string;parentId?:string;order:number;questionIdsByExam:Record<Exam,string[]>})=>({
        id:leaf.id,subjectId:leaf.subjectId,label:leaf.label,parentId:leaf.parentId,order:leaf.order,
        questionIdsByExam:{...empty,...leaf.questionIdsByExam},
      })),
      focusId:foundations.id,enabledExams:['CSE'],yearsByExam:empty,count:'all',order:'newest',
    }));
  },{inventory,foundations,leaves});
  await page.reload();

  await expect(page.getByTestId('matching-count').locator('strong')).toHaveText(expected.toLocaleString('en-IN'));
  const finalise=page.locator('.scope-dock').getByRole('button',{name:'Finalise test →',exact:true});
  await expect(finalise).toBeEnabled();
  await finalise.click();
  const dialog=page.getByRole('dialog',{name:'Finalise test',exact:true});
  await expect(dialog).toContainText(`${expected.toLocaleString('en-IN')} available MCQs`);
  await expect(dialog.locator('.compact-source').filter({hasText:'NDA'})).toHaveAttribute('aria-pressed','true');
  const created=page.waitForResponse(response=>response.url().endsWith('/api/practice-snapshots')&&response.request().method()==='POST');
  await dialog.getByRole('button',{name:'Start test →',exact:true}).click();
  expect((await created).status()).toBe(201);
  await expect(page.locator('.question-heading')).toContainText(`Question 1 of ${expected}`);
});

test('adding a scope re-enables its real exam source and all available years',async({page,request})=>{
  const inventory=await (await request.get('/api/pyqs/inventory?preparationExam=NDA')).json();
  const foundations=inventory.nodes.find((node:Node)=>node.label==='Foundations');
  const leaves=descendants(inventory,foundations.id);
  const expected=new Set(leaves.flatMap((leaf:Node)=>leaf.questionIdsByExam?.NDA||[])).size;
  await page.goto(`/prepare/NDA?scope=${encodeURIComponent(foundations.id)}`);
  await page.evaluate(({inventory,foundations})=>sessionStorage.setItem('upsc-pyq-builder:preparation-v1:NDA',JSON.stringify({
    version:7,inventoryVersion:inventory.version,taxonomyVersion:inventory.taxonomyVersion,paths:{},frozenScopes:[],
    focusId:foundations.id,enabledExams:[],yearsByExam:{CSE:[],CAPF:[],CDS:[],NDA:[]},count:'all',order:'newest',
  })),{inventory,foundations});
  await page.reload();
  await page.getByRole('button',{name:'Add entire folder',exact:true}).click();
  await expect(page.getByTestId('matching-count').locator('strong')).toHaveText(expected.toLocaleString('en-IN'));
  await page.locator('.scope-dock').getByRole('button',{name:'Finalise test →',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Finalise test',exact:true});
  await expect(dialog).toContainText(`${expected.toLocaleString('en-IN')} available MCQs`);
  await expect(dialog.locator('.compact-source').filter({hasText:'NDA'})).toHaveAttribute('aria-pressed','true');
});
