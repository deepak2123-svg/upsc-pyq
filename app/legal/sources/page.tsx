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
import officialNda2024IPaper from '../../../content/nda-2024-i-official-paper.json';
import officialNda2023IIPaper from '../../../content/nda-2023-ii-official-paper.json';
import officialNda2023IPaper from '../../../content/nda-2023-i-official-paper.json';
import officialNda2022IIPaper from '../../../content/nda-2022-ii-official-paper.json';
import officialNda2022IPaper from '../../../content/nda-2022-i-official-paper.json';
import officialNda2021IIPaper from '../../../content/nda-2021-ii-official-paper.json';
import officialNda2021IPaper from '../../../content/nda-2021-i-official-paper.json';
import officialNda2020CombinedPaper from '../../../content/nda-2020-i-ii-official-paper.json';
import officialNda2019IIPaper from '../../../content/nda-2019-ii-official-paper.json';
import officialNda2019IPaper from '../../../content/nda-2019-i-official-paper.json';
import officialNda2018IIPaper from '../../../content/nda-2018-ii-official-paper.json';
import officialNda2018IPaper from '../../../content/nda-2018-i-official-paper.json';
import {questionEligible} from '../../../lib/question-review';
import reviewed2024Audit from '../../../content/audits/nda-2024-ii-review.json';

export const metadata = { title: "Sources — added PYQ papers", description: "Added papers, available GS questions and source-review coverage." };
export default function SourcesPage() {
  const officialIds=new Set([...officialNdaPaper.questions,...officialNdaIIPaper.questions,...officialNda2025IIPaper.questions,...officialNda2025IPaper.questions,...reviewedNda2024IIPaper.questions,...officialNda2024IPaper.questions,...officialNda2023IIPaper.questions,...officialNda2023IPaper.questions,...officialNda2022IIPaper.questions,...officialNda2022IPaper.questions,...officialNda2021IIPaper.questions,...officialNda2021IPaper.questions,...officialNda2020CombinedPaper.questions,...officialNda2019IIPaper.questions,...officialNda2019IPaper.questions,...officialNda2018IIPaper.questions,...officialNda2018IPaper.questions].filter(q=>questionEligible(q.id)).map(q=>q.id));
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
    <p>{available.length.toLocaleString("en-IN")} available questions across {groups.size} source papers.</p>
    <SourceDirectory papers={[...groups.values()].sort((a,b) => b.year-a.year || a.exam.localeCompare(b.exam) || a.paper.localeCompare(b.paper)).map(group => {
      const source = coverage.papers.find(paper => paper.exam === group.exam && "year" in paper && paper.year === group.year && "paper" in paper && paper.paper === group.paper);
      const reviewed2024=group.exam==='NDA'&&group.year===2024&&group.paper==='II';
      const official2024=group.exam==='NDA'&&group.year===2024&&group.paper==='I';
      const completeNda=group.exam==='NDA'&&[2025,2026].includes(group.year)&&['I','II'].includes(group.paper);
      const official2023=group.exam==='NDA'&&group.year===2023&&['I','II'].includes(group.paper);
      const official2022=group.exam==='NDA'&&group.year===2022&&['I','II'].includes(group.paper);
      const official2021=group.exam==='NDA'&&group.year===2021&&['I','II'].includes(group.paper);
      const official2020=group.exam==='NDA'&&group.year===2020&&group.paper==='I/II';
      const official2019=group.exam==='NDA'&&group.year===2019&&['I','II'].includes(group.paper);
      const official2018=group.exam==='NDA'&&group.year===2018&&['I','II'].includes(group.paper);
      const reviewedNda=official2018||official2019||official2020||official2021||official2022||official2023||official2024||reviewed2024||completeNda;
      const provisional=group.exam==='NDA'&&group.year===2026&&['I','II'].includes(group.paper);
      const withdrawnNumbers=official2019&&group.paper==='II'?[119]:official2020?[70]:official2024?[101]:group.exam==='NDA'&&group.year===2025&&group.paper==='II'?[85]:group.exam==='NDA'&&group.year===2021&&group.paper==='I'?[58]:[];
      return {...group,complete:reviewedNda||source?.coverageStatus === "current-source-content-and-key-reviewed",provisional,
        ...(reviewedNda?{practiceHref:`/papers/nda-${group.year}-${group.paper.toLowerCase().replace('/','-')}-gat`}:{}),
        ...(reviewedNda?{expected:150,numberSeries:official2020?'B':'A',keyLabel:reviewed2024?'Independently verified':provisional?'Official provisional':'Official final',withdrawnNumbers,
          heldNumbers:reviewed2024?reviewed2024Audit.questionSlots.filter(q=>q.disposition==='quarantined').map(q=>q.number):[],
          sectionSummary:official2018?'English 50 · Science 44 · GS 56':reviewed2024?'English 46 · Science 43 · GS 47':official2024?'English 50 · Science 49 · GS 50':official2019&&group.paper==='I'?'English 50 · Science 47 · GS and World History 53':(group.year===2025||official2023)&&group.paper==='I'?'English 50 · Science 49 · GS 51':group.year===2025?'English 50 · Science 50 · GS 49':'English 50 · Science 50 · GS 50'}:{}),
        ...(official2018?{reviewNote:'150/150 available · official final key · English 50 · Science 44 · GS 56'}:official2019?{reviewNote:group.paper==='I'?'150/150 available · official final key · English 50 · Science 47 · GS and World History 53':'149/150 available · official final key · Q119 withdrawn · English 50 · Science 50 · GS 49'}:official2020?{reviewNote:'149/150 available · one combined I & II booklet · Series B official final key · Q70 withdrawn · English 50 · Science 46 · GS 53'}:official2021?{reviewNote:group.paper==='I'?'149/150 available · official final key · Q58 withdrawn · English 50 · Science 49 · GS 50':'150/150 available · official final key · English 50 · Science 50 · GS 50 · Q102 B/C accepted'}:official2022?{reviewNote:'150/150 available · official final key · English 50 · Science 50 · GS 50'}:official2023?{reviewNote:group.paper==='I'?'150/150 available · official final key · English 50 · Science 49 · GS 51 · Q47 B/D and Q78 A/C accepted':'150/150 available · official final key · English 50 · Science 50 · GS 50'}:official2024?{reviewNote:'149/150 available · official final key · Q101 withdrawn'}:reviewed2024?{reviewNote:'136/150 available · independently verified · 14 quarantined; official-key provenance unresolved'}:{})};
    })} />
    <details className="source-review-notes"><summary>What do the review labels mean?</summary><p><strong>Complete source review</strong> means every numbered question has been accounted for, not that every question is publishable. <strong>Partial collection</strong> means only a subset is currently available. PDFs awaiting import are not listed as added papers.</p><p><strong>Held for review</strong> numbers identify questions you can supply with a clearer scan or matching official key. <strong>Officially withdrawn</strong> questions were dropped by UPSC and do not need replacement answers. <strong>Not yet reconciled</strong> means a complete missing-number list has not been established; it does not mean zero missing questions.</p><p>Source identities, original wording and option order are preserved. Answer verification and full-paper reproduction review are separate checks. Historical attempts retain their original snapshots; excluded questions do not enter new scored tests.</p></details>
    <p><Link href="/">← Return to library</Link></p>
  </article></>;
}
