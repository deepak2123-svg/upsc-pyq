import { NextResponse } from "next/server";
import { getSubjectPracticeInventory } from "../../../../lib/pyq-catalog";

export async function GET() {
  return NextResponse.json(getSubjectPracticeInventory(), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
