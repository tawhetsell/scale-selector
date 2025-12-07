import { SCALES, type ScaleDef } from './scales';

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'maj7' | 'min7' | 'dom7' | 'dim7' | 'minMaj7' | 'aug7' | 'half-dim';

export type Progression = {
  name: string;
  numerals: number[];
};

export type ScaleProgressionDef = {
  chordQualities: ChordQuality[];
  progressions: Progression[];
};

/**
 * Derives triad chord quality from scale intervals.
 * Looks at the intervals from root to 3rd and root to 5th.
 */
function deriveChordQuality(scale: ScaleDef, degreeIndex: number): ChordQuality {
  const n = scale.intervals.length;
  if (n < 5) return 'maj'; // Not enough notes for proper triads

  const rootInterval = scale.intervals[degreeIndex];
  const thirdIndex = (degreeIndex + 2) % n;
  const fifthIndex = (degreeIndex + 4) % n;

  const thirdInterval = (scale.intervals[thirdIndex] - rootInterval + 12) % 12;
  const fifthInterval = (scale.intervals[fifthIndex] - rootInterval + 12) % 12;

  // Determine quality based on 3rd and 5th intervals
  const isMinorThird = thirdInterval === 3;
  const isMajorThird = thirdInterval === 4;
  const isDiminishedFifth = fifthInterval === 6;
  const isPerfectFifth = fifthInterval === 7;
  const isAugmentedFifth = fifthInterval === 8;

  if (isMajorThird && isAugmentedFifth) return 'aug';
  if (isMinorThird && isDiminishedFifth) return 'dim';
  if (isMinorThird && isPerfectFifth) return 'min';
  if (isMajorThird && isPerfectFifth) return 'maj';

  // Fallback for unusual intervals
  if (isMinorThird) return 'min';
  if (isMajorThird) return 'maj';
  return 'maj';
}

/**
 * Derives chord qualities for all degrees of a scale.
 */
function deriveChordQualities(scale: ScaleDef): ChordQuality[] {
  return scale.intervals.map((_, i) => deriveChordQuality(scale, i));
}

/**
 * Scale progressions with chord qualities and common progressions.
 * Only 7-note scales get full progression support.
 */
export const SCALE_PROGRESSIONS: Record<string, ScaleProgressionDef> = {
  // --- 7-note diatonic (church modes) ---
  major: {
    chordQualities: deriveChordQualities(SCALES.major),
    progressions: [
      { name: 'I-IV-V', numerals: [1, 4, 5] },
      { name: 'I-V-vi-IV', numerals: [1, 5, 6, 4] },
      { name: 'ii-V-I', numerals: [2, 5, 1] },
      { name: 'I-vi-IV-V', numerals: [1, 6, 4, 5] },
      { name: 'I-IV-vi-V', numerals: [1, 4, 6, 5] },
    ],
  },
  ionian: {
    chordQualities: deriveChordQualities(SCALES.ionian),
    progressions: [
      { name: 'I-IV-V', numerals: [1, 4, 5] },
      { name: 'I-V-vi-IV', numerals: [1, 5, 6, 4] },
      { name: 'ii-V-I', numerals: [2, 5, 1] },
      { name: 'I-vi-IV-V', numerals: [1, 6, 4, 5] },
      { name: 'I-IV-vi-V', numerals: [1, 4, 6, 5] },
    ],
  },
  dorian: {
    chordQualities: deriveChordQualities(SCALES.dorian),
    progressions: [
      { name: 'i-IV', numerals: [1, 4] },
      { name: 'i-ii-IV', numerals: [1, 2, 4] },
      { name: 'i-IV-v', numerals: [1, 4, 5] },
      { name: 'i-bVII-IV', numerals: [1, 7, 4] },
    ],
  },
  phrygian: {
    chordQualities: deriveChordQualities(SCALES.phrygian),
    progressions: [
      { name: 'i-bII', numerals: [1, 2] },
      { name: 'i-bVII-bVI-bII', numerals: [1, 7, 6, 2] },
      { name: 'i-bII-i', numerals: [1, 2, 1] },
      { name: 'i-bII-bVII', numerals: [1, 2, 7] },
    ],
  },
  lydian: {
    chordQualities: deriveChordQualities(SCALES.lydian),
    progressions: [
      { name: 'I-II', numerals: [1, 2] },
      { name: 'I-II-viio', numerals: [1, 2, 7] },
      { name: 'I-II-iii', numerals: [1, 2, 3] },
      { name: 'I-II-V', numerals: [1, 2, 5] },
    ],
  },
  mixolydian: {
    chordQualities: deriveChordQualities(SCALES.mixolydian),
    progressions: [
      { name: 'I-bVII-IV', numerals: [1, 7, 4] },
      { name: 'I-bVII', numerals: [1, 7] },
      { name: 'I-IV-bVII', numerals: [1, 4, 7] },
      { name: 'I-ii-bVII', numerals: [1, 2, 7] },
    ],
  },
  aeolian: {
    chordQualities: deriveChordQualities(SCALES.aeolian),
    progressions: [
      { name: 'i-iv-v', numerals: [1, 4, 5] },
      { name: 'i-bVII-bVI', numerals: [1, 7, 6] },
      { name: 'i-iv-bVII', numerals: [1, 4, 7] },
      { name: 'i-bVI-bVII', numerals: [1, 6, 7] },
      { name: 'i-bVI-bIII-bVII', numerals: [1, 6, 3, 7] },
    ],
  },
  locrian: {
    chordQualities: deriveChordQualities(SCALES.locrian),
    progressions: [
      { name: 'io-bII', numerals: [1, 2] },
      { name: 'io-bII-biii', numerals: [1, 2, 3] },
      { name: 'io-bV-bII', numerals: [1, 5, 2] },
    ],
  },

  // --- Harmonic Minor + modes ---
  harmonicMinor: {
    chordQualities: deriveChordQualities(SCALES.harmonicMinor),
    progressions: [
      { name: 'i-iv-V', numerals: [1, 4, 5] },
      { name: 'i-bVI-V', numerals: [1, 6, 5] },
      { name: 'i-iv-V-i', numerals: [1, 4, 5, 1] },
      { name: 'i-viio-V', numerals: [1, 7, 5] },
      { name: 'bVI-V-i', numerals: [6, 5, 1] },
    ],
  },
  locrianNat6: {
    chordQualities: deriveChordQualities(SCALES.locrianNat6),
    progressions: [
      { name: 'io-bII-VI', numerals: [1, 2, 6] },
      { name: 'io-VI-bII', numerals: [1, 6, 2] },
      { name: 'io-bV-VI', numerals: [1, 5, 6] },
    ],
  },
  ionianSharp5: {
    chordQualities: deriveChordQualities(SCALES.ionianSharp5),
    progressions: [
      { name: 'I+-IV', numerals: [1, 4] },
      { name: 'I+-ii-IV', numerals: [1, 2, 4] },
      { name: 'I+-V-IV', numerals: [1, 5, 4] },
    ],
  },
  dorianSharp4: {
    chordQualities: deriveChordQualities(SCALES.dorianSharp4),
    progressions: [
      { name: 'i-II-IV', numerals: [1, 2, 4] },
      { name: 'i-#ivo-bVII', numerals: [1, 4, 7] },
      { name: 'i-II-v', numerals: [1, 2, 5] },
    ],
  },
  phrygianDom: {
    chordQualities: deriveChordQualities(SCALES.phrygianDom),
    progressions: [
      { name: 'I-bII', numerals: [1, 2] },
      { name: 'I-bII-bvii', numerals: [1, 2, 7] },
      { name: 'I-bvii-bVI-bII', numerals: [1, 7, 6, 2] },
      { name: 'I-iv-bII', numerals: [1, 4, 2] },
    ],
  },
  lydianSharp2: {
    chordQualities: deriveChordQualities(SCALES.lydianSharp2),
    progressions: [
      { name: 'I-#II-#IV', numerals: [1, 2, 4] },
      { name: 'I-iii-#II', numerals: [1, 3, 2] },
      { name: 'I-V-#II', numerals: [1, 5, 2] },
    ],
  },
  ultralocrian: {
    chordQualities: deriveChordQualities(SCALES.ultralocrian),
    progressions: [
      { name: 'io-bII-biii', numerals: [1, 2, 3] },
      { name: 'io-bV-bVI', numerals: [1, 5, 6] },
      { name: 'io-biii-bV', numerals: [1, 3, 5] },
    ],
  },

  // --- Melodic Minor (ascending) + modes ---
  melodicMinorAsc: {
    chordQualities: deriveChordQualities(SCALES.melodicMinorAsc),
    progressions: [
      { name: 'i-ii-V', numerals: [1, 2, 5] },
      { name: 'i-IV-V', numerals: [1, 4, 5] },
      { name: 'i-ii-viio', numerals: [1, 2, 7] },
      { name: 'i-IV-viio', numerals: [1, 4, 7] },
    ],
  },
  dorianb2: {
    chordQualities: deriveChordQualities(SCALES.dorianb2),
    progressions: [
      { name: 'i-bII-IV', numerals: [1, 2, 4] },
      { name: 'i-IV-v', numerals: [1, 4, 5] },
      { name: 'i-bII-bVII', numerals: [1, 2, 7] },
    ],
  },
  lydianAug: {
    chordQualities: deriveChordQualities(SCALES.lydianAug),
    progressions: [
      { name: 'I+-II', numerals: [1, 2] },
      { name: 'I+-II-iii', numerals: [1, 2, 3] },
      { name: 'I+-#ivo-II', numerals: [1, 4, 2] },
    ],
  },
  lydianDom: {
    chordQualities: deriveChordQualities(SCALES.lydianDom),
    progressions: [
      { name: 'I7-II', numerals: [1, 2] },
      { name: 'I7-II-viio', numerals: [1, 2, 7] },
      { name: 'I7-bVII-II', numerals: [1, 7, 2] },
      { name: 'I7-iii-II', numerals: [1, 3, 2] },
    ],
  },
  mixolydianb6: {
    chordQualities: deriveChordQualities(SCALES.mixolydianb6),
    progressions: [
      { name: 'I-bVI-bVII', numerals: [1, 6, 7] },
      { name: 'I-iv-bVII', numerals: [1, 4, 7] },
      { name: 'I-bVI-v', numerals: [1, 6, 5] },
    ],
  },
  locrianNat2: {
    chordQualities: deriveChordQualities(SCALES.locrianNat2),
    progressions: [
      { name: 'io-ii-bV', numerals: [1, 2, 5] },
      { name: 'io-bIII-bVII', numerals: [1, 3, 7] },
      { name: 'io-ii-bVII', numerals: [1, 2, 7] },
    ],
  },
  altered: {
    chordQualities: deriveChordQualities(SCALES.altered),
    progressions: [
      { name: 'I7alt-bII', numerals: [1, 2] },
      { name: 'I7alt-bV-bII', numerals: [1, 5, 2] },
      { name: 'I7alt-#IV-bII', numerals: [1, 4, 2] },
    ],
  },

  // --- Exotic heptatonic scales ---
  doubleHarmonic: {
    chordQualities: deriveChordQualities(SCALES.doubleHarmonic),
    progressions: [
      { name: 'I-bII-I', numerals: [1, 2, 1] },
      { name: 'I-bVI-bII', numerals: [1, 6, 2] },
      { name: 'I-iv-bII', numerals: [1, 4, 2] },
      { name: 'I-V-bII', numerals: [1, 5, 2] },
    ],
  },
  neapolitanMinor: {
    chordQualities: deriveChordQualities(SCALES.neapolitanMinor),
    progressions: [
      { name: 'i-bII-V', numerals: [1, 2, 5] },
      { name: 'i-bVI-V', numerals: [1, 6, 5] },
      { name: 'i-iv-bII', numerals: [1, 4, 2] },
    ],
  },
  neapolitanMajor: {
    chordQualities: deriveChordQualities(SCALES.neapolitanMajor),
    progressions: [
      { name: 'I-bII-V', numerals: [1, 2, 5] },
      { name: 'I-IV-bII', numerals: [1, 4, 2] },
      { name: 'I-vi-bII', numerals: [1, 6, 2] },
    ],
  },
  hungarianMinor: {
    chordQualities: deriveChordQualities(SCALES.hungarianMinor),
    progressions: [
      { name: 'i-#iv°-V', numerals: [1, 4, 5] },
      { name: 'i-bVI-V', numerals: [1, 6, 5] },
      { name: 'i-#iv°-bVI', numerals: [1, 4, 6] },
    ],
  },
  hungarianMajor: {
    chordQualities: deriveChordQualities(SCALES.hungarianMajor),
    progressions: [
      { name: 'I-#II-#IV', numerals: [1, 2, 4] },
      { name: 'I-vi-bVII', numerals: [1, 6, 7] },
      { name: 'I-#II-vi', numerals: [1, 2, 6] },
    ],
  },
  persian: {
    chordQualities: deriveChordQualities(SCALES.persian),
    progressions: [
      { name: 'I-bII-bV', numerals: [1, 2, 5] },
      { name: 'I-bVI-bII', numerals: [1, 6, 2] },
      { name: 'I-iv-bII', numerals: [1, 4, 2] },
    ],
  },
  enigmatic: {
    chordQualities: deriveChordQualities(SCALES.enigmatic),
    progressions: [
      { name: 'I-bII-#IV', numerals: [1, 2, 4] },
      { name: 'I-#V-bVII', numerals: [1, 5, 6] },
      { name: 'I-bII-VII', numerals: [1, 2, 7] },
    ],
  },
};

/**
 * Get progressions for a scale, returns null if scale doesn't support progressions.
 */
export function getScaleProgressions(scaleId: string): ScaleProgressionDef | null {
  return SCALE_PROGRESSIONS[scaleId] ?? null;
}

/**
 * Check if a scale supports chord progressions (7-note scales).
 */
export function supportsProgressions(scaleId: string): boolean {
  const scale = SCALES[scaleId];
  return scale && scale.intervals.length === 7 && scaleId in SCALE_PROGRESSIONS;
}
