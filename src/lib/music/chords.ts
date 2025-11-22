import type { ScaleDef } from './scales';

export type TriadDef = {
  rootDegree: number;   // 1..n
  degrees: number[];    // e.g. [1,3,5]
};

export function getScaleTriads(scale: ScaleDef): TriadDef[] {
  const n = scale.intervals.length;
  const triads: TriadDef[] = [];

  for (let i = 0; i < n; i++) {
    const rootDegree = i + 1;
    const thirdDegree = ((i + 2) % n) + 1; // two scale steps up
    const fifthDegree = ((i + 4) % n) + 1; // four scale steps up

    triads.push({
      rootDegree,
      degrees: [rootDegree, thirdDegree, fifthDegree],
    });
  }

  return triads;
}
