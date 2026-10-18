"use client";

import type { CSSProperties } from "react";
import type { PyqExam } from "../../lib/pyq-exams";
import {
  scopeDisplayNumber,
  scopeMetrics,
  type ScopeNode,
  type SelectionIndex,
  type SelectionPaths,
} from "../../lib/practice-selection";

type SyllabusNavigationProps = {
  index: SelectionIndex;
  paths: SelectionPaths;
  focusPath: ScopeNode[];
  selectedIds: string[];
  mappedCount: number;
  preferredExam?: PyqExam;
  disabled?: boolean;
  onBrowse: (id: string) => void;
  onBrowseRoot: () => void;
  onRemove: (id: string) => void;
};

const format = (value: number) => value.toLocaleString("en-IN");

function nodeCount(node: ScopeNode, preferredExam?: PyqExam) {
  return preferredExam ? node.examCounts[preferredExam] : node.questionCount;
}

export function SyllabusNavigation({
  index,
  paths,
  focusPath,
  selectedIds,
  mappedCount,
  preferredExam,
  disabled = false,
  onBrowse,
  onBrowseRoot,
  onRemove,
}: SyllabusNavigationProps) {
  const activeId = focusPath.at(-1)?.id;
  const activePathIds = new Set(focusPath.map((node) => node.id));
  const selectedIdSet = new Set(selectedIds);
  const subjects = [...index.nodesById.values()]
    .filter((node) => node.kind === "subject" && nodeCount(node, preferredExam) > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  function renderNode(node: ScopeNode, depth: number) {
    const children = (index.childrenById.get(node.id) || [])
      .filter((child) => nodeCount(child, preferredExam) > 0)
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    const isCurrent = node.id === activeId;
    const isOnPath = activePathIds.has(node.id);
    const isSelected = selectedIdSet.has(node.id);
    const selectionState = scopeMetrics(node.id, paths, index).state;
    const displayNumber = scopeDisplayNumber(node.id, index);

    return <li key={node.id}>
      <div
        className="scope-syllabus-row"
        data-scope-id={node.id}
        data-depth={depth}
        data-path={isOnPath ? "true" : "false"}
        data-selection-state={selectionState}
        style={{ "--tree-depth": depth } as CSSProperties}
      >
        <button
          type="button"
          className="scope-syllabus-link"
          disabled={disabled}
          aria-label={node.label}
          aria-current={isCurrent ? "location" : undefined}
          aria-expanded={children.length ? isOnPath : undefined}
          onClick={() => onBrowse(node.id)}
        >
          <span className="scope-syllabus-caret" aria-hidden="true">{children.length ? (isOnPath ? "▾" : "▸") : ""}</span>
          <span>{displayNumber ? <small>{displayNumber}</small> : null}{node.label}</span>
        </button>
        <span className="scope-syllabus-count">{format(nodeCount(node, preferredExam))}</span>
        {isSelected ? <button
          type="button"
          className="scope-syllabus-check"
          aria-label={`Remove ${node.label} from selection`}
          disabled={disabled}
          onClick={() => onRemove(node.id)}
        >✓</button> : selectionState === "partial" ? <span className="scope-syllabus-partial" aria-label="Contains selected topics">•</span> : null}
      </div>
      {children.length && isOnPath ? <ul>{children.map((child) => renderNode(child, depth + 1))}</ul> : null}
    </li>;
  }

  return <nav className="scope-syllabus-nav" aria-label="Syllabus">
    <button type="button" className="scope-syllabus-root" disabled={disabled} aria-current={!activeId ? "location" : undefined} onClick={onBrowseRoot}>
      <span>Subjects</span><strong>{format(mappedCount)}</strong>
    </button>
    <ul className="scope-syllabus-tree">{subjects.map((subject) => renderNode(subject, 0))}</ul>
  </nav>;
}
