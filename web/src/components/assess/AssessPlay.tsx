import { PageHeader, useDocumentTitle } from '@freeappstore/sdk/ui';
import { useCallback, useState } from 'react';
import { go } from '../../hooks/useRoute';
import type { AssessStore } from '../../hooks/useAssessStore';
import { bestScore } from '../../services/assess/storage';
import type { AssessRecord, GameResult } from '../../services/assess/types';
import { pickSeed } from '../../services/assess/util';
import { Link } from '../Link';
import type { GameDef } from './api';
import { AssessResults } from './AssessResults';
import { GameFrame } from './GameFrame';

export function newRecordId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toRecord(def: GameDef, r: GameResult, override: AssessRecord['override'], full: boolean): AssessRecord {
  return {
    id: newRecordId(),
    game: def.id,
    at: Date.now(),
    score: r.score,
    scoreText: r.scoreText,
    correct: r.correct,
    attempted: r.attempted,
    avgItemMs: r.avgItemMs,
    override,
    full,
  };
}

type Stage = 'intro' | 'tutorial' | 'test' | 'results';

export function AssessPlay({ def, store }: { def: GameDef; store: AssessStore }) {
  useDocumentTitle(`${def.name} — QuantLab`);
  const { settings, results, addResult } = store;
  const [stage, setStage] = useState<Stage>('intro');
  const [runKey, setRunKey] = useState(0);
  const [seed, setSeed] = useState(pickSeed);
  const [outcome, setOutcome] = useState<{ result: GameResult; previousBest: number | null } | null>(null);
  const [tutorialDone, setTutorialDone] = useState(false);

  const begin = (next: 'tutorial' | 'test'): void => {
    setSeed(pickSeed());
    setRunKey((k) => k + 1);
    setStage(next);
  };

  const onTestFinish = useCallback(
    (result: GameResult) => {
      const previousBest = bestScore(results, def.id);
      addResult(toRecord(def, result, settings.override, false));
      setOutcome({ result, previousBest });
      setStage('results');
    },
    [results, addResult, def, settings.override],
  );

  const onTutorialFinish = useCallback(() => {
    setTutorialDone(true);
    setStage('intro');
  }, []);

  if (stage === 'tutorial' || stage === 'test') {
    return (
      <GameFrame
        key={runKey}
        def={def}
        phase={stage}
        seed={seed}
        settings={settings}
        onFinish={stage === 'tutorial' ? onTutorialFinish : onTestFinish}
        onQuit={() => setStage('intro')}
      />
    );
  }

  if (stage === 'results' && outcome) {
    return (
      <AssessResults
        def={def}
        result={outcome.result}
        previousBest={outcome.previousBest}
        actions={
          <>
            <button type="button" className="btn btn-primary flex-1" onClick={() => begin('test')}>
              Play again
            </button>
            <Link to={`/assess/history/${def.id}`} className="btn flex-1">
              History
            </Link>
            <button type="button" className="btn flex-1" onClick={() => go('/assess')}>
              All games
            </button>
          </>
        }
      />
    );
  }

  const personalBest = bestScore(results, def.id);
  return (
    <div className="mx-auto w-full max-w-md px-4 py-4">
      <Link to="/assess" className="text-sm text-muted no-underline hover:text-ink">
        {'←'} All assessment games
      </Link>
      <PageHeader title={def.name} description={def.goal} />
      <ul className="card mt-3 space-y-1 p-4 text-sm">
        <li>
          <strong>Skill:</strong> {def.skill}
        </li>
        <li>
          <strong>Format:</strong> {def.format}
        </li>
        <li>
          <strong>Difficulty:</strong> {settings.override === 'auto' ? 'rises through the test' : `${settings.override} (override from Settings)`}
        </li>
        {def.timerSeconds !== null && !settings.timerOn && (
          <li>
            <strong>Study mode is on:</strong> there is no countdown. Change this in Settings.
          </li>
        )}
        <li>
          <strong>Personal best:</strong> {personalBest === null ? 'none yet' : personalBest}
        </li>
      </ul>
      {tutorialDone && (
        <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink" role="status">
          Tutorial complete. Nothing was saved. Start the test when you are ready.
        </p>
      )}
      <div className="mt-4 grid gap-2">
        <button type="button" className="btn btn-primary min-h-12 text-base" onClick={() => begin('test')} autoFocus>
          Start Test
        </button>
        <button type="button" className="btn min-h-12" onClick={() => begin('tutorial')}>
          Begin Tutorial (2 untimed practice rounds)
        </button>
      </div>
    </div>
  );
}
