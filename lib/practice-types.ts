import type { PyqExam } from "./pyq-catalog";

export type PracticeOrder = "newest" | "shuffle";
export type PracticeRecipe = {
  exam: PyqExam;
  yearFrom: number;
  yearTo: number;
  taxonomyIds: string[];
  count: number | "all";
  order: PracticeOrder;
};

export type PracticeQuestion = {
  id: string;
  exam: PyqExam;
  year: number;
  paper: string;
  questionNumber: number;
  subject: string;
  topic: string;
  subtopic: string;
  promptLines: string[];
  options: Record<string, string>;
  sourceTextHash: string;
};

export type PracticeSnapshot = {
  id: string;
  contentVersion: string;
  createdAt: string;
  recipe: PracticeRecipe;
  questions: PracticeQuestion[];
};

export type AnswerFeedback = {
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
};

export type LocalAttempt = {
  id: string;
  snapshot: PracticeSnapshot;
  status: "in_progress" | "completed";
  currentIndex: number;
  answers: Record<string, string>;
  feedback: Record<string, AnswerFeedback>;
  elapsedSeconds: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type Bookmark = {
  questionId: string;
  exam: PyqExam;
  year: number;
  paper: string;
  questionNumber: number;
  subject: string;
  topic: string;
  prompt: string;
  savedAt: string;
};
