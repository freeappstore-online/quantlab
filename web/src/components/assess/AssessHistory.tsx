import { PageHeader } from '@freeappstore/sdk/ui';
import { useMemo } from 'react';
import { go } from '../../hooks/useRoute';
import type { AssessStore } from '../../hooks/useAssessStore';
import { fmtPercent, fmtSeconds } from '../../services/format';
import type { AssessId } from '../../services/assess/types';
import { mean } from '../../services/assess/util';
import { Link } from '../Link';
import { GAMES, gameById } from './registry';
import { TrendChart } from '../TrendChart';

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

export function AssessHistory({ store, game: routeGame }: { store: AssessStore; game: AssessId | null }) {
  const { results } = store;
  const game: AssessId = routeGame ?? results[results.length - 1]?.game ?? 'blockfit';
  const def = gameById(game);

  const mine = useMemo(() => results.filter((r) => r.game === game), [results, game]);
  const stats = useMemo(() => {
    if (mine.length === 0) return null;
    const recent = mine.slice(-10);
    const attempted = mine.reduce((s, r) => s + r.attempted, 0);
    const correct = mine.reduce((s, r) => s + r.correct, 0);
    return {
      best: Math.max(...mine.map((r) => r.score)),
      recentAvg: recent.reduce((s, r) => s + r.score, 0) / recent.length,
      accuracy: attempted === 0 ? 0 : correct / attempted,
      avgMs: mean(mine.map((r) => r.avgItemMs).filter((v): v is number => v !== null)),
    };
  }, [mine]);

  const points = mine.slice(-MAX_POINTS).map((r) => ({ value: r.score, label: shortDate(r.at) }));
  const rows = mine.slice(-MAX_ROWS).reverse();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
      <Link to="/assess" className="text-sm text-muted no-underline hover:text-ink">
        {'←'} All assessment games
      </Link>
      <PageHeader title="Assessment history" description="Your score over time for each game." />

      <div className="seg mt-3 flex-wrap" role="tablist" aria-label="Game">
        {GAMES.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={g.id === game} onClick={() => go(`/assess/history/${g.id}`)}>
            {g.name}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-medium">No runs of {def.name} yet.</p>
          <p className="mt-1 text-sm text-muted">Finish a test and it shows up here with a trend line.</p>
          <Link to={`/assess/play/${game}`} className="btn btn-primary mt-4">
            Play {def.name}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Runs" value={String(mine.length)} />
            <Stat label="Best" value={String(stats.best)} />
            <Stat label="Last 10 avg" value={stats.recentAvg.toFixed(1)} />
            <Stat label="Accuracy" value={fmtPercent(stats.accuracy)} />
          </div>
          {stats.avgMs !== null && <p className="tabular mt-2 text-sm text-muted">Average time per item: {fmtSeconds(stats.avgMs)}</p>}

          <h2 className="mb-2 mt-6 text-base font-semibold">Score trend</h2>
          <TrendChart points={points} />

          <section className="mt-6" aria-labelledby="recent-runs">
            <h2 id="recent-runs" className="mb-2 text-base font-semibold">
              Recent runs
            </h2>
            <ul className="card divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{longDate(r.at)}</div>
                    <div className="text-xs text-muted">
                      {r.full ? 'Full Assessment' : 'Single game'} {'·'} {r.override === 'auto' ? 'auto difficulty' : r.override}
                    </div>
                  </div>
                  <div className="tabular text-right">
                    <div className="text-lg font-semibold">{r.scoreText}</div>
                    <div className="text-xs text-muted">{fmtPercent(r.attempted === 0 ? 0 : r.correct / r.attempted)} accurate</div>
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
