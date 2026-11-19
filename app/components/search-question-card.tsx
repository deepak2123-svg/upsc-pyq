'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {PyqSearchResult} from '../../lib/pyq-search';
import {MathText} from './math-text';

type CheckResult={disposition:'scored'|'excluded';correct:boolean|null;correctAnswer:string|null;explanation:string|null;exclusionReason?:string};

export function SearchQuestionCard({question}:{question:PyqSearchResult}){
 const [selected,setSelected]=useState('');
 const [result,setResult]=useState<CheckResult|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const target=question.exam==='NDA'||question.exam==='CDS'||question.exam==='CSE'?question.exam:'CSE';
 const syllabusHref=question.syllabus?`/prepare/${target}?scope=${encodeURIComponent(question.syllabus.scopeId)}`:'';
 async function check(option:string){
  if(loading||result)return;
  setSelected(option);
  setLoading(true);setError('');
  try{const response=await fetch('/api/practice/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:question.id,selectedOption:option,contentRevision:question.contentRevision})});const data=await response.json() as CheckResult&{error?:string};if(!response.ok)throw new Error(data.error||'The answer could not be checked.');setResult(data);}catch(reason){setSelected('');setError(reason instanceof Error?reason.message:'The answer could not be checked.');}finally{setLoading(false);}
 }
 function optionState(letter:string){
  if(!result)return selected===letter?'is-selected':'';
  if(result.disposition==='excluded')return selected===letter?'is-excluded':'';
  if(letter===result.correctAnswer)return 'is-correct';
  if(letter===selected)return 'is-incorrect';
  return '';
 }
 return <article className="pyq-search-card"><header><span>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</span>{question.syllabus?<Link className="pyq-search-syllabus" href={syllabusHref} aria-label={`Open ${question.syllabus.subtopic} in the ${target} syllabus`}><small>Syllabus location</small><strong>{question.syllabus.subject} → {question.syllabus.head} → {question.syllabus.chapter} → {question.syllabus.subtopic}</strong></Link>:<small>{question.subject} · {question.topic}</small>}</header><div className="pyq-search-prompt">{question.promptLines.map((line,index)=><p key={`${question.id}-${index}`}><MathText value={line}/></p>)}</div><div className="pyq-search-options" role="radiogroup" aria-label={`Answer question ${question.questionNumber}`}>{Object.entries(question.options).map(([letter,text])=><button type="button" role="radio" aria-checked={selected===letter} aria-label={`${letter}: ${text}`} className={optionState(letter)} disabled={!ready||loading||!!result} key={letter} onClick={()=>void check(letter)}><strong>{letter}</strong><span><MathText value={text}/></span></button>)}</div>{loading?<p className="pyq-search-answer-status" role="status">Checking…</p>:null}{result?.disposition==='excluded'?<p className="pyq-search-answer-status is-excluded" role="status">Excluded from scoring.</p>:null}{error?<p className="pyq-search-answer-status is-error" role="alert">{error}</p>:null}</article>;
}
