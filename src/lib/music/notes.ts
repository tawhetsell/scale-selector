export const PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function normalizePc(n: number): number {
  return ((n % 12) + 12) % 12;
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function pcToName(pc: number, preferSharps = true): string {
  const n = normalizePc(pc);
  return preferSharps ? SHARP_NAMES[n] : FLAT_NAMES[n];
}

export function nameToPc(name: string): number {
  const n = PC[name];
  if (n == null) throw new Error(`Unknown note name: ${name}`);
  return n;
}
