import { NextResponse } from "next/server";
import { pyqQuestions } from "../../../../lib/pyq-catalog";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { questionIds?: string[]; answers?: Record<string, string> } | null;
  if (!input?.questionIds || !input.answers) return NextResponse.json({ error: "A question snapshot and answers are required." }, { status: 400 });
  let correct = 0;
  let incorrect = 0;
  for (const id of input.questionIds) {
    const question = pyqQuestions.find((candidate) => candidate.id === id);
    const answer = input.answers[id];
    if (!question || !answer) continue;
    if (answer === question.answer) correct += 1;
    else incorrect += 1;
  }
  return NextResponse.json({ correct, incorrect, unattempted: input.questionIds.length - correct - incorrect, total: input.questionIds.length });
}
