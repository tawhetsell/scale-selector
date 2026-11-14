// Writes the music library's outputs as JSON, for the iOS port (scale-selector-ios) to test against.
// Run: npm run fixtures -- <output directory>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  describeChords,
  getChordDegrees,
  getChordIntervals,
  getChordSymbol,
  getRomanNumeral,
  getScaleTriads,
  type ChordSize,
  type Inversion,
} from '../src/lib/music/chords';
import { getDegreeColor, getScaleDegreeColors, pickTextColor } from '../src/lib/music/colors';
import { KEY_NAMES, midiToFrequency, nameToPc, pcToName, spellScaleDegrees } from '../src/lib/music/notes';
import { getProgressionName, getScaleProgressions, supportsProgressions } from '../src/lib/music/progressions';
import { SCALES, formatDegreeLabel, getGroupedScales, parseDegreeLabel } from '../src/lib/music/scales';
import { computeFretMap, pcToDegree, type Marker } from '../src/lib/music/theory';
import { getTuningPreset } from '../src/lib/music/tunings';
import { findChordShapes, findLowestMarker, getChordVoicingMidi, getPositionWindow } from '../src/lib/music/voicings';

const outDir = resolve(process.argv[2] ?? 'fixtures');
mkdirSync(outDir, { recursive: true });

function write(name: string, data: unknown): void {
  const path = join(outDir, `${name}.json`);
  const text = JSON.stringify(data) + '\n';
  writeFileSync(path, text);
  console.log(`${name}.json  ${(text.length / 1024).toFixed(0)} KB`);
}

const scales = Object.values(SCALES);
const sevenNoteScales = scales.filter((s) => s.intervals.length === 7);
const SIZES: ChordSize[] = [3, 4];
const packMarker = (m: Marker) => [m.stringIndex, m.fret, m.pc, m.degree, m.midi];

// Guitar setups, rotated across scales so each fixture covers every setup without every combination
const SETUPS = [
  { strings: 6, drop: false, maxFrets: 12 },
  { strings: 6, drop: false, maxFrets: 24 },
  { strings: 6, drop: true, maxFrets: 12 },
  { strings: 7, drop: false, maxFrets: 12 },
  { strings: 7, drop: true, maxFrets: 24 },
  { strings: 8, drop: false, maxFrets: 24 },
  { strings: 8, drop: true, maxFrets: 12 },
  { strings: 9, drop: false, maxFrets: 12 },
];

// --- scales.json: the scale table, menu groups and degree labels ---
const allLabels = [...new Set(scales.flatMap((s) => s.degreeLabels))];
write('scales', {
  scales,
  groups: getGroupedScales().map((g) => ({ label: g.label, ids: g.scales.map((s) => s.id) })),
  labels: allLabels.map((label) => ({ label, parsed: parseDegreeLabel(label), formatted: formatDegreeLabel(label) })),
});

// --- notes.json: keys, pitch-class names, frequencies and every scale spelled in every key ---
write('notes', {
  keyNames: KEY_NAMES,
  keyPcs: KEY_NAMES.map(nameToPc),
  sharpNames: Array.from({ length: 12 }, (_, pc) => pcToName(pc, true)),
  flatNames: Array.from({ length: 12 }, (_, pc) => pcToName(pc, false)),
  frequencies: [21, 40, 48, 60, 69, 72, 88, 108].map((midi) => ({ midi, hz: midiToFrequency(midi) })),
  // spellings[scaleId][keyName] = note name per degree
  spellings: Object.fromEntries(
    scales.map((s) => [
      s.id,
      Object.fromEntries(KEY_NAMES.map((key) => [key, spellScaleDegrees(key, s.intervals, s.degreeLabels)])),
    ])
  ),
});

// --- chords.json: chord degrees, intervals, symbols, numerals and names ---
const chordDegrees: unknown[] = [];
for (const scaleLength of [5, 6, 7, 8]) {
  for (const size of SIZES) {
    for (let rootDegree = 1; rootDegree <= scaleLength; rootDegree++) {
      for (const inversion of [0, 1, 2, 3] as Inversion[]) {
        chordDegrees.push({ scaleLength, rootDegree, size, inversion, degrees: getChordDegrees(scaleLength, rootDegree, size, inversion) });
      }
    }
  }
}
write('chords', {
  chordDegrees,
  triads: Object.fromEntries(scales.map((s) => [s.id, getScaleTriads(s)])),
  // byScale[scaleId][size] = one entry per chord root, with its name in every key
  byScale: Object.fromEntries(
    sevenNoteScales.map((s) => [
      s.id,
      Object.fromEntries(
        SIZES.map((size) => [
          size,
          s.intervals.map((_, i) => {
            const rootDegree = i + 1;
            const intervals = getChordIntervals(s.intervals, rootDegree, size);
            return {
              rootDegree,
              intervals,
              symbol: getChordSymbol(intervals),
              numeral: getRomanNumeral(s.degreeLabels[i], intervals),
              names: Object.fromEntries(
                KEY_NAMES.map((key) => {
                  const degreeNames = spellScaleDegrees(key, s.intervals, s.degreeLabels);
                  return [key, describeChords(s, [rootDegree], size, degreeNames)[0].name];
                })
              ),
            };
          }),
        ])
      ),
    ])
  ),
});

// --- progressions.json: named progressions per scale ---
write('progressions', Object.fromEntries(
  scales.map((s) => [
    s.id,
    {
      supported: supportsProgressions(s.id),
      progressions: getScaleProgressions(s.id).map((p) => ({
        name: p.name,
        numerals: p.numerals,
        tetradName: getProgressionName(s, p.numerals, 4),
      })),
    },
  ])
));

// --- colors.json: degree colors and label contrast ---
const allColors = [...new Set(scales.flatMap((s) => getScaleDegreeColors(s.id)))];
write('colors', {
  byScale: Object.fromEntries(scales.map((s) => [s.id, getScaleDegreeColors(s.id)])),
  // getDegreeColor clamps indexes past the end and returns undefined (null here) below zero
  lookups: scales.flatMap((s) =>
    [-1, 0, 3, 6, 7, 9].map((index) => ({ scaleId: s.id, index, color: getDegreeColor(s.id, index) ?? null }))
  ),
  textColors: [...allColors, '#000000', '#ffffff', '#808080', '#777777'].map((bg) => ({ bg, text: pickTextColor(bg) })),
});

// --- fretboard.json: tunings, note maps, position windows and lowest markers ---
const tunings: unknown[] = [];
for (const strings of [6, 7, 8, 9]) {
  for (const drop of [false, true]) tunings.push({ strings, drop, midi: getTuningPreset(strings, drop) });
}
const fretMaps: unknown[] = [];
const windows: unknown[] = [];
const lowest: unknown[] = [];
const degreeLookups: unknown[] = [];
scales.forEach((s, i) => {
  for (let k = 0; k < 3; k++) {
    const setup = SETUPS[(i + k * 3) % SETUPS.length];
    const rootPc = (i * 5 + k * 4) % 12;
    const openMidi = getTuningPreset(setup.strings, setup.drop);
    const markers = computeFretMap(openMidi, setup.maxFrets, rootPc, s.intervals);
    fretMaps.push({ scaleId: s.id, rootPc, ...setup, markers: markers.map(packMarker) });
    lowest.push({
      scaleId: s.id, rootPc, ...setup,
      // one entry per degree, plus a degree the scale doesn't have
      lowest: [...s.intervals.map((_, d) => d + 1), 9].map((degree) => {
        const m = findLowestMarker(markers, degree);
        return m ? packMarker(m) : null;
      }),
    });
  }
  degreeLookups.push({
    scaleId: s.id,
    rootPc: (i * 7) % 12,
    degrees: Array.from({ length: 12 }, (_, pc) => pcToDegree(pc, (i * 7) % 12, s.intervals)),
  });
  // Position windows depend only on where the root falls, so two scales cover them: every key, setup and string
  if (s.id !== 'major' && s.id !== 'pentatonicMinor') return;
  for (let rootPc = 0; rootPc < 12; rootPc++) {
    for (const setup of SETUPS) {
      const openMidi = getTuningPreset(setup.strings, setup.drop);
      const markers = computeFretMap(openMidi, setup.maxFrets, rootPc, s.intervals);
      for (let stringIndex = 0; stringIndex < setup.strings; stringIndex++) {
        const w = getPositionWindow(markers, stringIndex, setup.maxFrets);
        windows.push([i, rootPc, setup.strings, setup.drop ? 1 : 0, setup.maxFrets, stringIndex, w ? w.minFret : -1, w ? w.maxFret : -1]);
      }
    }
  }
});
write('fretboard', {
  tunings,
  fretMaps,
  lowest,
  degreeLookups,
  // [scale index (in scales.json order), rootPc, strings, drop, maxFrets, stringIndex, minFret, maxFret]; -1/-1 means no window
  windowScaleIds: scales.map((s) => s.id),
  windows,
});

// --- voicings.json: guitar chord shapes and piano voicings ---
const shapes: unknown[] = [];
const pianoVoicings: unknown[] = [];
sevenNoteScales.forEach((s, i) => {
  {
    const setup = SETUPS[i % SETUPS.length];
    const rootPc = (i * 7) % 12;
    const openMidi = getTuningPreset(setup.strings, setup.drop);
    const markers = computeFretMap(openMidi, setup.maxFrets, rootPc, s.intervals);
    for (const size of SIZES) {
      for (let rootDegree = 1; rootDegree <= 7; rootDegree++) {
        for (let inversion = 0; inversion < size; inversion++) {
          const degrees = getChordDegrees(7, rootDegree, size, inversion as Inversion);
          shapes.push({
            scaleId: s.id, rootPc, ...setup, size, rootDegree, inversion,
            // each shape is [stringIndex, fret] per note, bass first
            shapes: findChordShapes(markers, degrees, degrees[0]).map((shape) => shape.map((m) => [m.stringIndex, m.fret])),
          });
        }
      }
    }
  }
  // Four keys per scale, rotated so every key is covered; the app voices from C3 (48)
  for (const rootPc of [i % 12, (i + 3) % 12, (i + 6) % 12, (i + 9) % 12]) {
    for (const size of SIZES) {
      for (let rootDegree = 1; rootDegree <= 7; rootDegree++) {
        for (let inversion = 0; inversion < size; inversion++) {
          const degrees = getChordDegrees(7, rootDegree, size, inversion as Inversion);
          for (const lowestMidi of rootPc === i % 12 ? [48, 41] : [48]) {
            pianoVoicings.push([i, rootPc, size, rootDegree, inversion, lowestMidi, ...getChordVoicingMidi(rootPc, s.intervals, degrees, lowestMidi)]);
          }
        }
      }
    }
  }
});
// A narrower span limit than the default, on one setup
const narrowMarkers = computeFretMap(getTuningPreset(6), 12, 4, SCALES.major.intervals);
const narrowShapes = [3, 4].flatMap((size) =>
  [0, 1, 2].map((inversion) => {
    const degrees = getChordDegrees(7, 1, size as ChordSize, inversion as Inversion);
    return {
      size, inversion, maxSpan: 3,
      shapes: findChordShapes(narrowMarkers, degrees, degrees[0], 3).map((shape) => shape.map((m) => [m.stringIndex, m.fret])),
    };
  })
);
write('voicings', {
  shapes,
  narrowShapes,
  // [scale index (in pianoScaleIds order), rootPc, size, rootDegree, inversion, lowestMidi, ...midi notes]
  pianoScaleIds: sevenNoteScales.map((s) => s.id),
  pianoVoicings,
});
