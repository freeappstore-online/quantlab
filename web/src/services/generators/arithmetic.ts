import type { Difficulty, Question } from '../../types';
import { fmt } from '../format';
import { int, pick, type Rng } from '../rng';

interface SprintRanges {
  add: [number, number];
  a: [number, number];
  b: [number, number];
}

const RANGES: Record<Difficulty, SprintRanges> = {
  easy: { add: [2, 30], a: [2, 9], b: [2, 9] },
  medium: { add: [2, 100], a: [2, 12], b: [2, 100] },
  hard: { add: [100, 999], a: [11, 25], b: [11, 99] },
};

function make(prompt: string, answer: number, kind: string): Question {
  return { prompt, answer, tolerance: 0, kind, explain: `${prompt} = ${fmt(answer)}` };
}

/** Classic sprint: addition, subtraction (reverse of addition), multiplication, division (reverse of multiplication). */
export function sprintQuestion(rng: Rng, difficulty: Difficulty): Question {
  const r = RANGES[difficulty];
  switch (pick(rng, ['add', 'sub', 'mul', 'div'] as const)) {
    case 'add': {
      const a = int(rng, ...r.add);
      const b = int(rng, ...r.add);
      return make(`${fmt(a)} + ${fmt(b)}`, a + b, 'add');
    }
    case 'sub': {
      const a = int(rng, ...r.add);
      const b = int(rng, ...r.add);
      return make(`${fmt(a + b)} − ${fmt(a)}`, b, 'sub');
    }
    case 'mul': {
      const a = int(rng, ...r.a);
      const b = int(rng, ...r.b);
      return make(`${fmt(a)} × ${fmt(b)}`, a * b, 'mul');
    }
    case 'div': {
      const a = int(rng, ...r.a);
      const b = int(rng, ...r.b);
      return make(`${fmt(a * b)} ÷ ${fmt(a)}`, b, 'div');
    }
  }
}
