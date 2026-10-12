import { useCallback, useEffect, useRef, useState } from 'react';
import type { ModeConfig } from '../services/modes';
import { defaultRng } from '../services/rng';
import { isCorrect, parseAnswer } from '../services/scoring';
import type { AnswerRecord, Difficulty, Question } from '../types';

export type Phase = 'ready' | 'countdown' | 'running' | 'done';

export interface DrillResult {
  answers: AnswerRecord[];
  durationMs: number;
  startedAt: number;
}

interface Options {
  mode: ModeConfig;
  difficulty: Difficulty;
  autoAdvance: boolean;
  onFinish: (result: DrillResult) => void;
}

const MAX_INPUT_LENGTH = 12;
const COUNTDOWN_STEP_MS = 700;

export function useDrill({ mode, difficulty, autoAdvance, onFinish }: Options) {
  const limitMs = mode.durationSec * 1000;

  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [last, setLast] = useState<AnswerRecord | null>(null);
  const [remainingMs, setRemainingMs] = useState(limitMs);
  const [paused, setPaused] = useState(false);

  // The refs hold the live values so key handlers never act on stale state.
  const phaseRef = useRef<Phase>('ready');
  const questionRef = useRef<Question | null>(null);
  const inputRef = useRef('');
  const answersRef = useRef<AnswerRecord[]>([]);
  const finishedRef = useRef(false);
  const startedAtRef = useRef(0);
  // performance.now() is monotonic. Time spent in a hidden tab is removed from the run.
  const clockRef = useRef({ start: 0, pausedAt: null as number | null, pausedTotal: 0, questionStart: 0 });
  const optionsRef = useRef({ mode, difficulty, autoAdvance, onFinish });

  useEffect(() => {
    optionsRef.current = { mode, difficulty, autoAdvance, onFinish };
  });

  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const writeInput = (value: string) => {
    inputRef.current = value;
    setInput(value);
  };

  const elapsed = () => {
    const c = clockRef.current;
    return (c.pausedAt ?? performance.now()) - c.start - c.pausedTotal;
  };

  const nextQuestion = () => {
    const { mode: m, difficulty: d } = optionsRef.current;
    const previous = questionRef.current?.prompt;
    let q = m.generate(defaultRng, d);
    for (let i = 0; i < 5 && q.prompt === previous; i++) q = m.generate(defaultRng, d);
    questionRef.current = q;
    setQuestion(q);
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = Math.min(elapsed(), limitMs);
    changePhase('done');
    setRemainingMs(0);
    setAnswers(answersRef.current);
    optionsRef.current.onFinish({ answers: answersRef.current, durationMs, startedAt: startedAtRef.current });
  };

  const begin = () => {
    finishedRef.current = false;
    answersRef.current = [];
    setAnswers([]);
    setLast(null);
    setRemainingMs(limitMs);
    questionRef.current = null;
    clockRef.current = { start: performance.now(), pausedAt: null, pausedTotal: 0, questionStart: 0 };
    startedAtRef.current = Date.now();
    writeInput('');
    nextQuestion();
    changePhase('running');
  };

  const submit = () => {
    const q = questionRef.current;
    if (!q || phaseRef.current !== 'running') return;
    const t = elapsed();
    if (t >= limitMs) {
      finish();
      return;
    }
    const given = parseAnswer(inputRef.current);
    const record: AnswerRecord = { question: q, given, correct: isCorrect(q, given), ms: Math.max(0, t - clockRef.current.questionStart) };
    answersRef.current = [...answersRef.current, record];
    setAnswers(answersRef.current);
    setLast(record);
    const { questionLimit } = optionsRef.current.mode;
    if (questionLimit !== null && answersRef.current.length >= questionLimit) {
      finish();
      return;
    }
    clockRef.current.questionStart = t;
    writeInput('');
    nextQuestion();
  };

  /** Keys: '0'-'9', '.', 'neg', 'back', 'enter'. Used by both the physical keyboard and the on-screen keypad. */
  const press = (key: string) => {
    if (phaseRef.current !== 'running') return;
    const cur = inputRef.current;
    if (key === 'enter') return submit();
    if (key === 'back') return writeInput(cur.slice(0, -1));
    if (key === 'neg') return writeInput(cur.startsWith('-') ? cur.slice(1) : `-${cur}`);

    let next: string;
    if (key === '.') {
      if (cur.includes('.')) return;
      next = cur === '' ? '0.' : cur === '-' ? '-0.' : `${cur}.`;
    } else if (/^[0-9]$/.test(key)) {
      if (cur.length >= MAX_INPUT_LENGTH) return;
      next = cur === '0' ? key : cur === '-0' ? `-${key}` : cur + key;
    } else {
      return;
    }
    writeInput(next);

    const q = questionRef.current;
    if (optionsRef.current.autoAdvance && q && q.tolerance === 0 && !next.endsWith('.')) {
      const value = parseAnswer(next);
      if (value !== null && isCorrect(q, value)) submit();
    }
  };

  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });

  const start = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    setCount(3);
    changePhase('countdown');
  }, []);

  const reset = useCallback(() => {
    finishedRef.current = false;
    answersRef.current = [];
    questionRef.current = null;
    inputRef.current = '';
    setAnswers([]);
    setLast(null);
    setInput('');
    setQuestion(null);
    setRemainingMs(limitMs);
    setPaused(false);
    phaseRef.current = 'ready';
    setPhase('ready');
  }, [limitMs]);

  // Countdown 3, 2, 1, then begin.
  useEffect(() => {
    if (phase !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (count <= 1) begin();
      else setCount(count - 1);
    }, COUNTDOWN_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [phase, count]);

  // Clock.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => {
      const left = limitMs - elapsed();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) finish();
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, limitMs]);

  // Hidden tabs pause the clock so switching away never costs time.
  useEffect(() => {
    if (phase !== 'running') return;
    const onVisibility = () => {
      const c = clockRef.current;
      if (document.hidden && c.pausedAt === null) {
        c.pausedAt = performance.now();
        setPaused(true);
      } else if (!document.hidden && c.pausedAt !== null) {
        c.pausedTotal += performance.now() - c.pausedAt;
        c.pausedAt = null;
        setPaused(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [phase]);

  // Physical keyboard.
  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      let key: string | null = null;
      if (/^[0-9]$/.test(e.key)) key = e.key;
      else if (e.key === '.' || e.key === ',') key = '.';
      else if (e.key === '-') key = 'neg';
      else if (e.key === 'Backspace') key = 'back';
      else if (e.key === 'Enter') key = 'enter';
      if (key === null) return;
      e.preventDefault();
      pressRef.current(key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  return { phase, count, question, input, answers, last, remainingMs, paused, start, press, reset, limitMs };
}
