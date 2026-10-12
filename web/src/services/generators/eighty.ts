import type { Difficulty, Question } from '../../types';
import { fmt, fmtOperand, round6 } from '../format';
import { chance, int, pick, type Rng } from '../rng';

interface Config {
  add: [number, number];
  /** Chance an add/subtract operand carries one decimal place. */
  addDecimal: number;
  /** Chance an add/subtract operand is negative. */
  addNegative: number;
  mulA: [number, number];
  mulB: [number, number];
  mulDecimal: number;
  divisor: [number, number];
  quotient: [number, number];
  /** Chance the quotient has one decimal place. */
  divDecimal: number;
}

const CONFIG: Record<Difficulty, Config> = {
  easy: {
    add: [10, 99], addDecimal: 0, addNegative: 0,
    mulA: [2, 12], mulB: [2, 15], mulDecimal: 0,
    divisor: [2, 12], quotient: [2, 15], divDecimal: 0,
  },
  medium: {
    add: [50, 999], addDecimal: 0.15, addNegative: 0.05,
    mulA: [6, 30], mulB: [3, 19], mulDecimal: 0.1,
    divisor: [3, 19], quotient: [5, 60], divDecimal: 0.1,
  },
  hard: {
    add: [100, 1999], addDecimal: 0.3, addNegative: 0.15,
    mulA: [12, 99], mulB: [6, 49], mulDecimal: 0.25,
    divisor: [6, 49], quotient: [10, 99], divDecimal: 0.3,
  },
};

/** Decimal factors that never push a product past two decimal places. */
const FRIENDLY_DECIMALS = [0.25, 0.5, 0.75, 1.5, 2.5, 4.5, 7.5, 12.5] as const;

function make(prompt: string, answer: number, kind: string): Question {
  const rounded = round6(answer);
  return { prompt, answer: rounded, tolerance: 0, kind, explain: `${prompt} = ${fmt(rounded)}` };
}

function operand(rng: Rng, c: Config): number {
  let v = int(rng, ...c.add);
  if (chance(rng, c.addDecimal)) v += int(rng, 1, 9) / 10;
  if (chance(rng, c.addNegative)) v = -v;
  return round6(v);
}

/** Mixed operations at the pace of an 80-questions-in-8-minutes online test. */
export function eightyQuestion(rng: Rng, difficulty: Difficulty): Question {
  const c = CONFIG[difficulty];
  switch (pick(rng, ['add', 'sub', 'mul', 'div'] as const)) {
    case 'add': {
      const a = operand(rng, c);
      const b = operand(rng, c);
      return make(`${fmtOperand(a)} + ${fmtOperand(b)}`, a + b, 'add');
    }
    case 'sub': {
      const a = operand(rng, c);
      const b = operand(rng, c);
      return make(`${fmtOperand(a)} − ${fmtOperand(b)}`, a - b, 'sub');
    }
    case 'mul': {
      let a: number = int(rng, ...c.mulA);
      const b = int(rng, ...c.mulB);
      if (chance(rng, c.mulDecimal)) a = pick(rng, FRIENDLY_DECIMALS);
      return make(chance(rng, 0.5) ? `${fmt(a)} × ${fmt(b)}` : `${fmt(b)} × ${fmt(a)}`, a * b, 'mul');
    }
    case 'div': {
      const d = int(rng, ...c.divisor);
      const q = chance(rng, c.divDecimal)
        ? int(rng, c.quotient[0] * 10, c.quotient[1] * 10) / 10
        : int(rng, ...c.quotient);
      return make(`${fmt(d * q)} ÷ ${fmt(d)}`, q, 'div');
    }
  }
}
