import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { questions } from "../../../../db/schema";
import { requireStaff } from "../../../../lib/server/admin";
import { handleApiError, json, requireDatabase } from "../../../../lib/server/http";

export async function GET(request: Request) {
  try {
    requireDatabase();
    await requireStaff();
    const status = new URL(request.url).searchParams.get("status") ?? "review";
    const db = getDb();
    const rows = status === "all"
      ? await db.select().from(questions).orderBy(desc(questions.updatedAt)).limit(200)
      : await db.select().from(questions).where(eq(questions.workflowStatus, status as "draft" | "review" | "approved" | "rejected" | "published")).orderBy(desc(questions.updatedAt)).limit(200);
    return json({ questions: rows });
  } catch (error) {
    return handleApiError(error);
  }
}
