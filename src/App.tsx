import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import PianoKeyboard from './components/PianoKeyboard/PianoKeyboard';
import ProgressionLegend, { type LegendChord } from './components/ProgressionLegend/ProgressionLegend';
import { KEY_NAMES, nameToPc, spellScaleDegrees } from './lib/music/notes';
import { SCALES, getGroupedScales } from './lib/music/scales';
import { describeChords, getScaleTriads, type ChordSize, type Inversion } from './lib/music/chords';
import { getDegreeColor } from './lib/music/colors';
import { getTuningPreset } from './lib/music/tunings';
import { getScaleProgressions } from './lib/music/progressions';
import Metronome from './components/Metronome/Metronome';

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

const VOICING_INVERSIONS: Record<Voicing, Inversion> = { root: 0, '1st': 1, '2nd': 2, '3rd': 3 };

// Static scale groups - computed once at module load (hides Ionian since Major is equivalent)
const SCALE_GROUPS = getGroupedScales();

// 6-string guitar SVG dimensions: height=204, width=924 (12 frets compact)
const GUITAR_6_ASPECT = 204 / 924;

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
  const [fadeInactiveKeys, setFadeInactiveKeys] = useState(false);

  // Ref for measuring instrument container width
  const stageRef = useRef<HTMLDivElement>(null);

  // Compute instrument height to match 6-string guitar proportions
  const updateInstrumentHeight = useCallback(() => {
    if (stageRef.current) {
      const width = stageRef.current.clientWidth;
      const targetHeight = Math.round(width * GUITAR_6_ASPECT);
      stageRef.current.style.setProperty('--instrument-height', `${targetHeight}px`);
    }
  }, []);

  // Update on mount and resize
  useEffect(() => {
    updateInstrumentHeight();
    window.addEventListener('resize', updateInstrumentHeight);
    return () => window.removeEventListener('resize', updateInstrumentHeight);
  }, [updateInstrumentHeight]);

  const openStrings = useMemo(() => getTuningPreset(strings, dropTuning), [strings, dropTuning]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);

  const scale = SCALES[scaleId];

  // Note names spelled for the key (F major gets Bb, not A#)
  const degreeNames = useMemo(
    () => spellScaleDegrees(rootName, scale.intervals, scale.degreeLabels),
    [rootName, scale]
  );

  const canShowTriads = scale.intervals.length === 7;

  const availableProgressions = useMemo(() => getScaleProgressions(scaleId), [scaleId]);
  const canShowProgressions = availableProgressions.length > 0;

  const activeProgression = useMemo(
    () => availableProgressions.find((p) => p.name === selectedProgression) ?? null,
    [availableProgressions, selectedProgression]
  );

  const isProgressionActive = activeProgression !== null;

  const chordSize: ChordSize | null = !canShowTriads
    ? null
    : viewMode === 'triads'
    ? 3
    : viewMode === 'tetrads'
    ? 4
    : null;
  const inversion = VOICING_INVERSIONS[voicing];
  const progressionNumerals = chordSize !== null && activeProgression ? activeProgression.numerals : null;

  const triads = useMemo(
    () => (canShowTriads ? getScaleTriads(scale) : []),
    [canShowTriads, scale]
  );

  const legendChords = useMemo((): LegendChord[] | null => {
    if (chordSize === null || !progressionNumerals || progressionNumerals.length < 2) return null;
    return describeChords(scale, progressionNumerals, chordSize, degreeNames).map((chord) => ({
      numeral: chord.numeral,
      name: chord.name,
      color: getDegreeColor(scaleId, chord.rootDegree - 1) ?? '#ffffff',
    }));
  }, [chordSize, progressionNumerals, scale, degreeNames, scaleId]);

  useEffect(() => {
    if (!canShowTriads && viewMode !== 'scale') {
      setViewMode('scale');
    }
    if (chordRootDegree > scale.intervals.length) {
      setChordRootDegree(1);
    }
  }, [canShowTriads, scale.intervals.length, chordRootDegree, viewMode]);

  // Reset the progression when the new scale doesn't have it
  useEffect(() => {
    if (selectedProgression !== 'scale' && !activeProgression) {
      setSelectedProgression('scale');
    }
  }, [selectedProgression, activeProgression]);

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
          <span className="control__label">Scale</span>
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value as keyof typeof SCALES)}
          >
            {SCALE_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.scales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {shortenScaleName(s.name)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Key</span>
          <select value={rootName} onChange={(e) => setRootName(e.target.value)}>
            {KEY_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>


        {/* Row 2: CHORDS, DEGREE */}
        <label className="control">
          <span className="control__label">Chord</span>
          <select
            value={viewMode}
            onChange={(e) => {
              const next = e.target.value as ViewMode;
              setViewMode(next);
              if (next === 'scale') {
                setSelectedProgression('scale');
                setCurrentStep(null);
              }
              if (next !== 'tetrads' && voicing === '3rd') {
                setVoicing('root'); // triads have no 3rd inversion
              }
            }}
            disabled={!canShowTriads}
          >
            <option value="scale">None</option>
            <option value="triads">Triads</option>
            <option value="tetrads">Tetrads</option>
          </select>
        </label>

        {viewMode !== 'scale' && (
          <>
            <label className="control">
              <span className="control__label">Degree</span>
              <select
                value={chordRootDegree}
                onChange={(e) => setChordRootDegree(Number(e.target.value))}
                disabled={degreeDisabled}
              >
                {triads.map((triad) => (
                  <option key={triad.rootDegree} value={triad.rootDegree}>
                    {triad.rootDegree}
                  </option>
                ))}
              </select>
            </label>

            <label className="control">
              <span className="control__label">Progs</span>
              <select
                value={selectedProgression}
                onChange={(e) => setSelectedProgression(e.target.value)}
                disabled={!canShowProgressions}
              >
                <option value="scale">None</option>
                {availableProgressions.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="control">
              <span className="control__label">Root Str</span>
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
              <span className="control__label">Voice</span>
              <select
                value={voicing}
                onChange={(e) => setVoicing(e.target.value as Voicing)}
              >
                <option value="root">Root</option>
                <option value="1st">1st Inv</option>
                <option value="2nd">2nd Inv</option>
                {viewMode === 'tetrads' && <option value="3rd">3rd Inv</option>}
              </select>
            </label>
          </>
        )}

      </section>

      <section className="stage">
        <div className="stage__frame">
          <div className="stage__visualization" ref={stageRef}>
            {visualMode === 'guitar' ? (
              <Fretboard
                openStrings={openStrings}
                maxFrets={maxFrets}
                rootPc={rootPc}
                intervals={scale.intervals}
                scaleId={scaleId}
                degreeNames={degreeNames}
                labelMode={labelMode}
                colorMode={colorMode}
                chordSize={chordSize}
                chordRootDegree={chordRootDegree}
                progressionNumerals={progressionNumerals}
                inversion={inversion}
                rootString={rootString}
                currentStep={currentStep}
              />
            ) : (
              <PianoKeyboard
                rootPc={rootPc}
                intervals={scale.intervals}
                scaleId={scaleId}
                degreeNames={degreeNames}
                labelMode={labelMode}
                colorMode={colorMode}
                chordSize={chordSize}
                chordRootDegree={chordRootDegree}
                progressionNumerals={progressionNumerals}
                inversion={inversion}
                currentStep={currentStep}
                fadeInactiveKeys={fadeInactiveKeys}
              />
            )}
            {legendChords && (
              <ProgressionLegend
                chords={legendChords}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            )}
          </div>
        </div>
      </section>

      <section className="panel panel--footer">
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

            {visualMode === 'guitar' && (
              <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="String count">
                {[6, 7, 8].map((n) => (
                  <button
                    key={n}
                    className={`visual-toggle__btn ${strings === n ? 'visual-toggle__btn--active' : ''}`}
                    onClick={() => setStrings(n)}
                    style={{ minWidth: 0 }}
                    aria-checked={strings === n}
                    aria-label={`${n} strings`}
                    role="radio"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

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

            {visualMode === 'piano' && (
              <div className="visual-toggle visual-toggle--text" role="radiogroup" aria-label="Fade inactive keys">
                <button
                  className={`visual-toggle__btn ${!fadeInactiveKeys ? 'visual-toggle__btn--active' : ''}`}
                  onClick={() => setFadeInactiveKeys(false)}
                  aria-checked={!fadeInactiveKeys}
                  aria-label="Show all keys"
                  role="radio"
                >
                  All
                </button>
                <button
                  className={`visual-toggle__btn ${fadeInactiveKeys ? 'visual-toggle__btn--active' : ''}`}
                  onClick={() => setFadeInactiveKeys(true)}
                  aria-checked={fadeInactiveKeys}
                  aria-label="Fade non-scale keys"
                  role="radio"
                >
                  Focus
                </button>
              </div>
            )}

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

            {visualMode === 'guitar' && (
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
            )}

            {visualMode === 'guitar' && (
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
            )}

            <Metronome />
      </section>
    </div>
  );
}
