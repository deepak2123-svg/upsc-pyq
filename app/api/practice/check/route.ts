import { NextResponse } from "next/server";
import { historicalPyqQuestions as pyqQuestions } from "../../../../lib/pyq-catalog";
import { questionExclusion, questionReviewRevision } from '../../../../lib/question-review';
import { answerKeyRevision } from '../../../../lib/practice-session';
import {acceptedAnswerOptions} from '../../../../lib/answer-options';

function publishedExplanation(value: string) {
  const explanation = value.trim();
  return !explanation || /pending editorial review/i.test(explanation) ? null : explanation;
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { questionId?: string; selectedOption?: string; contentRevision?: number } | null;
  if (input?.contentRevision !== undefined && (!Number.isInteger(input.contentRevision) || input.contentRevision < 0)) return NextResponse.json({error:'Invalid question content revision.'}, {status:400});
  const question = pyqQuestions.find((candidate) => candidate.id === input?.questionId);
  if (!question || typeof input?.selectedOption !== 'string' || !Object.hasOwn(question.options, input.selectedOption)) return NextResponse.json({ error: "Question or answer is missing or invalid." }, { status: 400 });
  const exclusionReason = questionExclusion(question.id,input.contentRevision??0);
  const revisions = {answerKeyRevision:answerKeyRevision(question.id),reviewRevision:questionReviewRevision(question.id)};
  if (exclusionReason) return NextResponse.json({ disposition: 'excluded', correct: null, correctAnswer: null, exclusionReason, explanation: exclusionReason,...revisions });
  const accepted=acceptedAnswerOptions(question);
  return NextResponse.json({
    disposition: 'scored',
    correct: accepted.includes(input.selectedOption),
    correctAnswer: question.answer,
    ...(accepted.length>1?{correctAnswers:accepted}:{}),
    explanation: publishedExplanation(question.explanation),
    ...revisions,
  });
}
