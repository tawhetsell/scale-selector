import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import { nameToPc } from './lib/music/notes';
import { SCALES } from './lib/music/scales';
import { getScaleTriads, getScaleTetrads } from './lib/music/chords';
import { getTuningPreset } from './lib/music/tunings';
import { getScaleProgressions, supportsProgressions, type Progression } from './lib/music/progressions';

const SCALE_NAME_ABBREVIATIONS: Array<[RegExp, string]> = [
  [/Harmonic/gi, 'Harm.'],
  [/Melodic/gi, 'Mel.'],
  [/Dominant/gi, 'Dom.'],
  [/Diminished/gi, 'Dim.'],
  [/Augmented/gi, 'Aug.'],
  [/Pentatonic/gi, 'Pent.'],
  [/Japanese/gi, 'Jap.'],
  [/Natural/gi, 'Nat.'],
  [/Minor/gi, 'Min.'],
  [/Major/gi, 'Maj.'],
  [/Locrian/gi, 'Locr.'],
  [/Lydian/gi, 'Lyd.'],
  [/Mixolydian/gi, 'Mixolyd.'],
  [/Phrygian/gi, 'Phryg.'],
  [/Aeolian/gi, 'Aeol.'],
  [/Ionian/gi, 'Ion.'],
  [/Chromatic/gi, 'Chrom.'],
  [/Hungarian/gi, 'Hung.'],
  [/Spanish/gi, 'Span.'],
  [/Acoustic/gi, 'Acous.'],
  [/Altered/gi, 'Alt.'],
  [/Bebop/gi, 'Beb.'],
];

function shortenScaleName(name: string): string {
  if (name.length <= 16) return name;

  let label = name.replace(/\s*\([^)]*\)/g, '').trim();
  label = label.replace(/[�]/g, '');
  for (const [pattern, replacement] of SCALE_NAME_ABBREVIATIONS) {
    label = label.replace(pattern, replacement);
  }
  label = label.replace(/\s+/g, ' ').trim();

  if (label.length > 16) {
    label = `${label.slice(0, 15).trimEnd()}…`;
  }

  return label;
}

type ViewMode = 'scale' | 'triads' | 'tetrads';
type RootString = 6 | 5 | 4;
type Voicing = 'root' | '1st' | '2nd' | '3rd';

export default function App() {
  const [strings, setStrings] = useState(6);
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>('major');
  const [rootName, setRootName] = useState('E');
  const [maxFrets, setMaxFrets] = useState(12);
  const [labelMode, setLabelMode] = useState<'degree' | 'letters'>('degree');
  const [colorMode, setColorMode] = useState<'mono' | 'color'>('mono');
  const [viewMode, setViewMode] = useState<ViewMode>('scale');
  const [chordRootDegree, setChordRootDegree] = useState(1);
  const [selectedProgression, setSelectedProgression] = useState<string>('scale');
  const [rootString, setRootString] = useState<RootString>(4);
  const [voicing, setVoicing] = useState<Voicing>('root');
  const [dropTuning, setDropTuning] = useState(false);

  const openPcs = useMemo(() => getTuningPreset(strings, dropTuning), [strings, dropTuning]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);

  const scale = SCALES[scaleId];

  const scaleOptions = useMemo(
    () => Object.values(SCALES).filter((s) => s.id !== 'ionian'), // hide Ionian since Major is equivalent
    []
  );

  const canShowTriads = scale.intervals.length === 7;
  const canShowProgressions = supportsProgressions(scaleId);

  const scaleProgressions = useMemo(
    () => getScaleProgressions(scaleId),
    [scaleId]
  );

  const availableProgressions: Progression[] = useMemo(
    () => scaleProgressions?.progressions ?? [],
    [scaleProgressions]
  );

  const activeProgression = useMemo(
    () => availableProgressions.find((p) => p.name === selectedProgression) ?? null,
    [availableProgressions, selectedProgression]
  );

  const isProgressionActive = selectedProgression !== 'scale' && activeProgression !== null;

  // Single-chord voicing mode: when CHORDS = Triads/Tetrads but no progression is selected
  const isSingleChordVoicingMode = (viewMode === 'triads' || viewMode === 'tetrads') && !isProgressionActive;

  const triads = useMemo(
    () => (canShowTriads ? getScaleTriads(scale) : []),
    [canShowTriads, scale]
  );

  const tetrads = useMemo(
    () => (canShowTriads ? getScaleTetrads(scale) : []),
    [canShowTriads, scale]
  );

  const activeTriad =
    canShowTriads && viewMode === 'triads'
      ? triads.find((t) => t.rootDegree === chordRootDegree) ?? triads[0] ?? null
      : null;

  const activeTetrad =
    canShowTriads && viewMode === 'tetrads'
      ? tetrads.find((t) => t.rootDegree === chordRootDegree) ?? tetrads[0] ?? null
      : null;

  // Get base chord degrees and apply voicing rotation
  const activeChordDegrees = useMemo(() => {
    let degrees: number[] | null = null;

    if (viewMode === 'triads' && activeTriad) {
      degrees = activeTriad.degrees;
    } else if (viewMode === 'tetrads' && activeTetrad) {
      degrees = activeTetrad.degrees;
    }

    if (!degrees) return null;

    // Apply voicing rotation (same logic as in Fretboard for progressions)
    const inversionAmount =
      voicing === '1st' ? 1 :
      voicing === '2nd' ? 2 :
      voicing === '3rd' ? 3 : 0;

    if (inversionAmount === 0) return degrees;

    // Rotate array left by inversionAmount
    return [...degrees.slice(inversionAmount), ...degrees.slice(0, inversionAmount)];
  }, [viewMode, activeTriad, activeTetrad, voicing]);

  useEffect(() => {
    if (!canShowTriads && viewMode !== 'scale') {
      setViewMode('scale');
    }
    if (chordRootDegree > scale.intervals.length) {
      setChordRootDegree(1);
    }
  }, [canShowTriads, scale.intervals.length, chordRootDegree, viewMode]);

  // Reset progression when scale changes and doesn't support progressions
  useEffect(() => {
    if (!canShowProgressions && selectedProgression !== 'scale') {
      setSelectedProgression('scale');
    }
  }, [canShowProgressions, selectedProgression]);

  // When a progression is selected, default to triads view
  useEffect(() => {
    if (isProgressionActive && viewMode === 'scale') {
      setViewMode('triads');
    }
  }, [isProgressionActive, viewMode]);

  const degreeDisabled = !canShowTriads || viewMode === 'scale' || isProgressionActive;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Scale Selector</h1>
      </header>

      <section className="panel">
        {/* Row 1: SCALE, ROOT, STRINGS, FRETS */}
        <label className="control">
          <span className="control__label">SCALE</span>
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value as keyof typeof SCALES)}
          >
            {scaleOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {shortenScaleName(s.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">ROOT</span>
          <select value={rootName} onChange={(e) => setRootName(e.target.value)}>
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">STRINGS</span>
          <select value={strings} onChange={(e) => setStrings(Number(e.target.value))}>
            {[6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">FRETS</span>
          <select value={maxFrets} onChange={(e) => setMaxFrets(Number(e.target.value))}>
            {[12, 24].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {/* Row 2: CHORDS, DEGREE, LABEL, COLOR */}
        <label className="control">
          <span className="control__label">CHORDS</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            disabled={!canShowTriads}
          >
            <option value="scale">Scale tones</option>
            <option value="triads">Triads</option>
            <option value="tetrads">Tetrads</option>
          </select>
        </label>

        <label className="control">
          <span className="control__label">DEGREE</span>
          <select
            value={chordRootDegree}
            onChange={(e) => setChordRootDegree(Number(e.target.value))}
            disabled={degreeDisabled}
            style={{ minWidth: '4rem' }}
          >
            {triads.map((triad) => (
              <option key={triad.rootDegree} value={triad.rootDegree}>
                {triad.rootDegree}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">LABEL</span>
          <select
            value={labelMode}
            onChange={(e) => setLabelMode(e.target.value as 'degree' | 'letters')}
          >
            <option value="degree">Degree</option>
            <option value="letters">Letters</option>
          </select>
        </label>

        <label className="control">
          <span className="control__label">COLOR</span>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as 'mono' | 'color')}
          >
            <option value="mono">Mono</option>
            <option value="color">Color</option>
          </select>
        </label>

        {/* Row 3: PROGRESSION, ROOT STRING */}
        <label className="control">
          <span className="control__label">PROG</span>
          <select
            value={selectedProgression}
            onChange={(e) => setSelectedProgression(e.target.value)}
            disabled={!canShowProgressions}
          >
            <option value="scale">Scale</option>
            {availableProgressions.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">ROOT STR</span>
          <select
            value={rootString}
            onChange={(e) => setRootString(Number(e.target.value) as RootString)}
            disabled={!isProgressionActive}
          >
            <option value={4}>4th string</option>
            <option value={5}>5th string</option>
            <option value={6}>6th string</option>
          </select>
        </label>

        <label className="control">
          <span className="control__label">VOICING</span>
          <select
            value={voicing}
            onChange={(e) => setVoicing(e.target.value as Voicing)}
            disabled={viewMode === 'scale'}
          >
            <option value="root">Root</option>
            <option value="1st">1st Inv</option>
            <option value="2nd">2nd Inv</option>
            {viewMode === 'tetrads' && <option value="3rd">3rd Inv</option>}
          </select>
        </label>

        <label className="control">
          <span className="control__label">DROP</span>
          <select
            value={dropTuning ? 'on' : 'off'}
            onChange={(e) => setDropTuning(e.target.value === 'on')}
          >
            <option value="off">Off</option>
            <option value="on">Drop {strings}</option>
          </select>
        </label>
      </section>

      <section className="stage">
        <div className="stage__frame">
          <Fretboard
            openPcs={openPcs}
            maxFrets={maxFrets}
            rootPc={rootPc}
            intervals={scale.intervals}
            scaleId={scaleId}
            labelMode={labelMode}
            colorMode={colorMode}
            preferSharps={true}
            viewMode={canShowTriads ? viewMode : 'scale'}
            triadDegrees={canShowTriads && activeChordDegrees ? activeChordDegrees : null}
            progressionNumerals={
              isProgressionActive && activeProgression
                ? activeProgression.numerals
                : isSingleChordVoicingMode
                ? [chordRootDegree] // Synthetic single-chord "progression"
                : null
            }
            usePositionMode={isProgressionActive}
            rootString={rootString}
            voicing={voicing}
          />
        </div>
      </section>
    </div>
  );
}
