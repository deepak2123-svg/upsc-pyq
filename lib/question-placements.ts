/** Unique-ID placement primitives used by the reviewed, incrementally activated syllabus. */
export type PlacementNode = { id: string; parentId: string | null; kind: 'subject' | 'section' | 'chapter' | 'subpart' };
export type PlacementQuestion = { id: string; exam: 'CSE' | 'CAPF' | 'CDS' | 'NDA'; eligible: boolean };
export type ReviewedPlacement = {
  questionId: string;
  primaryId: string;
  additionalIds: string[];
  status: 'approved' | 'pending';
  rationale: string;
  secondPass: 'approved' | 'pending';
};
export type PlacementIndex = {
  nodes: Map<string, PlacementNode>;
  questions: Map<string, PlacementQuestion>;
  questionIdsByScope: Map<string, Set<string>>;
  primaryIdByQuestion: Map<string, string>;
};

export function buildPlacementIndex(nodes: PlacementNode[], questions: PlacementQuestion[], placements: ReviewedPlacement[]): PlacementIndex {
  const index: PlacementIndex = { nodes: new Map(), questions: new Map(), questionIdsByScope: new Map(), primaryIdByQuestion: new Map() };
  for (const node of nodes) {
    if (index.nodes.has(node.id)) throw new Error(`Duplicate scope: ${node.id}`);
    index.nodes.set(node.id, node);
    index.questionIdsByScope.set(node.id, new Set());
  }
  const levels = ['subject', 'section', 'chapter', 'subpart'];
  for (const node of nodes) {
    const parent = node.parentId ? index.nodes.get(node.parentId) : undefined;
    if (node.kind === 'subject' ? node.parentId !== null : !parent || levels.indexOf(parent.kind) !== levels.indexOf(node.kind) - 1) throw new Error(`Invalid hierarchy: ${node.id}`);
  }
  for (const question of questions) {
    if (index.questions.has(question.id)) throw new Error(`Duplicate question: ${question.id}`);
    index.questions.set(question.id, question);
  }
  const seen = new Set<string>();
  for (const placement of placements) {
    if (!index.questions.has(placement.questionId)) throw new Error(`Unknown question: ${placement.questionId}`);
    if (seen.has(placement.questionId)) throw new Error(`Duplicate placement record: ${placement.questionId}`);
    seen.add(placement.questionId);
    for (const id of [placement.primaryId, ...placement.additionalIds]) if (index.nodes.get(id)?.kind !== 'subpart') throw new Error(`Placement must resolve to a subpart: ${id}`);
    if (placement.status !== 'approved') continue;
    if (!placement.rationale.trim() || placement.secondPass !== 'approved') throw new Error(`Unreviewed approval: ${placement.questionId}`);
    index.primaryIdByQuestion.set(placement.questionId, placement.primaryId);
    if (!index.questions.get(placement.questionId)!.eligible) continue;
    for (const id of new Set([placement.primaryId, ...placement.additionalIds])) {
      let node: PlacementNode | undefined = index.nodes.get(id);
      while (node) {
        index.questionIdsByScope.get(node.id)!.add(placement.questionId);
        node = node.parentId ? index.nodes.get(node.parentId) : undefined;
      }
    }
  }
  return index;
}

/** Source masks are evaluated per selected scope, then unioned by canonical ID. */
export function placementSelection(index: PlacementIndex, scopes: Record<string, PlacementQuestion['exam'][]>): { questionIds: string[]; examCounts: Record<PlacementQuestion['exam'], number>; count: number } {
  const selected = new Set<string>();
  for (const [scopeId, exams] of Object.entries(scopes)) {
    if (!index.nodes.has(scopeId)) throw new Error(`Unknown selected scope: ${scopeId}`);
    for (const id of index.questionIdsByScope.get(scopeId)!) if (exams.includes(index.questions.get(id)!.exam)) selected.add(id);
  }
  const questionIds = [...selected].sort();
  const examCounts = { CSE: 0, CAPF: 0, CDS: 0, NDA: 0 };
  for (const id of questionIds) examCounts[index.questions.get(id)!.exam]++;
  return { questionIds, examCounts, count: questionIds.length };
}
