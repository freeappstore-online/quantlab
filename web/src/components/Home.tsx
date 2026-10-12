import { PageHeader } from '@freeappstore/sdk/ui';
import { DIFFICULTY_LABELS, MODE_LIST } from '../services/modes';
import type { Session } from '../types';
import { Link } from './Link';

export function Home({ sessions }: { sessions: readonly Session[] }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
      <PageHeader
        title="Train for the quant test"
        description="Short timed drills for the mental maths, sequences and estimation that quant interviews and online tests actually use. Free, offline, no account."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {MODE_LIST.map((mode) => {
          const own = sessions.filter((s) => s.mode === mode.id);
          const last = own[own.length - 1];
          const meta =
            mode.questionLimit === null
              ? `${mode.durationSec / 60} min · open-ended`
              : `${mode.questionLimit} questions · ${mode.durationSec / 60} min`;
          return (
            <Link
              key={mode.id}
              to={`/play/${mode.id}`}
              className="card block p-4 text-ink no-underline transition-colors hover:border-accent focus-visible:border-accent"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{mode.name}</h2>
                <span className="text-xs text-muted">{meta}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{mode.tagline}</p>
              <p className="tabular mt-3 text-sm">
                {last ? (
                  <>
                    <span className="font-medium text-accent-ink">Last: {last.score}</span>{' '}
                    <span className="text-muted">
                      · {DIFFICULTY_LABELS[last.difficulty]} · {own.length} {own.length === 1 ? 'session' : 'sessions'}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Not played yet</span>
                )}
              </p>
            </Link>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <p className="mt-6 rounded-xl bg-accent-soft p-4 text-sm text-accent-ink">
          New here? Start with Arithmetic Sprint on Medium. It takes two minutes and sets your first benchmark.
        </p>
      )}
    </div>
  );
}
