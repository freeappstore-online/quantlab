import { PageHeader } from '@freeappstore/sdk/ui';
import { fmt, fmtPercent, fmtSeconds } from '../services/format';
import { DIFFICULTY_LABELS, type ModeConfig } from '../services/modes';
import { accuracy } from '../services/scoring';
import type { AnswerRecord, Session } from '../types';

interface Props {
  mode: ModeConfig;
  session: Session;
  answers: readonly AnswerRecord[];
  /** Best earlier score at this difficulty, or null if this is the first run. */
  previousBest: number | null;
  onAgain: () => void;
  onHistory: () => void;
  onHome: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="stat-label">{label}</div>
      <div className="tabular mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function given(a: AnswerRecord): string {
  return a.given === null ? 'skipped' : fmt(a.given);
}

export function Results({ mode, session, answers, previousBest, onAgain, onHistory, onHome }: Props) {
  const misses = answers.filter((a) => !a.correct);
  const newBest = previousBest === null ? session.score > 0 : session.score > previousBest;
  const total = mode.questionLimit;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-4">
      <PageHeader title="Results" description={`${mode.name} · ${DIFFICULTY_LABELS[session.difficulty]}`} />
      <div className="card mt-4 p-6 text-center">
        <div className="tabular text-6xl font-bold" aria-live="polite">
          {session.score}
          {total !== null && <span className="text-2xl font-medium text-muted"> / {total}</span>}
        </div>
        {newBest && (
          <div className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-ink">
            {previousBest === null ? 'First score on the board' : `New personal best (was ${previousBest})`}
          </div>
        )}
        {!newBest && previousBest !== null && <p className="mt-3 text-sm text-muted">Personal best at this level: {previousBest}</p>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Accuracy" value={fmtPercent(accuracy(session))} />
        <Stat label="Avg per correct" value={fmtSeconds(session.avgCorrectMs)} />
        <Stat label="Attempted" value={String(session.attempted)} />
        <Stat label="Best streak" value={String(session.bestStreak)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={onAgain}>
          Play again
        </button>
        <button type="button" className="btn flex-1" onClick={onHistory}>
          History
        </button>
        <button type="button" className="btn flex-1" onClick={onHome}>
          Home
        </button>
      </div>

      <section className="mt-6" aria-labelledby="review-heading">
        <h2 id="review-heading" className="text-base font-semibold">
          {misses.length === 0 ? 'No misses. Clean run.' : `Review: ${misses.length} to revisit`}
        </h2>
        {misses.length > 0 && (
          <ul className="mt-2 space-y-2">
            {misses.map((a, i) => (
              <li key={i} className="card p-3 text-sm">
                <div className="tabular font-mono text-base">{a.question.prompt}</div>
                <div className="mt-1 text-muted">
                  You: <span className="tabular text-danger">{given(a)}</span> · Answer:{' '}
                  <span className="tabular font-medium text-ink">
                    {a.question.tolerance === 0 ? '' : '≈ '}
                    {fmt(a.question.answer, 2)}
                  </span>
                </div>
                {a.question.explain && <div className="mt-1 text-muted">{a.question.explain}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
