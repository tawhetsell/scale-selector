import { useMemo, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import { nameToPc } from './lib/music/notes';
import { SCALES } from './lib/music/scales';
import { getTuningPreset } from './lib/music/tunings';

export default function App() {
  const [strings, setStrings] = useState(6);
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>('major');
  const [rootName, setRootName] = useState('E');
  const [maxFrets, setMaxFrets] = useState(24);
  const [showDegrees, setShowDegrees] = useState(true);

  const openPcs = useMemo(() => getTuningPreset(strings), [strings]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);
  const scale = SCALES[scaleId];
  const scaleOptions = useMemo(
    () => Object.values(SCALES).filter(s => s.id !== 'ionian'), // hide Ionian since Major is equivalent
    []
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>Scale Selector</h1>
        <p className="app__subtitle">Dial in a tuning, key, and fret range to light up the neck.</p>
      </header>

      <section className="panel">
        <label className="control">
          <span className="control__label">Strings</span>
          <select value={strings} onChange={e => setStrings(Number(e.target.value))}>
            {[6, 7, 8, 9].map(n => (
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
            onChange={e => setScaleId(e.target.value as keyof typeof SCALES)}
          >
            {scaleOptions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Root</span>
          <select value={rootName} onChange={e => setRootName(e.target.value)}>
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control">
          <span className="control__label">Frets</span>
          <select value={maxFrets} onChange={e => setMaxFrets(Number(e.target.value))}>
            {[12, 24].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="control control--toggle">
          <span className="control__label">Show degrees</span>
          <input
            type="checkbox"
            checked={showDegrees}
            onChange={e => setShowDegrees(e.target.checked)}
          />
        </label>
      </section>

      <section className="stage">
        <div className="stage__frame">
          <Fretboard
            openPcs={openPcs}
            maxFrets={maxFrets}
            rootPc={rootPc}
            intervals={scale.intervals}
            showDegrees={showDegrees}
            preferSharps={true}
          />
        </div>
      </section>
    </div>
  );
}
