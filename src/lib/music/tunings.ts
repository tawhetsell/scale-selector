// Returns standard tuning as open-string MIDI note numbers (lowest string first).
// MIDI numbers carry the octave, so notes on different strings can be compared by pitch.
// If dropTuning is true, the lowest string is tuned down a whole step
export function getTuningPreset(strings: number, dropTuning: boolean = false): number[] {
  let tuning: number[];
  switch (strings) {
    case 6:
      tuning = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
      break;
    case 7:
      tuning = [35, 40, 45, 50, 55, 59, 64]; // B1 E2 A2 D3 G3 B3 E4
      break;
    case 8:
      tuning = [30, 35, 40, 45, 50, 55, 59, 64]; // F#1 B1 E2 A2 D3 G3 B3 E4
      break;
    case 9:
      tuning = [25, 30, 35, 40, 45, 50, 55, 59, 64]; // C#1 F#1 B1 E2 A2 D3 G3 B3 E4 (common)
      break;
    default:
      throw new Error("Supported strings: 6–9");
  }

  if (dropTuning) {
    // Drop the lowest string by a whole step (2 semitones)
    tuning[0] -= 2;
  }

  return tuning;
}
