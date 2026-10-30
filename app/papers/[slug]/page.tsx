import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SiteHeader} from '../../components/site-header';
import {OfficialPaperLauncher} from '../../components/official-paper-launcher';
import nda2019I from '../../../content/nda-2019-i-official-paper.json';
import nda2019II from '../../../content/nda-2019-ii-official-paper.json';
import nda2018II from '../../../content/nda-2018-ii-official-paper.json';
import nda2020 from '../../../content/nda-2020-i-ii-official-paper.json';
import nda2021I from '../../../content/nda-2021-i-official-paper.json';
import nda2021II from '../../../content/nda-2021-ii-official-paper.json';
import nda2022I from '../../../content/nda-2022-i-official-paper.json';
import nda2022II from '../../../content/nda-2022-ii-official-paper.json';
import nda2023I from '../../../content/nda-2023-i-official-paper.json';
import nda2023II from '../../../content/nda-2023-ii-official-paper.json';
import nda2024I from '../../../content/nda-2024-i-official-paper.json';
import nda2024II from '../../../content/nda-2024-ii-reviewed-paper.json';
import {getPreparationInventory} from '../../../lib/preparation-catalog';
import {questionEligible} from '../../../lib/question-review';
import type {PracticeRecipeV4} from '../../../lib/practice-types';

type PaperQuestion={id:string;questionNumber:number;preparationScope:string};
type PaperData={paperId:string;questions:PaperQuestion[];evidence?:{status:string;series?:string;url?:string;asset?:string;sha256?:string}};
const papers:Record<string,{data:PaperData;title:string;summary:string;notice:string}>={
 'nda-2018-ii-gat':{data:nda2018II,title:'NDA II 2018 · GAT',summary:'150 available / 150 source questions · English 50 · Science 44 · GS 56',notice:'All 150 questions are scored against the official final Series A key.'},
 'nda-2019-i-gat':{data:nda2019I,title:'NDA I 2019 · GAT',summary:'150 available / 150 source questions · English 50 · Science 47 · GS and World History 53',notice:'All 150 questions are scored against the official final key.'},
 'nda-2019-ii-gat':{data:nda2019II,title:'NDA II 2019 · GAT',summary:'149 available / 150 source questions · Q119 officially withdrawn',notice:'Q119 was withdrawn by UPSC and is omitted; the other 149 questions are scored against the official final key.'},
 'nda-2020-i-ii-gat':{data:nda2020,title:'NDA I & II 2020 · GAT',summary:'149 available / 150 source questions · Q70 officially withdrawn',notice:'This combined I & II paper uses Series B. Q70 was withdrawn by UPSC and is omitted.'},
 'nda-2021-i-gat':{data:nda2021I,title:'NDA I 2021 · GAT',summary:'149 available / 150 source questions · Q58 officially withdrawn',notice:'Q58 was withdrawn by UPSC and is omitted; the other 149 questions are scored against the official final key.'},
 'nda-2021-ii-gat':{data:nda2021II,title:'NDA II 2021 · GAT',summary:'150 available / 150 source questions',notice:'All 150 questions are scored against the official final key; both accepted answers are honoured for Q102.'},
 'nda-2022-i-gat':{data:nda2022I,title:'NDA I 2022 · GAT',summary:'150 available / 150 source questions',notice:'All 150 questions are scored against the official final key.'},
 'nda-2022-ii-gat':{data:nda2022II,title:'NDA II 2022 · GAT',summary:'150 available / 150 source questions',notice:'All 150 questions are scored against the official final key.'},
 'nda-2023-i-gat':{data:nda2023I,title:'NDA I 2023 · GAT',summary:'150 available / 150 source questions · English 50 · Science 49 · GS 51',notice:'All 150 questions are scored against the official final key; alternative accepted answers are honoured.'},
 'nda-2023-ii-gat':{data:nda2023II,title:'NDA II 2023 · GAT',summary:'150 available / 150 source questions',notice:'All 150 questions are scored against the official final key.'},
 'nda-2024-i-gat':{data:nda2024I,title:'NDA I 2024 · GAT',summary:'149 available / 150 source questions · Q101 officially withdrawn',notice:'Q101 was withdrawn by UPSC and is omitted; the other 149 questions are scored against the official final key.'},
 'nda-2024-ii-gat':{data:nda2024II,title:'NDA II 2024 · GAT',summary:'136 available / 150 source questions · 14 held for review',notice:'This practice paper contains the 136 independently verified questions. The 14 quarantined questions are omitted and do not enter scoring.'},
};

export function generateStaticParams(){return Object.keys(papers).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const paper=papers[(await params).slug];return paper?{title:`${paper.title} — full past paper`}:{};}

export default async function PastPaperPage({params}:{params:Promise<{slug:string}>}){
 const paper=papers[(await params).slug];
 if(!paper)notFound();
 const inventory=getPreparationInventory('NDA');
 const choices=[['Full GAT',null],['English','english'],['Science','science'],['GS','gs']].flatMap(([label,scope])=>{
  const wanted=new Set(paper.data.questions.filter(q=>(!scope||(scope==='gs'?['gs','defence-world-history'].includes(q.preparationScope):q.preparationScope===scope))&&questionEligible(q.id)).map(q=>q.id));
  if(!wanted.size)return [];
  const leaves=inventory.nodes.filter(node=>node.kind==='subtopic'&&node.questionIdsByExam?.NDA.some(id=>wanted.has(id)));
  const covered=new Set(leaves.flatMap(node=>node.questionIdsByExam!.NDA.filter(id=>wanted.has(id))));
  if(covered.size!==wanted.size)throw new Error(`Incomplete ${paper.title}: ${label}, ${covered.size}/${wanted.size}`);
  const recipe:PracticeRecipeV4={version:4,preparationExam:'NDA',taxonomyVersion:inventory.taxonomyVersion,subjectIds:[...new Set(leaves.map(node=>node.subjectId))],paths:leaves.map(node=>({subtopicId:node.id,exams:['NDA']})),frozenScopes:leaves.map(node=>({id:node.id,subjectId:node.subjectId,label:node.label,parentId:node.parentId,order:node.order,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:node.questionIdsByExam!.NDA.filter(id=>wanted.has(id))}})),count:'all',order:'newest',durationMinutes:150};
  return [{label:label!,count:wanted.size,recipe}];
 });
 const evidence=paper.data.evidence;
 const official=evidence?.status==='official-final';
 return <><SiteHeader/><main className="original-paper-page"><Link href="/legal/sources">← All source papers</Link>
  <header><div className="eyebrow">{official?'Official UPSC final key':'Independently verified'}{evidence?.series?` · Series ${evidence.series}`:''}</div><h1>{paper.title}</h1><p>{paper.summary}</p></header>
  <p className="original-paper-notice">{paper.notice} Original wording, question numbers and option order are preserved.</p>
  <OfficialPaperLauncher choices={choices} paperTitle={paper.title}/>
  <details className="original-paper-provenance"><summary>Source and answer evidence</summary><p>{official?'The available questions use the preserved official UPSC final answer key.':'Available questions were retained only after individual review; unresolved items remain quarantined.'}</p>{evidence?.url?<p><a href={evidence.url} target="_blank" rel="noreferrer">Answer evidence</a>{evidence.asset?<> · <a href={evidence.asset} target="_blank" rel="noreferrer">Preserved copy</a></>:null}</p>:null}{evidence?.sha256?<p>Key SHA-256: <code>{evidence.sha256}</code></p>:null}</details>
 </main></>;
}
