# Scale Selector

Created by **Travis A. Whetsell**.

Scale Selector is a musical scale visualizer that shows scale tones and chord tones on:
- a guitar fretboard, or
- a piano keyboard (toggle in the visualizer)

Live demo: https://tawhetsell.github.io/scale-selector/

## Overview

Scale Selector lets you explore:
- scale tones (all degrees) across 45 scale options, including the church modes, harmonic and melodic minor modes, pentatonic, symmetric, exotic, and blues & bebop scales
- triads and tetrads (7th chords) built on any degree of a 7-note scale
- common progressions for each 7-note scale (I–IV–V, ii–V–I, etc.), one chord at a time or all together
- click any note on the fretboard or keyboard to hear it
- a built-in metronome

## Controls

Top panel:
- Scale + Key selection (all 12 keys, with sharp and flat spellings; notes are spelled for the key, e.g. B♭ in F major)
- Chord: None, Triads, or Tetrads (7-note scales only)
- Degree: which chord to show (1–7)
- Progs: a named progression for the current scale
- Root Str: anchors a progression to a fret position around the root on the 4th, 5th, or 6th string
- Voice: root position or an inversion (the guitar shows playable shapes with that bass note; the piano shows the voicing)

Bottom panel:
- View toggle: Guitar ↔ Piano
- Color: Color or Mono
- Labels: ABC (note names) or 123 (scale degrees)
- Metronome: 40–240 BPM

Guitar view options:
- Strings: 6, 7, or 8
- Frets: Half (12) or Full (24)
- Tuning: standard, or Drop (lowest string down a whole step)

Piano view:
- Fixed 25-key keyboard range (C3 → C5)
- All or Focus (fades keys outside the current scale or chord)

<!--
## Screenshots

(Add updated screenshots for both Guitar and Piano views here.)
-->

## Roadmap

Planned features, roughly in order:
- A phone-friendly fretboard
- Shareable links and remembered settings
- Playing whole scales and chords, with the metronome stepping through progressions
- Scale position patterns (CAGED, three notes per string)
- An info panel with the scale's notes, formula, and chords

Details: [agent_docs/roadmap.md](agent_docs/roadmap.md)

## Tech

- Vite + React + TypeScript

## Run locally

    npm install
    npm run dev

Run the unit tests:

    npm test

Build for production:

    npm run build
    npm run preview

## Acknowledgements

- Built through natural language prompting using `gpt-5.2-codex-xhigh` and `claude-opus-4.5-4.6` in VS Code
