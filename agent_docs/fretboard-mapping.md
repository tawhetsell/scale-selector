# Fretboard Mapping

This document explains how tunings, fret positions, and markers are computed and rendered.

## Tuning Presets (tunings.ts)

`getTuningPreset(strings, dropTuning)` returns an array of pitch classes for the open strings, from lowest (thickest) to highest (thinnest):

| Strings | Standard Tuning              | Example                    |
|---------|------------------------------|----------------------------|
| 6       | [4, 9, 2, 7, 11, 4]          | E A D G B E                |
| 7       | [11, 4, 9, 2, 7, 11, 4]      | B E A D G B E              |
| 8       | [6, 11, 4, 9, 2, 7, 11, 4]   | F# B E A D G B E           |
| 9       | [1, 6, 11, 4, 9, 2, 7, 11, 4]| C# F# B E A D G B E        |

**Drop tuning**: If `dropTuning=true`, the lowest string is lowered by 2 semitones (whole step):
```ts
tuning[0] = (tuning[0] - 2 + 12) % 12;  // e.g., E(4) -> D(2)
```

## Fret Map Computation (theory.ts)

`computeFretMap(openPcs, maxFrets, rootPc, intervals)` generates all markers:

1. Build a `Set` of pitch classes in the scale: `scaleSet(rootPc, intervals)`
2. For each string (index `sIdx`) and fret (0 to maxFrets):
   - Compute the pitch class: `pc = normalizePc(openPc + fret)`
   - If `pc` is in the scale set, create a marker

**Marker interface**:
```ts
type Marker = {
  stringIndex: number;  // 0 = lowest string (thickest)
  fret: number;         // 0 = open string
  pc: number;           // pitch class 0-11
  degree: number;       // scale degree 1-7 (or more)
};
```

`pcToDegree(pc, rootPc, intervals)` finds which scale degree a pitch class corresponds to (returns 0 if not in scale).

## Chord Shape Finding (Fretboard.tsx)

`findChordShapesForInversion(markers, chordDegrees, targetBassDegree)` finds playable chord shapes:

1. Filter markers to those matching chord degrees
2. Find all markers with the target bass degree (determined by voicing/inversion)
3. For each bass marker, try to build a shape:
   - Bass marker defines the lowest string
   - Find chord tones on adjacent higher strings within a 4-fret span
   - Prefer unused degrees, then notes closer to the shape center
4. Return only markers that belong to valid shapes

**Inversion logic**:
- Root position: bass = chord[0] (root)
- 1st inversion: bass = chord[1] (3rd)
- 2nd inversion: bass = chord[2] (5th)
- 3rd inversion: bass = chord[3] (7th, tetrads only)

## Position Mode (CAGED System)

When a progression is active, `usePositionMode=true` enables position-based filtering:

1. **Find the position**: Locate the scale root (degree 1) on the selected root string (4th, 5th, or 6th)
2. **Define fret range**: 5-fret span centered around the root position
3. **Filter markers**: Only show markers within the fret range

The "ROOT STR" dropdown selects which string anchors the position:
```ts
const rootStringIndex = strings - rootString;  // Convert guitar string # to array index
```

Example: On 6-string guitar, ROOT STR = 5 means:
- `rootStringIndex = 6 - 5 = 1` (the A string, second from lowest)
- Find degree 1 on that string, create a 5-fret box around it

## Bass Note Identification

In progression mode, bass notes get thick white outlines:
1. `positionBassMarkerKeys`: Set of `"stringIndex:fret"` keys for bass notes
2. For each chord in progression, find the bass degree (first note after inversion rotation)
3. Choose the lowest-pitched marker (highest stringIndex, then lowest fret)

The key root anchor (degree 1 on root string) gets an additional halo effect.

## Rendering (SVG)

The fretboard is rendered as SVG with:
- String lines (horizontal, `stringGap=28px` apart)
- Fret lines (vertical, `fretWidth` varies by maxFrets)
- Nut (white rectangle at fret 0)
- Inlays (dots at frets 3, 5, 7, 9, 12, 15, 17, 19, 21, 24)
- Markers (circles with degree/note labels)

Marker positions:
```ts
const fretX = (fret) => nutX + fret * fretWidth;
const stringY = (sIdx) => padding + (strings - 1 - sIdx) * stringGap;
```

Note: `stringY` inverts the index so the highest string (thinnest) is at the top visually.

## File References
- `src/lib/music/tunings.ts` — tuning presets, drop tuning
- `src/lib/music/theory.ts` — computeFretMap(), scaleSet(), pcToDegree()
- `src/components/Fretboard/Fretboard.tsx` — SVG rendering, chord shape finding, position mode
