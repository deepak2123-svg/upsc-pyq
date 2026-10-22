"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import type { SubjectPracticeInventory } from "../../lib/pyq-catalog";
import type { PracticeOrder, PracticeRecipeV3, PracticeRecipeV4, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt } from "../../lib/practice-store";
import { addScope, ancestors, buildSelectionIndex, removeScope, replaceScope, restoreVersionedPaths, scopeDisplayNumber, scopeMetrics, selectedScopeIds, selectionCounts, setScopeExam, type SelectionPaths } from "../../lib/practice-selection";
import {coalesceCoveredDraftScopes,freezeSelectionMembership,restoreFrozenSelection} from '../../lib/practice-draft-membership';
import { ScopeFlow } from "./scope-flow";
import { SyllabusNavigation } from "./syllabus-navigation";

const COUNTS = [10, 20, 30, 50] as const;
const DURATIONS = [10, 20, 30, 60, 120] as const;
const format = (value: number) => value.toLocaleString("en-IN");

function SourceChoice({ exam, state, count, available, disabled, onChange }: { exam: PyqExam; state: "none" | "partial" | "all"; count: number; available: number; disabled: boolean; onChange: () => void }) {
  return <button type="button" aria-pressed={state !== "none"} disabled={disabled} className={"scope-source " + state} style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} onClick={onChange}>
    <span className="scope-source-top"><span className="scope-source-name">{exam}</span><small className="scope-source-state">{state === "all" ? "Included" : state === "partial" ? "Partial" : "Off"}</small></span>
    <span className="scope-source-total"><strong>{format(state === "none" ? available : count)}</strong><small>{state === "none" ? "available" : "MCQs"}</small></span>
  </button>;
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
  const [workingInventory,setWorkingInventory]=useState(initialInventory);
  const baseIndex=useMemo(()=>buildSelectionIndex(initialInventory),[initialInventory]);
  const index = useMemo(() => buildSelectionIndex(workingInventory), [workingInventory]);
  const libraryCount=useMemo(()=>initialExam?new Set(initialInventory.nodes.filter(node=>node.kind==='subtopic'&&!node.legacyOnly).flatMap(node=>node.questionIdsByExam?.[initialExam]||[])).size:initialInventory.mappedCount,[initialInventory,initialExam]);
  const [paths, setPaths] = useState<SelectionPaths>({});
  const [focusId, setFocusId] = useState<string>();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [enabledExams, setEnabledExams] = useState<PyqExam[]>(initialExam ? [initialExam] : [...PYQ_EXAMS]);
  const [count, setCount] = useState<number | "all" | null>(null);
  const [order, setOrder] = useState<PracticeOrder>("newest");
  const [durationChoice, setDurationChoice] = useState("untimed");
  const [customMinutes, setCustomMinutes] = useState("30");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [draftWarning, setDraftWarning] = useState("");
  const libraryDrawer = useRef<HTMLDivElement>(null);
  const testDrawer = useRef<HTMLElement>(null);
  const draftKey = "upsc-pyq-builder:v3:" + (initialExam || "all");
  useEffect(() => {
    if (!syllabusOpen && !testPanelOpen) return;
    const panel = syllabusOpen ? libraryDrawer.current : testDrawer.current;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href]') || []).filter((element) => element.getClientRects().length);
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setSyllabusOpen(false); setTestPanelOpen(false); }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [syllabusOpen, testPanelOpen]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if ([3, 4, 5, 6].includes(draft.version) && (draft.inventoryVersion === initialInventory.version || draft.inventoryVersion === 3 && initialInventory.version === 4)) {
          let savedPaths:SelectionPaths;
          if(draft.version===6) {
            const frozen=restoreFrozenSelection(initialInventory,draft.paths,draft.frozenScopes);
            setWorkingInventory(frozen.inventory);savedPaths=frozen.paths;
            if(frozen.removedCount)setDraftWarning('Some saved questions are no longer eligible and were removed.');
          } else if(draft.taxonomyVersion===initialInventory.taxonomyVersion&&draft.taxonomyVersion&&Object.keys(draft.paths||{}).length) {
            savedPaths={};setDraftWarning('This older selection has no question-membership record. Re-add its parts to confirm the current questions.');
          } else savedPaths=restoreVersionedPaths(draft.paths,baseIndex,initialInventory.legacyAliases,initialInventory.legacyRestoreAliases||{},draft.taxonomyVersion!==initialInventory.taxonomyVersion);
          setPaths(savedPaths);
          if (Array.isArray(draft.enabledExams)) setEnabledExams(PYQ_EXAMS.filter((exam) => draft.enabledExams.includes(exam) && (!initialExam || initialExam === exam)));
          else if (Object.keys(savedPaths).length) setEnabledExams(PYQ_EXAMS.filter((exam) => Object.values(savedPaths).some((exams) => exams.includes(exam))));
          const savedExpanded = Array.isArray(draft.expandedIds) ? draft.expandedIds.filter((id: unknown): id is string => typeof id === "string" && baseIndex.nodesById.has(id)) : [];
          setExpandedIds(savedExpanded);
          if (typeof draft.focusId === "string" && baseIndex.nodesById.has(draft.focusId)) {
            setFocusId(draft.focusId);
            const currentPath = ancestors(draft.focusId, baseIndex).map((node) => node.id);
            setExpandedIds(currentPath);
          }
          if (draft.version >= 4 && (draft.count === "all" || Number.isInteger(draft.count) && draft.count > 0 && draft.count <= 100)) setCount(draft.count);
          if (draft.order === "newest" || draft.order === "shuffle") setOrder(draft.order);
          if (Number.isInteger(draft.durationMinutes) && draft.durationMinutes >= 1 && draft.durationMinutes <= 720) {
            const savedMinutes = String(draft.durationMinutes);
            setDurationChoice(DURATIONS.some((minutes) => minutes === draft.durationMinutes) ? savedMinutes : "custom");
            setCustomMinutes(savedMinutes);
          }
        }
      }
    } catch { setPaths({});setWorkingInventory(initialInventory);setDraftWarning("Your builder settings could not be restored in this browser. You can still choose a new practice."); }
    const urlScope = new URL(window.location.href).searchParams.get("scope");
    const historyEntry = window.history.state?.pyqLibrary;
    if (urlScope !== null || historyEntry?.draftKey === draftKey) {
      const locationId = urlScope && baseIndex.nodesById.has(urlScope) ? urlScope : undefined;
      setFocusId(locationId);
      setExpandedIds(locationId ? ancestors(locationId, baseIndex).map((node) => node.id) : []);
    }
    setRestored(true);
  }, [draftKey, initialInventory, baseIndex, initialExam]);
  useEffect(() => {
    if (!restored) return;
    const url = new URL(window.location.href);
    if (focusId) url.searchParams.set("scope", focusId);
    else url.searchParams.delete("scope");
    if (window.history.state?.pyqLibrary?.draftKey !== draftKey) {
      window.history.replaceState({ ...window.history.state, pyqLibrary: { draftKey, depth: 0 } }, "", url);
    }
    function restoreLocation() {
      const scope = new URL(window.location.href).searchParams.get("scope");
      const locationId = scope && baseIndex.nodesById.has(scope) ? scope : undefined;
      setFocusId(locationId);
      setExpandedIds(locationId ? ancestors(locationId, baseIndex).map((node) => node.id) : []);
      setSetupOpen(false); setSyllabusOpen(false); setTestPanelOpen(false);
    }
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, [restored, draftKey, baseIndex, focusId]);
  useEffect(() => {
    if (!restored) return;
    const minutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
    try { window.sessionStorage.setItem(draftKey, JSON.stringify({ version: 6, inventoryVersion: initialInventory.version, taxonomyVersion:initialInventory.taxonomyVersion, frozenScopes:freezeSelectionMembership(paths,index), paths, focusId, expandedIds, enabledExams, count, order, durationMinutes: Number.isInteger(minutes) && Number(minutes) >= 1 && Number(minutes) <= 720 ? minutes : null })); } catch { setDraftWarning("Your builder settings could not be saved. Returning to this page may reset them. Practice storage is checked before starting."); }
  }, [restored, draftKey, initialInventory.version, initialInventory.taxonomyVersion, index, paths, focusId, expandedIds, enabledExams, count, order, durationChoice, customMinutes]);
  const totals = useMemo(() => selectionCounts(paths, index), [paths, index]);
  const selectedIds = useMemo(() => selectedScopeIds(paths, index), [paths, index]);
  const current = focusId ? index.nodesById.get(focusId) : undefined;
  const focusPath = current ? ancestors(current.id, index) : [];
  const hasExplicitSelection = selectedIds.length > 0;
  const summaryPaths = useMemo<SelectionPaths>(() => {
    if (hasExplicitSelection) return paths;
    const base = current ? replaceScope({}, current.id, index, initialExam) : initialInventory.subjects
      .filter((subject) => !initialExam || subject.examCounts[initialExam] > 0)
      .reduce((next, subject) => addScope(next, subject.id, index, initialExam), {} as SelectionPaths);
    return Object.fromEntries(Object.entries(base).map(([id, exams]) => [id, exams.filter((exam) => enabledExams.includes(exam))]));
  }, [current, hasExplicitSelection, index, initialExam, initialInventory.subjects, paths, enabledExams]);
  const summaryTotals = useMemo(() => selectionCounts(summaryPaths, index), [summaryPaths, index]);
  const selectedScopeLabels = selectedIds.flatMap((id) => {
    const node = index.nodesById.get(id);
    if (!node) return [];
    const number = scopeDisplayNumber(id, index);
    return [number ? `${number} · ${node.label}` : node.label];
  });
  const summaryContextLabel = hasExplicitSelection ? "Selected parts" : "Current folder";
  const summaryScopeLabel = hasExplicitSelection
    ? selectedScopeLabels.length === 1 ? selectedScopeLabels[0] : `${selectedScopeLabels.length} selected parts`
    : current?.label || (initialExam ? `${initialExam} question library` : "Question library");
  const summaryActionLabel = hasExplicitSelection ? "Set up test →" : "Test this folder →";
  const sourceLeaves = [...index.nodesById.values()].filter((node) => node.kind === "subtopic" && Object.hasOwn(summaryPaths, node.id));
  const sourceMetrics = Object.fromEntries(PYQ_EXAMS.map((exam) => {
    const eligible = sourceLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => summaryPaths[leaf.id]?.includes(exam));
    const available = selectionCounts(Object.fromEntries(eligible.map(leaf => [leaf.id, [exam]])), index).examTotals[exam];
    return [exam, { available, count: summaryTotals.examTotals[exam], state: (enabled.length === 0 ? "none" : enabled.length === eligible.length ? "all" : "partial") as "none" | "partial" | "all" }];
  })) as Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  const allSourceLeaves = [...index.nodesById.values()].filter((node) => node.kind === "subtopic" && Object.hasOwn(paths, node.id));
  const setupSourceMetrics = Object.fromEntries(PYQ_EXAMS.map((exam) => {
    const eligible = allSourceLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => paths[leaf.id]?.includes(exam));
    const available = selectionCounts(Object.fromEntries(eligible.map(leaf => [leaf.id, [exam]])), index).examTotals[exam];
    return [exam, { available, count: totals.examTotals[exam], state: (enabled.length === 0 ? "none" : enabled.length === eligible.length ? "all" : "partial") as "none" | "partial" | "all" }];
  })) as Record<PyqExam, { available: number; count: number; state: "none" | "partial" | "all" }>;
  const durationMinutes = durationChoice === "untimed" ? null : Number(durationChoice === "custom" ? customMinutes : durationChoice);
  const validDuration = durationMinutes === null || Number.isInteger(durationMinutes) && durationMinutes >= 1 && durationMinutes <= 720;
  const practiceCount = count === "all" ? totals.matchingCount : count;
  const shortage = count !== null && totals.matchingCount > 0 && practiceCount! > totals.matchingCount;
  const canStart = restored && count !== null && totals.matchingCount > 0 && !shortage && validDuration && !loading && !exporting;
  function toggleSource(exam: PyqExam) {
    if (loading || !restored) return;
    const enabled = sourceMetrics[exam].state !== "all";
    setEnabledExams((existing) => enabled ? [...existing, exam] : existing.filter((item) => item !== exam));
    setPaths((existing) => Object.keys(existing).reduce((updated, id) => setScopeExam(updated, id, exam, enabled, index), existing));
    setError(""); setNotice("");
  }
  function toggleSetupSource(exam: PyqExam) {
    if (exporting) return;
    toggleSource(exam);
  }
  function addToTest(id: string) {
    if (loading || !restored) return;
    setPaths((existing) => {
      const next = addScope(existing, id, index, initialExam);
      return coalesceCoveredDraftScopes(Object.fromEntries(Object.entries(next).map(([leafId, exams]) => [leafId, Object.hasOwn(existing, leafId) ? exams : enabledExams.filter((exam) => index.nodesById.get(leafId)!.examCounts[exam] > 0)])),index);
    });
    setError("");setDraftWarning(""); setNotice("Added to test.");
  }
  function browse(id: string) {
    if (loading || !restored) return;
    recordLocation(id);
    setFocusId(id);
    setExpandedIds(ancestors(id, index).map((node) => node.id));
    setSyllabusOpen(false);
    setNotice("Folder opened.");
  }
  function toggleBranch(id: string) {
    setExpandedIds((existing) => existing.includes(id)
      ? existing.filter((item) => !ancestors(item, index).some((ancestor) => ancestor.id === id))
      : ancestors(id, index).map((node) => node.id));
  }
  function browseRoot() {
    if (loading || !restored) return;
    recordLocation();
    setFocusId(undefined); setSyllabusOpen(false); setNotice("Showing all subjects.");
  }
  function recordLocation(id?: string) {
    if (id === focusId) return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("scope", id);
    else url.searchParams.delete("scope");
    const previous = window.history.state?.pyqLibrary;
    const depth = previous?.draftKey === draftKey && Number.isInteger(previous.depth) ? previous.depth : 0;
    window.history.pushState({ ...window.history.state, pyqLibrary: { draftKey, depth: depth + 1 } }, "", url);
  }
  function goBack() {
    if (loading || !restored) return;
    const entry = window.history.state?.pyqLibrary;
    if (entry?.draftKey === draftKey && entry.depth > 0) window.history.back();
    else if (current?.parentId) browse(current.parentId);
    else browseRoot();
  }
  function clearSelection() {
    if (loading || !restored) return;
    setPaths({}); setError(""); setNotice("Selection cleared.");
  }
  function remove(id: string) {
    if (loading || !restored) return;
    setPaths((existing) => removeScope(existing, id, index)); setError("");
  }
  function openSetup() {
    if (!restored || loading || summaryTotals.matchingCount === 0) return;
    setTestPanelOpen(false);
    if (!hasExplicitSelection) {
      setPaths(summaryPaths);
      setError(""); setNotice("Folder added to test.");
    }
    setSetupOpen(true);
  }
  async function createSnapshot() {
    if (count === null || practiceCount === null) return;
    const enabledPaths=Object.fromEntries(Object.entries(paths).filter(([,exams])=>exams.length));
    const recipe: PracticeRecipeV3 | PracticeRecipeV4 = { version: initialInventory.version, ...(initialInventory.version===4?{taxonomyVersion:initialInventory.taxonomyVersion,frozenScopes:freezeSelectionMembership(enabledPaths,index)}:{}), subjectIds: totals.subjectIds, paths: Object.entries(enabledPaths).map(([subtopicId, exams]) => ({ subtopicId, exams: [...exams] })), count, order, durationMinutes };
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
    <header className="scope-library-heading"><div>{initialExam ? <><Link className="back-link" href="/">← All UPSC sources</Link><p className="pyq-kicker">{initialExam}</p></> : null}<h1>{initialExam ? `${initialExam} question library` : "Question library"}</h1></div><details className="scope-inventory-info"><summary>{format(libraryCount)} PYQs <span aria-hidden="true">ⓘ</span></summary><p>{format(initialInventory.unmappedCount)} unclassified questions remain in exam archives.</p></details></header>
    <div className={`scope-library-layout explorer-layout ${selectedIds.length ? "has-selection" : "no-selection"}`}>
      <aside className="scope-syllabus-rail">
        <button type="button" className="scope-syllabus-mobile-toggle" aria-expanded={syllabusOpen} aria-controls="scope-syllabus-content" onClick={() => setSyllabusOpen((open) => !open)}><span>Library</span><strong>{current?.label || "All subjects"}</strong></button>
          <div ref={libraryDrawer} id="scope-syllabus-content" className="scope-syllabus-content" data-mobile-open={syllabusOpen ? "true" : "false"} role={syllabusOpen ? "dialog" : undefined} aria-modal={syllabusOpen || undefined} aria-label={syllabusOpen ? "Library" : undefined}>
            <button type="button" className="explorer-drawer-close" onClick={() => setSyllabusOpen(false)}>Close library ×</button>
            <SyllabusNavigation index={index} focusPath={focusPath} expandedIds={expandedIds} mappedCount={libraryCount} preferredExam={initialExam} disabled={loading || !restored} onBrowse={browse} onBrowseRoot={browseRoot} onToggle={toggleBranch} />
          </div>
      </aside>

      <section className="scope-refine scope-library-browser" aria-labelledby="scope-refine-title">
        <h2 id="scope-refine-title" className="visually-hidden">{current ? `Browse ${current.label}` : "Browse subjects"}</h2>
        <ScopeFlow inventory={workingInventory} paths={paths} focusId={focusId} preferredExam={initialExam} onAdd={addToTest} onBrowse={browse} onBack={goBack} disabled={loading || !restored} />
        <p className="visually-hidden" role="status" aria-live="polite">{notice}</p>
      </section>

      <aside ref={testDrawer} className="selection-dock scope-dock scope-test-summary" data-mobile-open={testPanelOpen} role={testPanelOpen ? "dialog" : undefined} aria-modal={testPanelOpen || undefined} aria-labelledby="practice-summary-title">
        <div className="scope-dock-body"><div className="explorer-test-heading"><h2 id="practice-summary-title">Your test</h2><button type="button" className="explorer-drawer-close" onClick={() => setTestPanelOpen(false)}>Close ×</button>{hasExplicitSelection ? <button type="button" className="explorer-clear" disabled={loading} onClick={clearSelection}>Clear</button> : null}</div>
          <div className="scope-test-context" data-testid="test-scope-label"><span>{summaryContextLabel}</span><strong title={summaryScopeLabel}>{summaryScopeLabel}</strong></div>
          <div className="scope-matching" data-testid="matching-count"><strong>{format(summaryTotals.matchingCount)}</strong><span>questions</span></div>
          {hasExplicitSelection ? <ul className="explorer-test-items">{selectedIds.map((id) => {
            const node = index.nodesById.get(id)!;
            const context = ancestors(id, index).slice(0, -1).map((parent) => parent.label).join(" › ");
            return <li key={id}><div><small>{context}</small><strong>{scopeDisplayNumber(id, index)} {node.label}</strong><span>{format(scopeMetrics(id, paths, index).selectedCount)} MCQs</span></div><button type="button" disabled={loading} aria-label={`Remove ${node.label} from test`} onClick={() => remove(id)}>Remove</button></li>;
          })}</ul> : null}
          <section className="scope-sources explorer-sources" aria-labelledby="scope-sources-title"><h3 id="scope-sources-title">Exam sources</h3><div className="scope-source-grid">{PYQ_EXAMS.map((exam) => <SourceChoice key={exam} exam={exam} count={sourceMetrics[exam].count} available={sourceMetrics[exam].available} state={sourceMetrics[exam].state} disabled={loading || !restored || sourceMetrics[exam].available === 0} onChange={() => toggleSource(exam)} />)}</div></section>
          {totals.subjectIds.length > 0 && totals.matchingCount === 0 ? <p className="scope-shortage">No questions match the enabled exam sources. Re-enable a source or choose another scope.</p> : null}
        </div>
        <div className="scope-dock-footer"><button type="button" className="start-practice" data-testid={hasExplicitSelection ? undefined : "full-scope-action"} disabled={!restored || summaryTotals.matchingCount === 0 || loading} onClick={openSetup}>{summaryActionLabel}</button>{draftWarning ? <p className="scope-shortage">{draftWarning}</p> : null}</div>
      </aside>
    </div>
    {syllabusOpen || testPanelOpen ? <button type="button" className="explorer-overlay" aria-label="Close panels" onClick={() => { setSyllabusOpen(false); setTestPanelOpen(false); }} /> : null}
    <div className="scope-mobile-bar"><button type="button" className="explorer-test-toggle" aria-expanded={testPanelOpen} onClick={() => { setSyllabusOpen(false); setTestPanelOpen((open) => !open); }}><strong>{format(summaryTotals.matchingCount)} MCQs</strong><span>{hasExplicitSelection ? "Your test ↑" : "Current folder ↑"}</span></button><button type="button" disabled={!restored || summaryTotals.matchingCount === 0 || loading} onClick={openSetup}>{summaryActionLabel}</button></div>
    {setupOpen ? <PracticeSetupDialog matchingCount={totals.matchingCount} examMetrics={setupSourceMetrics} count={count} order={order} durationChoice={durationChoice} customMinutes={customMinutes} includeAnswerKey={includeAnswerKey} shortage={shortage} validDuration={validDuration} loading={loading} exporting={exporting} canStart={canStart} error={error} onExam={toggleSetupSource} onCount={(value) => { setCount(value); setError(""); }} onOrder={setOrder} onDuration={(value) => { setDurationChoice(value); setError(""); }} onCustomMinutes={setCustomMinutes} onIncludeAnswerKey={setIncludeAnswerKey} onUseAll={() => setCount("all")} onStart={() => void startPractice()} onExport={() => void exportPaper()} onCancel={() => { setSetupOpen(false); setError(""); }} /> : null}
  </main>;
}
