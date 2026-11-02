import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OfficialPaperLauncher} from '../../components/official-paper-launcher';
import official from '../../../content/nda-2025-ii-official-paper.json';
import {getPreparationInventory} from '../../../lib/preparation-catalog';
import {questionEligible} from '../../../lib/question-review';
import type {PracticeRecipeV4} from '../../../lib/practice-types';

export const metadata={title:'NDA II 2025 GAT — official final key'};
export default function OfficialNda2025IIPaper(){
 const inventory=getPreparationInventory('NDA');
 const choices=[['Full GAT',null],['English','english'],['Science','science'],['GS','gs']].map(([label,scope])=>{
  const wanted=new Set(official.questions.filter(q=>(!scope||q.preparationScope===scope)&&questionEligible(q.id)).map(q=>q.id));
  const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
  const covered=new Set(leaves.flatMap(n=>n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))));
  if(covered.size!==wanted.size)throw new Error(`Incomplete NDA II 2025: ${label}, ${covered.size}/${wanted.size}`);
  const recipe:PracticeRecipeV4={version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:150};
  return {label:label!,count:wanted.size,recipe};
 });
 const dropped=official.questions.find(q=>q.questionNumber===85)!;
 return <><SiteHeader/><main className="original-paper-page"><Link href="/prepare/NDA">← NDA library</Link>
  <header><div className="eyebrow">Official UPSC final key · Series A</div><h1>NDA II 2025 · GAT</h1><p>149 available / 150 source questions · English 50 · Science 50 · GS 49</p></header>
  <p className="original-paper-notice">All 150 source questions reviewed. UPSC dropped Q85; it is excluded from scored practice. Q58 accepts both A and B. Preparation sections follow the tested concepts, so they are not contiguous source-number ranges. Original question numbers and option order are preserved.</p>
  <OfficialPaperLauncher choices={choices} paperTitle="NDA II 2025 · GAT (149/150; Q85 withdrawn)"/>
  <details className="original-paper-provenance"><summary>Withdrawn source question — Q85</summary><p>{dropped.promptLines.join(' ')}</p><ol type="A">{Object.entries(dropped.options).map(([key,text])=><li key={key}>{text}</li>)}</ol><p>Official Series A Q85: X (dropped). No answer is forced and no student is penalised.</p></details>
  <details className="original-paper-provenance"><summary>Source and official answer key</summary><p>Supplied original Series A GAT paper, 56 PDF pages. English questions occupy pages 2–11; Part B English pages are 13–49, odd-numbered. Each question and option compared in two distinct passes by the same AI reviewer, not independent human review.</p><p><a href={official.evidence.url} target="_blank" rel="noreferrer">UPSC final key</a> · <a href={official.evidence.asset} target="_blank" rel="noreferrer">Preserved key copy</a></p><p>Key SHA-256: <code>{official.evidence.sha256}</code></p></details>
 </main></>;
}
