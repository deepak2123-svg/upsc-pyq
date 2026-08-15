import Link from "next/link";

export const metadata = { title: "Content sources", description: "Question provenance and editorial standards used by UPSCPuraan." };

export default function SourcesPage() {
  return <article className="public-article"><div className="eyebrow">Trust and transparency</div><h1>Content sources</h1><p>UPSCPuraan preserves exam, year, paper, question number, source wording, and answer provenance for each previous-year question.</p><h2>Editorial standard</h2><p>Questions enter draft review first. A question is publishable only after its provenance and answer are verified and a detailed explanation is present.</p><h2>Generated questions</h2><p>Generated MCQs are labelled separately and require editorial approval before they can enter student tests.</p><p><Link href="/">Return home →</Link></p></article>;
}
