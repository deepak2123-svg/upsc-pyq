'use client';

import {useMemo,useState,useSyncExternalStore} from 'react';

type SourcePage={page:number;first:number;last:number;src:string};
type Decision={number:number;status:string;reason:string};
type Draft={current:number;answers:Record<string,string>};
const emptySnapshot=()=>null;
const changeEvent='original-paper-draft-change';
function subscribe(listener:()=>void){
 window.addEventListener('storage',listener);
 window.addEventListener(changeEvent,listener);
 return ()=>{window.removeEventListener('storage',listener);window.removeEventListener(changeEvent,listener);};
}
function decode(value:string|null,sourceHash:string):Draft{
 try{
  const saved=JSON.parse(value??'null');
  if(saved?.version!==1||saved.sourceHash!==sourceHash)return {current:1,answers:{}};
  const answers:Record<string,string>={};
  if(saved.answers&&typeof saved.answers==='object')for(const [key,answer] of Object.entries(saved.answers)){
   if(/^(?:[1-9]|[1-9][0-9]|1[0-4][0-9]|150)$/.test(key)&&typeof answer==='string'&&/^[ABCD]$/.test(answer))answers[key]=answer;
  }
  return {current:Number.isInteger(saved.current)&&saved.current>=1&&saved.current<=150?saved.current:1,answers};
 }catch{return {current:1,answers:{}};}
}

export function OriginalPaperPractice({paperId,sourceHash,pages,decisions}:{paperId:string;sourceHash:string;pages:SourcePage[];decisions:Decision[]}){
 const storageKey=`upsc-original-paper:v1:${paperId}`;
 const snapshot=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(storageKey);}catch{return null;}},emptySnapshot);
 const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
 const draft=useMemo(()=>decode(snapshot,sourceHash),[snapshot,sourceHash]);
 const [error,setError]=useState('');
 const [summary,setSummary]=useState(false);
 const sourcePage=pages.find(page=>draft.current>=page.first&&draft.current<=page.last)!;
 const decision=decisions[draft.current-1];
 function save(next:Draft){
  try{
   localStorage.setItem(storageKey,JSON.stringify({version:1,sourceHash,...next}));
   window.dispatchEvent(new Event(changeEvent));setError('');
  }catch{setError('Your browser could not save this answer. Enable local storage before continuing.');}
 }
 function choose(answer:string){save({...draft,answers:{...draft.answers,[draft.current]:answer}});}
 const answered=Object.keys(draft.answers).length;
 return <section className="original-paper-practice" aria-label="Full original paper, unscored">
  <div className="original-paper-controls">
   <strong>Question {draft.current} of 150</strong>
   <span aria-live="polite">{answered} / 150 answers recorded</span>
   <button type="button" disabled={!ready} onClick={()=>setSummary(value=>!value)}>{summary?'Return to paper':'Review recorded answers'}</button>
  </div>
  {error?<p role="alert">{error}</p>:null}
  {summary?<section className="original-paper-summary" aria-label="Recorded answer sheet"><h2>Recorded answers — unscored</h2><p>These are your choices, not a correct-answer key. Saved only in this browser; separate from scored attempts.</p><ol>{Array.from({length:150},(_,i)=><li key={i+1}><button type="button" disabled={!ready} onClick={()=>{save({...draft,current:i+1});setSummary(false);}}>Q{i+1}: {draft.answers[i+1]??'Not answered'}</button></li>)}</ol></section>:<>
   <div className="original-paper-toolbar"><label>Go to question <select disabled={!ready} aria-label="Go to question" value={draft.current} onChange={event=>save({...draft,current:Number(event.target.value)})}>{Array.from({length:150},(_,i)=><option key={i+1} value={i+1}>Q{i+1}{i<50?' · English':' · Part B'}</option>)}</select></label><a href={sourcePage.src} target="_blank" rel="noreferrer">Open original page at full size ↗</a></div>
   <p className="original-question-status" role="status">Q{draft.current}: {decision.status==='reasoned-verified'?'Reasoned-verified in this review; no official key recovered.':decision.status==='held'?`Held from scored tests: ${decision.reason}`:`Awaiting review: ${decision.reason}`}</p>
   <figure className="original-scan" key={sourcePage.page}>
    {/* Native image keeps the original static scan portable on vinext and in new tabs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={sourcePage.src} alt={`Original NDA I 2026 GAT page ${sourcePage.page}, questions ${sourcePage.first} to ${sourcePage.last}. Read question ${draft.current} and its original A–D options.`} width={992} height={1320}/>
    <figcaption>Original page {sourcePage.page} · Q{sourcePage.first}–{sourcePage.last} · answering Q{draft.current}. The page includes neighbouring questions and any shared directions.</figcaption>
   </figure>
   <fieldset className="original-answer-controls" disabled={!ready}><legend>Your answer to Q{draft.current} — unscored</legend>{['A','B','C','D'].map(answer=><button type="button" key={answer} aria-label={`Record ${answer} for question ${draft.current}`} aria-pressed={draft.answers[draft.current]===answer} onClick={()=>choose(answer)}>{answer}</button>)}<button type="button" disabled={!draft.answers[draft.current]} onClick={()=>{const answers={...draft.answers};delete answers[draft.current];save({...draft,answers});}}>Clear answer</button></fieldset>
   <nav className="original-paper-pagination" aria-label="Original paper questions"><button type="button" disabled={!ready||draft.current===1} onClick={()=>save({...draft,current:draft.current-1})}>← Previous</button><span>Selections save in this browser only.</span><button type="button" disabled={!ready||draft.current===150} onClick={()=>save({...draft,current:draft.current+1})}>Next →</button></nav>
  </>}
 </section>;
}
