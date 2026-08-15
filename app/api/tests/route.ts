import { getRequestIdentity } from "../../../lib/auth/session";
import { normalizeRecipe } from "../../../lib/domain/test";
import { handleApiError, json, readJson, requireDatabase } from "../../../lib/server/http";
import { createTest } from "../../../lib/server/test-service";
import { allowGuestTestCreation } from "../../../lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    requireDatabase();
    const identity = await getRequestIdentity();
    if (!identity.userId && identity.guestSessionId) {
      const limit = allowGuestTestCreation(identity.guestSessionId);
      if (!limit.allowed) return json({ error: "Guest test limit reached. Sign in to continue practicing.", code: "RATE_LIMITED", retryAfterSeconds: limit.retryAfterSeconds }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds ?? 3600) } });
    }
    const payload = await readJson<{ recipe?: Record<string, unknown> }>(request);
    const recipe = normalizeRecipe((payload.recipe ?? payload) as Partial<import("../../../lib/domain/test").TestRecipe>);
    return json({ test: await createTest(identity, recipe) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
