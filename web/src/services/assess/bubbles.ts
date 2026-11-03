import { chance, int, pick, type Rng } from '../rng';
import { clamp, shuffle } from './util';

/** Exact rational number so ties and near-ties are never decided by floating point. */
export interface Frac {
  n: number;
  d: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export function frac(n: number, d = 1): Frac {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

export const fAdd = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const fSub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const fMul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const fDiv = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);
export const fCmp = (a: Frac, b: Frac): number => a.n * b.d - b.n * a.d;
export const fEq = (a: Frac, b: Frac): boolean => a.n === b.n && a.d === b.d;
export const fNum = (a: Frac): number => a.n / a.d;

export interface Bubble {
  id: number;
  text: string;
  value: Frac;
}

export interface BubbleRound {
  bubbles: Bubble[];
  /** Bubble ids from the smallest value to the largest. */
  order: number[];
}

const MUL = '×';
const DIV = '÷';
const MINUS = '−';
const SQ = '²';

/** One arithmetic expression whose difficulty rises with `t` (0..1). */
function expression(rng: Rng, t: number): { text: string; value: Frac } {
  const roll = rng();
  if (t < 0.25) {
    if (roll < 0.4) {
      const a = int(rng, 12, 60);
      const b = int(rng, 5, 35);
      return { text: `${a}+${b}`, value: frac(a + b) };
    }
    if (roll < 0.7) {
      const a = int(rng, 30, 90);
      const b = int(rng, 4, 29);
      return { text: `${a}${MINUS}${b}`, value: frac(a - b) };
    }
    const a = int(rng, 3, 9);
    const b = int(rng, 3, 9);
    return { text: `${a}${MUL}${b}`, value: frac(a * b) };
  }
  if (t < 0.5) {
    if (roll < 0.3) {
      const a = int(rng, 4, 12);
      const b = int(rng, 6, 15);
      return { text: `${a}${MUL}${b}`, value: frac(a * b) };
    }
    if (roll < 0.55) {
      const b = int(rng, 3, 12);
      const q = int(rng, 4, 14);
      return { text: `${b * q}${DIV}${b}`, value: frac(q) };
    }
    if (roll < 0.75) {
      const a = int(rng, 4, 14);
      return { text: `${a}${SQ}`, value: frac(a * a) };
    }
    const a = int(rng, 3, 9);
    const b = int(rng, 3, 9);
    const c = int(rng, 4, 25);
    return chance(rng, 0.5) ? { text: `${a}${MUL}${b}+${c}`, value: frac(a * b + c) } : { text: `${a}${MUL}${b}${MINUS}${Math.min(c, a * b - 1)}`, value: frac(a * b - Math.min(c, a * b - 1)) };
  }
  if (t < 0.75) {
    if (roll < 0.3) {
      const a = int(rng, 2, 9);
      const b = int(rng, 2, 9) * 5;
      return { text: `0.${a}${MUL}${b}`, value: frac(a * b, 10) };
    }
    if (roll < 0.55) {
      const a = int(rng, 3, 9);
      const c = int(rng, 2, 12);
      return { text: `${a}${SQ}+${c}`, value: frac(a * a + c) };
    }
    if (roll < 0.8) {
      const a = int(rng, 11, 99) / 10;
      const b = int(rng, 11, 99) / 10;
      const an = Math.round(a * 10);
      const bn = Math.round(b * 10);
      return { text: `${a.toFixed(1)}+${b.toFixed(1)}`, value: frac(an + bn, 10) };
    }
    const b = int(rng, 4, 9);
    const q = int(rng, 5, 12) * 2;
    return { text: `${(b * q) / 2}${DIV}${b}`, value: frac(b * q, 2 * b) };
  }
  if (roll < 0.35) {
    const d = pick(rng, [3, 4, 5, 6, 8]);
    const n = int(rng, 1, d - 1);
    return { text: `${n}/${d}`, value: frac(n, d) };
  }
  if (roll < 0.6) {
    const d = pick(rng, [4, 6, 8, 10]);
    const n1 = int(rng, 1, d - 1);
    const n2 = int(rng, 1, d - 1);
    return { text: `${n1}/${d}+${n2}/${d}`, value: frac(n1 + n2, d) };
  }
  if (roll < 0.8) {
    const a = pick(rng, [0.25, 0.5, 0.75, 1.5, 2.5]);
    const b = int(rng, 4, 20);
    return { text: `${a}${MUL}${b}`, value: frac(Math.round(a * 100) * b, 100) };
  }
  const a = int(rng, 2, 6);
  const b = int(rng, 2, 5);
  const c = int(rng, 2, 9);
  return { text: `${a}${SQ}${MUL}${b}${MINUS}${c}`, value: frac(a * a * b - c) };
}

/** Bubble count grows from 3 to 6 with difficulty. */
export function bubbleCount(t: number): number {
  return clamp(3 + Math.floor(t * 3.99), 3, 6);
}

export function generateBubbleRound(rng: Rng, t: number): BubbleRound {
  const count = bubbleCount(t);
  for (let attempt = 0; attempt < 200; attempt++) {
    const items: { text: string; value: Frac }[] = [];
    for (let i = 0; i < count; i++) items.push(expression(rng, clamp(t + (rng() - 0.5) * 0.2, 0, 1)));
    const distinct = items.every((a, i) => items.every((b, j) => i === j || !fEq(a.value, b.value)));
    const texts = new Set(items.map((i) => i.text));
    if (!distinct || texts.size !== items.length) continue;
    const bubbles = shuffle(rng, items).map((it, id): Bubble => ({ id, text: it.text, value: it.value }));
    const order = bubbles
      .slice()
      .sort((a, b) => fCmp(a.value, b.value))
      .map((b) => b.id);
    return { bubbles, order };
  }
  const bubbles = [5, 12, 20].map((v, id): Bubble => ({ id, text: `${v}+0`, value: frac(v) }));
  return { bubbles, order: [0, 1, 2] };
}

/* ------------------------------------------------------------------ Stream rounds */

/** Ordering rounds use a fixed set of bubbles; stream rounds keep sending equations until the goal is met. */
export type BubbleKind = 'asc' | 'desc' | 'equals' | 'below' | 'above';

export const isStreamKind = (k: BubbleKind): boolean => k === 'equals' || k === 'below' || k === 'above';

export const BUBBLE_KINDS: BubbleKind[] = ['asc', 'equals', 'desc', 'below', 'asc', 'equals', 'above', 'desc', 'equals', 'below', 'above', 'equals'];

export function bubbleKindFor(round: number, tutorial: boolean): BubbleKind {
  if (tutorial) return round === 0 ? 'asc' : 'equals';
  return BUBBLE_KINDS[round % BUBBLE_KINDS.length];
}

export interface StreamSpec {
  kind: 'equals' | 'below' | 'above';
  target: number;
  /** Matching bubbles to pop to clear the round. */
  goal: number;
  /** Wrong pops allowed before the round ends. */
  strikes: number;
}

export interface StreamBubble {
  text: string;
  value: number;
  match: boolean;
}

export type Op = '+' | typeof MINUS | typeof MUL | typeof DIV;
const OPS: Op[] = ['+', MINUS, MUL, DIV];

/** Evaluates the simple "a op b" strings made by `equationFor`. */
export function evaluate(text: string): number {
  const m = /^(\d+)([+−×÷])(\d+)$/.exec(text);
  if (!m) return NaN;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return m[2] === '+' ? a + b : m[2] === MINUS ? a - b : m[2] === MUL ? a * b : a / b;
}

const divisors = (n: number): number[] => {
  const out: number[] = [];
  for (let d = 2; d < n; d++) if (n % d === 0) out.push(d);
  return out;
};

/** One equation with the given whole-number value using the given operation, or null if that is not possible. */
export function equationFor(rng: Rng, value: number, op: Op, t: number): string | null {
  switch (op) {
    case '+': {
      if (value < 3) return null;
      const a = int(rng, 1, value - 1);
      return `${a}+${value - a}`;
    }
    case MINUS: {
      const b = int(rng, 2, Math.round(9 + t * 40));
      return `${value + b}${MINUS}${b}`;
    }
    case MUL: {
      const ds = divisors(value);
      if (ds.length === 0) return null;
      const a = pick(rng, ds);
      return `${a}${MUL}${value / a}`;
    }
    default: {
      const b = int(rng, 2, Math.round(6 + t * 6));
      return `${value * b}${DIV}${b}`;
    }
  }
}

/** An equation worth `value`, trying the operations in random order. */
export function anyEquation(rng: Rng, value: number, t: number): string {
  for (const op of shuffle(rng, OPS)) {
    const e = equationFor(rng, value, op, t);
    if (e) return e;
  }
  return `${value}+0`;
}

export function generateStreamSpec(rng: Rng, kind: StreamSpec['kind'], t: number, tutorial: boolean): StreamSpec {
  // Composite targets so multiplication and division equations exist for them.
  const top = Math.round(36 + t * 108);
  let target = int(rng, 14, top);
  while (divisors(target).length === 0) target++;
  return { kind, target, goal: tutorial ? 4 : 5 + Math.round(t * 4), strikes: tutorial ? 99 : 3 };
}

export const matches = (spec: Pick<StreamSpec, 'kind' | 'target'>, value: number): boolean =>
  spec.kind === 'equals' ? value === spec.target : spec.kind === 'below' ? value < spec.target : value > spec.target;

/** The next bubble of a stream. Distractors sit close to the target so each one needs working out. */
export function makeStreamBubble(rng: Rng, spec: StreamSpec, t: number, wantMatch: boolean): StreamBubble {
  const reach = Math.max(3, Math.round(4 + t * 10));
  for (let tries = 0; tries < 50; tries++) {
    const gap = int(rng, 1, reach);
    let value: number;
    if (spec.kind === 'equals') value = wantMatch ? spec.target : spec.target + (chance(rng, 0.5) ? gap : -gap);
    else if (spec.kind === 'below') value = wantMatch ? spec.target - gap : spec.target + int(rng, 0, reach);
    else value = wantMatch ? spec.target + gap : spec.target - int(rng, 0, reach);
    if (value < 1) continue;
    if (matches(spec, value) !== wantMatch) continue;
    return { text: anyEquation(rng, value, t), value, match: wantMatch };
  }
  return { text: `${spec.target}+0`, value: spec.target, match: spec.kind === 'equals' };
}

export interface StreamPace {
  /** Time between waves of new bubbles. */
  intervalMs: number;
  /** Bubbles per wave. */
  wave: number;
  /** Drift speed multiplier. */
  speed: number;
  /** How long a bubble stays before it fades away. */
  lifeMs: number;
  /** Most bubbles on screen at once. */
  cap: number;
}

/** Equations arrive faster, in bigger waves and move quicker the longer a round (and the whole test) goes on. */
export function streamPace(t: number, elapsedMs: number): StreamPace {
  const e = elapsedMs / 1000;
  return {
    intervalMs: Math.max(520, (1700 - t * 500) / (1 + e / 16)),
    wave: Math.min(4, 1 + Math.floor(e / 12) + (t > 0.5 ? 1 : 0)),
    speed: Math.min(2.4, (1 + t * 0.5) * (1 + e / 40)),
    lifeMs: Math.max(4200, 9500 - t * 2500 - e * 70),
    cap: Math.min(14, 6 + Math.floor(e / 8) + Math.round(t * 3)),
  };
}
