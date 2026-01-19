import { useMemo, useCallback } from 'react';
import { pcToName, normalizePc } from '../../lib/music/notes';
import { scaleSet, pcToDegree } from '../../lib/music/theory';
import { getScaleDegreeColors } from '../../lib/music/colors';
import { SCALES } from '../../lib/music/scales';
import type { ChordQuality } from '../../lib/music/progressions';
import './PianoKeyboard.css';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;
type ViewMode = 'scale' | 'triads' | 'tetrads';
type Voicing = 'root' | '1st' | '2nd' | '3rd';

type Props = {
  rootPc: number;
  intervals: number[];
  scaleId: ScaleId;
  labelMode: LabelMode;
  colorMode: ColorMode;
  preferSharps?: boolean;
  viewMode: ViewMode;
  triadDegrees: number[] | null;
  progressionNumerals: number[] | null;
  chordQualities: ChordQuality[];
  currentStep: number | null;
  onStepChange: (step: number | null) => void;
  voicing: Voicing;
};

// Piano key layout: 25 keys from C3 (MIDI 48) to C5 (MIDI 72)
// White keys pattern per octave: C, D, E, F, G, A, B (7 white keys)
// Black keys pattern per octave: C#, D#, F#, G#, A# (5 black keys)

const MONO_ROOT = '#f5f7fa';
const MONO_TONE = '#8d949c';

// Progression colors (matches fretboard)
const PROGRESSION_COLORS = [
  '#EA3F75', // I - pink
  '#FF7A66', // ii/II - coral
  '#7A73EF', // iii/III - violet
  '#4281EA', // IV/iv - blue
  '#00D4FF', // V/v - cyan
  '#00FFC8', // vi/VI - mint
  '#39FF88', // vii/VII - green
];

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
  labelMode,
  colorMode,
  preferSharps = true,
  viewMode,
  triadDegrees,
  progressionNumerals,
  chordQualities,
  currentStep,
  onStepChange,
  voicing,
}: Props) {
  const scale = SCALES[scaleId];
  const degreeColors = getScaleDegreeColors(scaleId);
  const scalePcSet = useMemo(() => scaleSet(rootPc, intervals), [rootPc, intervals]);

  const isProgressionMode = progressionNumerals !== null && progressionNumerals.length > 0;
  const useTetrads = viewMode === 'tetrads';

  // Helper to get chord degrees with inversion applied (same as fretboard)
  const getChordDegrees = useCallback((chordRoot: number): number[] => {
    const n = intervals.length;
    const rootIdx = chordRoot - 1;
    const thirdIdx = (rootIdx + 2) % n;
    const fifthIdx = (rootIdx + 4) % n;
    const seventhIdx = (rootIdx + 6) % n;

    let degrees: number[];
    if (useTetrads) {
      degrees = [rootIdx + 1, thirdIdx + 1, fifthIdx + 1, seventhIdx + 1];
    } else {
      degrees = [rootIdx + 1, thirdIdx + 1, fifthIdx + 1];
    }

    const inversionAmount =
      voicing === '1st' ? 1 :
      voicing === '2nd' ? 2 :
      voicing === '3rd' ? 3 : 0;

    const rotated = [...degrees.slice(inversionAmount), ...degrees.slice(0, inversionAmount)];
    return rotated;
  }, [intervals.length, useTetrads, voicing]);

  // Get all active degrees based on mode
  const activeDegrees = useMemo((): Set<number> => {
    if (isProgressionMode && progressionNumerals) {
      const allDegrees = new Set<number>();
      for (const chordRoot of progressionNumerals) {
        const degrees = getChordDegrees(chordRoot);
        degrees.forEach(d => allDegrees.add(d));
      }
      return allDegrees;
    }
    if ((viewMode === 'triads' || viewMode === 'tetrads') && triadDegrees) {
      return new Set(triadDegrees);
    }
    // Scale mode: all scale degrees
    return new Set(Array.from({ length: intervals.length }, (_, i) => i + 1));
  }, [isProgressionMode, progressionNumerals, viewMode, triadDegrees, intervals.length, getChordDegrees]);

  // Map degrees to progression chord indices (for coloring)
  const degreeToProgressionChords = useMemo(() => {
    if (!isProgressionMode || !progressionNumerals) return null;
    const map = new Map<number, number[]>();
    progressionNumerals.forEach((chordRoot, chordIndex) => {
      const degrees = getChordDegrees(chordRoot);
      degrees.forEach((deg) => {
        const existing = map.get(deg) ?? [];
        if (!existing.includes(chordIndex)) {
          map.set(deg, [...existing, chordIndex]);
        }
      });
    });
    return map;
  }, [isProgressionMode, progressionNumerals, getChordDegrees]);

  // Check if a pitch class is active
  const isKeyActive = useCallback((pc: number): boolean => {
    if (!scalePcSet.has(pc)) return false;
    const degree = pcToDegree(pc, rootPc, intervals);
    if (degree === 0) return false;
    return activeDegrees.has(degree);
  }, [scalePcSet, rootPc, intervals, activeDegrees]);

  // Get the degree for a pitch class
  const getKeyDegree = useCallback((pc: number): number => {
    return pcToDegree(pc, rootPc, intervals);
  }, [rootPc, intervals]);

  // Get color for a key
  const getKeyColor = useCallback((pc: number, isActive: boolean): string | null => {
    if (!isActive) return null;

    const degree = getKeyDegree(pc);
    if (degree === 0) return null;

    const isRoot = degree === 1;
    const isMultiChordProgression = progressionNumerals !== null && progressionNumerals.length > 1;

    if (colorMode === 'mono') {
      return isRoot ? MONO_ROOT : MONO_TONE;
    }

    if (isMultiChordProgression && degreeToProgressionChords) {
      const chordIndices = degreeToProgressionChords.get(degree) ?? [0];
      return PROGRESSION_COLORS[chordIndices[0] % PROGRESSION_COLORS.length];
    }

    return degreeColors[Math.min(Math.max(degree, 1) - 1, degreeColors.length - 1)];
  }, [getKeyDegree, colorMode, progressionNumerals, degreeToProgressionChords, degreeColors]);

  // Get opacity for step mode
  const getKeyOpacity = useCallback((pc: number): number => {
    if (currentStep === null || !degreeToProgressionChords) return 1;

    const degree = getKeyDegree(pc);
    if (degree === 0) return 1;

    const chordIndices = degreeToProgressionChords.get(degree) ?? [];
    return chordIndices.includes(currentStep) ? 1 : 0.2;
  }, [currentStep, degreeToProgressionChords, getKeyDegree]);

  // Get label for a key
  const getKeyLabel = useCallback((pc: number, isActive: boolean): string | null => {
    if (!isActive) return null;

    const degree = getKeyDegree(pc);
    if (degree === 0) return null;

    if (labelMode === 'degree') {
      return scale.degreeLabels[degree - 1] ?? String(degree);
    }
    return pcToName(pc, preferSharps);
  }, [getKeyDegree, labelMode, scale.degreeLabels, preferSharps]);

  // Build legend data for multi-chord progressions (same as fretboard)
  const legendData = isProgressionMode && progressionNumerals && progressionNumerals.length > 1
    ? progressionNumerals.map((chordRoot, index) => {
        const quality = chordQualities[chordRoot - 1] ?? 'maj';
        const chordRootPc = normalizePc(rootPc + intervals[chordRoot - 1]);
        const rootName = pcToName(chordRootPc, preferSharps);

        // Get chord suffix
        const suffixMap: Record<string, string> = {
          'maj': '', 'min': 'm', 'dim': '°', 'aug': '+',
          'maj7': 'maj7', 'min7': 'm7', 'dom7': '7', 'dim7': '°7',
          'minMaj7': 'mM7', 'aug7': '+7', 'half-dim': 'ø7'
        };
        const chordName = `${rootName}${suffixMap[quality] ?? ''}`;

        const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
        let romanNumeral = numerals[chordRoot - 1] ?? String(chordRoot);
        if (['min', 'dim', 'min7', 'dim7', 'half-dim', 'minMaj7'].includes(quality)) {
          romanNumeral = romanNumeral.toLowerCase();
        }

        let qualitySymbol = '';
        if (quality === 'dim' || quality === 'dim7') qualitySymbol = '°';
        else if (quality === 'aug' || quality === 'aug7') qualitySymbol = '+';
        else if (quality === 'half-dim') qualitySymbol = 'ø';

        return {
          chordRoot,
          color: PROGRESSION_COLORS[index % PROGRESSION_COLORS.length],
          romanNumeral,
          qualitySymbol,
          chordName,
          index,
        };
      })
    : null;

  const handlePrevStep = useCallback(() => {
    if (!progressionNumerals) return;
    if (currentStep === null) {
      onStepChange(progressionNumerals.length - 1);
    } else if (currentStep === 0) {
      onStepChange(null);
    } else {
      onStepChange(currentStep - 1);
    }
  }, [progressionNumerals, currentStep, onStepChange]);

  const handleNextStep = useCallback(() => {
    if (!progressionNumerals) return;
    if (currentStep === null) {
      onStepChange(0);
    } else if (currentStep >= progressionNumerals.length - 1) {
      onStepChange(null);
    } else {
      onStepChange(currentStep + 1);
    }
  }, [progressionNumerals, currentStep, onStepChange]);

  const handleShowAll = useCallback(() => {
    onStepChange(null);
  }, [onStepChange]);

  // Render a single key
  const renderKey = (key: KeyInfo) => {
    const isActive = isKeyActive(key.pc);
    const isRoot = getKeyDegree(key.pc) === 1 && isActive;
    const color = getKeyColor(key.pc, isActive);
    const label = getKeyLabel(key.pc, isActive);
    const opacity = isActive ? getKeyOpacity(key.pc) : 1;

    const keyClass = key.isBlack ? 'piano-key piano-key--black' : 'piano-key piano-key--white';
    const activeClass = isActive ? 'piano-key--active' : '';
    const rootClass = isRoot ? 'piano-key--root' : '';

    return (
      <div
        key={key.midiNote}
        className={`${keyClass} ${activeClass} ${rootClass}`}
        style={{
          '--key-color': color ?? undefined,
          opacity,
        } as React.CSSProperties}
        data-note={key.noteName}
        data-octave={key.octave}
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
      {legendData && (
        <div className="progression-legend">
          <div className="legend-chords">
            {legendData.map((chord, i) => (
              <div
                key={chord.chordRoot}
                className={`legend-chord ${currentStep === i ? 'legend-chord--active' : ''} ${currentStep !== null && currentStep !== i ? 'legend-chord--dimmed' : ''}`}
                onClick={() => onStepChange(currentStep === i ? null : i)}
              >
                <span className="legend-dot" style={{ background: chord.color }} />
                <span className="legend-numeral">{chord.romanNumeral}{chord.qualitySymbol}</span>
                <span className="legend-name">({chord.chordName})</span>
                {i < legendData.length - 1 && <span className="legend-arrow">→</span>}
              </div>
            ))}
          </div>
          <div className="step-controls">
            <button className="step-btn" onClick={handlePrevStep} title="Previous chord">◀</button>
            <button className="step-btn step-btn--all" onClick={handleShowAll} title="Show all chords">All</button>
            <button className="step-btn" onClick={handleNextStep} title="Next chord">▶</button>
          </div>
        </div>
      )}
    </div>
  );
}
