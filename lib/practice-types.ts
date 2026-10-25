import type { PyqExam } from "./pyq-catalog";
import type { PreparationExam } from './preparation-exams';

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

/** Answer-free explicit membership: a saved selection must not grow with a topic. */
export type PracticeFrozenScope = {
  id:string;
  subjectId:string;
  label:string;
  parentId?:string;
  order:number;
  questionIdsByExam:Record<PyqExam,string[]>;
};
export type PracticeRecipeV4 = Omit<PracticeRecipeV3, 'version'> & { version: 4; taxonomyVersion?:string; frozenScopes?:PracticeFrozenScope[]; preparationExam?: PreparationExam };
export type PracticeRecipe = LegacyPracticeRecipe | PracticeRecipeV2 | PracticeRecipeV3 | PracticeRecipeV4;

export function isPracticeRecipeV2(recipe: PracticeRecipe): recipe is PracticeRecipeV2 {
  return "version" in recipe && recipe.version === 2;
}

export function isPracticeRecipeV3(recipe: PracticeRecipe): recipe is PracticeRecipeV3 | PracticeRecipeV4 {
  return "version" in recipe && (recipe.version === 3 || recipe.version === 4);
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
  /** Exact underlined expressions from the original English paper. */
  underlined?: string[];
  options: Record<string, string>;
  sourceTextHash: string;
  /** Evidence label only; never exposes the accepted answer. */
  answerKeyStatus?: 'official-provisional' | 'reasoned-verified';
  contentRevision?: number;
  figure?: { src: string; alt: string };
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
  correct: boolean | null;
  correctAnswer: string | null;
  disposition?: 'scored' | 'excluded';
  exclusionReason?: string;
  reviewRevision?: number;
  explanation: string | null;
  answerKeyRevision?: number;
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
  returnPath?: PracticeReturnPath;
};
export type PracticeReturnPath = '/' | '/library' | `/exams/${PyqExam}` | `/prepare/${PreparationExam}`;

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
