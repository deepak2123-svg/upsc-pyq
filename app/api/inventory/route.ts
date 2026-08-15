import { getRequestIdentity } from "../../../lib/auth/session";
import { normalizeRecipe } from "../../../lib/domain/test";
import { handleApiError, json, requireDatabase } from "../../../lib/server/http";
import { getInventory } from "../../../lib/server/test-service";

export async function GET(request: Request) {
  try {
    requireDatabase();
    await getRequestIdentity();
    const url = new URL(request.url);
    let input: unknown = {};
    try {
      input = JSON.parse(url.searchParams.get("recipe") ?? "{}");
    } catch {
      return json({ error: "recipe must be valid JSON", code: "INVALID_RECIPE" }, { status: 400 });
    }
    const recipe = normalizeRecipe((input && typeof input === "object" ? input : {}) as import("../../../lib/domain/test").TestRecipe);
    return json({ recipe, inventory: await getInventory(recipe) });
  } catch (error) {
    return handleApiError(error);
  }
}
