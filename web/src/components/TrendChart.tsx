import { useEffect, useRef, useState } from 'react';

export interface TrendPoint {
  value: number;
  label: string;
}

const HEIGHT = 190;
const M = { l: 34, r: 12, t: 12, b: 26 };
const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const AVG_WINDOW = 5;

function niceMax(max: number): number {
  if (max <= 1) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const n = max / power;
  return (NICE_STEPS.find((s) => s >= n) ?? 10) * power;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(300);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.max(200, el.clientWidth));
    const ro = new ResizeObserver(() => setWidth(Math.max(200, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Dependency-free SVG line chart: score per session with a trailing 5-session average. */
export function TrendChart({ points }: { points: readonly TrendPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const n = points.length;

  if (n < 2) {
    return (
      <div ref={ref} className="card flex h-32 items-center justify-center px-4 text-center text-sm text-muted">
        {n === 0 ? 'No sessions yet.' : 'Play one more session to see a trend line.'}
      </div>
    );
  }

  const max = niceMax(Math.max(...points.map((p) => p.value), 1));
  const x = (i: number) => M.l + (i * (width - M.l - M.r)) / (n - 1);
  const y = (v: number) => M.t + (1 - v / max) * (HEIGHT - M.t - M.b);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const avg = points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - AVG_WINDOW + 1), i + 1);
    return slice.reduce((s, p) => s + p.value, 0) / slice.length;
  });
  const avgLine = avg.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ticks = [0, max / 2, max];
  const first = points[0].value;
  const lastValue = points[n - 1].value;

  return (
    <div ref={ref} className="card p-2">
      <svg
        width={width - 16}
        height={HEIGHT}
        viewBox={`0 0 ${width - 16} ${HEIGHT}`}
        role="img"
        aria-label={`Score trend over ${n} sessions, from ${first} to ${lastValue}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={width - 16 - M.r + 8} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        <path d={avgLine} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        <path d={line} fill="none" stroke="var(--accent-ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={n > 40 ? 2 : 3.5} fill="var(--accent-ink)">
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        ))}
        <text x={M.l} y={HEIGHT - 6} fontSize="11" fill="var(--muted)">
          {points[0].label}
        </text>
        <text x={width - 16 - M.r + 8} y={HEIGHT - 6} fontSize="11" textAnchor="end" fill="var(--muted)">
          {points[n - 1].label}
        </text>
      </svg>
      <div className="flex gap-4 px-2 pb-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-accent-ink" /> Score
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block w-4 border-t-2 border-dashed border-muted" /> {AVG_WINDOW}-session average
        </span>
      </div>
    </div>
  );
}
