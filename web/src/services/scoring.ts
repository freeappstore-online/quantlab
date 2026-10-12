import type { AnswerRecord, Difficulty, KindStat, ModeId, Question, Session } from '../types';

export function isCorrect(question: Question, given: number | null): boolean {
  if (given === null || !Number.isFinite(given)) return false;
  const diff = Math.abs(given - question.answer);
  if (question.tolerance === 0) return diff < 1e-9;
  return diff <= question.tolerance * Math.abs(question.answer) + 1e-9;
}

/** Turns the raw text of the answer box into a number, or null if it is empty or incomplete. */
export function parseAnswer(raw: string): number | null {
  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function bestStreak(answers: readonly AnswerRecord[]): number {
  let best = 0;
  let run = 0;
  for (const a of answers) {
    run = a.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export interface SummaryInput {
  mode: ModeId;
  difficulty: Difficulty;
  startedAt: number;
  durationMs: number;
  answers: readonly AnswerRecord[];
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function summarise(input: SummaryInput): Session {
  const { answers } = input;
  const correctAnswers = answers.filter((a) => a.correct);
  const byKind: Record<string, KindStat> = {};
  for (const a of answers) {
    const stat = (byKind[a.question.kind] ??= { attempted: 0, correct: 0, ms: 0 });
    stat.attempted += 1;
    stat.correct += a.correct ? 1 : 0;
    stat.ms += a.ms;
  }
  const correctMs = correctAnswers.reduce((sum, a) => sum + a.ms, 0);
  return {
    id: newId(),
    mode: input.mode,
    difficulty: input.difficulty,
    startedAt: input.startedAt,
    durationMs: Math.round(input.durationMs),
    score: correctAnswers.length,
    attempted: answers.length,
    correct: correctAnswers.length,
    avgCorrectMs: correctAnswers.length > 0 ? Math.round(correctMs / correctAnswers.length) : null,
    bestStreak: bestStreak(answers),
    byKind,
  };
}

export function accuracy(session: Pick<Session, 'attempted' | 'correct'>): number {
  return session.attempted === 0 ? 0 : session.correct / session.attempted;
}
