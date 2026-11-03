import type { Rng } from '../rng';
import { SJT_SCENARIOS, type SjtScenario } from './sjtBank';
import { SJT_SCENARIOS_B } from './sjtBankB';
import { shuffle } from './util';

/** The full bank: the original scenarios plus the technology-workplace set. */
export const SJT_ALL: SjtScenario[] = [...SJT_SCENARIOS, ...SJT_SCENARIOS_B];

export interface SjtItem {
  scenario: SjtScenario;
  /** Display order: shown[i] is an index into scenario.options (the expert order). */
  shown: number[];
}

/** Picks distinct scenarios and shuffles the options so the expert order is never the screen order. */
export function generateSjtItems(rng: Rng, count: number): SjtItem[] {
  const picked = shuffle(rng, SJT_ALL).slice(0, count);
  return picked.map((scenario) => {
    let shown = shuffle(rng, [0, 1, 2, 3]);
    // Avoid showing the answer key order.
    if (shown.every((v, i) => v === i)) shown = [1, 0, 3, 2];
    return { scenario, shown };
  });
}

/**
 * Score a ranking against the expert order. `ranking[i]` is the rank (0 = most effective) the user gave
 * the option at expert index i. Returns 0..1 using the normalised footrule distance.
 */
export function scoreRanking(ranking: readonly number[]): number {
  const maxDistance = Math.floor((ranking.length * ranking.length) / 2); // 8 for four options
  const distance = ranking.reduce((sum, rank, expert) => sum + Math.abs(rank - expert), 0);
  return 1 - distance / maxDistance;
}
