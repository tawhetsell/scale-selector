# Project Instructions for Claude (Scale Selector)

## Git commits
- Do not add co-author attribution or "Generated with Claude Code" to commit messages.
- Keep commit messages short and focused on what changed.

## WHY
Scale Selector is a guitar fretboard visualizer showing scale tones and chord tones (triads/tetrads) across common tunings and fret ranges. It supports 70+ scales, chord progressions, voicing inversions, and a CAGED position system.

## WHAT (repo map)
- src/App.tsx, src/App.css — main UI, control rows, mode state
- src/components/Fretboard/Fretboard.tsx — SVG fretboard, marker rendering, chord shape finding, legend
- src/lib/music/* — pure TS music logic:
  - notes.ts — pitch class <-> note name conversion
  - scales.ts — 70+ scale definitions with intervals and degree labels
  - chords.ts — triad/tetrad generation from scale degrees
  - tunings.ts — 6/7/8/9-string presets, drop tuning
  - theory.ts — computeFretMap(), pitch->degree mapping
  - progressions.ts — chord quality detection, named progressions (7-note scales only)
  - colors.ts — 8-color degree palette
- screenshots/ — source screenshots for README (not part of build output)
- docs/ — production build output for GitHub Pages; do not store source assets here
- vite.config.ts — base: /scale-selector/, outDir: docs

## HOW (rules for all work)
- **Keep lib/music pure**: No React, no DOM, no CSS. UI calls into lib/music; don't duplicate theory elsewhere.
- **Prefer small changes**: Match existing patterns. Don't bloat App.tsx—factor into components or lib/music.
- **7-note limitation**: Triads, tetrads, and progressions only work with 7-note scales. Don't try to extend this without understanding the diatonic harmony model.
- **Run lint + build**: Fix TypeScript and ESLint errors before finishing.

## Refactor policy
- Do NOT reorganize the repo, rename folders, or move files unless explicitly requested.
- Avoid cleanup refactors (formatting sweeps, mass renames) unless asked.
- If a structural refactor seems necessary, explain why first.

## Build & development
```
npm install
npm run dev      # Start dev server
npm run lint     # Run ESLint
npm run build    # Build to /docs
npm run preview  # Preview production build
```

## Deployment (GitHub Pages)
- Output: /docs folder
- Base URL: /scale-selector/
- If changing routing or asset paths, update vite.config.ts

## Progressive disclosure
For deeper context on specific subsystems:
- agent_docs/music-model.md — pitch classes, intervals, scale + chord construction
- agent_docs/fretboard-mapping.md — tuning->note mapping, marker generation, position filtering
- agent_docs/ui-modes.md — scale/triad/tetrad modes, progression mode, voicing, CAGED positions
