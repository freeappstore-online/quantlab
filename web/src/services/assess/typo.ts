import { int, pick, type Rng } from '../rng';
import { TYPO_TEMPLATES, type TypoGenre } from './typoBank';
import { shuffle } from './util';

export type TypoKind = 'spelling' | 'wrongword' | 'apostrophe' | 'stray' | 'fullstop' | 'doubled' | 'capital';

export const TYPO_KIND_LABEL: Record<TypoKind, string> = {
  spelling: 'Misspelling',
  wrongword: 'Wrong word',
  apostrophe: 'Apostrophe',
  stray: 'Stray letter',
  fullstop: 'Missing full stop',
  doubled: 'Doubled word',
  capital: 'Missing capital letter',
};

export interface TypoError {
  id: number;
  kind: TypoKind;
  /** What appears on screen. */
  shown: string;
  /** What it should say. */
  fix: string;
}

export interface TypoToken {
  text: string;
  /** Id of the error this word belongs to, or null if the word is correct. */
  err: number | null;
  /** This word starts a new paragraph. */
  para: boolean;
}

export interface TypoPassage {
  templateIndex: number;
  genre: TypoGenre;
  tokens: TypoToken[];
  errors: TypoError[];
}

interface Slot {
  index: number;
  kind: TypoKind;
  /** Index of the slot this one directly follows, if any. Both cannot be errors on the same word. */
  after?: number;
  /** Correct text. */
  right: string;
  /** Options for the wrong text. */
  wrong: string[];
}

type Atom = { text: string } | { slot: Slot } | { period: Slot } | { dup: Slot };

const SLOT_RE = /\{(m|h|a|s|c):([^}]+)\}|\{(p|d)\}/g;

const NEIGHBOURS: Record<string, string> = {
  a: 's', b: 'v', c: 'x', d: 's', e: 'r', f: 'g', g: 'h', h: 'j', i: 'o', j: 'k', k: 'l', l: 'k', m: 'n',
  n: 'm', o: 'p', p: 'o', q: 'w', r: 't', s: 'd', t: 'y', u: 'i', v: 'b', w: 'e', x: 'z', y: 'u', z: 'x',
};

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

/** Plausible misspelling of a longer word: a dropped, doubled, swapped or substituted letter. */
export function misspell(rng: Rng, word: string): string {
  const w = word;
  const lower = w.toLowerCase();
  const n = lower.length;
  const strategies: (() => string | null)[] = [
    () => {
      const i = int(rng, 1, n - 2);
      return n >= 5 ? w.slice(0, i) + w.slice(i + 1) : null;
    },
    () => {
      const i = int(rng, 1, n - 2);
      return lower[i] !== lower[i + 1] && lower[i] !== lower[i - 1] ? w.slice(0, i + 1) + w[i] + w.slice(i + 1) : null;
    },
    () => {
      const i = int(rng, 1, n - 3);
      return lower[i] !== lower[i + 1] ? w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) : null;
    },
    () => {
      const spots = [...lower].map((ch, i) => (i > 0 && VOWELS.includes(ch) ? i : -1)).filter((i) => i >= 0);
      if (spots.length === 0) return null;
      const i = pick(rng, spots);
      const other = pick(rng, VOWELS.filter((v) => v !== lower[i]));
      return w.slice(0, i) + other + w.slice(i + 1);
    },
  ];
  for (let attempt = 0; attempt < 20; attempt++) {
    const out = pick(rng, strategies)();
    if (out && out.toLowerCase() !== lower) return out;
  }
  return w + w[w.length - 1];
}

/** A stray keystroke: a neighbouring key replaces the last letter or is tacked on the end. */
export function strayLetter(rng: Rng, word: string): string {
  const last = word[word.length - 1].toLowerCase();
  const nb = NEIGHBOURS[last] ?? 'x';
  return rng() < 0.5 ? word.slice(0, -1) + nb : word + nb;
}

function parse(template: string): { atoms: Atom[]; slots: Slot[] } {
  const atoms: Atom[] = [];
  const slots: Slot[] = [];
  let last = 0;
  let prevSlot: number | undefined;
  for (const m of template.matchAll(SLOT_RE)) {
    if (m.index > last) {
      atoms.push({ text: template.slice(last, m.index) });
      prevSlot = undefined;
    }
    last = m.index + m[0].length;
    const index = slots.length;
    const follows = prevSlot;
    prevSlot = index;
    if (m[3] === 'p') {
      const slot: Slot = { index, kind: 'fullstop', right: '.', wrong: [], after: follows };
      slots.push(slot);
      atoms.push({ period: slot });
    } else if (m[3] === 'd') {
      const slot: Slot = { index, kind: 'doubled', right: '', wrong: [], after: follows };
      slots.push(slot);
      atoms.push({ dup: slot });
    } else {
      const type = m[1];
      const body = m[2];
      let slot: Slot;
      if (type === 'h') {
        const [right, wrongs] = body.split('/');
        slot = { index, kind: 'wrongword', right, wrong: wrongs.split(',') };
      } else if (type === 'a') {
        const [right, wrongs] = body.split('/');
        slot = { index, kind: 'apostrophe', right, wrong: wrongs.split(',') };
      } else if (type === 'c') {
        slot = { index, kind: 'capital', right: body, wrong: [body.toLowerCase()] };
      } else {
        const [right, wrongs] = body.split('=');
        slot = { index, kind: type === 's' ? 'stray' : 'spelling', right, wrong: wrongs ? wrongs.split(',') : [] };
      }
      slots.push(slot);
      atoms.push({ slot });
    }
  }
  if (last < template.length) atoms.push({ text: template.slice(last) });
  return { atoms, slots };
}

const S1 = '\u0001';
const S2 = '\u0002';
const S3 = '\u0003';
const P1 = '\u0004';
const P2 = '\u0005';

/**
 * Renders a template with the given slots switched on as errors. Control characters mark the error
 * regions so the text can be split into words afterwards.
 */
function render(atoms: Atom[], active: ReadonlyMap<number, string>): string {
  let out = '';
  for (const a of atoms) {
    if ('text' in a) {
      out += a.text;
    } else if ('slot' in a) {
      const wrong = active.get(a.slot.index);
      out += wrong === undefined ? a.slot.right : `${S1}${a.slot.index}${S2}${wrong}${S3}`;
    } else if ('period' in a) {
      out += active.has(a.period.index) ? `${P1}${a.period.index}${P2}` : '.';
    } else {
      const prev = /(\S+)$/.exec(out.replace(/[\u0001-\u0005]\d*/g, ''));
      const word = prev ? prev[1].replace(/[.,;:!?]+$/, '') : '';
      if (active.has(a.dup.index) && word) out += `${P1}${a.dup.index}${P2} ${S1}${a.dup.index}${S2}${word}${S3}`;
    }
  }
  return out;
}

/** Splits rendered text into words and works out which words carry errors. */
function tokenise(rendered: string): TypoToken[] {
  const tokens: TypoToken[] = [];
  let word = '';
  let wordErr: number | null = null;
  let region: number | null = null;
  let startsParagraph = false;
  let gapNewlines = 0;
  const flush = (): void => {
    if (word) tokens.push({ text: word, err: wordErr, para: startsParagraph });
    word = '';
    wordErr = null;
    startsParagraph = false;
  };
  for (let i = 0; i < rendered.length; i++) {
    const ch = rendered[i];
    if (ch === S1 || ch === P1) {
      let num = '';
      while (rendered[i + 1] !== S2 && rendered[i + 1] !== P2) num += rendered[++i];
      i += 1; // skip the closing control character
      if (ch === S1) region = Number(num);
      else wordErr = Number(num);
      continue;
    }
    if (ch === S3) {
      region = null;
      continue;
    }
    if (/\s/.test(ch)) {
      flush();
      if (ch === '\n') gapNewlines++;
      continue;
    }
    if (word === '') {
      // A blank line before a word means that word opens a new paragraph.
      startsParagraph = gapNewlines >= 2 && tokens.length > 0;
      gapNewlines = 0;
    }
    word += ch;
    if (region !== null) wordErr = region;
  }
  flush();
  return tokens;
}

export interface PassageOptions {
  minErrors: number;
  maxErrors: number;
  /** Template indices to avoid, so a test does not repeat a passage. */
  exclude?: readonly number[];
  /** Force a particular template (used by tests). */
  templateIndex?: number;
}

/** Builds one passage: picks a template, switches on a mix of error slots and tokenises the text. */
export function generatePassage(rng: Rng, opts: PassageOptions): TypoPassage {
  const pool = TYPO_TEMPLATES.map((_, i) => i).filter((i) => !(opts.exclude ?? []).includes(i));
  const templateIndex = opts.templateIndex ?? pick(rng, pool.length ? pool : TYPO_TEMPLATES.map((_, i) => i));
  const tpl = TYPO_TEMPLATES[templateIndex];
  const { atoms, slots } = parse(tpl.text);

  const conflicts = (a: Slot, b: Slot): boolean => a.after === b.index || b.after === a.index;
  const chosen = new Set<number>();
  const tryAdd = (slot: Slot): void => {
    if (chosen.has(slot.index)) return;
    if ([...chosen].some((i) => conflicts(slots[i], slot))) return;
    chosen.add(slot.index);
  };
  const target = int(rng, opts.minErrors, opts.maxErrors);
  // One slot of every kind first so the mix is varied, then fill up at random.
  const byKind = new Map<TypoKind, Slot[]>();
  for (const sl of slots) byKind.set(sl.kind, [...(byKind.get(sl.kind) ?? []), sl]);
  for (const list of shuffle(rng, [...byKind.values()])) {
    if (chosen.size < target) tryAdd(pick(rng, list));
  }
  // Then keep choosing a kind at random (not a slot), so frequent kinds such as spelling do not swamp the rare ones.
  while (chosen.size < target) {
    const open = [...byKind.entries()]
      .map(([kind, list]) => ({ kind, list: list.filter((sl) => !chosen.has(sl.index) && ![...chosen].some((i) => conflicts(slots[i], sl))) }))
      .filter((k) => k.list.length > 0);
    if (open.length === 0) break;
    tryAdd(pick(rng, pick(rng, open).list));
  }

  const active = new Map<number, string>();
  const errors: TypoError[] = [];
  for (const index of [...chosen].sort((a, b) => a - b)) {
    const slot = slots[index];
    let wrong = '';
    let shown = '';
    let fix = slot.right;
    switch (slot.kind) {
      case 'spelling':
        wrong = slot.wrong.length ? pick(rng, slot.wrong) : misspell(rng, slot.right);
        shown = wrong;
        break;
      case 'stray':
        wrong = slot.wrong.length ? pick(rng, slot.wrong) : strayLetter(rng, slot.right);
        shown = wrong;
        break;
      case 'wrongword':
      case 'apostrophe':
      case 'capital':
        wrong = pick(rng, slot.wrong);
        shown = wrong;
        break;
      case 'fullstop':
        wrong = '';
        shown = 'missing full stop';
        fix = 'add a full stop';
        break;
      case 'doubled':
        wrong = '';
        shown = 'repeated word';
        fix = 'remove the repeat';
        break;
    }
    active.set(index, wrong);
    errors.push({ id: index, kind: slot.kind, shown, fix });
  }

  const tokens = tokenise(render(atoms, active));
  // Fill in what the missing-full-stop and repeated-word errors look like, using the words they sit on.
  for (const e of errors) {
    const hits = tokens.filter((t) => t.err === e.id);
    if (e.kind === 'fullstop' && hits[0]) {
      e.shown = `"${hits[0].text}" has no full stop`;
      e.fix = `"${hits[0].text}."`;
    }
    if (e.kind === 'doubled' && hits[0]) {
      e.shown = `"${hits[0].text} ${hits[0].text}"`;
      e.fix = `"${hits[0].text}"`;
    }
    if (e.kind === 'capital' && hits.length) {
      e.shown = hits.map((h) => h.text).join(' ');
      e.fix = (slots[e.id]?.right ?? e.fix);
    }
  }
  return { templateIndex, genre: tpl.genre, tokens, errors };
}

/** Renders a template with every slot correct, for word counts and review. */
export function cleanText(templateIndex: number): string {
  const { atoms } = parse(TYPO_TEMPLATES[templateIndex].text);
  return render(atoms, new Map()).replace(/\s+/g, ' ').trim();
}

export function slotCount(templateIndex: number): number {
  return parse(TYPO_TEMPLATES[templateIndex].text).slots.length;
}

/** All slots switched on at once; used by tests to prove no word can carry two errors. */
export function allActivePassage(rng: Rng, templateIndex: number): TypoPassage {
  const n = slotCount(templateIndex);
  return generatePassage(rng, { minErrors: n, maxErrors: n, templateIndex });
}

export function tokenText(tokens: readonly TypoToken[]): string {
  return tokens.map((t) => t.text).join(' ');
}
