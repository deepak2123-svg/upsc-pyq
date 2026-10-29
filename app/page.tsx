import type { Metadata } from "next";
import { SiteHeader } from "./components/site-header";
import { ArchiveWorkspace } from "./components/archive-workspace";
import { PyqSearch } from './components/pyq-search';
import { getPreparationExplorerInventory } from "../lib/preparation-catalog";

export const metadata: Metadata = {
  title: "Practise Official UPSC PYQs by Subject",
  description: "Combine subjects and subtopics, choose CSE, CAPF, CDS or NDA sources for each path, and practise exact official PYQs.",
};

export default async function Home({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=''}=await searchParams;
  const inventory = getPreparationExplorerInventory('CSE');
  return <><SiteHeader /><main className="pyq-page"><PyqSearch query={q}/></main><ArchiveWorkspace key="CSE" initialInventory={inventory} /></>;
}
