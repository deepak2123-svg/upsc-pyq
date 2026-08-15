import { getSupabaseServer } from "../../../lib/supabase/server";

function redirectTo(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new Response(null, { status: 302, headers: { Location: new URL(path, base).toString() } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/app";
  const supabase = await getSupabaseServer();
  if (!supabase || !code) return redirectTo("/?auth=unavailable");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? redirectTo(`/?auth=error&message=${encodeURIComponent(error.message)}`) : redirectTo(safeNext);
}
