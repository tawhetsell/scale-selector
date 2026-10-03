import { describe, expect, it } from 'vitest';
import { getChordDegrees, type Inversion } from './chords';
import { computeFretMap } from './theory';
import { getTuningPreset } from './tunings';
import { findChordShapes, findLowestMarker, getChordVoicingMidi, getPositionWindow } from './voicings';

const E_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const markers = computeFretMap(getTuningPreset(6), 12, 4, E_MAJOR);

describe('getTuningPreset', () => {
  it('returns MIDI notes, lowest string first', () => {
    expect(getTuningPreset(6)).toEqual([40, 45, 50, 55, 59, 64]);
    expect(getTuningPreset(6, true)[0]).toBe(38); // drop D
    expect(getTuningPreset(7)[0]).toBe(35); // low B
  });
});

describe('findChordShapes', () => {
  for (const inversion of [0, 1, 2] as Inversion[]) {
    it(`puts the requested bass note lowest (inversion ${inversion})`, () => {
      const degrees = getChordDegrees(7, 1, 3, inversion);
      const shapes = findChordShapes(markers, degrees, degrees[0]);
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        const lowest = shape.reduce((a, b) => (b.midi < a.midi ? b : a));
        expect(lowest.degree).toBe(degrees[0]);
        expect(new Set(shape.map((m) => m.degree))).toEqual(new Set(degrees));
        const frets = shape.map((m) => m.fret);
        expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(4);
        shape.forEach((m, i) => expect(m.stringIndex).toBe(shape[0].stringIndex + i));
      }
    });
  }

  it('finds the open E major shape on the D, G and B strings', () => {
    const shapes = findChordShapes(markers, [1, 3, 5], 1);
    expect(shapes.map((s) => s.map((m) => `${m.stringIndex}:${m.fret}`))).toContainEqual(['2:2', '3:1', '4:0']);
  });

  it('builds four-note shapes for seventh chords', () => {
    const degrees = getChordDegrees(7, 5, 4); // B7 in E major
    const shapes = findChordShapes(markers, degrees, degrees[0]);
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.every((s) => s.length === 4)).toBe(true);
  });
});

describe('getPositionWindow', () => {
  it('runs from two frets below the root to three above', () => {
    expect(getPositionWindow(markers, 2)).toEqual({ minFret: 0, maxFret: 5 }); // E on the D string, fret 2
    expect(getPositionWindow(markers, 1)).toEqual({ minFret: 5, maxFret: 10 }); // E on the A string, fret 7
  });
});

describe('findLowestMarker', () => {
  it('returns the lowest-pitched note, not the one on the highest string', () => {
    const firstPosition = markers.filter((m) => m.fret <= 5);
    expect(findLowestMarker(firstPosition, 2)).toMatchObject({ stringIndex: 0, fret: 2 }); // F# on the low E string
  });
});

describe('getChordVoicingMidi', () => {
  it('stacks the voicing upward from the bass note', () => {
    const cMajor = [0, 2, 4, 5, 7, 9, 11];
    expect(getChordVoicingMidi(0, cMajor, [1, 3, 5], 48)).toEqual([48, 52, 55]); // C3 E3 G3
    expect(getChordVoicingMidi(0, cMajor, [3, 5, 1], 48)).toEqual([52, 55, 60]); // E3 G3 C4
    expect(getChordVoicingMidi(0, cMajor, [5, 7, 2, 4], 48)).toEqual([55, 59, 62, 65]); // G7: G3 B3 D4 F4
  });
});
