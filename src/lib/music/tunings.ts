// Returns standard tuning pitch classes (lowest string first)
// If dropTuning is true, the lowest string is tuned down a whole step
export function getTuningPreset(strings: number, dropTuning: boolean = false): number[] {
  let tuning: number[];
  switch (strings) {
    case 6:
      tuning = [4, 9, 2, 7, 11, 4]; // E A D G B E
      break;
    case 7:
      tuning = [11, 4, 9, 2, 7, 11, 4]; // B E A D G B E
      break;
    case 8:
      tuning = [6, 11, 4, 9, 2, 7, 11, 4]; // F# B E A D G B E
      break;
    case 9:
      tuning = [1, 6, 11, 4, 9, 2, 7, 11, 4]; // C# F# B E A D G B E (common)
      break;
    default:
      throw new Error("Supported strings: 6–9");
  }

  if (dropTuning) {
    // Drop the lowest string by a whole step (2 semitones)
    tuning[0] = (tuning[0] - 2 + 12) % 12;
  }

  return tuning;
}
