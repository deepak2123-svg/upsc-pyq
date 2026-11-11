"use client";
import {feedbackAnswerLabel,feedbackAcceptsOption} from '../../lib/answer-options';

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocalAttempt, PracticeQuestion, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt, getAttempt, putAttempt } from "../../lib/practice-store";
import { attemptReturnPath, formatPracticeTime, hasCompleteFeedback, practiceDurationMinutes, requestAnswerFeedback } from "../../lib/practice-session";
import { PYQ_EXAM_COLORS } from "../../lib/pyq-exams";
import { formatPracticePrompt, formatPracticeText } from "../../lib/practice-prompt";
import { PracticePromptView } from "./practice-prompt-view";
import {MathText} from './math-text';
import { questionExclusion, questionCorrectionNotice } from '../../lib/question-review';

type Performance = { total: number; answered: number; correct: number; incorrect: number; unattempted: number; excluded: number };
function newPerformance(): Performance { return { total: 0, answered: 0, correct: 0, incorrect: 0, unattempted: 0, excluded: 0 }; }
function statusOf(attempt: LocalAttempt, question: PracticeQuestion) {
  if (questionExclusion(question.id, question.contentRevision ?? 0)) return 'Excluded from score';
  if (!attempt.answers[question.id]) return "Unattempted";
  const feedback = attempt.feedback[question.id];
  return feedback ? feedback.correct ? "Correct" : "Incorrect" : "Awaiting grading";
}
function countQuestion(value: Performance, attempt: LocalAttempt, question: PracticeQuestion) {
  if (questionExclusion(question.id, question.contentRevision ?? 0)) { value.excluded += 1; return; }
  value.total += 1;
  if (!attempt.answers[question.id]) value.unattempted += 1;
  else {
    value.answered += 1;
    if (attempt.feedback[question.id]?.correct) value.correct += 1;
    else if (attempt.feedback[question.id]) value.incorrect += 1;
  }
}
function accuracy(value: Performance) { return value.answered ? `${Math.round(value.correct / value.answered * 100)}%` : "—"; }
function markingRule(question: PracticeQuestion) {
  if (question.exam === "NDA") return question.subject === "Mathematics" ? { positive: 2.5, negative: 2.5 / 3 } : { positive: 4, negative: 4 / 3 };
  if (question.exam === "CDS") return /mathematics/i.test(question.subject) ? { positive: 100 / 120, negative: 100 / 360 } : { positive: 1, negative: 1 / 3 };
  return { positive: 2, negative: 2 / 3 };
}
function questionMarks(attempt: LocalAttempt, question: PracticeQuestion) {
  if (questionExclusion(question.id, question.contentRevision ?? 0) || !attempt.answers[question.id]) return 0;
  const feedback = attempt.feedback[question.id];
  if (!feedback) return 0;
  const rule = markingRule(question);
  return feedback.correct ? rule.positive : -rule.negative;
}
function formatMarks(value: number, signed = true) {
  const rounded = Math.round(value * 100) / 100;
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return signed && rounded > 0 ? `+${label}` : label;
}
function sourceLabel(question: PracticeQuestion) { return `${question.exam} ${question.year} · ${question.paper} · Q${question.questionNumber}`; }
function scopeLabel(question: PracticeQuestion) { return [question.subject, question.section, question.topic || "Unclassified topic"].filter(Boolean).join(" · "); }
function dateLabel(value?: string) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
}

export function ResultsClient({ id }: { id: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<LocalAttempt | null>();
  const [error, setError] = useState("");
  const [grading, setGrading] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [retry, setRetry] = useState(0);
  const [actionError, setActionError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
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
    for (const question of attempt.snapshot.questions) countQuestion(total, attempt, question);
    return { total };
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
  const score = ready ? attempt.snapshot.questions.reduce((total, question) => total + questionMarks(attempt, question), 0) : 0;
  const maximumScore = attempt.snapshot.questions.reduce((total, question) => questionExclusion(question.id, question.contentRevision ?? 0) ? total : total + markingRule(question).positive, 0);
  return (
    <main className="results-page pyq-page exam-results">
      <header className="result-page-nav result-no-print"><Link className="pyq-brand" href="/" aria-label="UPSC.PYQ.Practise home"><span className="pyq-brand-mark" aria-hidden="true">PYQ</span><span>UPSC.PYQ.Practise</span></Link><Link className="back-link" href="/attempts">← Attempts</Link></header>
      <section className="result-summary">
        <div className="result-sheet-heading"><div><p className="pyq-kicker">Practice complete</p><h1>Result sheet</h1><p>{subjects || "Official PYQs"}</p></div><span className="result-completion-reason">{completed}</span></div>
        <dl className="result-session-details"><div><dt>Completed</dt><dd>{dateLabel(attempt.completedAt)}</dd></div><div><dt>Time taken</dt><dd>{formatPracticeTime(attempt.elapsedSeconds)}</dd></div><div><dt>Time limit</dt><dd>{duration === null ? "Untimed" : `${duration} minutes`}</dd></div><div><dt>Attempt ID</dt><dd>{attempt.id}</dd></div></dl>
        <div className="result-numbers"><div><strong>{stats.total.total}</strong><span>Scored questions</span></div><div><strong>{stats.total.answered}</strong><span>Answered</span></div><div><strong>{ready ? stats.total.correct : "—"}</strong><span>Correct</span></div><div><strong>{ready ? stats.total.incorrect : "—"}</strong><span>Incorrect</span></div><div><strong>{stats.total.unattempted}</strong><span>Unattempted</span></div><div><strong>{ready ? accuracy(stats.total) : "—"}</strong><span>Accuracy</span></div></div>
        <p className="result-score-note">Marks use the official positive and negative-marking rule for each question’s source paper. Unattempted and excluded questions receive 0.</p>
        {attempt.snapshot.questions.map((q,index)=>questionCorrectionNotice(q)?<p className="result-score-note" key={q.id}>Saved Q{index+1}: {questionCorrectionNotice(q)}</p>:null)}
        {stats.total.excluded > 0 && <p role="status">{stats.total.excluded} question{stats.total.excluded === 1 ? '' : 's'} excluded from score. Totals above include scored questions only; your original answers are preserved.</p>}
        {(grading || !ready) && <div className="result-grading-status result-no-print" role={error ? "alert" : "status"} aria-live="polite"><p>{error || "Your answers are submitted and saved. Loading the answer sheet…"}</p>{error && <button disabled={grading} onClick={() => setRetry((value) => value + 1)}>Retry answers</button>}</div>}
        <div className="result-actions result-no-print"><button disabled={retaking} onClick={() => void retake()}>{retaking ? "Starting…" : "Retake selection"}</button><button className="result-print-button" disabled={!ready} onClick={() => window.print()}>Print result sheet</button><Link href="/">Choose new PYQs</Link></div>
        {actionError && <p className="result-action-error result-no-print" role="alert">{actionError}</p>}
      </section>
      <section className="result-answer-sheet result-combined-review"><h2>Answer key and score</h2><p>Your selected option, the official answer and marks for every question. Select a row to review the full question.</p><p className="result-scroll-hint">Swipe to view all columns.</p><div className="result-table-scroll"><table aria-label="Answer sheet" data-testid="answer-sheet"><thead><tr><th scope="col">No.</th><th scope="col">Source / topic</th><th scope="col">Your option</th><th scope="col">Correct option</th><th scope="col">Result</th><th scope="col">Marks</th></tr></thead><tbody>{attempt.snapshot.questions.map((question, index) => {
        const feedback = ready ? attempt.feedback[question.id] : undefined;
        const selected = attempt.answers[question.id];
        const status = statusOf(attempt, question);
        const expanded = expandedQuestion === index;
        const marks = ready ? questionMarks(attempt, question) : 0;
        return <Fragment key={question.id}><tr className={expanded ? "is-expanded" : undefined}><th scope="row"><button type="button" className="result-review-toggle" aria-expanded={expanded} aria-controls={`answer-detail-${index + 1}`} aria-label={`${expanded ? "Close" : "Review"} question ${index + 1}`} onClick={() => setExpandedQuestion(expanded ? null : index)}><span>{index + 1}</span><i aria-hidden="true">⌄</i></button></th><td><button type="button" className="result-source-toggle" aria-expanded={expanded} aria-controls={`answer-detail-${index + 1}`} onClick={() => setExpandedQuestion(expanded ? null : index)}><span className="result-source" style={{ color: PYQ_EXAM_COLORS[question.exam] }}>{sourceLabel(question)}</span><small>{scopeLabel(question)}</small></button></td><td>{selected || "—"}</td><td>{feedbackAnswerLabel(feedback)}</td><td><span className={`answer-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></td><td className={`result-row-marks ${marks > 0 ? "is-positive" : marks < 0 ? "is-negative" : ""}`}>{ready ? formatMarks(marks) : "—"}</td></tr>{expanded ? <tr className="result-answer-detail-row"><td colSpan={6} id={`answer-detail-${index + 1}`}><div className="result-question-detail"><PracticePromptView blocks={formatPracticePrompt(question.promptLines,{options:question.options})} className="result-question-prompt" figure={question.figure} underlined={question.underlined} /><dl className="result-question-options">{Object.entries(question.options).map(([key, value]) => <div key={key} className={feedbackAcceptsOption(feedback,key) ? "is-correct" : selected === key ? "is-selected" : ""}><dt>{key}</dt><dd><MathText value={formatPracticeText(value)}/>{feedbackAcceptsOption(feedback,key) && <small>Correct answer</small>}{selected === key && <small>Your answer</small>}</dd></div>)}</dl><p className="result-explanation-label">Explanation</p><p className="result-explanation"><MathText value={feedback ? feedback.explanation || "No published explanation is available for this question." : "The answer sheet has not loaded yet."}/></p><Link className="result-no-print" href={`/practice/${id}?q=${index}`}>Open in question view</Link></div></td></tr> : null}</Fragment>;
      })}</tbody></table></div><div className="result-final-score"><span>Final score</span><strong>{ready ? `${formatMarks(score, false)} / ${formatMarks(maximumScore, false)}` : "—"}</strong></div></section>
      <p className="result-print-footer">UPSC.PYQ.Practise · Local practice result · {attempt.id}</p>
    </main>
  );
}
