import { SCALES, type ScaleDef } from './scales';
import { getChordIntervals, getRomanNumeral, type ChordSize } from './chords';

export type Progression = {
  name: string;       // generated, e.g. 'ii-V-I'
  numerals: number[]; // chord-root scale degrees, e.g. [2, 5, 1]
};

const MAJOR_PROGRESSIONS = [[1, 4, 5], [1, 5, 6, 4], [2, 5, 1], [1, 6, 4, 5], [1, 4, 6, 5]];

/**
 * Chord-root degrees of the named progressions for each 7-note scale.
 * Names are generated from the scale's chords (see getProgressionName), so they can't drift.
 */
const PROGRESSION_NUMERALS: Record<string, number[][]> = {
  // --- 7-note diatonic (church modes) ---
  major:           MAJOR_PROGRESSIONS,
  ionian:          MAJOR_PROGRESSIONS,
  dorian:          [[1, 4], [1, 2, 4], [1, 4, 5], [1, 7, 4]],
  phrygian:        [[1, 2], [1, 7, 6, 2], [1, 2, 1], [1, 2, 7]],
  lydian:          [[1, 2], [1, 2, 7], [1, 2, 3], [1, 2, 5]],
  mixolydian:      [[1, 7, 4], [1, 7], [1, 4, 7], [1, 2, 7]],
  aeolian:         [[1, 4, 5], [1, 7, 6], [1, 4, 7], [1, 6, 7], [1, 6, 3, 7]],
  locrian:         [[1, 2], [1, 2, 3], [1, 5, 2]],

  // --- Harmonic Minor + modes ---
  harmonicMinor:   [[1, 4, 5], [1, 6, 5], [1, 4, 5, 1], [1, 7, 5], [6, 5, 1]],
  locrianNat6:     [[1, 2, 6], [1, 6, 2], [1, 5, 6]],
  ionianSharp5:    [[1, 4], [1, 2, 4], [1, 5, 4]],
  dorianSharp4:    [[1, 2, 4], [1, 4, 7], [1, 2, 5]],
  phrygianDom:     [[1, 2], [1, 2, 7], [1, 7, 6, 2], [1, 4, 2]],
  lydianSharp2:    [[1, 2, 4], [1, 3, 2], [1, 5, 2]],
  ultralocrian:    [[1, 2, 3], [1, 5, 6], [1, 3, 5]],

  // --- Melodic Minor (ascending) + modes ---
  melodicMinorAsc: [[1, 2, 5], [1, 4, 5], [1, 2, 7], [1, 4, 7]],
  dorianb2:        [[1, 2, 4], [1, 4, 5], [1, 2, 7]],
  lydianAug:       [[1, 2], [1, 2, 3], [1, 4, 2]],
  lydianDom:       [[1, 2], [1, 2, 7], [1, 7, 2], [1, 3, 2]],
  mixolydianb6:    [[1, 6, 7], [1, 4, 7], [1, 6, 5]],
  locrianNat2:     [[1, 2, 5], [1, 3, 7], [1, 2, 7]],
  altered:         [[1, 2], [1, 5, 2], [1, 4, 2]],

  // --- Exotic heptatonic scales ---
  doubleHarmonic:  [[1, 2, 1], [1, 6, 2], [1, 4, 2], [1, 5, 2]],
  neapolitanMinor: [[1, 2, 5], [1, 6, 5], [1, 4, 2]],
  neapolitanMajor: [[1, 2, 5], [1, 4, 2], [1, 6, 2]],
  hungarianMinor:  [[1, 4, 5], [1, 6, 5], [1, 4, 6]],
  hungarianMajor:  [[1, 2, 4], [1, 6, 7], [1, 2, 6]],
  persian:         [[1, 2, 5], [1, 6, 2], [1, 4, 2]],
  enigmatic:       [[1, 2, 4], [1, 5, 6], [1, 2, 7]],
};

/** Progression name from the scale's chords, e.g. Aeolian [1, 6, 7] -> 'i-bVI-bVII'. */
export function getProgressionName(scale: ScaleDef, numerals: number[], size: ChordSize = 3): string {
  return numerals
    .map((degree) => getRomanNumeral(scale.degreeLabels[degree - 1], getChordIntervals(scale.intervals, degree, size)))
    .join('-');
}

/**
 * Named progressions for a scale (empty for scales without progressions).
 * Only 7-note scales get progressions.
 */
export function getScaleProgressions(scaleId: string): Progression[] {
  const scale = SCALES[scaleId];
  const lists = PROGRESSION_NUMERALS[scaleId];
  if (!scale || !lists || scale.intervals.length !== 7) return [];
  return lists.map((numerals) => ({ name: getProgressionName(scale, numerals), numerals }));
}

/**
 * Check if a scale supports chord progressions (7-note scales).
 */
export function supportsProgressions(scaleId: string): boolean {
  return getScaleProgressions(scaleId).length > 0;
}
