import type { Difficulty, KindStat, KeypadSetting, ModeId, Session, Settings } from '../types';
import { DIFFICULTIES, MODE_IDS } from '../types';

// Everything QuantLab keeps in the browser lives under these two keys. Nothing leaves the device.
const SESSIONS_KEY = 'quantlab:v1:sessions';
const SETTINGS_KEY = 'quantlab:v1:settings';

export const MAX_SESSIONS = 300;

export const DEFAULT_SETTINGS: Settings = {
  autoAdvance: true,
  keypad: 'auto',
  lastDifficulty: { sprint: 'medium', eighty: 'medium', sequences: 'medium', estimation: 'medium' },
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isMode = (v: unknown): v is ModeId => typeof v === 'string' && (MODE_IDS as readonly string[]).includes(v);
const isDifficulty = (v: unknown): v is Difficulty => typeof v === 'string' && (DIFFICULTIES as readonly string[]).includes(v);

function parseKindStat(v: unknown): KindStat | null {
  if (!isObject(v) || !isNum(v.attempted) || !isNum(v.correct) || !isNum(v.ms)) return null;
  return { attempted: v.attempted, correct: v.correct, ms: v.ms };
}

export function parseSession(v: unknown): Session | null {
  if (!isObject(v)) return null;
  if (typeof v.id !== 'string' || !isMode(v.mode) || !isDifficulty(v.difficulty)) return null;
  if (!isNum(v.startedAt) || !isNum(v.durationMs) || !isNum(v.score) || !isNum(v.attempted) || !isNum(v.correct)) return null;
  if (!isNum(v.bestStreak)) return null;
  const avg = v.avgCorrectMs === null ? null : isNum(v.avgCorrectMs) ? v.avgCorrectMs : undefined;
  if (avg === undefined) return null;
  const byKind: Record<string, KindStat> = {};
  if (isObject(v.byKind)) {
    for (const [kind, raw] of Object.entries(v.byKind)) {
      const stat = parseKindStat(raw);
      if (stat) byKind[kind] = stat;
    }
  }
  return {
    id: v.id,
    mode: v.mode,
    difficulty: v.difficulty,
    startedAt: v.startedAt,
    durationMs: v.durationMs,
    score: v.score,
    attempted: v.attempted,
    correct: v.correct,
    avgCorrectMs: avg,
    bestStreak: v.bestStreak,
    byKind,
  };
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSessions(): Session[] {
  const raw = readJson(SESSIONS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseSession).filter((s): s is Session => s !== null).slice(-MAX_SESSIONS);
}

export function saveSessions(sessions: readonly Session[]): boolean {
  return writeJson(SESSIONS_KEY, sessions.slice(-MAX_SESSIONS));
}

export function loadSettings(): Settings {
  const raw = readJson(SETTINGS_KEY);
  if (!isObject(raw)) return DEFAULT_SETTINGS;
  const keypad: KeypadSetting = raw.keypad === 'on' || raw.keypad === 'off' || raw.keypad === 'auto' ? raw.keypad : DEFAULT_SETTINGS.keypad;
  const last = { ...DEFAULT_SETTINGS.lastDifficulty };
  if (isObject(raw.lastDifficulty)) {
    for (const id of MODE_IDS) {
      const d = raw.lastDifficulty[id];
      if (isDifficulty(d)) last[id] = d;
    }
  }
  return {
    autoAdvance: typeof raw.autoAdvance === 'boolean' ? raw.autoAdvance : DEFAULT_SETTINGS.autoAdvance,
    keypad,
    lastDifficulty: last,
  };
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(SETTINGS_KEY, settings);
}

export function clearAll(): boolean {
  try {
    window.localStorage.removeItem(SESSIONS_KEY);
    window.localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch {
    return false;
  }
}

export function exportJson(sessions: readonly Session[], settings: Settings): string {
  return JSON.stringify({ app: 'QuantLab', exportedAt: new Date().toISOString(), settings, sessions }, null, 2);
}
