"use client";

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {PYQ_EXAM_COLORS,PYQ_EXAMS,type PyqExam} from '../../lib/pyq-exams';
import type {TrendQuestion} from '../../lib/trends-catalog';

const papers:Record<PyqExam,string[]>={CSE:['GS Paper I'],CAPF:['Paper I'],CDS:['General Knowledge','English','Elementary Mathematics'],NDA:['GAT','Mathematics']};
const gatBranches=['English','Science','GS'] as const;
const ranges=[5,10,0] as const;
const format=(value:number)=>new Intl.NumberFormat('en-IN').format(value);
type TrendRow={subject:string;topic:string;subtopic:string;taxonomyId?:string|null;cells:Record<string,number>;total:number;recent:number};

export function TrendsWorkspace({questions}:{questions:TrendQuestion[]}){
 const [exam,setExam]=useState<PyqExam>('NDA');
 const [paper,setPaper]=useState('GAT');
 const [gatSection,setGatSection]=useState<string>('English');
 const [range,setRange]=useState<(typeof ranges)[number]>(10);
 const [chosenSubject,setChosenSubject]=useState('');
 const [chosenTopic,setChosenTopic]=useState('');
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>setHydrated(true),[]);
 const sectioned=exam==='NDA'&&paper==='GAT';
 const available=useMemo(()=>questions.filter(q=>q.exam===exam&&q.paper===paper&&(!sectioned||q.branch===gatSection)),[questions,exam,paper,sectioned,gatSection]);
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
 const subjects=useMemo(()=>[...new Set(rows.map(row=>row.subject))].map(subject=>({name:subject,total:rows.filter(row=>row.subject===subject).reduce((sum,row)=>sum+row.total,0)})).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)),[rows]);
 const activeSubject=subjects.some(item=>item.name===chosenSubject)?chosenSubject:subjects[0]?.name||'';
 const topics=useMemo(()=>[...new Set(rows.filter(row=>row.subject===activeSubject).map(row=>row.topic))].map(topic=>{const matches=rows.filter(row=>row.subject===activeSubject&&row.topic===topic);return {name:topic,total:matches.reduce((sum,row)=>sum+row.total,0),subtopics:matches.length};}).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)),[rows,activeSubject]);
 const activeTopic=topics.some(item=>item.name===chosenTopic)?chosenTopic:topics[0]?.name||'';
 const detailRows=rows.filter(row=>row.subject===activeSubject&&row.topic===activeTopic);
 const maxCell=Math.max(1,...detailRows.flatMap(row=>Object.values(row.cells)));
 function resetDrilldown(){setChosenSubject('');setChosenTopic('');}
 function chooseExam(next:PyqExam){setExam(next);const nextPaper=papers[next][0];setPaper(nextPaper);setGatSection(next==='NDA'&&nextPaper==='GAT'?'English':'All');resetDrilldown();}
 function choosePaper(next:string){setPaper(next);setGatSection(exam==='NDA'&&next==='GAT'?'English':'All');resetDrilldown();}
 function chooseBranch(next:string){setGatSection(next);resetDrilldown();}
 function chooseSubject(next:string){setChosenSubject(next);setChosenTopic('');}
 return <main className="trends-page">
  <header className="trends-hero"><p className="pyq-kicker">Historical question analysis</p><h1>PYQ Trends</h1><p>See which topics UPSC has asked, how frequently they return, and how the pattern changes by year and examination term.</p></header>
  <section className="trends-controls" aria-label="Trend filters">
   <fieldset disabled={!hydrated}><legend>Exam</legend><div>{PYQ_EXAMS.map(item=><button key={item} style={{'--trend-color':PYQ_EXAM_COLORS[item]} as React.CSSProperties} aria-pressed={exam===item} onClick={()=>chooseExam(item)}>{item}</button>)}</div></fieldset>
   <fieldset disabled={!hydrated}><legend>Paper</legend><div>{papers[exam].map(item=><button key={item} aria-pressed={paper===item} onClick={()=>choosePaper(item)}>{item}</button>)}</div></fieldset>
   {sectioned?<fieldset disabled={!hydrated}><legend>GAT section</legend><div>{gatBranches.map(section=><button type="button" key={section} aria-pressed={gatSection===section} onClick={()=>chooseBranch(section)}>{section}</button>)}</div></fieldset>:null}
   <fieldset disabled={!hydrated}><legend>Years</legend><div>{ranges.map(value=><button key={value} aria-pressed={range===value} onClick={()=>setRange(value)}>{value?`Last ${value}`:'All years'}</button>)}</div></fieldset>
  </section>
  <section className="trends-summary" aria-labelledby="trend-summary-title"><div><p>Selected series</p><h2 id="trend-summary-title">{exam} · {paper}{sectioned?` · ${gatSection}`:''}</h2><span>{years.length?`${Math.min(...years)}–${Math.max(...years)}`:'No years available'}</span></div><div><strong>{format(available.filter(q=>years.includes(q.year)).reduce((sum,q)=>sum+q.count,0))}</strong><span>mapped questions</span></div><div><strong>{format(rows.length)}</strong><span>subtopics</span></div><div><strong>{years.length}</strong><span>years</span></div></section>
  <section className="trends-table-section"><div className="trends-section-heading"><div><h2>Explore the pattern</h2><p>Choose a main topic, then a subdivision. The yearwise table only shows that subdivision’s subtopics.</p></div></div>
   {!rows.length?<div className="trends-empty">No mapped questions are available for this selection.</div>:<><div className="trends-subject-grid" role="group" aria-label="Main topics">{subjects.map(subject=><button key={subject.name} aria-pressed={activeSubject===subject.name} onClick={()=>chooseSubject(subject.name)}><strong>{subject.name}</strong><span>{format(subject.total)} questions</span></button>)}</div><div className="trends-topic-panel"><div><span>{activeSubject}</span><h3>Choose a subdivision</h3></div><div className="trends-topic-grid" role="group" aria-label={`${activeSubject} subdivisions`}>{topics.map(topic=><button key={topic.name} aria-pressed={activeTopic===topic.name} onClick={()=>setChosenTopic(topic.name)}><strong>{topic.name}</strong><span>{format(topic.total)} questions · {topic.subtopics} subtopics</span></button>)}</div></div><div className="trends-section-heading trends-detail-heading"><div><p>{activeSubject}</p><h2>{activeTopic}</h2><span>Yearwise subtopic frequency</span></div></div><div className="trends-table-scroll"><table className="trends-table"><thead><tr><th rowSpan={2}>Subtopic</th>{years.map(year=><th key={year} colSpan={terms.length}>{year}</th>)}<th rowSpan={2}>Total</th><th rowSpan={2}>Last 5</th></tr><tr>{years.flatMap(year=>terms.map(term=><th key={`${year}:${term}`}>{term==='—'?'Questions':term}</th>))}</tr></thead><tbody>{detailRows.map(row=><tr key={`${row.subject}:${row.topic}:${row.subtopic}`}><th scope="row"><strong>{row.subtopic}</strong>{row.taxonomyId?<Link href={`/prepare/${exam}?scope=${encodeURIComponent(row.taxonomyId)}`}>Open in library →</Link>:null}</th>{years.flatMap(year=>terms.map(term=>{const count=row.cells[`${year}:${term}`]||0;return <td key={`${year}:${term}`} className={count?'has-count':''} style={count?{'--heat':Math.max(.12,count/maxCell)} as React.CSSProperties:undefined}>{count||'—'}</td>}))}<td><strong>{row.total}</strong></td><td>{row.recent}</td></tr>)}</tbody></table></div></>}
  </section>
 </main>;
}
