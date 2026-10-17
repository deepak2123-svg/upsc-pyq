import questionBank from "../content/question-bank.json";
import { historicalPhysicalQuestionSets, historicalPhysicalTargets, slug as taxonomySlug, taxonomyIdForLegacyQuestion, taxonomyIdForQuestion, taxonomyNode } from "./taxonomy";
import { PYQ_EXAMS, type PyqExam } from "./pyq-exams";
export { PYQ_EXAMS, type PyqExam } from "./pyq-exams";

export type PyqQuestion = {
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
  options: Record<string, string>;
  answer: string;
  explanation: string;
  taxonomyId?: string | null;
  taxonomyHead?: string | null;
  taxonomyChapter?: string | null;
  taxonomySubtopic?: string | null;
  requiresFigure?: boolean;
  figureKey?: string | null;
  figureAlt?: string | null;
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
};

export type PracticeInventoryLink = {
  source: string;
  target: string;
  subjectId: string;
  questionCount: number;
  examCounts: ExamCounts;
};

export type SubjectPracticeInventory = {
  version: 3;
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

export const pyqQuestions = (questionBank.questions as PyqQuestion[]).filter(
  (question) => question.origin === "pyq" && question.sourceTextLocked,
);

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

export function getQuestionPath(question: PyqQuestion) {
  if (
    question.subject === "General Studies" &&
    question.topic === "General" &&
    question.subtopic === "General"
  ) return null;

  const mappedNode = taxonomyNode(question.taxonomyId || taxonomyIdForQuestion(question.id) || taxonomyIdForLegacyQuestion(question) || "");
  const subject = mappedNode?.subject || question.subject;
  const rawHead = mappedNode?.head || question.taxonomyHead || (subject === "Environment" ? "Environment & Ecology" : subject);
  const head = subject === "Geography" && rawHead === "Geography" ? "Other Geography" : rawHead;
  const topic = mappedNode?.chapter || question.taxonomyChapter || question.topic;
  const subtopic = mappedNode?.subtopic || question.taxonomySubtopic || question.subtopic;
  const subjectId = `subject:${slug(subject)}`;
  const headId = `head:${slug(subject)}:${slug(head)}`;
  const topicId = `topic:${slug(subject)}:${slug(head)}:${slug(topic)}`;
  const subtopicId = `subtopic:${slug(subject)}:${slug(head)}:${slug(topic)}:${slug(subtopic)}`;
  return {
    subject, head, topic, subtopic, subjectId, headId, topicId, subtopicId,
    headOrder: mappedNode?.head === "Physical Geography" ? 1 : 100,
    topicOrder: mappedNode?.chapterOrder ?? 100,
    subtopicOrder: mappedNode?.subtopicOrder ?? 100,
  };
}

const emptyExamCounts = (): ExamCounts => ({ CSE: 0, CAPF: 0, CDS: 0, NDA: 0 });

function incrementExam(counts: ExamCounts, exam: PyqExam) {
  counts[exam] += 1;
}

export function getSubjectPracticeInventory(): SubjectPracticeInventory {
  const subjects = new Map<string, PracticeSubject>();
  const nodes = new Map<string, PracticeInventoryNode>();
  const links = new Map<string, PracticeInventoryLink>();
  const legacyAliases = new Map<string, Set<string>>();
  let mappedCount = 0;

  for (const question of pyqQuestions) {
    const path = getQuestionPath(question);
    if (!path) continue;
    mappedCount += 1;
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
    subject.questionCount += 1;
    incrementExam(subject.examCounts, question.exam);
    subjects.set(subject.id, subject);

    const pathNodes: PracticeInventoryNode[] = [
      { id: path.headId, label: path.head, kind: "head", subjectId: path.subjectId, parentId: path.subjectId, order: path.headOrder, questionCount: 0, examCounts: emptyExamCounts() },
      { id: path.topicId, label: path.topic, kind: "topic", subjectId: path.subjectId, parentId: path.headId, order: path.topicOrder, questionCount: 0, examCounts: emptyExamCounts() },
      { id: path.subtopicId, label: path.subtopic, kind: "subtopic", subjectId: path.subjectId, parentId: path.topicId, order: path.subtopicOrder, questionCount: 0, examCounts: emptyExamCounts() },
    ];
    for (const nextNode of pathNodes) {
      const current = nodes.get(nextNode.id) || nextNode;
      current.questionCount += 1;
      incrementExam(current.examCounts, question.exam);
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
      link.questionCount += 1;
      incrementExam(link.examCounts, question.exam);
      links.set(linkKey, link);
    }
  }

  const legacyQuestionSets: Record<string, string[]> = {};
  for (const [oldTaxonomyId, questionIds] of Object.entries(historicalPhysicalQuestionSets)) {
    const [, oldChapter, oldSubtopic] = oldTaxonomyId.split("/");
    const legacyId = `subtopic:geography:physical-geography:${oldChapter}:${oldSubtopic}`;
    const ancestryUnsafeId = `subtopic:geography:${oldChapter}:${oldSubtopic}`;
    legacyQuestionSets[legacyId] = questionIds;
    legacyQuestionSets[ancestryUnsafeId] = questionIds;
    const targets = historicalPhysicalTargets[oldTaxonomyId] || [];
    const aliases = legacyAliases.get(legacyId) || new Set<string>();
    for (const target of targets) {
      const node = taxonomyNode(target);
      if (node) aliases.add(`subtopic:geography:physical-geography:${taxonomySlug(node.chapter)}:${taxonomySlug(node.subtopic)}`);
    }
    legacyAliases.set(legacyId, aliases);
    legacyAliases.set(ancestryUnsafeId, new Set(aliases));
  }

  const subjectOrder = new Map(["Geography", "Environment", "Polity"].map((label, index) => [label, index]));
  return {
    version: 3,
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
