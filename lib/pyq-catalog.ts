import questionBank, {legacyQuestions} from "./combined-question-bank";
import { questionEligible,questionInGsScope } from './question-review';
import {canonicalSubjectLabel,subjectScopeKey,prelimsPaths,PRELIMS_TAXONOMY_VERSION} from './prelims-taxonomy';
import {bridgeLegacyPlacements,legacySnapshotQuestionIds} from './legacy-placement-bridge';
import { historicalPhysicalQuestionSets, historicalPhysicalTargets, slug as taxonomySlug, taxonomyIdForLegacyQuestion, taxonomyIdForQuestion, taxonomyNode } from "./taxonomy";
import { PYQ_EXAMS, type PyqExam } from "./pyq-exams";
export { PYQ_EXAMS, type PyqExam } from "./pyq-exams";

export type PyqQuestion = {
  sharedContext?: {id:string;label:string;promptLines:string[]};
  id: string;
  origin: "pyq";
  sourceTextLocked: boolean;
  sourceTextHash: string;
  exam: PyqExam;
  year: number;
  paper: string;
  questionNumber: number;
  subject: string;
  topic: string;
  subtopic: string;
  promptLines: string[];
  underlined?: string[];
  options: Record<string, string>;
  answer: string;
  acceptedAnswers?: string[];
  explanation: string;
  taxonomyId?: string | null;
  taxonomyHead?: string | null;
  taxonomyChapter?: string | null;
  taxonomySubtopic?: string | null;
  requiresFigure?: boolean;
  figureKey?: string | null;
  figureAlt?: string | null;
  additionalPaths?: { subject: string; head: string; chapter: string; subtopic: string; taxonomyId?:string }[];
};

export type TaxonomyNode = {
  id: string;
  label: string;
  kind: "subject" | "topic" | "subtopic";
  questionCount: number;
  parentId?: string;
};

export type TaxonomyLink = {
  source: string;
  target: string;
  questionCount: number;
};

export type ExamCounts = Record<PyqExam, number>;

export type PracticeSubject = {
  id: string;
  label: string;
  questionCount: number;
  examCounts: ExamCounts;
  legacyOnly?:boolean;
};

export type PracticeInventoryNode = {
  id: string;
  label: string;
  kind: "head" | "topic" | "subtopic";
  subjectId: string;
  questionCount: number;
  examCounts: ExamCounts;
  parentId?: string;
  order: number;
  questionIdsByExam?: Record<PyqExam, string[]>;
  legacyOnly?:boolean;
};

export type PracticeInventoryLink = {
  source: string;
  target: string;
  subjectId: string;
  questionCount: number;
  examCounts: ExamCounts;
};

export type SubjectPracticeInventory = {
  version: 3 | 4;
  taxonomyVersion?:string;
  legacyRestoreAliases?:Record<string,string>;
  totalCount: number;
  mappedCount: number;
  unmappedCount: number;
  subjects: PracticeSubject[];
  nodes: PracticeInventoryNode[];
  links: PracticeInventoryLink[];
  legacyAliases: Record<string, string[]>;
  legacyQuestionSets: Record<string, string[]>;
};

export type ArchiveInventory = {
  exam: PyqExam;
  years: number[];
  yearFrom: number;
  yearTo: number;
  totalCount: number;
  mappedCount: number;
  unmappedCount: number;
  nodes: TaxonomyNode[];
  links: TaxonomyLink[];
};

export const historicalPyqQuestions = (questionBank.questions as PyqQuestion[]).filter(
  (question) => question.origin === "pyq" && question.sourceTextLocked,
);
export const pyqQuestions = historicalPyqQuestions.filter(question => questionEligible(question.id)&&questionInGsScope(question.id));
const legacyQuestionById=new Map((legacyQuestions as PyqQuestion[]).map(q=>[q.id,q]));

const examNames: Record<PyqExam, { name: string; paper: string }> = {
  CSE: { name: "Civil Services Examination", paper: "General Studies Paper I" },
  CAPF: { name: "Central Armed Police Forces", paper: "Paper I" },
  CDS: { name: "Combined Defence Services", paper: "General Knowledge" },
  NDA: { name: "National Defence Academy", paper: "General Ability" },
};

export function getExamSummary(exam: PyqExam) {
  const questions = pyqQuestions.filter((question) => question.exam === exam);
  const years = [...new Set(questions.map((question) => question.year))].sort((a, b) => a - b);
  const subjects = [...new Set(questions.map((question) => question.subject))].sort();
  return {
    exam,
    ...examNames[exam],
    questionCount: questions.length,
    yearFrom: years[0],
    yearTo: years.at(-1),
    subjects,
  };
}

export function getExamQuestions(exam: PyqExam, yearFrom?: number, yearTo?: number) {
  return pyqQuestions.filter(
    (question) =>
      question.exam === exam &&
      (!yearFrom || question.year >= yearFrom) &&
      (!yearTo || question.year <= yearTo),
  );
}

export function isPyqExam(value: unknown): value is PyqExam {
  return typeof value === "string" && PYQ_EXAMS.includes(value.toUpperCase() as PyqExam);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function questionPath(question: PyqQuestion,canonicalLabels:boolean) {
  if (
    question.subject === "General Studies" &&
    question.topic === "General" &&
    question.subtopic === "General"
  ) return null;

  const mappedNode = taxonomyNode(question.taxonomyId || taxonomyIdForQuestion(question.id) || taxonomyIdForLegacyQuestion(question) || "");
  const subject = canonicalLabels?canonicalSubjectLabel(mappedNode?.subject || question.subject):mappedNode?.subject || question.subject;
  const rawHead = mappedNode?.head || question.taxonomyHead || (subject === "Environment" ? "Environment & Ecology" : subject);
  const head = subject === "Geography" && rawHead === "Geography" ? "Other Geography" : rawHead;
  const topic = mappedNode?.chapter || question.taxonomyChapter || question.topic;
  const subtopic = mappedNode?.subtopic || question.taxonomySubtopic || question.subtopic;
  const subjectKey=canonicalLabels?subjectScopeKey(subject):slug(subject);
  const subjectId = `subject:${subjectKey}`;
  const headId = `head:${subjectKey}:${slug(head)}`;
  const topicId = `topic:${subjectKey}:${slug(head)}:${slug(topic)}`;
  const subtopicId = `subtopic:${subjectKey}:${slug(head)}:${slug(topic)}:${slug(subtopic)}`;
  return {
    subject, head, topic, subtopic, subjectId, headId, topicId, subtopicId, taxonomyId:mappedNode?.id||question.taxonomyId||undefined,
    headOrder: mappedNode?.headOrder??(mappedNode?.head === "Physical Geography" ? 1 : 100),
    topicOrder: mappedNode?.chapterOrder ?? 100,
    subtopicOrder: mappedNode?.subtopicOrder ?? 100,
  };
}
export function getQuestionPath(question:PyqQuestion){return questionPath(question,true);}
export function getLegacyQuestionPath(question:PyqQuestion){return questionPath(legacyQuestionById.get(question.id)||question,false);}

const emptyExamCounts = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });

/** Additional locations are reviewed source data, never duplicated question rows. */
export function getQuestionPaths(question: PyqQuestion) {
  const primary = getQuestionPath(question);
  const paths = primary ? [primary] : [];
  for (const place of question.additionalPaths || []) {
    const subject=canonicalSubjectLabel(place.subject);
    const { head, chapter: topic, subtopic } = place;
    const mapped=place.taxonomyId?taxonomyNode(place.taxonomyId):undefined;
    const key=subjectScopeKey(subject);
    const subjectId = `subject:${key}`;
    const headId = `head:${key}:${slug(head)}`;
    const topicId = `topic:${key}:${slug(head)}:${slug(topic)}`;
    const subtopicId = `subtopic:${key}:${slug(head)}:${slug(topic)}:${slug(subtopic)}`;
    if (!paths.some(path => path.subtopicId === subtopicId)) paths.push({ subject, head, topic, subtopic, subjectId, headId, topicId, subtopicId, taxonomyId:mapped?.id||place.taxonomyId||undefined, headOrder: mapped?.headOrder??100, topicOrder: mapped?.chapterOrder??100, subtopicOrder: mapped?.subtopicOrder??100 });
  }
  return paths;
}

function incrementExam(counts: ExamCounts, exam: PyqExam) {
  counts[exam] += 1;
}

export function getSubjectPracticeInventory(multiPlacement = true): SubjectPracticeInventory {
  const subjects = new Map<string, PracticeSubject>();
  const nodes = new Map<string, PracticeInventoryNode>();
  const links = new Map<string, PracticeInventoryLink>();
  const legacyAliases = new Map<string, Set<string>>();
  let mappedCount = 0;

  if(multiPlacement)for(const leaf of prelimsPaths) {
    const key=subjectScopeKey(leaf.subject);
    const subjectId=`subject:${key}`,headId=`head:${key}:${slug(leaf.head)}`,topicId=`topic:${key}:${slug(leaf.head)}:${slug(leaf.chapter)}`,subtopicId=`subtopic:${key}:${slug(leaf.head)}:${slug(leaf.chapter)}:${slug(leaf.subtopic)}`;
    if(!subjects.has(subjectId))subjects.set(subjectId,{id:subjectId,label:leaf.subject,questionCount:0,examCounts:emptyExamCounts()});
    const seed:PracticeInventoryNode[]=[
      {id:headId,label:leaf.head,kind:'head',subjectId,parentId:subjectId,order:leaf.headOrder,questionCount:0,examCounts:emptyExamCounts()},
      {id:topicId,label:leaf.chapter,kind:'topic',subjectId,parentId:headId,order:leaf.chapterOrder,questionCount:0,examCounts:emptyExamCounts()},
      {id:subtopicId,label:leaf.subtopic,kind:'subtopic',subjectId,parentId:topicId,order:leaf.subtopicOrder,questionCount:0,examCounts:emptyExamCounts(),questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:[]}},
    ];
    for(const node of seed)if(!nodes.has(node.id))nodes.set(node.id,node);
    for(const [source,target]of[[subjectId,headId],[headId,topicId],[topicId,subtopicId]])if(!links.has(`${source}->${target}`))links.set(`${source}->${target}`,{source,target,subjectId,questionCount:0,examCounts:emptyExamCounts()});
  }

  for (const question of pyqQuestions) {
    const primary = multiPlacement?getQuestionPath(question):getLegacyQuestionPath(question);
    const paths = multiPlacement ? getQuestionPaths(question) : primary ? [primary] : [];
    if (!paths.length) continue;
    mappedCount += 1;
    const seen = new Set<string>();
    for (const path of paths) {
    const legacyId = `subtopic:${slug(path.subject)}:${slug(path.topic)}:${slug(path.subtopic)}`;
    const aliases = legacyAliases.get(legacyId) || new Set<string>();
    aliases.add(path.subtopicId);
    legacyAliases.set(legacyId, aliases);

    const subject = subjects.get(path.subjectId) || {
      id: path.subjectId,
      label: path.subject,
      questionCount: 0,
      examCounts: emptyExamCounts(),
    };
    if (!seen.has(subject.id)) {
      subject.questionCount += 1;
      incrementExam(subject.examCounts, question.exam);
      seen.add(subject.id);
    }
    subjects.set(subject.id, subject);

    const pathNodes: PracticeInventoryNode[] = [
      { id: path.headId, label: path.head, kind: "head", subjectId: path.subjectId, parentId: path.subjectId, order: path.headOrder, questionCount: 0, examCounts: emptyExamCounts() },
      { id: path.topicId, label: path.topic, kind: "topic", subjectId: path.subjectId, parentId: path.headId, order: path.topicOrder, questionCount: 0, examCounts: emptyExamCounts() },
      { id: path.subtopicId, label: path.subtopic, kind: "subtopic", subjectId: path.subjectId, parentId: path.topicId, order: path.subtopicOrder, questionCount: 0, examCounts: emptyExamCounts() },
    ];
    for (const nextNode of pathNodes) {
      const current = nodes.get(nextNode.id) || nextNode;
      if (!seen.has(current.id)) {
        current.questionCount += 1;
        incrementExam(current.examCounts, question.exam);
        seen.add(current.id);
      }
      if (multiPlacement && current.kind === 'subtopic') {
        current.questionIdsByExam ||= { CSE: [], CAPF: [], CDS: [], NDA: [] };
        if (!current.questionIdsByExam[question.exam].includes(question.id)) current.questionIdsByExam[question.exam].push(question.id);
      }
      nodes.set(current.id, current);
    }

    for (const [source, target] of [[path.subjectId, path.headId], [path.headId, path.topicId], [path.topicId, path.subtopicId]]) {
      const linkKey = `${source}->${target}`;
      const link = links.get(linkKey) || {
        source,
        target,
        subjectId: path.subjectId,
        questionCount: 0,
        examCounts: emptyExamCounts(),
      };
      if (!seen.has(`link:${linkKey}`)) {
        link.questionCount += 1;
        incrementExam(link.examCounts, question.exam);
        seen.add(`link:${linkKey}`);
      }
      links.set(linkKey, link);
    }
    }
  }

  const legacyRestoreAliases=multiPlacement?bridgeLegacyPlacements(subjects,nodes,new Map(pyqQuestions.map(q=>[q.id,q.exam]))):undefined;
  if(multiPlacement)for(const node of nodes.values())if(node.legacyOnly&&node.parentId)links.set(`${node.parentId}->${node.id}`,{source:node.parentId,target:node.id,subjectId:node.subjectId,questionCount:node.questionCount,examCounts:node.examCounts});
  const legacyQuestionSets: Record<string, string[]> = {};
  for (const [oldTaxonomyId, questionIds] of Object.entries(historicalPhysicalQuestionSets)) {
    const [, oldChapter, oldSubtopic] = oldTaxonomyId.split("/");
    const legacyId = `subtopic:geography:physical-geography:${oldChapter}:${oldSubtopic}`;
    const ancestryUnsafeId = `subtopic:geography:${oldChapter}:${oldSubtopic}`;
    // Match the V3 snapshot gate: clearing a held question must not broaden an
    // old implicit membership beyond its frozen historical inventory.
    const legacyEligible=questionIds.filter(id=>questionEligible(id)&&questionInGsScope(id)&&legacySnapshotQuestionIds.has(id));
    legacyQuestionSets[legacyId] = legacyEligible;
    legacyQuestionSets[ancestryUnsafeId] = legacyEligible;
    const targets = historicalPhysicalTargets[oldTaxonomyId] || [];
    const aliases = legacyAliases.get(legacyId) || new Set<string>();
    for (const target of targets) {
      const node = taxonomyNode(target);
      if (node) aliases.add(`subtopic:geography:physical-geography:${taxonomySlug(node.chapter)}:${taxonomySlug(node.subtopic)}`);
    }
    legacyAliases.set(legacyId, aliases);
    legacyAliases.set(ancestryUnsafeId, new Set(aliases));
  }

  const subjectOrder = new Map(["Geography", "History", "Polity & Governance", "Economy", "Environment & Ecology", "Science & Technology", "Social Development", "International Relations & Organisations", "Current Affairs", "Environment", "Polity"].map((label, index) => [label, index]));
  return {
    version: multiPlacement ? 4 : 3,
    ...(multiPlacement?{taxonomyVersion:PRELIMS_TAXONOMY_VERSION,legacyRestoreAliases}:{}),
    totalCount: pyqQuestions.length,
    mappedCount,
    unmappedCount: pyqQuestions.length - mappedCount,
    subjects: [...subjects.values()].sort((a, b) => (subjectOrder.get(a.label) ?? 99) - (subjectOrder.get(b.label) ?? 99) || a.label.localeCompare(b.label)),
    nodes: [...nodes.values()].sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.kind.localeCompare(b.kind) || a.order - b.order || a.label.localeCompare(b.label)),
    links: [...links.values()].sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.source.localeCompare(b.source) || a.target.localeCompare(b.target)),
    legacyAliases: Object.fromEntries([...legacyAliases.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, aliases]) => [id, [...aliases].sort()])),
    legacyQuestionSets,
  };
}

export function getArchiveInventory(exam: PyqExam, requestedFrom?: number, requestedTo?: number): ArchiveInventory {
  const allQuestions = getExamQuestions(exam);
  const years = [...new Set(allQuestions.map((question) => question.year))].sort((a, b) => a - b);
  const yearFrom = Math.max(years[0], requestedFrom || years[0]);
  const yearTo = Math.min(years.at(-1) || years[0], requestedTo || years.at(-1) || years[0]);
  const questions = getExamQuestions(exam, yearFrom, yearTo);
  const nodes = new Map<string, TaxonomyNode>();
  const links = new Map<string, TaxonomyLink>();
  let mappedCount = 0;

  for (const question of questions) {
    const path = getQuestionPath(question);
    if (!path) continue;
    mappedCount += 1;
    const pathNodes: TaxonomyNode[] = [
      { id: path.subjectId, label: path.subject, kind: "subject", questionCount: 0 },
      { id: path.topicId, label: path.topic, kind: "topic", questionCount: 0, parentId: path.subjectId },
      { id: path.subtopicId, label: path.subtopic, kind: "subtopic", questionCount: 0, parentId: path.topicId },
    ];
    for (const node of pathNodes) {
      const current = nodes.get(node.id) || node;
      current.questionCount += 1;
      nodes.set(node.id, current);
    }
    for (const [source, target] of [[path.subjectId, path.topicId], [path.topicId, path.subtopicId]]) {
      const key = `${source}->${target}`;
      const current = links.get(key) || { source, target, questionCount: 0 };
      current.questionCount += 1;
      links.set(key, current);
    }
  }

  return {
    exam,
    years,
    yearFrom,
    yearTo,
    totalCount: questions.length,
    mappedCount,
    unmappedCount: questions.length - mappedCount,
    nodes: [...nodes.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label)),
    links: [...links.values()],
  };
}
