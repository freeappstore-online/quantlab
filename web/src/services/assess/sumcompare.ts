import { int, type Rng } from '../rng';
import { clamp } from './util';

export type SumAnswer = 'left' | 'equal' | 'right';

export interface SumItem {
  left: number[];
  right: number[];
  answer: SumAnswer;
}

const sum = (xs: readonly number[]): number => xs.reduce((s, v) => s + v, 0);

/** Splits `total` into `parts` positive tiles, none larger than `max`. */
function compose(rng: Rng, total: number, parts: number, max: number): number[] | null {
  if (total < parts || total > parts * max) return null;
  const tiles = Array.from({ length: parts }, () => 1);
  let left = total - parts;
  while (left > 0) {
    const i = int(rng, 0, parts - 1);
    if (tiles[i] < max) {
      tiles[i] += 1;
      left -= 1;
    }
  }
  return tiles;
}

export function compare(left: readonly number[], right: readonly number[]): SumAnswer {
  const a = sum(left);
  const b = sum(right);
  return a === b ? 'equal' : a > b ? 'left' : 'right';
}

/** Tile counts and value ranges grow with `t`; roughly a quarter of items are exact ties. */
export function generateSumItem(rng: Rng, t: number): SumItem {
  const maxTile = 9 + Math.floor(t * 90);
  const maxCount = 2 + Math.round(t * 3);
  for (let attempt = 0; attempt < 100; attempt++) {
    const lCount = int(rng, 2, maxCount);
    const rCount = int(rng, 2, maxCount);
    const left = Array.from({ length: lCount }, () => int(rng, 1, maxTile));
    const total = sum(left);
    const wanted: SumAnswer = rng() < 0.26 ? 'equal' : rng() < 0.5 ? 'left' : 'right';
    // The closer the margin, the harder the item.
    const margin = Math.max(1, Math.round(1 + (1 - t) * Math.max(1, total * 0.12)));
    const rightTotal = wanted === 'equal' ? total : wanted === 'left' ? total - margin : total + margin;
    const right = compose(rng, rightTotal, rCount, maxTile);
    if (!right) continue;
    const item: SumItem = { left, right, answer: compare(left, right) };
    if (item.answer === wanted) return item;
  }
  return { left: [4, 5], right: [3, 5], answer: 'left' };
}

export const SUM_TILE_LIMIT = (t: number): number => clamp(9 + Math.floor(t * 90), 9, 99);
