# Project Instructions for Claude (Scale Selector)

## Git commits
- Do not add co-author attribution or "Generated with Claude Code" to commit messages.
- Keep commit messages short and focused on what changed.

## WHY
Scale Selector is a guitar fretboard and piano keyboard visualizer showing scale tones and chord tones (triads/tetrads) across common tunings and fret ranges. It has 45 scale options spelled for 17 keys, named chord progressions for 7-note scales, playable chord shapes for each inversion, a root-string position window, and a metronome. Open issues and the remaining plan are in agent_docs/roadmap.md.

## WHAT (repo map)
- src/App.tsx, src/App.css — main UI, top dropdown panel + footer toggles, mode state, legend data
- src/components/Fretboard/Fretboard.tsx — SVG fretboard: which markers to draw (via lib/music/voicings), rings, rendering
- src/components/PianoKeyboard/ — 25-key piano view (C3–C5); lights one voicing per chord in chord modes
- src/components/ProgressionLegend/ — progression legend + step controls, shared by both instruments
- src/components/Metronome/ — Web Audio metronome (40–240 BPM)
- src/hooks/useFullscreen.ts — full-screen view of the instrument (covers the page; real fullscreen + landscape where the browser allows)
- src/lib/music/* — pure TS music logic:
  - notes.ts — pitch class <-> note name, KEY_NAMES, key-aware spelling (spellScaleDegrees)
  - scales.ts — 46 scale definitions (45 in the menu; Ionian hidden) with intervals and degree labels; degree-label parsing
  - chords.ts — chord degrees + inversions, chord symbols, Roman numerals, legend labels
  - tunings.ts — 6/7/8/9-string presets as MIDI note numbers (lowest string first), drop tuning
  - theory.ts — computeFretMap() (markers carry midi), pitch->degree mapping
  - progressions.ts — progression numerals; names generated from the chords (7-note scales only)
  - voicings.ts — fretboard chord shapes, position window, lowest-note lookup, piano voicings
  - colors.ts — 8-color degree palette
  - *.test.ts — Vitest unit tests for the modules above
- src/lib/audio/synth.ts — Web Audio (browser-only): shared AudioContext, playNote() for click-to-play (one basic sine-partial tone for both instruments)
- screenshots/ — source screenshots for README (not part of build output)
- docs/ — production build output for GitHub Pages; do not store source assets here
- vite.config.ts — base: /scale-selector/, outDir: docs

## HOW (rules for all work)
- **Keep lib/music pure**: No React, no DOM, no CSS. UI calls into lib/music; don't duplicate theory elsewhere.
- **Audio goes through lib/audio/synth.ts**: reuse getAudioContext() (one AudioContext for notes and the metronome) and call it from user-gesture handlers.
- **Prefer small changes**: Match existing patterns. Don't bloat App.tsx—factor into components or lib/music.
- **7-note limitation**: Triads, tetrads, and progressions only work with 7-note scales. Don't try to extend this without understanding the diatonic harmony model.
- **Fretboard orientation is intentional**: string index 0 is the lowest-pitched string and is drawn at the bottom (the player's view looking down at the neck). Don't flip the drawing; code that needs the lowest note must use the lowest index or actual pitch.
- **Test music logic**: add or update tests in src/lib/music/*.test.ts when changing lib/music.
- **Run lint + test + build**: Fix TypeScript, ESLint, and test failures before finishing.

## Refactor policy
- Do NOT reorganize the repo, rename folders, or move files unless explicitly requested.
- Avoid cleanup refactors (formatting sweeps, mass renames) unless asked.
- If a structural refactor seems necessary, explain why first.

## Build & development
```
npm install
npm run dev      # Start dev server
npm run lint     # Run ESLint
npm test         # Run unit tests (Vitest)
npm run build    # Build to /docs
npm run preview  # Preview production build
```

## Deployment (GitHub Pages)
- Output: /docs folder
- Base URL: /scale-selector/
- If changing routing or asset paths, update vite.config.ts

## Progressive disclosure
For deeper context on specific subsystems:
- agent_docs/music-model.md — pitch classes, spelling, scales, chords (symbols, numerals, inversions), progressions, voicings, colors
- agent_docs/fretboard-mapping.md — orientation, MIDI tunings, marker generation, shape finder, position window, bass rings
- agent_docs/ui-modes.md — control layout, scale/single-chord/progression modes, voicing, colors, rings, piano, metronome
- agent_docs/roadmap.md — what was fixed on 2026-10-03, defaults chosen, open issues, and the remaining plan
