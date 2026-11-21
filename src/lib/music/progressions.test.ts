import { describe, expect, it } from 'vitest';
import { getScaleProgressions, supportsProgressions } from './progressions';
import { SCALES } from './scales';

const names = (scaleId: string) => getScaleProgressions(scaleId).map((p) => p.name);

describe('getScaleProgressions', () => {
  it('names progressions after the chords the scale actually has', () => {
    expect(names('major')).toEqual(['I-IV-V', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'I-IV-vi-V']);
    expect(names('aeolian')).toContain('i-bVI-bIII-bVII');
    expect(names('lydian')).toContain('I-II-vii'); // vii is minor in Lydian
    expect(names('phrygian')).toContain('i-bvii-bVI-bII'); // and bvii is minor in Phrygian
    expect(names('harmonicMinor')).toContain('i-vii°-i');
  });

  it('matches the iOS app’s lists for Harmonic Minor and Hungarian Minor', () => {
    expect(getScaleProgressions('harmonicMinor').map((p) => p.numerals)).toEqual([
      [1, 4, 5], [1, 6, 5], [1, 4, 5, 1], [1, 7, 1], [6, 5, 1],
    ]);
    expect(names('harmonicMinor')).not.toContain('i-vii°-V');
    expect(getScaleProgressions('hungarianMinor').map((p) => p.numerals)).toEqual([[1, 5, 1], [1, 6, 5], [1, 3, 5]]);
    expect(names('hungarianMinor')).toEqual(['i-V-i', 'i-bVI-V', 'i-bIII+-V']);
  });

  it('gives every 7-note scale progressions with unique names and valid chord roots', () => {
    for (const scale of Object.values(SCALES)) {
      const progressions = getScaleProgressions(scale.id);
      if (scale.intervals.length !== 7) {
        expect(progressions).toEqual([]);
        continue;
      }
      expect(progressions.length).toBeGreaterThan(0);
      expect(new Set(progressions.map((p) => p.name)).size).toBe(progressions.length);
      for (const p of progressions) {
        expect(p.numerals.every((n) => n >= 1 && n <= 7)).toBe(true);
      }
    }
  });

  it('only supports progressions for 7-note scales', () => {
    expect(supportsProgressions('major')).toBe(true);
    expect(supportsProgressions('pentatonicMinor')).toBe(false);
  });
});
