import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OfficialPaperLauncher} from '../../components/official-paper-launcher';
import official from '../../../content/nda-2026-ii-official-paper.json';
import {getPreparationInventory} from '../../../lib/preparation-catalog';
import type {PracticeRecipeV4} from '../../../lib/practice-types';

export const metadata={title:'NDA II 2026 GAT — official-key practice'};
export default function OfficialNdaIIPaper(){
 const inventory=getPreparationInventory('NDA');
 const choices=[{label:'Full GAT',from:1,to:150},{label:'English',from:1,to:50},{label:'Science',from:51,to:100},{label:'GS',from:101,to:150}].map(range=>{
  const wanted=new Set(official.questions.filter(q=>q.questionNumber>=range.from&&q.questionNumber<=range.to).map(q=>q.id));
  const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
  const covered=new Set(leaves.flatMap(n=>n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))));
  if(covered.size!==wanted.size)throw new Error(`Incomplete NDA II paper: ${range.label}, ${covered.size}/${wanted.size}`);
  const recipe:PracticeRecipeV4={version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:150};
  return {label:range.label,count:wanted.size,recipe};
 });
 return <><SiteHeader/><main className="original-paper-page"><Link href="/prepare/NDA">← NDA library</Link>
  <header><div className="eyebrow">Official UPSC provisional key · Series A</div><h1>NDA II 2026 · GAT</h1><p>150 questions · English 50 · Science 50 · GS 50</p></header>
  <p className="original-paper-notice">Scored against UPSC’s official provisional key released 16 September 2026. All 150 questions have an official answer; zero are dropped. Provisional answers remain subject to UPSC revision. Editorial caveats are shown separately without changing official scoring.</p>
  <OfficialPaperLauncher choices={choices} paperTitle="NDA II 2026 · GAT"/>
  <details className="original-paper-provenance"><summary>Source and official answer key</summary><p>Supplied original GAT paper, Series A, 52 pages. All 150 stems and options compared in two passes; original order and existing IDs preserved.</p><p><a href={official.evidence.url} target="_blank" rel="noreferrer">UPSC provisional key</a> · <a href={official.evidence.asset} target="_blank" rel="noreferrer">Preserved key copy</a></p><p>Key SHA-256: <code>{official.evidence.sha256}</code></p></details>
 </main></>;
}
