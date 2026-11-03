import { PageHeader, useDocumentTitle } from '@freeappstore/sdk/ui';
import { useCallback, useState } from 'react';
import { go } from '../../hooks/useRoute';
import type { AssessStore } from '../../hooks/useAssessStore';
import { fmtPercent } from '../../services/format';
import type { GameResult } from '../../services/assess/types';
import { pickSeed } from '../../services/assess/util';
import { Link } from '../Link';
import { toRecord } from './AssessPlay';
import { GameFrame } from './GameFrame';
import { GAMES } from './registry';

type Stage = 'intro' | 'between' | 'run' | 'summary';

/** Runs every game back to back, saving each result, and ends with a summary. */
export function FullAssessment({ store }: { store: AssessStore }) {
  useDocumentTitle('Full Assessment — QuantLab');
  const { settings, addResult } = store;
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(pickSeed);
  const [done, setDone] = useState<GameResult[]>([]);

  const def = GAMES[index];
  const timedMinutes = GAMES.reduce((s, g) => s + (g.timerSeconds ? (g.id === 'typohunt' ? 5 : g.timerSeconds / 60) : 6), 0);

  const onFinish = useCallback(
    (result: GameResult) => {
      addResult(toRecord(def, result, settings.override, true));
      setDone((d) => [...d, result]);
      if (index + 1 >= GAMES.length) setStage('summary');
      else {
        setIndex(index + 1);
        setStage('between');
      }
    },
    [addResult, def, settings.override, index],
  );

  if (stage === 'run') {
    return <GameFrame key={def.id} def={def} phase="test" seed={seed} settings={settings} onFinish={onFinish} onQuit={() => go('/assess')} />;
  }

  if (stage === 'summary') {
    const attempted = done.reduce((s, r) => s + r.attempted, 0);
    const correct = done.reduce((s, r) => s + r.correct, 0);
    return (
      <div className="mx-auto w-full max-w-md px-4 py-4">
        <PageHeader title="Full Assessment complete" description="Each result was also saved to your history." />
        <ul className="card mt-4 divide-y divide-border">
          {GAMES.map((g, i) => {
            const r = done[i];
            if (!r) return null;
            return (
              <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="tabular text-right">
                  <strong className="text-base">{r.scoreText}</strong>
                  <span className="block text-xs text-muted">{fmtPercent(r.attempted === 0 ? 0 : r.correct / r.attempted)} accurate</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="tabular mt-3 text-center text-sm text-muted">
          Overall accuracy across all items: <strong className="text-ink">{fmtPercent(attempted === 0 ? 0 : correct / attempted)}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => {
              setDone([]);
              setIndex(0);
              setSeed(pickSeed());
              setStage('intro');
            }}
          >
            Run it again
          </button>
          <Link to="/assess/history" className="btn flex-1">
            History
          </Link>
          <Link to="/assess" className="btn flex-1">
            All games
          </Link>
        </div>
      </div>
    );
  }

  if (stage === 'between') {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-4">
        <PageHeader title={`Game ${index + 1} of ${GAMES.length}: ${def.name}`} description={def.goal} />
        <ul className="card mt-3 space-y-1 p-4 text-sm">
          <li>
            <strong>Skill:</strong> {def.skill}
          </li>
          <li>
            <strong>Format:</strong> {def.format}
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted">Take a breath. The next game starts when you press the button.</p>
        <button
          type="button"
          className="btn btn-primary mt-3 min-h-12 w-full text-base"
          onClick={() => {
            setSeed(pickSeed());
            setStage('run');
          }}
          autoFocus
        >
          Start {def.name}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-4">
      <Link to="/assess" className="text-sm text-muted no-underline hover:text-ink">
        {'←'} All assessment games
      </Link>
      <PageHeader title="Full Assessment" description={`All ${GAMES.length} games back to back, like the real thing. Allow about ${Math.round(timedMinutes)} minutes.`} />
      <ol className="card mt-3 space-y-2 p-4 text-sm">
        {GAMES.map((g, i) => (
          <li key={g.id} className="flex justify-between gap-3">
            <span>
              {i + 1}. <strong>{g.name}</strong>
            </span>
            <span className="text-muted">{g.format}</span>
          </li>
        ))}
      </ol>
      {!settings.timerOn && <p className="mt-3 text-sm text-muted">Study mode is on, so the countdowns are off. Switch it on in Settings for a realistic run.</p>}
      <button
        type="button"
        className="btn btn-primary mt-4 min-h-12 w-full text-base"
        onClick={() => {
          setDone([]);
          setIndex(0);
          setSeed(pickSeed());
          setStage('between');
        }}
        autoFocus
      >
        Start Full Assessment
      </button>
    </div>
  );
}
