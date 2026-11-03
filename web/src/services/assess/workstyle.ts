import { shuffle } from './util';
import type { Rng } from '../rng';

export type Trait = 'teamwork' | 'drive' | 'analytical' | 'flexibility' | 'openness';

export const TRAIT_LABEL: Record<Trait, string> = {
  teamwork: 'Teamwork',
  drive: 'Drive',
  analytical: 'Analytical thinking',
  flexibility: 'Flexibility',
  openness: 'Openness to change',
};

export interface Statement {
  id: string;
  trait: Trait;
  text: string;
  /** Id of the statement that says the opposite. */
  pair: string;
  /** True for the negatively worded half of the pair. */
  reverse: boolean;
}

/** Each row is a statement and its opposite, so contradictory answers can be found. */
const PAIRS: [Trait, string, string][] = [
  ['teamwork', 'I enjoy working closely with other people to solve a problem.', 'I prefer to work alone rather than as part of a team.'],
  ['teamwork', 'I share credit generously when a project goes well.', 'I would rather my own work stood out than the team’s.'],
  ['teamwork', 'I ask colleagues for help when I am stuck.', 'I would rather struggle on my own than ask for help.'],
  ['drive', 'I set challenging goals for myself.', 'I am content to do just enough to meet expectations.'],
  ['drive', 'I keep going when a task becomes difficult.', 'I tend to give up when something is hard.'],
  ['drive', 'I always aim to finish what I start.', 'I often leave things unfinished.'],
  ['analytical', 'I check the numbers before I draw a conclusion.', 'I usually trust my first impression over the data.'],
  ['analytical', 'I like breaking a problem into smaller parts.', 'I find it frustrating to work through detail.'],
  ['analytical', 'I never make an important decision without looking at the evidence.', 'I often make important decisions without looking at the evidence.'],
  ['flexibility', 'I adapt quickly when plans change.', 'I get unsettled when plans change.'],
  ['flexibility', 'I can switch between tasks easily.', 'I find it difficult to switch between tasks.'],
  ['flexibility', 'I am always happy to change my approach when someone suggests a better way.', 'I prefer to stick with my approach even when others suggest alternatives.'],
  ['openness', 'I welcome new ways of working.', 'I prefer to keep processes the way they are.'],
  ['openness', 'I enjoy learning new tools and methods.', 'I avoid new tools if I can.'],
  ['openness', 'I always look for ways to improve how things are done.', 'I rarely think about improving how things are done.'],
];

export const STATEMENTS: Statement[] = PAIRS.flatMap(([trait, a, b], i): Statement[] => [
  { id: `p${i}a`, trait, text: a, pair: `p${i}b`, reverse: false },
  { id: `p${i}b`, trait, text: b, pair: `p${i}a`, reverse: true },
]);

export const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'] as const;

const ABSOLUTE = /\b(always|never|all|every|completely|none)\b/i;
export const hasAbsoluteWording = (text: string): boolean => ABSOLUTE.test(text);

/** Chooses `pairs` pairs. The two halves of a pair are asked in separate passes so they are never next to each other. */
export function chooseStatements(rng: Rng, pairs: number): Statement[] {
  const ids = shuffle(rng, PAIRS.map((_, i) => i)).slice(0, pairs);
  const firstHalf = ids.map((i) => STATEMENTS[i * 2 + (rng() < 0.5 ? 0 : 1)]);
  const secondHalf = firstHalf.map((st) => STATEMENTS.find((t) => t.id === st.pair)!);
  return [...shuffle(rng, firstHalf), ...shuffle(rng, secondHalf)];
}

export interface Conflict {
  a: Statement;
  b: Statement;
  answerA: number;
  answerB: number;
}

/** Answers are 1 to 5. A statement and its opposite should add up to 6; a gap of 3 or more is flagged. */
export function findConflicts(statements: readonly Statement[], answers: Readonly<Record<string, number>>): Conflict[] {
  const out: Conflict[] = [];
  for (const s of statements) {
    if (s.reverse) continue;
    const other = statements.find((t) => t.id === s.pair);
    const a = answers[s.id];
    const b = other ? answers[other.id] : undefined;
    if (!other || a === undefined || b === undefined) continue;
    if (Math.abs(a + b - 6) >= 3) out.push({ a: s, b: other, answerA: a, answerB: b });
  }
  return out;
}

/** Statements with absolute wording that were answered at an extreme (1 or 5). */
export function absoluteExtremes(statements: readonly Statement[], answers: Readonly<Record<string, number>>): Statement[] {
  return statements.filter((s) => hasAbsoluteWording(s.text) && (answers[s.id] === 1 || answers[s.id] === 5));
}

export function pairCount(statements: readonly Statement[]): number {
  return statements.filter((s) => !s.reverse && statements.some((t) => t.id === s.pair)).length;
}
