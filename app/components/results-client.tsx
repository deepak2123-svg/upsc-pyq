"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { LocalAttempt, PracticeSnapshot } from "../../lib/practice-types";
import { createLocalAttempt, getAttempt } from "../../lib/practice-store";

function time(seconds: number) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
function sessionScope(attempt: LocalAttempt) {
  const subjects = [...new Set(attempt.snapshot.questions.map((question) => question.subject))];
  return subjects.length === 1 ? subjects[0] : subjects.length ? `${subjects.length} subjects` : "Official PYQs";
}
function sessionExams(attempt: LocalAttempt) {
  return [...new Set(attempt.snapshot.questions.map((question) => question.exam))].join(" + ");
}

export function ResultsClient({ id }: { id: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<LocalAttempt | null>();
  useEffect(() => { void getAttempt(id).then((value) => setAttempt(value || null)); }, [id]);
  const stats = useMemo(() => {
    if (!attempt) return null;
    let correct = 0; let incorrect = 0;
    const breakdown = new Map<string, { total: number; correct: number }>();
    attempt.snapshot.questions.forEach((question) => {
      const feedback = attempt.feedback[question.id];
      if (feedback?.correct) correct += 1;
      else if (attempt.answers[question.id]) incorrect += 1;
      const item = breakdown.get(question.topic) || { total: 0, correct: 0 };
      item.total += 1; if (feedback?.correct) item.correct += 1; breakdown.set(question.topic, item);
    });
    return { correct, incorrect, unattempted: attempt.snapshot.questions.length - correct - incorrect, accuracy: correct + incorrect ? Math.round(correct / (correct + incorrect) * 100) : 0, breakdown: [...breakdown.entries()] };
  }, [attempt]);

  async function retake() {
    if (!attempt) return;
    const response = await fetch("/api/practice-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attempt.snapshot.recipe) });
    if (!response.ok) return;
    const snapshot = await response.json() as PracticeSnapshot;
    await createLocalAttempt(snapshot);
    router.push(`/practice/${snapshot.id}`);
  }

  if (attempt === undefined) return <main className="practice-loading" aria-busy="true"><div /><div /><div /></main>;
  if (!attempt || !stats) return <main className="practice-missing"><h1>Results are not on this device.</h1><Link href="/attempts">View attempts</Link></main>;
  return (
    <main className="results-page pyq-page">
      <Link className="back-link" href="/attempts">← Attempts</Link>
      <section className="result-summary">
        <p className="pyq-kicker">Practice complete</p>
        <h1>{sessionExams(attempt)} · {sessionScope(attempt)}</h1>
        <p>{attempt.snapshot.questions.length} questions · {time(attempt.elapsedSeconds)}</p>
        <div className="result-numbers">
          <div><strong>{stats.accuracy}%</strong><span>Accuracy</span></div>
          <div><strong>{stats.correct}</strong><span>Correct</span></div>
          <div><strong>{stats.incorrect}</strong><span>Incorrect</span></div>
          <div><strong>{stats.unattempted}</strong><span>Unattempted</span></div>
        </div>
        <div className="result-actions"><button onClick={() => void retake()}>Retake selection</button><Link href="/">Choose new PYQs</Link></div>
      </section>

      <section className="result-breakdown">
        <h2>Topic performance</h2>
        {stats.breakdown.sort((a, b) => b[1].total - a[1].total).map(([topic, value]) => <div key={topic}><span>{topic}</span><span>{value.correct} / {value.total}</span><div><motion.i initial={{ width: 0 }} animate={{ width: `${value.total ? value.correct / value.total * 100 : 0}%` }} transition={{ duration: .2 }} /></div></div>)}
      </section>

      <section className="result-review">
        <h2>Review questions</h2>
        {attempt.snapshot.questions.map((question, index) => {
          const feedback = attempt.feedback[question.id];
          const status = !attempt.answers[question.id] ? "Unattempted" : feedback?.correct ? "Correct" : "Incorrect";
          return <Link href={`/practice/${attempt.id}?q=${index}`} key={question.id}><span>{index + 1}</span><strong>{question.promptLines.join(" ")}</strong><em className={status.toLowerCase()}>{status}</em></Link>;
        })}
      </section>
    </main>
  );
}
