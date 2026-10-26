import type {
  ExamCounts,
  PracticeInventoryNode,
  PracticeSubject,
  PyqExam,
  SubjectPracticeInventory,
} from "./pyq-catalog";

/** Presence selects a leaf; an empty list intentionally selects no sources. */
export type SelectionPaths = Record<string, PyqExam[]>;
export type ScopeNode = PracticeInventoryNode | (PracticeSubject & {
  kind: "subject";
  subjectId: string;
  parentId?: undefined;
});
export type SelectionIndex = {
  nodesById: Map<string, ScopeNode>;
  childrenById: Map<string, ScopeNode[]>;
  leavesById: Map<string, PracticeInventoryNode[]>;
};
export type SelectionState = "none" | "partial" | "all";

const EXAMS: readonly PyqExam[] = ["CSE", "CAPF", "CDS", "NDA"];
const emptyCounts = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });
const hasPath = (paths: SelectionPaths, id: string) => Object.hasOwn(paths, id);
function questionIdsForPaths(paths: SelectionPaths, index: SelectionIndex): Set<string> | null {
  const ids = new Set<string>();
  for (const [id, exams] of Object.entries(paths)) {
    const leaf = index.nodesById.get(id);
    if (!leaf || leaf.kind !== 'subtopic') continue;
    if (!leaf.questionIdsByExam) return null;
    for (const exam of EXAMS) if (exams.includes(exam)) for (const questionId of leaf.questionIdsByExam[exam]) ids.add(questionId);
  }
  return ids;
}
const copyPaths = (paths: SelectionPaths): SelectionPaths =>
  Object.fromEntries(Object.entries(paths).map(([id, exams]) => [id, [...exams]]));

/** Build one ordered, ancestry-safe lookup shared by the selector and chart. */
export function buildSelectionIndex(inventory: SubjectPracticeInventory): SelectionIndex {
  const nodesById = new Map<string, ScopeNode>();
  const childrenById = new Map<string, ScopeNode[]>();
  const leavesById = new Map<string, PracticeInventoryNode[]>();

  for (const subject of inventory.subjects) {
    nodesById.set(subject.id, { ...subject, kind: "subject", subjectId: subject.id });
  }
  for (const node of inventory.nodes) {
    if (nodesById.has(node.id)) throw new Error(`Duplicate practice scope: ${node.id}`);
    nodesById.set(node.id, node);
  }
  for (const node of inventory.nodes) {
    if (!node.parentId || !nodesById.has(node.parentId)) {
      throw new Error(`Missing parent for practice scope: ${node.id}`);
    }
    const parent = nodesById.get(node.parentId)!;
    if (parent.subjectId !== node.subjectId) {
      throw new Error(`Practice scope crosses subjects: ${node.id}`);
    }
    const children = childrenById.get(node.parentId) || [];
    children.push(node);
    childrenById.set(node.parentId, children);
  }
  for (const children of childrenById.values()) {
    children.sort((a, b) => ("order" in a ? a.order : 0) - ("order" in b ? b.order : 0) || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  }

  const visiting = new Set<string>();
  function descend(id: string): PracticeInventoryNode[] {
    const cached = leavesById.get(id);
    if (cached) return cached;
    if (visiting.has(id)) throw new Error(`Cyclic practice scope: ${id}`);
    visiting.add(id);
    const node = nodesById.get(id)!;
    const leaves = node.kind === "subtopic"
      ? [node]
      : (childrenById.get(id) || []).filter(child=>node.legacyOnly||!child.legacyOnly).flatMap((child) => descend(child.id));
    visiting.delete(id);
    leavesById.set(id, leaves);
    return leaves;
  }
  for (const id of nodesById.keys()) descend(id);
  return { nodesById, childrenById, leavesById };
}

/** Exam entry pages never fall back to another examination. */
export function defaultSources(leaf: PracticeInventoryNode, preferredExam?: PyqExam): PyqExam[] {
  return (preferredExam ? [preferredExam] : EXAMS).filter((exam) => leaf.examCounts[exam] > 0);
}

/** Infer subject defaults from its authoritative paths, not a competing flag.
 * Mixed overrides retain any enabled source; sources absent from the existing
 * leaves retain the entry page's defaults (important for zero-CSE branches).
 */
function sourcesForNewLeaf(paths: SelectionPaths, leaf: PracticeInventoryNode, index: SelectionIndex, preferredExam?: PyqExam): PyqExam[] {
  const existing = (index.leavesById.get(leaf.subjectId) || []).filter((node) => hasPath(paths, node.id));
  return EXAMS.filter((exam) => {
    if (leaf.examCounts[exam] === 0) return false;
    const eligible = existing.filter((node) => node.examCounts[exam] > 0);
    return eligible.length ? eligible.some((node) => paths[node.id].includes(exam)) : !preferredExam || exam === preferredExam;
  });
}

/** Narrow or broaden only this subject; keep overlapping source overrides. */
export function replaceScope(
  paths: SelectionPaths,
  scopeId: string,
  index: SelectionIndex,
  preferredExam?: PyqExam,
): SelectionPaths {
  const scope = index.nodesById.get(scopeId);
  if (!scope) return copyPaths(paths);
  const next = Object.fromEntries(Object.entries(paths)
    .filter(([id]) => index.nodesById.get(id)?.subjectId !== scope.subjectId)
    .map(([id, exams]) => [id, [...exams]]));
  for (const leaf of index.leavesById.get(scopeId) || []) {
    next[leaf.id] = hasPath(paths, leaf.id) ? [...paths[leaf.id]] : sourcesForNewLeaf(paths, leaf, index, preferredExam);
  }
  return next;
}

/** Explicit additions are a union, never a second copy of the same question. */
export function addScope(
  paths: SelectionPaths,
  scopeId: string,
  index: SelectionIndex,
  preferredExam?: PyqExam,
): SelectionPaths {
  const next = copyPaths(paths);
  for (const leaf of index.leavesById.get(scopeId) || []) {
    if (!hasPath(paths, leaf.id)) next[leaf.id] = sourcesForNewLeaf(paths, leaf, index, preferredExam);
  }
  return next;
}

export function removeScope(paths: SelectionPaths, scopeId: string, index: SelectionIndex): SelectionPaths {
  const next = copyPaths(paths);
  for (const leaf of index.leavesById.get(scopeId) || []) delete next[leaf.id];
  return next;
}

/** Adjust only selected leaves which actually contain this exam's questions. */
export function setScopeExam(
  paths: SelectionPaths,
  scopeId: string,
  exam: PyqExam,
  enabled: boolean,
  index: SelectionIndex,
): SelectionPaths {
  const next = copyPaths(paths);
  if (!EXAMS.includes(exam)) return next;
  for (const leaf of index.leavesById.get(scopeId) || []) {
    if (!hasPath(paths, leaf.id) || leaf.examCounts[exam] === 0) continue;
    const current = new Set(paths[leaf.id]);
    if (enabled) current.add(exam);
    else current.delete(exam);
    next[leaf.id] = EXAMS.filter((source) => current.has(source) && leaf.examCounts[source] > 0);
  }
  return next;
}

export function selectionCounts(paths: SelectionPaths, index: SelectionIndex): {
  matchingCount: number;
  examTotals: ExamCounts;
  subjectIds: string[];
  leafCount: number;
} {
  const examTotals = emptyCounts();
  const examQuestionIds = Object.fromEntries(EXAMS.map(exam => [exam, new Set<string>()])) as Record<PyqExam, Set<string>>;
  const subjects = new Set<string>();
  let leafCount = 0;
  for (const [id, exams] of Object.entries(paths)) {
    const leaf = index.nodesById.get(id);
    if (!leaf || leaf.kind !== "subtopic") continue;
    subjects.add(leaf.subjectId);
    leafCount += 1;
    for (const exam of EXAMS) {
      if (exams.includes(exam)) {
        if (leaf.questionIdsByExam) for (const questionId of leaf.questionIdsByExam[exam]) examQuestionIds[exam].add(questionId);
        else examTotals[exam] += leaf.examCounts[exam];
      }
    }
  }
  // Preserve the inventory's subject order, rather than click order.
  for (const exam of EXAMS) examTotals[exam] += examQuestionIds[exam].size;
  const subjectIds = [...index.nodesById.values()]
    .filter((node) => node.kind === "subject" && subjects.has(node.id))
    .map((node) => node.id);
  return {
    matchingCount: EXAMS.reduce((sum, exam) => sum + examTotals[exam], 0),
    examTotals,
    subjectIds,
    leafCount,
  };
}

export function scopeMetrics(scopeId: string, paths: SelectionPaths, index: SelectionIndex): {
  availableCount: number;
  selectedCount: number;
  state: SelectionState;
  examStates: Record<PyqExam, SelectionState>;
} {
  const leaves = index.leavesById.get(scopeId) || [];
  const selectedLeaves = leaves.filter((leaf) => hasPath(paths, leaf.id));
  const selectedIds = questionIdsForPaths(paths, index);
  if (selectedIds && leaves.every(leaf => Boolean(leaf.questionIdsByExam))) {
    const availableByExam = Object.fromEntries(EXAMS.map(exam => [exam, new Set(leaves.flatMap(leaf => leaf.questionIdsByExam![exam]))])) as Record<PyqExam, Set<string>>;
    const availableIds = new Set(EXAMS.flatMap(exam => [...availableByExam[exam]]));
    const selectedCount = [...availableIds].filter(id => selectedIds.has(id)).length;
    const examStates = Object.fromEntries(EXAMS.map(exam => {
      const available = availableByExam[exam];
      const count = [...available].filter(id => selectedIds.has(id)).length;
      return [exam, count === 0 ? 'none' : count === available.size ? 'all' : 'partial'];
    })) as Record<PyqExam, SelectionState>;
    return { availableCount: availableIds.size, selectedCount, state: selectedCount === 0 ? 'none' : selectedCount === availableIds.size ? 'all' : 'partial', examStates };
  }
  const examStates = Object.fromEntries(EXAMS.map((exam) => {
    const eligible = selectedLeaves.filter((leaf) => leaf.examCounts[exam] > 0);
    const enabled = eligible.filter((leaf) => paths[leaf.id].includes(exam)).length;
    return [exam, enabled === 0 ? "none" : enabled === eligible.length ? "all" : "partial"];
  })) as Record<PyqExam, SelectionState>;
  const selectedCount = selectedLeaves.reduce((sum, leaf) => sum + EXAMS.reduce(
    (count, exam) => count + (paths[leaf.id].includes(exam) ? leaf.examCounts[exam] : 0), 0,
  ), 0);
  return {
    availableCount: index.nodesById.get(scopeId)?.questionCount || 0,
    selectedCount,
    state: selectedLeaves.length === 0 ? "none" : selectedLeaves.length === leaves.length ? "all" : "partial",
    examStates,
  };
}

/** Partition selected leaves into the highest completely covered branches. */
export function selectedScopeIds(paths: SelectionPaths, index: SelectionIndex): string[] {
  const result: string[] = [];
  function visit(scope: ScopeNode) {
    const leaves = index.leavesById.get(scope.id) || [];
    const selected = leaves.filter((leaf) => hasPath(paths, leaf.id)).length;
    if (selected === 0) return;
    if (selected === leaves.length) result.push(scope.id);
    else for (const child of index.childrenById.get(scope.id) || []) visit(child);
  }
  for (const scope of index.nodesById.values()) {
    if (scope.kind === "subject"&&!scope.legacyOnly) visit(scope);
  }
  for(const id of Object.keys(paths))if(index.nodesById.get(id)?.legacyOnly&&!result.includes(id))result.push(id);
  return result;
}

export function ancestors(scopeId: string, index: SelectionIndex): ScopeNode[] {
  const result: ScopeNode[] = [];
  let node = index.nodesById.get(scopeId);
  while (node) {
    result.unshift(node);
    node = node.parentId ? index.nodesById.get(node.parentId) : undefined;
  }
  return result;
}

/** Stable section (NDA maths), chapter and subpart display numbering. */
export function scopeDisplayNumber(scopeId: string, index: SelectionIndex): string | undefined {
  const path = ancestors(scopeId, index);
  const topic = path.find((node):node is PracticeInventoryNode => node.kind === "topic");
  const node = index.nodesById.get(scopeId);
  if (node?.kind === 'head' && index.nodesById.get(node.subjectId)?.label === 'Mathematics') return `Section ${node.order}`;
  if (!topic || !node) return undefined;
  if (node.kind === "topic") return `Chapter ${topic.order}`;
  if (node.kind === "subtopic") return `${topic.order}.${node.order}`;
  return undefined;
}

export function addedQuestionCount(
  paths: SelectionPaths,
  scopeId: string,
  index: SelectionIndex,
  preferredExam?: PyqExam,
): number {
  return selectionCounts(addScope(paths, scopeId, index, preferredExam), index).matchingCount
    - selectionCounts(paths, index).matchingCount;
}

/** Restore only recognized leaves/sources, preserving deliberate empty scopes. */
export function sanitizePaths(draft: unknown, index: SelectionIndex): SelectionPaths {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return {};
  const paths: SelectionPaths = {};
  for (const [id, sources] of Object.entries(draft)) {
    const leaf = index.nodesById.get(id);
    if (!leaf || leaf.kind !== "subtopic" || !Array.isArray(sources)) continue;
    paths[id] = EXAMS.filter((exam) => sources.includes(exam) && leaf.examCounts[exam] > 0);
  }
  return paths;
}

/** Restore current leaves and expand retired leaves through ancestry-safe aliases. */
export function sanitizePathsWithAliases(
  draft: unknown,
  index: SelectionIndex,
  aliases: Record<string, string[]>,
): SelectionPaths {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return {};
  const expanded: Record<string, unknown> = {};
  for (const [id, sources] of Object.entries(draft)) {
    const targetIds = index.nodesById.get(id) ? [id] : aliases[id] || [];
    for (const targetId of targetIds) {
      const existing = Array.isArray(expanded[targetId]) ? expanded[targetId] as unknown[] : [];
      expanded[targetId] = [...new Set([...existing, ...(Array.isArray(sources) ? sources : [])])];
    }
  }
  return sanitizePaths(expanded, index);
}

/** A pre-expansion draft must use its exact frozen scope, not a broader new leaf. */
export function restoreVersionedPaths(draft:unknown,index:SelectionIndex,aliases:Record<string,string[]>,restoreAliases:Record<string,string>,useFrozen:boolean):SelectionPaths {
  if(!draft||typeof draft!=='object'||Array.isArray(draft))return {};
  const migrated:Record<string,unknown>={};
  for(const [id,exams]of Object.entries(draft))migrated[useFrozen?(restoreAliases[id]||id):id]=exams;
  return sanitizePathsWithAliases(migrated,index,aliases);
}
