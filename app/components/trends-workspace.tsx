"use client";

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {PYQ_EXAM_COLORS,PYQ_EXAMS,type PyqExam} from '../../lib/pyq-exams';
import type {TrendQuestion} from '../../lib/trends-catalog';

const papers:Record<PyqExam,string[]>={CSE:['GS Paper I'],CAPF:['Paper I'],CDS:['General Knowledge','English','Elementary Mathematics'],NDA:['GAT','Mathematics']};
const ranges=[5,10,0] as const;
const format=(value:number)=>new Intl.NumberFormat('en-IN').format(value);

export function TrendsWorkspace({questions}:{questions:TrendQuestion[]}){
 const [exam,setExam]=useState<PyqExam>('NDA');
 const [paper,setPaper]=useState('GAT');
 const [range,setRange]=useState<(typeof ranges)[number]>(10);
 const available=useMemo(()=>questions.filter(q=>q.exam===exam&&q.paper===paper),[questions,exam,paper]);
 const years=useMemo(()=>[...new Set(available.map(q=>q.year))].sort((a,b)=>b-a).slice(0,range||undefined),[available,range]);
 const terms=useMemo(()=>exam==='NDA'||exam==='CDS'?['I','II']:['—'],[exam]);
 const rows=useMemo(()=>{
  const allowed=new Set(years),map=new Map<string,{subject:string;topic:string;subtopic:string;taxonomyId?:string|null;cells:Record<string,number>;total:number;recent:number}>();
  for(const q of available){
   if(!allowed.has(q.year))continue;
   const key=`${q.subject}\u0000${q.topic}\u0000${q.subtopic}`;
   const row=map.get(key)||{subject:q.subject,topic:q.topic,subtopic:q.subtopic,taxonomyId:q.taxonomyId,cells:{},total:0,recent:0};
   const cell=`${q.year}:${q.term}`;row.cells[cell]=(row.cells[cell]||0)+q.count;row.total+=q.count;
   if(q.year>=Math.max(...years)-4)row.recent+=q.count;
   map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>b.total-a.total||a.subject.localeCompare(b.subject)||a.subtopic.localeCompare(b.subtopic));
 },[available,years]);
 const maxCell=Math.max(1,...rows.flatMap(row=>Object.values(row.cells)));
 function chooseExam(next:PyqExam){setExam(next);setPaper(papers[next][0]);}
 return <main className="trends-page">
  <header className="trends-hero"><p className="pyq-kicker">Historical question analysis</p><h1>PYQ Trends</h1><p>See which topics UPSC has asked, how frequently they return, and how the pattern changes by year and examination term.</p></header>
  <section className="trends-controls" aria-label="Trend filters">
   <fieldset><legend>Exam</legend><div>{PYQ_EXAMS.map(item=><button key={item} style={{'--trend-color':PYQ_EXAM_COLORS[item]} as React.CSSProperties} aria-pressed={exam===item} onClick={()=>chooseExam(item)}>{item}</button>)}</div></fieldset>
   <fieldset><legend>Paper</legend><div>{papers[exam].map(item=><button key={item} aria-pressed={paper===item} onClick={()=>setPaper(item)}>{item}</button>)}</div></fieldset>
   <fieldset><legend>Years</legend><div>{ranges.map(value=><button key={value} aria-pressed={range===value} onClick={()=>setRange(value)}>{value?`Last ${value}`:'All years'}</button>)}</div></fieldset>
  </section>
  <section className="trends-summary" aria-labelledby="trend-summary-title"><div><p>Selected series</p><h2 id="trend-summary-title">{exam} · {paper}</h2><span>{years.length?`${Math.min(...years)}–${Math.max(...years)}`:'No years available'}</span></div><div><strong>{format(available.filter(q=>years.includes(q.year)).reduce((sum,q)=>sum+q.count,0))}</strong><span>mapped questions</span></div><div><strong>{format(rows.length)}</strong><span>subtopics</span></div><div><strong>{years.length}</strong><span>years</span></div></section>
  <section className="trends-table-section"><div className="trends-section-heading"><div><h2>Yearwise topic frequency</h2><p>Darker cells mean that a subtopic appeared more often in that paper and term.</p></div></div>
   {!rows.length?<div className="trends-empty">No mapped questions are available for this selection.</div>:<div className="trends-table-scroll"><table className="trends-table"><thead><tr><th rowSpan={2}>Topic / subtopic</th>{years.map(year=><th key={year} colSpan={terms.length}>{year}</th>)}<th rowSpan={2}>Total</th><th rowSpan={2}>Last 5</th></tr><tr>{years.flatMap(year=>terms.map(term=><th key={`${year}:${term}`}>{term==='—'?'Questions':term}</th>))}</tr></thead><tbody>{rows.map(row=><tr key={`${row.subject}:${row.topic}:${row.subtopic}`}><th scope="row"><span>{row.subject} › {row.topic}</span><strong>{row.subtopic}</strong>{row.taxonomyId?<Link href={`/prepare/${exam}?scope=${encodeURIComponent(row.taxonomyId)}`}>Open in library →</Link>:null}</th>{years.flatMap(year=>terms.map(term=>{const count=row.cells[`${year}:${term}`]||0;return <td key={`${year}:${term}`} className={count?'has-count':''} style={count?{'--heat':Math.max(.12,count/maxCell)} as React.CSSProperties:undefined}>{count||'—'}</td>}))}<td><strong>{row.total}</strong></td><td>{row.recent}</td></tr>)}</tbody></table></div>}
  </section>
 </main>;
}
