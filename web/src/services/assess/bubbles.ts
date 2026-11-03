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
