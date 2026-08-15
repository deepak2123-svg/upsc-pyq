"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<Array<{ test?: { id?: string; exam?: string; status?: string; startedAt?: string }; result?: { score?: number; accuracy?: number } | null }>>([]);
  const [message, setMessage] = useState("Loading attempt history…");
  useEffect(() => {
    fetch("/api/attempts").then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load attempts.");
      setAttempts(Array.isArray(body.attempts) ? body.attempts : []);
      setMessage(body.cloudHistory ? "" : "Sign in with Google to keep attempt history across devices.");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load attempts."));
  }, []);
  return <main className="public-article"><div className="eyebrow">Student workspace</div><h1>Attempt history</h1><p className="muted">Your submitted and in-progress tests.</p>{message && <p className="notice">{message}</p>}<div className="card">{attempts.length === 0 && !message && <p className="muted">No cloud attempts yet.</p>}{attempts.map((entry, index) => <div className="attempt-row" key={entry.test?.id ?? index}><div><strong>{entry.test?.exam ?? "UPSC"} test</strong><div className="meta">{entry.test?.status ?? "active"} · {entry.test?.startedAt ? new Date(entry.test.startedAt).toLocaleString() : ""}</div></div><div><div className="meta">Score</div><strong>{entry.result?.score ?? "—"}</strong></div><div><div className="meta">Accuracy</div><strong>{typeof entry.result?.accuracy === "number" ? Math.round(entry.result.accuracy) + "%" : "—"}</strong></div>{entry.test?.id && <Link className="quiet" href={(entry.test.status === "submitted" ? "/app/results/" : "/app/tests/") + entry.test.id}>Open →</Link>}</div>)}</div></main>;
}
