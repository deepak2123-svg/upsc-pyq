"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import type { SubjectPracticeInventory } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticeRecipeV3, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";
import { addScope, addedQuestionCount, ancestors, buildSelectionIndex, removeScope, replaceScope, sanitizePathsWithAliases, scopeDisplayNumber, scopeMetrics, selectedScopeIds, selectionCounts, setScopeExam, type SelectionIndex, type SelectionPaths } from "../../lib/practice-selection";
import { ScopeFlow } from "./scope-flow";
import { SyllabusNavigation } from "./syllabus-navigation";

const COUNTS = [10, 20, 30, 50] as const;
const DURATIONS = [10, 20, 30, 60, 120] as const;
const format = (value: number) => value.toLocaleString("en-IN");

function SourceChoice({ exam, state, count, available, disabled, onChange }: { exam: PyqExam; state: "none" | "partial" | "all"; count: number; available: number; disabled: boolean; onChange: () => void }) {
  return <button type="button" role="checkbox" aria-checked={state === "partial" ? "mixed" : state === "all"} disabled={disabled} className={"scope-source " + state} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} onClick={onChange}>
    <span className="scope-source-top"><span className="scope-check" aria-hidden="true">{state === "all" ? "✓" : state === "partial" ? "−" : ""}</span><span className="scope-source-name">{exam}</span><small className="scope-source-state">{state === "all" ? "Included" : state === "partial" ? "Partial" : "Not included"}</small></span>
    <span className="scope-source-total"><strong>{format(state === "none" ? available : count)}</strong><small>{state === "all" ? "questions" : state === "partial" ? `of ${format(available)} questions` : "questions available"}</small></span>
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
  const optionLabel = (id: string, label: string) => {
    const number = scopeDisplayNumber(id, index);
    return number ? `${number} · ${label}` : label;
  };
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
      {section ? <label>Topic<select value={topic?.id || section.id} onChange={(event) => setCandidateId(event.target.value)}><option value={section.id}>Entire section</option>{(index.childrenById.get(section.id) || []).map((node) => <option key={node.id} value={node.id}>{optionLabel(node.id, node.label)} · {node.questionCount}</option>)}</select></label> : null}
      {topic ? <label>Subtopic<select value={leaf?.id || topic.id} onChange={(event) => setCandidateId(event.target.value)}><option value={topic.id}>Entire topic</option>{(index.childrenById.get(topic.id) || []).map((node) => <option key={node.id} value={node.id}>{optionLabel(node.id, node.label)} · {node.questionCount}</option>)}</select></label> : null}
      <div className="scope-add-preview"><strong>{index.nodesById.get(candidateId)?.label}</strong><span>{format(additional)} new questions</span>{!additional ? <small>Already included or unavailable.</small> : null}</div>
      <div className="scope-dialog-actions"><button type="button" className="scope-secondary" onClick={onCancel}>Cancel</button><button className="scope-primary" type="submit" disabled={additional === 0}>Add {format(additional)} questions</button></div>
    </form>
  </dialog>;
}

function PracticeSetupDialog({ matchingCount, examMetrics, count, order, durationChoice, customMinutes, includeAnswerKey, shortage, validDuration, loading, exporting, canStart, error, onExam, onCount, onOrder, onDuration, onCustomMinutes, onIncludeAnswerKey, onUseAll, onStart, onExport, onCancel }: {
  matchingCount: number; count: number | "all" | null; order: PracticeOrder; durationChoice: string; customMinutes: string; includeAnswerKey: boolean; shortage: boolean; validDuration: boolean; loading: boolean; exporting: boolean; canStart: boolean; error: string;
  examMetrics: Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  onExam: (exam: PyqExam) => void; onCount: (value: number | "all") => void; onOrder: (value: PracticeOrder) => void; onDuration: (value: string) => void; onCustomMinutes: (value: string) => void; onIncludeAnswerKey: (value: boolean) => void; onUseAll: () => void; onStart: () => void; onExport: () => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"online" | "pdf" | null>(null);
  const practiceCount = count === "all" ? matchingCount : count;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const current = dialog.current;
    current?.showModal();
    return () => { current?.close(); previous?.focus(); };
  }, []);
  const busy = loading || exporting;
  const SetupControls = () => <>
    <fieldset className="setup-exam-options" disabled={busy}>
        <legend>Exams to include</legend>
        <div className="setup-exam-grid">{PYQ_EXAMS.map((exam) => { const metric = examMetrics[exam]; return <button type="button" role="checkbox" aria-checked={metric.state === "partial" ? "mixed" : metric.state === "all"} disabled={busy || metric.available === 0} className={metric.state} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} key={exam} onClick={() => onExam(exam)}><span className="scope-check" aria-hidden="true">{metric.state === "all" ? "✓" : metric.state === "partial" ? "−" : ""}</span><strong>{exam}</strong><small>{metric.state === "none" ? `${format(metric.available)} available` : `${format(metric.count)} included`}</small></button>; })}</div>
      </fieldset>
      <fieldset className="scope-size-options" disabled={busy}>
        <legend>How many questions?</legend>
        <div className="segmented">{COUNTS.map((value) => <button type="button" key={value} className={count === value ? "active" : ""} aria-pressed={count === value} onClick={() => onCount(value)}>{value}</button>)}<button type="button" className={count === "all" ? "active" : ""} aria-pressed={count === "all"} onClick={() => onCount("all")}>All {format(matchingCount)}</button></div>
      </fieldset>
      {count === null ? <p className="scope-size-prompt">Choose how many questions you want to attempt.</p> : null}
      {shortage ? <div className="scope-shortage" role="alert"><p>You chose {practiceCount}, but only {format(matchingCount)} questions match.</p><button type="button" disabled={loading} onClick={onUseAll}>Use all {format(matchingCount)} available</button></div> : null}
      <fieldset className="scope-time-options" disabled={busy}>
        <legend>{mode === "pdf" ? "Time printed on the paper" : "Time limit"}</legend>
        <div className="segmented"><button type="button" className={durationChoice === "untimed" ? "active" : ""} aria-pressed={durationChoice === "untimed"} onClick={() => onDuration("untimed")}>No time limit</button>{DURATIONS.map((minutes) => <button type="button" key={minutes} className={durationChoice === String(minutes) ? "active" : ""} aria-pressed={durationChoice === String(minutes)} onClick={() => onDuration(String(minutes))}>{minutes} min</button>)}<button type="button" className={durationChoice === "custom" ? "active" : ""} aria-pressed={durationChoice === "custom"} onClick={() => onDuration("custom")}>Custom</button></div>
      </fieldset>
      {durationChoice === "custom" ? <label className="scope-order">Custom minutes<input type="number" inputMode="numeric" min={1} max={720} step={1} disabled={busy} value={customMinutes} onChange={(event) => onCustomMinutes(event.target.value)} /></label> : null}
      {!validDuration ? <p className="inline-error" role="alert">Enter 1–720 whole minutes.</p> : null}
      <label className="scope-order">Question order<select disabled={busy} value={order} onChange={(event) => onOrder(event.target.value as PracticeOrder)}><option value="newest">Newest first</option><option value="shuffle">Shuffle questions</option></select></label>
  </>;
  return <dialog ref={dialog} className="scope-add-dialog practice-setup-dialog" aria-labelledby="practice-setup-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <form onSubmit={(event) => { event.preventDefault(); if (mode === "online") onStart(); }}>
      <span className="selector-label">Final step</span>
      <h2 id="practice-setup-title">How would you like to attempt these questions?</h2>
      <p><strong>{format(matchingCount)} questions</strong> match your selected chapters.</p>
      {!mode ? <div className="attempt-route-grid">
        <button type="button" className="attempt-route online" onClick={() => setMode("online")}><span className="route-badge">Recommended</span><strong>Take an online test</strong><small>Answer on screen, move between questions, and receive a result sheet after submission.</small><b>Set up online test →</b></button>
        <button type="button" className="attempt-route offline" onClick={() => setMode("pdf")}><span className="route-badge">Optional</span><strong>Download a PDF with an answer key</strong><b>Set up PDF →</b></button>
      </div> : <section className={`attempt-setup-panel ${mode}`} aria-labelledby="chosen-attempt-title">
        <div className="chosen-attempt-heading"><button type="button" className="scope-secondary" disabled={busy} onClick={() => setMode(null)}>← Change method</button><div><span>{mode === "online" ? "Online test" : "Printable PDF"}</span><h3 id="chosen-attempt-title">{mode === "online" ? "Set up your online test" : "Set up your printable paper"}</h3></div></div>
        <SetupControls />
        {mode === "pdf" ? <label className="pdf-answer-key"><input type="checkbox" checked={includeAnswerKey} disabled={busy} onChange={(event) => onIncludeAnswerKey(event.target.checked)} /><span><strong>Add an answer key</strong><small>Official answers will appear on a separate final page.</small></span></label> : null}
        {error ? <p className="inline-error" role="alert">{error}</p> : null}
        <div className="scope-dialog-actions practice-setup-actions"><button type="button" className="scope-secondary" disabled={busy} onClick={onCancel}>Continue choosing chapters</button>{mode === "online" ? <button type="submit" className="scope-primary confirm-practice" disabled={!canStart}>{loading ? "Preparing test…" : count === null ? "Choose a question count" : `Start ${format(practiceCount!)}-question test`}</button> : <button type="button" className="scope-primary confirm-practice" disabled={!canStart} onClick={onExport}>{exporting ? "Preparing PDF…" : count === null ? "Choose a question count" : `Download ${format(practiceCount!)}-question PDF`}</button>}</div>
      </section>}
    </form>
  </dialog>;
}

export function ArchiveWorkspace({ initialInventory, initialExam }: { initialInventory: SubjectPracticeInventory; initialExam?: PyqExam }) {
  const router = useRouter();
  const index = useMemo(() => buildSelectionIndex(initialInventory), [initialInventory]);
  const [paths, setPaths] = useState<SelectionPaths>({});
  const [focusId, setFocusId] = useState<string>();
  const [count, setCount] = useState<number | "all" | null>(null);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [durationChoice, setDurationChoice] = useState("untimed");
  const [customMinutes, setCustomMinutes] = useState("30");
  const [sourceScopeId, setSourceScopeId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [draftWarning, setDraftWarning] = useState("");
  const draftKey = "upsc-pyq-builder:v3:" + (initialExam || "all");

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if ((draft.version === 3 || draft.version === 4) && draft.inventoryVersion === initialInventory.version) {
          setPaths(sanitizePathsWithAliases(draft.paths, index, initialInventory.legacyAliases));
          if (typeof draft.focusId === "string" && index.nodesById.has(draft.focusId)) setFocusId(draft.focusId);
          if (draft.version === 4 && (draft.count === "all" || Number.isInteger(draft.count) && draft.count > 0 && draft.count <= 100)) setCount(draft.count);
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
  }, [draftKey, initialInventory.version, initialInventory.legacyAliases, index]);
  useEffect(() => {
    if (!restored) return;
    const minutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
    try { window.sessionStorage.setItem(draftKey, JSON.stringify({ version: 4, inventoryVersion: initialInventory.version, paths, focusId, count, order, durationMinutes: Number.isInteger(minutes) && Number(minutes) >= 1 && Number(minutes) <= 720 ? minutes : null })); } catch { setDraftWarning("Your builder settings could not be saved. Returning to this page may reset them. Practice storage is checked before starting."); }
  }, [restored, draftKey, initialInventory.version, paths, focusId, count, order, durationChoice, customMinutes]);
  const totals = useMemo(() => selectionCounts(paths, index), [paths, index]);
  const selectedIds = useMemo(() => selectedScopeIds(paths, index), [paths, index]);
  const current = focusId ? index.nodesById.get(focusId) : undefined;
  const focusPath = current ? ancestors(current.id, index) : [];
  const activeSourceId = sourceScopeId !== "all" && index.nodesById.has(sourceScopeId) && scopeMetrics(sourceScopeId, paths, index).state !== "none" ? sourceScopeId : "all";
  const sourceLeaves = activeSourceId === "all" ? [...index.nodesById.values()].filter((node) => node.kind === "subtopic" && Object.hasOwn(paths, node.id)) : (index.leavesById.get(activeSourceId) || []).filter((node) => Object.hasOwn(paths, node.id));
  const sourceMetrics = Object.fromEntries(PYQ_EXAMS.map((exam) => {
    const eligible = sourceLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => paths[leaf.id]?.includes(exam));
    return [exam, { available: eligible.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), count: enabled.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), state: (enabled.length === 0 ? "none" : enabled.length === eligible.length ? "all" : "partial") as "none" | "partial" | "all" }];
  })) as Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  const allSourceLeaves = [...index.nodesById.values()].filter((node) => node.kind === "subtopic" && Object.hasOwn(paths, node.id));
  const setupSourceMetrics = Object.fromEntries(PYQ_EXAMS.map((exam) => {
    const eligible = allSourceLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => paths[leaf.id]?.includes(exam));
    return [exam, { available: eligible.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), count: enabled.reduce((sum, leaf) => sum + leaf.examCounts[exam], 0), state: (enabled.length === 0 ? "none" : enabled.length === eligible.length ? "all" : "partial") as "none" | "partial" | "all" }];
  })) as Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  const sourceTargets = [...new Set(selectedIds)];
  const durationMinutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
  const validDuration = durationMinutes === null || Number.isInteger(durationMinutes) && durationMinutes >= 1 && durationMinutes <= 720;
  const practiceCount = count === "all" ? totals.matchingCount : count;
  const shortage = count !== null && totals.matchingCount > 0 && practiceCount! > totals.matchingCount;
  const canStart = restored && count !== null && totals.matchingCount > 0 && !shortage && validDuration && !loading && !exporting;
  function toggleSource(exam: PyqExam) {
    if (loading || !restored) return;
    const enabled = sourceMetrics[exam].state !== "all";
    setPaths((existing) => (activeSourceId === "all" ? totals.subjectIds : [activeSourceId]).reduce((updated, id) => setScopeExam(updated, id, exam, enabled, index), existing));
    setError(""); setNotice("");
  }
  function toggleSetupSource(exam: PyqExam) {
    if (loading || exporting || !restored) return;
    const enabled = setupSourceMetrics[exam].state !== "all";
    setPaths((existing) => totals.subjectIds.reduce((updated, id) => setScopeExam(updated, id, exam, enabled, index), existing));
    setError(""); setNotice("");
  }
  function selectScope(id: string) {
    if (loading || !restored) return;
    setPaths(() => replaceScope({}, id, index, initialExam));
    setFocusId(id); setSourceScopeId("all"); setError(""); setNotice("Selection updated.");
  }
  function browse(id: string) {
    if (loading || !restored) return;
    const isFolding = focusId === id && (index.childrenById.get(id)?.length || 0) > 0;
    setFocusId(isFolding ? index.nodesById.get(id)?.parentId : id);
    setNotice(isFolding ? "Syllabus level collapsed." : "Syllabus view changed.");
  }
  function browseRoot() {
    if (loading || !restored) return;
    setFocusId(undefined); setNotice("Showing all subjects.");
  }
  function clearSelection() {
    if (loading || !restored) return;
    setPaths({}); setSourceScopeId("all"); setError(""); setNotice("Selection cleared.");
  }
  function remove(id: string) {
    if (loading || !restored) return;
    const next = removeScope(paths, id, index);
    setPaths(next); setSourceScopeId("all"); setError("");
    if (!Object.keys(next).length) setFocusId(undefined);
    else if (current && scopeMetrics(current.subjectId, next, index).state === "none") setFocusId(selectionCounts(next, index).subjectIds[0]);
  }
  async function createSnapshot() {
    if (count === null || practiceCount === null) return;
    const recipe: PracticeRecipeV3 = { version: 3, subjectIds: totals.subjectIds, paths: Object.entries(paths).filter(([, exams]) => exams.length).map(([subtopicId, exams]) => ({ subtopicId, exams: [...exams] })), count, order, durationMinutes };
    const response = await fetch("/api/practice-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recipe) });
    const snapshot = await response.json() as PracticeSnapshot & { error?: string };
    if (!response.ok) throw new Error(snapshot.error || "The paper could not be prepared. Please try again.");
    if (snapshot.matchingCount !== totals.matchingCount || snapshot.questions.length !== practiceCount) throw new Error("The question inventory has changed. Refresh this page to review the updated selection.");
    return snapshot;
  }
  async function startPractice() {
    if (!canStart) return;
    setLoading(true); setError("");
    try {
      const snapshot = await createSnapshot();
      if (!snapshot) return;
      try { await createLocalAttempt(snapshot); } catch { throw new Error("This browser could not save your practice. Allow browser storage, then try again. Your selection is still here."); }
      router.push("/practice/" + snapshot.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The practice could not be prepared. Please try again."); setLoading(false); }
  }
  async function exportPaper() {
    if (!canStart) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setError("Your browser blocked the PDF window. Allow pop-ups for this site, then try again."); return; }
    printWindow.document.title = "Preparing PDF…";
    printWindow.document.body.innerHTML = "<p style='font:16px system-ui;padding:32px'>Preparing your printable paper…</p>";
    setExporting(true); setError("");
    try {
      const snapshot = await createSnapshot();
      if (!snapshot) throw new Error("Choose the number of MCQs before exporting.");
      printWindow.sessionStorage.setItem(`upsc-pyq-print:${snapshot.id}`, JSON.stringify({ snapshot, includeAnswerKey }));
      printWindow.location.href = `/practice/${snapshot.id}/print`;
    } catch (reason) {
      printWindow.close();
      setError(reason instanceof Error ? reason.message : "The PDF could not be prepared. Please try again.");
    } finally { setExporting(false); }
  }
  return <main className="pyq-page archive-workspace scope-workspace library-workspace" aria-busy={loading}>
    <header className="scope-library-heading"><div>{initialExam ? <><Link className="back-link" href="/">← All UPSC sources</Link><p className="pyq-kicker">{initialExam}</p></> : null}<h1>{initialExam ? `${initialExam} question library` : "Question library"}</h1></div><details className="scope-inventory-info"><summary>{format(initialInventory.mappedCount)} PYQs <span aria-hidden="true">ⓘ</span></summary><p>{format(initialInventory.unmappedCount)} unclassified questions remain in exam archives.</p></details></header>
    <div className={`scope-library-layout ${selectedIds.length ? "has-selection" : "no-selection"}`}>
      <aside className="scope-syllabus-rail">
        <button type="button" className="scope-syllabus-mobile-toggle" aria-expanded={syllabusOpen} aria-controls="scope-syllabus-content" onClick={() => setSyllabusOpen((open) => !open)}><span>Syllabus</span><strong>{current?.label || "All subjects"}</strong></button>
          <div id="scope-syllabus-content" className="scope-syllabus-content" data-mobile-open={syllabusOpen ? "true" : "false"}>
            <SyllabusNavigation index={index} paths={paths} focusPath={focusPath} selectedIds={selectedIds} mappedCount={initialExam ? initialInventory.subjects.reduce((sum, subject) => sum + subject.examCounts[initialExam], 0) : initialInventory.mappedCount} preferredExam={initialExam} disabled={loading || !restored} onBrowse={browse} onBrowseRoot={browseRoot} onRemove={remove} />
            {selectedIds.length ? <>
              <div className="scope-selection-tools"><strong>Selection</strong><button type="button" disabled={loading} onClick={() => setAddOpen(true)}>＋ Add</button><button type="button" disabled={loading} onClick={clearSelection}>Clear</button></div>
          <section className="scope-sources scope-sources-rail" aria-labelledby="scope-sources-title">
            <div className="scope-source-heading"><h3 id="scope-sources-title">Exam sources</h3></div>
            {sourceTargets.length > 1 ? <label className="scope-source-target">Apply to<select aria-label="Apply sources to" disabled={loading || !restored} value={activeSourceId} onChange={(event) => setSourceScopeId(event.target.value)}><option value="all">All selected</option>{sourceTargets.map((id) => <option value={id} key={id}>{index.nodesById.get(id)?.label}</option>)}</select></label> : null}
            <div className="scope-source-grid">{PYQ_EXAMS.map((exam) => <SourceChoice key={exam} exam={exam} count={sourceMetrics[exam].count} available={sourceMetrics[exam].available} state={sourceMetrics[exam].state} disabled={loading || !restored || sourceMetrics[exam].available === 0} onChange={() => toggleSource(exam)} />)}</div>
          </section>
            </> : null}
          </div>
      </aside>

      <section className="scope-refine scope-library-browser" aria-labelledby="scope-refine-title">
        <h2 id="scope-refine-title" className="visually-hidden">{current ? `Browse ${current.label}` : "Browse subjects"}</h2>
        <ScopeFlow inventory={initialInventory} paths={paths} focusId={focusId} preferredExam={initialExam} onAttempt={selectScope} onBrowse={browse} disabled={loading || !restored} />
        <p className="visually-hidden" role="status" aria-live="polite">{notice}</p>
      </section>

      <aside className="selection-dock scope-dock scope-test-summary" aria-labelledby="practice-summary-title">
        <div className="scope-dock-body"><h2 id="practice-summary-title">Test</h2>
          <div className="scope-matching" data-testid="matching-count"><strong>{format(totals.matchingCount)}</strong><span>questions</span></div>
          {selectedIds.length ? <><div className="scope-test-source-bar" aria-hidden="true">{PYQ_EXAMS.map((exam) => totals.examTotals[exam] ? <i key={exam} style={{ "--exam-color": PYQ_EXAM_COLORS[exam], flexGrow: totals.examTotals[exam] } as CSSProperties} /> : null)}</div><div className="scope-test-source-list">{PYQ_EXAMS.map((exam) => <span key={exam} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties}><i />{exam} <b>{format(totals.examTotals[exam])}</b></span>)}</div></> : null}
          {totals.subjectIds.length > 0 && totals.matchingCount === 0 ? <p className="scope-shortage">No questions match the enabled exam sources. Re-enable a source or choose another scope.</p> : null}
        </div>
        <div className="scope-dock-footer"><button type="button" className="start-practice" disabled={!restored || totals.matchingCount === 0 || loading} onClick={() => setSetupOpen(true)}>Set up test →</button>{draftWarning ? <p className="scope-shortage">{draftWarning}</p> : null}</div>
      </aside>
    </div>
    <div className="scope-mobile-bar"><div><strong>{format(totals.matchingCount)} questions</strong></div><button type="button" disabled={!restored || totals.matchingCount === 0 || loading} onClick={() => setSetupOpen(true)}>Set up test →</button></div>
    {addOpen ? <AddScopeDialog index={index} paths={paths} initialId={current?.subjectId || totals.subjectIds[0]} preferredExam={initialExam} onCancel={() => setAddOpen(false)} onAdd={(id) => { setPaths((existing) => addScope(existing, id, index, initialExam)); setFocusId(id); setSourceScopeId("all"); setError(""); setNotice("Scope added."); setAddOpen(false); }} /> : null}
    {setupOpen ? <PracticeSetupDialog matchingCount={totals.matchingCount} examMetrics={setupSourceMetrics} count={count} order={order} durationChoice={durationChoice} customMinutes={customMinutes} includeAnswerKey={includeAnswerKey} shortage={shortage} validDuration={validDuration} loading={loading} exporting={exporting} canStart={canStart} error={error} onExam={toggleSetupSource} onCount={(value) => { setCount(value); setError(""); }} onOrder={setOrder} onDuration={(value) => { setDurationChoice(value); setError(""); }} onCustomMinutes={setCustomMinutes} onIncludeAnswerKey={setIncludeAnswerKey} onUseAll={() => setCount("all")} onStart={() => void startPractice()} onExport={() => void exportPaper()} onCancel={() => { setSetupOpen(false); setError(""); }} /> : null}
  </main>;
}
