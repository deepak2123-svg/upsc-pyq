"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Bookmark, LocalAttempt } from "../../lib/practice-types";
import { clearPracticeData, deleteAttempt, deleteBookmark, exportPracticeData, listAttempts, listBookmarks } from "../../lib/practice-store";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function sessionScope(attempt: LocalAttempt) {
  const subjects = [...new Set(attempt.snapshot.questions.map((question) => question.subject))];
  return subjects.length === 1 ? subjects[0] : subjects.length ? `${subjects.length} subjects` : "Official PYQs";
}
function sessionExams(attempt: LocalAttempt) {
  return [...new Set(attempt.snapshot.questions.map((question) => question.exam))].join(" + ");
}

export function AttemptsLibrary() {
  const [attempts, setAttempts] = useState<LocalAttempt[]>();
  useEffect(() => { void listAttempts().then(setAttempts); }, []);

  async function remove(id: string) { await deleteAttempt(id); setAttempts((current) => current?.filter((attempt) => attempt.id !== id)); }
  async function exportData() {
    const blob = new Blob([await exportPracticeData()], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `upscpuraan-history-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function clear() { if (!window.confirm("Clear all attempts and bookmarks stored in this browser?")) return; await clearPracticeData(); setAttempts([]); }

  return <LibraryShell title="Attempts" description="Completed and unfinished practice stored in this browser." actions={<><button onClick={() => void exportData()}>Export</button><button onClick={() => void clear()}>Clear local data</button></>}>
    {attempts === undefined ? <LibraryLoading /> : attempts.length === 0 ? <EmptyLibrary title="No attempts yet." action="Choose PYQs" href="/" /> : <div className="library-list">{attempts.map((attempt) => {
      const answered = Object.keys(attempt.answers).length;
      const correct = Object.values(attempt.feedback).filter((feedback) => feedback.correct).length;
      const accuracy = answered ? Math.round(correct / answered * 100) : 0;
      return <motion.article layout key={attempt.id}><div><span>{sessionExams(attempt)}</span><strong>{sessionScope(attempt)}</strong><small>{formatDate(attempt.updatedAt)}</small></div><div><span>{answered} / {attempt.snapshot.questions.length}</span><small>{attempt.status === "completed" ? `${accuracy}% accuracy` : "In progress"}</small></div><div><Link href={attempt.status === "completed" ? `/practice/${attempt.id}/results` : `/practice/${attempt.id}`}>{attempt.status === "completed" ? "Results" : "Resume"} →</Link><button aria-label={`Delete ${sessionExams(attempt)} attempt`} onClick={() => void remove(attempt.id)}>Delete</button></div></motion.article>;
    })}</div>}
  </LibraryShell>;
}

export function BookmarksLibrary() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>();
  useEffect(() => { void listBookmarks().then(setBookmarks); }, []);
  async function remove(id: string) { await deleteBookmark(id); setBookmarks((current) => current?.filter((bookmark) => bookmark.questionId !== id)); }
  return <LibraryShell title="Bookmarks" description="Questions saved on this device for another look.">
    {bookmarks === undefined ? <LibraryLoading /> : bookmarks.length === 0 ? <EmptyLibrary title="No bookmarks yet." action="Browse PYQs" href="/" /> : <div className="bookmark-list">{bookmarks.map((bookmark) => <motion.article layout key={bookmark.questionId}><div><span>{bookmark.exam} {bookmark.year} · {bookmark.paper} · Question {bookmark.questionNumber}</span><strong>{bookmark.prompt}</strong><small>{bookmark.subject} · {bookmark.topic}</small></div><button onClick={() => void remove(bookmark.questionId)}>Remove</button></motion.article>)}</div>}
  </LibraryShell>;
}

function LibraryShell({ title, description, actions, children }: { title: string; description: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return <main className="pyq-page library-page"><header><div><p className="pyq-kicker">Local practice</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="library-actions">{actions}</div>}</header>{children}</main>;
}
function LibraryLoading() { return <div className="library-loading" aria-busy="true"><span /><span /><span /></div>; }
function EmptyLibrary({ title, action, href }: { title: string; action: string; href: string }) { return <div className="empty-library"><h2>{title}</h2><p>Your progress stays private to this browser.</p><Link href={href}>{action} →</Link></div>; }
