import { parseDegreeLabel } from './scales';

export const PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function normalizePc(n: number): number {
  return ((n % 12) + 12) % 12;
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function pcToName(pc: number, preferSharps = true): string {
  const n = normalizePc(pc);
  return preferSharps ? SHARP_NAMES[n] : FLAT_NAMES[n];
}

export function nameToPc(name: string): number {
  const n = PC[name];
  if (n == null) throw new Error(`Unknown note name: ${name}`);
  return n;
}

/** Frequency in Hz of a MIDI note number (A4 = 69 = 440 Hz). */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Keys offered in the KEY menu: chromatic order, both spellings for black keys. */
export const KEY_NAMES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];

/** Spells a pitch class on a letter (0 = C … 6 = B), e.g. (10, 6) => 'Bb'. Null if it needs more than a double accidental. */
function spellOnLetter(pc: number, letterIndex: number): string | null {
  let offset = normalizePc(pc - LETTER_PCS[letterIndex]);
  if (offset > 6) offset -= 12;
  if (Math.abs(offset) > 2) return null;
  return LETTERS[letterIndex] + (offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset));
}

/**
 * Note name for each scale degree. A degree's letter comes from its label's number counted
 * up from the key letter, so F major gets Bb (a kind of 4th), not A#.
 */
export function spellScaleDegrees(keyName: string, intervals: number[], degreeLabels: string[]): string[] {
  const rootPc = nameToPc(keyName);
  const rootLetter = LETTERS.indexOf(keyName[0]);
  const preferSharps = !keyName.slice(1).includes('b');
  return intervals.map((interval, i) => {
    const pc = normalizePc(rootPc + interval);
    const label = parseDegreeLabel(degreeLabels[i] ?? '');
    const spelled = label && rootLetter >= 0 ? spellOnLetter(pc, (rootLetter + label.number - 1) % 7) : null;
    return spelled ?? pcToName(pc, preferSharps);
  });
}
