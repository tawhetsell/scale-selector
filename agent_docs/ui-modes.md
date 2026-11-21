# UI Modes

This document explains the control layout, mode interactions, and state dependencies in the UI. Behavior was verified on 2026-10-03, and the chord shapes, legend and menu names on 2026-11-20 (brought over from the iOS port); open issues are tracked in roadmap.md.

## Control Layout (App.tsx)

**Top panel** (`.panel`, dropdowns):
- **SCALE**: 45 options in `<optgroup>`s. Ionian is hidden because it equals Major. `shortenScaleName()` abbreviates names longer than 16 characters.
- **KEY**: the 17 names in `KEY_NAMES`, i.e. C through B with both spellings of each black key. Note names follow the chosen spelling (see music-model.md).
- **CHORD**: None, Triads or Tetrads. Disabled for scales that don't have 7 notes.

Shown only when CHORD is Triads or Tetrads, in this order (so the row reads Scale, Key, Chord, Degree, Voice, Changes, String):
- **DEGREE**: 1–7, which chord to show. Disabled while a progression is active.
- **VOICE**: Root, 1st Inv or 2nd Inv, plus 3rd Inv for tetrads.
- **CHANGES** (aria-label "Chord changes"; called PROGS before 2026-11-20): None, or a named progression for the current scale.
  - Names are generated from the chords (triad numerals) and stay ASCII, because they are the option values and what the iOS fixtures contain.
  - The options show them with music signs: `formatNumeral()` (chords.ts) turns every "b" into "♭" and every "#" into "♯", so "i-bVI-bVII" reads "i-♭VI-♭VII". Lowercase numerals contain no "b", so this is safe for numerals; don't use it on chord names such as "Bb".
- **STRING** (aria-label "Root string"; called ROOT STR before 2026-11-20): 4th, 5th or 6th. It anchors the position window that chord shapes are picked from, so it's enabled whenever chords are shown on the guitar (single chord or progression), and disabled in piano view.

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
2. **Single-chord mode** (CHORD = Triads/Tetrads, CHANGES = None):
   - Guitar: every note of the chord across the whole neck, with one playable shape for the selected Voice ringed (see Rings and fretboard-mapping.md).
   - Piano: one voicing of the chord.
   - No legend.
3. **Progression mode** (CHANGES set):
   - Every chord in the progression is shown.
   - Guitar: limited to the position window, plus any note of the current chord's shape that reaches outside it.
   - Piano: one voicing per chord.
   - A legend with step controls appears.

Chord features require a 7-note scale:
```ts
const canShowTriads = scale.intervals.length === 7;
```

App passes both instruments `chordSize` (3, 4 or null), `chordRootDegree`, `progressionNumerals` (null without a progression), `inversion` (0–3, from VOICE) and `currentStep` (the legend's current chord, null without a legend). The fretboard also gets `rootString`.

## Voicing

VOICE picks the inversion. `getChordDegrees()` rotates the chord so the bass degree comes first:
```ts
getChordDegrees(7, 1, 3, 1); // [3, 5, 1] — 1st inversion, 3rd in the bass
```
- **Guitar (single chord and progression):** one shape is picked with VOICE's degree as its lowest note (`findChordShape()`, see fretboard-mapping.md). Its bass gets the thick ring and halo, its other notes the thick ring.
- **Piano:**
  - Each chord is voiced from its bass note upward, starting at or above C3 (`getChordVoicingMidi()`).
  - Only those keys light up.

## Progression Mode

When CHANGES is not None:
- `activeProgression` is set. Both instruments draw in color (Mono is disabled, and comes back when the progression is cleared), and App switches to Triads if the view was Scale.
- DEGREE is disabled.
- On guitar, markers are limited to the position window anchored by STRING (see fretboard-mapping.md).
- Progressions with 2+ chords get the legend: App renders `ProgressionLegend` below either instrument.
  - Each chord shows a numeral and a chord name, e.g. "ii7 (F#m7)" in Tetrads mode or "♭VI (Ab)" in C Aeolian. The numeral is shown with `formatNumeral()`; the chord name is left as it is.
  - **The legend always has a current chord.** A progression opens on its first chord (step 0), and choosing another progression goes back to its first chord. There is no "All" button.
  - ◀ and ▶ wrap around: past the last chord to the first, and back from the first to the last.
  - Clicking a chord selects it; clicking the selected chord again keeps it selected.
  - The step is null only when there is no legend (no progression, or one with fewer than 2 chords). App stores the chosen step and derives `currentStep` with `resolveStep()`, which falls back to 0 when the stored step is out of range. The rules live in `components/ProgressionLegend/legendSteps.ts`.
- Notes that belong only to other chords drop to 20% opacity. Tones shared with the current chord stay lit.

Legend data comes from `describeChords()` in chords.ts, and colors from `getDegreeColor()`.

## Color Modes

**Color:**
- **Scale or single chord:** degree colors from `DEGREE_COLOR_PALETTE` (colors.ts; see music-model.md).
- **Multi-chord progression:** each note takes the color of the first chord, in progression order, that contains it. That color is the chord's root-degree color (ii uses the degree-2 color). Both instruments use this rule. Every note of the current chord takes that chord's color (shared notes included).

**Mono:**
- **Guitar:** markers are filled with the board color, so they appear as outlines only. Ringed notes get a brighter, thicker ring.
- **Piano:** root keys are `#f5f7fa` and other active keys `#8d949c`.

## Rings (guitar)

`getFretboardDisplay()` (lib/music/fretboardDisplay.ts) gives each drawn note a `FretRing`; Fretboard.tsx only turns it into strokes.

- **Chord modes** (single chord, or a progression's current chord): the shape to play is ringed.
  - **Thick ring with a halo** (`anchor`): the shape's bass note.
  - **Thick ring** (`shape`, stroke 3, radius 12): the shape's other notes.
  - Every other note gets the plain outline. There is no medium ring on degree 1 or on the chord root while a shape is shown.
- **Scale mode** (CHORD = None): **medium ring** (`accent`, stroke 2.2) on scale degree 1. This is the only place the medium ring is used.
- **Progression with no current chord** (a progression without a legend, which no current list has): each chord's lowest bass note in the window gets a thick ring (`bass`), the key root on the STRING string the halo, and degree 1 the medium ring.
- In Mono every ringed note gets the brighter, thicker outline.

## State Dependencies

| Control | Disabled or hidden when |
|---------|-------------------------|
| CHORD | Disabled: the scale doesn't have 7 notes |
| DEGREE, VOICE, CHANGES, STRING | Hidden: CHORD = None |
| DEGREE | Disabled: a progression is active |
| CHANGES | Disabled: the scale has no progressions |
| STRING | Disabled: piano view |
| Mono | Disabled: a progression is active |
| Strings, Half/Full, Tune/Drop | Hidden: piano view |
| All/Focus | Hidden: guitar view |

Automatic resets (App.tsx effects and handlers):
- Choosing a scale that doesn't have 7 notes resets CHORD to None.
- If DEGREE is beyond the new scale's length, it resets to 1.
- If the new scale doesn't have the selected progression, CHANGES resets to None.
- Choosing a progression in CHANGES sets the step to its first chord (0). A stored step that's out of range for the current legend also shows the first chord.
- Setting CHORD to None resets CHANGES to None.
- Leaving Tetrads while VOICE is "3rd Inv" resets VOICE to Root.
- An active progression forces Triads (if CHORD was None) and Color (if Mono was selected).

## Full-Screen View (hooks/useFullscreen.ts)

- **Entering:** the top panel's full-screen button calls `useFullscreen(stageRef).enter()`. This adds `stage__visualization--fullscreen` to the stage element, which becomes a fixed, full-page black layer containing:
  - an exit button (✕) in the bottom-right corner, in a 48px bottom strip. It's at the bottom so it stays clear of iPhone Safari's address bar, and the top margin is only 8px;
  - the instrument, which flexes to fill the space. The fretboard gets `fitToContainer`: it measures its box and spreads the strings apart to fill the height (notes up to 1.8× larger, 1.5× on the 24-fret neck). The gap goes from 28 up to 64 viewBox units on phone-width screens (under 900px), and up to 48 on wider ones so it still looks like a neck. Fret dots are drawn above the strings as well as below, with equal space for each, so the board isn't bottom-heavy (both from the iOS port, 2026-11-20);
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
- `src/components/ProgressionLegend/legendSteps.ts` — the legend's stepping rules (`resolveStep`, `stepForward`, `stepBack`)
- `src/lib/music/fretboardDisplay.ts` — which notes the fretboard draws and which ring each gets
- `src/components/Metronome/Metronome.tsx` — metronome
- `src/lib/audio/synth.ts` — shared AudioContext, note playback
- `src/lib/music/colors.ts` — degree color palette
