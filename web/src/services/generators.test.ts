import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MODE_IDS, type AnswerRecord, type Question } from '../types';
import { MODES } from './modes';
import { mulberry32 } from './rng';
import { bestStreak, isCorrect, parseAnswer, summarise } from './scoring';
import { parseSession } from './storage';

const SAMPLES = 1500;

function sample(mode: (typeof MODE_IDS)[number], difficulty: (typeof DIFFICULTIES)[number], seed: number): Question[] {
  const rng = mulberry32(seed);
  return Array.from({ length: SAMPLES }, () => MODES[mode].generate(rng, difficulty));
}

describe('question generators', () => {
  for (const mode of MODE_IDS) {
    for (const difficulty of DIFFICULTIES) {
      it(`${mode}/${difficulty}: well-formed questions that accept their own answer`, () => {
        for (const q of sample(mode, difficulty, 7)) {
          expect(q.prompt.length).toBeGreaterThan(0);
          expect(Number.isFinite(q.answer)).toBe(true);
          expect(q.tolerance).toBeGreaterThanOrEqual(0);
          expect(q.tolerance).toBeLessThan(0.1);
          expect(isCorrect(q, q.answer)).toBe(true);
          expect(q.prompt).not.toMatch(/NaN|undefined|Infinity/);
        }
      });
    }
  }

  it('sprint answers are whole numbers', () => {
    for (const d of DIFFICULTIES) for (const q of sample('sprint', d, 11)) expect(Number.isInteger(q.answer)).toBe(true);
  });

  it('80-in-8 answers never need more than two decimal places', () => {
    for (const d of DIFFICULTIES) {
      for (const q of sample('eighty', d, 13)) expect(Math.abs(q.answer * 100 - Math.round(q.answer * 100))).toBeLessThan(1e-6);
    }
  });

  it('sequences are exact-match questions with an explanation', () => {
    for (const d of DIFFICULTIES) {
      for (const q of sample('sequences', d, 17)) {
        expect(q.tolerance).toBe(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.explain).toContain('Next term');
        expect(q.prompt.endsWith(', ?')).toBe(true);
      }
    }
  });

  it('percentage answers can always be given to one decimal place', () => {
    for (const d of DIFFICULTIES) {
      for (const q of sample('estimation', d, 19)) {
        if (q.tolerance === 0.005 || q.kind === 'frac-pct' || q.kind === 'pct-change') {
          expect(isCorrect(q, Math.round(q.answer * 10) / 10)).toBe(true);
        }
      }
    }
  });

  it('a whole-number guess for 1/3 is rejected but 33.3 is accepted', () => {
    const q: Question = { prompt: '1/3 as a percentage', answer: (1 / 3) * 100, tolerance: 0.009, kind: 'frac-pct' };
    expect(isCorrect(q, 33)).toBe(false);
    expect(isCorrect(q, 33.3)).toBe(true);
  });
});

describe('scoring', () => {
  const q = (answer: number, tolerance = 0): Question => ({ prompt: 'q', answer, tolerance, kind: 'add' });

  it('checks exact and tolerant answers', () => {
    expect(isCorrect(q(12), 12)).toBe(true);
    expect(isCorrect(q(12), 13)).toBe(false);
    expect(isCorrect(q(12), null)).toBe(false);
    expect(isCorrect(q(100, 0.05), 104)).toBe(true);
    expect(isCorrect(q(100, 0.05), 106)).toBe(false);
    expect(isCorrect(q(-20, 0.01), -20)).toBe(true);
  });

  it('parses the answer box', () => {
    expect(parseAnswer('')).toBeNull();
    expect(parseAnswer('-')).toBeNull();
    expect(parseAnswer('12.5')).toBe(12.5);
    expect(parseAnswer('-0.5')).toBe(-0.5);
    expect(parseAnswer('5.')).toBe(5);
  });

  const rec = (correct: boolean, ms = 1000, kind = 'add'): AnswerRecord => ({
    question: { prompt: 'q', answer: 1, tolerance: 0, kind },
    given: correct ? 1 : 2,
    correct,
    ms,
  });

  it('computes the best streak', () => {
    expect(bestStreak([rec(true), rec(true), rec(false), rec(true)])).toBe(2);
    expect(bestStreak([])).toBe(0);
  });

  it('summarises a session and survives a storage round trip', () => {
    const s = summarise({
      mode: 'sprint',
      difficulty: 'medium',
      startedAt: 1_700_000_000_000,
      durationMs: 120_000,
      answers: [rec(true, 1000), rec(false, 3000, 'mul'), rec(true, 2000)],
    });
    expect(s.score).toBe(2);
    expect(s.attempted).toBe(3);
    expect(s.avgCorrectMs).toBe(1500);
    expect(s.byKind.mul).toEqual({ attempted: 1, correct: 0, ms: 3000 });
    expect(parseSession(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('rejects malformed stored sessions', () => {
    expect(parseSession({ id: 1 })).toBeNull();
    expect(parseSession(null)).toBeNull();
    expect(parseSession({ id: 'x', mode: 'nope' })).toBeNull();
  });
});
