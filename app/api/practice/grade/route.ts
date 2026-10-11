import { NextResponse } from "next/server";
import { pyqQuestions } from "../../../../lib/pyq-catalog";
import type { AnswerFeedback } from "../../../../lib/practice-types";

const questionsById = new Map(pyqQuestions.map((question) => [question.id, question]));
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function publishedExplanation(value: string) {
  const explanation = value.trim();
  return !explanation || /pending editorial review/i.test(explanation) ? null : explanation;
}

export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  if (!isRecord(input) || !Array.isArray(input.questionIds) || !isRecord(input.answers)) {
    return NextResponse.json({ error: "A question snapshot and answer map are required." }, { status: 400 });
  }
  const ids = input.questionIds;
  if (!ids.length || ids.length > pyqQuestions.length || ids.some((id) => typeof id !== "string" || !questionsById.has(id)) || new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Question IDs must be known, unique questions from your practice." }, { status: 400 });
  }
  const idSet = new Set(ids as string[]);
  for (const [id, answer] of Object.entries(input.answers)) {
    const question = questionsById.get(id);
    if (!idSet.has(id) || !question || typeof answer !== "string" || !Object.hasOwn(question.options, answer)) {
      return NextResponse.json({ error: "Every answer must be a valid option for a question in this practice." }, { status: 400 });
    }
  }
  let correct = 0;
  let incorrect = 0;
  const feedback: Record<string, AnswerFeedback> = {};
  for (const id of ids as string[]) {
    const question = questionsById.get(id)!;
    const answer = input.answers[id];
    const isCorrect = answer === question.answer;
    if (answer !== undefined) {
      if (isCorrect) correct += 1;
      else incorrect += 1;
    }
    feedback[id] = { correct: isCorrect, correctAnswer: question.answer, explanation: publishedExplanation(question.explanation) };
  }
  return NextResponse.json({ correct, incorrect, unattempted: ids.length - correct - incorrect, total: ids.length, feedback });
}
