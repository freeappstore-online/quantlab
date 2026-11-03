import { int, pick, type Rng } from '../rng';
import { clamp } from './util';

export type Dir = 'U' | 'R' | 'D' | 'L';
export type Pos = readonly [number, number];

export type Tile =
  | { kind: 'floor' }
  | { kind: 'wall' }
  | { kind: 'key'; id: number }
  | { kind: 'door'; id: number }
  | { kind: 'oneway'; dir: Dir };

export interface Maze {
  size: number;
  tiles: Tile[][];
  start: Pos;
  goal: Pos;
  /** Fewest moves from start to goal, picking up keys on the way. */
  optimal: number;
  doors: number;
}

export const DELTA: Record<Dir, Pos> = { U: [-1, 0], R: [0, 1], D: [1, 0], L: [0, -1] };
export const DIR_LIST: readonly Dir[] = ['U', 'R', 'D', 'L'];
export const ARROW: Record<Dir, string> = { U: '↑', R: '→', D: '↓', L: '←' };

export interface MoveResult {
  pos: Pos;
  keys: number;
}

/** The single source of truth for movement rules, used by the game and by the solver. */
export function tryMove(maze: Maze, pos: Pos, dir: Dir, keys: number): MoveResult | null {
  const [dr, dc] = DELTA[dir];
  const nr = pos[0] + dr;
  const nc = pos[1] + dc;
  if (nr < 0 || nc < 0 || nr >= maze.size || nc >= maze.size) return null;
  const tile = maze.tiles[nr][nc];
  switch (tile.kind) {
    case 'wall':
      return null;
    case 'door':
      return keys & (1 << tile.id) ? { pos: [nr, nc], keys } : null;
    case 'key':
      return { pos: [nr, nc], keys: keys | (1 << tile.id) };
    case 'oneway':
      return tile.dir === dir ? { pos: [nr, nc], keys } : null;
    default:
      return { pos: [nr, nc], keys };
  }
}

/** Breadth-first search over (position, keys held). Returns the fewest moves or null if unsolvable. */
export function solveMaze(maze: Maze, ignoreDoors = false): number | null {
  const size = maze.size;
  const idx = (r: number, c: number, k: number): number => (k * size + r) * size + c;
  const seen = new Uint8Array(size * size * 8);
  const queue: { pos: Pos; keys: number; d: number }[] = [{ pos: maze.start, keys: 0, d: 0 }];
  seen[idx(maze.start[0], maze.start[1], 0)] = 1;
  const view: Maze = ignoreDoors
    ? { ...maze, tiles: maze.tiles.map((row) => row.map((t): Tile => (t.kind === 'door' ? { kind: 'floor' } : t))) }
    : maze;
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (cur.pos[0] === maze.goal[0] && cur.pos[1] === maze.goal[1]) return cur.d;
    for (const dir of DIR_LIST) {
      const m = tryMove(view, cur.pos, dir, cur.keys);
      if (!m) continue;
      const i = idx(m.pos[0], m.pos[1], m.keys);
      if (seen[i]) continue;
      seen[i] = 1;
      queue.push({ pos: m.pos, keys: m.keys, d: cur.d + 1 });
    }
  }
  return null;
}

/** Cells on one shortest path ignoring doors and keys, from start to goal (inclusive). */
function plainPath(maze: Maze): Pos[] | null {
  const size = maze.size;
  const prev = new Map<string, Pos | null>();
  const key = (p: Pos): string => `${p[0]},${p[1]}`;
  prev.set(key(maze.start), null);
  const queue: Pos[] = [maze.start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (cur[0] === maze.goal[0] && cur[1] === maze.goal[1]) break;
    for (const dir of DIR_LIST) {
      const [dr, dc] = DELTA[dir];
      const nr = cur[0] + dr;
      const nc = cur[1] + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size || maze.tiles[nr][nc].kind === 'wall') continue;
      const k = key([nr, nc]);
      if (prev.has(k)) continue;
      prev.set(k, cur);
      queue.push([nr, nc]);
    }
  }
  if (!prev.has(key(maze.goal))) return null;
  const path: Pos[] = [];
  let cur: Pos | null = maze.goal;
  while (cur) {
    path.push(cur);
    cur = prev.get(key(cur)) ?? null;
  }
  return path.reverse();
}

const same = (a: Pos, b: Pos): boolean => a[0] === b[0] && a[1] === b[1];

function emptyMaze(size: number): Maze {
  return {
    size,
    tiles: Array.from({ length: size }, () => Array.from({ length: size }, (): Tile => ({ kind: 'floor' }))),
    start: [0, 0],
    goal: [size - 1, size - 1],
    optimal: 0,
    doors: 0,
  };
}

/** A solvable maze. `t` (0..1) adds size, then keys and doors, then one-way tiles. */
export function generateMaze(rng: Rng, t: number): Maze {
  const size = clamp(5 + Math.round(t * 4), 5, 9);
  const keyPairs = t >= 0.7 ? 2 : t >= 0.35 ? 1 : 0;
  for (let attempt = 0; attempt < 500; attempt++) {
    const maze = emptyMaze(size);
    const density = 0.14 + 0.14 * t;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (rng() < density) maze.tiles[r][c] = { kind: 'wall' };
    maze.start = [int(rng, 0, size - 1), int(rng, 0, size - 1)];
    maze.goal = [int(rng, 0, size - 1), int(rng, 0, size - 1)];
    if (Math.abs(maze.start[0] - maze.goal[0]) + Math.abs(maze.start[1] - maze.goal[1]) < size - 1) continue;
    maze.tiles[maze.start[0]][maze.start[1]] = { kind: 'floor' };
    maze.tiles[maze.goal[0]][maze.goal[1]] = { kind: 'floor' };

    const path = plainPath(maze);
    if (!path || path.length < size) continue;

    const isFree = (p: Pos): boolean => maze.tiles[p[0]][p[1]].kind === 'floor' && !same(p, maze.start) && !same(p, maze.goal);

    // Doors sit on the plain shortest path so that they genuinely matter; keys are placed off it.
    const innerPath = path.slice(1, -1).filter(isFree);
    let ok = true;
    for (let id = 0; id < keyPairs && ok; id++) {
      if (innerPath.length === 0) {
        ok = false;
        break;
      }
      const door = pick(rng, innerPath);
      maze.tiles[door[0]][door[1]] = { kind: 'door', id };
      const spots: Pos[] = [];
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (isFree([r, c]) && !path.some((p) => same(p, [r, c]))) spots.push([r, c]);
      if (spots.length === 0) {
        ok = false;
        break;
      }
      const spot = pick(rng, spots);
      maze.tiles[spot[0]][spot[1]] = { kind: 'key', id };
      maze.doors += 1;
    }
    if (!ok) continue;

    if (t >= 0.5) {
      const count = 2 + Math.floor(t * 3);
      for (let i = 0; i < count; i++) {
        const r = int(rng, 0, size - 1);
        const c = int(rng, 0, size - 1);
        if (isFree([r, c])) maze.tiles[r][c] = { kind: 'oneway', dir: pick(rng, DIR_LIST) };
      }
    }

    const optimal = solveMaze(maze);
    if (optimal === null || optimal < size - 1) continue;
    if (maze.doors > 0) {
      const ignoring = solveMaze(maze, true);
      if (ignoring === null || optimal < ignoring + 2) continue;
    }
    maze.optimal = optimal;
    return maze;
  }
  const maze = emptyMaze(size);
  maze.start = [0, 0];
  maze.goal = [size - 1, size - 1];
  maze.optimal = solveMaze(maze) ?? 2 * (size - 1);
  return maze;
}
