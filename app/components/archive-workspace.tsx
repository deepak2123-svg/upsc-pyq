"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sankey, type SankeyGraph, type SankeyLink, type SankeyNode } from "d3-sankey";
import { PYQ_EXAMS, type PracticeInventoryNode, type PyqExam, type SubjectPracticeInventory } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticePathSelection, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";

type SubjectMode = "all" | "custom";
type FlowNode = {
  id: string;
  label: string;
  kind: "subject" | "head" | "topic" | "subtopic";
  subjectId: string;
  questionCount: number;
  examCounts: Record<PyqExam, number>;
  parentId?: string;
};
type FlowLink = { source: string | ChartNode; target: string | ChartNode; value: number; questionCount: number; subjectId: string };
type ChartNode = FlowNode & SankeyNode<FlowNode, FlowLink>;
type LayoutLink = SankeyLink<FlowNode, FlowLink>;

const COUNTS = [10, 20, 30, 50] as const;
const SUBJECT_COLOURS = ["#2457d6", "#18794e", "#a15c00", "#6b4eff"];
const CHART_WIDTH = 800;
const FLOW_LEFT = 150;
const FLOW_MIDDLE = 345;
const FLOW_RIGHT = 540;

function subtopicsForSubject(subjectId: string, inventory: SubjectPracticeInventory) {
  return inventory.nodes.filter((node) => node.kind === "subtopic" && node.subjectId === subjectId);
}

function subtopicsForTopic(topicId: string, inventory: SubjectPracticeInventory) {
  return inventory.nodes.filter((node) => node.kind === "subtopic" && node.parentId === topicId);
}

function subtopicsForHead(headId: string, inventory: SubjectPracticeInventory) {
  const topicIds = new Set(inventory.nodes.filter((node) => node.kind === "topic" && node.parentId === headId).map((node) => node.id));
  return inventory.nodes.filter((node) => node.kind === "subtopic" && topicIds.has(node.parentId || ""));
}

function availableExams(node: PracticeInventoryNode, preferredExam?: PyqExam) {
  if (preferredExam && node.examCounts[preferredExam] > 0) return [preferredExam];
  return PYQ_EXAMS.filter((exam) => node.examCounts[exam] > 0);
}

function countForExams(node: { examCounts: Record<PyqExam, number> }, exams: PyqExam[] = []) {
  return exams.reduce((total, exam) => total + node.examCounts[exam], 0);
}

function linesFor(label: string, maxLength: number) {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length > 2 ? [lines[0], `${lines.slice(1).join(" ").slice(0, maxLength - 1)}…`] : lines;
}

function flowPath(link: LayoutLink) {
  const source = link.source as ChartNode;
  const target = link.target as ChartNode;
  const x0 = source.x1 || 0;
  const x1 = target.x0 || 0;
  const y0 = link.y0 || 0;
  const y1 = link.y1 || 0;
  const middle = (x0 + x1) / 2;
  return `M${x0},${y0}C${middle},${y0} ${middle},${y1} ${x1},${y1}`;
}

function buildFlow(inventory: SubjectPracticeInventory, selectedSubjects: Set<string>, pathExams: Record<string, PyqExam[]>, focusedHeadId?: string, focusedTopicId?: string) {
  const focusedHead = focusedHeadId ? inventory.nodes.find((node) => node.id === focusedHeadId && node.kind === "head") : undefined;
  const focusedTopic = focusedTopicId ? inventory.nodes.find((node) => node.id === focusedTopicId && node.kind === "topic") : undefined;
  const relatedHead = focusedTopic ? inventory.nodes.find((node) => node.id === focusedTopic.parentId && node.kind === "head") : undefined;
  const heads = focusedHead ? [focusedHead] : focusedTopic && relatedHead ? [relatedHead] : inventory.nodes.filter((node) => node.kind === "head" && selectedSubjects.has(node.subjectId));
  const topics = focusedTopic ? [focusedTopic] : focusedHead ? inventory.nodes.filter((node) => node.kind === "topic" && node.parentId === focusedHead.id) : [];
  const subtopics = focusedTopic ? subtopicsForTopic(focusedTopic.id, inventory) : [];
  const subjects: FlowNode[] = focusedTopic ? [] : inventory.subjects.filter((subject) => (focusedHead ? subject.id === focusedHead.subjectId : selectedSubjects.has(subject.id))).map((subject) => ({ ...subject, kind: "subject", subjectId: subject.id }));
  const nodes: FlowNode[] = [...subjects, ...heads, ...topics, ...subtopics];
  const height = focusedTopic ? Math.max(540, subtopics.length * 46 + 110) : focusedHead ? Math.max(500, topics.length * 40 + 100) : Math.max(430, heads.length * 80 + 100);
  if (!nodes.length) return { graph: { nodes: [], links: [] } as SankeyGraph<FlowNode, FlowLink>, height };
  const selectedNodeIds = new Set(nodes.map((node) => node.id));
  const links: FlowLink[] = inventory.links.filter((link) => selectedNodeIds.has(link.source) && selectedNodeIds.has(link.target)).map((link) => {
    const target = inventory.nodes.find((node) => node.id === link.target);
    const descendants = target?.kind === "subtopic" ? [target] : target?.kind === "topic" ? subtopicsForTopic(target.id, inventory) : target?.kind === "head" ? subtopicsForHead(target.id, inventory) : [];
    const selected = descendants.reduce((total, node) => total + countForExams(node, pathExams[node.id]), 0);
    return { source: link.source, target: link.target, value: Math.max(1, selected), questionCount: selected, subjectId: link.subjectId };
  });
  const generator = sankey<FlowNode, FlowLink>().nodeId((node) => node.id).nodeWidth(14).nodePadding(focusedTopic ? 16 : 18).extent([[FLOW_LEFT, 46], [FLOW_RIGHT, height - 34]]).iterations(48);
  return { graph: generator({ nodes: nodes.map((node) => ({ ...node })), links }), height };
}

export function ArchiveWorkspace({ initialInventory, initialExam }: { initialInventory: SubjectPracticeInventory; initialExam?: PyqExam }) {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectModes, setSubjectModes] = useState<Record<string, SubjectMode>>({});
  const [pathExams, setPathExams] = useState<Record<string, PyqExam[]>>({});
  const [focusedHead, setFocusedHead] = useState<string>();
  const [focusedTopic, setFocusedTopic] = useState<string>();
  const [focusedSubtopic, setFocusedSubtopic] = useState<string>();
  const [count, setCount] = useState<number | "all">(20);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubjectSet = useMemo(() => new Set(selectedSubjects), [selectedSubjects]);
  const selectedSubtopicSet = useMemo(() => new Set(Object.keys(pathExams)), [pathExams]);
  const nodeById = useMemo(() => new Map(initialInventory.nodes.map((node) => [node.id, node])), [initialInventory]);
  const { graph, height } = useMemo(() => buildFlow(initialInventory, selectedSubjectSet, pathExams, focusedHead, focusedTopic), [initialInventory, selectedSubjectSet, pathExams, focusedHead, focusedTopic]);
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
    if (!selectedSubjectSet.has(subjectId)) return selectAllSubtopics(subjectId);
    setSelectedSubjects((current) => current.filter((id) => id !== subjectId));
    setSubjectModes((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== subjectId)));
    setPathExams((current) => removeSubjectPaths(subjectId, current));
    if (focusedNode?.subjectId === subjectId) setFocusedSubtopic(undefined);
    if (nodeById.get(focusedHead || "")?.subjectId === subjectId) setFocusedHead(undefined);
    if (nodeById.get(focusedTopic || "")?.subjectId === subjectId) setFocusedTopic(undefined);
  }

  function removeSubtopic(subtopicId: string) {
    const node = nodeById.get(subtopicId);
    if (!node) return;
    const next = { ...pathExams };
    delete next[subtopicId];
    setPathExams(next);
    if (!Object.keys(next).some((id) => nodeById.get(id)?.subjectId === node.subjectId)) {
      setSelectedSubjects((subjects) => subjects.filter((id) => id !== node.subjectId));
      setSubjectModes((modes) => Object.fromEntries(Object.entries(modes).filter(([id]) => id !== node.subjectId)));
    }
    if (focusedSubtopic === subtopicId) setFocusedSubtopic(undefined);
  }

  function selectSubtopic(subtopicId: string) {
    const node = nodeById.get(subtopicId);
    if (!node) return;
    setFocusedSubtopic(subtopicId);
    setError("");
    if (selectedSubtopicSet.has(subtopicId)) return;
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
    setPathExams((current) => ({ ...current, [node.id]: availableExams(node, initialExam) }));
  }

  function focusHead(headId: string) {
    const head = nodeById.get(headId);
    if (!head) return;
    setFocusedHead(headId);
    setFocusedTopic(undefined);
    setFocusedSubtopic(undefined);
  }

  function focusTopic(topicId: string) {
    const topic = nodeById.get(topicId);
    if (!topic) return;
    setFocusedTopic(topicId);
    setFocusedHead(topic.parentId);
    setFocusedSubtopic(undefined);
  }

  function toggleExam(exam: PyqExam) {
    if (!focusedNode || focusedNode.kind !== "subtopic" || focusedNode.examCounts[exam] === 0) return;
    const current = pathExams[focusedNode.id] || [];
    if (current.includes(exam)) {
      const next = current.filter((value) => value !== exam);
      if (!next.length) removeSubtopic(focusedNode.id);
      else setPathExams((paths) => ({ ...paths, [focusedNode.id]: next }));
    } else setPathExams((paths) => ({ ...paths, [focusedNode.id]: PYQ_EXAMS.filter((value) => value === exam || current.includes(value)) }));
  }

  async function startPractice() {
    setLoading(true);
    setError("");
    const paths: PracticePathSelection[] = Object.entries(pathExams).map(([subtopicId, exams]) => ({ subtopicId, exams }));
    try {
      const response = await fetch("/api/practice-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: 2, subjectIds: selectedSubjects, paths, count, order }) });
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

  return <main className="pyq-page archive-workspace">
    <header className="archive-heading subject-first-heading">
      <div>{initialExam ? <Link className="back-link" href="/">← Subject practice</Link> : <p className="pyq-kicker">Official previous-year questions</p>}<h1>Choose subjects.</h1><p>{initialExam ? `${initialExam} is preselected as the source where available. You can add other exams for any subtopic.` : "Combine subjects and choose exactly which exam sources you want for every subtopic."}</p></div>
      <span className="inventory-total"><strong>{initialInventory.mappedCount.toLocaleString("en-IN")}</strong> classified PYQs</span>
    </header>

    <section className="subject-selector" aria-labelledby="subject-title">
      <div><span>1</span><div><h2 id="subject-title">Subjects</h2><p>Select one or more. Every subtopic is included initially.</p></div></div>
      <div className="subject-buttons">{initialInventory.subjects.map((subject) => <button key={subject.id} aria-pressed={selectedSubjectSet.has(subject.id)} className={selectedSubjectSet.has(subject.id) ? "active" : ""} onClick={() => toggleSubject(subject.id)}><strong>{subject.label}</strong><span>{subject.questionCount} PYQs</span></button>)}</div>
    </section>

    <div className="practice-builder-layout">
      <section className="flow-map" aria-labelledby="flow-title">
        <div className="outline-heading"><div><span className="selector-label">2 · Refine</span><h2 id="flow-title">{focusedTopic ? `${nodeById.get(focusedTopic)?.label} → Subtopics` : focusedHead ? `${nodeById.get(focusedHead)?.label} → Topics` : "Subject → Sections"}</h2>{focusedHead || focusedTopic ? <button className="flow-back" onClick={() => { if (focusedTopic) setFocusedTopic(undefined); else setFocusedHead(undefined); setFocusedSubtopic(undefined); }}>← {focusedTopic ? "Topics" : "All sections"}</button> : null}</div>{initialInventory.unmappedCount > 0 ? <small>{initialInventory.unmappedCount} unclassified PYQs remain in exam archives.</small> : null}</div>
        {!selectedSubjects.length ? <div className="outline-empty"><strong>No subject selected</strong><span>Choose one or more subjects above to see the question flow.</span></div> : <div className="flow-scroll"><svg className="flow-chart" viewBox={`0 0 ${CHART_WIDTH} ${height}`} width={CHART_WIDTH} height={height} role="img" aria-labelledby="flow-title flow-description">
          <desc id="flow-description">Question flow through sections, topics and subtopics. Wider links represent more included PYQs.</desc>
          {focusedTopic ? <><text className="flow-column-label" x={FLOW_LEFT} y="20">SECTION</text><text className="flow-column-label" x={FLOW_MIDDLE} y="20">TOPIC</text><text className="flow-column-label" x={FLOW_RIGHT} y="20">SUBTOPIC</text></> : focusedHead ? <><text className="flow-column-label" x={FLOW_LEFT} y="20">SUBJECT</text><text className="flow-column-label" x={FLOW_MIDDLE} y="20">SECTION</text><text className="flow-column-label" x={FLOW_RIGHT} y="20">TOPIC</text></> : <><text className="flow-column-label" x={FLOW_LEFT} y="20">SUBJECT</text><text className="flow-column-label" x={FLOW_RIGHT} y="20">SECTION</text></>}
          <g className="flow-links">{graph.links.map((link) => {
            const target = link.target as ChartNode;
            const subjectIndex = initialInventory.subjects.findIndex((subject) => subject.id === target.subjectId);
            const active = target.kind === "subtopic" ? selectedSubtopicSet.has(target.id) : link.questionCount > 0;
            return <path key={`${(link.source as ChartNode).id}-${target.id}`} d={flowPath(link as LayoutLink)} stroke={SUBJECT_COLOURS[subjectIndex % SUBJECT_COLOURS.length]} strokeWidth={Math.max(1, link.width || 1)} opacity={active ? .28 : .06} />;
          })}</g>
          <g className="flow-nodes">{graph.nodes.map((node) => {
            const descendants = node.kind === "head" ? subtopicsForHead(node.id, initialInventory) : node.kind === "topic" ? subtopicsForTopic(node.id, initialInventory) : [];
            const active = node.kind === "subject" ? selectedSubjectSet.has(node.id) : node.kind === "head" || node.kind === "topic" ? descendants.some((child) => selectedSubtopicSet.has(child.id)) : selectedSubtopicSet.has(node.id);
            const subjectIndex = initialInventory.subjects.findIndex((subject) => subject.id === node.subjectId);
            const colour = SUBJECT_COLOURS[subjectIndex % SUBJECT_COLOURS.length];
            const x0 = node.x0 || 0; const x1 = node.x1 || 0; const y0 = node.y0 || 0; const y1 = node.y1 || 0;
            const lines = linesFor(node.label, node.kind === "subtopic" ? 29 : 24);
            const labelX = node.kind === "subtopic" ? x1 + 8 : x0 - 9;
            const anchor = node.kind === "subtopic" ? "start" : "end";
            const action = () => node.kind === "subject" ? toggleSubject(node.id) : node.kind === "head" ? focusHead(node.id) : node.kind === "topic" ? focusTopic(node.id) : selectSubtopic(node.id);
            const hitboxX = node.kind === "subtopic" ? x0 : x0 - 235;
            const hitboxWidth = node.kind === "subtopic" ? 270 : 250;
            return <g key={node.id} className={active ? "active" : "inactive"} role="button" tabIndex={0} aria-label={`${node.label}, ${node.questionCount} PYQs`} onClick={action} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action(); } }}><title>{node.label} · {node.questionCount} PYQs</title><rect className="flow-hitbox" x={hitboxX} y={(y0 + y1) / 2 - 18} width={hitboxWidth} height="36" rx="3" /><rect x={x0} y={y0} width={Math.max(2, x1 - x0)} height={Math.max(3, y1 - y0)} rx="2" fill={colour} stroke={node.id === focusedSubtopic ? "#171a1f" : "none"} strokeWidth="2" /><text className="flow-node-label" x={labelX} y={(y0 + y1) / 2 - (lines.length - 1) * 6} textAnchor={anchor}>{lines.map((line, index) => <tspan key={line} x={labelX} dy={index ? 12 : 0}>{line}</tspan>)}<tspan className="flow-count" x={labelX} dy="12">{node.questionCount}</tspan></text></g>;
          })}</g>
        </svg></div>}
      </section>

      <aside className="selection-dock" aria-label="Practice selection">
        {focusedNode && focusedNode.kind === "subtopic" && selectedSubtopicSet.has(focusedNode.id) ? <section className="flow-inspector"><span className="selector-label">Focused subtopic</span><h3>{focusedNode.label}</h3><strong>{focusedNode.questionCount} total PYQs</strong><div className="exam-source-list">{PYQ_EXAMS.map((exam) => { const available = focusedNode.examCounts[exam]; const enabled = pathExams[focusedNode.id]?.includes(exam) || false; return <button key={exam} disabled={available === 0} aria-pressed={enabled} className={enabled ? "active" : ""} onClick={() => toggleExam(exam)}><span>{exam}</span><strong>{available}</strong></button>; })}</div><button className="text-button remove-subtopic" onClick={() => removeSubtopic(focusedNode.id)}>Remove subtopic</button></section> : null}
        <div className="selection-summary"><span>{selectedSubjects.length ? `${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} · ${selectedLabels.length} subtopics` : "No subjects selected"}</span><strong>{eligibleCount} questions</strong><small>{selectedLabels.length ? `${selectedLabels.slice(0, 3).join(", ")}${selectedLabels.length > 3 ? ` +${selectedLabels.length - 3}` : ""}` : "Choose subjects to begin"}</small></div>
        <div className="selection-options"><div><span>Questions</span><div className="segmented">{COUNTS.map((value) => <button key={value} disabled={value > eligibleCount} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}<button disabled={eligibleCount === 0} className={count === "all" ? "active" : ""} onClick={() => setCount("all")}>All</button></div></div><label>Order<select value={order} onChange={(event) => setOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle</option></select></label></div>
        <button className="start-practice" disabled={loading || eligibleCount === 0} onClick={() => void startPractice()}>{loading ? "Preparing…" : "Start practice →"}</button>
        {error ? <p className="inline-error">{error}</p> : null}
      </aside>
    </div>
  </main>;
}
