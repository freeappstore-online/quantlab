import { useEffect, useMemo, useRef, useState } from 'react';
import { BLOCK_VARIANT_LABEL, blockVariantFor, generateBlockPuzzle, regionCells, rotated, type BlockPuzzle } from '../../../services/assess/blockfit';
import type { GameResult } from '../../../services/assess/types';
import { clamp, mean, seededRng } from '../../../services/assess/util';
import type { FrameApi } from '../api';
import { PIECE_COLOURS, textOn } from '../palette';

const ROUNDS = 14;
const TUTORIAL_ROUNDS = 2;

interface Drag {
  id: number;
  /** The cell of the piece that is under the pointer. */
  pr: number;
  pc: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  moved: boolean;
}

interface Spot {
  r: number;
  c: number;
}

const letter = (id: number): string => String.fromCharCode(65 + id);
const key = (r: number, c: number): string => `${r},${c}`;

function useCellSize(cols: number): number {
  const compute = (): number => clamp(Math.floor(Math.min(window.innerWidth - 40, 400) / cols), 34, 58);
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = (): void => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cols]);
  return size;
}

interface RoundProps {
  puzzle: BlockPuzzle;
  locked: boolean;
  onTouched: () => void;
  onComplete: () => void;
}

/** One puzzle. Remounted for every round so its board and drag state always start clean. */
function Round({ puzzle, locked, onTouched, onComplete }: RoundProps) {
  const [rot, setRot] = useState<Record<number, number>>({});
  const [pos, setPos] = useState<Record<number, Spot | null>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [carry, setCarry] = useState<{ id: number; r: number; c: number } | null>(null);
  const [bump, setBump] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cell = useCellSize(puzzle.cols);
  const trayCell = clamp(Math.floor(cell * 0.55), 18, 30);

  const cellsOf = (id: number, turns = rot[id] ?? 0) => rotated(puzzle.pieces[id].cells, turns);

  const occupied = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of puzzle.pieces) {
      const at = pos[p.id];
      if (!at) continue;
      for (const [r, c] of rotated(p.cells, rot[p.id] ?? 0)) m.set(key(at.r + r, at.c + c), p.id);
    }
    return m;
  }, [pos, rot, puzzle]);

  const regionSize = useMemo(() => regionCells(puzzle.region).length, [puzzle]);

  // Always-fresh copies for the window listeners.
  const latest = useRef({ pos, rot, puzzle, cell, occupied });
  latest.current = { pos, rot, puzzle, cell, occupied };
  const dragRef = useRef<Drag | null>(null);

  const fits = (id: number, at: Spot, turns: number, ignoreSelf = true): boolean => {
    const { puzzle: pz, occupied: occ } = latest.current;
    return rotated(pz.pieces[id].cells, turns).every(([r, c]) => {
      const rr = at.r + r;
      const cc = at.c + c;
      if (rr < 0 || cc < 0 || rr >= pz.rows || cc >= pz.cols || !pz.region[rr][cc]) return false;
      const who = occ.get(key(rr, cc));
      return who === undefined || (ignoreSelf && who === id);
    });
  };

  const anchorAt = (d: Drag): Spot | null => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const size = latest.current.cell;
    const gr = Math.floor((d.y - rect.top) / size);
    const gc = Math.floor((d.x - rect.left) / size);
    if (gr < 0 || gc < 0 || gr >= latest.current.puzzle.rows || gc >= latest.current.puzzle.cols) return null;
    return { r: gr - d.pr, c: gc - d.pc };
  };

  const rotatePiece = (id: number): void => setRot((m) => ({ ...m, [id]: ((m[id] ?? 0) + 1) % 4 }));

  const startDrag = (e: React.PointerEvent, id: number, pr: number, pc: number): void => {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const d: Drag = { id, pr, pc, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    dragRef.current = d;
    // Picking a piece up off the board returns it to the tray straight away.
    setPos((p) => (p[id] ? { ...p, [id]: null } : p));
    setCarry(null);
    setDrag(d);
  };

  const dragId = drag?.id;
  useEffect(() => {
    if (dragId === undefined) return;
    const move = (e: PointerEvent): void => {
      const d = dragRef.current;
      if (!d) return;
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.moved && Math.hypot(d.x - d.sx, d.y - d.sy) > 6) d.moved = true;
      setDrag({ ...d });
    };
    const finish = (e: PointerEvent, cancelled: boolean): void => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDrag(null);
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.moved) {
        // A tap rotates a piece in the tray.
        if (!cancelled) rotatePiece(d.id);
        return;
      }
      if (cancelled) return;
      const at = anchorAt(d);
      if (at && fits(d.id, at, latest.current.rot[d.id] ?? 0)) {
        setPos((p) => ({ ...p, [d.id]: at }));
        onTouched();
      } else {
        setBump(true);
        window.setTimeout(() => setBump(false), 250);
      }
    };
    const up = (e: PointerEvent): void => finish(e, false);
    const cancel = (e: PointerEvent): void => finish(e, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [dragId]);

  // Keyboard: pick a piece up with Enter, move with the arrows, rotate with R, drop with Enter.
  const carryId = carry?.id;
  useEffect(() => {
    if (carryId === undefined) return;
    const onKey = (e: KeyboardEvent): void => {
      const { puzzle: pz, rot: rotations } = latest.current;
      setCarry((c) => {
        if (!c) return c;
        let { r, c: col } = c;
        if (e.key === 'ArrowUp') r -= 1;
        else if (e.key === 'ArrowDown') r += 1;
        else if (e.key === 'ArrowLeft') col -= 1;
        else if (e.key === 'ArrowRight') col += 1;
        else if (e.key === 'r' || e.key === 'R') {
          rotatePiece(c.id);
          return c;
        } else if (e.key === 'Escape') return null;
        else if (e.key === 'Enter' || e.key === ' ') {
          if (fits(c.id, { r, c: col }, rotations[c.id] ?? 0)) {
            setPos((p) => ({ ...p, [c.id]: { r, c: col } }));
            onTouched();
            return null;
          }
          setBump(true);
          window.setTimeout(() => setBump(false), 250);
          return c;
        } else return c;
        e.preventDefault();
        return { id: c.id, r: clamp(r, -3, pz.rows), c: clamp(col, -3, pz.cols) };
      });
      if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [carryId]);

  // The round is over the moment every cell of the grid is covered.
  useEffect(() => {
    if (!locked && occupied.size === regionSize) onComplete();
  }, [occupied.size]);

  // Which grid cells are lit up as a drop preview, and whether the drop would fit.
  const preview = useMemo(() => {
    let at: Spot | null = null;
    let id = -1;
    if (drag?.moved) {
      id = drag.id;
      at = anchorAt(drag);
    } else if (carry) {
      id = carry.id;
      at = { r: carry.r, c: carry.c };
    }
    if (!at || id < 0) return null;
    const ok = fits(id, at, rot[id] ?? 0);
    const set = new Set(cellsOf(id).map(([r, c]) => key(at.r + r, at.c + c)));
    return { set, ok };
  }, [drag, carry, rot, pos]);

  const placedCount = Object.values(pos).filter(Boolean).length;
  const ghostCells = drag?.moved ? cellsOf(drag.id) : null;

  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-start md:justify-center ${bump ? 'animate-pulse' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <div
          ref={gridRef}
          role="grid"
          aria-label={`Target grid, ${puzzle.rows} by ${puzzle.cols}. ${placedCount} of ${puzzle.variant === 'spare' ? puzzle.pieces.length - 1 : puzzle.pieces.length} pieces placed.`}
          className="grid touch-none select-none rounded-lg border border-border p-0 bg-bg"
          style={{ gridTemplateColumns: `repeat(${puzzle.cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}
        >
          {puzzle.region.flatMap((row, r) =>
            row.map((inRegion, c) => {
              if (!inRegion) return <div key={key(r, c)} role="gridcell" aria-label="Blocked" className="bg-border" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 5px, rgba(0,0,0,0.25) 5px 7px)' }} />;
              const who = occupied.get(key(r, c));
              const lit = preview?.set.has(key(r, c));
              const fill = who === undefined ? undefined : PIECE_COLOURS[who % PIECE_COLOURS.length];
              const at = who === undefined ? null : pos[who];
              return (
                <div
                  key={key(r, c)}
                  role="gridcell"
                  aria-label={who === undefined ? 'Empty' : `Piece ${letter(who)}`}
                  className="flex items-center justify-center border border-border text-sm font-bold"
                  style={{
                    background: fill ?? 'transparent',
                    color: fill ? textOn(fill) : undefined,
                    outline: lit ? `3px ${preview?.ok ? 'solid' : 'dashed'} ${preview?.ok ? '#0072B2' : '#D55E00'}` : undefined,
                    outlineOffset: '-3px',
                    cursor: who === undefined ? 'default' : 'grab',
                  }}
                  onPointerDown={who === undefined || !at ? undefined : (e) => startDrag(e, who, r - at.r, c - at.c)}
                >
                  {who === undefined ? '' : letter(who)}
                </div>
              );
            }),
          )}
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {placedCount} of {puzzle.variant === 'spare' ? puzzle.pieces.length - 1 : puzzle.pieces.length} pieces placed
          {puzzle.variant === 'spare' ? ' (plus one spare)' : ''}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-center gap-3 rounded-xl border border-border bg-surface p-3" aria-label="Piece tray">
          {puzzle.pieces.map((p) => {
            const cells = cellsOf(p.id);
            const h = Math.max(...cells.map((c) => c[0])) + 1;
            const w = Math.max(...cells.map((c) => c[1])) + 1;
            const on = new Set(cells.map(([r, c]) => key(r, c)));
            const placed = Boolean(pos[p.id]);
            const fill = PIECE_COLOURS[p.id % PIECE_COLOURS.length];
            const carrying = carry?.id === p.id;
            return (
              <div
                key={p.id}
                tabIndex={0}
                role="button"
                aria-label={`Piece ${letter(p.id)}, ${p.cells.length} cells${placed ? ', placed' : ''}. Press R to rotate, Enter to pick up.`}
                className="touch-none select-none rounded-md p-1 focus-visible:outline-2"
                style={{ opacity: placed ? 0.35 : 1, outline: carrying ? '3px solid #0072B2' : undefined }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  rotatePiece(p.id);
                }}
                onKeyDown={(e) => {
                  if (locked) return;
                  if (e.key === 'r' || e.key === 'R') {
                    e.preventDefault();
                    rotatePiece(p.id);
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPos((m) => (m[p.id] ? { ...m, [p.id]: null } : m));
                    setCarry({ id: p.id, r: 0, c: 0 });
                  }
                }}
              >
                <div className="grid" style={{ gridTemplateColumns: `repeat(${w}, ${trayCell}px)`, gridAutoRows: `${trayCell}px` }}>
                  {Array.from({ length: h * w }, (_, i) => {
                    const r = Math.floor(i / w);
                    const c = i % w;
                    return on.has(key(r, c)) ? (
                      <div
                        key={i}
                        className="flex items-center justify-center border border-black/20 text-[11px] font-bold"
                        style={{ background: fill, color: textOn(fill), cursor: 'grab' }}
                        onPointerDown={(e) => startDrag(e, p.id, r, c)}
                      >
                        {letter(p.id)}
                      </div>
                    ) : (
                      <div key={i} className="pointer-events-none" />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted">
          Drag pieces onto the grid. Tap a piece (or right-click) to turn it. Keyboard: Tab to a piece, R to turn, Enter to pick up, arrows to move, Enter to drop.
        </p>
      </div>

      {ghostCells && drag && (
        <div className="pointer-events-none fixed z-50 opacity-80" style={{ left: drag.x - (drag.pc + 0.5) * cell, top: drag.y - (drag.pr + 0.5) * cell }} aria-hidden="true">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(...ghostCells.map((c) => c[1])) + 1}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
            {Array.from({ length: (Math.max(...ghostCells.map((c) => c[0])) + 1) * (Math.max(...ghostCells.map((c) => c[1])) + 1) }, (_, i) => {
              const w = Math.max(...ghostCells.map((c) => c[1])) + 1;
              const filled = ghostCells.some(([r, c]) => r * w + c === i);
              const fill = PIECE_COLOURS[drag.id % PIECE_COLOURS.length];
              return <div key={i} className="flex items-center justify-center border border-black/30 text-sm font-bold" style={filled ? { background: fill, color: textOn(fill) } : undefined}>{filled ? letter(drag.id) : ''}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BlockFit({ api }: { api: FrameApi }) {
  const total = api.phase === 'tutorial' ? TUTORIAL_ROUNDS : ROUNDS;
  const [round, setRound] = useState(0);
  const [done, setDone] = useState<{ ms: number; bonus: number }[]>([]);
  const [locked, setLocked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const touched = useRef(false);
  const finished = useRef(false);
  const alive = useRef(true);
  const roundStart = useRef(performance.now());

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const level = api.level(round, total);
  const variant = blockVariantFor(round, api.phase === 'tutorial');
  const puzzle = useMemo(() => generateBlockPuzzle(seededRng(api.seed, round), level, variant), [api.seed, round, level, variant]);
  const score = done.length + done.reduce((s, d) => s + d.bonus, 0);
  const { setHud, finish, sound } = api;

  useEffect(() => {
    setHud({ round: `Round ${round + 1} of ${total}`, widget: `Score ${score.toFixed(1)}` });
  }, [setHud, round, total, score]);

  const finishRun = (rounds: { ms: number; bonus: number }[]): void => {
    if (finished.current) return;
    finished.current = true;
    const bonus = rounds.reduce((s, d) => s + d.bonus, 0);
    const value = rounds.length + bonus;
    const result: GameResult = {
      score: Math.round(value * 10) / 10,
      scoreText: value.toFixed(1),
      correct: rounds.length,
      attempted: rounds.length + (touched.current && rounds.length < total ? 1 : 0),
      avgItemMs: mean(rounds.map((d) => d.ms)),
      detail: [`${rounds.length} of ${total} rounds completed`, `Speed bonus ${bonus.toFixed(1)}`],
    };
    sound('done');
    finish(result);
  };

  // Time up ends the test with whatever has been completed so far.
  useEffect(() => {
    if (api.expired) finishRun(done);
  }, [api.expired]);

  const complete = (): void => {
    const ms = performance.now() - roundStart.current;
    // Par time grows with the number of cells to fill.
    const cells = regionCells(puzzle.region).length;
    const par = (14 + cells * 1.6) * 1000;
    const bonus = Math.round(clamp(1 - ms / par, 0, 1) * 5) / 10;
    const next = [...done, { ms, bonus }];
    setDone(next);
    setLocked(true);
    sound('good');
    window.setTimeout(() => {
      if (!alive.current) return;
      if (round + 1 >= total) {
        finishRun(next);
      } else {
        touched.current = false;
        roundStart.current = performance.now();
        setLocked(false);
        setRound((r) => r + 1);
      }
    }, 700);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          <strong className="text-ink">{BLOCK_VARIANT_LABEL[variant]}.</strong>{' '}
          {variant === 'spare' ? 'Fill the whole grid. One piece in the tray is a spare, so leave it out.' : variant === 'silhouette' ? 'Fill the whole shape using every piece.' : 'Fill the whole grid using every piece.'}
        </p>
        <button type="button" className="btn min-h-10 px-3" onClick={() => setResetKey((k) => k + 1)} disabled={locked}>
          Reset round
        </button>
      </div>
      <Round key={`${round}-${resetKey}`} puzzle={puzzle} locked={locked} onTouched={() => (touched.current = true)} onComplete={complete} />
      {locked && (
        <p className="text-center font-semibold" role="status">
          Round complete
        </p>
      )}
    </div>
  );
}
