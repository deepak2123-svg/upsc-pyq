import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OfficialPaperLauncher} from '../../components/official-paper-launcher';
import official from '../../../content/nda-2026-i-official-paper.json';
import {getPreparationInventory} from '../../../lib/preparation-catalog';
import type {PracticeRecipeV4} from '../../../lib/practice-types';

export const metadata={title:'NDA I 2026 GAT — official-key practice',description:'All 150 GAT questions, including English, Science and GS, with grading from the official UPSC provisional Series A answer key.'};
export default function OfficialNdaPaper(){
 const inventory=getPreparationInventory('NDA');
 const ranges=[{label:'Full GAT',from:1,to:150},{label:'English',from:1,to:50},{label:'Science',from:51,to:100},{label:'GS',from:101,to:150}];
 const choices=ranges.map(range=>{
  const wanted=new Set(official.questions.filter(q=>q.questionNumber>=range.from&&q.questionNumber<=range.to).map(q=>q.id));
  const leaves=inventory.nodes.filter(n=>n.kind==='subtopic'&&n.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
  const covered=new Set(leaves.flatMap(n=>n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))));
  if(covered.size!==wanted.size)throw new Error(`Incomplete official paper membership: ${range.label}, ${covered.size}/${wanted.size}`);
  const recipe:PracticeRecipeV4={version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(n=>n.subjectId))],paths:leaves.map(n=>({subtopicId:n.id,exams:['NDA']})),frozenScopes:leaves.map(n=>({id:n.id,subjectId:n.subjectId,label:n.label,parentId:n.parentId,order:n.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:n.questionIdsByExam!.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:150};
  return {label:range.label,count:wanted.size,recipe};
 });
 return <><SiteHeader/><main className="original-paper-page"><Link href="/prepare/NDA">← NDA library</Link>
  <header><div className="eyebrow">Official UPSC provisional key · Series A</div><h1>NDA I 2026 · GAT</h1><p>150 questions · English 50 · Science 50 · GS 50</p></header>
  <p className="original-paper-notice">Answers are graded against UPSC’s official provisional key released on 16 April 2026. All 150 questions have an official answer; zero are dropped in this key. Provisional answers remain subject to revision by UPSC. Any editorial caveat is shown separately in the answer explanation.</p>
  <OfficialPaperLauncher choices={choices}/>
  <details className="original-paper-provenance"><summary>Original paper and official answer key</summary><p><a href="https://www.upsc.gov.in/sites/default/files/QP-NDA-NA-I-26-GENERAL-ABILITY-TEST-130426.pdf" target="_blank" rel="noreferrer">Original UPSC question paper</a> · <a href={official.evidence.url} target="_blank" rel="noreferrer">UPSC provisional answer key</a> · <a href={official.evidence.asset} target="_blank" rel="noreferrer">Preserved key copy</a></p><p>Series A, key page 1. All 150 cells checked twice. Original question IDs, option order and previous attempts are preserved. This is an official provisional key, not a coaching key or a final-key claim.</p><p>Key SHA-256: <code>{official.evidence.sha256}</code></p></details>
 </main></>;
}
