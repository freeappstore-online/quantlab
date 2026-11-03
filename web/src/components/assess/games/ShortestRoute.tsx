import { useEffect, useMemo, useRef, useState } from 'react';
import { ARROW, DELTA, generateMaze, tryMove, type Dir, type Maze, type Pos } from '../../../services/assess/route';
import type { GameResult } from '../../../services/assess/types';
import { clamp, mean, seededRng } from '../../../services/assess/util';
import type { FrameApi } from '../api';
import { OKABE } from '../palette';

const ROUNDS = 8;
const TUTORIAL_ROUNDS = 2;
const KEY_COLOURS = [OKABE.orange, OKABE.sky];
const KEY_LETTERS = ['A', 'B'];

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'U',
  ArrowDown: 'D',
  ArrowLeft: 'L',
  ArrowRight: 'R',
  w: 'U',
  s: 'D',
  a: 'L',
  d: 'R',
  W: 'U',
  S: 'D',
  A: 'L',
  D: 'R',
};

function useCell(n: number): number {
  const compute = (): number => clamp(Math.floor(Math.min(window.innerWidth - 40, 460) / n), 32, 56);
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = (): void => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [n]);
  return size;
}

function MazeView({ maze, pos, keys, cell, bump }: { maze: Maze; pos: Pos; keys: number; cell: number; bump: boolean }) {
  return (
    <div
      role="grid"
      aria-label={`Maze, ${maze.size} by ${maze.size}. You are in row ${pos[0] + 1}, column ${pos[1] + 1}.`}
      className={`grid rounded-lg border border-border ${bump ? 'animate-pulse' : ''}`}
      style={{ gridTemplateColumns: `repeat(${maze.size}, ${cell}px)`, gridAutoRows: `${cell}px` }}
    >
      {maze.tiles.flatMap((row, r) =>
        row.map((tile, c) => {
          const isPlayer = pos[0] === r && pos[1] === c;
          const isStart = maze.start[0] === r && maze.start[1] === c;
          const isGoal = maze.goal[0] === r && maze.goal[1] === c;
          let content: React.ReactNode = null;
          let bg = 'var(--surface)';
          let label = 'Floor';
          if (tile.kind === 'wall') {
            bg = '#444444';
            label = 'Wall';
          } else if (tile.kind === 'door') {
            const open = Boolean(keys & (1 << tile.id));
            content = open ? null : <span className="flex h-3/4 w-3/4 items-center justify-center rounded-sm border-2 border-black/50 text-xs font-bold text-black" style={{ background: KEY_COLOURS[tile.id] }}>{KEY_LETTERS[tile.id]}</span>;
            label = `Door ${KEY_LETTERS[tile.id]}${open ? ' (open)' : ''}`;
          } else if (tile.kind === 'key') {
            const have = Boolean(keys & (1 << tile.id));
            content = have ? null : <span className="flex h-2/3 w-2/3 items-center justify-center rounded-full border-2 border-black/50 text-xs font-bold text-black" style={{ background: KEY_COLOURS[tile.id] }}>{KEY_LETTERS[tile.id].toLowerCase()}</span>;
            label = `Key ${KEY_LETTERS[tile.id]}`;
          } else if (tile.kind === 'oneway') {
            content = <span className="text-xl font-bold" style={{ color: OKABE.vermillion }}>{ARROW[tile.dir]}</span>;
            label = `One-way ${ARROW[tile.dir]}`;
          }
          if (isGoal) {
            content = <span className="text-xl font-bold" style={{ color: OKABE.green }}>{'⚑'}</span>;
            label = 'Goal';
          } else if (isStart && !isPlayer) {
            content = <span className="text-xs font-bold text-muted">start</span>;
          }
          return (
            <div key={`${r}-${c}`} role="gridcell" aria-label={isPlayer ? `${label}, you are here` : label} className="relative flex items-center justify-center border border-border" style={{ background: bg }}>
              {content}
              {isPlayer && <span className="absolute h-3/5 w-3/5 rounded-full border-[3px] border-white shadow" style={{ background: OKABE.blue }} aria-hidden="true" />}
            </div>
          );
        }),
      )}
    </div>
  );
}

export function ShortestRoute({ api }: { api: FrameApi }) {
  const total = api.phase === 'tutorial' ? TUTORIAL_ROUNDS : ROUNDS;
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const level = api.level(round, total);
  const maze = useMemo(() => generateMaze(seededRng(api.seed, round), level), [api.seed, round, level]);
  const [pos, setPos] = useState<Pos>(maze.start);
  const [keys, setKeys] = useState(0);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [bump, setBump] = useState(false);
  const [score, setScore] = useState(0);
  const stats = useRef({ efficiencies: [] as number[], times: [] as number[], optimal: 0, started: false });
  const roundStart = useRef(performance.now());
  const finished = useRef(false);
  const cell = useCell(maze.size);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { setHud, finish, sound, setTimerRunning } = api;

  useEffect(() => {
    setHud({ round: `Maze ${round + 1} of ${total}`, widget: `Moves ${moves}` });
  }, [setHud, round, total, moves]);

  useEffect(() => {
    setPos(maze.start);
    setKeys(0);
    setMoves(0);
    setDone(false);
    roundStart.current = performance.now();
  }, [maze, attempt]);

  const end = (): void => {
    if (finished.current) return;
    finished.current = true;
    const s = stats.current;
    const solved = s.efficiencies.length;
    const total_ = s.efficiencies.reduce((a, b) => a + b, 0);
    const result: GameResult = {
      score: Math.round(total_ * 100) / 100,
      scoreText: total_.toFixed(1),
      correct: solved,
      attempted: solved + (s.started && !done ? 1 : 0),
      avgItemMs: mean(s.times),
      detail: [`${solved} of ${total} mazes solved`, `${s.efficiencies.filter((e) => e >= 0.999).length} by the shortest route`],
    };
    sound('done');
    finish(result);
  };

  useEffect(() => {
    if (api.expired) end();
  }, [api.expired]);

  const step = (dir: Dir): void => {
    if (done || finished.current) return;
    const m = tryMove(maze, pos, dir, keys);
    if (!m) {
      setBump(true);
      window.setTimeout(() => setBump(false), 180);
      sound('bad');
      return;
    }
    stats.current.started = true;
    const count = moves + 1;
    setPos(m.pos);
    setKeys(m.keys);
    setMoves(count);
    if (m.pos[0] === maze.goal[0] && m.pos[1] === maze.goal[1]) {
      const eff = Math.min(1, maze.optimal / count);
      stats.current.efficiencies.push(eff);
      stats.current.times.push(performance.now() - roundStart.current);
      stats.current.started = false;
      setScore(stats.current.efficiencies.reduce((a, b) => a + b, 0));
      setDone(true);
      setTimerRunning(false);
      sound('good');
    }
  };

  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const dir = KEY_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      stepRef.current(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const next = (): void => {
    setTimerRunning(true);
    if (round + 1 >= total) end();
    else setRound((r) => r + 1);
  };

  const restart = (): void => {
    setAttempt((a) => a + 1);
    setPos(maze.start);
    setKeys(0);
    setMoves(0);
  };

  // Swipe to move, or tap a cell next to you.
  const onPointerDown = (e: React.PointerEvent): void => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent): void => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || done) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
      step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U');
      return;
    }
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const r = Math.floor((e.clientY - rect.top) / cell);
    const c = Math.floor((e.clientX - rect.left) / cell);
    for (const d of Object.keys(DELTA) as Dir[]) {
      if (pos[0] + DELTA[d][0] === r && pos[1] + DELTA[d][1] === c) step(d);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Reach the flag in as few moves as you can. Arrow keys, swipe, tap a neighbouring cell or use the buttons. Letters {'a'} and {'b'} are keys; capitals {'A'} and {'B'} are the doors they open. Arrows are one-way tiles: enter them going that way.
      </p>
      <div className="flex justify-center">
        <div ref={gridRef} className="touch-none select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          <MazeView maze={maze} pos={pos} keys={keys} cell={cell} bump={bump} />
        </div>
      </div>

      {done ? (
        <div className="card space-y-2 p-4 text-center" role="status" aria-live="polite">
          <p className="text-lg font-bold">
            Your moves: {moves} / Optimal: {maze.optimal}
          </p>
          <p className="text-sm text-muted">{moves === maze.optimal ? '✓ The shortest possible route.' : `${moves - maze.optimal} more than the shortest route.`}</p>
          <button type="button" className="btn btn-primary" onClick={next} autoFocus>
            {round + 1 >= total ? 'Finish' : 'Next maze'}
          </button>
        </div>
      ) : (
        <>
          <div className="mx-auto grid w-44 grid-cols-3 gap-1" role="group" aria-label="Move buttons">
            <span />
            <button type="button" className="btn min-h-12 px-0 text-xl" aria-label="Move up" onClick={() => step('U')}>
              {ARROW.U}
            </button>
            <span />
            <button type="button" className="btn min-h-12 px-0 text-xl" aria-label="Move left" onClick={() => step('L')}>
              {ARROW.L}
            </button>
            <button type="button" className="btn min-h-12 px-0 text-xl" aria-label="Move down" onClick={() => step('D')}>
              {ARROW.D}
            </button>
            <button type="button" className="btn min-h-12 px-0 text-xl" aria-label="Move right" onClick={() => step('R')}>
              {ARROW.R}
            </button>
          </div>
          <div className="text-center">
            <button type="button" className="btn min-h-10" onClick={restart}>
              Restart maze
            </button>
          </div>
        </>
      )}
      <p className="text-center text-xs text-muted" aria-live="polite">
        Score so far: {score.toFixed(1)}
      </p>
    </div>
  );
}
