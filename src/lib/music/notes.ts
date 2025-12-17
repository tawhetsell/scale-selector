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

/**
 * Get the chord suffix for display based on chord quality.
 */
export function getChordSuffix(quality: string): string {
  switch (quality) {
    case 'maj': return '';
    case 'min': return 'm';
    case 'dim': return '°';
    case 'aug': return '+';
    case 'maj7': return 'maj7';
    case 'min7': return 'm7';
    case 'dom7': return '7';
    case 'dim7': return '°7';
    case 'minMaj7': return 'mM7';
    case 'aug7': return '+7';
    case 'half-dim': return 'ø7';
    default: return '';
  }
}

/**
 * Get a displayable chord name from root pitch class and quality.
 * Example: (0, 'min') => 'Cm', (4, 'maj') => 'E'
 */
export function getChordName(rootPc: number, quality: string, preferSharps = true): string {
  const rootName = pcToName(rootPc, preferSharps);
  const suffix = getChordSuffix(quality);
  return `${rootName}${suffix}`;
}
