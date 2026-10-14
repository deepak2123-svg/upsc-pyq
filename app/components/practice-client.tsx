"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Bookmark, LocalAttempt, PracticeQuestion } from "../../lib/practice-types";
import { deleteBookmark, getAttempt, listBookmarks, putAttempt, saveBookmark } from "../../lib/practice-store";
import { attemptClock, attemptReturnPath, completeAttempt, formatPracticeTime, hasCompleteFeedback, requestAnswerFeedback } from "../../lib/practice-session";
import { formatPracticePrompt } from "../../lib/practice-prompt";
import { PYQ_EXAM_COLORS } from "../../lib/pyq-exams";

type ReadingSize = "small" | "standard" | "large";
const READING_SIZE_KEY = "upsc-pyq-reading-size:v1";
const readingSizes: { value: ReadingSize; label: string; symbol: string }[] = [
  { value: "small", label: "Small question text", symbol: "A−" },
  { value: "standard", label: "Default question text", symbol: "A" },
  { value: "large", label: "Large question text", symbol: "A+" },
];

const QuestionPalette = memo(function QuestionPalette({ questions, answers, currentIndex, bookmarkedIds, disabled, onNavigate }: {
  questions: PracticeQuestion[];
  answers: Record<string, string>;
  currentIndex: number;
  bookmarkedIds: Set<string>;
  disabled: boolean;
  onNavigate: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = questions.reduce((total, question) => total + Number(Boolean(answers[question.id])), 0);
  return <aside className={`question-palette ${open ? "open" : ""}`} aria-label="Question palette">
    <div className="palette-heading"><div><strong>Questions</strong><span>{answered}/{questions.length} answered</span></div><button type="button" className="palette-toggle" aria-expanded={open} aria-controls="question-palette-body" onClick={() => setOpen((value) => !value)}>{open ? "Hide numbers" : "Show all numbers"}</button></div>
    <div className="palette-body" id="question-palette-body">
      <div className="palette-grid">
        {questions.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isAnswered = Boolean(answers[item.id]);
          const isSaved = bookmarkedIds.has(item.id);
          const state = [isCurrent ? "current" : "", isAnswered ? "answered" : "unanswered", isSaved ? "saved" : ""].filter(Boolean).join(" ");
          return <button key={item.id} type="button" className={state} aria-current={isCurrent ? "step" : undefined} aria-label={`Question ${index + 1}, ${isAnswered ? "answered" : "not answered"}${isSaved ? ", saved" : ""}`} disabled={disabled} onClick={() => onNavigate(index)}>{index + 1}</button>;
        })}
      </div>
      <div className="palette-legend" aria-label="Question status legend"><span><i className="current" />Current</span><span><i className="answered" />Answered</span><span><i className="unanswered" />Not answered</span><span><i className="saved" />Saved</span></div>
    </div>
  </aside>;
});

export function PracticeClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [attempt, setAttempt] = useState<LocalAttempt | null>();
  const [busy, setBusy] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [readingSize, setReadingSize] = useState<ReadingSize>("standard");
  const [error, setError] = useState("");
  const [gradeError, setGradeError] = useState("");
  const [gradeRetry, setGradeRetry] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const current = useRef<LocalAttempt | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const submitting = useRef(false);
  const expiryTried = useRef(false);
  const pendingCompletion = useRef<LocalAttempt | null>(null);
  const queryIndex = searchParams.get("q");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(READING_SIZE_KEY);
      if (saved === "small" || saved === "standard" || saved === "large") setReadingSize(saved);
    } catch { /* The control still works for this page if storage is unavailable. */ }
  }, []);

  const chooseReadingSize = useCallback((size: ReadingSize) => {
    setReadingSize(size);
    try { window.localStorage.setItem(READING_SIZE_KEY, size); } catch { /* Keep the in-memory choice. */ }
  }, []);

  const showAttempt = useCallback((value: LocalAttempt) => {
    current.current = value;
    setAttempt(value);
  }, []);

  // Queue immutable snapshots: timer, answer and navigation saves cannot race.
  const persist = useCallback(async (value: LocalAttempt) => {
    const write = writes.current.catch(() => {}).then(() => putAttempt(value));
    writes.current = write;
    await write;
  }, []);

  useEffect(() => {
    let active = true;
    current.current = null;
    pendingCompletion.current = null;
    expiryTried.current = false;
    submitting.current = false;
    setAttempt(undefined);
    setBusy(false);
    setError("");
    setGradeError("");
    setSaveFailed(false);
    void getAttempt(id).then((stored) => {
      if (!active) return;
      current.current = stored || null;
      setAttempt(stored || null);
      setNow(Date.now());
    }).catch(() => {
      if (active) { setAttempt(null); setError("This browser could not open your saved practice. Allow browser storage and reload this page."); }
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const value = current.current;
    const requestedIndex = queryIndex === null ? NaN : Number(queryIndex);
    if (value && Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < value.snapshot.questions.length && requestedIndex !== value.currentIndex) {
      showAttempt({ ...value, currentIndex: requestedIndex });
    }
  }, [attempt?.id, queryIndex, showAttempt]);

  const finish = useCallback(async (reason: "submitted" | "time_expired" = "submitted") => {
    const value = current.current;
    if (!value || submitting.current) return;
    if (value.status === "completed") { router.push(`/practice/${id}/results`); return; }
    submitting.current = true;
    setBusy(true);
    setError("");
    const completed = pendingCompletion.current || completeAttempt(value, attemptClock(value).expired ? "time_expired" : reason);
    pendingCompletion.current = completed;
    try {
      await persist(completed);
      showAttempt(completed);
      setSaveFailed(false);
      router.push(`/practice/${id}/results`);
    } catch {
      setSaveFailed(true);
      setError("Your submission could not be saved in this browser. Your answers remain here. Retry saving before leaving this page.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [id, persist, router, showAttempt]);

  const attemptStatus = attempt?.status;
  useEffect(() => {
    if (attemptStatus !== "in_progress" || !saveFailed) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [attemptStatus, saveFailed]);

  useEffect(() => {
    if (attemptStatus !== "in_progress") return;
    let ticks = 0;
    function tick() {
      const value = current.current;
      if (!value || value.status !== "in_progress" || pendingCompletion.current) return;
      const timestamp = Date.now();
      setNow(timestamp);
      const clock = attemptClock(value, timestamp);
      if (clock.expired) {
        if (!expiryTried.current) { expiryTried.current = true; void finish("time_expired"); }
        return;
      }
      ticks += 1;
      const elapsedSeconds = value.timingMode === "wall_clock" ? clock.elapsedSeconds : value.elapsedSeconds + 1;
      const next = { ...value, elapsedSeconds };
      showAttempt(next);
      if (ticks % 5 === 0) void persist(next).catch(() => {
        setSaveFailed(true);
        setError("Your latest progress could not be saved. Retry saving before leaving this page.");
      });
    }
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);
    if (current.current && attemptClock(current.current).expired) { expiryTried.current = true; void finish("time_expired"); }
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [attemptStatus, finish, persist, showAttempt]);

  const question = attempt?.snapshot.questions[attempt.currentIndex];
  const questionId = question?.id;
  const feedback = attempt?.status === "completed" && question ? attempt.feedback[question.id] : undefined;
  const selectedAnswer = question ? attempt?.answers[question.id] : undefined;

  useEffect(() => {
    let active = true;
    void listBookmarks().then((items) => {
      if (!active) return;
      const ids = new Set(items.map((item) => item.questionId));
      setBookmarkedIds(ids);
      setBookmarked(questionId ? ids.has(questionId) : false);
    }).catch(() => { if (active) { setBookmarkedIds(new Set()); setBookmarked(false); } });
    return () => { active = false; };
  }, [questionId]);

  useEffect(() => {
    const value = current.current;
    if (!value || value.status !== "completed" || pendingCompletion.current || hasCompleteFeedback(value)) return;
    let active = true;
    setGradeError("");
    void requestAnswerFeedback(value).then(async (graded) => {
      if (!active) return;
      const latest = current.current;
      if (!latest || latest.status !== "completed") return;
      const next = { ...latest, feedback: graded };
      showAttempt(next);
      await persist(next);
    }).catch((failure: unknown) => {
      if (active) setGradeError(failure instanceof Error ? failure.message : "Your answer sheet could not be loaded. Please retry.");
    });
    return () => { active = false; };
  }, [attemptStatus, gradeRetry, persist, showAttempt]);

  const saveChange = useCallback(async (next: LocalAttempt) => {
    showAttempt(next);
    setBusy(true);
    setError("");
    try { await persist(next); setSaveFailed(false); }
    catch { setSaveFailed(true); setError("Your latest progress could not be saved. Your answers remain here. Retry saving before leaving this page."); }
    finally { setBusy(false); }
  }, [persist, showAttempt]);

  async function answer(option: string | null) {
    const value = current.current;
    if (!value || !question || busy || saveFailed || pendingCompletion.current || value.status !== "in_progress" || attemptClock(value).expired) return;
    const answers = { ...value.answers };
    if (option === null) delete answers[question.id];
    else answers[question.id] = option;
    // Older in-progress attempts may contain instant-feedback results. Any edit
    // invalidates that cached grading; the final answer sheet must use new answers.
    await saveChange({ ...value, answers, feedback: {} });
  }

  const navigate = useCallback(async (index: number) => {
    const value = current.current;
    if (!value || busy || pendingCompletion.current) return;
    const next = { ...value, currentIndex: Math.max(0, Math.min(value.snapshot.questions.length - 1, index)) };
    await saveChange(next);
    window.history.replaceState(null, "", `/practice/${id}?q=${next.currentIndex}`);
    document.querySelector<HTMLElement>(".practice-question h1")?.focus();
  }, [busy, id, saveChange]);
  const jumpToQuestion = useCallback((index: number) => { void navigate(index); }, [navigate]);

  async function toggleBookmark() {
    if (!question) return;
    try {
      if (bookmarked) await deleteBookmark(question.id);
      else {
        const bookmark: Bookmark = { questionId: question.id, exam: question.exam, year: question.year, paper: question.paper, questionNumber: question.questionNumber, subject: question.subject, topic: question.topic, prompt: question.promptLines.join("\n"), savedAt: new Date().toISOString() };
        await saveBookmark(bookmark);
      }
      const nextBookmarked = !bookmarked;
      setBookmarked(nextBookmarked);
      setBookmarkedIds((ids) => {
        const next = new Set(ids);
        if (nextBookmarked) next.add(question.id); else next.delete(question.id);
        return next;
      });
    } catch { setError("This bookmark could not be saved. Your selected answer has not changed."); }
  }

  if (attempt === undefined) return <main className="practice-loading" aria-busy="true"><div /><div /><div /></main>;
  if (!attempt || !question) return <main className="practice-missing"><p className="pyq-kicker">Local practice</p><h1>This session is not on this device.</h1><p>{error || "Practice history is stored only in this browser."}</p><Link href="/">Return to PYQs</Link></main>;

  const answered = attempt.snapshot.questions.filter((item) => Boolean(attempt.answers[item.id])).length;
  const clock = attemptClock(attempt, now);
  const locked = busy || saveFailed || Boolean(pendingCompletion.current) || clock.expired || attempt.status === "completed";
  const isTimed = clock.remainingSeconds !== null;
  const timerValue = isTimed && attempt.status !== "completed" ? clock.remainingSeconds! : clock.elapsedSeconds;
  const prompt = formatPracticePrompt(question.promptLines);
  const sourceLabel = `${question.exam} · ${question.paper} · ${question.year}`;
  return (
    <main className="practice-shell exam-experience">
      <header className="practice-topbar">
        <Link href={attemptReturnPath(attempt)} aria-label="Exit test" onClick={(event) => { if (busy || saveFailed || pendingCompletion.current) { event.preventDefault(); setError("Save your latest progress before leaving this page."); } }}>← Exit</Link>
        <span className="practice-session-title"><strong>Question {attempt.currentIndex + 1} of {attempt.snapshot.questions.length}</strong><small aria-live="polite" aria-atomic="true">{answered} answered</small></span>
        <div className={`practice-timer ${isTimed && timerValue <= 60 && attempt.status !== "completed" ? "is-low" : ""}`}><small>{isTimed && attempt.status !== "completed" ? "Time left" : "Elapsed"}</small><time aria-label={`${isTimed && attempt.status !== "completed" ? "Time remaining" : "Elapsed time"} ${formatPracticeTime(timerValue)}`}>{formatPracticeTime(timerValue)}</time></div>
        <button disabled={busy} onClick={() => void finish()}>{busy ? "Saving…" : attempt.status === "completed" ? "Results" : pendingCompletion.current ? "Retry saving" : "Finish"}</button>
      </header>
      <div className="practice-progress" role="progressbar" aria-label="Practice progress" aria-valuemin={0} aria-valuemax={attempt.snapshot.questions.length} aria-valuenow={answered}><span style={{ width: `${answered / attempt.snapshot.questions.length * 100}%` }} /></div>
      {error && <div className="practice-save-error" role="alert"><p>{error}</p>{saveFailed && !pendingCompletion.current && <button onClick={() => { const value = current.current; if (value) void saveChange(value); }}>Retry saving</button>}</div>}
      <div className="exam-workspace">
        <QuestionPalette questions={attempt.snapshot.questions} answers={attempt.answers} currentIndex={attempt.currentIndex} bookmarkedIds={bookmarkedIds} disabled={busy || Boolean(pendingCompletion.current)} onNavigate={jumpToQuestion} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.article className={`practice-question reading-${readingSize}`} key={question.id} initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .18 }}>
          <div className="question-heading"><div className="question-context"><span>Question {attempt.currentIndex + 1} of {attempt.snapshot.questions.length}</span><span>{question.subject}{question.topic ? ` · ${question.topic}` : ""}</span></div><fieldset className="reading-size" aria-label="Question text size"><legend>Text size</legend>{readingSizes.map((size) => <button key={size.value} type="button" title={size.label} aria-label={size.label} aria-pressed={readingSize === size.value} onClick={() => chooseReadingSize(size.value)}>{size.symbol}</button>)}</fieldset></div>
          <div className="question-copy">
            <div className="question-paper">
              <h1 tabIndex={-1}>{prompt.map((block, index) => block.kind === "statement" ? <span className="paper-statement" key={`${question.id}-${index}`}><b>{block.number}.</b>{block.text}</span> : <span key={`${question.id}-${index}`}>{block.text}</span>)}</h1>
              <p className="question-origin"><span style={{ background: PYQ_EXAM_COLORS[question.exam] }} />First appeared: <strong>{sourceLabel}</strong> · Question {question.questionNumber}</p>
            </div>
            <div className="practice-choice-panel">
              <div className="practice-options" role="group" aria-label="Answer options" aria-busy={busy}>
                {Object.entries(question.options).map(([key, value]) => {
                  const isSelected = selectedAnswer === key;
                  const isCorrect = feedback?.correctAnswer === key;
                  const isWrong = Boolean(feedback && isSelected && !feedback.correct);
                  return <button key={key} aria-pressed={isSelected} className={`${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`} disabled={locked} onClick={() => void answer(key)}><span>{key}</span><strong>{value}</strong>{isCorrect && <em>Correct answer</em>}{isWrong && <em>Your answer</em>}</button>;
                })}
              </div>
              {attempt.status === "in_progress" && <div className="practice-answer-hint"><p>Choose one option. You can change it until you finish.</p>{selectedAnswer && <button disabled={locked} onClick={() => void answer(null)}>Clear answer</button>}<small>Answers and explanations appear after submission.</small></div>}
            </div>
          </div>
          {attempt.status === "completed" && !feedback && <div className="practice-answer-hint" role="status"><p>{gradeError || "Loading your submitted answer sheet…"}</p>{gradeError && <button onClick={() => setGradeRetry((value) => value + 1)}>Retry answers</button>}</div>}
          {feedback && <section className={`answer-feedback ${!selectedAnswer ? "is-unattempted" : feedback.correct ? "is-correct" : "is-incorrect"}`}><div><strong>{!selectedAnswer ? `Unattempted · Correct answer: ${feedback.correctAnswer}` : feedback.correct ? `Correct · Answer ${feedback.correctAnswer}` : `Correct answer: ${feedback.correctAnswer} · Your answer: ${selectedAnswer}`}</strong></div>{feedback.explanation ? <p>{feedback.explanation}</p> : <p className="explanation-unavailable">No published explanation is available for this question.</p>}</section>}
          <nav className="question-navigation" aria-label="Question navigation"><button disabled={busy || Boolean(pendingCompletion.current) || attempt.currentIndex === 0} onClick={() => void navigate(attempt.currentIndex - 1)}>← Previous</button><button className="bookmark-action" onClick={() => void toggleBookmark()}>{bookmarked ? "Saved" : "Save for later"}</button>{attempt.currentIndex < attempt.snapshot.questions.length - 1 ? <button className="next-question" disabled={busy || Boolean(pendingCompletion.current)} onClick={() => void navigate(attempt.currentIndex + 1)}>Save & next →</button> : <button className="next-question" disabled={busy} onClick={() => void finish()}>{attempt.status === "completed" ? "View results" : "Submit test"}</button>}</nav>
        </motion.article>
      </AnimatePresence>
      </div>
    </main>
  );
}
