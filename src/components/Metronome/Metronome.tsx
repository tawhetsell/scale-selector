import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioContext } from '../../lib/audio/synth';
import './Metronome.css';

const MIN_BPM = 40;
const MAX_BPM = 240;
const DEFAULT_BPM = 120;

const clampBpm = (value: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, value));

export default function Metronome() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  // What's typed in the BPM field; it may be incomplete ("9" on the way to "90")
  const [bpmText, setBpmText] = useState(String(DEFAULT_BPM));
  // The scheduler reads the tempo from here, so tempo changes don't restart it
  const bpmRef = useRef(DEFAULT_BPM);
  const nextNoteTimeRef = useRef(0);

  const playClick = useCallback((time: number) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1000;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      playClick(nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60 / bpmRef.current;
    }
  }, [playClick]);

  useEffect(() => {
    if (!playing) return;
    nextNoteTimeRef.current = getAudioContext().currentTime;
    const timerId = window.setInterval(scheduler, 25);
    return () => clearInterval(timerId);
  }, [playing, scheduler]);

  const applyBpm = (value: number) => {
    const next = clampBpm(value);
    bpmRef.current = next;
    setBpm(next);
    setBpmText(String(next));
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setBpmText(text);
    const val = parseInt(text, 10);
    // Apply in-range values right away; anything else waits for blur or Enter
    if (!isNaN(val) && val >= MIN_BPM && val <= MAX_BPM) {
      bpmRef.current = val;
      setBpm(val);
    }
  };

  const commitBpmText = () => {
    const val = parseInt(bpmText, 10);
    if (isNaN(val)) {
      setBpmText(String(bpm));
    } else {
      applyBpm(val);
    }
  };

  const nudgeBpm = (delta: number) => {
    applyBpm(bpm + delta);
  };

  const togglePlay = () => {
    if (!playing) {
      // Create/resume audio inside the click handler; some browsers only allow it there
      getAudioContext();
    }
    setPlaying(!playing);
  };

  return (
    <div className="metronome">
      <button
        className={`metronome__play ${playing ? 'metronome__play--active' : ''}`}
        onClick={togglePlay}
        aria-label={playing ? 'Stop metronome' : 'Start metronome'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
      </button>

      <div className="metronome__divider" />

      <input
        type="number"
        className="metronome__bpm-input"
        value={bpmText}
        onChange={handleBpmChange}
        onBlur={commitBpmText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitBpmText();
        }}
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        aria-label="BPM"
      />

      <div className="metronome__arrows">
        <button
          className="metronome__arrow"
          onClick={() => nudgeBpm(1)}
          aria-label="Increase BPM"
        >
          <svg viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
            <polygon points="5,0 10,6 0,6" />
          </svg>
        </button>
        <button
          className="metronome__arrow"
          onClick={() => nudgeBpm(-1)}
          aria-label="Decrease BPM"
        >
          <svg viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
            <polygon points="0,0 10,0 5,6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
