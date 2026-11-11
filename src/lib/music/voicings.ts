import { normalizePc } from './notes';
import type { Marker } from './theory';

export type FretWindow = { minFret: number; maxFret: number };

/**
 * Playable chord shapes on the fretboard: one note per string on adjacent strings, every chord
 * tone present, all within maxSpan frets, with bassDegree as the lowest-pitched note.
 * Returns at most one shape per bass-note marker (the one with the smallest fret span).
 */
export function findChordShapes(
  markers: Marker[],
  chordDegrees: number[],
  bassDegree: number,
  maxSpan = 4
): Marker[][] {
  const chordMarkersByString = new Map<number, Marker[]>();
  for (const m of markers) {
    if (!chordDegrees.includes(m.degree)) continue;
    const list = chordMarkersByString.get(m.stringIndex);
    if (list) list.push(m);
    else chordMarkersByString.set(m.stringIndex, [m]);
  }

  const shapes: Marker[][] = [];
  for (const bass of markers) {
    if (bass.degree !== bassDegree) continue;
    const shape = extendShape(chordMarkersByString, chordDegrees, [bass], bass.fret, bass.fret, maxSpan);
    if (shape) shapes.push(shape);
  }
  return shapes;
}

/** Depth-first search over the next higher string; keeps the complete shape with the smallest span. */
function extendShape(
  chordMarkersByString: Map<number, Marker[]>,
  chordDegrees: number[],
  shape: Marker[],
  minFret: number,
  maxFret: number,
  maxSpan: number
): Marker[] | null {
  if (shape.length === chordDegrees.length) {
    return chordDegrees.every((d) => shape.some((m) => m.degree === d)) ? shape : null;
  }

  const bass = shape[0];
  let best: Marker[] | null = null;
  for (const m of chordMarkersByString.get(bass.stringIndex + shape.length) ?? []) {
    if (m.midi <= bass.midi) continue;
    const lo = Math.min(minFret, m.fret);
    const hi = Math.max(maxFret, m.fret);
    if (hi - lo > maxSpan) continue;
    const candidate = extendShape(chordMarkersByString, chordDegrees, [...shape, m], lo, hi, maxSpan);
    if (candidate && (!best || fretSpan(candidate) < fretSpan(best))) best = candidate;
  }
  return best;
}

function fretSpan(shape: Marker[]): number {
  const frets = shape.map((m) => m.fret);
  return Math.max(...frets) - Math.min(...frets);
}

/**
 * Position window around the scale root on the given string: from two frets below the root to
 * three above (clamped at the nut). Prefers the first root between frets 1 and 12 whose window
 * fits on a neck of maxFrets frets; when no root fits, the window slides down to end at the last fret.
 */
export function getPositionWindow(
  markers: Marker[],
  stringIndex: number,
  maxFrets = Infinity
): FretWindow | null {
  const roots = markers.filter((m) => m.stringIndex === stringIndex && m.degree === 1);
  const fits = (m: Marker) => m.fret + 3 <= maxFrets;
  const root = roots.find((m) => m.fret >= 1 && m.fret <= 12 && fits(m)) ?? roots.find(fits) ?? roots[0];
  if (!root) return null;
  const maxFret = Math.min(maxFrets, Math.max(0, root.fret - 2) + 5);
  return { minFret: Math.max(0, maxFret - 5), maxFret };
}

/** The lowest-pitched marker with the given degree; on a unison, the lower string wins. */
export function findLowestMarker(markers: Marker[], degree: number): Marker | null {
  let lowest: Marker | null = null;
  for (const m of markers) {
    if (m.degree !== degree) continue;
    if (!lowest || m.midi < lowest.midi || (m.midi === lowest.midi && m.stringIndex < lowest.stringIndex)) {
      lowest = m;
    }
  }
  return lowest;
}

/**
 * One close voicing as MIDI notes: the first chord tone at or above lowestMidi, then each
 * following tone (in the given order, bass first) stacked just above the previous one.
 */
export function getChordVoicingMidi(
  rootPc: number,
  scaleIntervals: number[],
  chordDegrees: number[],
  lowestMidi: number
): number[] {
  const notes: number[] = [];
  let next = lowestMidi;
  for (const degree of chordDegrees) {
    const pc = normalizePc(rootPc + scaleIntervals[degree - 1]);
    while (normalizePc(next) !== pc) next++;
    notes.push(next);
    next++;
  }
  return notes;
}
