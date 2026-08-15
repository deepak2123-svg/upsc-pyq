import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { questions } from "../../db/schema";

export async function getPublishedQuestion(exam: string, year: number, slug: string) {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  return (await db.select().from(questions).where(and(
    eq(questions.exam, exam),
    eq(questions.year, year),
    eq(questions.id, slug),
    eq(questions.workflowStatus, "published"),
    eq(questions.verificationStatus, "verified"),
  )))[0] ?? null;
}
