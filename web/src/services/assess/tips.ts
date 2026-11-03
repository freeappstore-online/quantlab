import type { AssessId, GameResult } from './types';

/** A short, specific suggestion based on how the run went. */
export function tipFor(game: AssessId, r: GameResult): string {
  const accuracy = r.attempted === 0 ? 0 : r.correct / r.attempted;
  const slow = r.avgItemMs !== null && r.avgItemMs > 12_000;
  switch (game) {
    case 'blockfit':
      return r.correct === 0
        ? 'Start with the largest or most awkward piece and the corners of the grid. Fitting the hardest shapes first leaves the easy ones for last.'
        : slow
          ? 'Look at the whole grid before moving a piece. Count the empty cells and match them against piece sizes to plan the order.'
          : 'Try to spot where each odd-shaped piece must go before you drag it. Fewer corrections means more time for the next round.';
    case 'typohunt':
      return accuracy < 0.7
        ? 'You are flagging words that are correct. Read each sentence slowly and flag only when you are sure; three wrong flags end the passage.'
        : 'Scan for the common patterns: doubled words, missing capital letters, its/it’s and their/there, and sentences with no full stop.';
    case 'bubbleorder':
      return accuracy < 0.8
        ? 'Work out every value first, then pop from smallest to largest. A wrong pop ends the round, so accuracy matters more than speed.'
        : 'Estimate roughly first, then check only the values that are close together. Keep the order in your head as you pop.';
    case 'sumcompare':
      return accuracy < 0.8
        ? 'Round the tiles to the nearest ten to get a quick estimate, then add exactly only when the totals are close.'
        : 'Add each side in chunks, pairing tiles that make round numbers. Watch for exact ties, which come up about one time in four.';
    case 'mirrorturn':
      return accuracy < 0.7
        ? 'Follow one corner cell through the turn first, then fill in the rest around it. For a mirror, flip left to right before you rotate.'
        : 'Rotate the pattern row by row: a quarter turn clockwise turns the left column into the top row.';
    case 'shortestroute':
      return accuracy < 0.8
        ? 'Before you move, trace the route with your eyes. With keys and doors, work out which key you need first and what the detour costs.'
        : 'Check the one-way tiles and doors before committing. A route that looks shorter can be blocked, so compare two options.';
    case 'judgement':
      return 'The most effective responses take ownership, tell the right people early, stay honest and keep the client in mind. Avoid silence, blame and shortcuts.';
  }
}
