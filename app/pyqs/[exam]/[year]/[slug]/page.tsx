import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedQuestion } from "../../../../../lib/server/catalog-service";
import { SiteHeader } from "../../../../components/site-header";

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
  if (!question) return <><SiteHeader /><main className="public-article"><div className="eyebrow">PYQ archive</div><h1>This question is not published.</h1><p>Its source or answer still needs editorial verification.</p><p><Link href={"/exams/" + exam}>Browse {exam.toUpperCase()} PYQs →</Link></p></main></>;
  const options = question.options as Record<string, string>;
  return <><SiteHeader /><main className="public-article"><div className="eyebrow">{question.exam} {question.year} · {question.paper} · Question {question.sourceQuestionNumber}</div><h1>{question.subject} PYQ</h1><div className="pyq-stem">{question.promptLines.map((line, index) => <p key={question.id + "-" + index}>{line}</p>)}</div><div className="pyq-options">{Object.entries(options).map(([key, value]) => <div className="option" key={key}><span className="option-key">{key}</span><span>{value}</span></div>)}</div>{question.explanation && !/pending editorial review/i.test(question.explanation) && <><h2>Explanation</h2><p>{question.explanation}</p></>}<p><Link href={"/exams/" + question.exam}>More {question.exam} PYQs →</Link></p></main></>;
}
