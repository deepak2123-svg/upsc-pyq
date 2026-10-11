"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocalAttempt, PracticeQuestion, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt, getAttempt, putAttempt } from "../../lib/practice-store";
import { attemptReturnPath, formatPracticeTime, hasCompleteFeedback, practiceDurationMinutes, requestAnswerFeedback } from "../../lib/practice-session";
import { PYQ_EXAMS, PYQ_EXAM_COLORS } from "../../lib/pyq-exams";

type Performance = { total: number; answered: number; correct: number; incorrect: number; unattempted: number };
function newPerformance(): Performance { return { total: 0, answered: 0, correct: 0, incorrect: 0, unattempted: 0 }; }
function statusOf(attempt: LocalAttempt, question: PracticeQuestion) {
  if (!attempt.answers[question.id]) return "Unattempted";
  const feedback = attempt.feedback[question.id];
  return feedback ? feedback.correct ? "Correct" : "Incorrect" : "Awaiting grading";
}
function countQuestion(value: Performance, attempt: LocalAttempt, question: PracticeQuestion) {
  value.total += 1;
  if (!attempt.answers[question.id]) value.unattempted += 1;
  else {
    value.answered += 1;
    if (attempt.feedback[question.id]?.correct) value.correct += 1;
    else if (attempt.feedback[question.id]) value.incorrect += 1;
  }
}
function accuracy(value: Performance) { return value.answered ? `${Math.round(value.correct / value.answered * 100)}%` : "—"; }
function sourceLabel(question: PracticeQuestion) { return `${question.exam} ${question.year} · ${question.paper} · Q${question.questionNumber}`; }
function scopeLabel(question: PracticeQuestion) { return [question.subject, question.section, question.topic || "Unclassified topic"].filter(Boolean).join(" · "); }
function dateLabel(value?: string) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
}

function PerformanceTable({ label, rows, ready, source = false }: { label: string; rows: [string, Performance][]; ready: boolean; source?: boolean }) {
  return <><p className="result-scroll-hint">Swipe to view all columns.</p><div className="result-table-scroll"><table className="result-performance-table" aria-label={label}><thead><tr><th scope="col">{source ? "Exam source" : "Subject / topic"}</th><th scope="col">Total</th><th scope="col">Answered</th><th scope="col">Correct</th><th scope="col">Incorrect</th><th scope="col">Unattempted</th><th scope="col">Accuracy</th></tr></thead><tbody>{rows.map(([name, value]) => <tr key={name}><th scope="row">{source ? <span className="result-exam-label" style={{ color: PYQ_EXAM_COLORS[name as keyof typeof PYQ_EXAM_COLORS] }}>{name}</span> : name}</th><td>{value.total}</td><td>{value.answered}</td><td>{ready ? value.correct : "—"}</td><td>{ready ? value.incorrect : "—"}</td><td>{value.unattempted}</td><td>{ready ? accuracy(value) : "—"}</td></tr>)}</tbody></table></div></>;
}

export function ResultsClient({ id }: { id: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<LocalAttempt | null>();
  const [error, setError] = useState("");
  const [grading, setGrading] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [retry, setRetry] = useState(0);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    let active = true;
    void getAttempt(id).then((value) => { if (active) setAttempt(value || null); }).catch(() => {
      if (active) { setAttempt(null); setError("This browser could not open your saved result. Allow browser storage and reload this page."); }
    });
    return () => { active = false; };
  }, [id]);

  const status = attempt?.status;
  const ready = attempt ? hasCompleteFeedback(attempt) : false;
  useEffect(() => {
    if (!attempt || status !== "completed" || ready) return;
    let active = true;
    setGrading(true);
    setError("");
    void requestAnswerFeedback(attempt).then(async (feedback) => {
      if (!active) return;
      const next = { ...attempt, feedback };
      try { await putAttempt(next); }
      catch { if (active) setActionError("The result is visible, but this browser could not save its answer sheet. Your submitted answers remain saved. Reloading will retry grading."); }
      if (active) { setGrading(false); setAttempt(next); }
    }).catch((failure: unknown) => {
      if (active) setError(failure instanceof Error ? failure.message : "Your result could not be graded. Your submitted answers are saved; please retry.");
    }).finally(() => { if (active) setGrading(false); });
    return () => { active = false; };
  }, [attempt, status, ready, retry]);

  const stats = useMemo(() => {
    if (!attempt) return null;
    const total = newPerformance();
    const byExam = new Map<string, Performance>();
    const byTopic = new Map<string, Performance>();
    for (const question of attempt.snapshot.questions) {
      countQuestion(total, attempt, question);
      const exam = byExam.get(question.exam) || newPerformance();
      countQuestion(exam, attempt, question);
      byExam.set(question.exam, exam);
      const name = scopeLabel(question);
      const topic = byTopic.get(name) || newPerformance();
      countQuestion(topic, attempt, question);
      byTopic.set(name, topic);
    }
    return { total, byExam: PYQ_EXAMS.filter((exam) => byExam.has(exam)).map((exam): [string, Performance] => [exam, byExam.get(exam)!]), byTopic: [...byTopic.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0])) };
  }, [attempt]);

  const retake = useCallback(async () => {
    if (!attempt || retaking) return;
    setRetaking(true);
    setActionError("");
    try {
      const response = await fetch("/api/practice-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attempt.snapshot.recipe) });
      const result = await response.json().catch(() => null) as (PracticeSnapshot & { error?: string }) | null;
      if (!response.ok || !result?.id || !Array.isArray(result.questions) || !result.questions.length) throw new Error(result?.error || "This selection could not be recreated. Please try again.");
      try { await createLocalAttempt(result, attemptReturnPath(attempt)); }
      catch { throw new Error("This browser could not save the new attempt. Allow browser storage and try again. Your result is still here."); }
      router.push(`/practice/${result.id}`);
    } catch (failure: unknown) { setActionError(failure instanceof Error ? failure.message : "A new attempt could not be started. Please try again."); }
    finally { setRetaking(false); }
  }, [attempt, retaking, router]);

  if (attempt === undefined) return <main className="practice-loading" aria-busy="true"><div /><div /><div /></main>;
  if (!attempt || !stats) return <main className="practice-missing"><h1>Results are not on this device.</h1>{error && <p role="alert">{error}</p>}<Link href="/attempts">View attempts</Link></main>;
  if (attempt.status !== "completed") return <main className="practice-missing"><p className="pyq-kicker">Practice in progress</p><h1>Finish your practice to view answers.</h1><p>Correct answers appear after you submit this attempt.</p><Link href={`/practice/${id}`}>Continue practice</Link></main>;

  const duration = practiceDurationMinutes(attempt.snapshot.recipe);
  const subjects = [...new Set(attempt.snapshot.questions.map((question) => question.subject))].join(" + ");
  const completed = attempt.completionReason === "time_expired" ? "Time expired" : "Submitted";
  return (
    <main className="results-page pyq-page exam-results">
      <Link className="back-link result-no-print" href="/attempts">← Attempts</Link>
      <section className="result-summary">
        <div className="result-sheet-heading"><div><p className="pyq-kicker">Practice complete</p><h1>Result sheet</h1><p>{subjects || "Official PYQs"}</p></div><span className="result-completion-reason">{completed}</span></div>
        <dl className="result-session-details"><div><dt>Completed</dt><dd>{dateLabel(attempt.completedAt)}</dd></div><div><dt>Time taken</dt><dd>{formatPracticeTime(attempt.elapsedSeconds)}</dd></div><div><dt>Time limit</dt><dd>{duration === null ? "Untimed" : `${duration} minutes`}</dd></div><div><dt>Attempt ID</dt><dd>{attempt.id}</dd></div></dl>
        <div className="result-numbers"><div><strong>{stats.total.total}</strong><span>Total questions</span></div><div><strong>{stats.total.answered}</strong><span>Answered</span></div><div><strong>{ready ? stats.total.correct : "—"}</strong><span>Correct</span></div><div><strong>{ready ? stats.total.incorrect : "—"}</strong><span>Incorrect</span></div><div><strong>{stats.total.unattempted}</strong><span>Unattempted</span></div><div><strong>{ready ? accuracy(stats.total) : "—"}</strong><span>Accuracy</span></div></div>
        <p className="result-score-note">Accuracy is correct answers ÷ answered questions. Unattempted questions are excluded. No common marks scheme is applied to mixed-exam practice.</p>
        {(grading || !ready) && <div className="result-grading-status result-no-print" role={error ? "alert" : "status"} aria-live="polite"><p>{error || "Your answers are submitted and saved. Loading the answer sheet…"}</p>{error && <button disabled={grading} onClick={() => setRetry((value) => value + 1)}>Retry answers</button>}</div>}
        <div className="result-actions result-no-print"><button disabled={retaking} onClick={() => void retake()}>{retaking ? "Starting…" : "Retake selection"}</button><button className="result-print-button" disabled={!ready} onClick={() => window.print()}>Print result sheet</button><Link href="/">Choose new PYQs</Link></div>
        {actionError && <p className="result-action-error result-no-print" role="alert">{actionError}</p>}
      </section>
      <section className="result-breakdown"><h2>Performance by exam source</h2><PerformanceTable label="Exam source performance" rows={stats.byExam} ready={ready} source /></section>
      <section className="result-breakdown"><h2>Performance by subject and topic</h2><PerformanceTable label="Subject and topic performance" rows={stats.byTopic} ready={ready} /></section>
      <section className="result-answer-sheet"><h2>Answer sheet</h2><p>Compare each submitted answer with the official answer. Open a row below to review the question.</p><p className="result-scroll-hint">Swipe to view all columns.</p><div className="result-table-scroll"><table aria-label="Answer sheet" data-testid="answer-sheet"><thead><tr><th scope="col">No.</th><th scope="col">Source / topic</th><th scope="col">Your answer</th><th scope="col">Correct answer</th><th scope="col">Result</th></tr></thead><tbody>{attempt.snapshot.questions.map((question, index) => {
        const feedback = attempt.feedback[question.id];
        const selected = attempt.answers[question.id];
        const status = statusOf(attempt, question);
        return <tr key={question.id}><th scope="row"><a href={`#review-${index + 1}`}>{index + 1}</a></th><td><span className="result-source" style={{ color: PYQ_EXAM_COLORS[question.exam] }}>{sourceLabel(question)}</span><small>{scopeLabel(question)}</small></td><td>{selected || "—"}</td><td>{feedback?.correctAnswer || "—"}</td><td><span className={`answer-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></td></tr>;
      })}</tbody></table></div></section>
      <section className="result-review result-detailed-review"><h2>Question review</h2>{attempt.snapshot.questions.map((question, index) => {
        const feedback = attempt.feedback[question.id];
        const selected = attempt.answers[question.id];
        const status = statusOf(attempt, question);
        return <details key={question.id} id={`review-${index + 1}`}><summary><span className="review-question-number">{index + 1}</span><strong>{question.promptLines.join(" ")}</strong><span className={`answer-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></summary><div className="result-question-detail"><p className="result-source" style={{ color: PYQ_EXAM_COLORS[question.exam] }}>{sourceLabel(question)}</p><div className="result-question-prompt">{question.promptLines.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</div><dl className="result-question-options">{Object.entries(question.options).map(([key, value]) => <div key={key} className={feedback?.correctAnswer === key ? "is-correct" : selected === key ? "is-selected" : ""}><dt>{key}</dt><dd>{value}{feedback?.correctAnswer === key && <small>Correct answer</small>}{selected === key && <small>Your answer</small>}</dd></div>)}</dl><p className="result-explanation-label">Explanation</p><p className="result-explanation">{feedback ? feedback.explanation || "No published explanation is available for this question." : "The answer sheet has not loaded yet."}</p><Link className="result-no-print" href={`/practice/${id}?q=${index}`}>Review in question view</Link></div></details>;
      })}</section>
      <p className="result-print-footer">UPSC.PYQ.Practise · Local practice result · {attempt.id}</p>
    </main>
  );
}
