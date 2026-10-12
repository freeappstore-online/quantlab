import { PageHeader, useDocumentTitle } from '@freeappstore/sdk/ui';
import { useEffect, useMemo, useState } from 'react';
import { useDrill, type DrillResult } from '../hooks/useDrill';
import { go } from '../hooks/useRoute';
import { fmt, fmtClock } from '../services/format';
import { DIFFICULTY_LABELS, type ModeConfig } from '../services/modes';
import { summarise } from '../services/scoring';
import { DIFFICULTIES, type Difficulty, type Session, type Settings } from '../types';
import { Keypad } from './Keypad';
import { Link } from './Link';
import { Results } from './Results';

interface Props {
  mode: ModeConfig;
  settings: Settings;
  sessions: readonly Session[];
  onDifficulty: (d: Difficulty) => void;
  onSave: (session: Session) => void;
}

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return coarse;
}

/** Long word-problem prompts get a smaller size so the keypad always stays on screen. */
function promptSize(length: number): string {
  if (length <= 12) return 'text-5xl short:text-3xl';
  if (length <= 26) return 'text-3xl short:text-2xl';
  return 'text-xl short:text-lg';
}

export function Drill({ mode, settings, sessions, onDifficulty, onSave }: Props) {
  useDocumentTitle(`${mode.name} — QuantLab`);
  const difficulty = settings.lastDifficulty[mode.id];
  const [outcome, setOutcome] = useState<{ session: Session; answers: DrillResult['answers']; previousBest: number | null } | null>(null);
  const coarse = useCoarsePointer();
  const showKeypad = settings.keypad === 'on' || (settings.keypad === 'auto' && coarse);

  const previousBest = useMemo(() => {
    const scores = sessions.filter((s) => s.mode === mode.id && s.difficulty === difficulty).map((s) => s.score);
    return scores.length === 0 ? null : Math.max(...scores);
  }, [sessions, mode.id, difficulty]);

  const drill = useDrill({
    mode,
    difficulty,
    autoAdvance: settings.autoAdvance,
    onFinish: (result) => {
      const session = summarise({ mode: mode.id, difficulty, ...result });
      onSave(session);
      setOutcome({ session, answers: result.answers, previousBest });
    },
  });

  // Esc leaves the drill from any phase.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') go('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (drill.phase === 'done' && outcome) {
    return (
      <Results
        mode={mode}
        session={outcome.session}
        answers={outcome.answers}
        previousBest={outcome.previousBest}
        onAgain={() => {
          setOutcome(null);
          drill.reset();
        }}
        onHistory={() => go(`/history/${mode.id}`)}
        onHome={() => go('/')}
      />
    );
  }

  if (drill.phase === 'ready') {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-4">
        <Link to="/" className="text-sm text-muted no-underline hover:text-ink">
          ← All modes
        </Link>
        <PageHeader title={mode.name} description={mode.tagline} />

        <div className="mt-5">
          <div className="stat-label mb-2" id="difficulty-label">
            Difficulty
          </div>
          <div className="seg" role="group" aria-labelledby="difficulty-label">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" aria-pressed={d === difficulty} onClick={() => onDifficulty(d)}>
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <p className="tabular mt-2 text-sm text-muted">
            {previousBest === null ? 'No score at this level yet.' : `Your best at this level: ${previousBest}`}
          </p>
        </div>

        <ul className="card mt-5 space-y-2 p-4 text-sm">
          {mode.rules.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-ink">
                •
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn-primary mt-5 w-full min-h-12 text-base" onClick={drill.start} autoFocus>
          Start
        </button>
        <p className="mt-3 text-center text-xs text-muted">The clock stops if you switch tabs. Press Esc to leave.</p>
      </div>
    );
  }

  if (drill.phase === 'countdown') {
    return (
      <div className="flex flex-1 items-center justify-center" role="status" aria-live="assertive">
        <h1 className="sr-only">{mode.name}</h1>
        <div className="tabular text-8xl font-bold text-accent-ink">{drill.count}</div>
      </div>
    );
  }

  // Running.
  const q = drill.question;
  const urgent = drill.remainingMs <= 10_000;
  const progress = 1 - drill.remainingMs / drill.limitMs;
  const answered = drill.answers.length;
  const correct = drill.answers.filter((a) => a.correct).length;

  return (
    <div className="no-select mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[env(safe-area-inset-top)] pb-3 short:max-w-3xl short:flex-row short:gap-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between py-2 compact:py-1 short:py-1.5">
          <Link to="/" className="btn min-h-10 px-3 compact:min-h-9" aria-label="Quit this run">
            Quit
          </Link>
          <h1 className="tabular text-sm font-semibold text-muted">
            <span className="sr-only">{mode.name}. </span>
            Score <span className="text-ink">{correct}</span>
            <span aria-hidden="true"> · </span>
            {mode.questionLimit !== null ? `${Math.min(answered + 1, mode.questionLimit)}/${mode.questionLimit}` : `${answered} done`}
          </h1>
          <div className={`tabular w-14 text-right text-lg font-semibold ${urgent ? 'text-danger' : ''}`} role="timer" aria-label="Time left">
            {fmtClock(drill.remainingMs)}
          </div>
        </div>

        <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-2 text-center short:py-1">
          {drill.paused && <p className="mb-3 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent-ink">Paused while the tab is hidden</p>}
          {q && (
            <>
              <div className={`tabular max-w-full break-words font-mono font-semibold ${promptSize(q.prompt.length)}`} aria-live="off">
                {q.prompt}
              </div>
              <div className="mt-1 h-5 text-sm text-muted compact:mt-0.5 compact:h-4 compact:text-xs">{q.hint ?? ''}</div>
            </>
          )}
          <div
            className="tabular card mt-3 flex h-14 compact:mt-2 compact:h-11 w-full max-w-xs items-center justify-center font-mono text-3xl short:mt-2 short:h-12 short:text-2xl"
            role="textbox"
            aria-label="Your answer"
            aria-readonly="true"
          >
            {drill.input === '' ? <span className="text-base text-muted">type your answer</span> : drill.input.replace('-', '−')}
          </div>
          <div className="tabular mt-2 h-6 text-sm compact:mt-1 compact:h-4 compact:text-xs short:mt-1" aria-live="polite">
            {drill.last &&
              (drill.last.correct ? (
                <span className="text-accent-ink">✓ Correct</span>
              ) : (
                <span className="text-danger">
                  ✗ {drill.last.given === null ? 'Skipped' : fmt(drill.last.given)}: answer {drill.last.question.tolerance === 0 ? '' : '≈ '}
                  {fmt(drill.last.question.answer, 2)}
                </span>
              ))}
          </div>
        </div>
      </div>

      {showKeypad ? (
        <div className="short:w-60 short:shrink-0 short:self-center">
          <Keypad onKey={drill.press} hasInput={drill.input !== ''} />
        </div>
      ) : (
        <p className="pb-2 text-center text-xs text-muted short:self-center short:w-48">Type your answer · Enter to submit or skip · − for negative · Esc to quit</p>
      )}
    </div>
  );
}
