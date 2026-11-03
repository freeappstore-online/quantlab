export type SoundKind = 'good' | 'bad' | 'done' | 'tick';

let ctx: AudioContext | null = null;

/** Short synthesised tones. Silent unless the user has switched sound on, and started only after a user gesture. */
export function playSound(enabled: boolean, kind: SoundKind): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    const tones: Record<SoundKind, [number, number][]> = {
      good: [[660, 0.08], [880, 0.1]],
      bad: [[220, 0.18]],
      done: [[523, 0.1], [659, 0.1], [784, 0.16]],
      tick: [[440, 0.04]],
    };
    let at = ctx.currentTime;
    for (const [freq, dur] of tones[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = kind === 'bad' ? 'triangle' : 'sine';
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur);
      at += dur;
    }
  } catch {
    // Audio is optional; failures are ignored.
  }
}
