import type { Difficulty, Question } from '../../types';
import { fmt, round6 } from '../format';
import { int, pick, type Rng } from '../rng';

type Builder = (rng: Rng) => Question;

const pct = (tolerance: number): string => `Within ${Math.round(tolerance * 1000) / 10}%`;

function exactish(prompt: string, answer: number, kind: string, explain: string): Question {
  const oneDecimal = Math.abs(answer * 10 - Math.round(answer * 10)) < 1e-6 && Math.abs(answer - Math.round(answer)) > 1e-6;
  return {
    prompt,
    answer: round6(answer),
    tolerance: 0.005,
    kind,
    hint: oneDecimal ? 'Give to 1 decimal place' : undefined,
    explain,
  };
}

function approx(prompt: string, answer: number, tolerance: number, kind: string, explain: string): Question {
  return { prompt, answer: round6(answer), tolerance, kind, hint: pct(tolerance), explain };
}

function percentOf(difficulty: Difficulty): Builder {
  return (rng) => {
    let p: number;
    let n: number;
    if (difficulty === 'easy') {
      p = pick(rng, [5, 10, 20, 25, 50, 75]);
      n = int(rng, 1, 25) * 20;
    } else if (difficulty === 'medium') {
      p = int(rng, 2, 98);
      n = int(rng, 2, 60) * 20;
    } else {
      p = pick(rng, [2.5, 8.5, 12.5, 15, 17.5, 35, 37.5, 45, 62.5, 65, 85, 87.5]);
      n = int(rng, 1, 40) * 40;
    }
    return exactish(`${fmt(p)}% of ${fmt(n)}`, (p * n) / 100, 'pct-of', `${fmt(p)}% of ${fmt(n)} = ${fmt((p * n) / 100)}.`);
  };
}

function percentChange(difficulty: Difficulty): Builder {
  return (rng) => {
    let p: number;
    let a: number;
    if (difficulty === 'easy') {
      p = pick(rng, [10, 20, 25, 50]) * pick(rng, [1, -1]);
      a = int(rng, 1, 20) * 20;
    } else if (difficulty === 'medium') {
      p = int(rng, 1, 12) * 5 * pick(rng, [1, -1]);
      a = int(rng, 1, 20) * 20;
    } else {
      p = pick(rng, [2.5, 7.5, 12.5, 17.5, 22.5]) * pick(rng, [1, -1]);
      a = int(rng, 1, 15) * 40;
    }
    const b = a + (a * p) / 100;
    return {
      prompt: `From ${fmt(a)} to ${fmt(b)}: % change?`,
      answer: p,
      tolerance: 0.01,
      kind: 'pct-change',
      hint: 'Negative if it falls',
      explain: `(${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} = ${fmt(p)}%.`,
    };
  };
}

function percentReverse(difficulty: Difficulty): Builder {
  return (rng) => {
    const hard = difficulty === 'hard';
    const p = hard ? pick(rng, [12.5, 15, 30, 35, 40, 60, 75]) : pick(rng, [10, 20, 25, 50]);
    const rise = pick(rng, [true, false]);
    const a = hard ? int(rng, 1, 15) * 40 : int(rng, 2, 25) * 20;
    const b = rise ? a + (a * p) / 100 : a - (a * p) / 100;
    return exactish(
      `After a ${fmt(p)}% ${rise ? 'rise' : 'fall'} the price is ${fmt(b)}. Original price?`,
      a,
      'pct-reverse',
      `Original × ${fmt(rise ? 1 + p / 100 : 1 - p / 100)} = ${fmt(b)}, so original = ${fmt(a)}.`,
    );
  };
}

const FRACTIONS: Record<Difficulty, readonly [number, number][]> = {
  easy: [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10]],
  medium: [[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [2, 9], [1, 12], [7, 8], [1, 16]],
  hard: [[1, 7], [2, 7], [3, 7], [1, 11], [1, 13], [5, 12], [7, 12], [1, 14], [3, 16], [11, 12]],
};

function fractionPercent(difficulty: Difficulty): Builder {
  return (rng) => {
    const [n, d] = pick(rng, FRACTIONS[difficulty]);
    const value = (n / d) * 100;
    return {
      prompt: `${n}/${d} as a percentage`,
      answer: round6(value),
      // Rejects a whole-number guess for 1/3 but accepts the 1 d.p. value for every fraction in the pools.
      tolerance: 0.009,
      kind: 'frac-pct',
      hint: Number.isInteger(value) ? undefined : 'Give to 1 decimal place',
      explain: `${n}/${d} = ${fmt(Math.round(value * 100) / 100)}%.`,
    };
  };
}

function estimateMultiply(difficulty: Difficulty): Builder {
  return (rng) => {
    const tol = difficulty === 'hard' ? 0.03 : 0.05;
    const a = difficulty === 'easy' ? int(rng, 11, 99) : int(rng, 101, difficulty === 'hard' ? 999 : 499);
    const b = difficulty === 'hard' ? int(rng, 101, 999) : int(rng, 11, 99);
    return approx(`${fmt(a)} × ${fmt(b)} ≈`, a * b, tol, 'est-mul', `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}.`);
  };
}

function estimateDivide(difficulty: Difficulty): Builder {
  return (rng) => {
    const a = int(rng, 1000, difficulty === 'hard' ? 999_999 : 99_999);
    const b = int(rng, 11, difficulty === 'hard' ? 999 : 99);
    return approx(`${fmt(a)} ÷ ${fmt(b)} ≈`, a / b, 0.05, 'est-div', `${fmt(a)} ÷ ${fmt(b)} = ${fmt(Math.round((a / b) * 100) / 100)}.`);
  };
}

function squareRoot(difficulty: Difficulty): Builder {
  return (rng) => {
    const n = difficulty === 'hard' ? int(rng, 1000, 99_999) : int(rng, 20, 999);
    const tol = difficulty === 'hard' ? 0.02 : 0.03;
    return approx(`√${fmt(n)} ≈`, Math.sqrt(n), tol, 'sqrt', `√${fmt(n)} = ${fmt(Math.round(Math.sqrt(n) * 100) / 100)}.`);
  };
}

const compound: Builder = (rng) => {
  const principal = pick(rng, [100, 500, 1000, 2000]);
  const rate = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
  const years = int(rng, 2, 6);
  const value = principal * (1 + rate / 100) ** years;
  return approx(
    `${fmt(principal)} grows ${rate}% a year for ${years} years. Value ≈`,
    value,
    0.01,
    'compound',
    `${fmt(principal)} × ${fmt(1 + rate / 100)}^${years} = ${fmt(Math.round(value * 100) / 100)}.`,
  );
};

const log2: Builder = (rng) => {
  const n = int(rng, 100, 5000);
  return approx(`log₂(${fmt(n)}) ≈`, Math.log2(n), 0.03, 'log', `log₂(${fmt(n)}) = ${fmt(Math.round(Math.log2(n) * 100) / 100)}.`);
};

function pool(difficulty: Difficulty): Builder[] {
  switch (difficulty) {
    case 'easy':
      return [percentOf(difficulty), percentChange(difficulty), fractionPercent(difficulty), estimateMultiply(difficulty)];
    case 'medium':
      return [
        percentOf(difficulty), percentChange(difficulty), percentReverse(difficulty), fractionPercent(difficulty),
        estimateMultiply(difficulty), estimateDivide(difficulty), squareRoot(difficulty),
      ];
    case 'hard':
      return [
        percentOf(difficulty), percentChange(difficulty), percentReverse(difficulty), fractionPercent(difficulty),
        estimateMultiply(difficulty), estimateDivide(difficulty), squareRoot(difficulty), compound, log2,
      ];
  }
}

const POOLS: Record<Difficulty, Builder[]> = {
  easy: pool('easy'),
  medium: pool('medium'),
  hard: pool('hard'),
};

export function estimationQuestion(rng: Rng, difficulty: Difficulty): Question {
  return pick(rng, POOLS[difficulty])(rng);
}
