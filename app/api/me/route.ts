import { getRequestIdentity } from "../../../lib/auth/session";
import { handleApiError, json, requireDatabase } from "../../../lib/server/http";
import { getStaffRole } from "../../../lib/server/test-service";

export async function GET() {
  try {
    const identity = await getRequestIdentity({ createGuest: false });
    if (!identity.userId) return json({ authenticated: false, guest: Boolean(identity.guestSessionId), role: null });
    if (!process.env.DATABASE_URL) return json({ authenticated: true, email: identity.email, role: "student", cloudHistory: false });
    requireDatabase();
    return json({ authenticated: true, email: identity.email, role: await getStaffRole(identity.userId), cloudHistory: true });
  } catch (error) {
    return handleApiError(error);
  }
}
