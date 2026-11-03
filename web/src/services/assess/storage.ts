import { ASSESS_IDS, DEFAULT_ASSESS_SETTINGS, type AssessId, type AssessRecord, type AssessSettings, type LevelOverride } from './types';

// Everything the assessment trainer keeps in the browser. Nothing leaves the device.
const RESULTS_KEY = 'quantlab:v1:assess-results';
const SETTINGS_KEY = 'quantlab:v1:assess-settings';

export const MAX_ASSESS_RESULTS = 400;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isGame = (v: unknown): v is AssessId => typeof v === 'string' && (ASSESS_IDS as readonly string[]).includes(v);
const isOverride = (v: unknown): v is LevelOverride => v === 'auto' || v === 'easy' || v === 'medium' || v === 'hard';

export function parseRecord(v: unknown): AssessRecord | null {
  if (!isObject(v)) return null;
  if (typeof v.id !== 'string' || !isGame(v.game) || !isNum(v.at) || !isNum(v.score)) return null;
  if (typeof v.scoreText !== 'string' || !isNum(v.correct) || !isNum(v.attempted)) return null;
  const avg = v.avgItemMs === null ? null : isNum(v.avgItemMs) ? v.avgItemMs : undefined;
  if (avg === undefined) return null;
  return {
    id: v.id,
    game: v.game,
    at: v.at,
    score: v.score,
    scoreText: v.scoreText,
    correct: v.correct,
    attempted: v.attempted,
    avgItemMs: avg,
    override: isOverride(v.override) ? v.override : 'auto',
    full: v.full === true,
  };
}

export function parseAssessSettings(raw: unknown): AssessSettings {
  if (!isObject(raw)) return { ...DEFAULT_ASSESS_SETTINGS };
  return {
    timerOn: typeof raw.timerOn === 'boolean' ? raw.timerOn : DEFAULT_ASSESS_SETTINGS.timerOn,
    override: isOverride(raw.override) ? raw.override : DEFAULT_ASSESS_SETTINGS.override,
    sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_ASSESS_SETTINGS.sound,
  };
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadAssessResults(): AssessRecord[] {
  const raw = read(RESULTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseRecord).filter((r): r is AssessRecord => r !== null).slice(-MAX_ASSESS_RESULTS);
}

export const saveAssessResults = (records: readonly AssessRecord[]): boolean => write(RESULTS_KEY, records.slice(-MAX_ASSESS_RESULTS));
export const loadAssessSettings = (): AssessSettings => parseAssessSettings(read(SETTINGS_KEY));
export const saveAssessSettings = (s: AssessSettings): boolean => write(SETTINGS_KEY, s);

export function clearAssessResults(): void {
  try {
    window.localStorage.removeItem(RESULTS_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

export function exportAssessJson(records: readonly AssessRecord[], settings: AssessSettings): string {
  return JSON.stringify({ app: 'QuantLab assessment trainer', exportedAt: new Date().toISOString(), settings, results: records }, null, 2);
}

/** Personal best score for a game, or null if it has not been played. */
export function bestScore(records: readonly AssessRecord[], game: AssessId): number | null {
  const scores = records.filter((r) => r.game === game).map((r) => r.score);
  return scores.length === 0 ? null : Math.max(...scores);
}
