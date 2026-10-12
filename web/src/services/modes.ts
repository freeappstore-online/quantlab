import type { Difficulty, ModeId, Question } from '../types';
import { MODE_IDS } from '../types';
import { sprintQuestion } from './generators/arithmetic';
import { eightyQuestion } from './generators/eighty';
import { estimationQuestion } from './generators/estimation';
import { sequenceQuestion } from './generators/sequences';
import type { Rng } from './rng';

export interface ModeConfig {
  id: ModeId;
  name: string;
  tagline: string;
  rules: string[];
  durationSec: number;
  /** null means open-ended until the clock runs out. */
  questionLimit: number | null;
  generate: (rng: Rng, difficulty: Difficulty) => Question;
}

export const MODES: Record<ModeId, ModeConfig> = {
  sprint: {
    id: 'sprint',
    name: 'Arithmetic Sprint',
    tagline: 'Two minutes of rapid-fire +, −, × and ÷. The classic mental-maths benchmark.',
    rules: [
      '120 seconds. Answer as many as you can.',
      'A correct answer moves on by itself, no Enter needed.',
      'Press Enter on a blank answer to skip.',
      'Score is the number of correct answers.',
    ],
    durationSec: 120,
    questionLimit: null,
    generate: sprintQuestion,
  },
  eighty: {
    id: 'eighty',
    name: '80 in 8',
    tagline: 'Eighty mixed questions in eight minutes, the pace of trading-firm online tests.',
    rules: [
      '80 questions in 8 minutes, so about 6 seconds each.',
      'Harder levels add decimals and negative numbers.',
      'A correct answer moves on by itself. Enter on a blank answer skips.',
      'Score is the number of correct answers out of 80.',
    ],
    durationSec: 480,
    questionLimit: 80,
    generate: eightyQuestion,
  },
  sequences: {
    id: 'sequences',
    name: 'Number Sequences',
    tagline: 'Spot the rule and give the next term.',
    rules: [
      '15 sequences in 5 minutes.',
      'Exact answers only.',
      'The review afterwards explains the rule behind every miss.',
      'Score is the number of correct answers out of 15.',
    ],
    durationSec: 300,
    questionLimit: 15,
    generate: sequenceQuestion,
  },
  estimation: {
    id: 'estimation',
    name: 'Percentages & Estimation',
    tagline: 'Percent change, fractions, roots and fast approximations.',
    rules: [
      '20 questions in 5 minutes. Press Enter to submit.',
      'Estimates count as correct inside the tolerance shown under the question.',
      'Percentages should be exact, or to 1 decimal place where asked.',
      'Score is the number of correct answers out of 20.',
    ],
    durationSec: 300,
    questionLimit: 20,
    generate: estimationQuestion,
  },
};

export const MODE_LIST: ModeConfig[] = MODE_IDS.map((id) => MODES[id]);

export function isModeId(value: string): value is ModeId {
  return (MODE_IDS as readonly string[]).includes(value);
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Readable names for the weak-spots table. */
export const KIND_LABELS: Record<string, string> = {
  add: 'Addition',
  sub: 'Subtraction',
  mul: 'Multiplication',
  div: 'Division',
  arithmetic: 'Arithmetic sequences',
  geometric: 'Geometric sequences',
  polynomial: 'Growing gaps',
  recurrence: 'Recurrence rules',
  powers: 'Squares, cubes, powers',
  special: 'Primes and factorials',
  interleaved: 'Interleaved sequences',
  'pct-of': 'Percent of a number',
  'pct-change': 'Percent change',
  'pct-reverse': 'Reverse percentages',
  'frac-pct': 'Fractions to percent',
  'est-mul': 'Estimating products',
  'est-div': 'Estimating quotients',
  sqrt: 'Square roots',
  compound: 'Compound growth',
  log: 'Logarithms',
};
