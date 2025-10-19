// Returns standard tuning pitch classes (lowest string first)
export function getTuningPreset(strings: number): number[] {
  switch (strings) {
    case 6:
      return [4, 9, 2, 7, 11, 4]; // E A D G B E
    case 7:
      return [11, 4, 9, 2, 7, 11, 4]; // B E A D G B E
    case 8:
      return [6, 11, 4, 9, 2, 7, 11, 4]; // F# B E A D G B E
    case 9:
      return [1, 6, 11, 4, 9, 2, 7, 11, 4]; // C# F# B E A D G B E (common)
    default:
      throw new Error("Supported strings: 6–9");
  }
}
