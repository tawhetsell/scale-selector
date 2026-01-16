# UI Modes

This document explains the control layout, mode interactions, and state dependencies in the UI.

## Control Layout (App.tsx)

The control panel has 3 rows of dropdowns:

**Row 1: Basic setup**
- SCALE — 70+ scale options (Ionian hidden since it equals Major)
- KEY — root note (C through B, sharps only)
- STRINGS — 6, 7, 8, or 9
- FRETS — 12 or 24

**Row 2: Chord display**
- CHORDS — Scale / Triads / Tetrads (disabled for non-7-note scales)
- DEGREE — 1-7, selects which chord to highlight (disabled in Scale mode or during progression)
- LABEL — Numbers (degree labels) or Letters (note names)
- COLOR — Mono (grayscale) or Color (degree-based colors)

**Row 3: Progression & voicing**
- PROG — Scale or a named progression (disabled for non-7-note scales)
- ROOT STR — 4th, 5th, or 6th string (only enabled during progression)
- VOICING — Root, 1st Inv, 2nd Inv, 3rd Inv (3rd only for tetrads; disabled in Scale mode)
- DROP — Off or Drop N (drop tuning for lowest string)

## Mode Hierarchy

The primary mode is controlled by the CHORDS dropdown:

1. **Scale mode** (`viewMode='scale'`): All scale tones shown, no chord filtering
2. **Triads mode** (`viewMode='triads'`): Only chord tones shown (3 notes per chord)
3. **Tetrads mode** (`viewMode='tetrads'`): Only chord tones shown (4 notes per chord)

Scale mode is always available. Triads/Tetrads require a 7-note scale:
```ts
const canShowTriads = scale.intervals.length === 7;
```

## Progression Mode

When PROG is set to anything other than "Scale":
- `isProgressionActive = true`
- Automatically switches to Triads view if in Scale mode
- Automatically switches to Color mode if in Mono mode
- DEGREE dropdown is disabled (progression controls which chords are shown)
- ROOT STR becomes enabled (for CAGED position selection)

The progression shows all chord tones for all chords in the progression, with color-coding:
- Each chord gets a distinct color from `PROGRESSION_COLORS`
- Shared tones (notes in multiple chords) use the first chord's color
- A legend appears below the fretboard showing chord names

## Single-Chord Voicing Mode

When CHORDS = Triads/Tetrads but PROG = Scale:
- `isSingleChordVoicingMode = true`
- DEGREE selects which chord to show
- VOICING controls the inversion
- Fretboard shows playable chord shapes for the selected voicing

This is different from progression mode in that:
- Only one chord is shown (not multiple)
- Position mode is not used (shapes span entire fretboard)
- No legend or step controls appear

## Voicing & Inversions

The VOICING dropdown rotates chord tones to change the bass note:
- Root: bass = root (original order)
- 1st Inv: bass = 3rd (rotate left by 1)
- 2nd Inv: bass = 5th (rotate left by 2)
- 3rd Inv: bass = 7th (rotate left by 3, tetrads only)

```ts
const inversionAmount = voicing === '1st' ? 1 : voicing === '2nd' ? 2 : voicing === '3rd' ? 3 : 0;
const rotated = [...degrees.slice(inversionAmount), ...degrees.slice(0, inversionAmount)];
```

The first element of the rotated array becomes the bass note, which determines:
- Which shapes are valid (bass must be on lowest string of shape)
- Which markers get thick white outlines

## Color Modes

The COLOR dropdown affects marker fill:

**Mono mode** (`colorMode='mono'`):
- Root notes: white (`#f5f7fa`)
- Other scale tones: gray (`#8d949c`)
- Works the same in all view modes

**Color mode** (`colorMode='color'`):
- Single chord / Scale: degree-based colors from `DEGREE_COLOR_PALETTE`
- Multi-chord progression: chord-based colors from `PROGRESSION_COLORS`

Degree colors (8-color palette):
```ts
['#3A9BFF', '#22B6C7', '#6EE7CF', '#84E36A', '#E8B65A', '#F58A4B', '#D166D6', '#8A7CFF']
```

Progression colors (7-color palette, one per chord):
```ts
['#ff6b6b', '#4ecdc4', '#3A9BFF', '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe']
```

## State Dependencies

| Control     | Disabled When                                      |
|-------------|---------------------------------------------------|
| CHORDS      | Non-7-note scale selected                          |
| DEGREE      | Scale mode OR progression active OR non-7-note     |
| PROG        | Non-7-note scale selected                          |
| ROOT STR    | No progression active                              |
| VOICING     | Scale mode                                         |

Auto-reset logic:
- Switching to non-7-note scale resets viewMode to 'scale', selectedProgression to 'scale'
- Changing scale resets chordRootDegree if > new scale length
- Changing progression resets currentStep to null

## Step Controls (Fretboard.tsx)

When a multi-chord progression is active, the legend includes step controls:
- **Prev (◀)**: Go to previous chord, or "all" if at first
- **All**: Show all chords (no highlighting)
- **Next (▶)**: Go to next chord, or "all" if at last

Clicking a chord in the legend also toggles its step selection.

When a step is active:
- Active chord markers: full opacity
- Other chord markers: 20% opacity
- Legend chord: highlighted with `.legend-chord--active`

## File References
- `src/App.tsx` — state management, control panel, mode logic
- `src/App.css` — control panel styling
- `src/components/Fretboard/Fretboard.tsx` — marker rendering, legend, step controls
- `src/lib/music/colors.ts` — degree color palette
