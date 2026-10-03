# Music Model

This document explains the music theory model in `src/lib/music`. Behavior was verified on 2026-10-03; open issues are tracked in roadmap.md. Unit tests live next to the modules (`*.test.ts`, run with `npm test`).

## Pitch Class Representation

Pitch classes are integers 0-11 representing the 12 chromatic notes:
- C=0, C#/Db=1, D=2, D#/Eb=3, E=4, F=5, F#/Gb=6, G=7, G#/Ab=8, A=9, A#/Bb=10, B=11

All pitch arithmetic uses modulo 12 via `normalizePc()` in notes.ts. Guitar markers also carry MIDI pitches (see fretboard-mapping.md).

## Note Naming and Spelling (notes.ts)

- `KEY_NAMES` lists the 17 keys in the KEY menu: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.
- `nameToPc(name)` parses sharps and flats.
- `spellScaleDegrees(keyName, intervals, degreeLabels)` spells each scale degree. This is what the UI shows.
  - The letter is the key letter counted up by the label's number. For example, 'b7' in C is a B-something, giving Bb.
  - The accidental is whatever makes that letter match the pitch.
  - Results: F major is F G A Bb C D E, and G# harmonic minor ends in F##.
  - Double accidentals are written "##" and "bb".
  - If a label can't be parsed, or would need more than a double accidental, the note falls back to `pcToName()`. That uses flats for flat keys and sharps otherwise.
- `pcToName(pc, preferSharps)` is the plain sharp/flat fallback.
- `midiToFrequency(midi)` converts a MIDI note to Hz (A4 = 69 = 440 Hz). Note playback uses it (src/lib/audio/synth.ts).

## Scale Structure (scales.ts)

Each scale in `SCALES` has:
```ts
type ScaleDef = {
  id: string;             // unique key, e.g. 'major'
  name: string;           // display name, e.g. 'Major'
  intervals: number[];    // semitones above root (0..11), e.g. [0,2,4,5,7,9,11]
  degreeLabels: string[]; // display labels, e.g. ['1','2','b3',...]
  group?: string;         // <optgroup> label in the SCALE menu
};
```

**Degree labels drive spelling and Roman numerals.** `parseDegreeLabel()` reads the accidental and the number (e.g. 'b3', '♯4', '#2/♭3'; the first spelling wins).
- Most labels count scale steps.
- A few are pitch-based (Altered and Ultralocrian label the 4th degree '3'; Enigmatic labels its 6th degree 'b7'), so their spelling and numerals follow the pitch.
- The labels mix ASCII and Unicode accidentals: 'b' and '♭', '#' and '♯'.

`SCALES` has 46 entries. 45 appear in the menu, because `getGroupedScales()` hides Ionian, a duplicate of Major. By size:

| Notes | Count | Scales |
|-------|-------|--------|
| 3 | 4 | Triad Major, Minor, Dim, Aug |
| 5 | 4 | Pentatonic Major and Minor, In Sen, Hirajoshi |
| 6 | 3 | Blues (Pent+♭5), Whole Tone, Major Blues |
| 7 | 29 | church modes, harmonic- and melodic-minor modes, exotic scales |
| 8 | 6 | both diminished scales, three bebop scales, Barry Harris minor 6th diminished |

## Chords (chords.ts)

Chords are built by stacking thirds within the scale. All chord logic lives here; the components don't duplicate it.

- **`getChordDegrees(scaleLength, rootDegree, size, inversion)`**
  - Gives the chord's scale degrees, rotated so the inversion's bass comes first.
  - Triads: degree 1 → [1, 3, 5]. Tetrads: degree 2 → [2, 4, 6, 1]. 1st inversion of degree 1 → [3, 5, 1].
- **`getScaleTriads(scale)`** feeds the DEGREE menu.
- **`getChordIntervals(scaleIntervals, rootDegree, size)`** gives semitones above the chord root, e.g. [0, 4, 7, 11].
- **`getChordSymbol(chordIntervals)`** gives the chord suffix:
  - Triads: '' (major), 'm', '°', '+'.
  - Sevenths: 'maj7', '7', 'm7', 'ø7', '°7', 'm(maj7)', '+maj7', '+7', '°(maj7)'.
  - Chords that aren't stacked major/minor thirds are named from their intervals: 'sus2' or 'sus4' for the third, '6' for a sixth in the seventh slot, and '(b5)', '(#5)', '(bb5)' or '(##5)' for the fifth. Examples: '(b5)', 'sus2(b5)', '7(b5)', 'maj7sus4'.
- **`getRomanNumeral(degreeLabel, chordIntervals)`**
  - The accidental and number come from the degree label.
  - The numeral is lowercase when the chord has a minor third.
  - The suffix is the symbol without its leading 'm'.
  - Examples: 'bVII', '#iv°', 'ii7', 'viiø7', 'i(maj7)'.
- **`describeChords(scale, rootDegrees, size, degreeNames)`** gives `{ rootDegree, numeral, name }` for each chord. The progression legend uses it, e.g. E major [2, 5, 1] tetrads → ii7 F#m7, V7 B7, Imaj7 Emaj7.

## 7-Note Scale Limitation

Triads, tetrads and progressions **only work with 7-note scales**. This is intentional:
- Diatonic harmony assumes 7 degrees for tertian (stacked-thirds) chord construction.
- Progressions like ii-V-I require 7 distinct chord roots.
- Pentatonic (5-note), hexatonic (6-note) and octatonic (8-note) scales don't fit this model.

The UI disables chord features when a non-7-note scale is selected. The check is:
```ts
const canShowTriads = scale.intervals.length === 7;
```

## Chord Progressions (progressions.ts)

- **`PROGRESSION_NUMERALS`** stores only chord-root degrees for each of the 29 seven-note scales: 103 progressions, 98 of them reachable because Ionian is hidden.
- **`getScaleProgressions(scaleId)`** returns `{ name, numerals }[]`, or an empty list for scales that don't have 7 notes.
  - Each `name` is generated by `getProgressionName()` from triad numerals, e.g. 'ii-V-I', 'i-bVI-bVII', 'I-II-vii'.
  - Names can't drift from the chords, and tests check that they're unique per scale.
  - The name is also the PROGS menu's option value.
- **`supportsProgressions(scaleId)`** is true when the list isn't empty.
- **Repeated chords:** three progressions repeat a chord (i–bII–i, i–iv–V–i, I–bII–I). The legend keys items by index, so this is fine.

## Voicings (voicings.ts)

- `findChordShapes()`, `getPositionWindow()` and `findLowestMarker()` serve the fretboard (see fretboard-mapping.md).
- `getChordVoicingMidi(rootPc, scaleIntervals, chordDegrees, lowestMidi)` gives one close voicing for the piano: the bass at or above `lowestMidi`, with each following tone stacked just above the previous one. Example: C major 1st inversion from C3 → E3 G3 C4.

## Colors (colors.ts)

`DEGREE_COLOR_PALETTE` has 8 colors; index 0 is degree 1:
```ts
['#EA3F75', '#FF7A66', '#7A73EF', '#4281EA', '#00D4FF', '#00FFC8', '#39FF88', '#F9FF4A']
// pink, coral, violet, blue, cyan, mint, green, yellow (8th degree, 8-note scales only)
```

- `getDegreeColor(scaleId, degreeIndex)` gives a degree's color. Progression chords use their root degree's color on both instruments.
- `pickTextColor()` chooses black or white label text from WCAG relative luminance, with a threshold of 0.4.

## File References
- `src/lib/music/notes.ts` — pitch classes, KEY_NAMES, spelling
- `src/lib/music/scales.ts` — 46 scale definitions, menu grouping, degree-label parsing
- `src/lib/music/chords.ts` — chord degrees and inversions, symbols, Roman numerals, chord labels
- `src/lib/music/progressions.ts` — progression numerals and generated names
- `src/lib/music/voicings.ts` — fretboard shapes, position window, piano voicings
- `src/lib/music/colors.ts` — degree palette, label contrast
- `src/lib/music/theory.ts` — fret map, pitch class → degree
- `src/lib/music/tunings.ts` — tuning presets (MIDI)
