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
  const searching=q.trim().length>0;
  const inventory = searching ? null : getPreparationExplorerInventory('CSE');
  return <><SiteHeader searchQuery={q} /><main className={`pyq-page${searching?' is-searching':''}`}><PyqSearch query={q}/></main>{inventory?<ArchiveWorkspace key="CSE" initialInventory={inventory} />:null}</>;
}
