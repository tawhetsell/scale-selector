# UI Modes

This document explains the control layout, mode interactions, and state dependencies in the UI. Behavior was verified on 2026-10-03; open issues are tracked in roadmap.md.

## Control Layout (App.tsx)

**Top panel** (`.panel`, dropdowns):
- **SCALE**: 45 options in `<optgroup>`s. Ionian is hidden because it equals Major. `shortenScaleName()` abbreviates names longer than 16 characters.
- **KEY**: the 17 names in `KEY_NAMES`, i.e. C through B with both spellings of each black key. Note names follow the chosen spelling (see music-model.md).
- **CHORD**: None, Triads or Tetrads. Disabled for scales that don't have 7 notes.

Shown only when CHORD is Triads or Tetrads:
- **DEGREE**: 1–7, which chord to show. Disabled while a progression is active.
- **PROGS**: None, or a named progression for the current scale. Names are generated from the chords (triad numerals).
- **ROOT STR**: 4th, 5th or 6th string. It anchors the position window and is enabled only while a progression is active.
- **VOICE**: Root, 1st Inv or 2nd Inv, plus 3rd Inv for tetrads.

Always last in the top panel:
- **Full screen** (`.panel__fullscreen`): an icon button that shows the instrument over the whole page (see Full-Screen View).
  - On desktop it sits at the right end of the row.
  - On phones the first row is full, so it wraps to its own line under the dropdowns, aligned with their bottom edge.

Disabled dropdowns are dimmed (`.control select:disabled`).

**Footer panel** (`.panel--footer`, segmented toggles, left to right):
- **View**: guitar or piano (icon buttons).
- **Strings**: 6, 7 or 8. Guitar only; tunings.ts also supports 9.
- **Color / Mono**: Mono is disabled while a progression is active.
- **All / Focus**: piano only. Focus fades keys that aren't in the active set.
- **ABC / 123**: note names or scale-degree labels.
- **Half / Full**: 12 or 24 frets. Guitar only.
- **Tune / Drop**: standard tuning, or the lowest string dropped a whole step. Guitar only.
- **Metronome**: play/stop, a BPM field (40–240) and up/down nudge buttons.

The toggles have `aria-label`s but no `title` tooltips.

## Modes

1. **Scale mode** (CHORD = None, `chordSize = null`): every scale tone is shown, across the neck or in both piano octaves.
2. **Single-chord mode** (CHORD = Triads/Tetrads, PROGS = None):
   - Guitar: playable shapes for the selected inversion, across the neck (see fretboard-mapping.md).
   - Piano: one voicing of the chord.
   - No legend.
3. **Progression mode** (PROGS set):
   - Every chord in the progression is shown.
   - Guitar: limited to the position window.
   - Piano: one voicing per chord.
   - A legend with step controls appears.

Chord features require a 7-note scale:
```ts
const canShowTriads = scale.intervals.length === 7;
```

App passes both instruments `chordSize` (3, 4 or null), `chordRootDegree`, `progressionNumerals` (null without a progression) and `inversion` (0–3, from VOICE).

## Voicing

VOICE picks the inversion. `getChordDegrees()` rotates the chord so the bass degree comes first:
```ts
getChordDegrees(7, 1, 3, 1); // [3, 5, 1] — 1st inversion, 3rd in the bass
```
- **Guitar, single chord:**
  - Only notes in shapes whose lowest note is the bass degree are drawn.
  - Each shape's bass note gets the thick ring.
- **Guitar, progression:** each chord's lowest-pitched bass note inside the window gets the thick ring.
- **Piano:**
  - Each chord is voiced from its bass note upward, starting at or above C3 (`getChordVoicingMidi()`).
  - Only those keys light up.

## Progression Mode

When PROGS is not None:
- `activeProgression` is set. App switches to Color mode (Mono is disabled) and to Triads if the view was Scale.
- DEGREE is disabled and ROOT STR is enabled.
- On guitar, markers are limited to the position window anchored by ROOT STR (see fretboard-mapping.md).
- Progressions with 2+ chords get the legend: App renders `ProgressionLegend` below either instrument.
  - Each chord shows a numeral and a chord name, e.g. "ii7 (F#m7)" in Tetrads mode or "bVI (Ab)" in C Aeolian.
  - The legend has ◀ / All / ▶ step controls, and clicking a chord toggles it.
- While a step is active, notes that belong only to other chords drop to 20% opacity. Tones shared with the active chord stay lit.

Legend data comes from `describeChords()` in chords.ts, and colors from `getDegreeColor()`.

## Color Modes

**Color:**
- **Scale or single chord:** degree colors from `DEGREE_COLOR_PALETTE` (colors.ts; see music-model.md).
- **Multi-chord progression:** each note takes the color of the first chord, in progression order, that contains it. That color is the chord's root-degree color (ii uses the degree-2 color). Both instruments use this rule.

**Mono:**
- **Guitar:** markers are filled with the board color, so they appear as outlines only. Ringed notes get a brighter, thicker ring.
- **Piano:** root keys are `#f5f7fa` and other active keys `#8d949c`.

## Rings (guitar)

- **Thick ring** (stroke 3, radius 12):
  - the bass note of each shape (single chord), or
  - each chord's lowest bass note in the window (progression).
- **Thick ring with a halo:** the key-root anchor, i.e. degree 1 on the ROOT STR string inside the window (progression).
- **Medium ring** (stroke 2.2):
  - scale degree 1 in scale and progression modes;
  - the chord root in single-chord mode.

## State Dependencies

| Control | Disabled or hidden when |
|---------|-------------------------|
| CHORD | Disabled: the scale doesn't have 7 notes |
| DEGREE, PROGS, ROOT STR, VOICE | Hidden: CHORD = None |
| DEGREE | Disabled: a progression is active |
| PROGS | Disabled: the scale has no progressions |
| ROOT STR | Disabled: no progression is active |
| Mono | Disabled: a progression is active |
| Strings, Half/Full, Tune/Drop | Hidden: piano view |
| All/Focus | Hidden: guitar view |

Automatic resets (App.tsx effects and handlers):
- Choosing a scale that doesn't have 7 notes resets CHORD to None.
- If DEGREE is beyond the new scale's length, it resets to 1.
- If the new scale doesn't have the selected progression, PROGS resets to None.
- Changing PROGS resets the step to "All".
- Setting CHORD to None resets PROGS to None.
- Leaving Tetrads while VOICE is "3rd Inv" resets VOICE to Root.
- An active progression forces Triads (if CHORD was None) and Color (if Mono was selected).

## Full-Screen View (hooks/useFullscreen.ts)

- **Entering:** the top panel's full-screen button calls `useFullscreen(stageRef).enter()`. This adds `stage__visualization--fullscreen` to the stage element, which becomes a fixed, full-page black layer containing:
  - an exit button (✕) in the bottom-right corner, in a 48px bottom strip. It's at the bottom so it stays clear of iPhone Safari's address bar, and the top margin is only 8px;
  - the instrument, which flexes to fill the space. The fretboard gets `fitToContainer`: it measures its box and spreads the strings apart to fill the height (notes up to 1.4× larger). The gap goes from 28 up to 64 viewBox units on phone-width screens (under 900px), and up to 48 on wider ones so it still looks like a neck;
  - the progression legend, if there is one.
- **Real fullscreen:** where the browser allows it (Android, desktop), the stage also enters real fullscreen (`requestFullscreen`) and asks for landscape (`screen.orientation.lock`). iPhone only allows real fullscreen for videos, so there the layer just covers the page.
- **Exiting:** the ✕ button, Esc, or leaving real fullscreen (e.g. Android's back gesture) all close the view. Closing also exits real fullscreen and unlocks the orientation.
- **Page scroll:** while the view is open, `body.no-scroll` stops the page behind it from scrolling.
- **Orientation:** there is deliberately no portrait layout; people turn the phone sideways. Turning the phone while the view is open resizes the instrument.

## Instrument Sizing

- App measures the stage width on resize, and when the full-screen view opens or closes. It sets `--instrument-height` so the piano matches the aspect ratio of a 6-string, 12-fret fretboard (204/924).
- The fretboard SVG scales with `width: 100%`.
  - On a phone held upright, the normal page shows it about 300px wide, which is too small to read.
  - The full-screen view with the phone sideways makes it about 800px wide.

## Piano (PianoKeyboard.tsx)

- 25 keys, C3–C5 (MIDI 48–72), in a fixed range.
- In scale mode every scale tone is lit in both octaves. In chord modes only the chords' voicings are lit (`chordsByMidi`).

## Sound (src/lib/audio/synth.ts)

- **Fretboard:** clicking a marker (`g.fret-marker`) plays `playNote(marker.midi)` at the note's real pitch, so the open low E is E2.
- **Piano:** clicking any key plays `playNote(key.midiNote)`. Keys outside the scale play too.
- **Tone:** both instruments use the same basic tone, four sine partials with a quick attack and a fade-out. The owner asked for a very basic sound, so keep it simple.
- **Feedback:** markers grow slightly while pressed, and piano keys shade.
- **Output:** notes go through a compressor so overlapping notes don't clip.
- **Shared context:** `getAudioContext()` returns the one AudioContext that notes and the metronome share. It's created on first use and resumed if suspended. Call it from a click handler, because browsers only start audio after a user gesture.
- **Keyboard:** playback is mouse/touch only (see roadmap.md).

## Metronome (Metronome.tsx)

- A Web Audio lookahead scheduler: a 25 ms timer with 100 ms lookahead, playing a 1 kHz sine click on the shared AudioContext.
- The tempo lives in a ref, so changing BPM doesn't restart the schedule.
- **BPM field:**
  - Range 40–240.
  - Typed values apply as soon as they're in range.
  - Anything else is clamped on blur or Enter.
- The play button calls `getAudioContext()` in its click handler, so audio is allowed to start.
- There is no accent, no time signature, and no link to the progression stepper.

## File References
- `src/App.tsx` — state, control panels, mode logic, legend data
- `src/hooks/useFullscreen.ts` — full-screen view (page cover, real fullscreen, landscape lock)
- `src/App.css` — panel, select, toggle, legend and full-screen styling
- `src/components/Fretboard/Fretboard.tsx` — marker selection and rendering, rings
- `src/components/PianoKeyboard/PianoKeyboard.tsx` — piano rendering and voicings
- `src/components/ProgressionLegend/ProgressionLegend.tsx` — legend and step controls
- `src/components/Metronome/Metronome.tsx` — metronome
- `src/lib/audio/synth.ts` — shared AudioContext, note playback
- `src/lib/music/colors.ts` — degree color palette
