import assert from 'node:assert/strict';
import test from 'node:test';
import {freezeSelectionMembership,restoreFrozenSelection,coalesceCoveredDraftScopes,readFrozenScopes} from '../lib/practice-draft-membership.ts';
import {addScope,buildSelectionIndex,selectionCounts,scopeMetrics,setScopeExam,removeScope} from '../lib/practice-selection.ts';
const members=(CSE=[],CAPF=[],CDS=[],NDA=[])=>({CSE,CAPF,CDS,NDA});
const counts=ids=>Object.fromEntries(Object.entries(ids).map(([e,ids])=>[e,ids.length]));
function catalogue(ids=['a','b'],other=['moved']) {
  const leaves=[{id:'leaf',subjectId:'geo',parentId:'chapter',label:'Topic',kind:'subtopic',order:1,questionIdsByExam:members(ids,['capf']),legacyOnly:false},
    {id:'other',subjectId:'geo',parentId:'chapter',label:'Other',kind:'subtopic',order:2,questionIdsByExam:members(other)}].map(n=>({...n,examCounts:counts(n.questionIdsByExam),questionCount:Object.values(n.questionIdsByExam).flat().length}));
  const all=members([...new Set([...ids,...other])],['capf']);
  return {version:4,taxonomyVersion:'working',subjects:[{id:'geo',label:'Geography',questionCount:Object.values(all).flat().length,examCounts:counts(all)}],
    nodes:[{id:'chapter',subjectId:'geo',parentId:'geo',label:'Chapter',kind:'topic',order:1,examCounts:counts(all),questionCount:Object.values(all).flat().length},...leaves],links:[],legacyAliases:{},legacyQuestionSets:{}};
}
test('unchanged saved memberships retain source choices including zero-source paths',()=>{
  const inventory=catalogue(),index=buildSelectionIndex(inventory),paths={leaf:[]};
  const saved=freezeSelectionMembership(paths,index);
  const restored=restoreFrozenSelection(inventory,paths,saved);
  assert.deepEqual(restored.paths,paths);
  assert.equal(restored.inventory.nodes.length,inventory.nodes.length);
  assert.deepEqual(saved[0].questionIdsByExam.CAPF,['capf']);
});
test('growth and relocation preserve exact saved IDs while live browsing keeps the new pool',()=>{
  const old=catalogue(['a','moved']);
  const saved=freezeSelectionMembership({leaf:['CSE']},buildSelectionIndex(old));
  const current=catalogue(['a','b','new'],['moved']);
  const restored=restoreFrozenSelection(current,{leaf:['CSE']},saved),index=buildSelectionIndex(restored.inventory);
  assert.deepEqual(restored.paths,{'draft:leaf':['CSE']});
  assert.equal(selectionCounts(restored.paths,index).matchingCount,2);
  assert.equal(index.nodesById.get('leaf').questionCount,4);
  assert.equal(scopeMetrics('leaf',restored.paths,index).state,'partial');
  assert.equal(index.nodesById.get('draft:leaf').legacyOnly,true);
  assert.deepEqual(index.nodesById.get('draft:leaf').questionIdsByExam.CSE,['a','moved']);
  assert.equal(selectionCounts(setScopeExam(restored.paths,'geo','CAPF',true,index),index).matchingCount,2,'Hidden saved source remains separately addressable');
  const toggled=setScopeExam(restored.paths,'draft:leaf','CAPF',true,index);
  assert.equal(selectionCounts(toggled,index).matchingCount,3);
  const added=addScope(restored.paths,'chapter',index);
  const folded=coalesceCoveredDraftScopes(added,index);
  assert.ok(!Object.hasOwn(folded,'draft:leaf'));
  assert.equal(selectionCounts(folded,index).matchingCount,5);
  assert.deepEqual(removeScope(restored.paths,'draft:leaf',index),{});
});
test('newly ineligible questions shrink safely, no unavailable membership is resurrected',()=>{
  const old=catalogue(['a','gone']);
  const saved=freezeSelectionMembership({leaf:['CSE']},buildSelectionIndex(old));
  const current=catalogue(['a','new'],[]);
  const restored=restoreFrozenSelection(current,{leaf:['CSE']},saved);
  assert.equal(restored.removedCount,1);
  assert.deepEqual(restored.inventory.nodes.find(n=>n.id==='draft:leaf').questionIdsByExam.CSE,['a']);
});
test('repeated frozen restoration is idempotent and cannot grow a draft prefix or question pool',()=>{
  const saved=freezeSelectionMembership({leaf:['CSE']},buildSelectionIndex(catalogue(['a'])));
  let restored=restoreFrozenSelection(catalogue(['a','new']),{leaf:['CSE']},saved);
  restored=restoreFrozenSelection(catalogue(['a','new','newer']),restored.paths,freezeSelectionMembership(restored.paths,buildSelectionIndex(restored.inventory)));
  assert.deepEqual(restored.paths,{'draft:leaf':['CSE']});
  assert.equal(selectionCounts(restored.paths,buildSelectionIndex(restored.inventory)).matchingCount,1);
});
test('malformed or incomplete membership fails closed instead of falling back to current broad scopes',()=>{
  assert.throws(()=>readFrozenScopes({}));
  assert.throws(()=>restoreFrozenSelection(catalogue(),{leaf:['CSE']},[]));
  const saved=freezeSelectionMembership({leaf:['CSE']},buildSelectionIndex(catalogue()));
  assert.throws(()=>readFrozenScopes([...saved,...saved]));
  assert.throws(()=>readFrozenScopes([{...saved[0],questionIdsByExam:{CSE:'all'}}]));
});

test('several generations of one leaf retain distinct exact subsets without overwriting each other',()=>{
  const first=freezeSelectionMembership({leaf:['CSE']},buildSelectionIndex(catalogue(['a','moved'])));
  const second=restoreFrozenSelection(catalogue(['a','new'],['moved']),{leaf:['CSE']},first);
  const secondPaths={...second.paths,leaf:['CSE']};
  const saved=freezeSelectionMembership(secondPaths,buildSelectionIndex(second.inventory));
  const third=restoreFrozenSelection(catalogue(['a','new','newer'],['moved']),secondPaths,saved);
  assert.equal(Object.keys(third.paths).length,2);
  assert.equal(selectionCounts(third.paths,buildSelectionIndex(third.inventory)).matchingCount,3);
  const ids=new Set(freezeSelectionMembership(third.paths,buildSelectionIndex(third.inventory)).flatMap(scope=>scope.questionIdsByExam.CSE));
  assert.deepEqual([...ids].sort(),['a','moved','new']);
  const fourth=restoreFrozenSelection(catalogue(['a','new','newer','latest'],['moved']),third.paths,freezeSelectionMembership(third.paths,buildSelectionIndex(third.inventory)));
  assert.deepEqual(fourth.paths,third.paths);
  assert.equal(selectionCounts(fourth.paths,buildSelectionIndex(fourth.inventory)).matchingCount,3);
});
