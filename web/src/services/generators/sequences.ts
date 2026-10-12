import type { Difficulty, Question } from '../../types';
import { fmt } from '../format';
import { chance, int, pick, type Rng } from '../rng';

/** Terms with the answer last, plus the rule that explains them. */
interface Draft {
  terms: number[];
  rule: string;
  kind: string;
}

type Builder = (rng: Rng) => Draft;

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

const range = (n: number, f: (i: number) => number): number[] => Array.from({ length: n }, (_, i) => f(i));

function arithmetic(allowNegative: boolean): Builder {
  return (rng) => {
    const a = int(rng, 1, 30);
    const step = int(rng, 2, 12) * (allowNegative && chance(rng, 0.35) ? -1 : 1);
    return {
      terms: range(7, (i) => a + step * i),
      rule: step > 0 ? `Add ${step} each time.` : `Subtract ${-step} each time.`,
      kind: 'arithmetic',
    };
  };
}

function geometric(maxRatio: number): Builder {
  return (rng) => {
    const a = int(rng, 1, 5);
    const r = int(rng, 2, maxRatio);
    return { terms: range(6, (i) => a * r ** i), rule: `Multiply by ${r} each time.`, kind: 'geometric' };
  };
}

const squares: Builder = (rng) => {
  const k = int(rng, 1, 9);
  return { terms: range(7, (i) => (k + i) ** 2), rule: 'Consecutive perfect squares.', kind: 'powers' };
};

const cubes: Builder = (rng) => {
  const k = int(rng, 1, 5);
  return { terms: range(6, (i) => (k + i) ** 3), rule: 'Consecutive perfect cubes.', kind: 'powers' };
};

const triangular: Builder = (rng) => {
  const k = int(rng, 1, 6);
  return {
    terms: range(7, (i) => ((k + i) * (k + i + 1)) / 2),
    rule: 'Triangular numbers: the gaps grow by 1 each time.',
    kind: 'polynomial',
  };
};

/** Differences form an arithmetic sequence. */
function quadratic(maxStart: number): Builder {
  return (rng) => {
    const start = int(rng, 1, maxStart);
    const d0 = int(rng, 1, 5);
    const e = int(rng, 1, 4);
    const terms = [start];
    for (let i = 0; i < 6; i++) terms.push(terms[i] + d0 + e * i);
    return {
      terms,
      rule: `The gaps grow by ${e} each time: +${d0}, +${d0 + e}, +${d0 + 2 * e}, …`,
      kind: 'polynomial',
    };
  };
}

const fibonacciLike: Builder = (rng) => {
  const t = [int(rng, 1, 6), int(rng, 1, 6)];
  for (let i = 2; i < 8; i++) t.push(t[i - 1] + t[i - 2]);
  return { terms: t, rule: 'Each term is the sum of the two before it.', kind: 'recurrence' };
};

const alternating: Builder = (rng) => {
  const a = int(rng, 3, 9);
  const b = int(rng, 1, a - 1);
  const start = int(rng, 5, 30);
  const terms = [start];
  for (let i = 0; i < 7; i++) terms.push(terms[i] + (i % 2 === 0 ? a : -b));
  return { terms, rule: `Alternately add ${a} and subtract ${b}.`, kind: 'recurrence' };
};

const multiplyAdd: Builder = (rng) => {
  const r = int(rng, 2, 3);
  const c = pick(rng, [-3, -2, -1, 1, 2, 3]);
  const terms = [int(rng, 2, 5)];
  for (let i = 0; i < 5; i++) terms.push(terms[i] * r + c);
  return {
    terms,
    rule: `Multiply by ${r}, then ${c > 0 ? 'add' : 'subtract'} ${Math.abs(c)}.`,
    kind: 'recurrence',
  };
};

const primes: Builder = (rng) => {
  const s = int(rng, 0, 12);
  return { terms: PRIMES.slice(s, s + 7), rule: 'Consecutive prime numbers.', kind: 'special' };
};

const interleaved: Builder = (rng) => {
  const a = int(rng, 1, 10);
  const d1 = int(rng, 2, 6);
  const b = int(rng, 25, 40);
  const d2 = -int(rng, 2, 5);
  const terms = range(8, (i) => (i % 2 === 0 ? a + d1 * (i / 2) : b + d2 * ((i - 1) / 2)));
  return {
    terms,
    rule: `Two sequences woven together: odd positions go up by ${d1}, even positions go down by ${-d2}.`,
    kind: 'interleaved',
  };
};

const squareGaps: Builder = (rng) => {
  const terms = [int(rng, 1, 10)];
  for (let i = 0; i < 6; i++) terms.push(terms[i] + (i + 1) ** 2);
  return { terms, rule: 'The gaps are consecutive squares: +1, +4, +9, +16, …', kind: 'polynomial' };
};

const powersOfTwoShifted: Builder = (rng) => {
  const c = pick(rng, [-3, -2, -1, 1, 2, 3]);
  const k = int(rng, 1, 3);
  return {
    terms: range(7, (i) => 2 ** (k + i) + c),
    rule: `Powers of 2, ${c > 0 ? 'plus' : 'minus'} ${Math.abs(c)}.`,
    kind: 'powers',
  };
};

const factorials: Builder = (rng) => {
  const k = int(rng, 1, 3);
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  return { terms: range(6, (i) => fact(k + i)), rule: 'Factorials: each term is the previous one times the next whole number.', kind: 'special' };
};

const POOLS: Record<Difficulty, Builder[]> = {
  easy: [arithmetic(false), arithmetic(false), geometric(2), squares, alternating],
  medium: [arithmetic(true), geometric(4), squares, cubes, triangular, quadratic(10), fibonacciLike, alternating, multiplyAdd, primes],
  hard: [multiplyAdd, interleaved, squareGaps, fibonacciLike, cubes, quadratic(40), powersOfTwoShifted, factorials, primes],
};

const MAX_TERM = 200_000;

export function sequenceQuestion(rng: Rng, difficulty: Difficulty): Question {
  let draft: Draft;
  let tries = 0;
  do {
    draft = pick(rng, POOLS[difficulty])(rng);
    tries++;
  } while (draft.terms.some((t) => Math.abs(t) > MAX_TERM) && tries < 20);

  const shown = draft.terms.slice(0, -1);
  const answer = draft.terms[draft.terms.length - 1];
  return {
    prompt: `${shown.map((t) => fmt(t)).join(', ')}, ?`,
    answer,
    tolerance: 0,
    kind: draft.kind,
    hint: 'What comes next?',
    explain: `${draft.rule} Next term: ${fmt(answer)}.`,
  };
}
