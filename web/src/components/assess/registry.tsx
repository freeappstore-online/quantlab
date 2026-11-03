import type { AssessId } from '../../services/assess/types';
import type { GameDef } from './api';
import { BlockFit } from './games/BlockFit';
import { BubbleOrder } from './games/BubbleOrder';
import { Judgement } from './games/Judgement';
import { MirrorTurn } from './games/MirrorTurn';
import { ShortestRoute } from './games/ShortestRoute';
import { SumCompare } from './games/SumCompare';
import { TypoHunt } from './games/TypoHunt';

export const GAMES: GameDef[] = [
  {
    id: 'blockfit',
    name: 'Block Fit',
    skill: 'Spatial problem solving',
    goal: 'Drag the pieces onto the grid until every cell is filled.',
    format: '9 rounds in 3 minutes',
    timerSeconds: 180,
    Component: BlockFit,
  },
  {
    id: 'typohunt',
    name: 'Typo Hunt',
    skill: 'Verbal proofreading',
    goal: 'Find the spelling, wording and punctuation errors hidden in workplace texts.',
    format: '5 passages, 60 seconds each',
    timerSeconds: 60,
    Component: TypoHunt,
  },
  {
    id: 'bubbleorder',
    name: 'Bubble Order',
    skill: 'Numerical reasoning',
    goal: 'Pop the bubbles in order from the smallest value to the largest.',
    format: '12 rounds in 3 minutes',
    timerSeconds: 180,
    Component: BubbleOrder,
  },
  {
    id: 'sumcompare',
    name: 'Sum Compare',
    skill: 'Quick arithmetic',
    goal: 'Decide which group of numbers adds up to more, or whether they are equal.',
    format: 'As many as you can in 3 minutes',
    timerSeconds: 180,
    Component: SumCompare,
  },
  {
    id: 'mirrorturn',
    name: 'Mirror Turn',
    skill: 'Mental rotation',
    goal: 'Recreate a pattern after it has been turned or mirrored.',
    format: '12 rounds in 3 minutes',
    timerSeconds: 180,
    Component: MirrorTurn,
  },
  {
    id: 'shortestroute',
    name: 'Shortest Route',
    skill: 'Planning',
    goal: 'Find the shortest route through the maze to the flag.',
    format: '8 mazes in 3 minutes',
    timerSeconds: 180,
    Component: ShortestRoute,
  },
  {
    id: 'judgement',
    name: 'Workplace Judgement',
    skill: 'Situational judgement and work style',
    goal: 'Rank responses to workplace scenarios, then rate work-style statements.',
    format: '6 scenarios and 14 statements, no time limit',
    timerSeconds: null,
    Component: Judgement,
  },
];

export function gameById(id: AssessId): GameDef {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}
