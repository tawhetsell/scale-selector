import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import PianoKeyboard from './components/PianoKeyboard/PianoKeyboard';
import { nameToPc } from './lib/music/notes';
import { SCALES } from './lib/music/scales';
import { getScaleTriads, getScaleTetrads } from './lib/music/chords';
import { getTuningPreset } from './lib/music/tunings';
import { getScaleProgressions, supportsProgressions } from './lib/music/progressions';

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
type VisualMode = 'guitar' | 'piano';

// Static scale options - computed once at module load (hide Ionian since Major is equivalent)
const SCALE_OPTIONS = Object.values(SCALES).filter((s) => s.id !== 'ionian');

export default function App() {
  const [strings, setStrings] = useState(6);
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>('major');
  const [rootName, setRootName] = useState('E');
  const [maxFrets, setMaxFrets] = useState(12);
  const [labelMode, setLabelMode] = useState<'degree' | 'letters'>('letters');
  const [colorMode, setColorMode] = useState<'mono' | 'color'>('color');
  const [viewMode, setViewMode] = useState<ViewMode>('scale');
  const [chordRootDegree, setChordRootDegree] = useState(1);
  const [selectedProgression, setSelectedProgression] = useState<string>('scale');
  const [rootString, setRootString] = useState<RootString>(4);
  const [voicing, setVoicing] = useState<Voicing>('root');
  const [dropTuning, setDropTuning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [visualMode, setVisualMode] = useState<VisualMode>('guitar');

  const openPcs = useMemo(() => getTuningPreset(strings, dropTuning), [strings, dropTuning]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);

  const scale = SCALES[scaleId];

  const canShowTriads = scale.intervals.length === 7;
  const canShowProgressions = supportsProgressions(scaleId);

  const { availableProgressions, chordQualities } = useMemo(() => {
    const data = getScaleProgressions(scaleId);
    return {
      availableProgressions: data?.progressions ?? [],
      chordQualities: data?.chordQualities ?? [],
    };
  }, [scaleId]);

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

  // Get base chord degrees (without voicing rotation - filtering handles inversion)
  const activeChordDegrees = useMemo(() => {
    if (viewMode === 'triads' && activeTriad) {
      return activeTriad.degrees;
    } else if (viewMode === 'tetrads' && activeTetrad) {
      return activeTetrad.degrees;
    }
    return null;
  }, [viewMode, activeTriad, activeTetrad]);

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

  // Reset step when progression changes
  useEffect(() => {
    setCurrentStep(null);
  }, [selectedProgression]);

  // When a progression is selected, default to triads view and color mode
  useEffect(() => {
    if (isProgressionActive) {
      if (viewMode === 'scale') {
        setViewMode('triads');
      }
      if (colorMode === 'mono') {
        setColorMode('color');
      }
    }
  }, [isProgressionActive, viewMode, colorMode]);

  const degreeDisabled = !canShowTriads || viewMode === 'scale' || isProgressionActive;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Scale Selector</h1>
      </header>

      <section className="panel">
        {/* Row 1: SCALE, ROOT, STRINGS */}
        <label className="control">
          <span className="control__label">SCALES</span>
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value as keyof typeof SCALES)}
          >
            {SCALE_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {shortenScaleName(s.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">KEY</span>
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

        {/* Row 2: CHORDS, DEGREE */}
        <label className="control">
          <span className="control__label">CHORDS</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            disabled={!canShowTriads}
          >
            <option value="scale">Scale</option>
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

        {/* Row 3: PROGRESSION, ROOT STRING */}
        <label className="control">
          <span className="control__label">PROGS</span>
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
          <span className="control__label">ROOTSTR</span>
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
          <span className="control__label">VOICE</span>
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
      </section>

      <section className="stage">
        <div className="stage__frame">
          <div className="stage__visualization">
            {visualMode === 'guitar' ? (
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
                chordQualities={chordQualities}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                progressionName={isProgressionActive ? selectedProgression : null}
              />
            ) : (
              <PianoKeyboard
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
                    ? [chordRootDegree]
                    : null
                }
                chordQualities={chordQualities}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                voicing={voicing}
              />
            )}
          </div>
          <div className="stage__footer">
            <div
              className="visual-toggle"
              role="radiogroup"
              aria-label="Visualization mode"
            >
              <button
                className={`visual-toggle__btn ${visualMode === 'guitar' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setVisualMode('guitar')}
                aria-checked={visualMode === 'guitar'}
                aria-label="Guitar fretboard view"
                role="radio"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <line x1="4" y1="7" x2="20" y2="7"/>
                  <line x1="8" y1="2" x2="8" y2="22"/>
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <line x1="16" y1="2" x2="16" y2="22"/>
                  <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none"/>
                </svg>
              </button>
              <button
                className={`visual-toggle__btn ${visualMode === 'piano' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setVisualMode('piano')}
                aria-checked={visualMode === 'piano'}
                aria-label="Piano keyboard view"
                role="radio"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="1"/>
                  <line x1="6" y1="4" x2="6" y2="20"/>
                  <line x1="10" y1="4" x2="10" y2="20"/>
                  <line x1="14" y1="4" x2="14" y2="20"/>
                  <line x1="18" y1="4" x2="18" y2="20"/>
                  <rect x="4" y="4" width="3" height="9" fill="currentColor" stroke="none"/>
                  <rect x="11" y="4" width="3" height="9" fill="currentColor" stroke="none"/>
                </svg>
              </button>
            </div>

            <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="Color mode">
              <button
                className={`visual-toggle__btn ${colorMode === 'color' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setColorMode('color')}
                aria-checked={colorMode === 'color'}
                aria-label="Color"
                role="radio"
              >
                Color
              </button>
              <button
                className={`visual-toggle__btn ${colorMode === 'mono' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setColorMode('mono')}
                aria-checked={colorMode === 'mono'}
                aria-label="Monochrome"
                role="radio"
                disabled={isProgressionActive}
              >
                Mono
              </button>
            </div>

            <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="Label mode">
              <button
                className={`visual-toggle__btn ${labelMode === 'letters' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setLabelMode('letters')}
                aria-checked={labelMode === 'letters'}
                aria-label="Label as letters"
                role="radio"
              >
                ABC
              </button>
              <button
                className={`visual-toggle__btn ${labelMode === 'degree' ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setLabelMode('degree')}
                aria-checked={labelMode === 'degree'}
                aria-label="Label as numbers"
                role="radio"
              >
                123
              </button>
            </div>

            <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="Fretboard size">
              <button
                className={`visual-toggle__btn ${maxFrets === 12 ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setMaxFrets(12)}
                aria-checked={maxFrets === 12}
                aria-label="Half size (12 frets)"
                role="radio"
              >
                Half
              </button>
              <button
                className={`visual-toggle__btn ${maxFrets === 24 ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setMaxFrets(24)}
                aria-checked={maxFrets === 24}
                aria-label="Full size (24 frets)"
                role="radio"
              >
                Full
              </button>
            </div>

            <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="Tuning">
              <button
                className={`visual-toggle__btn ${!dropTuning ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setDropTuning(false)}
                aria-checked={!dropTuning}
                aria-label="Standard tuning"
                role="radio"
              >
                Tune
              </button>
              <button
                className={`visual-toggle__btn ${dropTuning ? 'visual-toggle__btn--active' : ''}`}
                onClick={() => setDropTuning(true)}
                aria-checked={dropTuning}
                aria-label={`Drop tuning (drop lowest string)`}
                role="radio"
              >
                Drop
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
