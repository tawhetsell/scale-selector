import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import { nameToPc } from './lib/music/notes';
import { SCALES } from './lib/music/scales';
import { getScaleTriads, getScaleTetrads } from './lib/music/chords';
import { getTuningPreset } from './lib/music/tunings';

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

export default function App() {
  const [strings, setStrings] = useState(6);
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>('major');
  const [rootName, setRootName] = useState('E');
  const [maxFrets, setMaxFrets] = useState(12);
  const [labelMode, setLabelMode] = useState<'degree' | 'letters'>('degree');
  const [colorMode, setColorMode] = useState<'mono' | 'color'>('mono');
  const [viewMode, setViewMode] = useState<ViewMode>('scale');
  const [chordRootDegree, setChordRootDegree] = useState(1);

  const openPcs = useMemo(() => getTuningPreset(strings), [strings]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);

  const scale = SCALES[scaleId];

  const scaleOptions = useMemo(
    () => Object.values(SCALES).filter((s) => s.id !== 'ionian'), // hide Ionian since Major is equivalent
    []
  );

  const canShowTriads = scale.intervals.length === 7;

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

  const activeChordDegrees =
    viewMode === 'triads' && activeTriad
      ? activeTriad.degrees
      : viewMode === 'tetrads' && activeTetrad
      ? activeTetrad.degrees
      : null;

  useEffect(() => {
    if (!canShowTriads && viewMode !== 'scale') {
      setViewMode('scale');
    }
    if (chordRootDegree > scale.intervals.length) {
      setChordRootDegree(1);
    }
  }, [canShowTriads, scale.intervals.length, chordRootDegree, viewMode]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Scale Selector</h1>
      </header>

      <section className="panel">
        <label className="control">
          <span className="control__label">Strings</span>
          <select value={strings} onChange={(e) => setStrings(Number(e.target.value))}>
            {[6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Scale</span>
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
          <span className="control__label">Root</span>
          <select value={rootName} onChange={(e) => setRootName(e.target.value)}>
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Frets</span>
          <select value={maxFrets} onChange={(e) => setMaxFrets(Number(e.target.value))}>
            {[12, 24].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Labels</span>
          <select
            value={labelMode}
            onChange={(e) => setLabelMode(e.target.value as 'degree' | 'letters')}
          >
            <option value="degree">Degree</option>
            <option value="letters">Letters</option>
          </select>
        </label>

        <label className="control">
          <span className="control__label">Colors</span>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as 'mono' | 'color')}
          >
            <option value="mono">Mono</option>
            <option value="color">Color</option>
          </select>
        </label>

        <label className="control">
          <span className="control__label">View</span>
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

        {canShowTriads && (viewMode === 'triads' || viewMode === 'tetrads') && (
          <label className="control">
            <span className="control__label">Chord degree</span>
            <select
              value={chordRootDegree}
              onChange={(e) => setChordRootDegree(Number(e.target.value))}
            >
              {triads.map((triad) => (
                <option key={triad.rootDegree} value={triad.rootDegree}>
                  {triad.rootDegree}
                </option>
              ))}
            </select>
          </label>
        )}
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
          />
        </div>
      </section>
    </div>
  );
}
