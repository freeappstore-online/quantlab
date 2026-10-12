/** Removes floating point noise such as 57.900000000000006. */
export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function fmt(n: number, maxFractionDigits = 6): string {
  const r = round6(n);
  if (r === 0) return '0';
  return r.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits }).replace('-', '−');
}

/** Negative operands get brackets so "5 − (−3)" stays readable. */
export function fmtOperand(n: number): string {
  return n < 0 ? `(${fmt(n)})` : fmt(n);
}

/** m:ss for the countdown clock. */
export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function fmtSeconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`;
}

export function fmtPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
