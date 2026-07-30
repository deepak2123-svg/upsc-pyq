import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role", { enum: ["student", "editor", "admin"] }).notNull().default("student"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  exam: text("exam").notNull(),
  year: integer("year"),
  paper: text("paper"),
  sourceQuestionNumber: text("source_question_number"),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  stem: text("stem").notNull(),
  promptLinesJson: text("prompt_lines_json"),
  optionsJson: text("options_json").notNull(),
  correctOption: text("correct_option").notNull(),
  explanation: text("explanation"),
  eliminationNotesJson: text("elimination_notes_json"),
  origin: text("origin", { enum: ["pyq", "generated"] }).notNull(),
  sourceJson: text("source_json"),
  sourceFingerprint: text("source_fingerprint").notNull(),
  sourceTextHash: text("source_text_hash"),
  sourceTextLocked: integer("source_text_locked", { mode: "boolean" }).notNull().default(true),
  verificationStatus: text("verification_status").notNull(),
  suggestedDifficulty: text("suggested_difficulty"),
  editorialDifficulty: text("editorial_difficulty"),
  workflowStatus: text("workflow_status", { enum: ["draft", "review", "approved", "rejected", "published"] }).notNull().default("draft"),
  requiresFigure: integer("requires_figure", { mode: "boolean" }).notNull().default(false),
  figureKey: text("figure_key"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  uniqueIndex("questions_source_fingerprint_idx").on(table.sourceFingerprint),
]);

export const tests = sqliteTable("tests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  exam: text("exam").notNull(),
  mode: text("mode", { enum: ["exam", "practice"] }).notNull(),
  recipeJson: text("recipe_json").notNull(),
  questionSnapshotJson: text("question_snapshot_json").notNull(),
  scoringJson: text("scoring_json").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  deadlineAt: integer("deadline_at", { mode: "timestamp" }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  status: text("status", { enum: ["active", "submitted", "expired"] }).notNull().default("active"),
});

export const attemptAnswers = sqliteTable("attempt_answers", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull().references(() => tests.id),
  questionId: text("question_id").notNull(),
  selectedOption: text("selected_option"),
  markedForReview: integer("marked_for_review", { mode: "boolean" }).notNull().default(false),
  secondsSpent: integer("seconds_spent").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  uniqueIndex("attempt_test_question_idx").on(table.testId, table.questionId),
]);

export const editorialEvents = sqliteTable("editorial_events", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id),
  actorId: text("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
