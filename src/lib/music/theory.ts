import { normalizePc } from "./notes";

export function scaleSet(rootPc: number, intervals: number | number[]): Set<number> {
  const arr = Array.isArray(intervals) ? intervals : [intervals];
  return new Set(arr.map((i) => normalizePc(rootPc + i)));
}

export function pcToDegree(pc: number, rootPc: number, intervals: number[]): number {
  const n = normalizePc(pc);
  const idx = intervals.findIndex((i) => normalizePc(rootPc + i) === n);
  return idx >= 0 ? idx + 1 : 0;
}

export type Marker = { stringIndex: number; fret: number; pc: number; degree: number };

export function computeFretMap(
  openPcs: number[],
  maxFrets: number,
  rootPc: number,
  intervals: number[]
): Marker[] {
  const scale = scaleSet(rootPc, intervals);
  const out: Marker[] = [];
  openPcs.forEach((openPc, sIdx) => {
    for (let f = 0; f <= maxFrets; f++) {
      const pc = normalizePc(openPc + f);
      if (scale.has(pc)) {
        out.push({
          stringIndex: sIdx,
          fret: f,
          pc,
          degree: pcToDegree(pc, rootPc, intervals),
        });
      }
    }
  });
  return out;
}
