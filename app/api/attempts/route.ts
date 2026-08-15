import { getRequestIdentity } from "../../../lib/auth/session";
import { handleApiError, json, requireDatabase } from "../../../lib/server/http";
import { listAttempts } from "../../../lib/server/test-service";

export async function GET() {
  try {
    requireDatabase();
    const identity = await getRequestIdentity({ createGuest: false });
    if (!identity.userId) return json({ attempts: [], cloudHistory: false });
    return json({ attempts: await listAttempts(identity), cloudHistory: true });
  } catch (error) {
    return handleApiError(error);
  }
}
