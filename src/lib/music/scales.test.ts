import { describe, expect, it } from 'vitest';
import { SCALES, formatDegreeLabel, parseDegreeLabel } from './scales';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

describe('SCALES', () => {
  it('lists ascending intervals from 0 with one label per note', () => {
    for (const scale of Object.values(SCALES)) {
      const ascending = scale.intervals.every((v, i) => v < 12 && (i === 0 || v > scale.intervals[i - 1]));
      expect(scale.intervals[0], scale.id).toBe(0);
      expect(ascending, scale.id).toBe(true);
      expect(scale.degreeLabels.length, scale.id).toBe(scale.intervals.length);
    }
  });

  it('labels every degree with its actual pitch', () => {
    for (const scale of Object.values(SCALES)) {
      scale.degreeLabels.forEach((label, i) => {
        const parsed = parseDegreeLabel(label)!;
        const shift = parsed.accidental === 'b' ? -1 : parsed.accidental === '#' ? 1 : 0;
        expect(MAJOR[(parsed.number - 1) % 7] + shift, `${scale.id} ${label}`).toBe(scale.intervals[i]);
      });
    }
  });
});

describe('formatDegreeLabel', () => {
  it('writes accidentals as music signs', () => {
    expect(formatDegreeLabel('b3')).toBe('♭3');
    expect(formatDegreeLabel('#2/♭3')).toBe('♯2/♭3');
    expect(formatDegreeLabel('5')).toBe('5');
  });
});
