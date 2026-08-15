import { notFound } from "next/navigation";
import Link from "next/link";
import { catalogSubjects } from "../../../lib/catalog";

export function generateStaticParams() {
  return catalogSubjects.map((subject) => ({ subject }));
}

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  return { title: `${subject} PYQs`, description: `Practice ${subject} questions for UPSC examinations with focused test recipes.` };
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: rawSubject } = await params;
  const subject = catalogSubjects.find((value) => value.toLowerCase() === rawSubject.toLowerCase());
  if (!subject) notFound();
  return <main className="public-article"><div className="eyebrow">Subject catalogue</div><h1>{subject} PYQs</h1><p>Build a focused {subject} practice set across CSE, CAPF, CDS, and NDA where the published inventory supports it.</p><div className="public-actions"><Link className="primary" href="/app/build">Build a {subject} test →</Link><Link className="secondary" href="/exams/CSE">Browse exams</Link></div><h2>Questions you can trust</h2><p>Only questions with verified provenance and detailed explanations are published to student tests. Original PYQ stems and options remain source-locked.</p><p><Link href="/">Return home →</Link></p></main>;
}
