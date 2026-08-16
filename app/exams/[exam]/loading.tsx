import { SiteHeader } from "../../components/site-header";

export default function ExamLoading() {
  return <><SiteHeader /><main className="pyq-page archive-workspace" aria-busy="true"><div className="archive-heading skeleton-heading"><span /><span /><span /></div><div className="skeleton-controls" /><div className="skeleton-chart" /></main></>;
}
