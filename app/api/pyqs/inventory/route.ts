import { NextResponse } from "next/server";
import { getSubjectPracticeInventory } from "../../../../lib/pyq-catalog";
import { getPreparationInventory } from '../../../../lib/preparation-catalog';
import { isPreparationExam } from '../../../../lib/preparation-exams';

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('preparationExam');
  if (target !== null && !isPreparationExam(target)) return NextResponse.json({ error: 'Choose NDA, CDS or CSE.' }, { status: 400 });
  return NextResponse.json(target ? getPreparationInventory(target) : getSubjectPracticeInventory(), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
