import { PageHeader } from '@freeappstore/sdk/ui';
import type { ReactNode } from 'react';
import { fmtPercent, fmtSeconds } from '../../services/format';
import { tipFor } from '../../services/assess/tips';
import type { GameResult } from '../../services/assess/types';
import type { GameDef } from './api';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="stat-label">{label}</div>
      <div className="tabular mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

interface Props {
  def: GameDef;
  result: GameResult;
  /** Best earlier score for this game, or null if there is none. */
  previousBest: number | null;
  /** Buttons for what to do next. */
  actions: ReactNode;
}

/** Score, accuracy, average time per item, comparison with the personal best, and one tip. */
export function AssessResults({ def, result, previousBest, actions }: Props) {
  const accuracy = result.attempted === 0 ? 0 : result.correct / result.attempted;
  const isBest = previousBest === null ? result.score > 0 : result.score > previousBest;
  return (
    <div className="mx-auto w-full max-w-md px-4 py-4">
      <PageHeader title="Results" description={def.name} />
      <div className="card mt-4 p-6 text-center">
        <div className="tabular text-6xl font-bold" aria-live="polite">
          {result.scoreText}
        </div>
        {isBest && (
          <div className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-ink">
            {previousBest === null ? 'First score on the board' : `New personal best (was ${previousBest})`}
          </div>
        )}
        {!isBest && previousBest !== null && <p className="mt-3 text-sm text-muted">Personal best: {previousBest}</p>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Accuracy" value={fmtPercent(accuracy)} />
        <Stat label="Avg time per item" value={result.avgItemMs === null ? 'n/a' : fmtSeconds(result.avgItemMs)} />
        <Stat label="Items attempted" value={String(result.attempted)} />
        <Stat label="Items correct" value={String(result.correct)} />
      </div>

      {result.detail && result.detail.length > 0 && (
        <ul className="card mt-3 space-y-2 p-4 text-sm">
          {result.detail.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 rounded-xl bg-accent-soft p-4 text-sm text-accent-ink">
        <strong>To improve:</strong> {tipFor(def.id, result)}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
