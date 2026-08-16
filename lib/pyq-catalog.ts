import questionBank from "../content/question-bank.json";
import { taxonomyIdForQuestion, taxonomyNode } from "./taxonomy";

export const PYQ_EXAMS = ["CSE", "CAPF", "CDS", "NDA"] as const;
export type PyqExam = (typeof PYQ_EXAMS)[number];

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
};

export type SankeyNode = {
  id: string;
  label: string;
  kind: "subject" | "topic" | "subtopic";
  questionCount: number;
  parentId?: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  questionCount: number;
};

export type ArchiveInventory = {
  exam: PyqExam;
  years: number[];
  yearFrom: number;
  yearTo: number;
  totalCount: number;
  mappedCount: number;
  unmappedCount: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
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

export function isPyqExam(value: string): value is PyqExam {
  return PYQ_EXAMS.includes(value.toUpperCase() as PyqExam);
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

  const mappedNode = taxonomyNode(question.taxonomyId || taxonomyIdForQuestion(question.id) || "");
  const subject = mappedNode?.subject || question.subject;
  const topic = mappedNode?.chapter || question.taxonomyChapter || question.topic;
  const subtopic = mappedNode?.subtopic || question.taxonomySubtopic || question.subtopic;
  const subjectId = `subject:${slug(subject)}`;
  const topicId = `topic:${slug(subject)}:${slug(topic)}`;
  const subtopicId = `subtopic:${slug(subject)}:${slug(topic)}:${slug(subtopic)}`;
  return { subject, topic, subtopic, subjectId, topicId, subtopicId };
}

export function getArchiveInventory(exam: PyqExam, requestedFrom?: number, requestedTo?: number): ArchiveInventory {
  const allQuestions = getExamQuestions(exam);
  const years = [...new Set(allQuestions.map((question) => question.year))].sort((a, b) => a - b);
  const yearFrom = Math.max(years[0], requestedFrom || years[0]);
  const yearTo = Math.min(years.at(-1) || years[0], requestedTo || years.at(-1) || years[0]);
  const questions = getExamQuestions(exam, yearFrom, yearTo);
  const nodes = new Map<string, SankeyNode>();
  const links = new Map<string, SankeyLink>();
  let mappedCount = 0;

  for (const question of questions) {
    const path = getQuestionPath(question);
    if (!path) continue;
    mappedCount += 1;
    const pathNodes: SankeyNode[] = [
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
