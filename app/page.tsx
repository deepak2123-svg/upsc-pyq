import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { PYQ_EXAMS, getExamSummary } from "../lib/pyq-catalog";

export const metadata: Metadata = {
  title: "Official UPSC PYQs",
  description: "Practise exact previous-year questions from CSE, CAPF, CDS and NDA papers.",
};

const summaries = PYQ_EXAMS.map(getExamSummary);

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="pyq-page pyq-home">
        <section className="pyq-intro" aria-labelledby="archive-title">
          <p className="pyq-kicker">Official previous-year questions</p>
          <h1 id="archive-title">Choose an examination.</h1>
          <p>Browse by subject, topic and subtopic, then practise from the exact source paper.</p>
        </section>

        <section className="exam-archive" aria-label="Examinations">
          {summaries.map((summary) => (
            <Link className="exam-row" href={`/exams/${summary.exam}`} key={summary.exam}>
              <span className="exam-code">{summary.exam}</span>
              <span className="exam-name">
                <strong>{summary.name}</strong>
                <small>{summary.paper}</small>
              </span>
              <span className="exam-years">
                <strong>{summary.yearFrom}–{summary.yearTo}</strong>
                <small>{summary.subjects.length} subject{summary.subjects.length === 1 ? "" : "s"}</small>
              </span>
              <span className="exam-count">
                <strong>{summary.questionCount.toLocaleString("en-IN")}</strong>
                <small>PYQs</small>
              </span>
              <span className="exam-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </section>

        <footer className="pyq-footer">
          <span>Independent practice platform. Not affiliated with UPSC.</span>
          <span><Link href="/legal/sources">Sources</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></span>
        </footer>
      </main>
    </>
  );
}
