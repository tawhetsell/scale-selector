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

// stringIndex 0 is the lowest-pitched string; midi is the note's actual pitch.
export type Marker = { stringIndex: number; fret: number; pc: number; degree: number; midi: number };

// openMidi: open-string MIDI note numbers, lowest string first (see getTuningPreset)
export function computeFretMap(
  openMidi: number[],
  maxFrets: number,
  rootPc: number,
  intervals: number[]
): Marker[] {
  const scale = scaleSet(rootPc, intervals);
  const out: Marker[] = [];
  openMidi.forEach((openNote, sIdx) => {
    for (let f = 0; f <= maxFrets; f++) {
      const pc = normalizePc(openNote + f);
      if (scale.has(pc)) {
        out.push({
          stringIndex: sIdx,
          fret: f,
          pc,
          degree: pcToDegree(pc, rootPc, intervals),
          midi: openNote + f,
        });
      }
    }
  });
  return out;
}
