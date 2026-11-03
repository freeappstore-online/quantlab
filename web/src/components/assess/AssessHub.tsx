import { PageHeader } from '@freeappstore/sdk/ui';
import type { AssessStore } from '../../hooks/useAssessStore';
import { bestScore } from '../../services/assess/storage';
import { Link } from '../Link';
import { GAMES } from './registry';

export function AssessHub({ store }: { store: AssessStore }) {
  const { results, settings } = store;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
      <PageHeader
        title="Game-Based Assessment Trainer"
        description="Practise the timed cognitive mini-games and situational judgement questions used in graduate assessments. All puzzles are generated fresh, so practice is unlimited."
      />

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>
          Timer: <strong className="text-ink">{settings.timerOn ? 'on' : 'off (study mode)'}</strong>
        </span>
        <span aria-hidden="true">{'·'}</span>
        <span>
          Difficulty: <strong className="text-ink">{settings.override === 'auto' ? 'rises through each test' : settings.override}</strong>
        </span>
        <Link to="/settings" className="underline">
          Change in Settings
        </Link>
      </div>

      <Link to="/assess/full" className="card mt-4 block border-accent p-4 text-ink no-underline transition-colors hover:bg-accent-soft">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Full Assessment</h2>
          <span className="text-xs text-muted">all {GAMES.length} games back to back</span>
        </div>
        <p className="mt-1 text-sm text-muted">Run every game in sequence, like the real thing, and get a summary at the end.</p>
      </Link>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => {
          const best = bestScore(results, g.id);
          const plays = results.filter((r) => r.game === g.id).length;
          return (
            <Link key={g.id} to={`/assess/play/${g.id}`} className="card block p-4 text-ink no-underline transition-colors hover:border-accent focus-visible:border-accent">
              <h2 className="text-lg font-semibold">{g.name}</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{g.skill}</p>
              <p className="mt-1 text-sm text-muted">{g.goal}</p>
              <p className="tabular mt-3 text-sm">
                <span className="text-muted">{g.format}</span>
              </p>
              <p className="tabular mt-1 text-sm font-medium text-accent-ink">{plays === 0 ? 'Not played yet' : `Best ${best} · ${plays} ${plays === 1 ? 'run' : 'runs'}`}</p>
            </Link>
          );
        })}
      </div>

      <p className="mt-4">
        <Link to="/assess/history" className="btn">
          Assessment history
        </Link>
      </p>
      <p className="mt-4 text-xs text-muted">
        These are original practice games. They are not affiliated with, or copies of, any employer&rsquo;s or test publisher&rsquo;s assessments. Everything runs in your browser and your results stay on this device.
      </p>
    </div>
  );
}
