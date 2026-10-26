import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { ArchiveWorkspace } from "../../components/archive-workspace";
import { PYQ_EXAMS, getExamSummary, getSubjectPracticeInventory, isPyqExam, type PyqExam } from "../../../lib/pyq-catalog";
import { isPreparationExam } from '../../../lib/preparation-exams';
import { getPreparationExplorerInventory } from '../../../lib/preparation-catalog';

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

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam: rawExam } = await params;
  if (!isPyqExam(rawExam)) notFound();
  const exam = rawExam.toUpperCase() as PyqExam;
  if (isPreparationExam(exam)) return <><SiteHeader /><ArchiveWorkspace key={exam} initialInventory={getPreparationExplorerInventory(exam)} /></>;
  const inventory = getSubjectPracticeInventory();
  return <><SiteHeader /><ArchiveWorkspace initialInventory={inventory} initialExam={exam} /></>;
}
