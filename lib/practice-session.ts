import type { AnswerFeedback, LocalAttempt, PracticeRecipe } from "./practice-types";
import type { PyqExam } from "./pyq-exams";

export function safePracticeReturnPath(value: unknown): "/" | `/exams/${PyqExam}` {
  if (typeof value === "string" && value.trim() === value && /^\/exams\/(CSE|CAPF|CDS|NDA)$/.test(value)) return value as `/exams/${PyqExam}`;
  return "/";
}

export function attemptReturnPath(attempt: LocalAttempt): "/" | `/exams/${PyqExam}` {
  if (attempt.returnPath !== undefined) return safePracticeReturnPath(attempt.returnPath);
  const recipe = attempt.snapshot.recipe;
  return "exam" in recipe ? safePracticeReturnPath(`/exams/${recipe.exam}`) : "/";
}

export function practiceDurationMinutes(recipe: PracticeRecipe): number | null {
  if (!("version" in recipe) || recipe.version !== 3) return null;
  const duration = recipe.durationMinutes;
  return typeof duration === "number" && Number.isInteger(duration) && duration >= 1 && duration <= 720 ? duration : null;
}

export function formatPracticeTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const remainder = (safe % 60).toString().padStart(2, "0");
  return hours ? `${hours}:${minutes}:${remainder}` : `${minutes}:${remainder}`;
}

export function attemptClock(attempt: LocalAttempt, now = Date.now()) {
  const durationMinutes = practiceDurationMinutes(attempt.snapshot.recipe);
  const deadline = attempt.deadlineAt ? Date.parse(attempt.deadlineAt) : NaN;
  const started = Date.parse(attempt.startedAt);
  const timed = durationMinutes !== null && Number.isFinite(deadline);
  const runningElapsed = attempt.timingMode === "wall_clock" && Number.isFinite(started)
    ? Math.max(0, Math.floor((now - started) / 1000))
    : attempt.elapsedSeconds;
  const elapsedSeconds = attempt.status === "completed" ? attempt.elapsedSeconds : timed
    ? Math.min(durationMinutes * 60, runningElapsed)
    : runningElapsed;
  const remainingSeconds = timed ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  return { durationMinutes, elapsedSeconds, remainingSeconds, expired: timed && remainingSeconds === 0 };
}

export function completeAttempt(attempt: LocalAttempt, reason: "submitted" | "time_expired", now = Date.now()): LocalAttempt {
  const clock = attemptClock(attempt, now);
  return {
    ...attempt,
    status: "completed",
    elapsedSeconds: reason === "time_expired" && clock.durationMinutes !== null ? clock.durationMinutes * 60 : clock.elapsedSeconds,
    completedAt: new Date(now).toISOString(),
    completionReason: reason,
  };
}

export function hasCompleteFeedback(attempt: LocalAttempt) {
  return attempt.snapshot.questions.every((question) => Boolean(attempt.feedback[question.id]?.correctAnswer));
}

/** This endpoint is requested only after the local submission has been saved. */
export async function requestAnswerFeedback(attempt: LocalAttempt): Promise<Record<string, AnswerFeedback>> {
  if (attempt.status !== "completed") throw new Error("Finish this practice before viewing its answers.");
  const response = await fetch("/api/practice/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionIds: attempt.snapshot.questions.map((question) => question.id), answers: attempt.answers }),
  });
  const result = await response.json().catch(() => null) as { error?: string; feedback?: Record<string, AnswerFeedback> } | null;
  if (!response.ok) throw new Error(result?.error || "The answer sheet could not be loaded. Your submitted answers are saved.");
  const feedback = result?.feedback;
  if (!feedback || !attempt.snapshot.questions.every((question) => {
    const item = feedback[question.id];
    return item && typeof item.correct === "boolean" && typeof item.correctAnswer === "string"
      && Object.hasOwn(question.options, item.correctAnswer) && (item.explanation === null || typeof item.explanation === "string");
  })) throw new Error("The answer sheet was incomplete. Your submitted answers are saved; please retry.");
  return feedback;
}
