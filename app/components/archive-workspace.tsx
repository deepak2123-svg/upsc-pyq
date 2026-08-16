"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { sankey, sankeyLinkHorizontal, type SankeyGraph, type SankeyLink, type SankeyNode } from "d3-sankey";
import type { ArchiveInventory, PyqExam, SankeyNode as InventoryNode } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";

type ChartLink = { source: string | ChartNode; target: string | ChartNode; value: number; questionCount: number };
type ChartNode = InventoryNode & SankeyNode<InventoryNode, ChartLink>;
type LayoutLink = SankeyLink<InventoryNode, ChartLink>;

const EXAMS: PyqExam[] = ["CSE", "CAPF", "CDS", "NDA"];
const COUNTS = [10, 20, 30, 50] as const;

function descendants(nodeId: string, inventory: ArchiveInventory) {
  const childMap = new Map<string, string[]>();
  inventory.links.forEach((link) => childMap.set(link.source, [...(childMap.get(link.source) || []), link.target]));
  const leaves: string[] = [];
  const visit = (id: string) => {
    const children = childMap.get(id) || [];
    if (!children.length) leaves.push(id);
    else children.forEach(visit);
  };
  visit(nodeId);
  return leaves;
}

function nodeIsActive(nodeId: string, selected: Set<string>, inventory: ArchiveInventory) {
  return selected.size === 0 || descendants(nodeId, inventory).some((id) => selected.has(id));
}

function buildLayout(inventory: ArchiveInventory) {
  const perKind = ["subject", "topic", "subtopic"].map((kind) => inventory.nodes.filter((node) => node.kind === kind).length);
  const height = Math.min(1180, Math.max(560, Math.max(...perKind) * 27 + 96));
  const generator = sankey<InventoryNode, ChartLink>()
    .nodeId((node) => node.id)
    .nodeWidth(10)
    .nodePadding(10)
    .extent([[24, 34], [1076, height - 24]])
    .iterations(48);
  const graph = generator({
    nodes: inventory.nodes.map((node) => ({ ...node })),
    links: inventory.links.map((link) => ({ source: link.source, target: link.target, value: link.questionCount, questionCount: link.questionCount })),
  });
  return { graph, height } as { graph: SankeyGraph<InventoryNode, ChartLink>; height: number };
}

export function ArchiveWorkspace({ initialInventory, initialSelected = [] }: { initialInventory: ArchiveInventory; initialSelected?: string[] }) {
  const router = useRouter();
  const [inventory, setInventory] = useState(initialInventory);
  const [yearFrom, setYearFrom] = useState(initialInventory.yearFrom);
  const [yearTo, setYearTo] = useState(initialInventory.yearTo);
  const [selected, setSelected] = useState<string[]>(initialSelected.filter((id) => initialInventory.nodes.some((node) => node.id === id && node.kind === "subtopic")));
  const [count, setCount] = useState<number | "all">(20);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const selection = useMemo(() => new Set(selected), [selected]);
  const { graph, height } = useMemo(() => buildLayout(inventory), [inventory]);
  const eligibleCount = selection.size
    ? inventory.nodes.filter((node) => node.kind === "subtopic" && selection.has(node.id)).reduce((sum, node) => sum + node.questionCount, 0)
    : inventory.totalCount;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (yearFrom !== inventory.years[0]) params.set("from", String(yearFrom));
    if (yearTo !== inventory.years.at(-1)) params.set("to", String(yearTo));
    selected.forEach((id) => params.append("path", id));
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [selected, yearFrom, yearTo, inventory.years]);

  useEffect(() => {
    if (count !== "all" && count > eligibleCount) setCount(eligibleCount >= 10 ? 10 : "all");
  }, [count, eligibleCount]);

  async function updateYears(nextFrom: number, nextTo: number) {
    const safeFrom = Math.min(nextFrom, nextTo);
    const safeTo = Math.max(nextFrom, nextTo);
    setYearFrom(safeFrom);
    setYearTo(safeTo);
    setLoading(true);
    const response = await fetch(`/api/pyqs/inventory?exam=${inventory.exam}&yearFrom=${safeFrom}&yearTo=${safeTo}`);
    if (response.ok) {
      const next = await response.json() as ArchiveInventory;
      setInventory(next);
      setSelected((current) => current.filter((id) => next.nodes.some((node) => node.id === id)));
    }
    setLoading(false);
  }

  function toggleNode(nodeId: string) {
    const ids = descendants(nodeId, inventory);
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return [...next];
    });
  }

  async function startPractice() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/practice-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: inventory.exam, yearFrom, yearTo, taxonomyIds: selected, count, order }),
      });
      const body = await response.json() as PracticeSnapshot & { error?: string };
      if (!response.ok) throw new Error(body.error || "The practice session could not be created.");
      await createLocalAttempt(body);
      router.push(`/practice/${body.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The practice session could not be created.");
      setLoading(false);
    }
  }

  const selectedNames = inventory.nodes.filter((node) => selection.has(node.id)).map((node) => node.label);

  return (
    <main className="pyq-page archive-workspace">
      <div className="archive-heading">
        <div>
          <Link className="back-link" href="/">← All examinations</Link>
          <p className="pyq-kicker">Build a practice session</p>
          <h1>{inventory.exam} PYQs</h1>
          <p>Select any subject, topic or subtopic. Flow width equals the number of available questions.</p>
        </div>
        <div className="exam-switcher" aria-label="Choose examination">
          {EXAMS.map((exam) => <Link className={exam === inventory.exam ? "active" : ""} href={`/exams/${exam}`} key={exam}>{exam}</Link>)}
        </div>
      </div>

      <section className="archive-controls" aria-label="Question range">
        <label>From year<select value={yearFrom} onChange={(event) => void updateYears(Number(event.target.value), yearTo)}>{inventory.years.map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
        <label>To year<select value={yearTo} onChange={(event) => void updateYears(yearFrom, Number(event.target.value))}>{inventory.years.map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
        <span className="inventory-total"><strong>{inventory.totalCount}</strong> official PYQs</span>
        {inventory.unmappedCount > 0 && <span className="inventory-note">{inventory.unmappedCount} unclassified questions remain available when no path is selected.</span>}
      </section>

      <div className={`sankey-progress ${loading ? "loading" : ""}`} aria-hidden="true" />
      <section className="sankey-region" aria-label="Subject, topic and subtopic question flow">
        <div className="sankey-scroll">
          <div className="sankey-column-labels"><span>Subject</span><span>Topic</span><span>Subtopic</span></div>
          {!mounted ? <div className="sankey-client-loading" style={{ height }} aria-hidden="true" /> : <svg className="sankey-chart" viewBox={`0 0 1100 ${height}`} width="1100" height={height} role="img" aria-labelledby="sankey-title sankey-desc">
            <title id="sankey-title">{`${inventory.exam} PYQ subject flow`}</title>
            <desc id="sankey-desc">Interactive flow from subjects to topics and subtopics. Wider links contain more questions.</desc>
            <g className="sankey-links">
              {graph.links.map((link) => {
                const source = link.source as ChartNode;
                const target = link.target as ChartNode;
                const active = nodeIsActive(target.id, selection, inventory);
                const path = sankeyLinkHorizontal<InventoryNode, ChartLink>()(link as LayoutLink) || "";
                return <motion.path key={`${source.id}-${target.id}`} d={path} animate={{ opacity: active ? .34 : .055 }} transition={{ duration: .18 }} strokeWidth={Math.max(1, link.width || 1)} onClick={() => toggleNode(target.id)} role="button" tabIndex={0} aria-label={`${source.label} to ${target.label}: ${link.questionCount} questions`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") toggleNode(target.id); }} />;
              })}
            </g>
            <g className="sankey-nodes">
              {graph.nodes.map((node) => {
                const active = nodeIsActive(node.id, selection, inventory);
                const leafIds = descendants(node.id, inventory);
                const selectedCount = leafIds.filter((id) => selection.has(id)).length;
                const state = selectedCount === 0 ? "not selected" : selectedCount === leafIds.length ? "selected" : "partly selected";
                const x0 = node.x0 || 0; const x1 = node.x1 || 0; const y0 = node.y0 || 0; const y1 = node.y1 || 0;
                const labelX = node.kind === "subtopic" ? x0 - 8 : x1 + 8;
                const anchor = node.kind === "subtopic" ? "end" : "start";
                return (
                  <motion.g key={node.id} animate={{ opacity: active ? 1 : .24 }} transition={{ duration: .18 }} role="button" tabIndex={0} aria-label={`${node.label}, ${node.questionCount} questions, ${state}`} onClick={() => toggleNode(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") toggleNode(node.id); }}>
                    <rect x={x0} y={y0} width={Math.max(2, x1 - x0)} height={Math.max(2, y1 - y0)} rx="2" />
                    <text x={labelX} y={(y0 + y1) / 2} dy=".34em" textAnchor={anchor}>{node.label}<tspan dx="5">{node.questionCount}</tspan></text>
                  </motion.g>
                );
              })}
            </g>
          </svg>}
        </div>

        <details className="sankey-list">
          <summary>Use accessible list selection</summary>
          <div className="sankey-list-grid">
            {inventory.nodes.filter((node) => node.kind === "subject").map((subject) => (
              <fieldset key={subject.id}>
                <legend>{subject.label}</legend>
                {inventory.nodes.filter((topic) => topic.parentId === subject.id).map((topic) => (
                  <div className="tree-topic" key={topic.id}>
                    <label><input type="checkbox" checked={descendants(topic.id, inventory).every((id) => selection.has(id))} onChange={() => toggleNode(topic.id)} /> {topic.label} <span>{topic.questionCount}</span></label>
                    <div>{inventory.nodes.filter((node) => node.parentId === topic.id).map((subtopic) => <label key={subtopic.id}><input type="checkbox" checked={selection.has(subtopic.id)} onChange={() => toggleNode(subtopic.id)} /> {subtopic.label} <span>{subtopic.questionCount}</span></label>)}</div>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
        </details>
      </section>

      <motion.section layout className="selection-dock" aria-label="Practice selection">
        <div className="selection-summary">
          <span>{selected.length ? `${selected.length} subtopic${selected.length === 1 ? "" : "s"}` : "All available paths"}</span>
          <strong>{eligibleCount} questions</strong>
          <small>{selectedNames.length ? `${selectedNames.slice(0, 3).join(", ")}${selectedNames.length > 3 ? ` +${selectedNames.length - 3}` : ""}` : `${yearFrom}–${yearTo}`}</small>
        </div>
        <div className="selection-options">
          <div><span>Questions</span><div className="segmented">{COUNTS.map((value) => <button key={value} disabled={value > eligibleCount} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}<button className={count === "all" ? "active" : ""} onClick={() => setCount("all")}>All</button></div></div>
          <label>Order<select value={order} onChange={(event) => setOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle</option></select></label>
        </div>
        <button className="start-practice" disabled={loading || eligibleCount === 0} onClick={() => void startPractice()}>{loading ? "Preparing…" : "Start practice →"}</button>
        <AnimatePresence>{error && <motion.p className="inline-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>
      </motion.section>
    </main>
  );
}
