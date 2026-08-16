import { NextResponse } from "next/server";
import { getArchiveInventory, isPyqExam, type PyqExam } from "../../../../lib/pyq-catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawExam = searchParams.get("exam") || "";
  if (!isPyqExam(rawExam)) return NextResponse.json({ error: "Unknown examination." }, { status: 400 });
  const yearFrom = Number(searchParams.get("yearFrom")) || undefined;
  const yearTo = Number(searchParams.get("yearTo")) || undefined;
  return NextResponse.json(getArchiveInventory(rawExam.toUpperCase() as PyqExam, yearFrom, yearTo), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
