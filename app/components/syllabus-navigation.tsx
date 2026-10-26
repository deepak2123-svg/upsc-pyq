"use client";

import type { CSSProperties } from "react";
import type { PyqExam } from "../../lib/pyq-exams";
import {
  scopeDisplayNumber,
  type ScopeNode,
  type SelectionIndex,
} from "../../lib/practice-selection";

type SyllabusNavigationProps = {
  index: SelectionIndex;
  focusPath: ScopeNode[];
  expandedIds: string[];
  mappedCount: number;
  preferredExam?: PyqExam;
  visibleSubjectIds?: string[];
  disabled?: boolean;
  onBrowse: (id: string) => void;
  onBrowseRoot: () => void;
  onToggle: (id: string) => void;
};

const format = (value: number) => value.toLocaleString("en-IN");

function nodeCount(node: ScopeNode, preferredExam?: PyqExam) {
  return preferredExam ? node.examCounts[preferredExam] : node.questionCount;
}

export function SyllabusNavigation({
  index,
  focusPath,
  expandedIds,
  mappedCount,
  preferredExam,
  visibleSubjectIds,
  disabled = false,
  onBrowse,
  onBrowseRoot,
  onToggle,
}: SyllabusNavigationProps) {
  const activeId = focusPath.at(-1)?.id;
  const activePathIds = new Set(focusPath.map((node) => node.id));
  const expanded = new Set(expandedIds);
  const subject = focusPath.find((node) => node.kind === "subject");
  const section = focusPath.find((node) => node.kind === "head");
  const subjects = [...index.nodesById.values()]
    .filter((node) => node.kind === "subject" && !node.legacyOnly && (!visibleSubjectIds || visibleSubjectIds.includes(node.id)));

  function renderNode(node: ScopeNode, depth: number) {
    const children = (index.childrenById.get(node.id) || [])
      .filter((child) => node.legacyOnly||!child.legacyOnly)
      .sort((a, b) => ("order" in a ? a.order : 0) - ("order" in b ? b.order : 0) || a.label.localeCompare(b.label));
    const isCurrent = node.id === activeId;
    const isOnPath = activePathIds.has(node.id);
    const isExpanded = expanded.has(node.id);
    const displayNumber = scopeDisplayNumber(node.id, index);

    return <li key={node.id}>
      <div
        className="scope-syllabus-row"
        data-scope-id={node.id}
        data-depth={depth}
        data-path={isOnPath ? "true" : "false"}
        style={{ "--tree-depth": depth } as CSSProperties}
      >
        {children.length ? <button type="button" className="explorer-caret" disabled={disabled} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={isExpanded} onClick={() => onToggle(node.id)}>{isExpanded ? "▾" : "▸"}</button> : <span className="explorer-caret-space" />}
        <button
          type="button"
          className="scope-syllabus-link"
          disabled={disabled}
          aria-label={node.label}
          aria-current={isCurrent ? "location" : undefined}
          onClick={() => onBrowse(node.id)}
        >
          <span data-numbered={Boolean(displayNumber)}>{displayNumber ? <small>{displayNumber.replace(/^Chapter\s+/i, "")}</small> : null}<span className="syllabus-node-label">{node.label}</span></span>
        </button>
        <span className="scope-syllabus-count">{format(nodeCount(node, preferredExam))}</span>
      </div>
      {children.length && isExpanded ? <ul>{children.map((child) => renderNode(child, depth + 1))}</ul> : null}
    </li>;
  }

  return <nav className="scope-syllabus-nav syllabus-split" aria-label="Syllabus">
    <section className="syllabus-context-panel" aria-label="Subject and section">
    <button type="button" className="scope-syllabus-root" aria-label="Subjects" disabled={disabled} aria-current={!activeId ? "location" : undefined} onClick={onBrowseRoot}>
      <span>{subject ? "← All subjects" : "Subjects"}</span><strong>{format(mappedCount)}</strong>
    </button>
    {subject ? <>
      <button type="button" className="syllabus-subject" disabled={disabled} aria-label={subject.label} aria-current={activeId === subject.id ? "location" : undefined} onClick={() => onBrowse(subject.id)}><strong>{subject.label}</strong><span>{format(nodeCount(subject, preferredExam))}</span></button>
      <ul className="syllabus-sections">{(index.childrenById.get(subject.id) || []).filter((node) => subject.legacyOnly||!node.legacyOnly).map((node) => <li key={node.id}><button type="button" disabled={disabled} aria-label={node.label} aria-current={node.id === activeId ? "location" : undefined} data-active={section?.id === node.id} onClick={() => onBrowse(node.id)}><span>{node.kind === "head" && subject.label === "Geography" ? `${node.order}. ` : null}{node.label}</span><small>{format(nodeCount(node, preferredExam))}</small></button></li>)}</ul>
    </> : <ul className="syllabus-sections">{subjects.map((node) => <li key={node.id}><button type="button" disabled={disabled} aria-label={node.label} onClick={() => onBrowse(node.id)}><strong>{node.label}</strong><small>{format(nodeCount(node, preferredExam))}</small></button></li>)}</ul>}
    </section>
    {section ? <section className="syllabus-chapters-panel" aria-labelledby="syllabus-chapters-title"><header><small>{section.label}</small><h3 id="syllabus-chapters-title">Chapters & subchapters</h3></header><ul className="scope-syllabus-tree">{(index.childrenById.get(section.id) || []).filter((node) => section.legacyOnly||!node.legacyOnly).map((node) => renderNode(node, 0))}</ul></section> : null}
  </nav>;
}
