/**
 * Colour-blind-safe palette (Okabe and Ito). Colour is never the only signal: pieces carry letters,
 * pattern cells carry shapes, and states carry symbols as well as colour.
 */
export const OKABE = {
  orange: '#E69F00',
  sky: '#56B4E9',
  green: '#009E73',
  yellow: '#F0E442',
  blue: '#0072B2',
  vermillion: '#D55E00',
  purple: '#CC79A7',
  grey: '#999999',
} as const;

export const PIECE_COLOURS: string[] = [OKABE.orange, OKABE.sky, OKABE.green, OKABE.yellow, OKABE.blue, OKABE.vermillion, OKABE.purple, OKABE.grey];

/** Pattern colours for Mirror Turn, 1-based; index 0 is an empty cell. */
export const PATTERN_COLOURS: string[] = ['transparent', OKABE.orange, OKABE.sky, OKABE.purple];
export const PATTERN_GLYPHS: string[] = ['', '●', '■', '▲'];
export const PATTERN_NAMES: string[] = ['empty', 'circle', 'square', 'triangle'];

/** Readable text colour on a palette fill. */
export function textOn(fill: string): string {
  return fill === OKABE.blue || fill === OKABE.vermillion ? '#ffffff' : '#111111';
}
