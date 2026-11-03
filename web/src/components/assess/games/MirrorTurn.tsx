import { useEffect, useMemo, useRef, useState } from 'react';
import { blankGrid, describeTransform, generateMirror, gridsEqual, type Grid } from '../../../services/assess/mirror';
import type { GameResult } from '../../../services/assess/types';
import { clamp, mean, seededRng } from '../../../services/assess/util';
import type { FrameApi } from '../api';
import { OKABE, PATTERN_COLOURS, PATTERN_GLYPHS, PATTERN_NAMES, textOn } from '../palette';

const ROUNDS = 12;
const TUTORIAL_ROUNDS = 2;

function useCell(n: number): number {
  const compute = (): number => clamp(Math.floor(Math.min(window.innerWidth - 40, 560) / (2 * n + 1.5)), 30, 58);
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = (): void => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [n]);
  return size;
}

function PatternGrid({ grid, cell, label, onCell, refs }: { grid: Grid; cell: number; label: string; onCell?: (r: number, c: number) => void; refs?: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
  const n = grid.length;
  return (
    <div role="grid" aria-label={label} className="grid rounded-lg border border-border bg-surface" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
      {grid.flatMap((row, r) =>
        row.map((v, c) => {
          const fill = PATTERN_COLOURS[v];
          const common = {
            className: 'flex items-center justify-center border border-border text-lg font-bold',
            style: { background: fill, color: textOn(fill) },
          };
          return onCell ? (
            <button
              key={`${r}-${c}`}
              ref={(el) => {
                if (refs) refs.current[r * n + c] = el;
              }}
              type="button"
              role="gridcell"
              aria-label={`Row ${r + 1}, column ${c + 1}: ${PATTERN_NAMES[v]}`}
              onClick={() => onCell(r, c)}
              onKeyDown={(e) => {
                const move = (dr: number, dc: number): void => {
                  const rr = r + dr;
                  const cc = c + dc;
                  if (rr >= 0 && cc >= 0 && rr < n && cc < n) {
                    refs?.current[rr * n + cc]?.focus();
                    e.preventDefault();
                  }
                };
                if (e.key === 'ArrowUp') move(-1, 0);
                else if (e.key === 'ArrowDown') move(1, 0);
                else if (e.key === 'ArrowLeft') move(0, -1);
                else if (e.key === 'ArrowRight') move(0, 1);
              }}
              {...common}
            >
              {PATTERN_GLYPHS[v]}
            </button>
          ) : (
            <div key={`${r}-${c}`} role="gridcell" aria-label={`Row ${r + 1}, column ${c + 1}: ${PATTERN_NAMES[v]}`} {...common}>
              {PATTERN_GLYPHS[v]}
            </div>
          );
        }),
      )}
    </div>
  );
}

export function MirrorTurn({ api }: { api: FrameApi }) {
  const total = api.phase === 'tutorial' ? TUTORIAL_ROUNDS : ROUNDS;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const level = api.level(round, total);
  const puzzle = useMemo(() => generateMirror(seededRng(api.seed, round), level), [api.seed, round, level]);
  const [answer, setAnswer] = useState<Grid>(() => blankGrid(puzzle.size));
  const [verdict, setVerdict] = useState<'idle' | 'right' | 'wrong' | 'retry'>('idle');
  const stats = useRef({ good: 0, bad: 0, times: [] as number[] });
  const shownAt = useRef(performance.now());
  const finished = useRef(false);
  const alive = useRef(true);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const cell = useCell(puzzle.size);
  const { setHud, finish, sound } = api;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setHud({ round: `Round ${round + 1} of ${total}`, widget: `Score ${score}` });
  }, [setHud, round, total, score]);

  useEffect(() => {
    setAnswer(blankGrid(puzzle.size));
    setVerdict('idle');
    shownAt.current = performance.now();
  }, [puzzle]);

  const end = (): void => {
    if (finished.current) return;
    finished.current = true;
    const s = stats.current;
    const result: GameResult = {
      score: s.good,
      scoreText: String(s.good),
      correct: s.good,
      attempted: s.good + s.bad,
      avgItemMs: mean(s.times),
      detail: [`${s.good} correct, ${s.bad} wrong`],
    };
    sound('done');
    finish(result);
  };

  useEffect(() => {
    if (api.expired) end();
  }, [api.expired]);

  const cycle = (r: number, c: number): void => {
    if (verdict === 'right' || verdict === 'wrong') return;
    setVerdict('idle');
    setAnswer((g) => g.map((row, rr) => row.map((v, cc) => (rr === r && cc === c ? (v + 1) % (puzzle.colours + 1) : v))));
  };

  const check = (): void => {
    if (verdict === 'right' || verdict === 'wrong' || finished.current) return;
    const ok = gridsEqual(answer, puzzle.target);
    const ms = performance.now() - shownAt.current;
    if (!ok && api.phase === 'tutorial') {
      sound('bad');
      setVerdict('retry');
      return;
    }
    stats.current.times.push(ms);
    if (ok) stats.current.good += 1;
    else stats.current.bad += 1;
    setScore(stats.current.good);
    setVerdict(ok ? 'right' : 'wrong');
    sound(ok ? 'good' : 'bad');
    window.setTimeout(() => {
      if (!alive.current || finished.current) return;
      if (round + 1 >= total) end();
      else setRound((r) => r + 1);
    }, ok ? 600 : 1800);
  };

  const showing = verdict === 'wrong' ? puzzle.target : answer;

  return (
    <div className="space-y-4">
      <div className="card p-3 text-center">
        <div className="stat-label">Instruction</div>
        <p className="mt-1 text-lg font-bold" aria-live="polite">
          {describeTransform(puzzle.transform)}
        </p>
        <p className="text-xs text-muted">Recreate the transformed pattern on the right. Tap a cell to cycle through the shapes.</p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <div className="space-y-1">
          <div className="stat-label text-center">Original</div>
          <PatternGrid grid={puzzle.source} cell={cell} label="Original pattern" />
        </div>
        <div className="space-y-1">
          <div className="stat-label text-center">{verdict === 'wrong' ? 'Correct answer' : 'Your answer'}</div>
          <PatternGrid grid={showing} cell={cell} label={verdict === 'wrong' ? 'Correct answer' : 'Your answer'} onCell={cycle} refs={refs} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-primary min-h-12 px-6" onClick={check} disabled={verdict === 'right' || verdict === 'wrong'}>
          Check answer
        </button>
        <button type="button" className="btn min-h-12" onClick={() => setAnswer(blankGrid(puzzle.size))} disabled={verdict === 'right' || verdict === 'wrong'}>
          Clear grid
        </button>
      </div>

      <p className="min-h-6 text-center text-sm font-semibold" role="status" aria-live="polite" style={{ color: verdict === 'right' ? OKABE.green : verdict === 'idle' ? undefined : OKABE.vermillion }}>
        {verdict === 'right' && '✓ Correct'}
        {verdict === 'wrong' && '✗ Not quite. The correct pattern is shown.'}
        {verdict === 'retry' && '✗ Not quite. Check the instruction and try again.'}
      </p>
    </div>
  );
}
