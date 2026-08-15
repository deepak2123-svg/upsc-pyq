import { getRequestIdentity } from "../../../lib/auth/session";
import { handleApiError, json, readJson, requireDatabase } from "../../../lib/server/http";
import { listSavedTests, saveTestRecipe } from "../../../lib/server/test-service";

export async function GET() {
  try {
    requireDatabase();
    const identity = await getRequestIdentity({ createGuest: false });
    if (!identity.userId) return json({ savedTests: [], authenticated: false });
    return json({ savedTests: await listSavedTests(identity.userId), authenticated: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const identity = await getRequestIdentity({ createGuest: false });
    if (!identity.userId) return json({ error: "Sign in to save a test recipe.", code: "AUTH_REQUIRED" }, { status: 401 });
    const payload = await readJson<{ name?: string; recipe?: Record<string, unknown> }>(request);
    if (!payload.recipe || typeof payload.recipe !== "object") return json({ error: "recipe is required", code: "INVALID_RECIPE" }, { status: 400 });
    return json({ savedTest: await saveTestRecipe(identity.userId, payload.name ?? "Saved test", payload.recipe) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
