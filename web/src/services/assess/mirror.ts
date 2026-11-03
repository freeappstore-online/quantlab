import { chance, int, type Rng } from '../rng';
import { clamp } from './util';

/** 0 is an empty cell; 1..colours are the colours. */
export type Grid = number[][];

export interface Transform {
  /** Flip left to right first. */
  mirror: boolean;
  /** Then turn clockwise by this many degrees. */
  rot: 0 | 90 | 180 | 270;
}

export interface MirrorPuzzle {
  size: number;
  colours: number;
  source: Grid;
  transform: Transform;
  target: Grid;
}

export const blankGrid = (size: number): Grid => Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

export function rotateCw(grid: Grid): Grid {
  const n = grid.length;
  const out = blankGrid(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][n - 1 - r] = grid[r][c];
  return out;
}

export function mirrorLr(grid: Grid): Grid {
  return grid.map((row) => row.slice().reverse());
}

export function applyTransform(grid: Grid, tr: Transform): Grid {
  let out = tr.mirror ? mirrorLr(grid) : grid.map((row) => row.slice());
  for (let i = 0; i < tr.rot / 90; i++) out = rotateCw(out);
  return out;
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  return a.length === b.length && a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

export function describeTransform(tr: Transform): string {
  const turn = tr.rot === 0 ? '' : `rotate ${tr.rot}° clockwise`;
  if (tr.mirror) return tr.rot === 0 ? 'Mirror left to right' : `Mirror left to right, then ${turn}`;
  return `Rotate ${tr.rot}° clockwise`;
}

export function generateMirror(rng: Rng, t: number): MirrorPuzzle {
  const size = clamp(3 + Math.floor(t * 2.99), 3, 5);
  const colours = t > 0.4 ? 3 : 2;
  for (let attempt = 0; attempt < 200; attempt++) {
    const transform: Transform =
      t > 0.5 && chance(rng, 0.45 + t * 0.2)
        ? { mirror: true, rot: ([0, 90, 180, 270] as const)[int(rng, 0, 3)] }
        : { mirror: false, rot: ([90, 180, 270] as const)[int(rng, 0, 2)] };
    const density = 0.35 + rng() * 0.25;
    const source = blankGrid(size);
    let filled = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (rng() < density) {
          source[r][c] = int(rng, 1, colours);
          filled++;
        }
      }
    }
    if (filled < 3) continue;
    const target = applyTransform(source, transform);
    // A puzzle where the answer equals the question teaches nothing, so reject it.
    if (gridsEqual(source, target)) continue;
    return { size, colours, source, transform, target };
  }
  const source: Grid = [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
  const transform: Transform = { mirror: false, rot: 90 };
  return { size: 3, colours: 2, source, transform, target: applyTransform(source, transform) };
}
