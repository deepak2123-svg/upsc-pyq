import { NextResponse } from "next/server";
import { pyqQuestions } from "../../../../lib/pyq-catalog";

function publishedExplanation(value: string) {
  const explanation = value.trim();
  return !explanation || /pending editorial review/i.test(explanation) ? null : explanation;
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { questionId?: string; selectedOption?: string } | null;
  const question = pyqQuestions.find((candidate) => candidate.id === input?.questionId);
  if (!question || !input?.selectedOption) return NextResponse.json({ error: "Question or answer is missing." }, { status: 400 });
  return NextResponse.json({
    correct: input.selectedOption === question.answer,
    correctAnswer: question.answer,
    explanation: publishedExplanation(question.explanation),
  });
}
