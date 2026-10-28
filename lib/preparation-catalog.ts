import { getSubjectPracticeInventory, getQuestionPath, historicalPyqQuestions, type PyqQuestion, type SubjectPracticeInventory, type PracticeInventoryNode, type ExamCounts, type PyqExam } from './pyq-catalog';
import { questionEligible, questionReview } from './question-review';
import { PREPARATION_VERSION, type PreparationExam, type PreparationView } from './preparation-exams';
import { englishSyllabus, elementaryMaths, ndaMaths, csatSyllabus, defenceWorldHistory, type SyllabusSection } from './preparation-syllabus';
import applicability from '../content/preparation-applicability.json' with { type: 'json' };
import officialNdaPlacements from '../content/nda-2026-i-preparation-placements.json' with {type:'json'};
import officialNdaIIPlacements from '../content/nda-2026-ii-preparation-placements.json' with {type:'json'};
import officialNda2025IIPlacements from '../content/nda-2025-ii-preparation-placements.json' with {type:'json'};
import officialNda2025IPlacements from '../content/nda-2025-i-preparation-placements.json' with {type:'json'};
import reviewedNda2024IIPlacements from '../content/nda-2024-ii-preparation-placements.json' with {type:'json'};
import officialNda2024IPlacements from '../content/nda-2024-i-preparation-placements.json' with {type:'json'};
import officialNda2023IIPlacements from '../content/nda-2023-ii-preparation-placements.json' with {type:'json'};
import officialNda2023IPlacements from '../content/nda-2023-i-preparation-placements.json' with {type:'json'};
import officialNda2022IIPlacements from '../content/nda-2022-ii-preparation-placements.json' with {type:'json'};
import {organiseNdaScience} from './nda-science-syllabus';

export type PreparationInventory = SubjectPracticeInventory & { preparationExam: PreparationExam; preparationViews: PreparationView[] };
const exams: PyqExam[] = ['CSE', 'CAPF', 'CDS', 'NDA'];
const zero = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
type Transfer = { questionId: string; target: PreparationExam; status: string; rationale: string };
type ReviewedPlacement = Transfer & { subtopicId: string };
const approved = new Set((applicability.approvedScienceTransfers as Transfer[])
  .filter(row => row.status === 'approved' && row.rationale.trim()).map(row => `${row.target}:${row.questionId}`));

/** Question membership, counts and server eligibility all come from this same projection.
 * Source-exam facts and answer/content revisions are never rewritten by a target view.
 */
// Only static, reviewed build inputs enter this bounded cache: no request/user data.
// A new deployment/module instance naturally invalidates all three entries.
const inventoryCache = new Map<PreparationExam, PreparationInventory>();
function freezeInventory<T>(value:T):T {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    for(const child of Object.values(value))freezeInventory(child);
    Object.freeze(value);
  }
  return value;
}
export function getPreparationInventory(target: PreparationExam): PreparationInventory {
  const cached=inventoryCache.get(target);
  if(cached)return cached;
  const inventory=freezeInventory(buildPreparationInventory(target));
  inventoryCache.set(target,inventory);
  return inventory;
}

/** Explorer does not consume graph edges. Preserve the full API contract separately. */
export function getPreparationExplorerInventory(target:PreparationExam):PreparationInventory {
  return {...getPreparationInventory(target),links:[]};
}

function buildPreparationInventory(target: PreparationExam): PreparationInventory {
  const base = getSubjectPracticeInventory();
  const scienceIds = new Set(base.nodes.filter(n => n.subjectId === 'subject:science' && n.kind === 'subtopic')
    .flatMap(n => exams.flatMap(exam => n.questionIdsByExam?.[exam] || [])));
  // Work on fresh arrays: never mutate the legacy catalogue or another target's view.
  let nodes: PracticeInventoryNode[] = base.nodes.filter(n => !n.legacyOnly).map(n => ({ ...n, examCounts: zero(), questionCount: 0,
    ...(n.kind === 'subtopic' ? { questionIdsByExam: Object.fromEntries(exams.map(exam => [exam,
      (n.questionIdsByExam?.[exam] || []).filter(id => !scienceIds.has(id) || exam === target || approved.has(`${target}:${id}`))
    ])) as Record<PyqExam, string[]> } : {}) }));
  const subjects = base.subjects.filter(s => !s.legacyOnly).map(s => ({ ...s, examCounts: zero(), questionCount: 0 }));
  function seed(label: string, key: string, sections: readonly SyllabusSection[]) {
    const subjectId = `subject:${key}`;
    if(!subjects.some(subject=>subject.id===subjectId))subjects.push({ id: subjectId, label, questionCount: 0, examCounts: zero() });
    sections.forEach(([section, chapters], i) => {
      const headId = `head:${key}:${slug(section)}`;
      nodes.push({ id: headId, label: section, kind: 'head', subjectId, parentId: subjectId, order: i + 1, questionCount: 0, examCounts: zero() });
      chapters.forEach(([chapter, subparts], j) => {
        const topicId = `topic:${key}:${slug(section)}:${slug(chapter)}`;
        nodes.push({ id: topicId, label: chapter, kind: 'topic', subjectId, parentId: headId, order: j + 1, questionCount: 0, examCounts: zero() });
        subparts.forEach((subpart, k) => nodes.push({ id: `${topicId.replace(/^topic:/, 'subtopic:')}:${slug(subpart)}`, label: subpart,
          kind: 'subtopic', subjectId, parentId: topicId, order: k + 1, questionCount: 0, examCounts: zero(), questionIdsByExam: { CSE: [], CAPF: [], CDS: [], NDA: [] } }));
      });
    });
    return subjectId;
  }
  const gsIds = subjects.map(s => s.id);
  let views: PreparationView[];
  if (target === 'NDA') {
    seed('History','history',defenceWorldHistory);
    const maths = seed('Mathematics', 'nda-mathematics', ndaMaths);
    const english = seed('English', 'english', englishSyllabus);
    views = [
      { id: 'nda-maths', paper: 'Mathematics', label: 'Mathematics', subjectIds: [maths] },
      { id: 'nda-english', paper: 'GAT', label: 'English', subjectIds: [english] },
      { id: 'nda-gs', paper: 'GAT', label: 'GS', subjectIds: gsIds.filter(id => id !== 'subject:science') },
      { id: 'nda-science', paper: 'GAT', label: 'Science', subjectIds: ['subject:science'] },
    ];
  } else if (target === 'CDS') {
    seed('History','history',defenceWorldHistory);
    const english = seed('English', 'english', englishSyllabus);
    const maths = seed('Elementary Mathematics', 'cds-mathematics', elementaryMaths);
    views = [
      { id: 'cds-english', paper: 'English', label: 'English', subjectIds: [english] },
      { id: 'cds-gk', paper: 'General Knowledge', label: 'General Knowledge', subjectIds: gsIds },
      { id: 'cds-maths', paper: 'Elementary Mathematics', label: 'Elementary Mathematics', subjectIds: [maths] },
    ];
  } else {
    const csat = seed('CSAT', 'csat', csatSyllabus);
    views = [
      { id: 'cse-gs', paper: 'GS Paper I', label: 'GS Paper I', subjectIds: gsIds },
      { id: 'cse-csat', paper: 'GS Paper II / CSAT', label: 'GS Paper II / CSAT', subjectIds: [csat] },
    ];
  }
  // Future English/maths/CSAT imports need explicit reviewed concept placements.
  // A historic global "outside GS" decision is not silently removed or promoted.
  const questions = new Map(historicalPyqQuestions.map(q => [q.id, q]));
  for (const row of [...applicability.approvedPlacements,...officialNdaPlacements,...officialNdaIIPlacements,...officialNda2025IIPlacements,...officialNda2025IPlacements,...reviewedNda2024IIPlacements,...officialNda2024IPlacements,...officialNda2023IIPlacements,...officialNda2023IPlacements,...officialNda2022IIPlacements] as ReviewedPlacement[]) {
    if (row.target !== target || row.status !== 'approved' || !row.rationale.trim()) continue;
    const question = questions.get(row.questionId);
    const leaf = nodes.find(n => n.kind === 'subtopic' && n.id === row.subtopicId);
    if (!question || !leaf || !questionReview(question.id) || !questionEligible(question.id)) throw new Error(`Invalid approved preparation placement: ${row.questionId}`);
    const members = leaf.questionIdsByExam![question.exam];
    if (!members.includes(question.id)) members.push(question.id);
  }
  if(target==='NDA')nodes=organiseNdaScience(nodes);
  const byId = new Map<string, { parentId?: string; examCounts: ExamCounts; questionCount: number }>([...subjects, ...nodes].map(n => [n.id, n]));
  const sets = new Map<string, Record<PyqExam, Set<string>>>();
  for (const leaf of nodes.filter(n => n.kind === 'subtopic')) {
    let id: string | undefined = leaf.id;
    while (id) {
      const set = sets.get(id) || { CSE: new Set<string>(), CAPF: new Set<string>(), CDS: new Set<string>(), NDA: new Set<string>() };
      for (const exam of exams) for (const q of leaf.questionIdsByExam?.[exam] || []) set[exam].add(q);
      sets.set(id, set); id = byId.get(id)?.parentId;
    }
  }
  for (const [id, node] of byId) {
    for (const exam of exams) node.examCounts[exam] = sets.get(id)?.[exam].size || 0;
    node.questionCount = exams.reduce((sum, exam) => sum + node.examCounts[exam], 0);
  }
  const all = new Set(nodes.filter(n => n.kind === 'subtopic').flatMap(n => exams.flatMap(e => n.questionIdsByExam?.[e] || [])));
  return { version: 4, taxonomyVersion: `${base.taxonomyVersion}:${PREPARATION_VERSION}:${target}`, preparationExam: target, preparationViews: views,
    totalCount: all.size, mappedCount: all.size, unmappedCount: 0, subjects, nodes: nodes as PracticeInventoryNode[],
    links: nodes.map(n => ({ source: n.parentId!, target: n.id, subjectId: n.subjectId, questionCount: n.questionCount, examCounts: n.examCounts })),
    legacyAliases: {}, legacyQuestionSets: {} };
}

export function preparationQuestionIds(inventory: SubjectPracticeInventory) {
  return new Set(inventory.nodes.filter(n => n.kind === 'subtopic').flatMap(n => exams.flatMap(exam => n.questionIdsByExam?.[exam] || [])));
}

/** New snapshots show the selected preparation syllabus, without rewriting any
 * original record or previously saved attempt. Build the index once per request.
 */
export function preparationPathResolver(inventory?:PreparationInventory){
 const nodes=new Map(inventory?.nodes.map(n=>[n.id,n]));
 return (question:PyqQuestion)=>{
  const path=getQuestionPath(question);
  if(inventory?.preparationExam!=='NDA'||path?.subjectId!=='subject:science')return path;
  const leaf=nodes.get(path.subtopicId),chapter=leaf?nodes.get(leaf.parentId):undefined;
  const head=chapter?nodes.get(chapter.parentId):undefined;
  return leaf&&chapter&&head?{...path,head:head.label,topic:chapter.label,subtopic:leaf.label,headId:head.id,topicId:chapter.id}:path;
 };
}

export function getPreparationQuestions(inventory: SubjectPracticeInventory) {
  const ids = preparationQuestionIds(inventory);
  return historicalPyqQuestions.filter(question => ids.has(question.id) && questionEligible(question.id));
}
