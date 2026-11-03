import { useEffect, useMemo, useRef, useState } from 'react';
import { generateSjtItems, scoreRanking } from '../../../services/assess/sjt';
import { SJT_TAG_LABEL, SJT_THEME_LABEL } from '../../../services/assess/sjtBank';
import type { GameResult } from '../../../services/assess/types';
import { seededRng } from '../../../services/assess/util';
import { absoluteExtremes, chooseStatements, findConflicts, LIKERT_LABELS, pairCount, TRAIT_LABEL } from '../../../services/assess/workstyle';
import type { FrameApi } from '../api';
import { OKABE } from '../palette';

const SCENARIOS = 8;
const TUTORIAL_SCENARIOS = 2;
const PAIRS = 10;

const RANK_WORDS = ['Most effective', '2nd', '3rd', 'Least effective'];

export function Judgement({ api }: { api: FrameApi }) {
  const tutorial = api.phase === 'tutorial';
  const count = tutorial ? TUTORIAL_SCENARIOS : SCENARIOS;
  const items = useMemo(() => generateSjtItems(seededRng(api.seed, 1), count), [api.seed, count]);
  const statements = useMemo(() => (tutorial ? [] : chooseStatements(seededRng(api.seed, 2), PAIRS)), [api.seed, tutorial]);

  const [stage, setStage] = useState<'sjt' | 'feedback' | 'intro' | 'style'>('sjt');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [styleIndex, setStyleIndex] = useState(0);
  const finished = useRef(false);
  const { setHud, finish, sound } = api;

  const average = scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length;
  const item = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    const widget = average === null ? undefined : `Match ${Math.round(average * 100)}%`;
    if (stage === 'style') setHud({ round: `Statement ${styleIndex + 1} of ${statements.length}`, widget });
    else if (stage === 'intro') setHud({ round: 'Work-style questions', widget });
    else setHud({ round: `Scenario ${index + 1} of ${count}`, widget });
  }, [setHud, stage, index, count, styleIndex, statements.length, average]);

  const submitRanking = (): void => {
    // ranking[e] is the rank the user gave the option that sits at expert position e.
    const ranking = [0, 1, 2, 3].map((e) => picked.indexOf(item.shown.indexOf(e)));
    const s = scoreRanking(ranking);
    setLastScore(s);
    setScores((all) => [...all, s]);
    sound(s >= 0.75 ? 'good' : 'bad');
    setStage('feedback');
  };

  const finishRun = (finalScores: number[], finalAnswers: Record<string, number>): void => {
    if (finished.current) return;
    finished.current = true;
    const avg = finalScores.reduce((a, b) => a + b, 0) / Math.max(1, finalScores.length);
    const pct = Math.round(avg * 100);
    const detail: string[] = [`Situational judgement: your rankings matched the expert order by ${pct}% on average across ${finalScores.length} scenarios.`];
    if (statements.length > 0) {
      const conflicts = findConflicts(statements, finalAnswers);
      const pairs = pairCount(statements);
      detail.push(`Work-style consistency: ${pairs - conflicts.length} of ${pairs} pairs of related statements were answered consistently.`);
      for (const c of conflicts) {
        detail.push(`Mixed signals on ${TRAIT_LABEL[c.a.trait].toLowerCase()}: you answered "${LIKERT_LABELS[c.answerA - 1]}" to "${c.a.text}" and "${LIKERT_LABELS[c.answerB - 1]}" to "${c.b.text}". These say opposite things.`);
      }
      const extremes = absoluteExtremes(statements, finalAnswers);
      if (extremes.length > 0) {
        detail.push(`You gave an extreme answer to ${extremes.length} ${extremes.length === 1 ? 'statement' : 'statements'} with absolute wording ("always", "never"). Few people are always or never anything, so such answers deserve careful thought.`);
      } else {
        detail.push('Statements with absolute wording such as "always" or "never" deserve careful thought: few people are always or never anything.');
      }
      detail.push('There are no right answers in a work-style questionnaire. Answer honestly rather than guessing what an employer wants; consistent, honest answers give the most accurate picture.');
    }
    const result: GameResult = {
      score: pct,
      scoreText: `${pct}%`,
      correct: finalScores.filter((s) => s >= 0.75).length,
      attempted: finalScores.length,
      avgItemMs: null,
      detail,
    };
    sound('done');
    finish(result);
  };

  const nextScenario = (): void => {
    setPicked([]);
    if (index + 1 < count) {
      setIndex(index + 1);
      setStage('sjt');
    } else if (statements.length > 0) {
      setStage('intro');
    } else {
      finishRun(scores, answers);
    }
  };

  const nextStatement = (): void => {
    if (styleIndex + 1 < statements.length) setStyleIndex(styleIndex + 1);
    else finishRun(scores, answers);
  };

  // Keys 1 to 5 answer a work-style statement.
  const answerRef = useRef<(n: number) => void>(() => undefined);
  answerRef.current = (n: number) => {
    if (stage === 'style') setAnswers((a) => ({ ...a, [statements[styleIndex].id]: n }));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[1-5]$/.test(e.key)) answerRef.current(Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (stage === 'intro') {
    return (
      <div className="card space-y-3 p-5">
        <h2 className="text-xl font-bold">Work-style questions</h2>
        <p>Next come {statements.length} short statements about how you like to work. Rate how far you agree with each one, from Strongly disagree to Strongly agree.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>There are no right or wrong answers.</li>
          <li>Answer honestly rather than guessing what an employer wants. Honest answers are also easier to keep consistent.</li>
          <li>Some statements say the opposite of others. You will see a consistency report at the end.</li>
          <li>Wording such as &ldquo;always&rdquo; or &ldquo;never&rdquo; deserves careful thought.</li>
        </ul>
        <button type="button" className="btn btn-primary" onClick={() => setStage('style')} autoFocus>
          Continue
        </button>
      </div>
    );
  }

  if (stage === 'style') {
    const s = statements[styleIndex];
    const value = answers[s.id];
    return (
      <div className="card space-y-4 p-5">
        <p className="stat-label">{TRAIT_LABEL[s.trait]}</p>
        <p className="text-xl font-semibold leading-snug">{s.text}</p>
        <div role="radiogroup" aria-label="How far do you agree?" className="grid gap-2">
          {LIKERT_LABELS.map((label, i) => {
            const n = i + 1;
            const selected = value === n;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, [s.id]: n }))}
                className="btn min-h-12 justify-start gap-3 px-4 text-left"
                style={selected ? { background: OKABE.blue, color: '#ffffff', borderColor: OKABE.blue } : undefined}
              >
                <span className="tabular w-5 font-bold">{n}</span>
                <span>{label}</span>
                {selected && <span aria-hidden="true" className="ml-auto">{'✓'}</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-primary" onClick={nextStatement} disabled={value === undefined}>
          {styleIndex + 1 >= statements.length ? 'See results' : 'Next statement'}
        </button>
      </div>
    );
  }

  const sc = item.scenario;

  if (stage === 'feedback') {
    return (
      <div className="space-y-3">
        <div className="card p-4 text-center" role="status" aria-live="polite">
          <p className="stat-label">Match with the expert ranking</p>
          <p className="tabular text-4xl font-bold">{Math.round(lastScore * 100)}%</p>
        </div>
        <p className="text-sm text-muted">Expert order, most effective first. Your own rank is shown beside each response.</p>
        <ol className="space-y-2">
          {sc.options.map((o, expert) => {
            const mine = picked.indexOf(item.shown.indexOf(expert));
            const agree = mine === expert;
            return (
              <li key={expert} className="card space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink">Expert rank {expert + 1}</span>
                  <span className="rounded-full px-2 py-0.5" style={{ background: agree ? '#cdeee3' : '#fbe1d2', color: '#111111' }}>
                    {agree ? '✓ ' : ''}Your rank {mine + 1}
                  </span>
                  <span className="text-muted">{SJT_TAG_LABEL[o.tag]}</span>
                </div>
                <p className="font-medium">{o.text}</p>
                <p className="text-sm text-muted">{o.why}</p>
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn btn-primary" onClick={nextScenario} autoFocus>
          {index + 1 < count ? 'Next scenario' : statements.length > 0 ? 'Continue to work-style questions' : 'Finish'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card space-y-2 p-4">
        <p className="stat-label">{SJT_THEME_LABEL[sc.theme]}</p>
        <p className="text-lg leading-snug">{sc.situation}</p>
      </div>
      <p className="text-sm text-muted">Tap the responses in order, from the most effective to the least effective. Tap a ranked response again to undo it.</p>
      <ul className="space-y-2">
        {item.shown.map((expertIdx, displayIdx) => {
          const rank = picked.indexOf(displayIdx);
          const option = sc.options[expertIdx];
          return (
            <li key={displayIdx}>
              <button
                type="button"
                aria-pressed={rank >= 0}
                aria-label={`${option.text}${rank >= 0 ? `. Ranked ${RANK_WORDS[rank]}` : ''}`}
                onClick={() => setPicked((p) => (p.includes(displayIdx) ? p.filter((x) => x !== displayIdx) : [...p, displayIdx]))}
                className="btn min-h-14 w-full items-start justify-start gap-3 px-3 py-3 text-left font-medium"
                style={rank >= 0 ? { borderColor: OKABE.blue, borderWidth: 2 } : undefined}
              >
                <span aria-hidden="true" className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold" style={{ borderColor: OKABE.blue, background: rank >= 0 ? OKABE.blue : 'transparent', color: rank >= 0 ? '#ffffff' : undefined }}>
                  {rank >= 0 ? rank + 1 : ''}
                </span>
                <span className="text-sm leading-snug">{option.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={submitRanking} disabled={picked.length !== 4}>
          Submit ranking
        </button>
        <button type="button" className="btn" onClick={() => setPicked([])} disabled={picked.length === 0}>
          Clear
        </button>
      </div>
    </div>
  );
}
