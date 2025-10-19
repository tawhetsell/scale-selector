import { useMemo, useState } from 'react';
import './App.css';
import Fretboard from './components/Fretboard/Fretboard';
import { nameToPc } from './lib/music/notes';
import { SCALES } from './lib/music/scales';
import { getTuningPreset } from './lib/music/tunings';

export default function App() {
  const [strings, setStrings] = useState(6);
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>('major');
  const [rootName, setRootName] = useState('C');
  const [maxFrets, setMaxFrets] = useState(24);
  const [showDegrees, setShowDegrees] = useState(true);

  const openPcs = useMemo(() => getTuningPreset(strings), [strings]);
  const rootPc = useMemo(() => nameToPc(rootName), [rootName]);
  const scale = SCALES[scaleId];

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h1>Guitar Fretboard Visualizer</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label>Strings:&nbsp;
          <select value={strings} onChange={e => setStrings(Number(e.target.value))}>
            {[6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label>Scale:&nbsp;
          <select
            value={scaleId}
            onChange={e => setScaleId(e.target.value as keyof typeof SCALES)}
          >
            {Object.values(SCALES)
              .filter(s => s.id !== 'ionian') // hide Ionian since Major is equivalent
              .map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>

        <label>Root:&nbsp;
          <select value={rootName} onChange={e => setRootName(e.target.value)}>
            {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label>Frets:&nbsp;
          <select value={maxFrets} onChange={e => setMaxFrets(Number(e.target.value))}>
            {[12,22,24].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label>
          <input type="checkbox" checked={showDegrees} onChange={e => setShowDegrees(e.target.checked)} />
          &nbsp;Show degrees (uncheck for note names)
        </label>
      </div>

      <Fretboard
        openPcs={openPcs}
        maxFrets={maxFrets}
        rootPc={rootPc}
        intervals={scale.intervals}
        showDegrees={showDegrees}
        preferSharps={true}
      />
    </div>
  );
}
