import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { generateBubbleRound } from '../../../services/assess/bubbles';
import type { GameResult } from '../../../services/assess/types';
import { clamp, mean, seededRng } from '../../../services/assess/util';
import type { FrameApi } from '../api';
import { OKABE } from '../palette';

const ROUNDS = 12;
const TUTORIAL_ROUNDS = 2;
const ARENA_HEIGHT = 330;

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function BubbleOrder({ api }: { api: FrameApi }) {
  const total = api.phase === 'tutorial' ? TUTORIAL_ROUNDS : ROUNDS;
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [popped, setPopped] = useState<number[]>([]);
  const [status, setStatus] = useState<'play' | 'failed' | 'cleared'>('play');
  const [cleared, setCleared] = useState(0);
  const arena = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const size = useRef(80);
  const [diam, setDiam] = useState(80);
  const stats = useRef({ good: 0, bad: 0, times: [] as number[], cleared: 0 });
  const lastPop = useRef(performance.now());
  const finished = useRef(false);
  const alive = useRef(true);

  const level = api.level(round, total);
  const puzzle = useMemo(() => generateBubbleRound(seededRng(api.seed, round), level), [api.seed, round, level]);
  const { setHud, finish, sound } = api;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setHud({ round: `Round ${round + 1} of ${total}`, widget: `Cleared ${cleared}` });
  }, [setHud, round, total, cleared]);

  const end = (): void => {
    if (finished.current) return;
    finished.current = true;
    const s = stats.current;
    const result: GameResult = {
      score: s.cleared,
      scoreText: String(s.cleared),
      correct: s.good,
      attempted: s.good + s.bad,
      avgItemMs: mean(s.times),
      detail: [`${s.cleared} of ${total} rounds cleared`, `${s.good} correct pops, ${s.bad} wrong`],
    };
    sound('done');
    finish(result);
  };

  useEffect(() => {
    if (api.expired) end();
  }, [api.expired]);

  // Lay the bubbles out without overlap, then let them drift.
  useLayoutEffect(() => {
    const box = arena.current;
    if (!box) return;
    const width = box.clientWidth;
    const d = clamp(Math.floor(width / 4.2), 62, 96);
    size.current = d;
    setDiam(d);
    const placed: Body[] = [];
    const calm = prefersReducedMotion();
    for (let i = 0; i < puzzle.bubbles.length; i++) {
      let best: Body = { x: 0, y: 0, vx: 0, vy: 0 };
      for (let tries = 0; tries < 60; tries++) {
        const x = Math.random() * (width - d);
        const y = Math.random() * (ARENA_HEIGHT - d);
        const clear = placed.every((p) => Math.hypot(p.x - x, p.y - y) > d * 1.08);
        best = { x, y, vx: 0, vy: 0 };
        if (clear) break;
      }
      const speed = calm ? 0 : 16 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      best.vx = Math.cos(angle) * speed;
      best.vy = Math.sin(angle) * speed;
      placed.push(best);
    }
    bodies.current = placed;
    placed.forEach((b, i) => {
      const el = els.current[i];
      if (el) el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });
    lastPop.current = performance.now();
    if (calm) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = box.clientWidth;
      for (let i = 0; i < bodies.current.length; i++) {
        const b = bodies.current[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 0 || b.x > w - size.current) {
          b.vx = -b.vx;
          b.x = clamp(b.x, 0, w - size.current);
        }
        if (b.y < 0 || b.y > ARENA_HEIGHT - size.current) {
          b.vy = -b.vy;
          b.y = clamp(b.y, 0, ARENA_HEIGHT - size.current);
        }
        const el = els.current[i];
        if (el) el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [puzzle, attempt]);

  const advance = (delay: number, retry: boolean): void => {
    window.setTimeout(() => {
      if (!alive.current || finished.current) return;
      if (retry) {
        setPopped([]);
        setStatus('play');
        setAttempt((a) => a + 1);
      } else if (round + 1 >= total) {
        end();
      } else {
        setPopped([]);
        setStatus('play');
        setRound((r) => r + 1);
      }
    }, delay);
  };

  const pop = (id: number): void => {
    if (status !== 'play' || popped.includes(id)) return;
    const expected = puzzle.order[popped.length];
    const now = performance.now();
    if (id === expected) {
      stats.current.good += 1;
      stats.current.times.push(now - lastPop.current);
      lastPop.current = now;
      sound('good');
      const next = [...popped, id];
      setPopped(next);
      if (next.length === puzzle.order.length) {
        stats.current.cleared += 1;
        setCleared(stats.current.cleared);
        setStatus('cleared');
        advance(800, false);
      }
    } else {
      stats.current.bad += 1;
      sound('bad');
      setStatus('failed');
      // In practice rounds a wrong pop just lets you try the same puzzle again.
      advance(1800, api.phase === 'tutorial');
    }
  };

  const rankOf = (id: number): number => puzzle.order.indexOf(id) + 1;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Pop the bubbles from the smallest value to the largest. One wrong pop ends the round.</p>
      <div
        ref={arena}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-surface"
        style={{ height: ARENA_HEIGHT }}
        role="group"
        aria-label={`${puzzle.bubbles.length} bubbles. Pop in ascending order of value.`}
      >
        {puzzle.bubbles.map((b, i) => {
          const gone = popped.includes(b.id);
          const reveal = status !== 'play';
          return (
            <button
              key={`${round}-${attempt}-${b.id}`}
              ref={(el) => {
                els.current[i] = el;
              }}
              type="button"
              aria-label={`Bubble ${b.text}${gone ? ', popped' : ''}`}
              disabled={gone}
              onClick={() => pop(b.id)}
              className="absolute left-0 top-0 flex flex-col items-center justify-center rounded-full border-2 font-bold shadow-sm"
              style={{
                width: diam,
                height: diam,
                background: gone ? 'transparent' : '#d6ecfa',
                borderColor: gone ? 'transparent' : OKABE.blue,
                color: '#111111',
                opacity: gone ? 0 : 1,
                fontSize: b.text.length > 8 ? 13 : 17,
                touchAction: 'manipulation',
                transition: 'opacity 150ms',
              }}
            >
              <span>{b.text}</span>
              {reveal && !gone && <span className="text-[11px] font-semibold" style={{ color: OKABE.vermillion }}>#{rankOf(b.id)}</span>}
            </button>
          );
        })}
      </div>
      <p className="min-h-6 text-center text-sm font-semibold" role="status" aria-live="polite">
        {status === 'cleared' && '✓ Round cleared'}
        {status === 'failed' && (api.phase === 'tutorial' ? '✗ Not that one. The numbers show the right order. Try again.' : '✗ Wrong pop. The numbers show the right order.')}
        {status === 'play' && popped.length > 0 && `${popped.length} of ${puzzle.order.length} popped`}
      </p>
    </div>
  );
}
