import { useMemo } from 'react';
import { pcToName } from '../../lib/music/notes';
import { pcToDegree } from '../../lib/music/theory';
import { getChordDegrees, type ChordSize, type Inversion } from '../../lib/music/chords';
import { getChordVoicingMidi } from '../../lib/music/voicings';
import { getScaleDegreeColors } from '../../lib/music/colors';
import { SCALES } from '../../lib/music/scales';
import { playNote } from '../../lib/audio/synth';
import './PianoKeyboard.css';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;

type Props = {
  rootPc: number;
  intervals: number[];
  scaleId: ScaleId;
  degreeNames: string[]; // spelled note name for each scale degree
  labelMode: LabelMode;
  colorMode: ColorMode;
  chordSize: ChordSize | null; // null = scale mode
  chordRootDegree: number; // the chord shown when no progression is active
  progressionNumerals: number[] | null; // chord roots of the active progression
  inversion: Inversion;
  currentStep: number | null;
  fadeInactiveKeys?: boolean;
};

// Piano key layout: 25 keys from C3 (MIDI 48) to C5 (MIDI 72)
// White keys pattern per octave: C, D, E, F, G, A, B (7 white keys)
// Black keys pattern per octave: C#, D#, F#, G#, A# (5 black keys)

const MONO_ROOT = '#f5f7fa';
const MONO_TONE = '#8d949c';

// Chord voicings put their bass note at or above C3, so they always fit on the keyboard
const VOICING_LOWEST_MIDI = 48;

// Key info for rendering
type KeyInfo = {
  midiNote: number;
  pc: number;      // pitch class 0-11
  isBlack: boolean;
  noteName: string;
  octave: number;
};

// Generate all 25 keys from C3 to C5
function generateKeys(): KeyInfo[] {
  const keys: KeyInfo[] = [];
  const blackPcs = new Set([1, 3, 6, 8, 10]); // C#, D#, F#, G#, A#

  for (let midi = 48; midi <= 72; midi++) {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12) - 1; // MIDI octave convention
    const isBlack = blackPcs.has(pc);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    keys.push({
      midiNote: midi,
      pc,
      isBlack,
      noteName: noteNames[pc],
      octave,
    });
  }
  return keys;
}

const ALL_KEYS = generateKeys();
const WHITE_KEYS = ALL_KEYS.filter(k => !k.isBlack);
const BLACK_KEYS = ALL_KEYS.filter(k => k.isBlack);

export default function PianoKeyboard({
  rootPc,
  intervals,
  scaleId,
  degreeNames,
  labelMode,
  colorMode,
  chordSize,
  chordRootDegree,
  progressionNumerals,
  inversion,
  currentStep,
  fadeInactiveKeys = false,
}: Props) {
  const scale = SCALES[scaleId];
  const degreeColors = getScaleDegreeColors(scaleId);
  const colorForDegree = (degree: number) =>
    degreeColors[Math.min(Math.max(degree, 1) - 1, degreeColors.length - 1)];
  const isMultiChordProgression = progressionNumerals !== null && progressionNumerals.length > 1;

  // Chord modes light one voicing per chord, so inversions are visible: MIDI note -> chord indexes.
  // Null in scale mode, where every scale tone is lit in both octaves.
  const chordsByMidi = useMemo((): Map<number, number[]> | null => {
    if (chordSize === null) return null;
    const map = new Map<number, number[]>();
    (progressionNumerals ?? [chordRootDegree]).forEach((root, chordIndex) => {
      const degrees = getChordDegrees(intervals.length, root, chordSize, inversion);
      for (const midi of getChordVoicingMidi(rootPc, intervals, degrees, VOICING_LOWEST_MIDI)) {
        map.set(midi, [...(map.get(midi) ?? []), chordIndex]);
      }
    });
    return map;
  }, [chordSize, progressionNumerals, chordRootDegree, intervals, inversion, rootPc]);

  // Render a single key
  const renderKey = (key: KeyInfo) => {
    const degree = pcToDegree(key.pc, rootPc, intervals);
    const chordIndices = chordsByMidi?.get(key.midiNote) ?? null;

    // isInSet = key belongs to current display set (scale tones or chord voicing notes)
    const isInSet = chordsByMidi ? chordIndices !== null : degree > 0;
    const isRoot = isInSet && degree === 1;

    let color: string | null = null;
    if (isInSet) {
      if (colorMode === 'mono') {
        color = isRoot ? MONO_ROOT : MONO_TONE;
      } else if (isMultiChordProgression && chordIndices && progressionNumerals) {
        // Same rule as the fretboard: the color of the chord's root degree
        color = colorForDegree(progressionNumerals[chordIndices[0]]);
      } else {
        color = colorForDegree(degree);
      }
    }

    const label = !isInSet
      ? null
      : labelMode === 'degree'
      ? scale.degreeLabels[degree - 1] ?? String(degree)
      : degreeNames[degree - 1] ?? pcToName(key.pc);

    // Determine if this key should be faded (Focus mode + not in set)
    const shouldFade = fadeInactiveKeys && !isInSet;

    // Step mode dims keys outside the current chord; faded keys use CSS opacity
    const stepOpacity = currentStep !== null && chordIndices && !chordIndices.includes(currentStep) ? 0.2 : 1;
    const opacity = shouldFade ? undefined : (isInSet ? stepOpacity : 1);

    const keyClass = key.isBlack ? 'piano-key piano-key--black' : 'piano-key piano-key--white';
    const activeClass = isInSet ? 'piano-key--active' : '';
    const rootClass = isRoot ? 'piano-key--root' : '';
    const fadedClass = shouldFade ? 'piano-key--faded' : '';

    return (
      <div
        key={key.midiNote}
        className={`${keyClass} ${activeClass} ${rootClass} ${fadedClass}`}
        style={{
          '--key-color': color ?? undefined,
          opacity,
        } as React.CSSProperties}
        data-note={key.noteName}
        data-octave={key.octave}
        onClick={() => playNote(key.midiNote)}
      >
        {label && <span className="piano-key__label">{label}</span>}
      </div>
    );
  };

  return (
    <div className="piano-container" data-color-mode={colorMode}>
      <div className="piano-keyboard" role="img" aria-label="Piano keyboard">
        <div className="piano-keys">
          {/* White keys */}
          <div className="piano-white-keys">
            {WHITE_KEYS.map(renderKey)}
          </div>
          {/* Black keys overlay */}
          <div className="piano-black-keys">
            {BLACK_KEYS.map(renderKey)}
          </div>
        </div>
      </div>
    </div>
  );
}
