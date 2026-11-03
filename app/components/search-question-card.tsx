'use client';

import Link from 'next/link';
import {useState} from 'react';
import type {PyqSearchResult} from '../../lib/pyq-search';
import {MathText} from './math-text';

type CheckResult={disposition:'scored'|'excluded';correct:boolean|null;correctAnswer:string|null;explanation:string|null;exclusionReason?:string};

export function SearchQuestionCard({question}:{question:PyqSearchResult}){
 const [selected,setSelected]=useState('');
 const [result,setResult]=useState<CheckResult|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const target=question.exam==='NDA'||question.exam==='CDS'||question.exam==='CSE'?question.exam:'CSE';
 const syllabusHref=question.syllabus?`/prepare/${target}?scope=${encodeURIComponent(question.syllabus.scopeId)}`:'';
 async function check(){
  if(!selected||loading)return;
  setLoading(true);setError('');
  try{const response=await fetch('/api/practice/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:question.id,selectedOption:selected})});const data=await response.json() as CheckResult&{error?:string};if(!response.ok)throw new Error(data.error||'The answer could not be checked.');setResult(data);}catch(reason){setError(reason instanceof Error?reason.message:'The answer could not be checked.');}finally{setLoading(false);}
 }
 return <article className="pyq-search-card"><header><span>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</span>{question.syllabus?<Link className="pyq-search-syllabus" href={syllabusHref} aria-label={`Open ${question.syllabus.subtopic} in the ${target} syllabus`}><small>Syllabus location</small><strong>{question.syllabus.subject} → {question.syllabus.head} → {question.syllabus.chapter} → {question.syllabus.subtopic}</strong></Link>:<small>{question.subject} · {question.topic}</small>}</header><div className="pyq-search-prompt">{question.promptLines.map((line,index)=><p key={`${question.id}-${index}`}><MathText value={line}/></p>)}</div><div className="pyq-search-options" role="radiogroup" aria-label={`Answer question ${question.questionNumber}`}>{Object.entries(question.options).map(([letter,text])=><button type="button" role="radio" aria-checked={selected===letter} disabled={loading||!!result} key={letter} onClick={()=>setSelected(letter)}><strong>{letter}</strong><span><MathText value={text}/></span></button>)}</div><footer className="pyq-search-actions"><button type="button" disabled={!selected||loading||!!result} onClick={()=>void check()}>{loading?'Checking…':'Check answer'}</button>{result?<p className={result.correct?'is-correct':'is-incorrect'} role="status">{result.disposition==='excluded'?'This question is excluded from scoring.':result.correct?'Correct.':`Incorrect. Correct answer: ${result.correctAnswer}.`}{result.explanation?` ${result.explanation}`:''}</p>:null}{error?<p role="alert">{error}</p>:null}</footer></article>;
}
