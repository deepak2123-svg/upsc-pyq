"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerFeedback, PracticeSnapshot } from "../../lib/practice-types";
import { isPracticeRecipeV3 } from "../../lib/practice-types";
import { formatPracticePrompt, formatPracticeText } from "../../lib/practice-prompt";
import { PracticePromptView } from "./practice-prompt-view";

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
  const coverage = {
    subjects: [...new Set(snapshot.questions.map((question) => question.subject).filter(Boolean))],
    sections: [...new Set(snapshot.questions.map((question) => question.section).filter(Boolean))],
    chapters: [...new Set(snapshot.questions.map((question) => question.topic).filter(Boolean))],
    subparts: [...new Set(snapshot.questions.map((question) => question.subtopic).filter(Boolean))],
  };
  const primaryCoverage = [coverage.subjects.join(" + "), coverage.sections.join(" + "), coverage.chapters.join(" + ")].filter(Boolean).join(" › ");
  const answerKeySplit = Math.ceil(snapshot.questions.length / 2);
  const answerKeyColumns = [snapshot.questions.slice(0, answerKeySplit), snapshot.questions.slice(answerKeySplit)];

  return <main className="print-paper">
    <div className="print-toolbar"><button type="button" disabled={!keyReady} onClick={() => window.print()}>{keyReady ? "Print / Save as PDF" : "Preparing answer key…"}</button><span>Choose <strong>Save as PDF</strong> and turn off <strong>Headers and footers</strong> in the print dialog.</span></div>
    <header className="print-paper-header"><div className="print-title-row"><h1>Previous-Year Questions</h1><p>{subjects || "Official PYQs"}<span>·</span>{snapshot.questions.length} questions<span>·</span>{duration ? `${duration} minutes` : "Untimed"}</p></div><section className="print-taxonomy-summary" aria-label="Syllabus coverage"><p><strong>Coverage</strong>{primaryCoverage || "Selected syllabus"}</p>{coverage.subparts.length ? <p><strong>Subparts</strong>{coverage.subparts.join(", ")}</p> : null}</section></header>
    <ol className="print-question-list">{snapshot.questions.map((question, index) => <li key={question.id} className="print-question" data-question-id={question.id}><div className="print-question-meta"><strong>Question {index + 1}</strong><span>{question.exam} {question.year} · {question.paper} · Original Q{question.questionNumber}</span></div><PracticePromptView blocks={formatPracticePrompt(question.promptLines)} className="print-question-prompt" /><div className="print-option-list">{Object.entries(question.options).map(([key, option]) => <div key={key} data-option-key={key}><b>{key}.</b><span>{formatPracticeText(option)}</span></div>)}</div></li>)}</ol>
    {includeAnswerKey ? <section className="print-answer-key"><h2>Answer key</h2>{error ? <p>{error}</p> : <table><thead><tr><th>Q.</th><th>Ans.</th><th>Original source</th><th>Q.</th><th>Ans.</th><th>Original source</th></tr></thead><tbody>{answerKeyColumns[0].map((left, row) => { const right = answerKeyColumns[1][row]; return <tr key={left.id}><td>{row + 1}</td><td>{feedback[left.id]?.correctAnswer || "—"}</td><td>{left.exam} {left.year} · {left.paper} · Q{left.questionNumber}</td>{right ? <><td>{answerKeySplit + row + 1}</td><td>{feedback[right.id]?.correctAnswer || "—"}</td><td>{right.exam} {right.year} · {right.paper} · Q{right.questionNumber}</td></> : <td colSpan={3} />}</tr>; })}</tbody></table>}</section> : null}
  </main>;
}
