import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role", { enum: ["student", "editor", "admin"] }).notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    exam: text("exam").notNull(),
    year: integer("year"),
    paper: text("paper"),
    sourceQuestionNumber: text("source_question_number"),
    subject: text("subject").notNull(),
    topic: text("topic").notNull(),
    subtopic: text("subtopic"),
    taxonomyVersion: text("taxonomy_version"),
    taxonomyHead: text("taxonomy_head"),
    taxonomyChapter: text("taxonomy_chapter"),
    taxonomySubtopic: text("taxonomy_subtopic"),
    taxonomyId: text("taxonomy_id"),
    stem: text("stem").notNull(),
    promptLines: jsonb("prompt_lines").$type<string[]>().notNull(),
    options: jsonb("options").$type<Record<string, string>>().notNull(),
    correctOption: text("correct_option").notNull(),
    explanation: text("explanation"),
    eliminationNotes: jsonb("elimination_notes").$type<Record<string, string>>(),
    origin: text("origin", { enum: ["pyq", "generated"] }).notNull(),
    source: jsonb("source").$type<Record<string, unknown>>().notNull(),
    sourceFingerprint: text("source_fingerprint").notNull(),
    sourceTextHash: text("source_text_hash").notNull(),
    sourceTextLocked: boolean("source_text_locked").notNull().default(true),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    evidence: jsonb("evidence").$type<Record<string, unknown>[]>(),
    suggestedDifficulty: text("suggested_difficulty"),
    editorialDifficulty: text("editorial_difficulty"),
    workflowStatus: text("workflow_status", { enum: ["draft", "review", "approved", "rejected", "published"] }).notNull().default("draft"),
    requiresFigure: boolean("requires_figure").notNull().default(false),
    figureKey: text("figure_key"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("questions_source_fingerprint_idx").on(table.sourceFingerprint),
    index("questions_taxonomy_filter_idx").on(table.taxonomyVersion, table.taxonomyHead, table.taxonomyChapter, table.taxonomyId),
  ],
);

export const questionSources = pgTable("question_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: text("question_id").notNull(),
  kind: text("kind").notNull(),
  url: text("url"),
  label: text("label"),
  evidence: text("evidence"),
  verifiedBy: uuid("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examPapers = pgTable(
  "exam_papers",
  {
    id: text("id").primaryKey(),
    exam: text("exam").notNull(),
    paper: text("paper").notNull(),
    year: integer("year"),
    questionCount: integer("question_count").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    marksPerQuestion: numeric("marks_per_question", { precision: 8, scale: 4 }).notNull(),
    negativeMarksPerQuestion: numeric("negative_marks_per_question", { precision: 8, scale: 4 }).notNull(),
    source: text("source").notNull(),
    version: text("version").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [uniqueIndex("exam_papers_rule_idx").on(table.exam, table.paper, table.year, table.version)],
);

export const tests = pgTable("tests", {
  id: text("id").primaryKey(),
  userId: uuid("user_id"),
  guestSessionId: text("guest_session_id"),
  exam: text("exam").notNull(),
  paper: text("paper"),
  mode: text("mode", { enum: ["exam", "practice"] }).notNull(),
  recipe: jsonb("recipe").$type<Record<string, unknown>>().notNull(),
  scoring: jsonb("scoring").$type<Record<string, unknown>>().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  status: text("status", { enum: ["active", "submitted", "expired"] }).notNull().default("active"),
});

export const testQuestions = pgTable(
  "test_questions",
  {
    testId: text("test_id").notNull(),
    questionId: text("question_id").notNull(),
    position: integer("position").notNull(),
    questionSnapshot: jsonb("question_snapshot").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.testId, table.questionId] })],
);

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    testId: text("test_id").notNull(),
    questionId: text("question_id").notNull(),
    selectedOption: text("selected_option"),
    markedForReview: boolean("marked_for_review").notNull().default(false),
    secondsSpent: integer("seconds_spent").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("attempt_test_question_idx").on(table.testId, table.questionId)],
);

export const results = pgTable("results", {
  testId: text("test_id").primaryKey(),
  score: numeric("score", { precision: 10, scale: 4 }).notNull(),
  maxScore: numeric("max_score", { precision: 10, scale: 4 }).notNull(),
  accuracy: numeric("accuracy", { precision: 7, scale: 4 }).notNull(),
  correctCount: integer("correct_count").notNull(),
  incorrectCount: integer("incorrect_count").notNull(),
  unattemptedCount: integer("unattempted_count").notNull(),
  timeUsedSeconds: integer("time_used_seconds").notNull(),
  breakdown: jsonb("breakdown").$type<Record<string, unknown>>().notNull(),
  weakAreas: jsonb("weak_areas").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedTests = pgTable("saved_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  recipe: jsonb("recipe").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const editorialEvents = pgTable("editorial_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: text("question_id").notNull(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  beforeJson: jsonb("before_json").$type<Record<string, unknown> | null>(),
  afterJson: jsonb("after_json").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuestionRecord = typeof questions.$inferSelect;
export type TestRecord = typeof tests.$inferSelect;
export type TestQuestionRecord = typeof testQuestions.$inferSelect;
