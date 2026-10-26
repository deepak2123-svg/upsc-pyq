import type {PracticeFrozenScope} from './practice-types';
import type {PracticeInventoryNode,PyqExam,SubjectPracticeInventory} from './pyq-catalog';
import {buildSelectionIndex,type SelectionIndex,type SelectionPaths} from './practice-selection.ts';

const exams:PyqExam[]=['CSE','CAPF','CDS','NDA'];
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);

/** Store all sources for selected leaves, including deliberately disabled sources. */
export function freezeSelectionMembership(paths:SelectionPaths,index:SelectionIndex):PracticeFrozenScope[] {
  return Object.keys(paths).flatMap(id=>{
    const leaf=index.nodesById.get(id);
    if(!leaf||leaf.kind!=='subtopic'||!leaf.questionIdsByExam)return [];
    return [{id,subjectId:leaf.subjectId,label:leaf.label,parentId:leaf.parentId,order:leaf.order,
      questionIdsByExam:Object.fromEntries(exams.map(exam=>[exam,[...leaf.questionIdsByExam![exam]]])) as Record<PyqExam,string[]>}];
  });
}

/** Strict, bounded, answer-free schema shared with the public snapshot endpoint. */
export function readFrozenScopes(value:unknown):PracticeFrozenScope[] {
  if(!Array.isArray(value)||value.length>2500)throw new Error('Invalid saved question membership.');
  const seen=new Set<string>();
  let totalMembers=0;
  return value.map(row=>{
    if(!record(row)||typeof row.id!=='string'||!row.id||row.id.length>1000||seen.has(row.id)
      ||typeof row.subjectId!=='string'||row.subjectId.length>200||typeof row.label!=='string'||row.label.length>1000
      ||(row.parentId!==undefined&&(typeof row.parentId!=='string'||row.parentId.length>1000))
      ||typeof row.order!=='number'||!Number.isInteger(row.order)||row.order<0||!record(row.questionIdsByExam))throw new Error('Invalid saved question membership.');
    seen.add(row.id);
    const members=row.questionIdsByExam;
    const questionIdsByExam=Object.fromEntries(exams.map(exam=>{
      const ids=members[exam];
      if(!Array.isArray(ids)||ids.length>20000||ids.some(id=>typeof id!=='string'||!id||id.length>250))throw new Error('Invalid saved question membership.');
      totalMembers+=ids.length;
      if(totalMembers>100000)throw new Error('Saved selection is too large.');
      return [exam,[...new Set(ids as string[])]];
    })) as Record<PyqExam,string[]>;
    return {id:row.id,subjectId:row.subjectId,label:row.label,parentId:row.parentId as string|undefined,order:row.order,questionIdsByExam};
  });
}

/** Changed leaves become hidden exact-set scopes; browsing still shows today's catalogue. */
export function restoreFrozenSelection(inventory:SubjectPracticeInventory,rawPaths:unknown,rawScopes:unknown):{
  inventory:SubjectPracticeInventory;paths:SelectionPaths;removedCount:number;
} {
  if(!record(rawPaths))throw new Error('Invalid saved selection.');
  const scopes=readFrozenScopes(rawScopes);
  const original=buildSelectionIndex(inventory);
  const allowed=new Map<string,PyqExam>();
  for(const leaf of inventory.nodes)if(leaf.kind==='subtopic')for(const exam of exams)for(const id of leaf.questionIdsByExam?.[exam]||[])allowed.set(id,exam);
  const nextNodes=[...inventory.nodes],paths:SelectionPaths={};
  let removedCount=0;
  for(const scope of scopes) {
    const sources=rawPaths[scope.id];
    if(!Array.isArray(sources))continue;
    const subject=original.nodesById.get(scope.subjectId);
    if(subject?.kind!=='subject')throw new Error('Saved selection has an unknown subject.');
    const questionIdsByExam=Object.fromEntries(exams.map(exam=>{
      const eligible=scope.questionIdsByExam[exam].filter(id=>allowed.get(id)===exam);
      removedCount+=scope.questionIdsByExam[exam].length-eligible.length;
      return [exam,eligible];
    })) as Record<PyqExam,string[]>;
    const current=original.nodesById.get(scope.id);
    const same=current?.kind==='subtopic'&&current.subjectId===scope.subjectId&&exams.every(exam=>
      JSON.stringify([...(current.questionIdsByExam?.[exam]||[])].sort())===JSON.stringify([...questionIdsByExam[exam]].sort()));
    let id=scope.id;
    if(!same) {
      id=`draft:${scope.id.replace(/^draft:/,'')}`;
      const parent=scope.parentId?original.nodesById.get(scope.parentId):undefined;
      const examCounts=Object.fromEntries(exams.map(exam=>[exam,questionIdsByExam[exam].length])) as PracticeInventoryNode['examCounts'];
      const frozen:PracticeInventoryNode={id,kind:'subtopic',label:scope.label,subjectId:scope.subjectId,
        parentId:parent?.subjectId===scope.subjectId?parent.id:scope.subjectId,order:scope.order,
        questionIdsByExam,questionCount:exams.reduce((sum,exam)=>sum+examCounts[exam],0),examCounts,legacyOnly:true};
      // A draft can contain both an earlier saved subset and a later addition
      // of the same live leaf. If that live leaf subsequently changes too,
      // those are two distinct historical sets, not one overwritable scope.
      const sameMembers=(node:PracticeInventoryNode)=>node.subjectId===frozen.subjectId&&exams.every(exam=>
        JSON.stringify([...(node.questionIdsByExam?.[exam]||[])].sort())===JSON.stringify([...questionIdsByExam[exam]].sort()));
      let suffix=1;
      const base=id;
      while(nextNodes.some(node=>node.id===id&&!sameMembers(node)))id=`${base}:saved-${suffix++}`;
      frozen.id=id;
      const existing=nextNodes.findIndex(node=>node.id===id);
      if(existing>=0)nextNodes[existing]=frozen;else nextNodes.push(frozen);
    }
    paths[id]=exams.filter(exam=>(sources.includes(exam)||paths[id]?.includes(exam))&&questionIdsByExam[exam].length>0);
  }
  if(Object.keys(rawPaths).some(id=>!scopes.some(scope=>scope.id===id)))throw new Error('Saved selection is missing its exact question membership.');
  const unchanged=nextNodes.length===inventory.nodes.length&&nextNodes.every((node,i)=>node===inventory.nodes[i]);
  return {inventory:unchanged?inventory:{...inventory,nodes:nextNodes},paths,removedCount};
}

/** An explicit Add remaining/parent replaces redundant saved subsets, not a second item. */
export function coalesceCoveredDraftScopes(paths:SelectionPaths,index:SelectionIndex):SelectionPaths {
  const covered=new Set<string>();
  for(const [id,sources]of Object.entries(paths))if(!id.startsWith('draft:')) {
    const leaf=index.nodesById.get(id);
    if(leaf?.kind==='subtopic')for(const exam of sources)for(const q of leaf.questionIdsByExam?.[exam]||[])covered.add(q);
  }
  return Object.fromEntries(Object.entries(paths).filter(([id,sources])=>{
    if(!id.startsWith('draft:'))return true;
    const leaf=index.nodesById.get(id);
    const ids=leaf?.kind==='subtopic'?sources.flatMap(exam=>leaf.questionIdsByExam?.[exam]||[]):[];
    return !ids.length||!ids.every(q=>covered.has(q));
  }));
}
