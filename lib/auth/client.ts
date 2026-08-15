import { getSupabaseBrowser } from "../supabase/client";

export async function signInWithGoogle(next = "/app") {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { error: new Error("Supabase authentication is not configured yet.") };
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  if (supabase) await supabase.auth.signOut();
  await fetch("/auth/signout", { method: "POST" });
}
