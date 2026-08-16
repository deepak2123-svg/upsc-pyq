"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { AnswerFeedback, Bookmark, LocalAttempt } from "../../lib/practice-types";
import { deleteBookmark, getAttempt, getBookmark, putAttempt, saveBookmark } from "../../lib/practice-store";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function PracticeClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [attempt, setAttempt] = useState<LocalAttempt | null>();
  const [checking, setChecking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const requestedIndex = Number(searchParams.get("q"));
  const attemptStatus = attempt?.status;

  useEffect(() => {
    void getAttempt(id).then((stored) => {
      if (stored && Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < stored.snapshot.questions.length) stored.currentIndex = requestedIndex;
      setAttempt(stored || null);
    });
  }, [id, requestedIndex]);

  useEffect(() => {
    if (attemptStatus !== "in_progress") return;
    const timer = window.setInterval(() => setAttempt((current) => current ? { ...current, elapsedSeconds: current.elapsedSeconds + 1 } : current), 1000);
    return () => window.clearInterval(timer);
  }, [attemptStatus]);

  useEffect(() => {
    if (attempt?.status === "in_progress" && attempt.elapsedSeconds % 5 === 0) void putAttempt(attempt);
  }, [attempt]);

  const question = attempt?.snapshot.questions[attempt.currentIndex];
  const feedback = question ? attempt?.feedback[question.id] : undefined;
  const selectedAnswer = question ? attempt?.answers[question.id] : undefined;

  useEffect(() => {
    if (!question) return;
    void getBookmark(question.id).then((value) => setBookmarked(Boolean(value)));
  }, [question]);

  const persist = useCallback(async (next: LocalAttempt) => {
    setAttempt(next);
    await putAttempt(next);
  }, []);

  useEffect(() => {
    if (!attempt || !question || attempt.status !== "completed" || feedback) return;
    let active = true;
    void fetch("/api/practice/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, selectedOption: "review" }),
    }).then(async (response) => {
      if (!response.ok || !active) return;
      const result = await response.json() as AnswerFeedback;
      if (active) await persist({ ...attempt, feedback: { ...attempt.feedback, [question.id]: result } });
    });
    return () => { active = false; };
  }, [attempt, feedback, persist, question]);

  async function answer(option: string) {
    if (!attempt || !question || selectedAnswer || checking || attempt.status === "completed") return;
    setChecking(true);
    const response = await fetch("/api/practice/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id, selectedOption: option }) });
    const result = await response.json() as AnswerFeedback;
    if (response.ok) await persist({ ...attempt, answers: { ...attempt.answers, [question.id]: option }, feedback: { ...attempt.feedback, [question.id]: result } });
    setChecking(false);
  }

  async function navigate(index: number) {
    if (!attempt) return;
    const next = { ...attempt, currentIndex: Math.max(0, Math.min(attempt.snapshot.questions.length - 1, index)) };
    await persist(next);
    window.history.replaceState(null, "", `/practice/${id}?q=${next.currentIndex}`);
    document.querySelector<HTMLElement>(".practice-question h1")?.focus();
  }

  async function toggleBookmark() {
    if (!question) return;
    if (bookmarked) await deleteBookmark(question.id);
    else {
      const bookmark: Bookmark = { questionId: question.id, exam: question.exam, year: question.year, paper: question.paper, questionNumber: question.questionNumber, subject: question.subject, topic: question.topic, prompt: question.promptLines.join("\n"), savedAt: new Date().toISOString() };
      await saveBookmark(bookmark);
    }
    setBookmarked(!bookmarked);
  }

  async function finish() {
    if (!attempt) return;
    const completed = { ...attempt, status: "completed" as const, completedAt: new Date().toISOString() };
    await persist(completed);
    router.push(`/practice/${id}/results`);
  }

  if (attempt === undefined) return <main className="practice-loading" aria-busy="true"><div /><div /><div /></main>;
  if (!attempt || !question) return <main className="practice-missing"><p className="pyq-kicker">Local practice</p><h1>This session is not on this device.</h1><p>Practice history is stored only in this browser.</p><Link href="/">Return to PYQs</Link></main>;

  const answered = Object.keys(attempt.answers).length;
  return (
    <main className="practice-shell">
      <header className="practice-topbar">
        <Link href={`/exams/${question.exam}`} aria-label="Exit practice">← Exit</Link>
        <span><strong>{question.exam}</strong><small>{answered} of {attempt.snapshot.questions.length} answered</small></span>
        <time aria-label={`Elapsed time ${formatTime(attempt.elapsedSeconds)}`}>{formatTime(attempt.elapsedSeconds)}</time>
        <button onClick={() => void finish()}>{attempt.status === "completed" ? "Results" : "Finish"}</button>
      </header>

      <div className="practice-progress" role="progressbar" aria-label="Practice progress" aria-valuemin={1} aria-valuemax={attempt.snapshot.questions.length} aria-valuenow={attempt.currentIndex + 1}><span style={{ width: `${((attempt.currentIndex + 1) / attempt.snapshot.questions.length) * 100}%` }} /></div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.article className="practice-question" key={question.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: .16, ease: [.2, .8, .2, 1] }}>
          <div className="question-heading">
            <span>Question {attempt.currentIndex + 1} of {attempt.snapshot.questions.length}</span>
            <span>{question.exam} {question.year} · {question.paper} · Question {question.questionNumber}</span>
          </div>
          <div className="question-copy">
            <h1 tabIndex={-1}>{question.promptLines.map((line, index) => <span key={`${question.id}-${index}`}>{line}</span>)}</h1>
            <div className="practice-options" role="group" aria-label="Answer options">
              {Object.entries(question.options).map(([key, value]) => {
                const isSelected = selectedAnswer === key;
                const isCorrect = Boolean(feedback && feedback.correctAnswer === key);
                const isWrong = Boolean(feedback && isSelected && !feedback.correct);
                return <button key={key} className={`${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`} disabled={Boolean(selectedAnswer) || checking || attempt.status === "completed"} onClick={() => void answer(key)}><span>{key}</span><strong>{value}</strong>{isCorrect && <em>Correct</em>}{isWrong && <em>Your answer</em>}</button>;
              })}
            </div>
          </div>

          <AnimatePresence>
            {feedback && <motion.section className={`answer-feedback ${feedback.correct ? "is-correct" : "is-incorrect"}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: .18 }}>
              <div><strong>{feedback.correct ? "Correct" : `Correct answer: ${feedback.correctAnswer}`}</strong><button className="bookmark-action" onClick={() => void toggleBookmark()}>{bookmarked ? "Saved" : "Bookmark"}</button></div>
              {feedback.explanation && <p>{feedback.explanation}</p>}
            </motion.section>}
          </AnimatePresence>

          <nav className="question-navigation" aria-label="Question navigation">
            <button disabled={attempt.currentIndex === 0} onClick={() => void navigate(attempt.currentIndex - 1)}>← Previous</button>
            {!feedback && <button className="bookmark-action" onClick={() => void toggleBookmark()}>{bookmarked ? "Saved" : "Bookmark"}</button>}
            {attempt.currentIndex < attempt.snapshot.questions.length - 1 ? <button className="next-question" onClick={() => void navigate(attempt.currentIndex + 1)}>Next →</button> : <button className="next-question" onClick={() => void finish()}>View results →</button>}
          </nav>
        </motion.article>
      </AnimatePresence>
    </main>
  );
}
