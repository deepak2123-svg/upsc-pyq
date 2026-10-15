"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerFeedback, PracticeSnapshot } from "../../lib/practice-types";
import { isPracticeRecipeV3 } from "../../lib/practice-types";

type PrintPayload = { snapshot: PracticeSnapshot; includeAnswerKey: boolean };

export function PrintPaperClient({ id }: { id: string }) {
  const [payload, setPayload] = useState<PrintPayload | null>();
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [error, setError] = useState("");
  const printed = useRef(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`upsc-pyq-print:${id}`);
      const parsed = raw ? JSON.parse(raw) as PrintPayload : null;
      if (!parsed?.snapshot || parsed.snapshot.id !== id || !Array.isArray(parsed.snapshot.questions)) throw new Error("This printable paper is no longer available. Return to the builder and export it again.");
      setPayload(parsed);
      if (parsed.includeAnswerKey) {
        void fetch("/api/practice/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionIds: parsed.snapshot.questions.map((question) => question.id), answers: {} }) })
          .then(async (response) => { const result = await response.json(); if (!response.ok || !result.feedback) throw new Error(result.error || "The answer key could not be prepared."); setFeedback(result.feedback); })
          .catch((reason) => setError(reason instanceof Error ? reason.message : "The answer key could not be prepared."));
      }
    } catch (reason) { setPayload(null); setError(reason instanceof Error ? reason.message : "This printable paper could not be opened."); }
  }, [id]);

  const keyReady = Boolean(payload && (!payload.includeAnswerKey || payload.snapshot.questions.every((question) => feedback[question.id])));
  useEffect(() => {
    if (!payload || !keyReady || printed.current) return;
    printed.current = true;
    void document.fonts.ready.then(() => window.setTimeout(() => window.print(), 250));
  }, [payload, keyReady]);

  if (payload === undefined) return <main className="print-paper-status">Preparing your paper…</main>;
  if (!payload) return <main className="print-paper-status"><h1>Paper unavailable</h1><p>{error}</p></main>;
  const { snapshot, includeAnswerKey } = payload;
  const duration = isPracticeRecipeV3(snapshot.recipe) ? snapshot.recipe.durationMinutes : null;
  const subjects = [...new Set(snapshot.questions.map((question) => question.subject))].join(" + ");
  const hierarchyLabel = (question: PracticeSnapshot["questions"][number]) => [question.subject, question.section, question.topic, question.subtopic].filter(Boolean).join(" → ");

  return <main className="print-paper">
    <div className="print-toolbar"><button type="button" disabled={!keyReady} onClick={() => window.print()}>{keyReady ? "Print / Save as PDF" : "Preparing answer key…"}</button><span>In the print dialog, choose <strong>Save as PDF</strong>.</span></div>
    <header className="print-paper-header"><p>UPSC.PYQ.Practise</p><h1>Previous-Year Question Paper</h1><dl><div><dt>Scope</dt><dd>{subjects || "Official PYQs"}</dd></div><div><dt>Questions</dt><dd>{snapshot.questions.length}</dd></div><div><dt>Time</dt><dd>{duration ? `${duration} minutes` : "Untimed"}</dd></div><div><dt>Answer key</dt><dd>{includeAnswerKey ? "Included at end" : "Not included"}</dd></div></dl><p className="print-instructions">Choose the most appropriate answer for each question. Mark your responses on this paper or on a separate answer sheet.</p></header>
    <ol className="print-question-list">{snapshot.questions.map((question, index) => <li key={question.id} className="print-question" data-question-id={question.id}><div className="print-question-meta"><strong>Question {index + 1}</strong><span>{question.exam} {question.year} · {question.paper} · Original Q{question.questionNumber}</span></div><p className="print-question-hierarchy"><span>Subject → Section → Chapter → Subpart:</span> {hierarchyLabel(question)}</p><div className="print-question-prompt">{question.promptLines.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</div><div className="print-option-list">{Object.entries(question.options).map(([key, option]) => <div key={key} data-option-key={key}><b>{key}.</b><span>{option}</span></div>)}</div></li>)}</ol>
    {includeAnswerKey ? <section className="print-answer-key"><h2>Answer key</h2>{error ? <p>{error}</p> : <table><thead><tr><th>Question</th><th>Answer</th><th>Original source</th></tr></thead><tbody>{snapshot.questions.map((question, index) => <tr key={question.id}><td>{index + 1}</td><td>{feedback[question.id]?.correctAnswer || "—"}</td><td>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</td></tr>)}</tbody></table>}</section> : null}
  </main>;
}
