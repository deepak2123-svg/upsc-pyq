import { getRequestIdentity } from "../auth/session";
import { isAdmin, isStaff } from "../auth/session";
import { getStaffRole, ApiError } from "./test-service";

export async function requireStaff() {
  const identity = await getRequestIdentity({ createGuest: false });
  if (!identity.userId) throw new ApiError(401, "AUTH_REQUIRED", "Sign in is required for editorial tools.");
  const role = await getStaffRole(identity.userId);
  if (!isStaff(role)) throw new ApiError(403, "STAFF_REQUIRED", "This action is restricted to editors and administrators.");
  return { identity, role };
}

export async function requireAdmin() {
  const identity = await getRequestIdentity({ createGuest: false });
  if (!identity.userId) throw new ApiError(401, "AUTH_REQUIRED", "Sign in is required for administrative tools.");
  const role = await getStaffRole(identity.userId);
  if (!isAdmin(role)) throw new ApiError(403, "ADMIN_REQUIRED", "This action is restricted to administrators.");
  return { identity, role };
}
