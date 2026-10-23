import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { pyqQuestions, PYQ_EXAMS } from "../../../lib/pyq-catalog";
import coverage from "../../../content/taxonomy/prelims-source-coverage.json";

export const metadata = { title: "Sources — added PYQ papers", description: "Added papers, available GS questions and source-review coverage." };
export default function SourcesPage() {
  const groups = new Map<string, { exam: string; year: number; paper: string; count: number }>();
  for (const question of pyqQuestions) {
    const key = JSON.stringify([question.exam, question.year, question.paper]);
    const group = groups.get(key) ?? { exam: question.exam, year: question.year, paper: question.paper, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  return <><SiteHeader /><article className="public-article sources-page">
    <div className="eyebrow">Sources</div><h1>Added PYQ papers</h1>
    <p>{pyqQuestions.length.toLocaleString("en-IN")} available GS questions across {groups.size} source papers. Counts exclude held, withdrawn, duplicate and out-of-scope records.</p>
    <p><strong>Complete source review</strong> means every numbered question has been accounted for, not that every question is publishable. <strong>Partial collection</strong> means only a subset is currently available. PDFs awaiting import are not listed as added papers.</p>
    {PYQ_EXAMS.map(exam => <section key={exam} aria-labelledby={`sources-${exam}`}>
      <h2 id={`sources-${exam}`}>{exam} {exam === "NDA" ? "GAT · General Knowledge" : exam === "CDS" ? "General Knowledge" : exam === "CAPF" ? "Paper I" : "Prelims · GS Paper I"}</h2>
      <div className="sources-list">{[...groups.values()].filter(group => group.exam === exam).sort((a,b) => b.year-a.year || a.paper.localeCompare(b.paper)).map(group => {
        const source = coverage.papers.find(paper => paper.exam === group.exam && "year" in paper && paper.year === group.year && "paper" in paper && paper.paper === group.paper);
        const complete = source?.coverageStatus === "current-source-content-and-key-reviewed";
        return <div className="source-paper" key={`${group.year}-${group.paper}`}>
          <div><strong>{group.year} · {group.paper}</strong><small>{complete ? "Complete source review" : "Partial collection"}{group.exam === "NDA" && group.year === 2026 && group.paper === "II" ? " · Official provisional key · Q51–150; English Q1–50 outside GS scope" : ""}</small></div>
          <span>{group.count} MCQs</span>
        </div>;
      })}</div>
    </section>)}
    <h2>Editorial standards</h2><p>Source identities, original wording and option order are preserved. Answer verification and full-paper reproduction review are separate checks. Historical attempts retain their original snapshots; excluded questions do not enter new scored tests.</p>
    <p><Link href="/">← Return to library</Link></p>
  </article></>;
}
