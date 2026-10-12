export type ModeId = 'sprint' | 'eighty' | 'sequences' | 'estimation';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type KeypadSetting = 'auto' | 'on' | 'off';

export const MODE_IDS: readonly ModeId[] = ['sprint', 'eighty', 'sequences', 'estimation'];
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export interface Question {
  prompt: string;
  answer: number;
  /** Relative tolerance. 0 means the answer must match exactly. */
  tolerance: number;
  /** Category used for the weak-spots breakdown, see KIND_LABELS. */
  kind: string;
  hint?: string;
  explain?: string;
}

export interface AnswerRecord {
  question: Question;
  /** null when the question was skipped. */
  given: number | null;
  correct: boolean;
  ms: number;
}

export interface KindStat {
  attempted: number;
  correct: number;
  /** Total time spent on this kind, in ms. */
  ms: number;
}

export interface Session {
  id: string;
  mode: ModeId;
  difficulty: Difficulty;
  startedAt: number;
  durationMs: number;
  score: number;
  attempted: number;
  correct: number;
  avgCorrectMs: number | null;
  bestStreak: number;
  byKind: Record<string, KindStat>;
}

export interface Settings {
  autoAdvance: boolean;
  keypad: KeypadSetting;
  lastDifficulty: Record<ModeId, Difficulty>;
}
