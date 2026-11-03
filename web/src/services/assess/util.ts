import { mulberry32, type Rng } from '../rng';
import type { LevelOverride } from './types';

/**
 * Difficulty 0..1 for the item at `index` of `total`. A level override squeezes the ramp into
 * the easy, medium or hard band while still rising across the test.
 */
export function levelFor(index: number, total: number, override: LevelOverride): number {
  const t = total <= 1 ? 0 : Math.min(1, Math.max(0, index / (total - 1)));
  switch (override) {
    case 'easy':
      return t * 0.35;
    case 'medium':
      return 0.35 + t * 0.3;
    case 'hard':
      return 0.65 + t * 0.35;
    default:
      return t;
  }
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Mean of a list, or null when it is empty. */
export function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

/** A reproducible generator for item `salt` of a run, so every round of a run is independent of the others. */
export function seededRng(seed: number, salt: number): Rng {
  return mulberry32((seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);
}

export const newSeed = (): number => Math.floor(Math.random() * 0x7fffffff);

/** A `?seed=123` in the address makes every puzzle in a run reproducible, so a set of puzzles can be shared or retried. */
export function seedFromUrl(): number | null {
  const raw = new URLSearchParams(window.location.search).get('seed');
  const n = raw === null ? Number.NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export const pickSeed = (): number => seedFromUrl() ?? newSeed();
