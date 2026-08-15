import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getSupabaseServer } from "../supabase/server";

const GUEST_COOKIE = "upscpuraan_guest";
const GUEST_TTL_SECONDS = 60 * 60 * 24 * 7;

export type RequestIdentity = {
  userId: string | null;
  email: string | null;
  role: "student" | "editor" | "admin" | null;
  guestSessionId: string;
};

export async function getRequestIdentity({ createGuest = true } = {}): Promise<RequestIdentity> {
  const cookieStore = await cookies();
  const supabase = await getSupabaseServer();
  let userId: string | null = null;
  let email: string | null = null;
  const role: RequestIdentity["role"] = null;

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
    email = data.user?.email ?? null;
  }

  let guestSessionId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestSessionId && createGuest) {
    guestSessionId = randomBytes(18).toString("base64url");
    cookieStore.set(GUEST_COOKIE, guestSessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: GUEST_TTL_SECONDS,
      path: "/",
    });
  }

  return { userId, email, role, guestSessionId: guestSessionId ?? "" };
}

export function isStaff(role: RequestIdentity["role"]): role is "editor" | "admin" {
  return role === "editor" || role === "admin";
}

export function isAdmin(role: RequestIdentity["role"]): role is "admin" {
  return role === "admin";
}

export { GUEST_COOKIE, GUEST_TTL_SECONDS };
