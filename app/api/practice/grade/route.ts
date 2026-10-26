import { NextResponse } from "next/server";
import { historicalPyqQuestions as pyqQuestions } from "../../../../lib/pyq-catalog";
import { questionExclusion, questionReviewRevision } from '../../../../lib/question-review';
import type { AnswerFeedback } from "../../../../lib/practice-types";
import { answerKeyRevision } from "../../../../lib/practice-session";
import {acceptedAnswerOptions} from '../../../../lib/answer-options';

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
  const contentRevisions = input.contentRevisions;
  if (contentRevisions !== undefined && (!isRecord(contentRevisions) || Object.entries(contentRevisions).some(([id, value]) => !ids.includes(id) || !Number.isInteger(value) || Number(value) < 0))) return NextResponse.json({ error: 'Invalid question content revisions.' }, { status: 400 });
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
  let excluded = 0;
  const feedback: Record<string, AnswerFeedback> = {};
  for (const id of ids as string[]) {
    const question = questionsById.get(id)!;
    const answer = input.answers[id];
    const exclusionReason = questionExclusion(id, isRecord(contentRevisions) ? Number(contentRevisions[id] ?? 0) : 0);
    if (exclusionReason) {
      excluded += 1;
      feedback[id] = { disposition: 'excluded', correct: null, correctAnswer: null, explanation: exclusionReason, exclusionReason, answerKeyRevision: answerKeyRevision(id), reviewRevision: questionReviewRevision(id) };
      continue;
    }
    const accepted=acceptedAnswerOptions(question);
    const isCorrect = accepted.includes(answer as string);
    if (answer !== undefined) {
      if (isCorrect) correct += 1;
      else incorrect += 1;
    }
    feedback[id] = { disposition: 'scored', correct: isCorrect, correctAnswer: question.answer, ...(accepted.length>1?{correctAnswers:accepted}:{}), explanation: publishedExplanation(question.explanation), answerKeyRevision: answerKeyRevision(id), reviewRevision: questionReviewRevision(id) };
  }
  return NextResponse.json({ correct, incorrect, excluded, scored: ids.length - excluded, unattempted: ids.length - excluded - correct - incorrect, total: ids.length, feedback });
}
