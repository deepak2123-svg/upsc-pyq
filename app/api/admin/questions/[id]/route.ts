import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { editorialEvents, questions } from "../../../../../db/schema";
import { requireStaff } from "../../../../../lib/server/admin";
import { handleApiError, json, readJson, requireDatabase } from "../../../../../lib/server/http";
import { ApiError } from "../../../../../lib/server/test-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireDatabase();
    const { identity } = await requireStaff();
    const { id } = await context.params;
    const payload = await readJson<Partial<typeof questions.$inferInsert>>(request);
    const db = getDb();
    const existing = (await db.select().from(questions).where(eq(questions.id, id)))[0];
    if (!existing) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found.");
    if (existing.origin === "pyq" && (payload.stem || payload.promptLines || payload.options || payload.correctOption)) {
      throw new ApiError(409, "PYQ_SOURCE_LOCKED", "PYQ stem, options, and answer are source-locked.");
    }
    const allowed = {
      explanation: payload.explanation,
      eliminationNotes: payload.eliminationNotes,
      editorialDifficulty: payload.editorialDifficulty,
      workflowStatus: payload.workflowStatus,
      verificationStatus: payload.verificationStatus,
      evidence: payload.evidence,
    };
    const before = existing as Record<string, unknown>;
    const updated = (await db.update(questions).set({ ...allowed, updatedAt: new Date(), publishedAt: allowed.workflowStatus === "published" ? new Date() : existing.publishedAt }).where(eq(questions.id, id)).returning())[0];
    await db.insert(editorialEvents).values({ questionId: id, actorId: identity.userId, action: "edit", beforeJson: before, afterJson: updated as Record<string, unknown> });
    return json({ question: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
