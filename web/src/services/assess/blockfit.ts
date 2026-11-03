import { chance, int, type Rng } from '../rng';
import { clamp, shuffle } from './util';

export type Cell = readonly [number, number];

export interface Piece {
  id: number;
  /** Cells normalised to a top-left origin and sorted row by row. */
  cells: Cell[];
}

/** Classic rectangles, fixed silhouettes, or a tray with one spare piece that does not belong. */
export type BlockVariant = 'classic' | 'silhouette' | 'spare';

export const BLOCK_VARIANT_LABEL: Record<BlockVariant, string> = {
  classic: 'Classic grid',
  silhouette: 'Silhouette',
  spare: 'Spare piece',
};

export interface BlockPuzzle {
  variant: BlockVariant;
  rows: number;
  cols: number;
  /** true where the grid must be filled. */
  region: boolean[][];
  /** Pieces as they appear in the tray: already rotated and shuffled. */
  pieces: Piece[];
}

export function normalise(cells: readonly Cell[]): Cell[] {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]): Cell => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** A quarter turn clockwise on screen (rows grow downwards). */
export function rotate90(cells: readonly Cell[]): Cell[] {
  return normalise(cells.map(([r, c]): Cell => [c, -r]));
}

export function rotated(cells: readonly Cell[], quarterTurns: number): Cell[] {
  let out = normalise(cells);
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++) out = rotate90(out);
  return out;
}

const key = (cells: readonly Cell[]): string => cells.map((c) => `${c[0]},${c[1]}`).join(';');

/** The distinct orientations of a piece. */
export function rotations(cells: readonly Cell[]): Cell[][] {
  const seen = new Set<string>();
  const out: Cell[][] = [];
  let cur = normalise(cells);
  for (let i = 0; i < 4; i++) {
    const k = key(cur);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cur);
    }
    cur = rotate90(cur);
  }
  return out;
}

const DIRS: readonly Cell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function regionConnected(region: boolean[][]): boolean {
  const rows = region.length;
  const cols = region[0].length;
  let start: Cell | null = null;
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (region[r][c]) {
        total++;
        start ??= [r, c];
      }
    }
  }
  if (!start) return false;
  const seen = new Set<string>([`${start[0]},${start[1]}`]);
  const stack: Cell[] = [start];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || !region[nr][nc]) continue;
      const k = `${nr},${nc}`;
      if (!seen.has(k)) {
        seen.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return seen.size === total;
}

export function regionCells(region: boolean[][]): Cell[] {
  const out: Cell[] = [];
  region.forEach((row, r) => row.forEach((v, c) => v && out.push([r, c])));
  return out;
}

/**
 * Exact-cover search: can these pieces, turned freely, fill the region exactly?
 * Every generated puzzle is run through this before it is shown.
 */
export function solveBlockFit(region: boolean[][], pieces: readonly Piece[], allowSpare = false): boolean {
  const rows = region.length;
  const cols = region[0].length;
  const blocked = region.map((row) => row.map((v) => !v));
  const orient = pieces.map((p) => rotations(p.cells));
  const used = pieces.map(() => false);

  const firstEmpty = (): Cell | null => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!blocked[r][c]) return [r, c];
    return null;
  };

  const recurse = (): boolean => {
    const empty = firstEmpty();
    if (!empty) return allowSpare || used.every(Boolean);
    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue;
      for (const cells of orient[i]) {
        const [ar, ac] = cells[0];
        const dr = empty[0] - ar;
        const dc = empty[1] - ac;
        let fits = true;
        for (const [r, c] of cells) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || blocked[nr][nc]) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        for (const [r, c] of cells) blocked[r + dr][c + dc] = true;
        used[i] = true;
        if (recurse()) return true;
        used[i] = false;
        for (const [r, c] of cells) blocked[r + dr][c + dc] = false;
      }
    }
    return false;
  };
  return recurse();
}

/** Splits a connected region into `k` connected pieces by growing random seeds. */
function partition(rng: Rng, region: boolean[][], k: number, minSize: number): Cell[][] | null {
  const cells = regionCells(region);
  const owner = new Map<string, number>();
  const seeds = shuffle(rng, cells).slice(0, k);
  seeds.forEach((s, i) => owner.set(`${s[0]},${s[1]}`, i));
  while (owner.size < cells.length) {
    const options: { cell: Cell; who: number }[] = [];
    for (const [r, c] of cells) {
      if (owner.has(`${r},${c}`)) continue;
      for (const [dr, dc] of DIRS) {
        const who = owner.get(`${r + dr},${c + dc}`);
        if (who !== undefined) options.push({ cell: [r, c], who });
      }
    }
    if (options.length === 0) return null;
    const o = options[Math.floor(rng() * options.length)];
    owner.set(`${o.cell[0]},${o.cell[1]}`, o.who);
  }
  const groups: Cell[][] = Array.from({ length: k }, () => []);
  for (const [r, c] of cells) groups[owner.get(`${r},${c}`)!].push([r, c]);
  return groups.every((g) => g.length >= minSize) ? groups : null;
}

function makeRegion(rng: Rng, t: number): boolean[][] {
  const base = 3 + Math.round(t * 3);
  const rows = t > 0.6 && chance(rng, 0.4) ? Math.max(3, base - 1) : base;
  const cols = base;
  const region = Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
  if (t > 0.35) {
    const holes = int(rng, 1, 1 + Math.floor(t * 4));
    for (let i = 0; i < holes; i++) {
      const r = int(rng, 0, rows - 1);
      const c = int(rng, 0, cols - 1);
      if (!region[r][c]) continue;
      region[r][c] = false;
      const remaining = regionCells(region).length;
      if (remaining < 8 || !regionConnected(region)) region[r][c] = true;
    }
  }
  return region;
}

/** Fixed silhouettes. '#' is a cell to fill. They are also flipped and turned at random. */
const SILHOUETTES: string[][] = [
  ['..#..', '..#..', '#####', '..#..', '..#..'],
  ['####', '#..#', '#..#', '####'],
  ['#....', '#....', '#....', '#....', '#####'],
  ['#....', '##...', '###..', '####.', '#####'],
  ['#...#', '#...#', '#####', '#...#', '#...#'],
  ['..#..', '.###.', '#####', '.###.', '..#..'],
  ['#####', '#...#', '#...#', '#...#', '#####'],
  ['#####', '.###.', '..#..'],
  ['##..##', '######', '######', '##..##'],
  ['.####.', '######', '######', '.####.'],
  ['###...', '###...', '######', '...###', '...###'],
  ['#.#.#', '#####', '.###.', '#####'],
];

function silhouetteRegion(rng: Rng): boolean[][] {
  const rows = SILHOUETTES[Math.floor(rng() * SILHOUETTES.length)].map((line) => [...line].map((ch) => ch === '#'));
  let out = rows;
  if (chance(rng, 0.5)) out = out[0].map((_, c) => out.map((row) => row[c]));
  if (chance(rng, 0.5)) out = out.map((row) => row.slice().reverse());
  if (chance(rng, 0.5)) out = out.slice().reverse();
  return out;
}

/** A random connected piece of `size` cells, used as the spare. */
function randomPiece(rng: Rng, size: number): Cell[] {
  const cells: Cell[] = [[0, 0]];
  while (cells.length < size) {
    const [r, c] = cells[Math.floor(rng() * cells.length)];
    const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
    if (!cells.some((x) => x[0] === r + dr && x[1] === c + dc)) cells.push([r + dr, c + dc]);
  }
  return normalise(cells);
}

/** A solvable Block Fit round. `t` is the difficulty from 0 to 1. */
export function generateBlockPuzzle(rng: Rng, t: number, variant: BlockVariant = 'classic'): BlockPuzzle {
  for (let attempt = 0; attempt < 160; attempt++) {
    const region = variant === 'silhouette' ? silhouetteRegion(rng) : makeRegion(rng, t);
    const n = regionCells(region).length;
    const kMax = Math.min(variant === 'spare' ? 7 : 8, Math.floor(n / 2));
    const k = clamp(Math.round(2 + t * 5 + (rng() - 0.5) * 2) + (variant === 'silhouette' ? 1 : 0), 2, kMax);
    const groups = partition(rng, region, k, attempt < 100 ? 2 : 1);
    if (!groups) continue;
    const shapes: Cell[][] = groups.map((cells) => rotated(cells, int(rng, 0, 3)));
    if (variant === 'spare') shapes.push(randomPiece(rng, int(rng, 3, 4)));
    const pieces = shuffle(rng, shapes).map((cells, i): Piece => ({ id: i, cells }));
    if (solveBlockFit(region, pieces, variant === 'spare')) {
      return { variant, rows: region.length, cols: region[0].length, region, pieces };
    }
  }
  // Practically unreachable: fall back to three straight pieces that tile a 3x3 grid by rows.
  const region = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => true));
  const bar: Cell[] = [[0, 0], [0, 1], [0, 2]];
  return { variant: 'classic', rows: 3, cols: 3, region, pieces: [0, 1, 2].map((id): Piece => ({ id, cells: normalise(bar) })) };
}

/** Round type for each round: mostly classic early, then silhouettes and spare pieces. */
export function blockVariantFor(round: number, tutorial: boolean): BlockVariant {
  if (tutorial) return round === 0 ? 'classic' : 'spare';
  const cycle: BlockVariant[] = ['classic', 'silhouette', 'classic', 'spare', 'silhouette', 'spare'];
  return round < 2 ? 'classic' : cycle[(round - 2) % cycle.length] ?? 'classic';
}
