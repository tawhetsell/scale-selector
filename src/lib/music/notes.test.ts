import { describe, expect, it } from 'vitest';
import { KEY_NAMES, midiToFrequency, nameToPc, spellScaleDegrees } from './notes';
import { SCALES } from './scales';

const spell = (key: string, scaleId: string) =>
  spellScaleDegrees(key, SCALES[scaleId].intervals, SCALES[scaleId].degreeLabels);

describe('spellScaleDegrees', () => {
  it('spells major keys with one letter per degree', () => {
    expect(spell('F', 'major')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
    expect(spell('Bb', 'major')).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']);
    expect(spell('E', 'major')).toEqual(['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#']);
    expect(spell('Db', 'major')).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']);
    expect(spell('C#', 'major')).toEqual(['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#']);
  });

  it('uses double sharps where the scale needs them', () => {
    expect(spell('G#', 'harmonicMinor')).toEqual(['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F##']);
  });

  it('spells altered degrees from the degree labels', () => {
    expect(spell('C', 'aeolian')).toEqual(['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']);
    expect(spell('E', 'pentatonicBlues')).toEqual(['E', 'G', 'A', 'Bb', 'B', 'D']);
  });

  it('accepts every key in the KEY menu', () => {
    for (const key of KEY_NAMES) {
      expect(() => nameToPc(key)).not.toThrow();
      expect(spell(key, 'major')).toHaveLength(7);
    }
  });
});

describe('midiToFrequency', () => {
  it('converts MIDI notes to Hz', () => {
    expect(midiToFrequency(69)).toBe(440); // A4
    expect(midiToFrequency(40)).toBeCloseTo(82.41, 2); // low E string
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 2); // middle C
  });
});
