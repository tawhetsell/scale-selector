import type { ScaleDef } from './scales';

export type TriadDef = {
  rootDegree: number;   // 1..n
  degrees: number[];    // e.g. [1,3,5]
};

export type TetradDef = {
  rootDegree: number;   // 1..n
  degrees: number[];    // e.g. [1,3,5,7]
};

/**
 * Diatonic triads for a scale:
 *  degree 1 -> [1,3,5]
 *  degree 2 -> [2,4,6]
 *  etc.
 */
export function getScaleTriads(scale: ScaleDef): TriadDef[] {
  const n = scale.intervals.length;
  const triads: TriadDef[] = [];

  for (let i = 0; i < n; i++) {
    const rootDegree = i + 1;
    const thirdDegree = ((i + 2) % n) + 1;
    const fifthDegree = ((i + 4) % n) + 1;

    triads.push({
      rootDegree,
      degrees: [rootDegree, thirdDegree, fifthDegree],
    });
  }

  return triads;
}

/**
 * Diatonic tetrads (7th chords) for a scale:
 *  degree 1 -> [1,3,5,7]
 *  degree 2 -> [2,4,6,1]
 *  etc.
 */
export function getScaleTetrads(scale: ScaleDef): TetradDef[] {
  const n = scale.intervals.length;
  const tetrads: TetradDef[] = [];

  for (let i = 0; i < n; i++) {
    const rootDegree = i + 1;
    const thirdDegree = ((i + 2) % n) + 1;
    const fifthDegree = ((i + 4) % n) + 1;
    const seventhDegree = ((i + 6) % n) + 1;

    tetrads.push({
      rootDegree,
      degrees: [rootDegree, thirdDegree, fifthDegree, seventhDegree],
    });
  }

  return tetrads;
}
