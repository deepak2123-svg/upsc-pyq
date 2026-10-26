import { notFound } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { ArchiveWorkspace } from '../../components/archive-workspace';
import { getPreparationExplorerInventory } from '../../../lib/preparation-catalog';
import { PREPARATION_EXAMS, isPreparationExam } from '../../../lib/preparation-exams';

export function generateStaticParams() { return PREPARATION_EXAMS.map(exam => ({ exam })); }
export default async function PreparationPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam: raw } = await params;
  const exam = raw.toUpperCase();
  if (!isPreparationExam(exam)) notFound();
  return <><SiteHeader /><ArchiveWorkspace key={exam} initialInventory={getPreparationExplorerInventory(exam)} /></>;
}
