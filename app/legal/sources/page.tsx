import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { pyqQuestions, type PyqExam } from "../../../lib/pyq-catalog";
import { SourceDirectory } from "../../components/source-directory";
import coverage from "../../../content/taxonomy/prelims-source-coverage.json";
import {historicalPyqQuestions} from '../../../lib/pyq-catalog';
import officialNdaPaper from '../../../content/nda-2026-i-official-paper.json';
import officialNdaIIPaper from '../../../content/nda-2026-ii-official-paper.json';
import officialNda2025IIPaper from '../../../content/nda-2025-ii-official-paper.json';
import officialNda2025IPaper from '../../../content/nda-2025-i-official-paper.json';
import reviewedNda2024IIPaper from '../../../content/nda-2024-ii-reviewed-paper.json';
import {questionEligible} from '../../../lib/question-review';

export const metadata = { title: "Sources — added PYQ papers", description: "Added papers, available GS questions and source-review coverage." };
export default function SourcesPage() {
  const officialIds=new Set([...officialNdaPaper.questions,...officialNdaIIPaper.questions,...officialNda2025IIPaper.questions,...officialNda2025IPaper.questions,...reviewedNda2024IIPaper.questions].filter(q=>questionEligible(q.id)).map(q=>q.id));
  const available=[...new Map([...pyqQuestions,...historicalPyqQuestions.filter(q=>officialIds.has(q.id))].map(q=>[q.id,q])).values()];
  const groups = new Map<string, { exam: PyqExam; year: number; paper: string; count: number }>();
  for (const question of available) {
    const key = JSON.stringify([question.exam, question.year, question.paper]);
    const group = groups.get(key) ?? { exam: question.exam, year: question.year, paper: question.paper, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  return <><SiteHeader /><article className="public-article sources-page">
    <div className="eyebrow">Sources</div><h1>Added PYQ papers</h1>
    <p>{available.length.toLocaleString("en-IN")} available questions across {groups.size} source papers. NDA I and II 2026 and NDA I 2025 each include all 150 GAT questions across English, Science and GS. NDA II 2025 has 149 available of 150 source questions; Q85 was officially dropped. NDA II 2024 has 136 independently verified questions; 14 remain quarantined after individual review. Counts exclude held, withdrawn and duplicate records.</p>
    <SourceDirectory papers={[...groups.values()].sort((a,b) => b.year-a.year || a.exam.localeCompare(b.exam) || a.paper.localeCompare(b.paper)).map(group => {
      const source = coverage.papers.find(paper => paper.exam === group.exam && "year" in paper && paper.year === group.year && "paper" in paper && paper.paper === group.paper);
      const reviewed2024=group.exam==='NDA'&&group.year===2024&&group.paper==='II';
      const completeNda=group.exam==='NDA'&&[2025,2026].includes(group.year)&&['I','II'].includes(group.paper);
      return {...group,complete:reviewed2024||completeNda||source?.coverageStatus === "current-source-content-and-key-reviewed",provisional:group.exam === "NDA" && group.year === 2026 && ['I','II'].includes(group.paper),...(reviewed2024?{reviewNote:'136/150 available · independently verified · 14 quarantined; official-key provenance unresolved'}:{})};
    })} />
    <details className="source-review-notes"><summary>What do the review labels mean?</summary><p><strong>Complete source review</strong> means every numbered question has been accounted for, not that every question is publishable. <strong>Partial collection</strong> means only a subset is currently available. PDFs awaiting import are not listed as added papers.</p><p>Source identities, original wording and option order are preserved. Answer verification and full-paper reproduction review are separate checks. Historical attempts retain their original snapshots; excluded questions do not enter new scored tests.</p></details>
    <p><Link href="/">← Return to library</Link></p>
  </article></>;
}
