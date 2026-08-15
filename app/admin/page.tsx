import { UPSCPuraanApp } from "../upscpuraan-app";
import Link from "next/link";
import { getRequestIdentity } from "../../lib/auth/session";
import { getStaffRole } from "../../lib/server/test-service";
import { isDatabaseConfigured } from "../../db";

export const metadata = { title: "Editorial workspace", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!isDatabaseConfigured()) return <main className="public-article"><div className="eyebrow">Editorial workspace</div><h1>Admin tools are not connected yet.</h1><p>Configure Supabase PostgreSQL and authentication in Vercel before using editorial operations.</p><p><Link href="/">Return home →</Link></p></main>;
  const identity = await getRequestIdentity({ createGuest: false });
  const role = identity.userId ? await getStaffRole(identity.userId) : null;
  if (role !== "editor" && role !== "admin") return <main className="public-article"><div className="eyebrow">Editorial workspace</div><h1>Access restricted.</h1><p>Only approved editors and administrators can review or publish questions.</p><p><Link href="/app">Return to the test lab →</Link></p></main>;
  return <UPSCPuraanApp initialScreen="admin" />;
}
