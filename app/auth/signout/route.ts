import { getSupabaseServer } from "../../../lib/supabase/server";

export async function POST() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  return Response.json({ ok: true });
}
