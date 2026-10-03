import { parseDegreeLabel, type ScaleDef } from './scales';

export type ChordSize = 3 | 4;

/** 0 = root position, 1 = 1st inversion (3rd in the bass), 2 = 2nd (5th), 3 = 3rd (7th, tetrads only). */
export type Inversion = 0 | 1 | 2 | 3;

export type TriadDef = {
  rootDegree: number;   // 1..n
  degrees: number[];    // e.g. [1,3,5]
};

/**
 * Scale degrees of the chord on rootDegree, stacked in thirds within the scale and rotated
 * so the inversion's bass note comes first:
 *  (7, 1, 3)    -> [1, 3, 5]
 *  (7, 2, 4)    -> [2, 4, 6, 1]
 *  (7, 1, 3, 1) -> [3, 5, 1]
 */
export function getChordDegrees(
  scaleLength: number,
  rootDegree: number,
  size: ChordSize,
  inversion: Inversion = 0
): number[] {
  const degrees = Array.from({ length: size }, (_, k) => ((rootDegree - 1 + 2 * k) % scaleLength) + 1);
  const shift = inversion % size;
  return [...degrees.slice(shift), ...degrees.slice(0, shift)];
}

/**
 * Diatonic triads for a scale:
 *  degree 1 -> [1,3,5]
 *  degree 2 -> [2,4,6]
 *  etc.
 */
export function getScaleTriads(scale: ScaleDef): TriadDef[] {
  return scale.intervals.map((_, i) => ({
    rootDegree: i + 1,
    degrees: getChordDegrees(scale.intervals.length, i + 1, 3),
  }));
}

/** Semitones above the chord root for each chord tone in root position, e.g. [0, 4, 7, 11]. */
export function getChordIntervals(scaleIntervals: number[], rootDegree: number, size: ChordSize): number[] {
  const root = scaleIntervals[rootDegree - 1];
  return getChordDegrees(scaleIntervals.length, rootDegree, size).map(
    (degree) => (scaleIntervals[degree - 1] - root + 12) % 12
  );
}

const FIFTH_ALTERATIONS: Record<number, string> = { 5: 'bb5', 6: 'b5', 8: '#5', 9: '##5' };

/**
 * Chord suffix from the chord's intervals: '' (major), 'm', '°', '+', 'maj7', '7', 'm7', 'ø7',
 * '°7', 'm(maj7)', '+maj7', '+7'. Chords that aren't stacked major/minor thirds get descriptive
 * names such as 'sus2', '(b5)' or '7(b5)' instead of being called major.
 */
export function getChordSymbol(chordIntervals: number[]): string {
  const [, third, fifth, seventh] = chordIntervals;
  const isDim = third === 3 && fifth === 6;
  const isAug = third === 4 && fifth === 8;

  if (seventh === undefined) {
    if (isDim) return '°';
    if (isAug) return '+';
  } else {
    if (isDim && seventh === 9) return '°7';
    if (isDim && seventh === 10) return 'ø7';
    if (isDim && seventh === 11) return '°(maj7)';
    if (isAug && seventh === 10) return '+7';
    if (isAug && seventh === 11) return '+maj7';
  }

  const minor = third === 3 ? 'm' : '';
  const sus = third === 2 ? 'sus2' : third === 5 ? 'sus4' : '';
  const extras: string[] = [];
  let seventhPart = '';
  if (seventh === 10) seventhPart = '7';
  else if (seventh === 9) seventhPart = '6';
  else if (seventh === 11) {
    if (minor) extras.push('maj7');
    else seventhPart = 'maj7';
  }
  if (FIFTH_ALTERATIONS[fifth]) extras.push(FIFTH_ALTERATIONS[fifth]);

  return minor + seventhPart + sus + (extras.length > 0 ? `(${extras.join(',')})` : '');
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/**
 * Roman numeral for a chord. The accidental and number come from the root's degree label;
 * the case and suffix come from the chord: ('b7', [0,4,7]) -> 'bVII', ('2', [0,3,7,10]) -> 'ii7',
 * ('♯4', [0,3,6]) -> '#iv°'.
 */
export function getRomanNumeral(degreeLabel: string, chordIntervals: number[]): string {
  const label = parseDegreeLabel(degreeLabel);
  const numeral = label ? ROMAN[(label.number - 1) % 7] : '?';
  const isMinor = chordIntervals[1] === 3;
  const symbol = getChordSymbol(chordIntervals);
  // Lowercase already says "minor", so drop the symbol's leading 'm' (but not the one in 'maj7').
  const suffix = isMinor && symbol.startsWith('m') && !symbol.startsWith('maj') ? symbol.slice(1) : symbol;
  return (label?.accidental ?? '') + (isMinor ? numeral.toLowerCase() : numeral) + suffix;
}

export type ChordLabel = {
  rootDegree: number;
  numeral: string;  // e.g. 'ii7'
  name: string;     // e.g. 'F#m7'
};

/**
 * Numeral and chord name for each chord root, using the spelled scale degrees for names:
 * E major, [2, 5, 1], tetrads -> ii7 F#m7, V7 B7, Imaj7 Emaj7.
 */
export function describeChords(
  scale: ScaleDef,
  rootDegrees: number[],
  size: ChordSize,
  degreeNames: string[]
): ChordLabel[] {
  return rootDegrees.map((rootDegree) => {
    const chordIntervals = getChordIntervals(scale.intervals, rootDegree, size);
    return {
      rootDegree,
      numeral: getRomanNumeral(scale.degreeLabels[rootDegree - 1], chordIntervals),
      name: degreeNames[rootDegree - 1] + getChordSymbol(chordIntervals),
    };
  });
}
