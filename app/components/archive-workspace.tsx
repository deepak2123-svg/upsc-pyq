"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { sankey, sankeyLinkHorizontal, type SankeyGraph, type SankeyLink, type SankeyNode } from "d3-sankey";
import {
  PYQ_EXAMS,
  type PracticeInventoryLink,
  type PracticeInventoryNode,
  type PyqExam,
  type SubjectPracticeInventory,
} from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticePathSelection, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";

type ChartLink = PracticeInventoryLink & { source: string | ChartNode; target: string | ChartNode; value: number };
type ChartNode = PracticeInventoryNode & SankeyNode<PracticeInventoryNode, ChartLink>;
type LayoutLink = SankeyLink<PracticeInventoryNode, ChartLink>;
type SubjectMode = "all" | "custom";

const COUNTS = [10, 20, 30, 50] as const;
const SUBJECT_COLOURS = ["#2457d6", "#18794e", "#a15c00", "#6b4eff"];

function subtopicsForSubject(subjectId: string, inventory: SubjectPracticeInventory) {
  return inventory.nodes.filter((node) => node.kind === "subtopic" && node.subjectId === subjectId);
}

function subtopicsForTopic(topicId: string, inventory: SubjectPracticeInventory) {
  return inventory.nodes.filter((node) => node.kind === "subtopic" && node.parentId === topicId);
}

function availableExams(node: PracticeInventoryNode, preferredExam?: PyqExam) {
  if (preferredExam && node.examCounts[preferredExam] > 0) return [preferredExam];
  return PYQ_EXAMS.filter((exam) => node.examCounts[exam] > 0);
}

function countForExams(node: PracticeInventoryNode, exams: PyqExam[] = []) {
  return exams.reduce((total, exam) => total + node.examCounts[exam], 0);
}

function buildLayout(inventory: SubjectPracticeInventory, selectedSubjects: Set<string>, pathExams: Record<string, PyqExam[]>) {
  const visibleNodes = inventory.nodes.filter((node) => selectedSubjects.has(node.subjectId));
  const visibleLinks = inventory.links.filter((link) => selectedSubjects.has(link.subjectId));
  const subtopicCount = visibleNodes.filter((node) => node.kind === "subtopic").length;
  const height = Math.min(1180, Math.max(430, subtopicCount * 25 + 64));
  if (!visibleNodes.length) {
    return { graph: { nodes: [], links: [] } as SankeyGraph<PracticeInventoryNode, ChartLink>, height };
  }
  const nodeById = new Map(visibleNodes.map((node) => [node.id, node]));
  const links = visibleLinks.map((link) => {
    const target = nodeById.get(link.target);
    const selectedCount = target ? countForExams(target, pathExams[target.id]) : 0;
    return { ...link, value: Math.max(1, selectedCount), questionCount: selectedCount };
  });
  const generator = sankey<PracticeInventoryNode, ChartLink>()
    .nodeId((node) => node.id)
    .nodeWidth(10)
    .nodePadding(10)
    .extent([[170, 28], [670, height - 24]])
    .iterations(48);
  const graph = generator({ nodes: visibleNodes.map((node) => ({ ...node })), links });
  return { graph, height } as { graph: SankeyGraph<PracticeInventoryNode, ChartLink>; height: number };
}

export function ArchiveWorkspace({ initialInventory, initialExam }: { initialInventory: SubjectPracticeInventory; initialExam?: PyqExam }) {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectModes, setSubjectModes] = useState<Record<string, SubjectMode>>({});
  const [pathExams, setPathExams] = useState<Record<string, PyqExam[]>>({});
  const [focusedSubtopic, setFocusedSubtopic] = useState<string>();
  const [count, setCount] = useState<number | "all">(20);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubjectSet = useMemo(() => new Set(selectedSubjects), [selectedSubjects]);
  const selectedSubtopicSet = useMemo(() => new Set(Object.keys(pathExams)), [pathExams]);
  const { graph, height } = useMemo(() => buildLayout(initialInventory, selectedSubjectSet, pathExams), [initialInventory, selectedSubjectSet, pathExams]);
  const nodeById = useMemo(() => new Map(initialInventory.nodes.map((node) => [node.id, node])), [initialInventory]);
  const focusedNode = focusedSubtopic ? nodeById.get(focusedSubtopic) : undefined;
  const eligibleCount = Object.entries(pathExams).reduce((total, [id, exams]) => {
    const node = nodeById.get(id);
    return total + (node ? countForExams(node, exams) : 0);
  }, 0);

  useEffect(() => {
    if (count !== "all" && count > eligibleCount) setCount(eligibleCount >= 10 ? 10 : "all");
  }, [count, eligibleCount]);

  function removeSubjectPaths(subjectId: string, current: Record<string, PyqExam[]>) {
    return Object.fromEntries(Object.entries(current).filter(([id]) => nodeById.get(id)?.subjectId !== subjectId));
  }

  function selectAllSubtopics(subjectId: string) {
    setSelectedSubjects((current) => current.includes(subjectId) ? current : [...current, subjectId]);
    setSubjectModes((current) => ({ ...current, [subjectId]: "all" }));
    setPathExams((current) => {
      const next = removeSubjectPaths(subjectId, current);
      subtopicsForSubject(subjectId, initialInventory).forEach((node) => { next[node.id] = availableExams(node, initialExam); });
      return next;
    });
    setError("");
  }

  function toggleSubject(subjectId: string) {
    if (!selectedSubjectSet.has(subjectId)) {
      selectAllSubtopics(subjectId);
      return;
    }
    setSelectedSubjects((current) => current.filter((id) => id !== subjectId));
    setSubjectModes((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== subjectId)));
    setPathExams((current) => removeSubjectPaths(subjectId, current));
    if (focusedNode?.subjectId === subjectId) setFocusedSubtopic(undefined);
  }

  function removeSubtopic(subtopicId: string) {
    const node = nodeById.get(subtopicId);
    if (!node) return;
    const next = { ...pathExams };
    delete next[subtopicId];
    setPathExams(next);
    const subjectStillSelected = Object.keys(next).some((id) => nodeById.get(id)?.subjectId === node.subjectId);
    if (!subjectStillSelected) {
      setSelectedSubjects((subjects) => subjects.filter((id) => id !== node.subjectId));
      setSubjectModes((modes) => Object.fromEntries(Object.entries(modes).filter(([id]) => id !== node.subjectId)));
    }
    if (focusedSubtopic === subtopicId) setFocusedSubtopic(undefined);
  }

  function toggleSubtopic(subtopicId: string) {
    const node = nodeById.get(subtopicId);
    if (!node) return;
    setFocusedSubtopic(subtopicId);
    setError("");
    if (!selectedSubjectSet.has(node.subjectId)) {
      setSelectedSubjects((current) => [...current, node.subjectId]);
      setSubjectModes((current) => ({ ...current, [node.subjectId]: "custom" }));
      setPathExams((current) => ({ ...current, [node.id]: availableExams(node, initialExam) }));
      return;
    }
    if (subjectModes[node.subjectId] === "all") {
      setSubjectModes((current) => ({ ...current, [node.subjectId]: "custom" }));
      setPathExams((current) => ({ ...removeSubjectPaths(node.subjectId, current), [node.id]: current[node.id] || availableExams(node, initialExam) }));
      return;
    }
    if (selectedSubtopicSet.has(node.id)) removeSubtopic(node.id);
    else setPathExams((current) => ({ ...current, [node.id]: availableExams(node, initialExam) }));
  }

  function toggleTopic(topicId: string) {
    const topic = nodeById.get(topicId);
    if (!topic) return;
    const children = subtopicsForTopic(topicId, initialInventory);
    const allSelected = children.every((node) => selectedSubtopicSet.has(node.id));
    const narrowingFromAll = subjectModes[topic.subjectId] === "all";
    const removingTopic = !narrowingFromAll && allSelected;
    const next = narrowingFromAll ? removeSubjectPaths(topic.subjectId, pathExams) : { ...pathExams };
    children.forEach((node) => {
      if (removingTopic) delete next[node.id];
      else next[node.id] = pathExams[node.id] || availableExams(node, initialExam);
    });
    const subjectStillSelected = Object.keys(next).some((id) => nodeById.get(id)?.subjectId === topic.subjectId);
    setPathExams(next);
    if (subjectStillSelected) {
      setSubjectModes((current) => ({ ...current, [topic.subjectId]: "custom" }));
      setSelectedSubjects((current) => current.includes(topic.subjectId) ? current : [...current, topic.subjectId]);
      setFocusedSubtopic(children.find((node) => next[node.id])?.id);
    } else {
      setSelectedSubjects((current) => current.filter((id) => id !== topic.subjectId));
      setSubjectModes((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== topic.subjectId)));
      setFocusedSubtopic(undefined);
    }
  }

  function toggleExam(exam: PyqExam) {
    if (!focusedNode || focusedNode.kind !== "subtopic" || focusedNode.examCounts[exam] === 0) return;
    const current = pathExams[focusedNode.id] || [];
    if (current.includes(exam)) {
      const next = current.filter((value) => value !== exam);
      if (!next.length) removeSubtopic(focusedNode.id);
      else setPathExams((paths) => ({ ...paths, [focusedNode.id]: next }));
    } else {
      setPathExams((paths) => ({ ...paths, [focusedNode.id]: PYQ_EXAMS.filter((value) => value === exam || current.includes(value)) }));
    }
  }

  async function startPractice() {
    setLoading(true);
    setError("");
    const paths: PracticePathSelection[] = Object.entries(pathExams).map(([subtopicId, exams]) => ({ subtopicId, exams }));
    try {
      const response = await fetch("/api/practice-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 2, subjectIds: selectedSubjects, paths, count, order }),
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

  const selectedLabels = Object.keys(pathExams).map((id) => nodeById.get(id)?.label).filter(Boolean) as string[];
  const focusedTotal = focusedNode ? countForExams(focusedNode, pathExams[focusedNode.id]) : 0;

  return (
    <main className="pyq-page archive-workspace">
      <header className="archive-heading subject-first-heading">
        <div>
          {initialExam ? <Link className="back-link" href="/">← Subject practice</Link> : <p className="pyq-kicker">Official previous-year questions</p>}
          <h1>Choose subjects.</h1>
          <p>{initialExam ? `${initialExam} is preselected as the source where available. You can add other exams for any subtopic.` : "Combine subjects and choose exactly which exam sources you want for every subtopic."}</p>
        </div>
        <span className="inventory-total"><strong>{initialInventory.mappedCount.toLocaleString("en-IN")}</strong> classified PYQs</span>
      </header>

      <section className="subject-selector" aria-labelledby="subject-title">
        <div><span>1</span><div><h2 id="subject-title">Subjects</h2><p>Select one or more. Every subtopic is included initially.</p></div></div>
        <div className="subject-buttons">
          {initialInventory.subjects.map((subject) => <button key={subject.id} aria-pressed={selectedSubjectSet.has(subject.id)} className={selectedSubjectSet.has(subject.id) ? "active" : ""} onClick={() => toggleSubject(subject.id)}><strong>{subject.label}</strong><span>{subject.questionCount} PYQs</span></button>)}
        </div>
      </section>

      <div className="selector-layout">
        <aside className="selected-subjects" aria-label="Selected subject scope">
          <span className="selector-label">Selected subjects</span>
          {selectedSubjects.length ? selectedSubjects.map((subjectId) => {
            const subject = initialInventory.subjects.find((item) => item.id === subjectId);
            const selectedCount = Object.keys(pathExams).filter((id) => nodeById.get(id)?.subjectId === subjectId).length;
            const total = subtopicsForSubject(subjectId, initialInventory).length;
            return <div key={subjectId}><strong>{subject?.label}</strong><small>{subjectModes[subjectId] === "all" ? `All ${total} subtopics` : `${selectedCount} of ${total} subtopics`}</small><button onClick={() => selectAllSubtopics(subjectId)}>All subtopics</button></div>;
          }) : <p>Select a subject to reveal its topic flow.</p>}
          {initialInventory.unmappedCount > 0 ? <small className="unmapped-note">{initialInventory.unmappedCount} unclassified PYQs remain in the exam archives.</small> : null}
        </aside>

        <section className="subject-sankey" aria-label="Topic and subtopic question flow">
          <div className="sankey-section-heading"><div><span className="selector-label">2 · Refine</span><h2>Topic → Subtopic</h2></div><small>Flow width follows the selected exam sources.</small></div>
          {!selectedSubjects.length ? <div className="empty-sankey"><strong>No subject selected</strong><span>Choose a subject above to see its topics and subtopics.</span></div> : <>
            <div className="sankey-scroll">
              <div className="sankey-column-labels two-columns"><span>Topic</span><span>Subtopic</span></div>
              <svg className="sankey-chart subject-flow-chart" viewBox={`0 0 840 ${height}`} width="840" height={height} role="img" aria-labelledby="sankey-title sankey-desc">
                <title id="sankey-title">Selected PYQ topic and subtopic flow</title>
                <desc id="sankey-desc">Interactive flow from topics to subtopics. Wider links contain more currently eligible questions.</desc>
                <g className="sankey-links">{graph.links.map((link) => {
                  const source = link.source as ChartNode; const target = link.target as ChartNode;
                  const active = selectedSubtopicSet.has(target.id);
                  const path = sankeyLinkHorizontal<PracticeInventoryNode, ChartLink>()(link as LayoutLink) || "";
                  const subjectIndex = initialInventory.subjects.findIndex((subject) => subject.id === target.subjectId);
                  return <motion.path key={`${source.id}-${target.id}`} d={path} animate={{ opacity: active ? .36 : .06 }} transition={{ duration: .18 }} stroke={SUBJECT_COLOURS[subjectIndex % SUBJECT_COLOURS.length]} strokeWidth={Math.max(1, link.width || 1)} onClick={() => toggleSubtopic(target.id)} role="button" tabIndex={0} aria-label={`${source.label} to ${target.label}: ${link.questionCount} selected questions`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleSubtopic(target.id); } }} />;
                })}</g>
                <g className="sankey-nodes">{graph.nodes.map((node) => {
                  const children = node.kind === "topic" ? subtopicsForTopic(node.id, initialInventory) : [];
                  const selectedChildren = children.filter((child) => selectedSubtopicSet.has(child.id)).length;
                  const active = node.kind === "subtopic" ? selectedSubtopicSet.has(node.id) : selectedChildren > 0;
                  const state = node.kind === "subtopic" ? (active ? "selected" : "not selected") : selectedChildren === 0 ? "not selected" : selectedChildren === children.length ? "selected" : "partly selected";
                  const x0 = node.x0 || 0; const x1 = node.x1 || 0; const y0 = node.y0 || 0; const y1 = node.y1 || 0;
                  const labelX = node.kind === "topic" ? x0 - 9 : x1 + 9;
                  const anchor = node.kind === "topic" ? "end" : "start";
                  const visibleCount = node.kind === "subtopic" ? countForExams(node, pathExams[node.id]) : children.reduce((total, child) => total + countForExams(child, pathExams[child.id]), 0);
                  const subjectIndex = initialInventory.subjects.findIndex((subject) => subject.id === node.subjectId);
                  const toggle = () => node.kind === "topic" ? toggleTopic(node.id) : toggleSubtopic(node.id);
                  return <motion.g key={node.id} animate={{ opacity: active ? 1 : .25 }} transition={{ duration: .18 }} role="button" tabIndex={0} aria-label={`${node.label}, ${visibleCount} selected questions, ${state}`} onClick={toggle} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }}><rect x={x0} y={y0} width={Math.max(2, x1 - x0)} height={Math.max(2, y1 - y0)} rx="2" fill={SUBJECT_COLOURS[subjectIndex % SUBJECT_COLOURS.length]} /><text x={labelX} y={(y0 + y1) / 2} dy=".34em" textAnchor={anchor}>{node.label}<tspan dx="5">{visibleCount}</tspan></text></motion.g>;
                })}</g>
              </svg>
            </div>

            <details className="sankey-list"><summary>Use accessible list selection</summary><div className="sankey-list-grid">{selectedSubjects.map((subjectId) => <fieldset key={subjectId}><legend>{initialInventory.subjects.find((subject) => subject.id === subjectId)?.label}</legend>{initialInventory.nodes.filter((node) => node.kind === "topic" && node.subjectId === subjectId).map((topic) => {
              const children = subtopicsForTopic(topic.id, initialInventory);
              const checked = children.every((node) => selectedSubtopicSet.has(node.id));
              const mixed = children.some((node) => selectedSubtopicSet.has(node.id)) && !checked;
              return <div className="tree-topic" key={topic.id}><label><input type="checkbox" checked={checked} ref={(input) => { if (input) input.indeterminate = mixed; }} onChange={() => toggleTopic(topic.id)} /> {topic.label}<span>{children.reduce((total, node) => total + countForExams(node, pathExams[node.id]), 0)}</span></label><div>{children.map((node) => <label key={node.id}><input type="checkbox" checked={selectedSubtopicSet.has(node.id)} onChange={() => toggleSubtopic(node.id)} /> {node.label}<span>{countForExams(node, pathExams[node.id])}</span></label>)}</div></div>;
            })}</fieldset>)}</div></details>
          </>}
        </section>

        <aside className="subtopic-inspector" aria-label="Focused subtopic exam sources">
          <span className="selector-label">3 · Exam sources</span>
          {focusedNode && focusedNode.kind === "subtopic" && selectedSubtopicSet.has(focusedNode.id) ? <AnimatePresence mode="wait"><motion.div key={focusedNode.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: .14 }}><small>{initialInventory.subjects.find((subject) => subject.id === focusedNode.subjectId)?.label}</small><h2>{focusedNode.label}</h2><strong className="focused-count">{focusedNode.questionCount} total PYQs</strong><p>{focusedTotal} currently included. Choose which exam sources contribute questions to this subtopic.</p><div className="exam-source-list">{PYQ_EXAMS.map((exam) => {
            const available = focusedNode.examCounts[exam];
            const enabled = pathExams[focusedNode.id]?.includes(exam) || false;
            return <button key={exam} disabled={available === 0} aria-pressed={enabled} className={enabled ? "active" : ""} onClick={() => toggleExam(exam)}><span>{exam}</span><strong>{available}</strong></button>;
          })}</div></motion.div></AnimatePresence> : <div className="inspector-empty"><strong>Focus a subtopic</strong><p>Select a subtopic in the flow to inspect its PYQ count and exam sources.</p></div>}
        </aside>
      </div>

      <motion.section layout className="selection-dock" aria-label="Practice selection">
        <div className="selection-summary"><span>{selectedSubjects.length ? `${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} · ${selectedLabels.length} subtopics` : "No subjects selected"}</span><strong>{eligibleCount} questions</strong><small>{selectedLabels.length ? `${selectedLabels.slice(0, 3).join(", ")}${selectedLabels.length > 3 ? ` +${selectedLabels.length - 3}` : ""}` : "Choose subjects to begin"}</small></div>
        <div className="selection-options"><div><span>Questions</span><div className="segmented">{COUNTS.map((value) => <button key={value} disabled={value > eligibleCount} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}<button disabled={eligibleCount === 0} className={count === "all" ? "active" : ""} onClick={() => setCount("all")}>All</button></div></div><label>Order<select value={order} onChange={(event) => setOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle</option></select></label></div>
        <button className="start-practice" disabled={loading || eligibleCount === 0} onClick={() => void startPractice()}>{loading ? "Preparing…" : "Start practice →"}</button>
        <AnimatePresence>{error ? <motion.p className="inline-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p> : null}</AnimatePresence>
      </motion.section>
    </main>
  );
}
