import { midiToFrequency } from '../music/notes';

// Browser-only (Web Audio).

let context: AudioContext | null = null;
let noteOutput: DynamicsCompressorNode | null = null;

/**
 * The app's shared AudioContext (notes and metronome), created on first use.
 * Browsers only start audio after a user gesture, so call this from a click handler.
 */
export function getAudioContext(): AudioContext {
  if (!context) context = new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

// The tone's sine partials: frequency ratio, level, and decay time (upper partials fade first)
const PARTIALS = [
  { ratio: 1, level: 1, decay: 1.8 },
  { ratio: 2, level: 0.45, decay: 1.1 },
  { ratio: 3, level: 0.2, decay: 0.7 },
  { ratio: 4, level: 0.1, decay: 0.45 },
];

/** Plays a MIDI note as a simple tone: four sine partials with a quick attack and a fade-out. */
export function playNote(midi: number): void {
  const ctx = getAudioContext();
  if (!noteOutput) {
    // Overlapping notes go through a compressor so they don't clip
    noteOutput = ctx.createDynamicsCompressor();
    noteOutput.threshold.value = -12;
    noteOutput.ratio.value = 6;
    noteOutput.connect(ctx.destination);
  }

  const frequency = midiToFrequency(midi);
  const now = ctx.currentTime;
  for (const { ratio, level, decay } of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.frequency.value = frequency * ratio;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25 * level, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(noteOutput);
    osc.start(now);
    osc.stop(now + decay);
  }
}
