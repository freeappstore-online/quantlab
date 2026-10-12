import { PageHeader } from '@freeappstore/sdk/ui';
import { useMemo, useState } from 'react';
import { go } from '../hooks/useRoute';
import { Link } from './Link';
import { fmtPercent, fmtSeconds } from '../services/format';
import { DIFFICULTY_LABELS, KIND_LABELS, MODE_LIST } from '../services/modes';
import { accuracy } from '../services/scoring';
import { DIFFICULTIES, type Difficulty, type KindStat, type ModeId, type Session } from '../types';
import { TrendChart } from './TrendChart';

interface Props {
  sessions: readonly Session[];
  mode: ModeId | null;
}

const MAX_POINTS = 40;
const MAX_ROWS = 15;

const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const longDate = (t: number) => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="stat-label">{label}</div>
      <div className="tabular mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function History({ sessions, mode: routeMode }: Props) {
  const mode: ModeId = routeMode ?? sessions[sessions.length - 1]?.mode ?? 'sprint';
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');

  const filtered = useMemo(
    () => sessions.filter((s) => s.mode === mode && (difficulty === 'all' || s.difficulty === difficulty)),
    [sessions, mode, difficulty],
  );

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const attempted = filtered.reduce((s, x) => s + x.attempted, 0);
    const correct = filtered.reduce((s, x) => s + x.correct, 0);
    const timed = filtered.filter((s) => s.avgCorrectMs !== null);
    const recent = filtered.slice(-10);
    return {
      best: Math.max(...filtered.map((s) => s.score)),
      recentAvg: recent.reduce((s, x) => s + x.score, 0) / recent.length,
      accuracy: attempted === 0 ? 0 : correct / attempted,
      avgMs: timed.length === 0 ? null : timed.reduce((s, x) => s + (x.avgCorrectMs ?? 0), 0) / timed.length,
    };
  }, [filtered]);

  const weakSpots = useMemo(() => {
    const totals: Record<string, KindStat> = {};
    for (const s of filtered) {
      for (const [kind, stat] of Object.entries(s.byKind)) {
        const t = (totals[kind] ??= { attempted: 0, correct: 0, ms: 0 });
        t.attempted += stat.attempted;
        t.correct += stat.correct;
        t.ms += stat.ms;
      }
    }
    return Object.entries(totals)
      .filter(([, t]) => t.attempted >= 5)
      .map(([kind, t]) => ({ kind, accuracy: t.correct / t.attempted, avgMs: t.ms / t.attempted, attempted: t.attempted }))
      .sort((a, b) => a.accuracy - b.accuracy || b.avgMs - a.avgMs);
  }, [filtered]);

  const chartPoints = filtered.slice(-MAX_POINTS).map((s) => ({ value: s.score, label: shortDate(s.startedAt) }));
  const rows = filtered.slice(-MAX_ROWS).reverse();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <PageHeader title="History" description="Scores, trend lines and the question types costing you points." />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="seg flex-wrap" role="tablist" aria-label="Mode">
          {MODE_LIST.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={m.id === mode} onClick={() => go(`/history/${m.id}`)}>
              {m.name === 'Percentages & Estimation' ? 'Estimation' : m.name}
            </button>
          ))}
        </div>
        <div className="seg self-start" role="group" aria-label="Difficulty filter">
          {(['all', ...DIFFICULTIES] as const).map((d) => (
            <button key={d} type="button" aria-pressed={d === difficulty} onClick={() => setDifficulty(d)}>
              {d === 'all' ? 'All' : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-medium">No sessions here yet.</p>
          <p className="mt-1 text-sm text-muted">Finish a run and it shows up here with a trend line and your weak spots.</p>
          <Link to={`/play/${mode}`} className="btn btn-primary mt-4">
            Start a run
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Sessions" value={String(filtered.length)} />
            <Stat label="Best" value={String(stats.best)} />
            <Stat label="Last 10 avg" value={stats.recentAvg.toFixed(1)} />
            <Stat label="Accuracy" value={fmtPercent(stats.accuracy)} />
          </div>

          <h2 className="mt-6 mb-2 text-base font-semibold">Score trend</h2>
          <TrendChart points={chartPoints} />

          {weakSpots.length > 0 && (
            <section className="mt-6" aria-labelledby="weak-heading">
              <h2 id="weak-heading" className="mb-2 text-base font-semibold">
                Weak spots
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Accuracy</th>
                      <th className="px-3 py-2 text-right font-medium">Avg time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weakSpots.map((w) => (
                      <tr key={w.kind} className="border-t border-border">
                        <td className="px-3 py-2">{KIND_LABELS[w.kind] ?? w.kind}</td>
                        <td className={`tabular px-3 py-2 text-right ${w.accuracy < 0.7 ? 'font-medium text-danger' : ''}`}>{fmtPercent(w.accuracy)}</td>
                        <td className="tabular px-3 py-2 text-right text-muted">{fmtSeconds(w.avgMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-muted">Sorted worst first. Shows types with at least 5 attempts.</p>
            </section>
          )}

          <section className="mt-6" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="mb-2 text-base font-semibold">
              Recent sessions
            </h2>
            <ul className="card divide-y divide-border">
              {rows.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{longDate(s.startedAt)}</div>
                    <div className="text-xs text-muted">{DIFFICULTY_LABELS[s.difficulty]}</div>
                  </div>
                  <div className="tabular text-right">
                    <div className="text-lg font-semibold">{s.score}</div>
                    <div className="text-xs text-muted">{fmtPercent(accuracy(s))} accurate</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
