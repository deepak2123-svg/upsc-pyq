"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import Link from 'next/link';

export type SourcePaper = { exam: PyqExam; year: number; paper: string; count: number; complete: boolean; provisional: boolean };
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
    <ul className="source-directory-grid">{visible.map(paper => <li className="source-paper-card" key={`${paper.exam}-${paper.year}-${paper.paper}`} style={{"--source-color":PYQ_EXAM_COLORS[paper.exam]} as CSSProperties}>
      <div className="source-paper-heading"><span className="source-exam-tag">{paper.exam}</span><strong>{paper.year} · {paper.paper}</strong><span>{paper.count} MCQs</span></div>
      <div className="source-paper-status"><span className={paper.complete ? "source-review-complete" : ""}>{paper.complete ? "Complete source review" : "Partial collection"}</span>{paper.provisional ? <span>Provisional key</span> : null}</div>
      {paper.provisional && !(paper.exam==='NDA'&&paper.year===2026&&paper.paper==='I') ? <small>Official provisional key · GS Q51–150; English Q1–50 outside this collection.</small> : null}
      {paper.exam==='NDA'&&paper.year===2026&&paper.paper==='I'?<><small>Complete GAT · English 50 · Science 50 · GS 50 · official provisional key</small><Link href="/papers/nda-2026-i-gat">Start official-key paper →</Link></>:null}
    </li>)}</ul>
    {!filtered.length ? <p className="source-empty" role="status">No added papers match these filters.</p> : null}
    <nav className="source-pagination" aria-label="Paper pages"><button type="button" disabled={!interactive || page === 0} onClick={() => setPage(value => value-1)}>← Previous</button><span aria-live="polite">{filtered.length ? page*PAGE_SIZE+1 : 0}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span><button type="button" disabled={!interactive || page+1 >= pageCount} onClick={() => setPage(value => value+1)}>Next →</button></nav>
  </section>;
}
