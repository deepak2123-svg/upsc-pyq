"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";

export type SourcePaper = { exam: PyqExam; year: number; paper: string; count: number; complete: boolean; provisional: boolean; practiceHref?:string; reviewNote?:string; expected?:number; keyLabel?:string; heldNumbers?:number[]; withdrawnNumbers?:number[]; sectionSummary?:string; numberSeries?:string };
const PAGE_SIZE = 12;
const subscribeToReadiness = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function SourceDirectory({ papers }: { papers: SourcePaper[] }) {
  const interactive = useSyncExternalStore(subscribeToReadiness, clientReady, serverReady);
  const [exam,setExam] = useState<PyqExam | "all">("all");
  const [year,setYear] = useState("all");
  const [status,setStatus] = useState("all");
  const [page,setPage] = useState(0);
  const years = [...new Set(papers.map(paper => paper.year))].sort((a,b) => b-a);
  const filtered = papers.filter(paper => (exam === "all" || paper.exam === exam) && (year === "all" || String(paper.year) === year) && (status === "all" || paper.complete === (status === "complete")));
  const pageCount = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible = filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  return <section className="source-directory" aria-label="Added paper directory">
    <div className="source-exam-filters" aria-label="Filter by exam">{(["all",...PYQ_EXAMS] as const).map(value => <button type="button" disabled={!interactive} key={value} aria-pressed={exam === value} onClick={() => {setExam(value);setPage(0);}}>{value === "all" ? "All exams" : value}<span>{papers.filter(paper => value === "all" || paper.exam === value).length}</span></button>)}</div>
    <div className="source-directory-toolbar"><div><label>Year<select disabled={!interactive} value={year} onChange={event => {setYear(event.target.value);setPage(0);}}><option value="all">All years</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Review status<select disabled={!interactive} value={status} onChange={event => {setStatus(event.target.value);setPage(0);}}><option value="all">All statuses</option><option value="complete">Complete source review</option><option value="partial">Partial collection</option></select></label></div><p aria-live="polite">{filtered.length} papers · {filtered.reduce((sum,paper) => sum+paper.count,0).toLocaleString("en-IN")} MCQs</p></div>
    <div className="source-table-scroll" role="region" aria-label="Source papers table, scroll horizontally on small screens" tabIndex={0}>
    <table className="source-table"><caption className="sr-only">Added PYQ papers, available questions, review coverage and unavailable question numbers</caption>
      <thead><tr><th scope="col">Paper</th><th scope="col">Available</th><th scope="col">Source review</th><th scope="col">Answer evidence</th><th scope="col">Unavailable questions</th></tr></thead>
      <tbody>{visible.map(paper=><tr key={`${paper.exam}-${paper.year}-${paper.paper}`} style={{"--source-color":PYQ_EXAM_COLORS[paper.exam]} as CSSProperties}>
        <th scope="row"><span className="source-exam-tag">{paper.exam}</span><strong>{paper.practiceHref?<Link href={paper.practiceHref}>{paper.year} · {paper.paper}</Link>:<>{paper.year} · {paper.paper}</>}</strong><small>{paper.exam==='NDA'?'GAT':paper.exam==='CDS'?'General Knowledge':paper.exam==='CSE'?'GS Paper I':'Paper I'}</small>{paper.practiceHref?<Link className="source-practice-link" href={paper.practiceHref}>Practise full paper →</Link>:null}</th>
        <td className="source-count"><strong>{paper.count}</strong>{paper.expected?<span> / {paper.expected}</span>:<span> MCQs</span>}{paper.sectionSummary?<small>{paper.sectionSummary}</small>:null}</td>
        <td><span className={`source-review-badge ${paper.complete?'source-review-complete':''}`}>{paper.complete?'Complete source review':'Partial collection'}</span></td>
        <td><span>{paper.keyLabel??(paper.provisional?'Official provisional':'Not fully reconciled')}</span>{paper.reviewNote?<details className="source-evidence-details"><summary>Review details</summary><p>{paper.reviewNote}</p></details>:null}</td>
        <td className="source-gaps">{paper.heldNumbers?.length?<><strong className="source-held-label">{paper.heldNumbers.length} held for review</strong><p><span className="source-gap-kind">Question numbers{paper.numberSeries?` · Series ${paper.numberSeries}`:''}</span>{paper.heldNumbers.join(', ')}</p></>:null}
        {paper.withdrawnNumbers?.length?<p className="source-withdrawn"><strong>Officially withdrawn</strong><span>Q{paper.withdrawnNumbers.join(', Q')}</span></p>:null}
        {!paper.heldNumbers?.length&&!paper.withdrawnNumbers?.length?<span className="source-gap-muted">{paper.expected===paper.count?'None':paper.complete?'No numbers recorded':'Not yet reconciled'}</span>:null}</td>
      </tr>)}</tbody>
    </table></div>
      {!filtered.length ? <p className="source-empty" role="status">No added papers match these filters.</p> : null}
    <nav className="source-pagination" aria-label="Paper pages"><button type="button" disabled={!interactive || page === 0} onClick={() => setPage(value => value-1)}>← Previous</button><span aria-live="polite">{filtered.length ? page*PAGE_SIZE+1 : 0}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span><button type="button" disabled={!interactive || page+1 >= pageCount} onClick={() => setPage(value => value+1)}>Next →</button></nav>
  </section>;
}
