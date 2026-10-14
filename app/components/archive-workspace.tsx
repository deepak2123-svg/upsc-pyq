"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import type { SubjectPracticeInventory } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticeRecipeV3, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";
import { addScope, addedQuestionCount, ancestors, buildSelectionIndex, removeScope, replaceScope, sanitizePaths, scopeMetrics, selectedScopeIds, selectionCounts, setScopeExam, type SelectionIndex, type SelectionPaths } from "../../lib/practice-selection";
import { ScopeFlow } from "./scope-flow";

const COUNTS = [10, 20, 30, 50] as const;
const DURATIONS = [10, 20, 30, 60, 120] as const;
const format = (value: number) => value.toLocaleString("en-IN");

function SourceChoice({ exam, state, count, available, disabled, onChange }: { exam: PyqExam; state: "none" | "partial" | "all"; count: number; available: number; disabled: boolean; onChange: () => void }) {
  return <button type="button" role="checkbox" aria-checked={state === "partial" ? "mixed" : state === "all"} disabled={disabled} className={"scope-source " + state} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} onClick={onChange}>
    <span className="scope-check" aria-hidden="true">{state === "all" ? "✓" : state === "partial" ? "−" : ""}</span><span className="scope-source-name">{exam}</span><strong>{format(count)}<small>included</small></strong><small className="scope-source-available">{format(available)} available</small>
  </button>;
}

function AddScopeDialog({ index, paths, initialId, preferredExam, onAdd, onCancel }: { index: SelectionIndex; paths: SelectionPaths; initialId?: string; preferredExam?: PyqExam; onAdd: (id: string) => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const subjects = [...index.nodesById.values()].filter((node) => node.kind === "subject");
  const [candidateId, setCandidateId] = useState(initialId || subjects[0]?.id || "");
  const path = ancestors(candidateId, index);
  const subject = path[0];
  const section = path.find((node) => node.kind === "head");
  const topic = path.find((node) => node.kind === "topic");
  const leaf = path.find((node) => node.kind === "subtopic");
  const additional = addedQuestionCount(paths, candidateId, index, preferredExam);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const current = dialog.current;
    current?.showModal();
    return () => { current?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="scope-add-dialog" aria-labelledby="add-scope-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={(event) => { event.preventDefault(); if (additional > 0) onAdd(candidateId); }}>
      <span className="selector-label">Combine branches</span><h2 id="add-scope-title">Add to your current selection</h2>
      <label>Subject<select value={subject?.id || ""} onChange={(event) => setCandidateId(event.target.value)}>{subjects.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
      {subject ? <label>Section<select value={section?.id || subject.id} onChange={(event) => setCandidateId(event.target.value)}><option value={subject.id}>Entire subject</option>{(index.childrenById.get(subject.id) || []).map((node) => <option key={node.id} value={node.id}>{node.label} · {node.questionCount}</option>)}</select></label> : null}
      {section ? <label>Topic<select value={topic?.id || section.id} onChange={(event) => setCandidateId(event.target.value)}><option value={section.id}>Entire section</option>{(index.childrenById.get(section.id) || []).map((node) => <option key={node.id} value={node.id}>{node.label} · {node.questionCount}</option>)}</select></label> : null}
      {topic ? <label>Subtopic<select value={leaf?.id || topic.id} onChange={(event) => setCandidateId(event.target.value)}><option value={topic.id}>Entire topic</option>{(index.childrenById.get(topic.id) || []).map((node) => <option key={node.id} value={node.id}>{node.label} · {node.questionCount}</option>)}</select></label> : null}
      <div className="scope-add-preview"><strong>{index.nodesById.get(candidateId)?.label}</strong><span>{format(additional)} new questions</span>{!additional ? <small>Already included or unavailable.</small> : null}</div>
      <div className="scope-dialog-actions"><button type="button" className="scope-secondary" onClick={onCancel}>Cancel</button><button className="scope-primary" type="submit" disabled={additional === 0}>Add {format(additional)} questions</button></div>
    </form>
  </dialog>;
}

export function ArchiveWorkspace({ initialInventory, initialExam }: { initialInventory: SubjectPracticeInventory; initialExam?: PyqExam }) {
  const router = useRouter();
  const index = useMemo(() => buildSelectionIndex(initialInventory), [initialInventory]);
  const [paths, setPaths] = useState<SelectionPaths>({});
  const [focusId, setFocusId] = useState<string>();
  const [count, setCount] = useState<number | "all">(20);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [durationChoice, setDurationChoice] = useState("untimed");
  const [customMinutes, setCustomMinutes] = useState("30");
  const [sourceScopeId, setSourceScopeId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [draftWarning, setDraftWarning] = useState("");
  const focusHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const draftKey = "upsc-pyq-builder:v3:" + (initialExam || "all");

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.version === 3 && draft.inventoryVersion === initialInventory.version) {
          setPaths(sanitizePaths(draft.paths, index));
          if (typeof draft.focusId === "string" && index.nodesById.has(draft.focusId)) setFocusId(draft.focusId);
          if (draft.count === "all" || Number.isInteger(draft.count) && draft.count > 0 && draft.count <= 100) setCount(draft.count);
          if (draft.order === "newest" || draft.order === "shuffle") setOrder(draft.order);
          if (Number.isInteger(draft.durationMinutes) && draft.durationMinutes >= 1 && draft.durationMinutes <= 720) {
            const savedMinutes = String(draft.durationMinutes);
            setDurationChoice(DURATIONS.some((minutes) => minutes === draft.durationMinutes) ? savedMinutes : "custom");
            setCustomMinutes(savedMinutes);
          }
        }
      }
    } catch { setDraftWarning("Your builder settings could not be restored in this browser. You can still choose a new practice."); }
    setRestored(true);
  }, [draftKey, initialInventory.version, index]);
  useEffect(() => {
    if (!restored) return;
    const minutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
    try { window.sessionStorage.setItem(draftKey, JSON.stringify({ version: 3, inventoryVersion: initialInventory.version, paths, focusId, count, order, durationMinutes: Number.isInteger(minutes) && Number(minutes) >= 1 && Number(minutes) <= 720 ? minutes : null })); } catch { setDraftWarning("Your builder settings could not be saved. Returning to this page may reset them. Practice storage is checked before starting."); }
  }, [restored, draftKey, initialInventory.version, paths, focusId, count, order, durationChoice, customMinutes]);
  useEffect(() => {
    if (moveFocus.current) { focusHeading.current?.focus({ preventScroll: true }); moveFocus.current = false; }
  }, [focusId]);

  const totals = useMemo(() => selectionCounts(paths, index), [paths, index]);
  const selectedIds = useMemo(() => selectedScopeIds(paths, index), [paths, index]);
  const current = focusId ? index.nodesById.get(focusId) : undefined;
  const focusPath = current ? ancestors(current.id, index) : [];
  const metrics = current ? scopeMetrics(current.id, paths, index) : undefined;
  const activeSourceId = sourceScopeId !== "all" && index.nodesById.has(sourceScopeId) && scopeMetrics(sourceScopeId, paths, index).state !== "none" ? sourceScopeId : "all";
  const sourceLeaves = activeSourceId === "all" ? [...index.nodesById.values()].filter((node) => node.kind === "subtopic" && Object.hasOwn(paths, node.id)) : (index.leavesById.get(activeSourceId) || []).filter((node) => Object.hasOwn(paths, node.id));
  const sourceMetrics = Object.fromEntries(PYQ_EXAMS.map((exam) => {
    const eligible = sourceLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => paths[leaf.id]?.includes(exam));
    return [exam, { available: eligible.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), count: enabled.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), state: (enabled.length === 0 ? "none" : enabled.length === eligible.length ? "all" : "partial") as "none" | "partial" | "all" }];
  })) as Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  const sourceTargets = [...new Set([...selectedIds, ...(activeSourceId !== "all" ? [activeSourceId] : []), ...(current && metrics?.state !== "none" ? [current.id] : [])])];
  const durationMinutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
  const validDuration = durationMinutes === null || Number.isInteger(durationMinutes) && durationMinutes >= 1 && durationMinutes <= 720;
  const practiceCount = count === "all" ? totals.matchingCount : count;
  const shortage = totals.matchingCount > 0 && practiceCount > totals.matchingCount;
  const canStart = restored && totals.matchingCount > 0 && !shortage && validDuration && !loading;
  function toggleSource(exam: PyqExam) {
    if (loading || !restored) return;
    const enabled = sourceMetrics[exam].state !== "all";
    setPaths((existing) => (activeSourceId === "all" ? totals.subjectIds : [activeSourceId]).reduce((updated, id) => setScopeExam(updated, id, exam, enabled, index), existing));
    setError(""); setNotice("");
  }
  function selectScope(id: string) {
    if (loading || !restored) return;
    setPaths((existing) => replaceScope(existing, id, index, initialExam));
    setFocusId(id); setSourceScopeId("all"); setError(""); setNotice(""); moveFocus.current = true;
  }
  function toggleSubject(id: string) {
    if (loading || !restored) return;
    if (totals.subjectIds.includes(id)) {
      const next = removeScope(paths, id, index);
      setPaths(next);
      if (current?.subjectId === id) setFocusId(selectionCounts(next, index).subjectIds[0]);
    } else { setPaths((existing) => addScope(existing, id, index, initialExam)); setFocusId(id); }
    setSourceScopeId("all"); setError(""); setNotice("");
  }
  function browse(id: string) {
    if (loading || !restored) return;
    setFocusId(id); setNotice("View changed. Your practice selection is unchanged."); moveFocus.current = true;
  }
  function remove(id: string) {
    if (loading || !restored) return;
    const next = removeScope(paths, id, index);
    setPaths(next); setSourceScopeId("all"); setError("");
    if (!Object.keys(next).length) setFocusId(undefined);
    else if (current && scopeMetrics(current.subjectId, next, index).state === "none") setFocusId(selectionCounts(next, index).subjectIds[0]);
  }
  async function startPractice() {
    if (!canStart) return;
    const recipe: PracticeRecipeV3 = { version: 3, subjectIds: totals.subjectIds, paths: Object.entries(paths).filter(([, exams]) => exams.length).map(([subtopicId, exams]) => ({ subtopicId, exams: [...exams] })), count, order, durationMinutes };
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/practice-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recipe) });
      const snapshot = await response.json() as PracticeSnapshot & { error?: string };
      if (!response.ok) throw new Error(snapshot.error || "The practice could not be prepared. Please try again.");
      if (snapshot.matchingCount !== totals.matchingCount || snapshot.questions.length !== practiceCount) throw new Error("The question inventory has changed. Refresh this page to review the updated selection.");
      try { await createLocalAttempt(snapshot); } catch { throw new Error("This browser could not save your practice. Allow browser storage, then try again. Your selection is still here."); }
      router.push("/practice/" + snapshot.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The practice could not be prepared. Please try again."); setLoading(false); }
  }
  const instruction = metrics?.state === "none" ? "Browsing only · select to replace"
    : current?.kind === "subtopic" ? "Subtopic selected"
    : current?.kind === "topic" ? "Choose a subtopic or keep this topic"
    : current?.kind === "head" ? "Choose a topic or keep this section"
    : metrics?.state === "all" ? "All sections selected"
    : "Partial selection";
  return <main className="pyq-page archive-workspace scope-workspace" aria-busy={loading}>
    <header className="scope-page-heading"><div>{initialExam ? <Link className="back-link" href="/">← All UPSC sources</Link> : <p className="pyq-kicker">Official previous-year questions</p>}<h1>Build your test.</h1></div><details className="scope-inventory-info"><summary>{format(initialInventory.mappedCount)} classified PYQs <span aria-hidden="true">ⓘ</span></summary><p>{format(initialInventory.unmappedCount)} unclassified questions remain in exam archives.</p></details></header>
    <ol className="scope-steps" aria-label="Practice setup"><li><span>1</span> Choose subjects</li><li><span>2</span> Refine your scope</li><li><span>3</span> Set size & start</li></ol>
    <section className="subject-selector" aria-labelledby="subject-title"><div><span>1</span><div><h2 id="subject-title">Choose subjects</h2>{initialExam ? <p>{initialExam} only</p> : null}</div></div><div className="subject-buttons">{initialInventory.subjects.map((subject) => {
      const selected = totals.subjectIds.includes(subject.id);
      return <button key={subject.id} type="button" disabled={loading || !restored} aria-pressed={selected} onClick={() => toggleSubject(subject.id)} className={selected ? "active" : ""}><strong>{subject.label}</strong><span>{selected ? format(scopeMetrics(subject.id, paths, index).selectedCount) + " selected · " : ""}{format(subject.questionCount)} available</span></button>;
    })}</div></section>
    <div className="scope-builder-layout">
      <section className="scope-refine" aria-labelledby="scope-refine-title">
        <div className="scope-refine-heading"><div><span className="selector-label">2 · Refine</span><h2 id="scope-refine-title" tabIndex={-1} ref={focusHeading}>{current?.label || "Choose a subject"}</h2>{current ? <p>{instruction}</p> : null}</div>{totals.subjectIds.length ? <button type="button" className="scope-secondary" disabled={loading} onClick={() => setAddOpen(true)}>＋ Add topic</button> : null}</div>
        {current ? <>
          {totals.subjectIds.length > 1 ? <div className="scope-subject-tabs" aria-label="Browse selected subjects">{totals.subjectIds.map((id) => <button type="button" disabled={loading} aria-pressed={current.subjectId === id} key={id} onClick={() => browse(id)}>{index.nodesById.get(id)?.label}<span>{format(scopeMetrics(id, paths, index).selectedCount)}</span></button>)}</div> : null}
          <nav className="scope-breadcrumbs" aria-label="Current syllabus path">{focusPath.map((node, position) => <span key={node.id}>{position ? <i aria-hidden="true">→</i> : null}<button type="button" disabled={loading} onClick={() => browse(node.id)} aria-current={node.id === current.id ? "location" : undefined}>{node.label}</button></span>)}</nav>
          <div className="scope-navigation-help">{current.parentId ? <button type="button" disabled={loading} onClick={() => browse(current.parentId!)}>← Back <small>selection unchanged</small></button> : null}</div>
          <div className="scope-current-action"><span><strong>{format(metrics?.selectedCount || 0)}</strong> / {format(current.questionCount)} selected</span><button type="button" disabled={loading} onClick={() => selectScope(current.id)}>{"Select entire " + (current.kind === "head" ? "section" : current.kind)}</button></div>
          <ScopeFlow inventory={initialInventory} paths={paths} focusId={focusId} onSelect={selectScope} onBrowse={browse} disabled={loading} />
        </> : <div className="scope-empty"><strong>Select a subject above</strong></div>}
        <p className="scope-status" role="status" aria-live="polite">{notice || (totals.subjectIds.length ? format(totals.matchingCount) + " questions match your selection across " + totals.subjectIds.length + " subject" + (totals.subjectIds.length === 1 ? "." : "s.") : "No subjects selected. Choose one to begin.")}</p>
      </section>
      <aside className="selection-dock scope-dock" aria-labelledby="practice-summary-title">
        <div className="scope-dock-body">
        <span className="selector-label">3 · Set size & start</span><h2 id="practice-summary-title">Your practice</h2>
        <div className="scope-matching" data-testid="matching-count"><strong>{format(totals.matchingCount)}</strong><span>questions match your selection</span></div>
        <div className="scope-selection-list">{selectedIds.map((id) => { const node = index.nodesById.get(id)!; const branchPath = ancestors(id, index); const metric = scopeMetrics(id, paths, index); const leaves = index.leavesById.get(id) || []; return <div className="scope-selection-item" key={id}><div><strong>{branchPath[0]?.label}</strong><span>{branchPath.length > 1 ? branchPath.slice(1).map((part) => part.label).join(" → ") : "All sections"}</span><small>{format(metric.selectedCount)} matching · {leaves.length} subtopic{leaves.length === 1 ? "" : "s"}</small></div><button type="button" disabled={loading} aria-label={"Remove " + node.label} onClick={() => remove(id)}>×</button></div>; })}{!selectedIds.length ? <p>Choose a subject to begin.</p> : null}</div>
        <section className="scope-sources" aria-labelledby="scope-sources-title">
          <h3 id="scope-sources-title">Exam sources</h3>
          <label className="scope-source-target">Apply sources to<select aria-label="Apply sources to" disabled={loading || !restored || !totals.subjectIds.length} value={activeSourceId} onChange={(event) => setSourceScopeId(event.target.value)}><option value="all">All selected questions</option>{sourceTargets.map((id) => <option value={id} key={id}>{index.nodesById.get(id)?.label}</option>)}</select></label>
          <div className="scope-source-grid">{PYQ_EXAMS.map((exam) => <SourceChoice key={exam} exam={exam} count={sourceMetrics[exam].count} available={sourceMetrics[exam].available} state={sourceMetrics[exam].state} disabled={loading || !restored || sourceMetrics[exam].available === 0} onChange={() => toggleSource(exam)} />)}</div>
          {activeSourceId !== "all" ? <div className="scope-source-total" aria-label="Matching questions across all selected branches">Whole practice: {PYQ_EXAMS.map((exam) => <span key={exam} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties}>{exam} {format(totals.examTotals[exam])}</span>)}</div> : null}
        </section>
        <fieldset className="scope-size-options" disabled={loading || !restored}><legend>Questions in this practice</legend><div className="segmented">{COUNTS.map((value) => <button type="button" key={value} className={count === value ? "active" : ""} aria-pressed={count === value} onClick={() => { setCount(value); setError(""); }}>{value}</button>)}<button type="button" className={count === "all" ? "active" : ""} aria-pressed={count === "all"} onClick={() => { setCount("all"); setError(""); }}>All</button></div></fieldset>
        {shortage ? <div className="scope-shortage" role="alert"><p>You chose {practiceCount}, but only {format(totals.matchingCount)} questions match.</p><button type="button" disabled={loading} onClick={() => setCount("all")}>Use all {format(totals.matchingCount)} available</button></div> : null}
        {totals.subjectIds.length > 0 && totals.matchingCount === 0 ? <p className="scope-shortage">No questions match the enabled sources. Add a source or choose another branch.</p> : null}
        <label className="scope-order">Question order<select disabled={loading || !restored} value={order} onChange={(event) => setOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle</option></select></label>
        <div className="scope-duration"><label className="scope-order">Test duration<select disabled={loading || !restored} value={durationChoice} onChange={(event) => { setDurationChoice(event.target.value); setError(""); }}><option value="untimed">Untimed</option>{DURATIONS.map((minutes) => <option key={minutes} value={String(minutes)}>{minutes} minutes</option>)}<option value="custom">Custom time</option></select></label>{durationChoice === "custom" ? <label className="scope-order">Minutes<input type="number" inputMode="numeric" min={1} max={720} step={1} disabled={loading || !restored} value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} /></label> : null}{!validDuration ? <p className="inline-error" role="alert">Enter 1–720 whole minutes.</p> : null}</div>
        </div>
        <div className="scope-dock-footer">
        <div className="scope-practice-size"><strong>{totals.subjectIds.length ? format(practiceCount) : "20"}</strong><span>{totals.matchingCount === 0 || shortage ? "questions requested" : "questions in this practice"}<small>{format(totals.matchingCount)} matching{count === "all" ? " · all included" : ""}</small></span></div>
        <button type="button" className="start-practice" disabled={!canStart} onClick={() => void startPractice()}>{loading ? "Preparing your practice…" : "Start " + (totals.subjectIds.length ? format(practiceCount) : 20) + "-question practice →"}</button>
        {draftWarning ? <p className="scope-shortage">{draftWarning}</p> : null}{error ? <p className="inline-error" role="alert">{error}</p> : null}
        </div>
      </aside>
    </div>
    <div className="scope-mobile-bar"><div><strong>{format(totals.matchingCount)} matching</strong><span>{format(practiceCount)} {totals.matchingCount === 0 || shortage ? "requested" : "in practice"}</span></div><button type="button" disabled={!canStart} onClick={() => void startPractice()}>{loading ? "Preparing…" : "Start " + format(practiceCount) + " →"}</button></div>
    {addOpen ? <AddScopeDialog index={index} paths={paths} initialId={current?.subjectId} preferredExam={initialExam} onCancel={() => setAddOpen(false)} onAdd={(id) => { setPaths((existing) => addScope(existing, id, index, initialExam)); setFocusId(id); setSourceScopeId("all"); setError(""); setNotice(""); setAddOpen(false); }} /> : null}
  </main>;
}
