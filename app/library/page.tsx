import { SiteHeader } from '../components/site-header';
import { ArchiveWorkspace } from '../components/archive-workspace';
import { getSubjectPracticeInventory } from '../../lib/pyq-catalog';
import { isPyqExam, type PyqExam } from '../../lib/pyq-catalog';

/** Historical builder drafts remain accessible without silently migrating their scope. */
export default async function LegacyLibrary({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const exam = source && isPyqExam(source) ? source.toUpperCase() as PyqExam : undefined;
  return <><SiteHeader /><ArchiveWorkspace key={exam || 'all'} initialInventory={getSubjectPracticeInventory()} initialExam={exam} /></>;
}
