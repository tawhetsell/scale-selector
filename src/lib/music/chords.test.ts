import { describe, expect, it } from 'vitest';
import {
  describeChords,
  getChordDegrees,
  getChordIntervals,
  getChordSymbol,
  getRomanNumeral,
  type ChordSize,
} from './chords';
import { spellScaleDegrees } from './notes';
import { SCALES } from './scales';

const symbols = (scaleId: string, size: ChordSize) =>
  SCALES[scaleId].intervals.map((_, i) => getChordSymbol(getChordIntervals(SCALES[scaleId].intervals, i + 1, size)));

describe('getChordDegrees', () => {
  it('stacks thirds within the scale', () => {
    expect(getChordDegrees(7, 1, 3)).toEqual([1, 3, 5]);
    expect(getChordDegrees(7, 2, 4)).toEqual([2, 4, 6, 1]);
    expect(getChordDegrees(7, 7, 3)).toEqual([7, 2, 4]);
  });

  it('rotates so the inversion bass note comes first', () => {
    expect(getChordDegrees(7, 1, 3, 1)).toEqual([3, 5, 1]);
    expect(getChordDegrees(7, 1, 3, 2)).toEqual([5, 1, 3]);
    expect(getChordDegrees(7, 5, 4, 3)).toEqual([4, 5, 7, 2]);
  });
});

describe('getChordSymbol', () => {
  it('names major-scale triads and seventh chords', () => {
    expect(symbols('major', 3)).toEqual(['', 'm', 'm', '', '', 'm', '°']);
    expect(symbols('major', 4)).toEqual(['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'ø7']);
  });

  it('names harmonic-minor seventh chords', () => {
    expect(symbols('harmonicMinor', 4)).toEqual(['m(maj7)', 'ø7', '+maj7', 'm7', '7', 'maj7', '°7']);
  });

  it('describes chords that are not stacked major/minor thirds instead of calling them major', () => {
    expect(getChordSymbol([0, 4, 6])).toBe('(b5)');
    expect(getChordSymbol([0, 2, 6])).toBe('sus2(b5)');
    expect(getChordSymbol([0, 4, 6, 10])).toBe('7(b5)');
    expect(getChordSymbol([0, 5, 7, 11])).toBe('maj7sus4');
  });
});

describe('getRomanNumeral', () => {
  it('takes the accidental from the degree label and the case from the chord', () => {
    expect(getRomanNumeral('b7', [0, 4, 7])).toBe('bVII');
    expect(getRomanNumeral('♯4', [0, 3, 6])).toBe('#iv°');
    expect(getRomanNumeral('2', [0, 3, 7, 10])).toBe('ii7');
    expect(getRomanNumeral('7', [0, 3, 6, 10])).toBe('viiø7');
    expect(getRomanNumeral('1', [0, 4, 7, 11])).toBe('Imaj7');
    expect(getRomanNumeral('1', [0, 3, 7, 11])).toBe('i(maj7)');
  });
});

describe('describeChords', () => {
  it('names seventh chords as seventh chords', () => {
    const scale = SCALES.major;
    const names = spellScaleDegrees('E', scale.intervals, scale.degreeLabels);
    expect(describeChords(scale, [2, 5, 1], 4, names)).toEqual([
      { rootDegree: 2, numeral: 'ii7', name: 'F#m7' },
      { rootDegree: 5, numeral: 'V7', name: 'B7' },
      { rootDegree: 1, numeral: 'Imaj7', name: 'Emaj7' },
    ]);
  });

  it('keeps accidentals in numerals and flats in chord names', () => {
    const scale = SCALES.aeolian;
    const names = spellScaleDegrees('C', scale.intervals, scale.degreeLabels);
    expect(describeChords(scale, [1, 6, 7], 3, names).map((c) => `${c.numeral} ${c.name}`)).toEqual([
      'i Cm',
      'bVI Ab',
      'bVII Bb',
    ]);
  });
});
