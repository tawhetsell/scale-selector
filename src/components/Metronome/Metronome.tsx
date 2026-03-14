import { useCallback, useEffect, useRef, useState } from 'react';
import './Metronome.css';

const MIN_BPM = 40;
const MAX_BPM = 240;
const DEFAULT_BPM = 120;

export default function Metronome() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

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
  }, [getAudioContext]);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      playClick(nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60 / bpm;
    }
  }, [bpm, getAudioContext, playClick]);

  const start = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    nextNoteTimeRef.current = ctx.currentTime;
    setPlaying(true);
  }, [getAudioContext]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playing) {
      const ctx = getAudioContext();
      nextNoteTimeRef.current = ctx.currentTime;
      timerIdRef.current = window.setInterval(scheduler, 25);
      return () => {
        if (timerIdRef.current !== null) {
          clearInterval(timerIdRef.current);
          timerIdRef.current = null;
        }
      };
    }
  }, [playing, bpm, scheduler, getAudioContext]);

  useEffect(() => {
    return () => {
      if (timerIdRef.current !== null) clearInterval(timerIdRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, val)));
    }
  };

  const nudgeBpm = (delta: number) => {
    setBpm((prev) => Math.max(MIN_BPM, Math.min(MAX_BPM, prev + delta)));
  };

  const togglePlay = () => {
    if (playing) stop();
    else start();
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
        value={bpm}
        onChange={handleBpmChange}
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
