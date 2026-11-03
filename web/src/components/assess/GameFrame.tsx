import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playSound } from '../../services/assess/sound';
import type { AssessSettings, GameResult } from '../../services/assess/types';
import { formatClock, levelFor } from '../../services/assess/util';
import type { FrameApi, GameDef, Hud } from './api';
import { OKABE } from './palette';

interface CountdownProps {
  durationMs: number;
  running: boolean;
  resetKey: number;
  onExpire: () => void;
}

/** Green countdown bar with an mm:ss readout. The clock pauses while the tab is hidden. */
function CountdownBar({ durationMs, running, resetKey, onExpire }: CountdownProps) {
  const [elapsed, setElapsed] = useState(0);
  const clock = useRef({ elapsed: 0, last: performance.now(), fired: false });
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    clock.current = { elapsed: 0, last: performance.now(), fired: false };
    setElapsed(0);
  }, [resetKey, durationMs]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const c = clock.current;
      const now = performance.now();
      if (running && !document.hidden) c.elapsed += now - c.last;
      c.last = now;
      setElapsed(c.elapsed);
      if (c.elapsed >= durationMs && !c.fired) {
        c.fired = true;
        onExpireRef.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, durationMs]);

  const remaining = Math.max(0, durationMs - elapsed);
  const fraction = remaining / durationMs;
  const urgent = remaining <= 10_000 || fraction < 0.1;
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${fraction * 100}%`, background: urgent ? OKABE.vermillion : OKABE.green }} />
      </div>
      <div className="tabular w-14 text-right text-sm font-bold" role="timer" aria-label="Time left" style={{ color: urgent ? OKABE.vermillion : undefined }}>
        {formatClock(remaining)}
      </div>
    </div>
  );
}

interface Props {
  def: GameDef;
  phase: 'tutorial' | 'test';
  seed: number;
  settings: AssessSettings;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
}

/** The shared top bar (round counter, countdown, score widget) around whichever game is running. */
export function GameFrame({ def, phase, seed, settings, onFinish, onQuit }: Props) {
  const [hud, setHud] = useState<Hud>({ round: '' });
  const [timerKey, setTimerKey] = useState(0);
  const [running, setRunning] = useState(true);
  const [expired, setExpired] = useState(false);
  const finished = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const timed = phase === 'test' && settings.timerOn && def.timerSeconds !== null;

  const finish = useCallback(
    (r: GameResult) => {
      if (finished.current || !mounted.current) return;
      finished.current = true;
      onFinish(r);
    },
    [onFinish],
  );

  const api: FrameApi = useMemo(
    () => ({
      phase,
      seed,
      settings,
      timed,
      expired,
      resetTimer: () => {
        setTimerKey((k) => k + 1);
        setExpired(false);
      },
      setTimerRunning: setRunning,
      setHud,
      finish,
      sound: (kind) => playSound(settings.sound, kind),
      level: (index, total) => (phase === 'tutorial' ? Math.min(0.15, index * 0.1) : levelFor(index, total, settings.override)),
    }),
    [phase, seed, settings, timed, expired, finish],
  );

  const Game = def.Component;
  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-8 pt-2">
      <h1 className="sr-only">{def.name}</h1>
      <div className="card mb-3 space-y-2 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="btn min-h-10 px-3" onClick={onQuit} aria-label="Quit and return to the assessment list">
            Quit
          </button>
          <div className="tabular min-w-0 flex-1 text-center text-sm font-semibold" aria-live="polite">
            {phase === 'tutorial' && <span className="mr-1 text-muted">Tutorial ·</span>}
            {hud.round}
          </div>
          <div className="tabular min-w-[4.5rem] text-right text-sm font-bold">{hud.widget}</div>
        </div>
        {timed && def.timerSeconds !== null ? (
          <CountdownBar durationMs={def.timerSeconds * 1000} running={running} resetKey={timerKey} onExpire={() => setExpired(true)} />
        ) : (
          <p className="text-xs text-muted">{phase === 'tutorial' ? 'Untimed practice. Nothing is saved.' : def.timerSeconds === null ? 'No time limit.' : 'Study mode: no timer.'}</p>
        )}
      </div>
      <Game api={api} />
    </div>
  );
}
