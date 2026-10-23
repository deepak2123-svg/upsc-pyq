import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { pyqQuestions, type PyqExam } from "../../../lib/pyq-catalog";
import { SourceDirectory } from "../../components/source-directory";
import coverage from "../../../content/taxonomy/prelims-source-coverage.json";

export const metadata = { title: "Sources — added PYQ papers", description: "Added papers, available GS questions and source-review coverage." };
export default function SourcesPage() {
  const groups = new Map<string, { exam: PyqExam; year: number; paper: string; count: number }>();
  for (const question of pyqQuestions) {
    const key = JSON.stringify([question.exam, question.year, question.paper]);
    const group = groups.get(key) ?? { exam: question.exam, year: question.year, paper: question.paper, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  return <><SiteHeader /><article className="public-article sources-page">
    <div className="eyebrow">Sources</div><h1>Added PYQ papers</h1>
    <p>{pyqQuestions.length.toLocaleString("en-IN")} available GS questions across {groups.size} source papers. Counts exclude held, withdrawn, duplicate and out-of-scope records.</p>
    <SourceDirectory papers={[...groups.values()].sort((a,b) => b.year-a.year || a.exam.localeCompare(b.exam) || a.paper.localeCompare(b.paper)).map(group => {
      const source = coverage.papers.find(paper => paper.exam === group.exam && "year" in paper && paper.year === group.year && "paper" in paper && paper.paper === group.paper);
      return {...group,complete:source?.coverageStatus === "current-source-content-and-key-reviewed",provisional:group.exam === "NDA" && group.year === 2026 && group.paper === "II"};
    })} />
    <details className="source-review-notes"><summary>What do the review labels mean?</summary><p><strong>Complete source review</strong> means every numbered question has been accounted for, not that every question is publishable. <strong>Partial collection</strong> means only a subset is currently available. PDFs awaiting import are not listed as added papers.</p><p>Source identities, original wording and option order are preserved. Answer verification and full-paper reproduction review are separate checks. Historical attempts retain their original snapshots; excluded questions do not enter new scored tests.</p></details>
    <p><Link href="/">← Return to library</Link></p>
  </article></>;
}
