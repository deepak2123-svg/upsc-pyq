import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata = { title: "Content sources", description: "Question provenance and editorial standards used by UPSCPuraan." };
export default function SourcesPage() {
  return <><SiteHeader /><article className="public-article"><div className="eyebrow">Trust and transparency</div><h1>Content sources</h1><p>UPSCPuraan preserves exam, year, paper, question number, source wording and answer provenance for each previous-year question.</p><h2>Source fidelity</h2><p>Published PYQs keep their original directions, statements, capitalization, options and option order. Student pages contain official PYQs only.</p><h2>Answers and explanations</h2><p>Verified answer keys may be practised before a detailed explanation is ready. Missing explanations are omitted rather than replaced with editorial placeholder text.</p><p><Link href="/">Return to PYQs →</Link></p></article></>;
}
