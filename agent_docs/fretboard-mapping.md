# Fretboard Mapping

This document explains how tunings, fret positions and markers are computed and rendered. Behavior was verified on 2026-10-03, and the chord-shape rings on 2026-11-20; open issues are tracked in roadmap.md.

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

Fretboard calls `getFretboardDisplay()` (lib/music/fretboardDisplay.ts). It returns the notes to draw, each with its ring (`plain`, `accent`, `bass`, `shape` or `anchor`), and which progression chords contain each degree. Rings are described in ui-modes.md.

- **Scale mode:** all markers; degree 1 gets the medium ring.
- **Single chord:** every marker of the chord across the whole neck. The shape picked by `findChordShape()` (below) is ringed.
- **Progression:**
  - Shows the tones of every chord inside the position window.
  - The current chord's shape (`findChordShape()`) is ringed. If it reaches outside the window, those notes are drawn too.
  - With no current chord (no legend), each chord's bass ring goes on `findLowestMarker()` among the window's markers instead.

## Chord Shape Finding (voicings.ts)

`findChordShapes(markers, chordDegrees, bassDegree, maxSpan = 4)` returns playable shapes. Each shape:
- starts from a marker with the bass degree;
- adds one note on each next *higher-pitched* string (`stringIndex + 1`, `+ 2`, …);
- keeps every note above the bass in pitch (`midi > bass.midi`) and the whole shape within a 4-fret span;
- must contain every chord degree.

A depth-first search keeps the smallest-span shape for each bass marker, so there is at most one shape per bass note. With 12 frets, E major triads give one shape per string set for each inversion.

**Inversion → bass degree**: `getChordDegrees(..., inversion)[0]`. Root = root, 1st = 3rd, 2nd = 5th, 3rd = 7th (tetrads only).

## Picking the Shape to Play (fretboardDisplay.ts)

`findChordShape(markers, chordDegrees, window)` picks one shape for a chord (`chordDegrees[0]` is VOICE's bass degree), in both chord modes. It's built on `findChordShapes()`, which it doesn't change:
1. **Inside the position:** among the shapes found using only the window's markers, the one with the lowest-pitched bass; on a unison, the lower string.
2. **Nearest outside:** if none fits, among the shapes on the whole neck, the fewest total frets outside the window (summed over its notes), then the lowest bass, then the lower string.
3. **No shape anywhere** (only G Enigmatic tetrads in Drop tuning, degree 2 in 1st inversion and degree 7 in 2nd): just the lowest bass note in the window, or else anywhere.

The shape comes back bass first; that note gets the halo. Examples in E major on a 6-string, STRING = 4th (window frets 0–5), as (string index, fret), index 0 = low E:
- I root position: E (2, 2), G# (3, 1), B (4, 0).
- IV root position: A (0, 5), C# (1, 4), E (2, 2).
- V 1st inversion has no shape in 0–5; the nearest is D# (1, 6), F# (2, 4), B (3, 4).

## Position Window (chord modes)

When chords are shown:
1. **Convert STRING to an index.** `rootStringIndex = strings - rootString` converts the string number (4, 5 or 6, counted from the high string) into an array index. On a 6-string, STRING 5th gives index 1, the A string.
2. **Find the window.** `getPositionWindow(markers, rootStringIndex, maxFrets)` finds degree 1 on that string, preferring the first one at frets 1–12 whose window fits on the neck. The window runs from two frets below the root to three above (six frets, clamped at the nut). On a 12-fret neck, E on the low E string therefore uses the open position (0–5) rather than fret 12. If no root fits (D on the low E string, fret 10), the window slides down to end at the last fret (7–12).
3. **Use it.** In a progression, show the chord tones of every chord in the progression inside the window. In both chord modes, pick the shape to ring from it (above).

This is a fixed box around the root, not true CAGED shapes.

## Bass Notes and Anchor (progression with no current chord)

The legend always has a current chord, so this only applies to a progression without a legend (fewer than 2 chords; no current list has one):
- `findLowestMarker(markers, degree)` returns the marker with the lowest `midi`; on a unison, the lower string wins.
- Each chord's bass degree, after inversion, gets one thick ring on its lowest instance in the window.
- The key-root anchor (degree 1 on the STRING string, inside the window) gets a thick ring and a halo.

## Rendering (SVG)

- **Strings:** horizontal lines, `stringGap = 28` units apart.
- **Frets:** `fretWidth` is 68 for 12 frets and 48 for 24. Every 12th fret line is brighter.
- **Open strings:** open-string markers sit to the left of the nut (`openSpacing`).
- **Nut:** a white bar at fret 0.
- **Inlays:** dots below the strings at frets 3, 5, 7, 9, 12 (double), 15, 17, 19, 21 and 24 (double). The full-screen view adds the same row above the strings.
- **Markers:** circles (radius 11, or 12 with a thick ring) labeled with the spelled note name or the degree label.
  - Each marker is a `g.fret-marker`; clicking it plays the note at its real pitch (`playNote(marker.midi)`, see ui-modes.md).
  - Markers grow slightly while pressed.
- **Labels:** no string names or fret numbers are drawn.

Marker positions:
```ts
const fretX = (fret) => nutX + fret * fretWidth;
const stringY = (sIdx) => padding + (strings - 1 - sIdx) * stringGap;
```

`stringY` puts index 0 (the lowest pitch) at the bottom. The SVG scales with `width: 100%`; its dimensions are viewBox units, not pixels. In the full-screen view, `fitToContainer` makes Fretboard watch its container with a ResizeObserver and widen `stringGap` (28 → at most 64 when the container is under 900px wide, 48 otherwise) so the board's shape matches the free space; markers, labels and the anchor halo scale with it (up to 1.8×, or 1.5× on the 24-fret neck). It also gives the fret dots a 24-unit gutter both below and above the strings (16 below and none above on the normal page), so the board is even top and bottom. The SVG also gets `height: 100%`, so it still shrinks to fit when space is short.

## File References
- `src/lib/music/tunings.ts` — tuning presets (MIDI), drop tuning
- `src/lib/music/theory.ts` — computeFretMap(), scaleSet(), pcToDegree()
- `src/lib/music/voicings.ts` — findChordShapes(), getPositionWindow(), findLowestMarker(), getChordVoicingMidi()
- `src/lib/music/voicings.test.ts` — shape, window, bass and voicing tests
- `src/lib/music/fretboardDisplay.ts` — `findChordShape()` and `getFretboardDisplay()`: drawn notes and rings
- `src/lib/music/fretboardDisplay.test.ts` — shape rule and ring tests (E major cases shared with the iOS port)
- `src/components/Fretboard/Fretboard.tsx` — marker selection, rings, SVG rendering
