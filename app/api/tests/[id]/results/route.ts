import { getRequestIdentity } from "../../../../../lib/auth/session";
import { handleApiError, json, requireDatabase } from "../../../../../lib/server/http";
import { getResult } from "../../../../../lib/server/test-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireDatabase();
    const identity = await getRequestIdentity({ createGuest: false });
    const { id } = await context.params;
    return json({ result: await getResult(identity, id) });
  } catch (error) {
    return handleApiError(error);
  }
}
