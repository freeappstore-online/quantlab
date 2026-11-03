export type AssessId =
  | 'blockfit'
  | 'typohunt'
  | 'bubbleorder'
  | 'sumcompare'
  | 'mirrorturn'
  | 'shortestroute'
  | 'judgement';

export const ASSESS_IDS: readonly AssessId[] = ['blockfit', 'typohunt', 'bubbleorder', 'sumcompare', 'mirrorturn', 'shortestroute', 'judgement'];

export type LevelOverride = 'auto' | 'easy' | 'medium' | 'hard';

export interface AssessSettings {
  /** Off means study mode: no countdown and nothing ends the run early. */
  timerOn: boolean;
  override: LevelOverride;
  sound: boolean;
}

export interface GameResult {
  /** Numeric score used for history and personal bests. */
  score: number;
  /** How the score is shown to the user, e.g. "6.4" or "71%". */
  scoreText: string;
  correct: number;
  attempted: number;
  avgItemMs: number | null;
  /** Extra lines shown on the results screen. */
  detail?: string[];
}

export interface AssessRecord {
  id: string;
  game: AssessId;
  at: number;
  score: number;
  scoreText: string;
  correct: number;
  attempted: number;
  avgItemMs: number | null;
  override: LevelOverride;
  /** Played as part of a Full Assessment run. */
  full: boolean;
}

export const DEFAULT_ASSESS_SETTINGS: AssessSettings = { timerOn: true, override: 'auto', sound: false };
