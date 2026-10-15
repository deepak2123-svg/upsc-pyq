"use client";

import { useMemo, type CSSProperties } from "react";
import type { SubjectPracticeInventory } from "../../lib/pyq-catalog";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import {
  buildSelectionIndex,
  scopeDisplayNumber,
  scopeMetrics,
  type ScopeNode,
  type SelectionPaths,
  type SelectionState,
} from "../../lib/practice-selection";

type ScopeCardsProps = {
  inventory: SubjectPracticeInventory;
  paths: SelectionPaths;
  focusId?: string;
  onSelect: (id: string) => void;
  onBrowse: (id: string) => void;
  disabled?: boolean;
};

type ExamCounts = Record<PyqExam, number>;
type CardMetrics = {
  selectedCount: number;
  state: SelectionState;
  availableExams: ExamCounts;
};

const number = (value: number) => value.toLocaleString("en-IN");
const emptyExamCounts = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });
const levelNames: Record<ScopeNode["kind"], string> = {
  subject: "subject",
  head: "section",
  topic: "chapter",
  subtopic: "subpart",
};

function cardMetrics(node: ScopeNode, paths: SelectionPaths, index: ReturnType<typeof buildSelectionIndex>): CardMetrics {
  const metric = scopeMetrics(node.id, paths, index);
  const availableExams = emptyExamCounts();
  for (const leaf of index.leavesById.get(node.id) || []) {
    for (const exam of PYQ_EXAMS) availableExams[exam] += leaf.examCounts[exam];
  }
  return { selectedCount: metric.selectedCount, state: metric.state, availableExams };
}

function SourceDistribution({ counts }: { counts: ExamCounts }) {
  const total = PYQ_EXAMS.reduce((sum, exam) => sum + counts[exam], 0);
  return <>
    <span className="scope-card-source-strip" aria-hidden="true">
      {PYQ_EXAMS.map((exam) => counts[exam] > 0 ? <i
        key={exam}
        data-exam={exam}
        style={{ "--exam-color": PYQ_EXAM_COLORS[exam], flexGrow: counts[exam] } as CSSProperties}
      /> : null)}
    </span>
    <span className="scope-card-source-counts" aria-label={`Available sources: ${PYQ_EXAMS.map((exam) => `${exam} ${number(counts[exam])}`).join(", ")}. ${number(total)} questions total.`}>
      {PYQ_EXAMS.map((exam) => <span key={exam} data-exam={exam}>
        <i style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} aria-hidden="true" />
        <b>{exam}</b> {number(counts[exam])}
      </span>)}
    </span>
  </>;
}

export function ScopeFlow({ inventory, paths, focusId, onSelect, onBrowse, disabled = false }: ScopeCardsProps) {
  const index = useMemo(() => buildSelectionIndex(inventory), [inventory]);
  const focus = index.nodesById.get(focusId || "") || inventory.subjects
    .map((subject) => index.nodesById.get(subject.id)!)
    .find((subject) => (index.leavesById.get(subject.id) || []).some((leaf) => Object.hasOwn(paths, leaf.id)));

  const cards = useMemo(() => {
    if (!focus) return [];
    const children = index.childrenById.get(focus.id) || [];
    return (children.length ? children : [focus])
      .filter((node) => node.questionCount > 0)
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [focus, index]);

  if (!focus) return <div className="outline-empty"><strong>No subject selected</strong><span>Choose a subject to explore its sections, chapters and subparts.</span></div>;

  const subjectLabel = index.nodesById.get(focus.subjectId)?.label || "this subject";
  const nextKind = cards[0]?.kind || focus.kind;
  const nextLevel = levelNames[nextKind];
  const pluralLevel = `${nextLevel}${nextLevel === "subpart" ? "s" : "s"}`;

  return <section className="scope-cards" aria-label={`${subjectLabel} ${pluralLevel}`} data-focus-id={focus.id}>
    <header className="scope-cards-heading">
      <div>
        <span className="scope-cards-eyebrow">Browse {levelNames[focus.kind]}</span>
        <h3>{cards.length === 1 && cards[0].id === focus.id ? focus.label : `Choose ${pluralLevel}`}</h3>
        <p><strong>Select</strong> changes your test. <strong>Open</strong> shows the next level without changing it.</p>
      </div>
      <div className="scope-card-exam-key" aria-label="Exam source colours">
        {PYQ_EXAMS.map((exam) => <span key={exam}><i style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} />{exam}</span>)}
      </div>
    </header>

    <div className="scope-card-grid">
      {cards.map((node) => {
        const metrics = cardMetrics(node, paths, index);
        const displayNumber = scopeDisplayNumber(node.id, index);
        const hasChildren = (index.childrenById.get(node.id)?.length || 0) > 0;
        const selectedText = metrics.state === "all" ? "Included"
          : metrics.state === "partial" ? "Partly included" : "Available";
        const childKind = index.childrenById.get(node.id)?.[0]?.kind;
        const childLabel = childKind ? `${levelNames[childKind]}s` : "details";
        const countText = metrics.selectedCount > 0
          ? `${number(metrics.selectedCount)} selected of ${number(node.questionCount)} available`
          : `${number(node.questionCount)} questions available`;
        return <article
          key={node.id}
          className="scope-card"
          data-state={metrics.state}
          data-active={node.id === focus.id}
          data-scope-id={node.id}
          data-available-count={node.questionCount}
          data-selected-count={metrics.selectedCount}
        >
          <div className="scope-card-body">
            <div className="scope-card-meta">{displayNumber ? <span className="scope-card-number">{displayNumber}</span> : null}<span className="scope-card-state">{selectedText}</span></div>
            <h4>{node.label}</h4>
            <p>{countText}</p>
            <SourceDistribution counts={metrics.availableExams} />
          </div>
          <div className="scope-card-actions">
            <button
              type="button"
              className="scope-card-select"
              disabled={disabled}
              aria-pressed={metrics.state === "partial" ? "mixed" : metrics.state === "all"}
              aria-label={`Choose ${node.label}. ${number(metrics.selectedCount)} of ${number(node.questionCount)} questions included. Replace the current scope in ${subjectLabel}.`}
              onClick={() => onSelect(node.id)}
            >Select</button>
            {hasChildren ? <button
              type="button"
              className="scope-card-open"
              disabled={disabled}
              aria-label={`Open ${node.label} ${childLabel} without changing your selection`}
              onClick={() => onBrowse(node.id)}
            >Open {childLabel}</button> : null}
          </div>
        </article>;
      })}
    </div>
  </section>;
}
