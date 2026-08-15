import { getRequestIdentity } from "../../../../../../lib/auth/session";
import { handleApiError, json, readJson, requireDatabase } from "../../../../../../lib/server/http";
import { saveAnswer } from "../../../../../../lib/server/test-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    requireDatabase();
    const identity = await getRequestIdentity({ createGuest: false });
    const { id, questionId } = await context.params;
    const payload = await readJson<{ selectedOption?: string | null; markedForReview?: boolean; secondsSpent?: number }>(request);
    return json({ answer: await saveAnswer(identity, id, questionId, payload.selectedOption ?? null, Boolean(payload.markedForReview), Number(payload.secondsSpent ?? 0)) });
  } catch (error) {
    return handleApiError(error);
  }
}
