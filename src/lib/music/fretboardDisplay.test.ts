import { describe, expect, it } from 'vitest';
import { getChordDegrees, type ChordSize, type Inversion } from './chords';
import { findChordShape, getFretboardDisplay, hasThickRing, type FretboardDisplayOptions } from './fretboardDisplay';
import { SCALES } from './scales';
import { computeFretMap } from './theory';
import { getTuningPreset } from './tunings';
import { findChordShapes, getPositionWindow } from './voicings';

const E_MAJOR = SCALES.major.intervals;
const markers = computeFretMap(getTuningPreset(6), 12, 4, E_MAJOR); // E major, 6 strings, 12 frets

const display = (options: Partial<FretboardDisplayOptions>) =>
  getFretboardDisplay({
    markers,
    scaleLength: 7,
    strings: 6,
    maxFrets: 12,
    chordSize: 3,
    chordRootDegree: 1,
    progressionNumerals: null,
    inversion: 0,
    rootString: 4,
    currentStep: null,
    ...options,
  });

const positions = (notes: { marker: { stringIndex: number; fret: number } }[]) =>
  notes.map(({ marker }) => [marker.stringIndex, marker.fret]);
const ringed = (options: Partial<FretboardDisplayOptions>) =>
  display(options).notes.filter((n) => hasThickRing(n.ring));
const sorted = (list: number[][]) => [...list].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

const I_IV_V = [1, 4, 5];

describe('findChordShape', () => {
  // Root on the 4th string (D): E at fret 2, so the position is frets 0-5
  const window = getPositionWindow(markers, 2, 12);
  const shape = (root: number, inversion: Inversion, size: ChordSize = 3) =>
    findChordShape(markers, getChordDegrees(7, root, size, inversion), window)!.map((m) => [m.stringIndex, m.fret]);

  it('uses the frets 0-5 position for the root on the 4th string', () => {
    expect(window).toEqual({ minFret: 0, maxFret: 5 });
  });

  it.each([
    [1, 0, [[2, 2], [3, 1], [4, 0]]], // E G# B
    [1, 1, [[0, 4], [1, 2], [2, 2]]], // G# B E
    [1, 2, [[1, 2], [2, 2], [3, 1]]], // B E G#
    [4, 0, [[0, 5], [1, 4], [2, 2]]], // A C# E
    [5, 2, [[0, 2], [1, 2], [2, 1]]], // F# B D#
  ] as [number, Inversion, number[][]][])(
    'inside the position, picks the shape with the lowest bass (degree %i, inversion %i)',
    (root, inversion, expected) => {
      expect(shape(root, inversion)).toEqual(expected); // bass note first
    }
  );

  it('falls back to the nearest shape outside the position', () => {
    // B in 1st inversion (D# F# B): D# on the 5th string at fret 6, F# and B at fret 4
    expect(shape(5, 1)).toEqual([[1, 6], [2, 4], [3, 4]]);
  });

  it('finds four-string shapes for tetrads', () => {
    const f = shape(2, 0, 4); // F#m7
    expect(f).toHaveLength(4);
    expect(f.map(([s]) => s)).toEqual([f[0][0], f[0][0] + 1, f[0][0] + 2, f[0][0] + 3]);
  });

  it('without a window, takes the lowest-bass shape on the whole neck', () => {
    const degrees = getChordDegrees(7, 1, 3, 0);
    const all = findChordShapes(markers, degrees, 1);
    const lowest = all.reduce((a, b) => (b[0].midi < a[0].midi ? b : a));
    expect(findChordShape(markers, degrees, null)).toEqual(lowest);
  });

  it.each([
    [2, 1],
    [7, 2],
  ] as [number, Inversion][])('with no playable shape, gives just the lowest bass note (G Enigmatic, drop, degree %i)', (root, inversion) => {
    // The only two setups with no playable shape: G Enigmatic tetrads in drop tuning on 6 strings
    const enigmatic = computeFretMap(getTuningPreset(6, true), 12, 7, SCALES.enigmatic.intervals);
    const degrees = getChordDegrees(7, root, 4, inversion);
    expect(findChordShapes(enigmatic, degrees, degrees[0])).toEqual([]);
    const result = findChordShape(enigmatic, degrees, getPositionWindow(enigmatic, 2, 12))!;
    expect(result).toHaveLength(1);
    expect(result[0].degree).toBe(degrees[0]);
  });
});

describe('getFretboardDisplay: scale mode', () => {
  it('draws every scale note with a medium ring on degree 1 only', () => {
    const { notes, chordsByDegree } = display({ chordSize: null });
    expect(notes).toHaveLength(markers.length);
    expect(notes.every((n) => n.ring === (n.marker.degree === 1 ? 'accent' : 'plain'))).toBe(true);
    expect(chordsByDegree).toBeNull();
  });
});

describe('getFretboardDisplay: single chord', () => {
  for (const inversion of [0, 1, 2] as Inversion[]) {
    it(`draws every chord tone and rings one shape with the halo on the bass (inversion ${inversion})`, () => {
      const degrees = getChordDegrees(7, 4, 3, inversion);
      const { notes } = display({ chordRootDegree: 4, inversion });
      expect(notes).toHaveLength(markers.filter((m) => degrees.includes(m.degree)).length);
      const thick = notes.filter((n) => hasThickRing(n.ring));
      expect(thick).toHaveLength(3);
      expect(new Set(thick.map((n) => n.marker.degree))).toEqual(new Set(degrees));
      expect(new Set(thick.map((n) => n.marker.stringIndex)).size).toBe(3);
      const anchors = notes.filter((n) => n.ring === 'anchor');
      expect(anchors).toHaveLength(1);
      expect(anchors[0].marker.degree).toBe(degrees[0]);
      // No medium ring on degree 1 or on the chord root while a shape is shown
      expect(notes.filter((n) => !hasThickRing(n.ring)).every((n) => n.ring === 'plain')).toBe(true);
    });
  }

  it('puts the shape in the String menu’s position', () => {
    // A in root position, root on the 4th string (frets 0-5)
    expect(sorted(positions(ringed({ chordRootDegree: 4 })))).toEqual([[0, 5], [1, 4], [2, 2]]);
    // Root on the 5th string: frets 5-10
    expect(ringed({ chordRootDegree: 4, rootString: 5 }).every((n) => n.marker.fret >= 5 && n.marker.fret <= 10)).toBe(true);
    // Root on the 6th string: frets 0-5 (the open position wins on a 12-fret neck)
    expect(ringed({ chordRootDegree: 4, rootString: 6 }).every((n) => n.marker.fret <= 5)).toBe(true);
  });

  it('rings four strings for tetrads', () => {
    const thick = ringed({ chordSize: 4, chordRootDegree: 2 });
    expect(thick).toHaveLength(4);
    expect(new Set(thick.map((n) => n.marker.degree))).toEqual(new Set([2, 4, 6, 1]));
  });

  it.each([
    [2, 1],
    [7, 2],
  ] as [number, Inversion][])('with no playable shape, rings only the bass (G Enigmatic, drop, degree %i)', (root, inversion) => {
    const enigmatic = computeFretMap(getTuningPreset(6, true), 12, 7, SCALES.enigmatic.intervals);
    const degrees = getChordDegrees(7, root, 4, inversion);
    const { notes } = display({ markers: enigmatic, chordSize: 4, chordRootDegree: root, inversion });
    expect(notes).toHaveLength(enigmatic.filter((m) => degrees.includes(m.degree)).length);
    const thick = notes.filter((n) => hasThickRing(n.ring));
    expect(thick).toHaveLength(1);
    expect(thick[0].ring).toBe('anchor');
    expect(thick[0].marker.degree).toBe(degrees[0]);
  });
});

describe('getFretboardDisplay: progression', () => {
  it('draws every chord’s tones in the position and rings the current chord’s shape', () => {
    // ii-V-I, first chord F#m in root position: F# on the 4th string (fret 4), A and C# at fret 2
    const { notes, chordsByDegree } = display({ progressionNumerals: [2, 5, 1], currentStep: 0 });
    expect(notes.every((n) => n.marker.fret <= 5)).toBe(true);
    expect(new Set(notes.map((n) => n.marker.degree))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    expect(chordsByDegree?.get(2)).toEqual([0, 1]); // F# is in F#m and B
    expect(positions(notes.filter((n) => n.ring === 'anchor'))).toEqual([[2, 4]]);
    expect(sorted(positions(notes.filter((n) => n.ring === 'shape')))).toEqual([[3, 2], [4, 2]]);
    expect(notes.filter((n) => n.ring !== 'plain')).toHaveLength(3); // no medium rings
  });

  it.each([
    [0, 0, [[2, 2], [3, 1], [4, 0]]], // E G# B
    [1, 0, [[0, 4], [1, 2], [2, 2]]], // G# B E
    [2, 0, [[1, 2], [2, 2], [3, 1]]], // B E G#
    [0, 1, [[0, 5], [1, 4], [2, 2]]], // A C# E
    [2, 2, [[0, 2], [1, 2], [2, 1]]], // F# B D#
  ] as [Inversion, number, number[][]][])(
    'I-IV-V inversion %i, step %i: rings the shape with the halo on its bass',
    (inversion, step, expected) => {
      const { notes } = display({ progressionNumerals: I_IV_V, inversion, currentStep: step });
      expect(sorted(positions(notes.filter((n) => hasThickRing(n.ring))))).toEqual(sorted(expected));
      expect(positions(notes.filter((n) => n.ring === 'anchor'))).toEqual([expected[0]]);
    }
  );

  it('draws and rings a shape that reaches outside the position', () => {
    // B in 1st inversion has no shape in frets 0-5; the nearest is D# (5th string, fret 6), F#, B (fret 4)
    const { notes } = display({ progressionNumerals: I_IV_V, inversion: 1, currentStep: 2 });
    expect(sorted(positions(notes.filter((n) => hasThickRing(n.ring))))).toEqual([[1, 6], [2, 4], [3, 4]]);
    expect(positions(notes.filter((n) => n.ring === 'anchor'))).toEqual([[1, 6]]);
    expect(positions(notes.filter((n) => n.marker.fret > 5))).toEqual([[1, 6]]); // only the shape's note
  });

  it('rings four strings for tetrads', () => {
    const thick = ringed({ chordSize: 4, progressionNumerals: [2, 5, 1], currentStep: 0 });
    expect(thick).toHaveLength(4);
    expect(new Set(thick.map((n) => n.marker.degree))).toEqual(new Set([2, 4, 6, 1]));
    expect(new Set(thick.map((n) => n.marker.stringIndex)).size).toBe(4);
  });

  it('moves the position with the String menu', () => {
    // Root on the 5th string (A): E at fret 7, frets 5-10; the halo is on F#m's bass
    const { notes } = display({ progressionNumerals: [2, 5, 1], currentStep: 0, rootString: 5 });
    expect(notes.every((n) => n.marker.fret >= 5 && n.marker.fret <= 10)).toBe(true);
    const anchor = notes.find((n) => n.ring === 'anchor')!;
    expect(anchor.marker.degree).toBe(2);
  });

  it('with no current chord, rings each chord’s lowest bass and the key root', () => {
    const { notes } = display({ progressionNumerals: [2, 5, 1], currentStep: null });
    const anchor = notes.filter((n) => n.ring === 'anchor');
    expect(positions(anchor)).toEqual([[2, 2]]); // E on the 4th string
    expect(notes.filter((n) => n.ring === 'bass').length).toBeGreaterThan(0);
    expect(notes.some((n) => n.ring === 'shape')).toBe(false);
  });
});
