# Fretboard Mapping

This document explains how tunings, fret positions and markers are computed and rendered. Behavior was verified on 2026-10-03; open issues are tracked in roadmap.md.

## Orientation (intentional)

- String index 0 is the lowest-pitched string (the low E on a 6-string), and it is drawn at the **bottom**.
- The highest-pitched string is drawn at the top. This mirrors a player's view looking down at the neck.
- A higher index means a higher pitch and a higher position on screen. Don't flip the drawing.

## Tuning Presets (tunings.ts)

`getTuningPreset(strings, dropTuning)` returns the open strings as MIDI note numbers, lowest (thickest) string first:

| Strings | MIDI | Notes |
|---------|------|-------|
| 6 | [40, 45, 50, 55, 59, 64] | E2 A2 D3 G3 B3 E4 |
| 7 | [35, 40, 45, 50, 55, 59, 64] | B1 + 6-string |
| 8 | [30, 35, 40, 45, 50, 55, 59, 64] | F#1 B1 + 6-string |
| 9 | [25, 30, 35, 40, 45, 50, 55, 59, 64] | C#1 F#1 B1 + 6-string |

The UI offers 6, 7 and 8 strings; the 9-string preset exists but isn't exposed.

**Drop tuning**: if `dropTuning=true`, the lowest string is lowered by 2 semitones (e.g. 40 → 38, E2 → D2).

MIDI numbers carry the octave, so notes on different strings can be compared by pitch. The pitch class is `normalizePc(midi)`.

## Fret Map Computation (theory.ts)

`computeFretMap(openMidi, maxFrets, rootPc, intervals)` generates all markers:

1. Build a `Set` of the scale's pitch classes with `scaleSet(rootPc, intervals)`.
2. For each string (index `sIdx`) and fret (0 to maxFrets):
   - Compute `midi = openMidi[sIdx] + fret` and `pc = normalizePc(midi)`.
   - If `pc` is in the scale set, create a marker.

**Marker interface**:
```ts
type Marker = {
  stringIndex: number;  // 0 = lowest-pitched string, drawn at the bottom
  fret: number;         // 0 = open string
  pc: number;           // pitch class 0-11
  degree: number;       // scale degree 1-7 (or more)
  midi: number;         // actual pitch
};
```

`pcToDegree(pc, rootPc, intervals)` finds which scale degree a pitch class corresponds to. It returns 0 if the pitch class isn't in the scale.

## Which Markers Are Drawn (Fretboard.tsx)

Fretboard builds a `display` object: the markers to draw, the bass-ring keys, the anchor key, the accent degree, and which progression chords contain each degree.

- **Scale mode:** all markers.
- **Single chord:** markers that belong to a shape from `findChordShapes()`. Each shape's first marker (its bass) gets the thick ring.
- **Progression:**
  - Shows the tones of every chord inside the position window.
  - Each chord's bass ring goes on `findLowestMarker()` among the window's markers.

## Chord Shape Finding (voicings.ts)

`findChordShapes(markers, chordDegrees, bassDegree, maxSpan = 4)` returns playable shapes. Each shape:
- starts from a marker with the bass degree;
- adds one note on each next *higher-pitched* string (`stringIndex + 1`, `+ 2`, …);
- keeps every note above the bass in pitch (`midi > bass.midi`) and the whole shape within a 4-fret span;
- must contain every chord degree.

A depth-first search keeps the smallest-span shape for each bass marker, so there is at most one shape per bass note. With 12 frets, E major triads give one shape per string set for each inversion.

**Inversion → bass degree**: `getChordDegrees(..., inversion)[0]`. Root = root, 1st = 3rd, 2nd = 5th, 3rd = 7th (tetrads only).

## Position Window (progression mode)

When a progression is active:
1. **Convert ROOT STR to an index.** `rootStringIndex = strings - rootString` converts the string number (4, 5 or 6, counted from the high string) into an array index. On a 6-string, ROOT STR 5 gives index 1, the A string.
2. **Find the window.** `getPositionWindow(markers, rootStringIndex)` finds degree 1 on that string, preferring the first one at frets 1–12. It returns `minFret = max(0, rootFret - 2)` and `maxFret = minFret + 5`.
3. **Fill it.** Show the chord tones of every chord in the progression inside the window.

This is a fixed box around the root, not true CAGED shapes.

## Bass Notes and Anchor (progression mode)

- `findLowestMarker(markers, degree)` returns the marker with the lowest `midi`; on a unison, the lower string wins.
- Each chord's bass degree, after inversion, gets one thick ring on its lowest instance in the window.
- The key-root anchor (degree 1 on the ROOT STR string, inside the window) gets a thick ring and a halo.

## Rendering (SVG)

- **Strings:** horizontal lines, `stringGap = 28` units apart.
- **Frets:** `fretWidth` is 68 for 12 frets and 48 for 24. Every 12th fret line is brighter.
- **Open strings:** open-string markers sit to the left of the nut (`openSpacing`).
- **Nut:** a white bar at fret 0.
- **Inlays:** dots below the strings at frets 3, 5, 7, 9, 12 (double), 15, 17, 19, 21 and 24 (double).
- **Markers:** circles (radius 11, or 12 with a thick ring) labeled with the spelled note name or the degree label.
  - Each marker is a `g.fret-marker`; clicking it plays the note at its real pitch (`playNote(marker.midi)`, see ui-modes.md).
  - Markers grow slightly while pressed.
- **Labels:** no string names or fret numbers are drawn.

Marker positions:
```ts
const fretX = (fret) => nutX + fret * fretWidth;
const stringY = (sIdx) => padding + (strings - 1 - sIdx) * stringGap;
```

`stringY` puts index 0 (the lowest pitch) at the bottom. The SVG scales with `width: 100%`; its dimensions are viewBox units, not pixels. In the full-screen view, `fitToContainer` makes Fretboard watch its container with a ResizeObserver and widen `stringGap` (28 → at most 64 when the container is under 900px wide, 48 otherwise) so the board's shape matches the free space; markers, labels and the anchor halo scale with it (up to 1.4×). The SVG also gets `height: 100%`, so it still shrinks to fit when space is short.

## File References
- `src/lib/music/tunings.ts` — tuning presets (MIDI), drop tuning
- `src/lib/music/theory.ts` — computeFretMap(), scaleSet(), pcToDegree()
- `src/lib/music/voicings.ts` — findChordShapes(), getPositionWindow(), findLowestMarker(), getChordVoicingMidi()
- `src/lib/music/voicings.test.ts` — shape, window, bass and voicing tests
- `src/components/Fretboard/Fretboard.tsx` — marker selection, rings, SVG rendering
