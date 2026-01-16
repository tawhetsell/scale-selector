# Music Model

This document explains the music theory model used throughout the codebase.

## Pitch Class Representation

Pitch classes are integers 0-11 representing the 12 chromatic notes:
- C=0, C#/Db=1, D=2, D#/Eb=3, E=4, F=5, F#/Gb=6, G=7, G#/Ab=8, A=9, A#/Bb=10, B=11

All pitch arithmetic uses modulo 12 via `normalizePc()` in notes.ts.

## Note Naming

`pcToName(pc, preferSharps)` converts pitch class to note name:
- `preferSharps=true`: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- `preferSharps=false`: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B

`nameToPc(name)` parses note names (supports both sharps and flats).

## Scale Structure

Each scale in `SCALES` (scales.ts) has:
```ts
type ScaleDef = {
  id: string;           // unique key, e.g. 'major'
  name: string;         // display name, e.g. 'Major'
  intervals: number[];  // semitones above root (0..11), e.g. [0,2,4,5,7,9,11]
  degreeLabels: string[]; // display labels, e.g. ['1','2','3','4','5','6','7']
};
```

The `intervals` array length determines the scale size (5 for pentatonic, 7 for diatonic, 8 for bebop/diminished).

## Chord Construction (chords.ts)

Triads and tetrads are built by stacking thirds within the scale:

**Triads** (3 notes): root, 3rd, 5th
- Degree 1 chord: scale degrees [1, 3, 5]
- Degree 2 chord: scale degrees [2, 4, 6]
- etc.

**Tetrads** (4 notes): root, 3rd, 5th, 7th
- Degree 1 chord: scale degrees [1, 3, 5, 7]
- Degree 2 chord: scale degrees [2, 4, 6, 1]
- etc.

The chord quality (maj, min, dim, aug) depends on the intervals:
- Major 3rd (4 semitones) + Perfect 5th (7 semitones) = major
- Minor 3rd (3 semitones) + Perfect 5th (7 semitones) = minor
- Minor 3rd (3 semitones) + Diminished 5th (6 semitones) = diminished
- Major 3rd (4 semitones) + Augmented 5th (8 semitones) = augmented

## 7-Note Scale Limitation

Triads, tetrads, and progressions **only work with 7-note scales**. This is intentional:
- Diatonic harmony assumes 7 degrees for tertian (stacked thirds) chord construction
- Progressions like ii-V-I require 7 distinct chord roots
- Pentatonic (5-note), hexatonic (6-note), and octatonic (8-note) scales don't fit this model

The UI disables chord features when a non-7-note scale is selected. The check is:
```ts
const canShowTriads = scale.intervals.length === 7;
```

## Chord Progressions (progressions.ts)

`SCALE_PROGRESSIONS` maps scale IDs to:
```ts
type ScaleProgressionDef = {
  chordQualities: ChordQuality[];  // quality for each degree [maj, min, min, maj, maj, min, dim]
  progressions: Progression[];     // named progressions with numeral arrays
};
```

Qualities are derived from scale intervals via `deriveChordQuality()`. Progressions use 1-based degree numbers (numerals), e.g., `[1, 5, 6, 4]` for I-V-vi-IV.

## File References
- `src/lib/music/notes.ts` — pitch class utilities, chord naming
- `src/lib/music/scales.ts` — 70+ scale definitions
- `src/lib/music/chords.ts` — triad/tetrad generation
- `src/lib/music/progressions.ts` — chord quality detection, named progressions
