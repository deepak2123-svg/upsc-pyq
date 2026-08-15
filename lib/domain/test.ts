import { validTaxonomyIds } from "../taxonomy";

export const DIFFICULTIES = ["All types", "Easy", "Moderate", "Hard", "Mixed"] as const;
export const EXAMS = ["CSE", "CAPF", "CDS", "NDA"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Exam = (typeof EXAMS)[number];
export type TestMode = "Exam" | "Practice";

export type TestRecipe = {
  exam: Exam;
  paper?: string;
  subjects: string[];
  topics?: string[];
  /** Canonical taxonomy subtopic IDs. Empty preserves the unrestricted recipe. */
  subtopics?: string[];
  difficulty: Difficulty;
  count: number;
  durationMinutes: number;
  sourceMix: boolean;
  mode: TestMode;
};

export type ScoringConfig = {
  exam: string;
  paper: string;
  year: number | null;
  questionCount: number;
  durationSeconds: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  source: string;
  version: string;
};

export type QuestionSnapshot = {
  id: string;
  exam: string;
  year: number | null;
  paper: string | null;
  sourceQuestionNumber: string | null;
  subject: string;
  topic: string;
  subtopic: string | null;
  stem: string;
  promptLines: string[];
  options: Record<string, string>;
  correctOption: string;
  explanation: string | null;
  eliminationNotes: Record<string, string> | null;
  origin: "pyq" | "generated";
  source: Record<string, unknown>;
  difficulty: string;
  requiresFigure: boolean;
  figureKey: string | null;
  taxonomyVersion: string | null;
  taxonomyHead: string | null;
  taxonomyChapter: string | null;
  taxonomySubtopic: string | null;
  taxonomyId: string | null;
};

export function normalizeRecipe(input: Partial<TestRecipe>): TestRecipe {
  const exam = EXAMS.includes(input.exam as Exam) ? (input.exam as Exam) : "CSE";
  const difficulty = DIFFICULTIES.includes(input.difficulty as Difficulty)
    ? (input.difficulty as Difficulty)
    : "All types";
  const count = Math.min(100, Math.max(5, Math.round(Number(input.count) || 20)));
  const durationMinutes = Math.min(180, Math.max(5, Math.round(Number(input.durationMinutes) || 30)));
  const subjects = Array.isArray(input.subjects)
    ? [...new Set(input.subjects.filter((value): value is string => typeof value === "string" && value.trim().length > 0 && value !== "All subjects"))]
    : [];
  const topics = Array.isArray(input.topics)
    ? [...new Set(input.topics.filter((value): value is string => typeof value === "string" && value.trim().length > 0))]
    : [];
  const subtopics = validTaxonomyIds(input.subtopics, subjects);

  return {
    exam,
    paper: typeof input.paper === "string" && input.paper.trim() ? input.paper : undefined,
    subjects,
    topics,
    subtopics,
    difficulty,
    count,
    durationMinutes,
    sourceMix: Boolean(input.sourceMix),
    mode: input.mode === "Practice" ? "Practice" : "Exam",
  };
}

export function publicSnapshot(snapshot: QuestionSnapshot, revealAnswer: boolean): Omit<QuestionSnapshot, "correctOption"> & { correctOption?: string } {
  if (revealAnswer) return snapshot;
  const safe = { ...snapshot };
  delete safe.correctOption;
  return safe;
}
