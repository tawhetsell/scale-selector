# Scale Selector

Created by **Travis A. Whetsell**.

Scale Selector is a musical scale visualizer that shows scale tones and chord tones on:
- a guitar fretboard, or
- a piano keyboard (toggle in the visualizer)

Live demo: https://tawhetsell.github.io/scale-selector/

## Overview

Scale Selector lets you explore:
- scale tones (all degrees)
- triads and tetrads (by degree)
- common progressions (I–IV–V, ii–V–I, etc.)

## Controls

- Scale + Key selection
- Chords mode: Triad or Tetrad
- Degree selection (1-7) 
- Labels: Letters or Numbers
- Color: Color or Mono
- View toggle: Guitar ↔ Piano

Guitar view options:
- Strings (6–9)
- Frets (12/24)
- Root string selection (for CAGED position anchoring)
- Voicing selection (inversions)
- Drop tuning (lowest string)

Piano view:
- Fixed 25-key keyboard range (C3 → C5)

<!--
## Screenshots

(Add updated screenshots for both Guitar and Piano views here.)
-->

## Tech

- Vite + React
- Built through natural language prompting using `gpt-5.2-codex-xhigh` and `claude-opus-4.5` in VS Code
- Deployed with GitHub Pages

## Run locally

    npm install
    npm run dev

Build for production:

    npm run build
    npm run preview

## License

MIT — see the [LICENSE](LICENSE) file.

Copyright (c) 2026 Travis A. Whetsell
