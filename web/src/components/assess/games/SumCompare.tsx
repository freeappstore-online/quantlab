import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult } from '../../../services/assess/types';
import { mean, seededRng } from '../../../services/assess/util';
import { generateSumItem, type SumAnswer } from '../../../services/assess/sumcompare';
import type { FrameApi } from '../api';
import { OKABE } from '../palette';

const TUTORIAL_ITEMS = 6;
const STUDY_ITEMS = 30;
const RAMP_ITEMS = 40;

const LABEL: Record<SumAnswer, string> = { left: 'Left is larger', equal: 'Equal', right: 'Right is larger' };

function Side({ title, tiles }: { title: string; tiles: number[] }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-surface p-3" role="group" aria-label={`${title} group: ${tiles.join(', ')}`}>
      <div className="stat-label mb-2 text-center">{title}</div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tiles.map((v, i) => (
          <span key={i} className="tabular flex min-h-12 min-w-12 items-center justify-center rounded-lg border-2 px-2 text-xl font-bold" style={{ borderColor: OKABE.blue, background: '#d6ecfa', color: '#111111' }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SumCompare({ api }: { api: FrameApi }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const stats = useRef({ good: 0, bad: 0, times: [] as number[] });
  const shownAt = useRef(performance.now());
  const finished = useRef(false);
  const study = api.phase === 'test' && !api.timed;
  const cap = api.phase === 'tutorial' ? TUTORIAL_ITEMS : study ? STUDY_ITEMS : Infinity;

  const level = api.level(Math.min(index, RAMP_ITEMS - 1), RAMP_ITEMS);
  const item = useMemo(() => generateSumItem(seededRng(api.seed, index), level), [api.seed, index, level]);
  const { setHud, finish, sound } = api;

  useEffect(() => {
    const label = Number.isFinite(cap) ? `Item ${Math.min(index + 1, cap)} of ${cap}` : `Item ${index + 1}`;
    setHud({ round: label, widget: `Score ${score}` });
  }, [setHud, index, cap, score]);

  const end = (): void => {
    if (finished.current) return;
    finished.current = true;
    const s = stats.current;
    const result: GameResult = {
      score: s.good - s.bad,
      scoreText: String(s.good - s.bad),
      correct: s.good,
      attempted: s.good + s.bad,
      avgItemMs: mean(s.times),
      detail: [`${s.good} correct, ${s.bad} wrong`],
    };
    sound('done');
    finish(result);
  };

  useEffect(() => {
    if (api.expired) end();
  }, [api.expired]);

  const answer = (choice: SumAnswer): void => {
    if (finished.current) return;
    const now = performance.now();
    const ok = choice === item.answer;
    stats.current.times.push(now - shownAt.current);
    if (ok) stats.current.good += 1;
    else stats.current.bad += 1;
    setScore(stats.current.good - stats.current.bad);
    setFeedback(ok ? { ok, text: 'Correct' } : { ok, text: `Wrong: it was ${LABEL[item.answer].toLowerCase()}` });
    sound(ok ? 'good' : 'bad');
    if (index + 1 >= cap) {
      end();
      return;
    }
    shownAt.current = now;
    setIndex(index + 1);
  };

  // Left and right arrows pick a side; the down arrow or = picks equal.
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft') answerRef.current('left');
      else if (e.key === 'ArrowRight') answerRef.current('right');
      else if (e.key === 'ArrowDown' || e.key === '=' || e.key === 'e' || e.key === 'E') answerRef.current('equal');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Which side adds up to more? Keys: left arrow, down arrow for equal, right arrow.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Side title="Left" tiles={item.left} />
        <Side title="Right" tiles={item.right} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['left', 'equal', 'right'] as const).map((c) => (
          <button key={c} type="button" className="btn min-h-14 text-base" onClick={() => answer(c)}>
            {LABEL[c]}
          </button>
        ))}
      </div>
      <p className="min-h-6 text-center text-sm font-semibold" role="status" aria-live="polite" style={{ color: feedback ? (feedback.ok ? OKABE.green : OKABE.vermillion) : undefined }}>
        {feedback ? `${feedback.ok ? '✓' : '✗'} ${feedback.text}` : ''}
      </p>
      {study && (
        <div className="text-center">
          <button type="button" className="btn" onClick={end}>
            Finish session
          </button>
        </div>
      )}
    </div>
  );
}
