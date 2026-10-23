import frozen from '../content/taxonomy/prelims-legacy-inventory.json' with {type:'json'};
import type {PracticeInventoryNode,PracticeSubject,PyqExam} from './pyq-catalog';

export const legacySnapshotQuestionIds=new Set(frozen.inventory.nodes.filter(node=>node.kind==='subtopic').flatMap(node=>Object.values(node.questionIdsByExam||{}).flat()));

/** Frozen memberships are compatibility scopes, not new public syllabus branches. */
export function bridgeLegacyPlacements(subjects:Map<string,PracticeSubject>,nodes:Map<string,PracticeInventoryNode>,allowed:Map<string,PyqExam>) {
  const oldNodes=new Map(frozen.inventory.nodes.map(n=>[n.id,n]));
  const oldSubjects=new Map(frozen.inventory.subjects.map(n=>[n.id,n]));
  const restoreAliases:Record<string,string>={};
  const exams:PyqExam[]=['CSE','CAPF','CDS','NDA'];
  const descendants=(id:string):string[]=>frozen.inventory.nodes.filter(n=>n.parentId===id).flatMap(n=>n.kind==='subtopic'?exams.flatMap(e=>(n.questionIdsByExam?.[e]||[])):descendants(n.id));
  function ensureParent(id:string) {
    if(nodes.has(id)||subjects.has(id))return;
    const old=oldNodes.get(id);
    if(old) {
      ensureParent(old.parentId!);
      const ids=new Set(descendants(id).filter(q=>allowed.has(q)));
      const examCounts={CSE:0,CAPF:0,CDS:0,NDA:0};
      for(const q of ids)examCounts[allowed.get(q)!]++;
      nodes.set(id,{...old,kind:old.kind as PracticeInventoryNode['kind'],legacyOnly:true,questionCount:ids.size,examCounts});
    } else {
      const subject=oldSubjects.get(id);
      if(!subject)throw new Error(`Missing saved-scope ancestor: ${id}`);
      const ids=new Set(descendants(id).filter(q=>allowed.has(q)));
      const examCounts={CSE:0,CAPF:0,CDS:0,NDA:0};
      for(const q of ids)examCounts[allowed.get(q)!]++;
      subjects.set(id,{...subject,legacyOnly:true,questionCount:ids.size,examCounts});
    }
  }
  for(const old of frozen.inventory.nodes.filter(n=>n.kind==='subtopic')) {
    const questionIdsByExam=Object.fromEntries(exams.map(exam=>[exam,(old.questionIdsByExam?.[exam]||[]).filter(id=>allowed.get(id)===exam)])) as Record<PyqExam,string[]>;
    if(!exams.some(exam=>questionIdsByExam[exam].length))continue;
    const current=nodes.get(old.id);
    const same=current&&exams.every(exam=>JSON.stringify([...(current.questionIdsByExam?.[exam]||[])].sort())===JSON.stringify([...questionIdsByExam[exam]].sort()));
    if(same)continue;
    const id=current?`legacy:${old.id}`:old.id;
    if(current)restoreAliases[old.id]=id;
    ensureParent(old.parentId!);
    const examCounts=Object.fromEntries(exams.map(exam=>[exam,questionIdsByExam[exam].length])) as Record<PyqExam,number>;
    nodes.set(id,{...old,id,kind:'subtopic',legacyOnly:true,questionIdsByExam,examCounts,questionCount:exams.reduce((n,e)=>n+examCounts[e],0)});
  }
  return restoreAliases;
}
