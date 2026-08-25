"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PYQ_EXAMS, type PracticeInventoryNode, type PyqExam, type SubjectPracticeInventory } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticePathSelection, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";

type SubjectMode = "all" | "custom";
const COUNTS = [10, 20, 30, 50] as const;

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

function countForExams(node: { examCounts: Record<PyqExam, number> }, exams: PyqExam[] = []) {
  return exams.reduce((total, exam) => total + node.examCounts[exam], 0);
}

export function ArchiveWorkspace({ initialInventory, initialExam }: { initialInventory: SubjectPracticeInventory; initialExam?: PyqExam }) {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectModes, setSubjectModes] = useState<Record<string, SubjectMode>>({});
  const [pathExams, setPathExams] = useState<Record<string, PyqExam[]>>({});
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [count, setCount] = useState<number | "all">(20);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubjectSet = useMemo(() => new Set(selectedSubjects), [selectedSubjects]);
  const selectedSubtopicSet = useMemo(() => new Set(Object.keys(pathExams)), [pathExams]);
  const nodeById = useMemo(() => new Map(initialInventory.nodes.map((node) => [node.id, node])), [initialInventory]);
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
  }

  function toggleSubtopic(subtopicId: string) {
    const node = nodeById.get(subtopicId);
    if (!node) return;
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
    } else {
      setSelectedSubjects((current) => current.filter((id) => id !== topic.subjectId));
      setSubjectModes((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== topic.subjectId)));
    }
  }

  function toggleExam(subtopicId: string, exam: PyqExam) {
    const node = nodeById.get(subtopicId);
    if (!node || node.kind !== "subtopic" || node.examCounts[exam] === 0) return;
    const current = pathExams[node.id] || [];
    if (current.includes(exam)) {
      const next = current.filter((value) => value !== exam);
      if (!next.length) removeSubtopic(node.id);
      else setPathExams((paths) => ({ ...paths, [node.id]: next }));
    } else {
      setPathExams((paths) => ({ ...paths, [node.id]: PYQ_EXAMS.filter((value) => value === exam || current.includes(value)) }));
    }
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
    <section className="practice-outline" aria-labelledby="refine-title">
      <div className="outline-heading"><div><span className="selector-label">2 · Refine</span><h2 id="refine-title">Topics and subtopics</h2></div>{initialInventory.unmappedCount > 0 ? <small>{initialInventory.unmappedCount} unclassified PYQs remain in exam archives.</small> : null}</div>
      {!selectedSubjects.length ? <div className="outline-empty"><strong>No subject selected</strong><span>Choose one or more subjects above to begin.</span></div> : selectedSubjects.map((subjectId) => {
        const subject = initialInventory.subjects.find((item) => item.id === subjectId);
        const topics = initialInventory.nodes.filter((node) => node.kind === "topic" && node.subjectId === subjectId);
        const selectedCount = Object.keys(pathExams).filter((id) => nodeById.get(id)?.subjectId === subjectId).length;
        const total = subtopicsForSubject(subjectId, initialInventory).length;
        return <section className="outline-subject" key={subjectId} aria-labelledby={`subject-${subjectId}`}>
          <div className="outline-subject-header"><div><h3 id={`subject-${subjectId}`}>{subject?.label}</h3><span>{subjectModes[subjectId] === "all" ? `All ${total} subtopics included` : `${selectedCount} of ${total} subtopics included`}</span></div><button className="text-button" onClick={() => selectAllSubtopics(subjectId)}>All subtopics</button></div>
          <div className="topic-list">{topics.map((topic) => {
            const children = subtopicsForTopic(topic.id, initialInventory);
            const selectedChildren = children.filter((node) => selectedSubtopicSet.has(node.id));
            const checked = selectedChildren.length === children.length;
            const mixed = selectedChildren.length > 0 && !checked;
            const isOpen = openTopics.includes(topic.id);
            const included = selectedChildren.reduce((total, node) => total + countForExams(node, pathExams[node.id]), 0);
            return <article className="outline-topic" key={topic.id}>
              <div className="outline-topic-row"><input id={`topic-${topic.id}`} type="checkbox" checked={checked} ref={(input) => { if (input) input.indeterminate = mixed; }} onChange={() => toggleTopic(topic.id)} aria-label={`Select all subtopics in ${topic.label}`} /><button className="topic-trigger" aria-expanded={isOpen} onClick={() => setOpenTopics((current) => current.includes(topic.id) ? current.filter((id) => id !== topic.id) : [...current, topic.id])}><span>{topic.label}</span><small>{included} PYQs</small></button><button className="disclosure" aria-label={`${isOpen ? "Collapse" : "Expand"} ${topic.label}`} aria-expanded={isOpen} onClick={() => setOpenTopics((current) => current.includes(topic.id) ? current.filter((id) => id !== topic.id) : [...current, topic.id])}>{isOpen ? "−" : "+"}</button></div>
              {isOpen ? <div className="subtopic-list">{children.map((node) => {
                const selected = selectedSubtopicSet.has(node.id);
                const included = countForExams(node, pathExams[node.id]);
                return <div className={`subtopic-row ${selected ? "selected" : ""}`} key={node.id}><label><input type="checkbox" checked={selected} onChange={() => toggleSubtopic(node.id)} /><span>{node.label}</span><small>{selected ? `${included} included` : `${node.questionCount} PYQs`}</small></label><div className="exam-toggles" aria-label={`${node.label} exam sources`}>{PYQ_EXAMS.map((exam) => {
                  const available = node.examCounts[exam];
                  const enabled = pathExams[node.id]?.includes(exam) || false;
                  return <button key={exam} type="button" disabled={!selected || available === 0} aria-pressed={enabled} className={enabled ? "active" : ""} onClick={() => toggleExam(node.id, exam)}>{exam} <span>{available}</span></button>;
                })}</div></div>;
              })}</div> : null}
            </article>;
          })}</div>
        </section>;
      })}
    </section>

    <aside className="selection-dock" aria-label="Practice selection">
      <div className="selection-summary"><span>{selectedSubjects.length ? `${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} · ${selectedLabels.length} subtopics` : "No subjects selected"}</span><strong>{eligibleCount} questions</strong><small>{selectedLabels.length ? `${selectedLabels.slice(0, 3).join(", ")}${selectedLabels.length > 3 ? ` +${selectedLabels.length - 3}` : ""}` : "Choose subjects to begin"}</small></div>
      <div className="selection-options"><div><span>Questions</span><div className="segmented">{COUNTS.map((value) => <button key={value} disabled={value > eligibleCount} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}<button disabled={eligibleCount === 0} className={count === "all" ? "active" : ""} onClick={() => setCount("all")}>All</button></div></div><label>Order<select value={order} onChange={(event) => setOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle</option></select></label></div>
      <button className="start-practice" disabled={loading || eligibleCount === 0} onClick={() => void startPractice()}>{loading ? "Preparing…" : "Start practice →"}</button>
      {error ? <p className="inline-error">{error}</p> : null}
    </aside>
    </div>
  </main>;
}
