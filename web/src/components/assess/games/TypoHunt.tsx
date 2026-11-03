import { useEffect, useRef, useState } from 'react';
import { generatePassage, TYPO_KIND_LABEL, TYPO_SCHEDULE, TYPO_VARIANTS, type TypoPassage, type TypoVariant } from '../../../services/assess/typo';
import type { GameResult } from '../../../services/assess/types';
import { mean, seededRng } from '../../../services/assess/util';
import type { FrameApi } from '../api';
import { OKABE } from '../palette';

const PASSAGES = 8;
const TUTORIAL_PASSAGES = 2;

export function TypoHunt({ api }: { api: FrameApi }) {
  const total = api.phase === 'tutorial' ? TUTORIAL_PASSAGES : PASSAGES;
  const tutorial = api.phase === 'tutorial';
  const used = useRef<number[]>([]);
  const variantOf = (i: number): TypoVariant => TYPO_SCHEDULE[i % TYPO_SCHEDULE.length];
  const make = (i: number): TypoPassage => {
    const v = TYPO_VARIANTS[variantOf(i)];
    const p = generatePassage(seededRng(api.seed, i), {
      minErrors: tutorial ? 6 : v.min,
      maxErrors: tutorial ? 8 : v.max,
      kinds: v.kinds,
      exclude: used.current,
    });
    used.current.push(p.templateIndex);
    return p;
  };

  const [index, setIndex] = useState(0);
  const [passage, setPassage] = useState<TypoPassage>(() => make(0));
  const [flags, setFlags] = useState<Record<number, 'ok' | 'bad'>>({});
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [stage, setStage] = useState<'play' | 'review'>('play');
  const [endReason, setEndReason] = useState('');
  const stats = useRef({ found: 0, errors: 0, wrong: 0, times: [] as number[], missed: 0 });
  const startedAt = useRef(performance.now());
  const panel = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const { setHud, finish, sound, resetTimer, setTimerRunning } = api;

  const variant = TYPO_VARIANTS[variantOf(index)];
  const MAX_WRONG = variant.maxWrong;
  const remaining = passage.errors.length - found.length;

  useEffect(() => {
    setHud({
      round: `Passage ${index + 1} of ${total}`,
      widget: (
        <span className="inline-flex items-center gap-2">
          <span>Errors left {remaining}</span>
          <span aria-label={`${wrong} of ${MAX_WRONG} incorrect flags used`} className="inline-flex gap-1">
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <span key={i} aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: OKABE.vermillion, background: i < wrong ? OKABE.vermillion : 'transparent' }} />
            ))}
          </span>
        </span>
      ),
    });
  }, [setHud, index, total, remaining, wrong, MAX_WRONG]);

  const endPassage = (reason: string, foundNow: number, wrongNow: number): void => {
    if (stage !== 'play') return;
    const s = stats.current;
    s.found += foundNow;
    s.errors += passage.errors.length;
    s.wrong += wrongNow;
    s.missed += passage.errors.length - foundNow;
    s.times.push(performance.now() - startedAt.current);
    setEndReason(reason);
    setStage('review');
    setTimerRunning(false);
  };

  useEffect(() => {
    if (api.expired && stage === 'play') endPassage('Time is up.', found.length, wrong);
    // endPassage only reads state captured at this render.
  }, [api.expired]);

  const flag = (i: number): void => {
    if (stage !== 'play' || flags[i]) return;
    const err = passage.tokens[i].err;
    if (err !== null && !found.includes(err)) {
      const nextFound = [...found, err];
      const marks: Record<number, 'ok'> = {};
      passage.tokens.forEach((t, j) => {
        if (t.err === err) marks[j] = 'ok';
      });
      setFlags((f) => ({ ...f, ...marks }));
      setFound(nextFound);
      sound('good');
      if (nextFound.length === passage.errors.length) endPassage('You found every error.', nextFound.length, wrong);
    } else {
      const w = wrong + 1;
      setFlags((f) => ({ ...f, [i]: 'bad' }));
      setWrong(w);
      sound('bad');
      if (w >= MAX_WRONG) endPassage(`${MAX_WRONG === 2 ? 'Two' : 'Three'} incorrect flags ends the passage.`, found.length, w);
    }
  };

  const next = (): void => {
    if (index + 1 >= total) {
      if (finished.current) return;
      finished.current = true;
      const s = stats.current;
      const result: GameResult = {
        score: s.found,
        scoreText: `${s.found} found`,
        correct: s.found,
        attempted: s.found + s.wrong,
        avgItemMs: mean(s.times),
        detail: [`${s.found} of ${s.errors} errors found`, `${s.missed} missed, ${s.wrong} incorrect flags`],
      };
      sound('done');
      finish(result);
      return;
    }
    const i = index + 1;
    setIndex(i);
    setPassage(make(i));
    setFlags({});
    setFound([]);
    setWrong(0);
    setStage('play');
    setEndReason('');
    startedAt.current = performance.now();
    resetTimer();
    setTimerRunning(true);
    panel.current?.scrollTo({ top: 0 });
  };

  const scrollBy = (dy: number): void => panel.current?.scrollBy({ top: dy, behavior: 'smooth' });

  return (
    <div className="space-y-3">
      {stage === 'play' ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">
              <strong className="text-ink">{variant.label}.</strong> {variant.hint} Click each word with an error. {MAX_WRONG === 2 ? 'Two' : 'Three'} wrong clicks end the passage.
            </p>
            <div className="flex shrink-0 gap-1">
              <button type="button" className="btn min-h-10 px-3" aria-label="Scroll up" onClick={() => scrollBy(-120)}>
                {'▲'}
              </button>
              <button type="button" className="btn min-h-10 px-3" aria-label="Scroll down" onClick={() => scrollBy(120)}>
                {'▼'}
              </button>
            </div>
          </div>
          <div ref={panel} tabIndex={0} role="region" aria-label="Passage to proofread. Scroll with the arrow keys." className="h-[46dvh] min-h-[220px] overflow-y-auto rounded-xl border border-border bg-surface p-4 text-[17px] leading-8">
            {passage.tokens.map((t, i) => {
              const state = flags[i];
              return (
                <span key={i}>
                  {t.para && i > 0 && <span className="block h-3" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => flag(i)}
                    aria-label={`${t.text}${state === 'ok' ? ', correctly flagged' : state === 'bad' ? ', incorrectly flagged' : ''}`}
                    className="rounded px-[3px] py-0 text-left align-baseline"
                    style={{
                      background: state === 'ok' ? OKABE.green : state === 'bad' ? OKABE.vermillion : 'transparent',
                      color: state ? '#ffffff' : undefined,
                      textDecoration: state === 'bad' ? 'line-through' : undefined,
                      fontWeight: state ? 700 : undefined,
                      font: 'inherit',
                      minHeight: 0,
                    }}
                  >
                    {t.text}
                    {state === 'ok' && <span aria-hidden="true"> {'✓'}</span>}
                  </button>{' '}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card space-y-3 p-4" role="region" aria-label="Passage review">
          <h2 className="text-lg font-bold">{endReason}</h2>
          <p className="text-sm">
            You found <strong>{found.length}</strong> of <strong>{passage.errors.length}</strong> errors with <strong>{wrong}</strong> incorrect {wrong === 1 ? 'flag' : 'flags'}.
          </p>
          <ul className="max-h-[40dvh] space-y-1 overflow-y-auto text-sm">
            {passage.errors.map((e) => {
              const hit = found.includes(e.id);
              return (
                <li key={e.id} className="flex gap-2 rounded-lg bg-bg p-2">
                  <span aria-hidden="true" className="font-bold" style={{ color: hit ? OKABE.green : OKABE.vermillion }}>
                    {hit ? '✓' : '✗'}
                  </span>
                  <span>
                    <span className="sr-only">{hit ? 'Found: ' : 'Missed: '}</span>
                    <strong>{TYPO_KIND_LABEL[e.kind]}:</strong> {e.shown} <span aria-hidden="true">{'→'}</span> <span className="sr-only">should be</span> {e.fix}
                  </span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="btn btn-primary" onClick={next} autoFocus>
            {index + 1 >= total ? 'See results' : 'Next passage'}
          </button>
        </div>
      )}
    </div>
  );
}
