import assert from "node:assert/strict";
import test from "node:test";
import {
  attemptClock, attemptReturnPath, completeAttempt, formatPracticeTime, hasCompleteFeedback,
  practiceDurationMinutes, requestAnswerFeedback, safePracticeReturnPath,
} from "../lib/practice-session.ts";

const started = Date.parse("2026-10-11T12:00:00.000Z");
const recipe = { version: 3, subjectIds: ["subject:geography"], paths: [], count: 2, order: "newest", durationMinutes: 1 };
const feedback = {
  first: { correct: true, correctAnswer: "A", explanation: null },
  second: { correct: false, correctAnswer: "B", explanation: "Published explanation." },
};
function attempt(overrides = {}) {
  return {
    id: "local-attempt", status: "in_progress", currentIndex: 0,
    snapshot: { id: "local-attempt", recipe, questions: [{ id: "first", options: { A: "One", B: "Two" } }, { id: "second", options: { A: "One", B: "Two" } }] },
    answers: { first: "A" }, feedback: {}, elapsedSeconds: 0,
    startedAt: new Date(started).toISOString(), updatedAt: new Date(started).toISOString(),
    timingMode: "wall_clock", deadlineAt: new Date(started + 60_000).toISOString(),
    ...overrides,
  };
}

test("only valid V3 durations enable a countdown; old recipes remain untimed", () => {
  for (const value of [1, 20, 720]) assert.equal(practiceDurationMinutes({ ...recipe, durationMinutes: value }), value);
  for (const value of [undefined, null, 0, -1, 721, 1.5, "20", false, [], {}]) assert.equal(practiceDurationMinutes({ ...recipe, durationMinutes: value }), null);
  assert.equal(practiceDurationMinutes({ ...recipe, version: 2 }), null);
  assert.equal(practiceDurationMinutes({ exam: "CSE", count: 20, order: "newest", durationMinutes: 20 }), null);
});

test("saved practice return paths restore only known builders", () => {
  for (const exam of ["CSE", "CAPF", "CDS", "NDA"]) {
    assert.equal(safePracticeReturnPath(`/exams/${exam}`), `/exams/${exam}`);
    assert.equal(attemptReturnPath(attempt({ returnPath: `/exams/${exam}` })), `/exams/${exam}`);
  }
  for (const value of [undefined, null, 42, "/", "https://example.com", "//example.com", "/exams/CSE?return=other", "/exams/cse", "/exams/JEE", "/practice/elsewhere"]) {
    assert.equal(safePracticeReturnPath(value), "/");
  }
  assert.equal(attemptReturnPath(attempt()), "/");
  assert.equal(attemptReturnPath(attempt({ returnPath: "https://example.com" })), "/");
  const legacy = attempt({ snapshot: { ...attempt().snapshot, recipe: { exam: "CSE", count: 20, order: "newest" } } });
  assert.equal(attemptReturnPath(legacy), "/exams/CSE");
  assert.equal(attemptReturnPath({ ...legacy, returnPath: "/" }), "/");
});

test("countdown uses its absolute deadline rather than stale saved elapsed time", () => {
  const saved = attempt({ elapsedSeconds: 2 });
  assert.deepEqual(attemptClock(saved, started + 20_000), { durationMinutes: 1, elapsedSeconds: 20, remainingSeconds: 40, expired: false });
  assert.deepEqual(attemptClock(saved, started + 59_001), { durationMinutes: 1, elapsedSeconds: 59, remainingSeconds: 1, expired: false });
  assert.deepEqual(attemptClock(saved, started + 60_000), { durationMinutes: 1, elapsedSeconds: 60, remainingSeconds: 0, expired: true });
  assert.deepEqual(attemptClock(saved, started + 600_000), { durationMinutes: 1, elapsedSeconds: 60, remainingSeconds: 0, expired: true });
});

test("reload and background suspension cannot reset or extend a countdown", () => {
  const saved = attempt();
  const reloaded = JSON.parse(JSON.stringify(saved));
  assert.equal(attemptClock(reloaded, started + 45_000).remainingSeconds, 15);
  assert.equal(attemptClock(reloaded, started + 45_000).elapsedSeconds, 45);
  assert.equal(attemptClock(reloaded, started + 75_000).expired, true);
  assert.equal(reloaded.deadlineAt, saved.deadlineAt);
  assert.equal(reloaded.elapsedSeconds, 0, "clock derivation must not mutate persisted data");
});

test("completion freezes elapsed time and preserves submitted answers and the snapshot", () => {
  const saved = attempt();
  const submitted = completeAttempt(saved, "submitted", started + 25_000);
  assert.equal(submitted.status, "completed");
  assert.equal(submitted.completionReason, "submitted");
  assert.equal(submitted.elapsedSeconds, 25);
  assert.equal(submitted.completedAt, new Date(started + 25_000).toISOString());
  assert.equal(attemptClock(submitted, started + 3_600_000).elapsedSeconds, 25);
  assert.deepEqual(submitted.answers, saved.answers);
  assert.deepEqual(submitted.snapshot, saved.snapshot);
  assert.equal(saved.status, "in_progress");
  assert.equal(saved.elapsedSeconds, 0);
  const expired = completeAttempt(saved, "time_expired", started + 600_000);
  assert.equal(expired.elapsedSeconds, 60);
  assert.equal(expired.completionReason, "time_expired");
});

test("legacy saved attempts retain their recorded elapsed time and do not acquire a deadline", () => {
  const old = attempt({ timingMode: undefined, deadlineAt: undefined, elapsedSeconds: 17, snapshot: { ...attempt().snapshot, recipe: { ...recipe, version: 2 } } });
  assert.deepEqual(attemptClock(old, started + 500_000), { durationMinutes: null, elapsedSeconds: 17, remainingSeconds: null, expired: false });
  const untimed = attempt({ deadlineAt: undefined, snapshot: { ...attempt().snapshot, recipe: { ...recipe, durationMinutes: null } } });
  assert.equal(attemptClock(untimed, started + 3_600_000).elapsedSeconds, 3600);
  assert.equal(attemptClock(untimed, started + 3_600_000).remainingSeconds, null);
  assert.equal(attemptClock(attempt({ startedAt: "invalid", elapsedSeconds: 8 }), started + 25_000).elapsedSeconds, 8);
  assert.equal(attemptClock(untimed, started - 5000).elapsedSeconds, 0);
});

test("time formatting is readable for minute, hour, and maximum-duration sessions", () => {
  for (const [seconds, text] of [[0, "00:00"], [-10, "00:00"], [1.9, "00:01"], [59, "00:59"], [60, "01:00"], [3599, "59:59"], [3600, "1:00:00"], [3661, "1:01:01"], [43_200, "12:00:00"]]) {
    assert.equal(formatPracticeTime(seconds), text);
  }
});

test("answer-sheet requests are forbidden before submission and never contact the API", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected API request"); });
  await assert.rejects(requestAnswerFeedback(attempt()), /Finish this practice before viewing its answers/);
  assert.equal(fetch.mock.callCount(), 0);
});

test("completed attempts request all answer keys including skipped questions", async (t) => {
  const completed = completeAttempt(attempt(), "submitted", started + 25_000);
  assert.equal(hasCompleteFeedback(completed), false);
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({ total: 2, correct: 1, incorrect: 0, unattempted: 1, feedback }));
  assert.deepEqual(await requestAnswerFeedback(completed), feedback);
  assert.equal(fetch.mock.callCount(), 1);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, "/api/practice/grade");
  assert.equal(options.method, "POST");
  assert.deepEqual(JSON.parse(options.body), { questionIds: ["first", "second"], answers: { first: "A" } });
  assert.equal(hasCompleteFeedback({ ...completed, feedback }), true);
  assert.equal(hasCompleteFeedback({ ...completed, feedback: { first: feedback.first } }), false);
  assert.deepEqual(completed.feedback, {}, "requesting feedback must not mutate the submitted attempt");
});

test("failed or incomplete grading keeps the submitted answers intact for retry", async (t) => {
  const completed = completeAttempt(attempt(), "submitted", started + 25_000);
  const original = structuredClone(completed);
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Result service unavailable." }, { status: 503 }));
  await assert.rejects(requestAnswerFeedback(completed), /Result service unavailable/);
  fetch.mock.mockImplementation(async () => Response.json({ feedback: { first: feedback.first } }));
  await assert.rejects(requestAnswerFeedback(completed), /answer sheet was incomplete/);
  fetch.mock.mockImplementation(async () => Response.json({ feedback: { ...feedback, second: { ...feedback.second, correctAnswer: "Z" } } }));
  await assert.rejects(requestAnswerFeedback(completed), /answer sheet was incomplete/);
  assert.deepEqual(completed, original);
});
