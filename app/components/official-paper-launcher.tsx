'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createLocalAttempt} from '../../lib/practice-store';
import type {PracticeRecipeV4,PracticeSnapshot} from '../../lib/practice-types';

export function OfficialPaperLauncher({choices,paperTitle='NDA I 2026 · GAT'}:{choices:{label:string;count:number;recipe:PracticeRecipeV4}[];paperTitle?:string}){
 const router=useRouter();
 const [selected,setSelected]=useState(0);
 const [timed,setTimed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const choice=choices[selected];
 async function start(pdf=false){
  if(busy)return;
  const printWindow=pdf?window.open('','_blank'):null;
  if(pdf&&!printWindow){setError('Allow pop-ups to prepare the PDF paper.');return;}
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/practice-snapshots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...choice.recipe,durationMinutes:timed?150:null})});
   const snapshot=await response.json() as PracticeSnapshot&{error?:string};
   if(!response.ok)throw new Error(snapshot.error??'The paper could not be prepared.');
   if(snapshot.questions.length!==choice.count||snapshot.matchingCount!==choice.count)throw new Error('Paper membership changed. Refresh before starting.');
   if(pdf){printWindow!.sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`,JSON.stringify({snapshot,includeAnswerKey:true,paperTitle:`${paperTitle}${selected===0?'':` · ${choice.label}`}`}));printWindow!.location.href=`/practice/${snapshot.id}/print`;setBusy(false);}
   else{await createLocalAttempt(snapshot,'/prepare/NDA');router.push(`/practice/${snapshot.id}`);}
  }catch(reason){printWindow?.close();setError(reason instanceof Error?reason.message:'Unable to start this paper.');setBusy(false);}
 }
 return <section className="original-paper-practice official-paper-launcher" aria-label="Official-key paper setup">
  <div role="group" aria-label="Choose paper section" className="compact-counts">{choices.map((item,index)=><button type="button" key={item.label} disabled={busy||!ready} aria-pressed={selected===index} onClick={()=>setSelected(index)}>{item.label} · {item.count}</button>)}</div>
  <p>{choice.count} questions · original order · correct/incorrect feedback and result sheet</p>
  <label><input type="checkbox" disabled={busy} checked={timed} onChange={event=>setTimed(event.target.checked)}/> Use the 150-minute GAT time limit</label>
  <div className="original-paper-controls"><button type="button" disabled={busy||!ready} onClick={()=>void start()}>{busy?'Preparing…':`Start ${choice.count}-question test →`}</button><button type="button" disabled={busy||!ready} onClick={()=>void start(true)}>Offline - PDF paper</button></div>
  {error?<p role="alert">{error}</p>:null}
 </section>;
}
