import { notFound } from "next/navigation";
import Link from "next/link";
import { catalogExams, type CatalogExam } from "../../../lib/catalog";

export function generateStaticParams() {
  return Object.keys(catalogExams).map((exam) => ({ exam }));
}

export async function generateMetadata({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  const details = catalogExams[exam.toUpperCase() as CatalogExam];
  return details ? { title: `${exam.toUpperCase()} Test Series`, description: details.description } : {};
}

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam: rawExam } = await params;
  const exam = rawExam.toUpperCase() as CatalogExam;
  const details = catalogExams[exam];
  if (!details) notFound();
  return <main className="public-article"><div className="eyebrow">Exam catalogue</div><h1>{exam} test series</h1><p>{details.description}</p><div className="card" style={{ marginTop: 28 }}><strong>{details.paper}</strong><p>Choose subjects, topics, difficulty, question count, duration, and Practice or Exam mode.</p><Link className="primary" href="/app/build">Build a {exam} test →</Link></div><h2>Editorial standard</h2><p>Published questions retain their original source wording, exam metadata, and provenance. Questions without verification or a detailed explanation remain unavailable in student tests.</p><p><Link href="/">Return home →</Link></p></main>;
}
