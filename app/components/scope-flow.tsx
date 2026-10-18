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
  preferredExam?: PyqExam;
  onAdd: (id: string) => void;
  onBrowse: (id: string) => void;
  onBack: () => void;
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

function cardMetrics(node: ScopeNode, paths: SelectionPaths, index: ReturnType<typeof buildSelectionIndex>, preferredExam?: PyqExam): CardMetrics {
  const metric = scopeMetrics(node.id, paths, index);
  const availableExams = emptyExamCounts();
  for (const leaf of index.leavesById.get(node.id) || []) {
    for (const exam of PYQ_EXAMS) {
      if (!preferredExam || exam === preferredExam) availableExams[exam] += leaf.examCounts[exam];
    }
  }
  return { selectedCount: metric.selectedCount, state: metric.state, availableExams };
}

function SourceDistribution({ counts, exams = PYQ_EXAMS }: { counts: ExamCounts; exams?: readonly PyqExam[] }) {
  const total = exams.reduce((sum, exam) => sum + counts[exam], 0);
  return <>
    <span className="scope-card-source-strip" aria-hidden="true">
      {exams.map((exam) => counts[exam] > 0 ? <i
        key={exam}
        data-exam={exam}
        style={{ "--exam-color": PYQ_EXAM_COLORS[exam], flexGrow: counts[exam] } as CSSProperties}
      /> : null)}
    </span>
    <span className="scope-card-source-counts" role="group" aria-label={`Available sources: ${exams.map((exam) => `${exam} ${number(counts[exam])}`).join(", ")}. ${number(total)} questions total.`}>
      {exams.map((exam) => <span key={exam} data-exam={exam}>
        <i style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} aria-hidden="true" />
        <b>{exam}</b> {number(counts[exam])}
      </span>)}
    </span>
  </>;
}

export function ScopeFlow({ inventory, paths, focusId, preferredExam, onAdd, onBrowse, onBack, disabled = false }: ScopeCardsProps) {
  const index = useMemo(() => buildSelectionIndex(inventory), [inventory]);
  const focus = index.nodesById.get(focusId || "");

  const cards = useMemo(() => {
    if (!focus) return inventory.subjects.map((subject) => index.nodesById.get(subject.id)!).filter((node) => node && (!preferredExam || node.examCounts[preferredExam] > 0));
    const children = index.childrenById.get(focus.id) || [];
    return children
      .filter((node) => preferredExam ? node.examCounts[preferredExam] > 0 : node.questionCount > 0)
      .sort((a, b) => ("order" in a ? a.order : 0) - ("order" in b ? b.order : 0) || a.label.localeCompare(b.label));
  }, [focus, index, inventory.subjects, preferredExam]);

  const subjectLabel = focus ? index.nodesById.get(focus.subjectId)?.label || "this subject" : "UPSC";
  const nextKind = cards[0]?.kind || focus?.kind || "subject";
  const nextLevel = levelNames[nextKind];
  const pluralLevel = `${nextLevel}${nextLevel === "subpart" ? "s" : "s"}`;
  const heading = pluralLevel.charAt(0).toUpperCase() + pluralLevel.slice(1);
  const focusState = focus ? scopeMetrics(focus.id, paths, index).state : "none";

  return <section className="scope-cards" aria-label={`${subjectLabel} ${pluralLevel}`} data-focus-id={focus?.id || "root"}>
    <header className="scope-cards-heading">
      <div>
        {focus ? <button type="button" className="explorer-back" disabled={disabled} onClick={onBack}>← Back</button> : null}
        {focus ? <small>{scopeDisplayNumber(focus.id, index)}</small> : null}
        <h3>{focus?.label || "Subjects"}</h3>
        {focus ? <span>{number(preferredExam ? focus.examCounts[preferredExam] : focus.questionCount)} MCQs</span> : null}
      </div>
      <div className="scope-card-exam-key" aria-label="Exam source colours">
        {(preferredExam ? [preferredExam] : PYQ_EXAMS).map((exam) => <span key={exam}><i style={{ "--exam-color": PYQ_EXAM_COLORS[exam] } as CSSProperties} />{exam}</span>)}
      </div>
      {focus ? <button type="button" className="explorer-add" disabled={disabled || focusState === "all"} onClick={() => onAdd(focus.id)}>{focusState === "all" ? "Added" : focusState === "partial" ? "Add remaining" : "Add entire folder"}</button> : null}
    </header>
    {cards.length ? <h4 className="explorer-contents-label">{heading}</h4> : focus ? <div className="explorer-leaf"><SourceDistribution counts={cardMetrics(focus, paths, index, preferredExam).availableExams} exams={preferredExam ? [preferredExam] : PYQ_EXAMS} /></div> : null}
    <div className="scope-card-grid">
      {cards.map((node) => {
        const metrics = cardMetrics(node, paths, index, preferredExam);
        const availableCount = preferredExam ? node.examCounts[preferredExam] : node.questionCount;
        const displayNumber = scopeDisplayNumber(node.id, index);
        const countText = `${number(availableCount)} questions`;
        return <article
          key={node.id}
          className="scope-card"
          data-state={metrics.state}
          data-active={node.id === focus?.id}
          data-scope-id={node.id}
          data-available-count={availableCount}
          data-selected-count={metrics.selectedCount}
        >
          <div className="scope-card-body">
            <div className="scope-card-main">
              <div className="scope-card-copy">
                {displayNumber ? <div className="scope-card-meta"><span className="scope-card-number">{displayNumber}</span></div> : null}
                <h4><button type="button" className="explorer-folder" disabled={disabled} aria-label={`Open ${node.label}`} onClick={() => onBrowse(node.id)}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" /></svg>{node.label}<span aria-hidden="true">›</span></button></h4>
                <p>{countText}</p>
                {metrics.state !== "none" ? <small className="explorer-added">{metrics.state === "all" ? "Added" : "Partly added"}</small> : null}
              </div>
              <button type="button" className="explorer-add" disabled={disabled || metrics.state === "all"} aria-label={`${metrics.state === "all" ? "Added" : "Add to test:"} ${node.label}`} onClick={() => onAdd(node.id)}>{metrics.state === "all" ? "Added" : metrics.state === "partial" ? "Add remaining" : "Add to test"}</button>
            </div>
            <SourceDistribution counts={metrics.availableExams} exams={preferredExam ? [preferredExam] : PYQ_EXAMS} />
          </div>
        </article>;
      })}
    </div>
  </section>;
}
