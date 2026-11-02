import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OfficialPaperLauncher} from '../../components/official-paper-launcher';
import official from '../../../content/nda-2025-i-official-paper.json';
import {getPreparationInventory} from '../../../lib/preparation-catalog';
import {questionEligible} from '../../../lib/question-review';
import type {PracticeRecipeV4} from '../../../lib/practice-types';

export const metadata={title:'NDA I 2025 GAT — official final key'};
export default function OfficialNda2025IPaper(){
 const inventory=getPreparationInventory('NDA');
 const choices=[['Full GAT',null],['English','english'],['Science','science'],['GS','gs']].map(([label,scope])=>{
  const wanted=new Set(official.questions.filter(q=>(!scope||(scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope))&&questionEligible(q.id)).map(q=>q.id));
  const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
  const covered=new Set(leaves.flatMap(n=>n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))));
  if(covered.size!==wanted.size)throw new Error(`Incomplete NDA I 2025: ${label}, ${covered.size}/${wanted.size}`);
  const recipe:PracticeRecipeV4={version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:150};
  return {label:label!,count:wanted.size,recipe};
 });
 return <><SiteHeader/><main className="original-paper-page"><Link href="/prepare/NDA">← NDA library</Link>
  <header><div className="eyebrow">Official UPSC final key · Series A</div><h1>NDA I 2025 · GAT</h1><p>150 available / 150 source questions · English 50 · Science 49 · GS 51</p></header>
  <p className="original-paper-notice">All 150 questions scored against the official final key. Preparation sections follow the tested concepts, not contiguous source-number ranges. Original wording, question numbers and option order are preserved. Editorial caveats do not replace official scoring.</p>
  <OfficialPaperLauncher choices={choices} paperTitle="NDA I 2025 · GAT"/>
  <details className="original-paper-provenance"><summary>Source and official answer key</summary><p>Supplied original Series A GAT paper, 48 PDF pages. English Part A pages 2–11; Part B English pages 13–43, odd-numbered. Every question and option compared in two distinct passes by the same AI reviewer, not independent human review.</p><p><a href={official.evidence.url} target="_blank" rel="noreferrer">UPSC final key</a> · <a href={official.evidence.asset} target="_blank" rel="noreferrer">Preserved key copy</a></p><p>Key SHA-256: <code>{official.evidence.sha256}</code></p></details>
 </main></>;
}
