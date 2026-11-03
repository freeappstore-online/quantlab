import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { makeStreamBubble, streamPace, type StreamBubble, type StreamSpec } from '../../../services/assess/bubbles';
import { clamp, seededRng } from '../../../services/assess/util';
import { OKABE } from '../palette';

const ARENA_HEIGHT = 340;

interface Item extends StreamBubble {
  id: number;
  born: number;
}

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const RULE: Record<StreamSpec['kind'], (n: number) => string> = {
  equals: (n) => `Pop every equation that equals ${n}`,
  below: (n) => `Pop every equation worth less than ${n}`,
  above: (n) => `Pop every equation worth more than ${n}`,
};

interface Props {
  spec: StreamSpec;
  /** 0..1 difficulty of this round. */
  level: number;
  seed: number;
  onGood: (msSinceLast: number) => void;
  onBad: () => void;
  onEnd: (outcome: 'cleared' | 'failed') => void;
}

/** A round where equations keep arriving, faster and in bigger waves, until enough matching ones are popped. */
export function BubbleStream({ spec, level, seed, onGood, onBad, onEnd }: Props) {
  const arena = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<number, HTMLButtonElement>());
  const bodies = useRef(new Map<number, Body>());
  const itemsRef = useRef<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [hits, setHits] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [message, setMessage] = useState('');
  const [diam, setDiam] = useState(76);
  const live = useRef({ hits: 0, strikes: 0, over: false, nextId: 0, elapsed: 0, acc: 0, lastGood: performance.now() });
  const rng = useRef(seededRng(seed, 7000));
  const callbacks = useRef({ onGood, onBad, onEnd });
  callbacks.current = { onGood, onBad, onEnd };
  const size = useRef(76);

  const sync = (): void => setItems(itemsRef.current.slice());
  const place = (id: number): void => {
    const b = bodies.current.get(id);
    const el = els.current.get(id);
    if (b && el) el.style.transform = `translate(${b.x}px, ${b.y}px)`;
  };

  useLayoutEffect(() => {
    const box = arena.current;
    if (!box) return;
    const d = clamp(Math.floor(box.clientWidth / 4.4), 64, 92);
    size.current = d;
    setDiam(d);
    const calm = prefersReducedMotion();
    let frame = 0;
    let last = performance.now();

    const spawn = (count: number, cap: number): void => {
      const width = box.clientWidth;
      for (let i = 0; i < count && itemsRef.current.length < cap; i++) {
        const noMatchOnScreen = !itemsRef.current.some((x) => x.match);
        const wantMatch = (noMatchOnScreen && i === 0) || rng.current() < 0.4;
        const bubble = makeStreamBubble(rng.current, spec, level, wantMatch);
        const id = live.current.nextId++;
        const angle = rng.current() * Math.PI * 2;
        const speed = calm ? 0 : 18 + rng.current() * 22;
        bodies.current.set(id, { x: rng.current() * (width - d), y: rng.current() * (ARENA_HEIGHT - d), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
        itemsRef.current.push({ ...bubble, id, born: live.current.elapsed });
      }
    };

    spawn(2, 6);
    sync();
    const tick = (now: number): void => {
      const l = live.current;
      if (!l.over) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        l.elapsed += dt * 1000;
        l.acc += dt * 1000;
        const pace = streamPace(level, l.elapsed);
        let changed = false;
        if (l.acc >= pace.intervalMs) {
          l.acc = 0;
          const before = itemsRef.current.length;
          spawn(pace.wave, pace.cap);
          changed = itemsRef.current.length !== before;
        }
        const alive = itemsRef.current.filter((it) => {
          const ok = l.elapsed - it.born < pace.lifeMs * (calm ? 1.6 : 1);
          if (!ok) {
            bodies.current.delete(it.id);
            changed = true;
          }
          return ok;
        });
        itemsRef.current = alive;
        const w = box.clientWidth;
        for (const it of alive) {
          const b = bodies.current.get(it.id);
          if (!b) continue;
          b.x += b.vx * dt * pace.speed;
          b.y += b.vy * dt * pace.speed;
          if (b.x < 0 || b.x > w - size.current) {
            b.vx = -b.vx;
            b.x = clamp(b.x, 0, w - size.current);
          }
          if (b.y < 0 || b.y > ARENA_HEIGHT - size.current) {
            b.vy = -b.vy;
            b.y = clamp(b.y, 0, ARENA_HEIGHT - size.current);
          }
          place(it.id);
        }
        if (changed) sync();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spec, level]);

  const pop = (id: number): void => {
    const l = live.current;
    const it = itemsRef.current.find((x) => x.id === id);
    if (l.over || !it) return;
    itemsRef.current = itemsRef.current.filter((x) => x.id !== id);
    bodies.current.delete(id);
    sync();
    const now = performance.now();
    if (it.match) {
      l.hits += 1;
      setHits(l.hits);
      setMessage('');
      callbacks.current.onGood(now - l.lastGood);
      l.lastGood = now;
      if (l.hits >= spec.goal) {
        l.over = true;
        callbacks.current.onEnd('cleared');
      }
    } else {
      l.strikes += 1;
      setStrikes(l.strikes);
      const why = spec.kind === 'equals' ? `not ${spec.target}` : spec.kind === 'below' ? `not below ${spec.target}` : `not above ${spec.target}`;
      setMessage(`${it.text} = ${it.value}, which is ${why}.`);
      callbacks.current.onBad();
      if (l.strikes >= spec.strikes) {
        l.over = true;
        callbacks.current.onEnd('failed');
      }
    }
  };

  // Stop the loop from doing anything once the parent has moved on.
  useEffect(() => {
    live.current.over = false;
    return () => {
      live.current.over = true;
    };
  }, []);

  const limited = spec.strikes < 50;
  return (
    <div className="space-y-3">
      <div className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p className="text-base font-bold">{RULE[spec.kind](spec.target)}</p>
        <p className="tabular text-sm" aria-live="polite">
          <strong>{hits}</strong> of {spec.goal} popped
          {limited && (
            <span className="ml-3 inline-flex items-center gap-1" aria-label={`${strikes} of ${spec.strikes} wrong pops used`}>
              {Array.from({ length: spec.strikes }, (_, i) => (
                <span key={i} aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: OKABE.vermillion, background: i < strikes ? OKABE.vermillion : 'transparent' }} />
              ))}
            </span>
          )}
        </p>
      </div>
      <div ref={arena} className="relative w-full overflow-hidden rounded-xl border border-border bg-surface" style={{ height: ARENA_HEIGHT }} role="group" aria-label="Equations drifting. Pop the ones that match the rule.">
        {items.map((b) => (
          <button
            key={b.id}
            ref={(el) => {
              if (el) {
                els.current.set(b.id, el);
                place(b.id);
              } else els.current.delete(b.id);
            }}
            type="button"
            aria-label={`Equation ${b.text}`}
            onClick={() => pop(b.id)}
            className="absolute left-0 top-0 flex items-center justify-center rounded-full border-2 font-bold shadow-sm"
            style={{ width: diam, height: diam, background: '#d6ecfa', borderColor: OKABE.blue, color: '#111111', fontSize: b.text.length > 6 ? 14 : 17, touchAction: 'manipulation' }}
          >
            {b.text}
          </button>
        ))}
      </div>
      <p className="min-h-6 text-center text-sm font-semibold" role="status" aria-live="polite">
        {message ? `✗ ${message}` : ''}
      </p>
    </div>
  );
}
