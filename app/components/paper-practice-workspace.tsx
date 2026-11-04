'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createLocalAttempt } from '../../lib/practice-store';
import type { PaperPracticeRow } from '../../lib/paper-practice-catalog';
import type { PracticeSnapshot } from '../../lib/practice-types';

type DisplayRow = PaperPracticeRow & { attempt: string; paper: string };

function displayRow(row: PaperPracticeRow): DisplayRow {
  const parts = row.label.split(' · ');
  if (row.exam === 'NDA' || row.exam === 'CDS') {
    return { ...row, attempt: parts[0].split(' ')[1] || '—', paper: parts.slice(1).join(' · ') };
  }
  return { ...row, attempt: '—', paper: parts.slice(1).join(' · ') || row.label };
}

export function PaperPracticeWorkspace({ rows, years }: { rows: PaperPracticeRow[]; years: number[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const displayYears = useMemo(() => [...years].sort((a, b) => b - a), [years]);
  useEffect(() => setReady(true), []);

  const groups = useMemo(() => {
    const result: Array<{ exam: string; color: string; attempts: Array<{ attempt: string; rows: DisplayRow[] }> }> = [];
    for (const row of rows.map(displayRow)) {
      let exam = result.find(group => group.exam === row.exam);
      if (!exam) { exam = { exam: row.exam, color: row.color, attempts: [] }; result.push(exam); }
      let attempt = exam.attempts.find(group => group.attempt === row.attempt);
      if (!attempt) { attempt = { attempt: row.attempt, rows: [] }; exam.attempts.push(attempt); }
      attempt.rows.push(row);
    }
    return result;
  }, [rows]);

  const toggle = (key: string) => setSelected(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
  const rowKeys = (row: PaperPracticeRow) => years.filter(year => row.counts[year] > 0).map(year => `${row.id}:${year}`);
  const quick = (wanted: number[]) => setSelected(rows.flatMap(row => wanted.filter(year => row.counts[year] > 0).map(year => `${row.id}:${year}`)));

  async function start() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/practice-snapshots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: 5, paperKeys: selected, count: 'all', order: 'newest', durationMinutes: null }) });
      const snapshot = await response.json() as PracticeSnapshot & { error?: string };
      if (!response.ok) throw new Error(snapshot.error || 'The papers could not be prepared.');
      await createLocalAttempt(snapshot, '/papers');
      router.push(`/practice/${snapshot.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The papers could not be prepared.'); setLoading(false); }
  }

  const total = selected.reduce((sum, key) => {
    const year = Number(key.split(':').at(-1));
    const row = rows.find(item => key.startsWith(`${item.id}:`));
    return sum + (row?.counts[year] || 0);
  }, 0);

  return <main className="pyq-page paper-practice-page">
    <header className="paper-practice-title"><p className="pyq-kicker">Whole-paper practice</p><h1>Practice official papers</h1><p>Select one paper or combine several papers. Every question comes only from the paper cells you choose.</p></header>
    <div className="paper-practice-layout"><section className="source-year-matrix paper-year-matrix" aria-labelledby="paper-grid-title">
      <div className="source-year-heading"><div><h2 id="paper-grid-title">Paper bank</h2></div><div className="source-year-quick"><span>Quick</span><button disabled={!ready} onClick={() => quick(years)}>All</button><button disabled={!ready} onClick={() => quick(years.slice(-5))}>Last 5</button><button disabled={!ready} onClick={() => quick(years.slice(-10))}>Last 10</button><button disabled={!ready} onClick={() => setSelected([])}>Clear</button></div></div>
      <div className="source-year-scroll" role="region" aria-label="Previous paper selection grid">
        <div className="paper-grouped-grid" style={{ '--year-columns': years.length } as CSSProperties}>
          <span className="paper-column-heading">Exam</span><span className="paper-column-heading">Attempt</span><span className="paper-column-heading">Paper</span>
          {displayYears.map(year => <button key={year} disabled={!ready} className="source-year-column" onClick={() => { const keys = rows.filter(row => row.counts[year] > 0).map(row => `${row.id}:${year}`); const enable = keys.some(key => !selected.includes(key)); setSelected(current => enable ? [...new Set([...current, ...keys])] : current.filter(key => !keys.includes(key))); }}>{year}</button>)}
          {groups.map(exam => <div className="paper-exam-group" key={exam.exam} style={{ '--exam-color': exam.color } as CSSProperties}>
            <div className="paper-merged-exam" style={{ gridRow: `span ${exam.attempts.reduce((sum, item) => sum + item.rows.length, 0)}` }}><i aria-hidden="true" /> <strong>{exam.exam}</strong></div>
            {exam.attempts.map(attempt => <div className="paper-attempt-group" key={`${exam.exam}-${attempt.attempt}`}>
              <div className="paper-merged-attempt" style={{ gridRow: `span ${attempt.rows.length}` }}><strong>{attempt.attempt}</strong></div>
              {attempt.rows.map(row => <div className="paper-grid-row" key={row.id}>
                <button disabled={!ready} className="paper-row-label" aria-label={row.label} aria-pressed={rowKeys(row).some(key => selected.includes(key))} onClick={() => { const keys = rowKeys(row); const enable = keys.some(key => !selected.includes(key)); setSelected(current => enable ? [...new Set([...current, ...keys])] : current.filter(key => !keys.includes(key))); }}><strong>{row.paper}</strong></button>
                {displayYears.map(year => { const key = `${row.id}:${year}`, count = row.counts[year] || 0, active = selected.includes(key); return <button key={year} disabled={!ready || !count || loading} className="source-year-cell" aria-pressed={active} aria-label={`${row.label} ${year}, ${count} questions, ${active ? 'selected' : 'not selected'}`} onClick={() => toggle(key)}>{count}</button>; })}
              </div>)}
            </div>)}
          </div>)}
        </div>
      </div>
    </section>
    <aside className="paper-selection-bar" aria-label="Selected papers"><header className="paper-cart-heading"><h2>Practice cart</h2>{selected.length ? <button type="button" disabled={loading} onClick={() => setSelected([])}>Clear all</button> : null}</header><div className="paper-cart-body"><strong>{selected.length ? `${selected.length} selected ${selected.length === 1 ? 'paper' : 'papers'}` : 'No papers selected'}</strong><span>Select one or more paper-year cells from the table.</span></div><footer className="paper-cart-footer"><div><strong>{total.toLocaleString('en-IN')}</strong><span>questions</span></div><button disabled={!ready || !selected.length || loading} onClick={() => void start()}>{loading ? 'Preparing…' : selected.length === 1 ? 'Start selected paper →' : 'Start selected papers →'}</button></footer>{error ? <p role="alert">{error}</p> : null}</aside></div>
  </main>;
}
