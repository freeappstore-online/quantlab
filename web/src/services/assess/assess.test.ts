import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../rng';
import { generateBlockPuzzle, regionCells, rotate90, rotated, rotations, solveBlockFit, type Cell } from './blockfit';
import { bubbleCount, fNum, generateBubbleRound } from './bubbles';
import { applyTransform, blankGrid, describeTransform, generateMirror, gridsEqual, mirrorLr, rotateCw } from './mirror';
import { DELTA, DIR_LIST, generateMaze, solveMaze, tryMove, type Maze } from './route';
import { SJT_SCENARIOS, SJT_TAG_LABEL, SJT_THEME_LABEL } from './sjtBank';
import { generateSjtItems, scoreRanking } from './sjt';
import { compare, generateSumItem } from './sumcompare';
import { allActivePassage, cleanText, generatePassage, slotCount, TYPO_KIND_LABEL, type TypoKind } from './typo';
import { TYPO_TEMPLATES } from './typoBank';
import { absoluteExtremes, chooseStatements, findConflicts, hasAbsoluteWording, pairCount, STATEMENTS } from './workstyle';
import { parseAssessSettings, parseRecord } from './storage';
import { levelFor, shuffle } from './util';

const LEVELS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const SEEDS = 40;

describe('levels and helpers', () => {
  it('ramps up across a test and respects overrides', () => {
    expect(levelFor(0, 9, 'auto')).toBe(0);
    expect(levelFor(8, 9, 'auto')).toBe(1);
    expect(levelFor(8, 9, 'easy')).toBeLessThan(levelFor(0, 9, 'hard'));
    expect(levelFor(0, 9, 'hard')).toBeGreaterThanOrEqual(0.65);
    for (let i = 1; i < 9; i++) expect(levelFor(i, 9, 'medium')).toBeGreaterThan(levelFor(i - 1, 9, 'medium'));
  });

  it('shuffles without losing items', () => {
    const out = shuffle(mulberry32(3), [1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('Block Fit', () => {
  it('rotates pieces a quarter turn at a time', () => {
    const l: Cell[] = [[0, 0], [1, 0], [2, 0], [2, 1]];
    expect(rotated(l, 4)).toEqual(l);
    expect(rotate90(rotate90(rotate90(rotate90(l))))).toEqual(l);
    expect(rotations([[0, 0], [0, 1], [1, 0], [1, 1]])).toHaveLength(1);
    expect(rotations([[0, 0], [0, 1], [0, 2]])).toHaveLength(2);
  });

  it('every generated puzzle is solvable and well formed at every difficulty', () => {
    for (const t of LEVELS) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = generateBlockPuzzle(mulberry32(seed * 7 + Math.round(t * 10)), t);
        const cells = regionCells(p.region).length;
        expect(p.pieces.length).toBeGreaterThanOrEqual(2);
        expect(p.pieces.length).toBeLessThanOrEqual(8);
        expect(p.pieces.reduce((s, x) => s + x.cells.length, 0)).toBe(cells);
        expect(p.rows).toBeGreaterThanOrEqual(3);
        expect(p.rows).toBeLessThanOrEqual(6);
        expect(p.cols).toBeLessThanOrEqual(6);
        expect(solveBlockFit(p.region, p.pieces)).toBe(true);
      }
    }
  });

  it('the solver rejects an impossible set', () => {
    const region = [[true, true, true], [true, true, true], [true, true, true]];
    const bad = [{ id: 0, cells: [[0, 0], [0, 1], [0, 2], [1, 0]] as Cell[] }, { id: 1, cells: [[0, 0], [0, 1]] as Cell[] }];
    expect(solveBlockFit(region, bad)).toBe(false);
  });

  it('grows the grid and the piece count with difficulty', () => {
    const avg = (t: number, f: (p: ReturnType<typeof generateBlockPuzzle>) => number): number => {
      let sum = 0;
      for (let seed = 1; seed <= 30; seed++) sum += f(generateBlockPuzzle(mulberry32(seed), t));
      return sum / 30;
    };
    expect(avg(1, (p) => p.rows * p.cols)).toBeGreaterThan(avg(0, (p) => p.rows * p.cols));
    expect(avg(1, (p) => p.pieces.length)).toBeGreaterThan(avg(0, (p) => p.pieces.length));
  });
});

describe('Typo Hunt', () => {
  it('has a large, varied bank', () => {
    expect(TYPO_TEMPLATES.length).toBeGreaterThanOrEqual(40);
    for (const genre of ['email', 'about', 'ceo', 'notice', 'event'] as const) {
      expect(TYPO_TEMPLATES.filter((t) => t.genre === genre).length).toBeGreaterThanOrEqual(8);
    }
  });

  it('every template is 150 to 220 words with plenty of error slots', () => {
    TYPO_TEMPLATES.forEach((_, i) => {
      const words = cleanText(i).split(/\s+/).length;
      expect(words, `template ${i} word count`).toBeGreaterThanOrEqual(150);
      expect(words, `template ${i} word count`).toBeLessThanOrEqual(220);
      expect(slotCount(i), `template ${i} slots`).toBeGreaterThanOrEqual(18);
      expect(cleanText(i)).not.toMatch(/[{}\u0001-\u0005]/);
    });
  });

  it('passages carry 14 to 22 findable errors with a mix of kinds', () => {
    const kinds = new Set<TypoKind>();
    for (let seed = 1; seed <= 120; seed++) {
      const p = generatePassage(mulberry32(seed), { minErrors: 14, maxErrors: 22 });
      expect(p.errors.length).toBeGreaterThanOrEqual(14);
      expect(p.errors.length).toBeLessThanOrEqual(22);
      const total = p.tokens.length;
      expect(total).toBeGreaterThanOrEqual(150);
      for (const e of p.errors) {
        const hits = p.tokens.filter((t) => t.err === e.id);
        expect(hits.length, `error ${e.id} (${e.kind}) has a word to click`).toBeGreaterThan(0);
        kinds.add(e.kind);
      }
      for (const t of p.tokens) {
        expect(t.text).not.toMatch(/[\u0001-\u0005]/);
        if (t.err !== null) expect(p.errors.some((e) => e.id === t.err)).toBe(true);
      }
      expect(p.tokens.some((t) => t.para)).toBe(true);
    }
    expect([...kinds].sort()).toEqual(Object.keys(TYPO_KIND_LABEL).sort());
  });

  it('error shapes are what they claim to be', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const p = generatePassage(mulberry32(seed + 500), { minErrors: 14, maxErrors: 22 });
      for (const e of p.errors) {
        const hits = p.tokens.filter((t) => t.err === e.id);
        if (e.kind === 'fullstop') {
          expect(hits[0].text).not.toMatch(/[.!?]$/);
          const next = p.tokens[p.tokens.indexOf(hits[0]) + 1];
          expect(next.text).toMatch(/^[A-Z{]|^[A-Za-z]/);
        }
        if (e.kind === 'doubled') {
          expect(hits).toHaveLength(2);
          expect(hits[0].text.replace(/[.,;:]/g, '').toLowerCase()).toBe(hits[1].text.replace(/[.,;:]/g, '').toLowerCase());
        }
        if (e.kind === 'capital') expect(hits.some((h) => /^[a-z]/.test(h.text))).toBe(true);
        if (e.kind === 'spelling' || e.kind === 'stray') expect(e.shown.toLowerCase()).not.toBe(e.fix.toLowerCase());
      }
    }
  });

  it('never puts two errors on one word, even with every slot requested', () => {
    TYPO_TEMPLATES.forEach((_, i) => {
      const p = allActivePassage(mulberry32(i + 1), i);
      for (const e of p.errors) expect(p.tokens.filter((t) => t.err === e.id).length, `template ${i} error ${e.id}`).toBeGreaterThan(0);
    });
  });

  it('tutorial passages are lighter', () => {
    const p = generatePassage(mulberry32(5), { minErrors: 6, maxErrors: 8 });
    expect(p.errors.length).toBeLessThanOrEqual(8);
    expect(p.errors.length).toBeGreaterThanOrEqual(6);
  });
});

describe('Bubble Order', () => {
  const evaluate = (text: string): number => {
    const js = text.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '**2');
    return Function(`return (${js})`)() as number;
  };

  it('values are distinct, correct and sorted at every difficulty', () => {
    for (const t of LEVELS) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const r = generateBubbleRound(mulberry32(seed * 13), t);
        expect(r.bubbles).toHaveLength(bubbleCount(t));
        expect(r.bubbles.length).toBeGreaterThanOrEqual(3);
        expect(r.bubbles.length).toBeLessThanOrEqual(6);
        for (const b of r.bubbles) expect(Math.abs(evaluate(b.text) - fNum(b.value)), b.text).toBeLessThan(1e-9);
        const values = r.order.map((id) => fNum(r.bubbles[id].value));
        for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    }
  });

  it('starts with three bubbles and ends with six', () => {
    expect(bubbleCount(0)).toBe(3);
    expect(bubbleCount(1)).toBe(6);
  });
});

describe('Sum Compare', () => {
  it('the stated answer always matches the sums', () => {
    let ties = 0;
    const N = 1500;
    for (let i = 0; i < N; i++) {
      const t = LEVELS[i % LEVELS.length];
      const item = generateSumItem(mulberry32(i + 1), t);
      expect(item.answer).toBe(compare(item.left, item.right));
      expect(item.left.length).toBeGreaterThanOrEqual(2);
      expect(item.right.length).toBeGreaterThanOrEqual(2);
      expect(item.left.every((v) => v >= 1) && item.right.every((v) => v >= 1)).toBe(true);
      if (item.answer === 'equal') ties++;
    }
    expect(ties / N).toBeGreaterThan(0.12);
    expect(ties / N).toBeLessThan(0.4);
  });
});

describe('Mirror Turn', () => {
  it('transforms behave like real rotations and mirrors', () => {
    const g = [[1, 2, 0], [0, 0, 3], [0, 0, 0]];
    let r = g;
    for (let i = 0; i < 4; i++) r = rotateCw(r);
    expect(r).toEqual(g);
    expect(mirrorLr(mirrorLr(g))).toEqual(g);
    expect(rotateCw(g)[0][2]).toBe(1);
    expect(applyTransform(g, { mirror: true, rot: 0 })[0]).toEqual([0, 2, 1]);
    expect(blankGrid(3).flat().every((v) => v === 0)).toBe(true);
    expect(describeTransform({ mirror: true, rot: 90 })).toContain('Mirror');
  });

  it('targets are correct, differ from the source and grow with difficulty', () => {
    for (const t of LEVELS) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = generateMirror(mulberry32(seed * 11), t);
        expect(gridsEqual(p.target, applyTransform(p.source, p.transform))).toBe(true);
        expect(gridsEqual(p.source, p.target)).toBe(false);
        expect(p.size).toBeGreaterThanOrEqual(3);
        expect(p.size).toBeLessThanOrEqual(5);
        expect(p.source.flat().filter((v) => v > 0).length).toBeGreaterThanOrEqual(3);
        expect(Math.max(...p.source.flat())).toBeLessThanOrEqual(p.colours);
      }
    }
    expect(generateMirror(mulberry32(1), 0).size).toBe(3);
    expect(generateMirror(mulberry32(1), 1).size).toBe(5);
  });

  it('only later rounds ask for a mirror', () => {
    for (let seed = 1; seed <= 60; seed++) expect(generateMirror(mulberry32(seed), 0.2).transform.mirror).toBe(false);
    expect([...Array(200).keys()].some((seed) => generateMirror(mulberry32(seed + 1), 1).transform.mirror)).toBe(true);
  });
});

describe('Shortest Route', () => {
  /** Plays a path of moves and returns where it ends, independent of the solver. */
  const walk = (maze: Maze, moves: readonly (typeof DIR_LIST)[number][]): { pos: readonly [number, number]; keys: number } | null => {
    let pos = maze.start;
    let keys = 0;
    for (const m of moves) {
      const r = tryMove(maze, pos, m, keys);
      if (!r) return null;
      pos = r.pos;
      keys = r.keys;
    }
    return { pos, keys };
  };

  it('every maze is solvable, its optimum is real and doors matter', () => {
    for (const t of LEVELS) {
      for (let seed = 1; seed <= 25; seed++) {
        const maze = generateMaze(mulberry32(seed * 17), t);
        expect(maze.optimal).toBeGreaterThan(0);
        expect(solveMaze(maze)).toBe(maze.optimal);
        expect(maze.tiles[maze.start[0]][maze.start[1]].kind).toBe('floor');
        expect(maze.tiles[maze.goal[0]][maze.goal[1]].kind).toBe('floor');
        if (maze.doors > 0) expect(maze.optimal).toBeGreaterThanOrEqual((solveMaze(maze, true) ?? 0) + 2);
        expect(maze.size).toBeGreaterThanOrEqual(5);
        expect(maze.size).toBeLessThanOrEqual(9);
      }
    }
  });

  it('adds keys, doors and one-way tiles only as difficulty rises', () => {
    const kinds = (t: number): Set<string> => {
      const found = new Set<string>();
      for (let seed = 1; seed <= 25; seed++) for (const row of generateMaze(mulberry32(seed), t).tiles) for (const tile of row) found.add(tile.kind);
      return found;
    };
    expect(kinds(0).has('door')).toBe(false);
    expect(kinds(0).has('oneway')).toBe(false);
    expect(kinds(1).has('door')).toBe(true);
    expect(kinds(1).has('key')).toBe(true);
    expect(kinds(1).has('oneway')).toBe(true);
  });

  it('movement rules: walls, doors, keys and one-way tiles', () => {
    const maze: Maze = {
      size: 5,
      start: [0, 0],
      goal: [0, 4],
      optimal: 0,
      doors: 1,
      tiles: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ kind: 'floor' as const }))),
    };
    maze.tiles[0][1] = { kind: 'door', id: 0 };
    maze.tiles[1][0] = { kind: 'key', id: 0 };
    maze.tiles[0][2] = { kind: 'oneway', dir: 'R' };
    maze.tiles[2][0] = { kind: 'wall' };
    expect(tryMove(maze, [0, 0], 'R', 0)).toBeNull();
    expect(tryMove(maze, [0, 0], 'U', 0)).toBeNull();
    expect(tryMove(maze, [1, 0], 'D', 0)).toBeNull();
    expect(walk(maze, ['D', 'U', 'R'])?.pos).toEqual([0, 1]);
    expect(tryMove(maze, [0, 1], 'R', 1)?.pos).toEqual([0, 2]);
    expect(tryMove(maze, [0, 3], 'L', 1)).toBeNull();
    expect(tryMove(maze, [1, 2], 'U', 0)).toBeNull();
    expect(Object.keys(DELTA)).toHaveLength(4);
  });
});

describe('Workplace Judgement', () => {
  it('has a large, well formed scenario bank', () => {
    expect(SJT_SCENARIOS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SJT_SCENARIOS.map((s) => s.id)).size).toBe(SJT_SCENARIOS.length);
    for (const theme of Object.keys(SJT_THEME_LABEL)) {
      expect(SJT_SCENARIOS.filter((s) => s.theme === theme).length).toBeGreaterThanOrEqual(5);
    }
    for (const s of SJT_SCENARIOS) {
      expect(s.options).toHaveLength(4);
      expect(s.situation.length).toBeGreaterThan(40);
      expect(new Set(s.options.map((o) => o.text)).size).toBe(4);
      for (const o of s.options) {
        expect(Object.keys(SJT_TAG_LABEL)).toContain(o.tag);
        expect(o.why.length).toBeGreaterThan(30);
      }
    }
  });

  it('scores rankings against the expert order', () => {
    expect(scoreRanking([0, 1, 2, 3])).toBe(1);
    expect(scoreRanking([3, 2, 1, 0])).toBe(0);
    expect(scoreRanking([1, 0, 2, 3])).toBeCloseTo(0.75);
    for (const r of [[0, 1, 3, 2], [2, 0, 1, 3], [1, 3, 0, 2]]) {
      const s = scoreRanking(r);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it('deals distinct scenarios and never in answer-key order', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const items = generateSjtItems(mulberry32(seed), 6);
      expect(new Set(items.map((i) => i.scenario.id)).size).toBe(6);
      for (const it of items) {
        expect([...it.shown].sort()).toEqual([0, 1, 2, 3]);
        expect(it.shown.every((v, i) => v === i)).toBe(false);
      }
    }
  });
});

describe('Work-style questionnaire', () => {
  it('builds opposite pairs across five traits', () => {
    expect(STATEMENTS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(STATEMENTS.map((s) => s.trait)).size).toBe(5);
    for (const s of STATEMENTS) expect(STATEMENTS.find((t) => t.id === s.pair)?.pair).toBe(s.id);
  });

  it('asks for both halves of every pair, never side by side', () => {
    const picked = chooseStatements(mulberry32(9), 7);
    expect(picked).toHaveLength(14);
    expect(pairCount(picked)).toBe(7);
    picked.forEach((s, i) => {
      const next = picked[i + 1];
      if (next) expect(next.id).not.toBe(s.pair);
    });
  });

  it('flags contradictory answers and extreme absolutes', () => {
    const picked = chooseStatements(mulberry32(4), 3);
    const consistent: Record<string, number> = {};
    for (const s of picked) consistent[s.id] = s.reverse ? 2 : 4;
    expect(findConflicts(picked, consistent)).toHaveLength(0);
    const contradictory: Record<string, number> = {};
    for (const s of picked) contradictory[s.id] = 5;
    expect(findConflicts(picked, contradictory)).toHaveLength(3);
    expect(hasAbsoluteWording('I always aim to finish what I start.')).toBe(true);
    expect(hasAbsoluteWording('I enjoy working with others.')).toBe(false);
    const abs = STATEMENTS.filter((s) => hasAbsoluteWording(s.text));
    expect(abs.length).toBeGreaterThan(0);
    expect(absoluteExtremes(abs, Object.fromEntries(abs.map((s) => [s.id, 5]))).length).toBe(abs.length);
    expect(absoluteExtremes(abs, Object.fromEntries(abs.map((s) => [s.id, 3]))).length).toBe(0);
  });
});

describe('storage', () => {
  it('validates stored records and repairs settings', () => {
    const good = { id: 'x', game: 'blockfit', at: 1, score: 5, scoreText: '5', correct: 5, attempted: 6, avgItemMs: 1200, override: 'auto', full: false };
    expect(parseRecord(good)).toEqual(good);
    expect(parseRecord({ ...good, avgItemMs: null })?.avgItemMs).toBeNull();
    expect(parseRecord({ ...good, game: 'nope' })).toBeNull();
    expect(parseRecord(null)).toBeNull();
    expect(parseAssessSettings('x')).toEqual({ timerOn: true, override: 'auto', sound: false });
    expect(parseAssessSettings({ timerOn: false, override: 'hard', sound: true })).toEqual({ timerOn: false, override: 'hard', sound: true });
    expect(parseAssessSettings({ override: 'impossible' }).override).toBe('auto');
  });
});
