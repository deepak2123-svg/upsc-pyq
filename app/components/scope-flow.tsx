"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { sankey, type SankeyLink, type SankeyNode } from "d3-sankey";
import type { SubjectPracticeInventory } from "../../lib/pyq-catalog";
import { PYQ_EXAMS, PYQ_EXAM_COLORS, type PyqExam } from "../../lib/pyq-exams";
import {
  ancestors, buildSelectionIndex, scopeMetrics,
  type ScopeNode, type SelectionIndex, type SelectionPaths, type SelectionState,
} from "../../lib/practice-selection";

type ScopeFlowProps = {
  inventory: SubjectPracticeInventory;
  paths: SelectionPaths;
  focusId?: string;
  onSelect: (id: string) => void;
  onBrowse: (id: string) => void;
  disabled?: boolean;
};
type FlowNode = {
  id: string;
  label: string;
  column: number;
  order: number;
  availableCount: number;
  scopeIds: string[];
  active: boolean;
  aggregate: boolean;
  contextParentId?: string;
};
type FlowLink = { source: string | ChartNode; target: string | ChartNode; value: number };
type ChartNode = FlowNode & SankeyNode<FlowNode, FlowLink>;
type ChartLink = SankeyLink<FlowNode, FlowLink>;
type ExamCounts = Record<PyqExam, number>;
type NodeSelection = {
  selectedCount: number;
  state: SelectionState;
  availableExams: ExamCounts;
  selectedExams: ExamCounts;
};
type ExamLane = {
  exam: PyqExam;
  availableCount: number;
  selectedCount: number;
  availableWidth: number;
  selectedWidth: number;
  sourceCenter: number;
  targetCenter: number;
};

const WIDTH = 1040;
const COLUMN_WIDTH = 260;
const CARD_WIDTH = 218;
// Leave breathing room even for a three-line label and two-line count.
const LABEL_ROW_HEIGHT = 104;
const COLUMNS = ["Subject", "Section", "Topic", "Subtopic"];
const number = (value: number) => value.toLocaleString("en-IN");
const emptyExamCounts = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });

/** Available inventory alone determines geometry; choosing sources never moves it. */
function buildLayout(index: SelectionIndex, focus: ScopeNode | undefined, expanded: Set<string>) {
  const nodes: FlowNode[] = [];
  const links: FlowLink[] = [];
  if (!focus) return { nodes: [] as ChartNode[], links: [] as ChartLink[], height: 560, labelCenters: new Map<string, number>() };
  const chain = ancestors(focus.id, index);
  const chainIds = new Set(chain.map((node) => node.id));
  const nextByParent = new Map(chain.slice(1).map((node) => [node.parentId!, node.id]));
  let order = 0;

  function addReal(scope: ScopeNode, column: number) {
    const node: FlowNode = {
      id: scope.id, label: scope.label, column, order: order++,
      availableCount: scope.questionCount, scopeIds: [scope.id],
      active: chainIds.has(scope.id), aggregate: false,
    };
    nodes.push(node);
    return node;
  }
  function visit(scope: ScopeNode, column: number) {
    const node = addReal(scope, column);
    if (column === 3) return node;
    const children = index.childrenById.get(scope.id) || [];
    const nextId = nextByParent.get(scope.id);
    const showAll = !nextId || expanded.has(scope.id);
    const visible = showAll ? [...children] : children.filter((child) => child.id === nextId);
    visible.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
    for (const child of visible) {
      const childNode = chainIds.has(child.id) ? visit(child, column + 1) : addReal(child, column + 1);
      if (childNode.availableCount > 0) links.push({ source: node.id, target: childNode.id, value: childNode.availableCount });
    }
    const hidden = showAll ? [] : children.filter((child) => child.id !== nextId);
    const availableCount = hidden.reduce((sum, child) => sum + child.questionCount, 0);
    if (availableCount > 0) {
      const aggregate: FlowNode = {
        id: `context:${scope.id}`, label: `Other ${COLUMNS[column + 1].toLowerCase()}s`,
        column: column + 1, order: order++, availableCount,
        scopeIds: hidden.map((child) => child.id), active: false, aggregate: true,
        contextParentId: scope.id,
      };
      nodes.push(aggregate);
      links.push({ source: node.id, target: aggregate.id, value: availableCount });
    }
    return node;
  }
  visit(chain[0], 0);
  const maxRows = Math.max(...COLUMNS.map((_, column) => nodes.filter((node) => node.column === column).length));
  const height = Math.max(560, maxRows * LABEL_ROW_HEIGHT + 112);
  // Each terminal context node is a real sum of sibling branches, never a fake ribbon.
  const generator = sankey<FlowNode, FlowLink>()
    .nodeId((node) => node.id)
    .nodeWidth(12)
    .nodePadding(24)
    .nodeSort((a, b) => a.order - b.order)
    .nodeAlign((node) => node.column)
    .iterations(0)
    .extent([[18, 60], [822, height - 32]]);
  const graph = generator({ nodes: nodes.map((node) => ({ ...node })), links });
  // Sankey uses the deepest visible layer for x spacing. Override that spacing so
  // all four hierarchy columns stay fixed even before later layers are expanded.
  for (const node of graph.nodes) {
    node.x0 = node.column * COLUMN_WIDTH + 18;
    node.x1 = node.x0 + 12;
  }
  const labelCenters = new Map<string, number>();
  for (let column = 0; column < 4; column += 1) {
    const columnNodes = graph.nodes.filter((node) => node.column === column).sort((a, b) => (a.y0 || 0) - (b.y0 || 0));
    const centers: number[] = [];
    columnNodes.forEach((node, index) => {
      const preferred = ((node.y0 || 0) + (node.y1 || 0)) / 2;
      centers.push(Math.max(preferred, index ? centers[index - 1] + LABEL_ROW_HEIGHT : 98));
    });
    for (let index = centers.length - 1; index >= 0; index -= 1) {
      centers[index] = Math.min(centers[index], index === centers.length - 1 ? height - 44 : centers[index + 1] - LABEL_ROW_HEIGHT);
      labelCenters.set(columnNodes[index].id, centers[index]);
    }
  }
  return { ...graph, height, labelCenters };
}

function ribbonPath(link: ChartLink, sourceCenter: number, targetCenter: number) {
  const source = link.source as ChartNode;
  const target = link.target as ChartNode;
  const x0 = source.x1 || 0;
  const x1 = target.x0 || 0;
  const middle = (x0 + x1) / 2;
  return `M${x0},${sourceCenter}C${middle},${sourceCenter} ${middle},${targetCenter} ${x1},${targetCenter}`;
}

/** Stack real source counts within the inventory's fixed incoming/outgoing slot. */
function examLanes(link: ChartLink, selections: Map<string, NodeSelection>): ExamLane[] {
  const selection = selections.get((link.target as ChartNode).id)!;
  const unit = (link.width || 0) / link.value;
  let precedingCount = 0;
  return PYQ_EXAMS.flatMap((exam) => {
    const availableCount = selection.availableExams[exam];
    const selectedCount = selection.selectedExams[exam];
    const availableWidth = availableCount * unit;
    const offset = -(link.width || 0) / 2 + precedingCount * unit + availableWidth / 2;
    precedingCount += availableCount;
    return availableCount > 0 ? [{
      exam, availableCount, selectedCount, availableWidth,
      selectedWidth: selectedCount * unit,
      sourceCenter: (link.y0 || 0) + offset,
      targetCenter: (link.y1 || 0) + offset,
    }] : [];
  });
}

/** Join each ribbon's source lanes to the exact node slot, including tiny values. */
function nodeSegments(node: ChartNode, selections: Map<string, NodeSelection>) {
  const incoming = node.targetLinks || [];
  const outgoing = node.sourceLinks || [];
  return [
    ...incoming.map((link) => ({ link, x: node.x0 || 0, width: outgoing.length ? 6 : 12, side: "in" })),
    ...outgoing.map((link) => ({ link, x: (node.x0 || 0) + (incoming.length ? 6 : 0), width: incoming.length ? 6 : 12, side: "out" })),
  ].flatMap(({ link, x, width, side }) => {
    return examLanes(link, selections).map((lane) => {
      const laneCenter = side === "in" ? lane.targetCenter : lane.sourceCenter;
      return {
        id: `${side}:${(link.target as ChartNode).id}:${lane.exam}`, x, width,
        exam: lane.exam, availableY: laneCenter - lane.availableWidth / 2,
        availableHeight: lane.availableWidth,
        selectedY: laneCenter - lane.selectedWidth / 2,
        selectedHeight: lane.selectedWidth,
      };
    });
  });
}

export function ScopeFlow({ inventory, paths, focusId, onSelect, disabled = false }: ScopeFlowProps) {
  const index = useMemo(() => buildSelectionIndex(inventory), [inventory]);
  const [expandedContext, setExpandedContext] = useState<Set<string>>(() => new Set());
  const [showOverview, setShowOverview] = useState(false);
  const focus = index.nodesById.get(focusId || "") || inventory.subjects
    .map((subject) => index.nodesById.get(subject.id)!)
    .find((subject) => (index.leavesById.get(subject.id) || []).some((leaf) => Object.hasOwn(paths, leaf.id)));
  const layout = useMemo(() => buildLayout(index, focus, expandedContext), [index, focus, expandedContext]);
  const selections = useMemo(() => new Map(layout.nodes.map((node) => {
    const metrics = node.scopeIds.map((id) => scopeMetrics(id, paths, index));
    const state: SelectionState = metrics.every((metric) => metric.state === "all") ? "all"
      : metrics.every((metric) => metric.state === "none") ? "none" : "partial";
    const availableExams = emptyExamCounts();
    const selectedExams = emptyExamCounts();
    for (const scopeId of node.scopeIds) {
      const scope = index.nodesById.get(scopeId)!;
      for (const exam of PYQ_EXAMS) availableExams[exam] += scope.examCounts[exam];
      for (const leaf of index.leavesById.get(scopeId) || []) {
        for (const exam of paths[leaf.id] || []) selectedExams[exam] += leaf.examCounts[exam];
      }
    }
    return [node.id, {
      selectedCount: metrics.reduce((sum, metric) => sum + metric.selectedCount, 0),
      state, availableExams, selectedExams,
    }];
  })), [layout, paths, index]);
  const mobileChildren = useMemo(() => {
    const result = new Map<string, ChartNode[]>();
    for (const link of layout.links) {
      const source = link.source as ChartNode;
      const target = link.target as ChartNode;
      const children = result.get(source.id) || [];
      children.push(target);
      result.set(source.id, children);
    }
    return result;
  }, [layout]);
  const subjectLabel = index.nodesById.get(focus?.subjectId || "")?.label || "this subject";
  function toggleContext(id: string) {
    setExpandedContext((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function choose(node: ChartNode) {
    if (node.aggregate) toggleContext(node.contextParentId!);
    else onSelect(node.id);
  }
  function selectionLabel(node: ChartNode, selection: NodeSelection) {
    return node.aggregate ? `Show ${node.label.toLowerCase()}, ${number(node.availableCount)} available questions. Your selection stays the same.`
      : `Choose ${node.label}. ${COLUMNS[node.column]} scope. ${number(selection.selectedCount)} of ${number(node.availableCount)} questions included. Replace the current scope in ${subjectLabel}.`;
  }
  function renderMobile(node: ChartNode) {
    const selection = selections.get(node.id)!;
    const children = mobileChildren.get(node.id) || [];
    return <li key={node.id} className="scope-mobile-node" data-state={selection.state} data-active={node.active} data-aggregate={node.aggregate} data-scope-id={node.id} data-available-count={node.availableCount} data-selected-count={selection.selectedCount}>
      <div className="scope-mobile-row">
        <button className="scope-mobile-select" disabled={disabled} onClick={() => choose(node)} aria-label={selectionLabel(node, selection)} aria-pressed={node.aggregate ? undefined : selection.state === "partial" ? "mixed" : selection.state === "all"} aria-expanded={node.aggregate ? false : undefined} aria-current={node.id === focus?.id ? "true" : undefined}>
          <span className="scope-flow-node-label">{node.label}{node.aggregate ? " +" : ""}</span>
          <span className="scope-flow-node-count">{number(selection.selectedCount)} selected / {number(node.availableCount)} available</span>
        </button>
      </div>
      {children.length ? <ul className="scope-mobile-tree">{children.map(renderMobile)}</ul> : null}
    </li>;
  }

  if (!focus) return <div className="outline-empty"><strong>No subject selected</strong><span>Choose a subject to explore its sections, topics and subtopics.</span></div>;
  return <section className="scope-flow" aria-label={`${subjectLabel} question flow`} style={{ "--scope-colour": "#475569" } as CSSProperties}>
    <div className="scope-flow-legend" aria-label="Question source colours">
      {PYQ_EXAMS.map((exam) => <span key={exam} data-exam={exam}><i aria-hidden="true" style={{ background: PYQ_EXAM_COLORS[exam] }} />{exam}</span>)}
      <small>Each colour is an exam. Pale ribbons show available questions; stronger colour shows your selection. Select a branch to narrow your practice.</small>
    </div>
    <button className="scope-overview-toggle" type="button" disabled={disabled} aria-expanded={showOverview} onClick={() => setShowOverview((value) => !value)}>{showOverview ? "Return to hierarchy" : "View Sankey flow overview"}</button>
    <div className="scope-flow-scroll" data-overview={showOverview}>
      <div className="scope-flow-canvas" data-focus-id={focus.id} style={{ width: WIDTH, height: layout.height, position: "relative" }}>
        <svg className="scope-flow-svg" width={WIDTH} height={layout.height} aria-hidden="true" focusable="false" style={{ position: "absolute", inset: 0 }}>
          <g className="scope-flow-base-links">{layout.links.flatMap((link) => examLanes(link, selections).map((lane) => <path
            key={`${(link.source as ChartNode).id}:${(link.target as ChartNode).id}:${lane.exam}`}
            data-exam={lane.exam} data-layer="available" data-question-count={lane.availableCount}
            data-source-id={(link.source as ChartNode).id} data-target-id={(link.target as ChartNode).id}
            d={ribbonPath(link, lane.sourceCenter, lane.targetCenter)} fill="none" stroke={PYQ_EXAM_COLORS[lane.exam]} strokeOpacity=".075" strokeWidth={lane.availableWidth}
          />))}</g>
          <g className="scope-flow-selected-links">{layout.links.flatMap((link) => examLanes(link, selections).flatMap((lane) => lane.selectedCount > 0 ? [<path
            key={`${(link.source as ChartNode).id}:${(link.target as ChartNode).id}:${lane.exam}`}
            data-exam={lane.exam} data-layer="selected" data-question-count={lane.selectedCount}
            data-source-id={(link.source as ChartNode).id} data-target-id={(link.target as ChartNode).id}
            d={ribbonPath(link, lane.sourceCenter, lane.targetCenter)} fill="none" stroke={PYQ_EXAM_COLORS[lane.exam]} strokeOpacity=".3" strokeWidth={lane.selectedWidth}
          />] : []))}</g>
          {layout.nodes.map((node) => {
            const center = ((node.y0 || 0) + (node.y1 || 0)) / 2;
            const labelCenter = layout.labelCenters.get(node.id) || center;
            return <g key={node.id} className="scope-flow-bars" data-active={node.active}>
              {nodeSegments(node, selections).map((segment) => <g key={segment.id} data-exam={segment.exam}>
                <rect x={segment.x} y={segment.availableY} width={segment.width} height={segment.availableHeight} fill={PYQ_EXAM_COLORS[segment.exam]} fillOpacity=".14" />
                {segment.selectedHeight > 0 ? <rect x={segment.x} y={segment.selectedY} width={segment.width} height={segment.selectedHeight} fill={PYQ_EXAM_COLORS[segment.exam]} fillOpacity=".7" /> : null}
              </g>)}
              <path className="scope-flow-leader" d={`M${node.x1},${center}L${node.column * COLUMN_WIDTH + 38},${labelCenter}`} fill="none" stroke="#94a3b8" strokeOpacity=".5" />
            </g>;
          })}
        </svg>
        <div className="scope-flow-columns">{COLUMNS.map((label, column) => <div key={label} style={{ position: "absolute", left: column * COLUMN_WIDTH + 18, top: 12, width: CARD_WIDTH }}>{label}</div>)}</div>
        {layout.nodes.map((node) => {
          const selection = selections.get(node.id)!;
          return <div key={node.id} className={`scope-flow-node${node.aggregate ? " scope-flow-aggregate" : ""}`} data-state={selection.state} data-active={node.active} data-aggregate={node.aggregate} data-scope-id={node.id} data-available-count={node.availableCount} data-selected-count={selection.selectedCount}
            style={{ position: "absolute", left: node.column * COLUMN_WIDTH + 38, top: (layout.labelCenters.get(node.id) || 98) - 32, width: CARD_WIDTH, minHeight: 64 }}>
            <button className="scope-flow-select" disabled={disabled} onClick={() => choose(node)} aria-label={selectionLabel(node, selection)} aria-pressed={node.aggregate ? undefined : selection.state === "partial" ? "mixed" : selection.state === "all"} aria-expanded={node.aggregate ? false : undefined} aria-current={node.id === focus.id ? "true" : undefined}>
              <span className="scope-flow-node-label">{node.label}{node.aggregate ? " +" : ""}</span>
              <span className="scope-flow-node-count">{number(selection.selectedCount)} selected / {number(node.availableCount)} available</span>
            </button>
          </div>;
        })}
        {COLUMNS.map((label, column) => layout.nodes.some((node) => node.column === column) ? null : <p key={label} className="scope-flow-empty-column" style={{ position: "absolute", left: column * COLUMN_WIDTH + 38, top: 154, width: CARD_WIDTH }}>{column === 2 ? "Choose a section to see its topics." : "Choose a topic to see its subtopics."}</p>)}
      </div>
    </div>
    <div className="scope-flow-mobile" data-overview={showOverview}><p className="scope-mobile-hint">Select a branch to narrow your practice. Use the path above to browse back without changing your selection.</p><ul className="scope-mobile-tree">{layout.nodes.filter((node) => node.column === 0).map(renderMobile)}</ul></div>
    {[...expandedContext].filter((id) => layout.nodes.some((node) => node.id === id) && (index.childrenById.get(id)?.length || 0) > 1).map((id) => <button key={id} className="scope-flow-context-toggle" disabled={disabled} onClick={() => toggleContext(id)}>Collapse other {index.nodesById.get(id)?.label} branches</button>)}
  </section>;
}
