"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerFeedback, PracticeSnapshot } from "../../lib/practice-types";
import { isPracticeRecipeV3 } from "../../lib/practice-types";
import { formatPracticePrompt, formatPracticeText } from "../../lib/practice-prompt";
import { PYQ_EXAMS } from "../../lib/pyq-exams";
import { PracticePromptView } from "./practice-prompt-view";

type PrintPayload = { snapshot: PracticeSnapshot; includeAnswerKey: boolean };
function keyLabel(feedback?: AnswerFeedback, provisional=false, reasoned=false) { return feedback?.disposition === 'excluded' ? 'Excluded' : `${feedback?.correctAnswer || '—'}${provisional?' †':reasoned?' ‡':''}`; }

export function PrintPaperClient({ id }: { id: string }) {
  const [payload, setPayload] = useState<PrintPayload | null>();
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [error, setError] = useState("");
  const printed = useRef<string | null>(null);
  const [assetsReadyFor, setAssetsReadyFor] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`upsc-pyq-print:${id}`);
      const parsed = raw ? JSON.parse(raw) as PrintPayload : null;
      if (!parsed?.snapshot || parsed.snapshot.id !== id || !Array.isArray(parsed.snapshot.questions)) throw new Error("This printable paper is no longer available. Return to the builder and export it again.");
      setPayload(parsed);
      if (parsed.includeAnswerKey) {
        void fetch("/api/practice/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionIds: parsed.snapshot.questions.map((question) => question.id), answers: {}, contentRevisions: Object.fromEntries(parsed.snapshot.questions.map(question => [question.id, question.contentRevision ?? 0])) }) })
          .then(async (response) => { const result = await response.json(); if (!response.ok || !result.feedback) throw new Error(result.error || "The answer key could not be prepared."); setFeedback(result.feedback); })
          .catch((reason) => setError(reason instanceof Error ? reason.message : "The answer key could not be prepared."));
      }
    } catch (reason) { setPayload(null); setError(reason instanceof Error ? reason.message : "This printable paper could not be opened."); }
  }, [id]);

  const keyReady = Boolean(payload && (!payload.includeAnswerKey || payload.snapshot.questions.every((question) => feedback[question.id])));
  useEffect(() => {
    if (!payload || !keyReady || printed.current === payload.snapshot.id) return;
    let cancelled = false;
    const snapshotId = payload.snapshot.id;
    const images = [...document.querySelectorAll<HTMLImageElement>('.print-question img')];
    // A font-only delay is insufficient on a cold CDN: never print a paper
    // until every required original diagram is downloaded AND decoded.
    void Promise.all([document.fonts.ready, ...images.map(image => image.decode())])
      .then(() => {
        if (cancelled) return;
        if (images.some(image => !image.complete || !image.naturalWidth)) throw new Error('Required diagram unavailable');
        setAssetsReadyFor(snapshotId);
        window.requestAnimationFrame(() => {
          if (cancelled || printed.current === snapshotId) return;
          printed.current = snapshotId;
          window.print();
        });
      })
      .catch(() => { if (!cancelled) setError('A required diagram could not be loaded. Reload this paper before printing; an incomplete paper will not be printed.'); });
    return () => { cancelled = true; };
  }, [payload, keyReady]);

  if (payload === undefined) return <main className="print-paper-status">Preparing your paper…</main>;
  if (!payload) return <main className="print-paper-status"><h1>Paper unavailable</h1><p>{error}</p></main>;
  const { snapshot, includeAnswerKey } = payload;
  const printReady = keyReady && assetsReadyFor === snapshot.id && !error;
  const duration = isPracticeRecipeV3(snapshot.recipe) ? snapshot.recipe.durationMinutes : null;
  const subjects = [...new Set(snapshot.questions.map((question) => question.subject))].join(" + ");
  const coverage = {
    subjects: [...new Set(snapshot.questions.map((question) => question.subject).filter(Boolean))],
    sections: [...new Set(snapshot.questions.map((question) => question.section).filter(Boolean))],
    chapters: [...new Set(snapshot.questions.map((question) => question.topic).filter(Boolean))],
    subparts: [...new Set(snapshot.questions.map((question) => question.subtopic).filter(Boolean))],
  };
  const primaryCoverage = [coverage.subjects.join(" + "), coverage.sections.join(" + "), coverage.chapters.join(" + ")].filter(Boolean).join(" › ");
  const examCounts = Object.fromEntries(PYQ_EXAMS.map((exam) => [exam, snapshot.questions.filter((question) => question.exam === exam).length]));
  const answerKeySplit = Math.ceil(snapshot.questions.length / 2);
  const answerKeyColumns = [snapshot.questions.slice(0, answerKeySplit), snapshot.questions.slice(answerKeySplit)];

  return <main className="print-paper">
    <div className="print-toolbar"><button type="button" disabled={!printReady} onClick={() => window.print()}>{error ? "Paper not ready" : printReady ? "Print / Save as PDF" : keyReady ? "Preparing diagrams…" : "Preparing answer key…"}</button><span>Choose <strong>Save as PDF</strong> and turn off <strong>Headers and footers</strong> in the print dialog.</span>{error ? <p role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Reload paper</button></p> : null}</div>
    <header className="print-paper-header">
      <div className="print-title-row"><h1>Previous-Year Questions</h1></div>
      <table className="print-paper-summary" aria-label="Paper summary"><thead><tr><th>Syllabus</th><th>MCQs</th>{PYQ_EXAMS.map((exam) => <th key={exam}>{exam}</th>)}<th>Time</th></tr></thead><tbody><tr><td><strong>{primaryCoverage || subjects || "Selected syllabus"}</strong>{coverage.subparts.length ? <small>{coverage.subparts.join(" · ")}</small> : null}</td><td>{snapshot.questions.length}</td>{PYQ_EXAMS.map((exam) => <td key={exam}>{examCounts[exam] || "—"}</td>)}<td>{duration ? `${duration} min` : "Untimed"}</td></tr></tbody></table>
    </header>
    <ol className="print-question-list">{snapshot.questions.map((question, index) => <li key={question.id} className={`print-question ${question.figure ? "has-figure" : ""}`} data-question-id={question.id}><div className="print-question-meta"><strong>Question {index + 1}</strong><span>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</span></div><PracticePromptView blocks={formatPracticePrompt(question.promptLines)} className="print-question-prompt" figure={question.figure} /><div className="print-option-list">{Object.entries(question.options).map(([key, option]) => <div key={key} data-option-key={key}><b>{key}.</b><span>{formatPracticeText(option)}</span></div>)}</div></li>)}</ol>
    {includeAnswerKey ? <section className="print-answer-key"><h2>Answer key</h2>{snapshot.questions.some(q=>q.answerKeyStatus==='reasoned-verified') ? <p>‡ Independently verified from primary sources; no matching official key recovered.</p> : null}{snapshot.questions.some(q=>q.answerKeyStatus==='official-provisional') ? <p>† Official provisional key; subject to revision.</p> : null}{Object.values(feedback).some(item => item.disposition === 'excluded') && <p>Excluded questions do not count towards the score.</p>}{error ? <p>{error}</p> : <table><thead><tr><th>Q.</th><th>Ans.</th><th>Original source</th><th>Q.</th><th>Ans.</th><th>Original source</th></tr></thead><tbody>{answerKeyColumns[0].map((left, row) => { const right = answerKeyColumns[1][row]; return <tr key={left.id}><td>{row + 1}</td><td>{keyLabel(feedback[left.id],left.answerKeyStatus==='official-provisional',left.answerKeyStatus==='reasoned-verified')}</td><td>{left.exam} {left.year} · {left.paper} · Q{left.questionNumber}</td>{right ? <><td>{answerKeySplit + row + 1}</td><td>{keyLabel(feedback[right.id],right.answerKeyStatus==='official-provisional',right.answerKeyStatus==='reasoned-verified')}</td><td>{right.exam} {right.year} · {right.paper} · Q{right.questionNumber}</td></> : <td colSpan={3} />}</tr>; })}</tbody></table>}</section> : null}
  </main>;
}
