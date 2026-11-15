"use client";

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import type {PreparationExam,PreparationView} from '../../lib/preparation-exams';
import type {TrendQuestion} from '../../lib/trends-catalog';
import {PreparationSelector} from './preparation-selector';

const viewsByExam:Record<PreparationExam,PreparationView[]>={
 NDA:[
  {id:'nda-english',paper:'GAT',label:'English',subjectIds:[]},
  {id:'nda-science',paper:'GAT',label:'Science',subjectIds:[]},
  {id:'nda-gs',paper:'GAT',label:'GS',subjectIds:[]},
  {id:'nda-maths',paper:'Mathematics',label:'Mathematics',subjectIds:[]},
 ],
 CDS:[
  {id:'cds-gk',paper:'General Knowledge',label:'General Knowledge',subjectIds:[]},
  {id:'cds-english',paper:'English',label:'English',subjectIds:[]},
  {id:'cds-maths',paper:'Elementary Mathematics',label:'Elementary Mathematics',subjectIds:[]},
 ],
 CSE:[
  {id:'cse-gs',paper:'GS Paper I',label:'GS Paper I',subjectIds:[]},
  {id:'cse-csat',paper:'GS Paper II / CSAT',label:'GS Paper II / CSAT',subjectIds:[]},
 ],
};
const ranges=[5,10,0] as const;
const format=(value:number)=>new Intl.NumberFormat('en-IN').format(value);
type TrendRow={subject:string;topic:string;subtopic:string;taxonomyId?:string|null;cells:Record<string,number>;total:number;recent:number};

export function TrendsWorkspace({questions}:{questions:TrendQuestion[]}){
 const [exam,setExam]=useState<PreparationExam>('NDA');
 const [activeView,setActiveView]=useState<PreparationView>(viewsByExam.NDA[0]);
 const [range,setRange]=useState<(typeof ranges)[number]>(10);
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const sectioned=exam==='NDA'&&activeView.paper==='GAT';
 const available=useMemo(()=>questions.filter(q=>q.exam===exam&&q.paper===activeView.paper&&(!sectioned||q.branch===activeView.label)),[questions,exam,activeView,sectioned]);
 const years=useMemo(()=>[...new Set(available.map(q=>q.year))].sort((a,b)=>b-a).slice(0,range||undefined),[available,range]);
 const terms=useMemo(()=>exam==='NDA'||exam==='CDS'?['I','II']:['—'],[exam]);
 const rows=useMemo(()=>{
  const allowed=new Set(years),map=new Map<string,TrendRow>();
  for(const q of available){
   if(!allowed.has(q.year))continue;
   const key=`${q.subject}\u0000${q.topic}\u0000${q.subtopic}`;
   const row=map.get(key)||{subject:q.subject,topic:q.topic,subtopic:q.subtopic,taxonomyId:q.taxonomyId,cells:{},total:0,recent:0};
   const cell=`${q.year}:${q.term}`;row.cells[cell]=(row.cells[cell]||0)+q.count;row.total+=q.count;
   if(q.year>=Math.max(...years)-4)row.recent+=q.count;
   map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>a.subject.localeCompare(b.subject)||a.topic.localeCompare(b.topic)||a.subtopic.localeCompare(b.subtopic));
 },[available,years]);
 const componentRows=useMemo(()=>{
  const map=new Map<string,TrendRow>();
  for(const row of rows){
   const component=map.get(row.subject)||{subject:row.subject,topic:'',subtopic:'',cells:{},total:0,recent:0};
   for(const [cell,count] of Object.entries(row.cells))component.cells[cell]=(component.cells[cell]||0)+count;
   component.total+=row.total;component.recent+=row.recent;map.set(row.subject,component);
  }
  return [...map.values()].sort((a,b)=>b.total-a.total||a.subject.localeCompare(b.subject));
 },[rows]);
 const maxCell=Math.max(1,...componentRows.flatMap(row=>Object.values(row.cells)));
 function chooseExam(next:PreparationExam){setExam(next);setActiveView(viewsByExam[next][0]);}
 return <main className="trends-page">
  <PreparationSelector exam={exam} views={viewsByExam[exam]} activeView={activeView} disabled={!ready} onExam={chooseExam} onView={setActiveView}/>
  <div className="trends-range" role="group" aria-label="Years">{ranges.map(value=><button key={value} aria-pressed={range===value} onClick={()=>setRange(value)}>{value?`Last ${value}`:'All years'}</button>)}</div>
  <section className="trends-summary" aria-labelledby="trend-summary-title"><div><p>Selected series</p><h2 id="trend-summary-title">{exam} · {activeView.paper}{sectioned?` · ${activeView.label}`:''}</h2><span>{years.length?`${Math.min(...years)}–${Math.max(...years)}`:'No years available'}</span></div><div><strong>{format(available.filter(q=>years.includes(q.year)).reduce((sum,q)=>sum+q.count,0))}</strong><span>mapped questions</span></div><div><strong>{format(componentRows.length)}</strong><span>components</span></div><div><strong>{years.length}</strong><span>years</span></div></section>
  <section className="trends-table-section">
   {!componentRows.length?<div className="trends-empty">No mapped questions are available for this selection.</div>:<div className="trends-table-scroll"><table className="trends-table"><thead><tr><th rowSpan={2}>Component</th>{years.map(year=><th key={year} colSpan={terms.length}>{year}</th>)}<th rowSpan={2}>Total</th><th rowSpan={2}>Last 5</th></tr><tr>{years.flatMap(year=>terms.map(term=><th key={`${year}:${term}`}>{term==='—'?'Questions':term}</th>))}</tr></thead><tbody>{componentRows.map(row=><tr key={row.subject}><th scope="row"><strong>{row.subject}</strong><Link href={`/prepare/${exam}`}>Open in library →</Link></th>{years.flatMap(year=>terms.map(term=>{const count=row.cells[`${year}:${term}`]||0;return <td key={`${year}:${term}`} className={count?'has-count':''} style={count?{'--heat':Math.max(.12,count/maxCell)} as React.CSSProperties:undefined}>{count||'—'}</td>}))}<td><strong>{row.total}</strong></td><td>{row.recent}</td></tr>)}</tbody></table></div>}
  </section>
 </main>;
}
