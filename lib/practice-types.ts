import type { PyqExam } from "./pyq-catalog";

export type PracticeOrder = "newest" | "shuffle";
export type LegacyPracticeRecipe = {
  exam: PyqExam;
  yearFrom: number;
  yearTo: number;
  taxonomyIds: string[];
  count: number | "all";
  order: PracticeOrder;
};

export type PracticePathSelection = {
  subtopicId: string;
  exams: PyqExam[];
};

export type PracticeRecipeV2 = {
  version: 2;
  subjectIds: string[];
  paths: PracticePathSelection[];
  count: number | "all";
  order: PracticeOrder;
};

export type PracticeRecipeV3 = Omit<PracticeRecipeV2, "version"> & {
  version: 3;
  /** Absent/null keeps older recipes and retakes untimed. */
  durationMinutes?: number | null;
};

export type PracticeRecipe = LegacyPracticeRecipe | PracticeRecipeV2 | PracticeRecipeV3;

export function isPracticeRecipeV2(recipe: PracticeRecipe): recipe is PracticeRecipeV2 {
  return "version" in recipe && recipe.version === 2;
}

export function isPracticeRecipeV3(recipe: PracticeRecipe): recipe is PracticeRecipeV3 {
  return "version" in recipe && recipe.version === 3;
}

export type PracticeQuestion = {
  id: string;
  exam: PyqExam;
  year: number;
  paper: string;
  questionNumber: number;
  subject: string;
  section?: string;
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
  matchingCount?: number;
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
  deadlineAt?: string;
  timingMode?: "wall_clock";
  completionReason?: "submitted" | "time_expired";
  returnPath?: "/" | `/exams/${PyqExam}`;
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
