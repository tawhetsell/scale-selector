# Roadmap and Known Issues

Reviewed on 2026-10-03 at commit `c28ec2b`. Later that day:
- Phases 1–3 of the plan and click-to-play landed in `fd0d6f1`.
- The full-screen view (the phone layout) followed.

Re-check the code before acting on anything here.

## Current state

- `npm run lint`, `npm test` and `npm run build` pass.
  - `npm test` runs Vitest: 25 tests in `src/lib/music/*.test.ts`.
- There is no CI. Deploying means running `npm run build` and committing `docs/`.
- A security scan on 2026-10-03, before `fd0d6f1` was pushed, came back clean:
  - no vulnerabilities in the changes;
  - no secrets in the files or history;
  - commits use GitHub's no-reply email;
  - `.env.local` is ignored and never read;
  - the app collects and sends no data.
- Features:
  - 45 scale options, with notes spelled for the chosen key (17 keys, including flats).
  - Triads and tetrads for 7-note scales, shown as playable shapes for each inversion.
  - 98 named progressions with a step-through legend.
  - A root-string position window.
  - A guitar view (6/7/8 strings, 12/24 frets, drop tuning) and a 25-key piano view.
  - Click any note to hear it.
  - A full-screen view of the instrument, meant for phones held sideways.
  - A metronome.

## Fixed on 2026-10-03 (Phases 1–3)

Each fix has unit tests unless noted.

- **Voicings**
  - Single-chord mode draws playable shapes for the selected inversion. Each shape's lowest note is the inversion's bass note.
  - Shape finding moved to `lib/music/voicings.ts` and now builds toward higher-pitched strings.
  - Tunings are MIDI note numbers, and each marker carries its `midi` pitch.
- **Bass rings**
  - In progression mode, the ring marks each chord's lowest-pitched bass note (`findLowestMarker`).
  - Every chord gets a ring. This includes chords whose bass is the tonic, which the old code excluded.
- **Accent ring:** it follows the chord being shown. That's scale degree 1 in scale and progression modes, and the chord root in single-chord mode. It no longer reads the disabled DEGREE menu.
- **Piano:** the piano lights one concrete voicing per chord, with the bass at or above C3, so inversions are visible. Stepping through a progression dims keys by exact note.
- **Names**
  - Progression names, legend numerals and chord names are all generated in `lib/music` from the scale. There are no hand-typed names any more.
  - Tetrads mode shows seventh-chord names.
  - Numerals keep their accidentals.
  - Chords that aren't stacked major/minor thirds get descriptive names (e.g. "V(b5)", "#IVsus2(b5)").
- **Colors:** guitar and piano both color progression chords by their root degree.
- **Spelling**
  - KEY offers flat keys.
  - Notes and chord names are spelled for the key (F major has Bb; G# harmonic minor has F##).
- **Metronome** (verified in the browser, no unit test)
  - A typed BPM applies once it's in range, and clamps on blur or Enter.
  - Tempo changes no longer restart the click schedule.
- **Small fixes**
  - Legend items are keyed by index.
  - Disabled dropdowns are dimmed.
  - The stray U+FFFD character class is gone.
  - A selected progression resets when the new scale doesn't have it.
  - Choosing Triads after "3rd Inv" falls back to Root.

## Added on 2026-10-03

- **Click-to-play:** clicking a fretboard note or any piano key plays that exact pitch.
  - Both instruments use the same basic tone: four sine partials with a quick attack and a fade-out.
  - A Karplus–Strong guitar pluck was tried first, but the owner found it harsh and asked for a very basic sound.
  - Audio lives in `src/lib/audio/synth.ts`, which the metronome now shares (one AudioContext).
  - It's mouse/touch only for now; keyboard access is in the backlog.
- **Full-screen view** (the owner's choice for the phone layout):
  - A button at the right end of the top panel shows just the instrument, the progression legend, and an exit button over the whole page.
  - On Android and desktop it also enters real fullscreen and asks for landscape. iPhone only allows real fullscreen for videos, so there it just covers the page.
  - There is deliberately no portrait layout; people turn the phone sideways.
  - On a 390px-tall landscape phone, fretboard notes are about 19px across, versus about 8px in the normal portrait page.
  - Code: `src/hooks/useFullscreen.ts` and the `stage__visualization--fullscreen` styles in App.css.

## Defaults chosen for the earlier open decisions

These are easy to change:
- **Progression colors** follow each chord's root degree, which was the guitar's behavior before.
- **Numerals and note letters** follow each scale's `degreeLabels`.
  - Scales whose labels are pitch-based keep that convention: Enigmatic's 6th degree is "bVII", and the Altered and Ultralocrian 4th degree (labeled "3") is "III".
  - Editing a label changes both the numeral and the spelling.
- **Chords that aren't stacked thirds** are named from their intervals: sus2 or sus4 for the third, and (b5), (#5), (bb5) or (##5) for the fifth.
- **Double accidentals** are written "##" and "bb".

## Open issues

None known. On a phone held upright, the normal page still shows a small fretboard (about 300px wide). The full-screen view, with the phone turned sideways, is the intended fix.

## Plan

### Phase 4: features, in priority order

The phone layout (formerly item 1) is done as the full-screen view above.

1. **Shareable links and remembered settings:**
   - Move App's `useState`s and the effects that fix up state into one reducer.
   - Sync the reducer state to the URL query string, and keep the last state in `localStorage`.
2. **More sound:** tapping a note already plays it. Next:
   - Play a whole scale or chord (strummed on guitar).
   - Let the metronome advance the progression one chord per bar, playing each chord.
   - `playNote()` and the shared AudioContext in `src/lib/audio/synth.ts` are the building blocks.
3. **Scale position patterns** for scale mode: CAGED, three-notes-per-string and pentatonic boxes. The ROOT STR window is a fixed box around the root, not CAGED shapes.
4. **Info panel** below the instrument:
   - The scale's notes and step formula (W–W–H…).
   - Clickable chord chips (e.g. "ii · F#m7") that replace the numeric DEGREE menu.

## Backlog

- A string-set choice for single-chord shapes (today all string sets show at once), and drop-2 voicings for tetrads.
- On a phone held upright, the full-screen button wraps to its own line under the top dropdowns. It could be tucked into the panel's top-right corner to save that row.
- String names at the nut, and fret numbers.
- Clearer toggle labels in place of "Tune/Drop" and "Half/Full", plus `title` tooltips on the footer toggles.
- Chord-relative labels (R, 3, 5, ♭7) while stepping through a progression.
- More instruments and tunings:
  - Expose the 9-string option.
  - Add DADGAD, open G/D and half-step-down tunings.
  - Add bass and ukulele.
  - Add a custom tuning editor and a left-handed mirror.
- User-built progressions.
- Metronome: beat-1 accent, time signature, tap tempo, visual pulse.
- Accessibility:
  - A colorblind-safe palette option.
  - Arrow-key navigation in the toggle groups.
  - A text description of the fretboard SVG.
  - Keyboard access for playing notes. Fretboard markers and piano keys are click/tap only, and the SVG has `role="img"`.
- Polish:
  - A custom favicon (it's currently Vite's).
  - A meta description and link-preview tags.
  - Offline/installable support.
  - PNG/SVG export.

## Housekeeping

- **Dependencies:**
  - Mainline Vite 8 bundles Rolldown, so the `rolldown-vite` alias and its `overrides` entry can be replaced with plain `vite`.
  - ESLint 10, `eslint-plugin-react-hooks` 7 and TypeScript 7 are available. The new hooks plugin will flag App's setState-in-effect patterns.
  - Upgrade one package at a time.
  - `npm audit` reports 21 issues in dev tooling. They were there before Vitest was added.
- **ESLint config:** `eslint.config.js` ignores `dist`, but the build output is `docs`.
- **Dead code:** `src/Hello.tsx`, `src/assets/react.svg`, and `.app__subtitle` in App.css.
- **README screenshots:** they're commented out. Refresh `screenshots/` after the UI work.

## Decisions still open

- **Deployment:** keep committing `docs/`, or deploy with a GitHub Actions workflow. The second option changes the repo structure.
- **The defaults above:** any of them can be revisited.
