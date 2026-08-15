import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedQuestion } from "../../../../../lib/server/catalog-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ exam: string; year: string; slug: string }> }): Promise<Metadata> {
  const { exam, year, slug } = await params;
  const question = await getPublishedQuestion(exam.toUpperCase(), Number(year), slug);
  return question ? { title: `${exam.toUpperCase()} ${year} PYQ: ${question.subject}`, description: question.stem, alternates: { canonical: `/pyqs/${exam}/${year}/${slug}` } } : { title: "PYQ under editorial review", robots: { index: false, follow: false } };
}

export default async function PublishedPyqPage({ params }: { params: Promise<{ exam: string; year: string; slug: string }> }) {
  const { exam, year: rawYear, slug } = await params;
  const year = Number(rawYear);
  const question = await getPublishedQuestion(exam.toUpperCase(), year, slug);
  if (!question) return <main className="public-article"><div className="eyebrow">PYQ catalogue</div><h1>Question under editorial review.</h1><p>This question is not published yet. UPSCPuraan publishes only records with verified provenance and a detailed explanation.</p><p><Link href={"/exams/" + exam}>Browse the {exam.toUpperCase()} catalogue →</Link></p></main>;
  const options = question.options as Record<string, string>;
  return <main className="public-article"><div className="eyebrow">{question.exam} · {question.year} · {question.paper}</div><h1>{question.subject} PYQ</h1><p className="source-lock">Source-verified question · {question.sourceQuestionNumber}</p><div className="pyq-stem">{question.promptLines.map((line, index) => <p key={question.id + "-" + index}>{line}</p>)}</div><div className="pyq-options">{Object.entries(options).map(([key, value]) => <div className="option" key={key}><span className="option-key">{key}</span><span>{value}</span></div>)}</div><h2>Explanation</h2><p>{question.explanation}</p><p><Link href={"/exams/" + question.exam}>More {question.exam} questions →</Link></p></main>;
}
