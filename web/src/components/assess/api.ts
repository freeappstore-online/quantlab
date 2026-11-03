import type { ComponentType, ReactNode } from 'react';
import type { SoundKind } from '../../services/assess/sound';
import type { AssessId, AssessSettings, GameResult } from '../../services/assess/types';

/** What a running game tells the shared top bar. */
export interface Hud {
  /** e.g. "Round 3 of 9". */
  round: string;
  /** Game-specific score widget shown on the right. */
  widget?: ReactNode;
}

/** What the shared frame gives each game. */
export interface FrameApi {
  phase: 'tutorial' | 'test';
  seed: number;
  settings: AssessSettings;
  /** True when a countdown is running for this game (test phase, timer on). */
  timed: boolean;
  /** Set once the countdown reaches zero. Cleared by resetTimer. */
  expired: boolean;
  /** Restart the countdown from its full duration (used by games with a timer per round). */
  resetTimer: () => void;
  /** Freeze or resume the countdown, e.g. while a review screen is open. */
  setTimerRunning: (running: boolean) => void;
  setHud: (hud: Hud) => void;
  /** End the run with a result. Only the first call counts. */
  finish: (result: GameResult) => void;
  sound: (kind: SoundKind) => void;
  /** Difficulty 0..1 for item `index` of `total`, honouring the difficulty override. */
  level: (index: number, total: number) => number;
}

export interface GameDef {
  id: AssessId;
  name: string;
  /** One-sentence goal shown on the intro screen. */
  goal: string;
  /** Short skill label, e.g. "Spatial problem solving". */
  skill: string;
  /** Plain-language format line, e.g. "9 rounds in 3 minutes". */
  format: string;
  /** Seconds on the countdown, or null when the game is untimed. */
  timerSeconds: number | null;
  Component: ComponentType<{ api: FrameApi }>;
}
