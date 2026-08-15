"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SavedTestsPage() {
  const [savedTests, setSavedTests] = useState<Array<{ id: string; name: string; recipe: Record<string, unknown>; updatedAt: string }>>([]);
  const [message, setMessage] = useState("Loading saved recipes…");
  useEffect(() => {
    fetch("/api/saved-tests").then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load saved recipes.");
      setSavedTests(Array.isArray(body.savedTests) ? body.savedTests : []);
      setMessage(body.authenticated ? "" : "Sign in with Google to save and reuse test recipes.");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load saved recipes."));
  }, []);
  return <main className="public-article"><div className="eyebrow">Student workspace</div><h1>Saved tests</h1><p className="muted">Reuse a test recipe across devices after signing in.</p>{message && <p className="notice">{message}</p>}{savedTests.length === 0 && !message && <p className="muted">No saved recipes yet.</p>}<div className="public-grid">{savedTests.map((saved) => <article className="card" key={saved.id}><h2>{saved.name}</h2><p className="meta">{String(saved.recipe.exam ?? "UPSC")} · {String(saved.recipe.difficulty ?? "All types")} · {String(saved.recipe.count ?? 20)} questions</p><Link className="secondary" href="/app/build">Open builder →</Link></article>)}</div></main>;
}
