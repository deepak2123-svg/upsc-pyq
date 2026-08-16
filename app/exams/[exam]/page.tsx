import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { ArchiveWorkspace } from "../../components/archive-workspace";
import { PYQ_EXAMS, getArchiveInventory, getExamSummary, isPyqExam, type PyqExam } from "../../../lib/pyq-catalog";

export function generateStaticParams() { return PYQ_EXAMS.map((exam) => ({ exam })); }

export async function generateMetadata({ params }: { params: Promise<{ exam: string }> }): Promise<Metadata> {
  const { exam: rawExam } = await params;
  if (!isPyqExam(rawExam)) return {};
  const summary = getExamSummary(rawExam.toUpperCase() as PyqExam);
  return {
    title: `${summary.exam} Previous-Year Questions`,
    description: `Practise ${summary.questionCount} exact ${summary.exam} PYQs from ${summary.yearFrom} to ${summary.yearTo} by subject and topic.`,
  };
}

export default async function ExamPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { exam: rawExam } = await params;
  if (!isPyqExam(rawExam)) notFound();
  const query = await searchParams;
  const inventory = getArchiveInventory(rawExam.toUpperCase() as PyqExam, Number(query.from) || undefined, Number(query.to) || undefined);
  const initialSelected = Array.isArray(query.path) ? query.path : query.path ? [query.path] : [];
  return <><SiteHeader /><ArchiveWorkspace initialInventory={inventory} initialSelected={initialSelected} /></>;
}
