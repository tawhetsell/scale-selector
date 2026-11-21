import { getChordDegrees, type ChordSize, type Inversion } from './chords';
import type { Marker } from './theory';
import { findChordShapes, findLowestMarker, getPositionWindow, type FretWindow } from './voicings';

/** The ring drawn around a fretboard note. */
export type FretRing =
  | 'plain' // the usual thin outline
  | 'accent' // medium ring: scale degree 1 in scale mode
  | 'bass' // thick ring: each chord's lowest bass note in the position (progression with no current chord)
  | 'shape' // thick ring: one of the other notes of the shape to play
  | 'anchor'; // thick ring and halo: the shape's bass note, or with no current chord, the key root on the String string

export type FretNote = { marker: Marker; ring: FretRing };

export type FretboardDisplayOptions = {
  markers: Marker[]; // the whole fret map (computeFretMap)
  scaleLength: number;
  strings: number;
  maxFrets: number;
  chordSize: ChordSize | null; // null = scale mode
  chordRootDegree: number; // the chord shown when no progression is active
  progressionNumerals: number[] | null;
  inversion: Inversion;
  rootString: number; // 4, 5 or 6: the String menu, which anchors the position
  currentStep: number | null; // the progression legend's current chord
};

export type FretboardDisplay = {
  notes: FretNote[]; // in drawing order
  chordsByDegree: Map<number, number[]> | null; // progression: the chords (by index) containing each degree
};

export const markerKey = (m: Marker) => `${m.stringIndex}:${m.fret}`;

const isInWindow = (window: FretWindow | null) => (m: Marker) =>
  !window || (m.fret >= window.minFret && m.fret <= window.maxFret);

/** Frets the marker sits outside the window (0 inside it). */
const fretsOutside = (window: FretWindow, m: Marker) =>
  Math.max(0, window.minFret - m.fret, m.fret - window.maxFret);

/** Sort key comparison: the first differing entry decides. */
function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function minBy<T>(items: T[], key: (item: T) => number[]): T | null {
  let best: T | null = null;
  let bestKey: number[] = [];
  for (const item of items) {
    const k = key(item);
    if (best === null || compareKeys(k, bestKey) < 0) {
      best = item;
      bestKey = k;
    }
  }
  return best;
}

/**
 * The chord's shape to play, bass note first (chordDegrees[0] is the bass degree):
 * - inside the position, the playable shape with the lowest-pitched bass (on a unison, the lower string);
 * - with none there, the nearest shape on the neck: fewest frets outside the position, then bass pitch,
 *   then string;
 * - with no playable shape at all, just the lowest bass note in the position, or else anywhere.
 * Returns null only when the chord's bass degree isn't on the neck.
 */
export function findChordShape(markers: Marker[], chordDegrees: number[], window: FretWindow | null): Marker[] | null {
  const bassDegree = chordDegrees[0];
  const tones = markers.filter((m) => chordDegrees.includes(m.degree));
  const windowTones = tones.filter(isInWindow(window));
  const byBass = (shape: Marker[]) => [shape[0].midi, shape[0].stringIndex];

  const inside = minBy(findChordShapes(windowTones, chordDegrees, bassDegree), byBass);
  if (inside) return inside;

  if (window) {
    const nearest = minBy(findChordShapes(tones, chordDegrees, bassDegree), (shape) => [
      shape.reduce((sum, m) => sum + fretsOutside(window, m), 0),
      ...byBass(shape),
    ]);
    if (nearest) return nearest;
  }

  const bass = findLowestMarker(windowTones, bassDegree) ?? findLowestMarker(tones, bassDegree);
  return bass ? [bass] : null;
}

/** Ring every note: the shape's bass gets the anchor ring, its other notes the shape ring, the rest plain. */
function ringShape(markers: Marker[], shape: Marker[] | null): FretNote[] {
  const bassKey = shape ? markerKey(shape[0]) : null;
  const shapeKeys = new Set((shape ?? []).map(markerKey));
  return markers.map((marker) => {
    const key = markerKey(marker);
    return { marker, ring: key === bassKey ? 'anchor' : shapeKeys.has(key) ? 'shape' : 'plain' };
  });
}

/**
 * Which notes the fretboard draws and which ring each gets.
 * - Scale mode: every scale note; degree 1 gets the medium ring.
 * - Single chord: every chord tone on the neck, with one shape (findChordShape) ringed.
 * - Progression: every chord's tones inside the position. The current chord's shape is ringed, and its
 *   notes are drawn even where they reach outside the position. With no current chord, each chord's
 *   lowest bass note gets a thick ring and the key root on the String string the halo.
 */
export function getFretboardDisplay(options: FretboardDisplayOptions): FretboardDisplay {
  const { markers, scaleLength, strings, maxFrets, chordSize, chordRootDegree, progressionNumerals, inversion, rootString, currentStep } =
    options;

  if (chordSize === null) {
    return {
      notes: markers.map((marker) => ({ marker, ring: marker.degree === 1 ? 'accent' : 'plain' })),
      chordsByDegree: null,
    };
  }

  // The position: frets around the key root on the String menu's string
  const rootStringIndex = strings - rootString; // guitar string number -> index (0 = lowest string)
  const window = getPositionWindow(markers, rootStringIndex, maxFrets);
  const inWindow = isInWindow(window);

  if (progressionNumerals === null) {
    const degrees = getChordDegrees(scaleLength, chordRootDegree, chordSize, inversion);
    const tones = markers.filter((m) => degrees.includes(m.degree));
    return { notes: ringShape(tones, findChordShape(tones, degrees, window)), chordsByDegree: null };
  }

  const chords = progressionNumerals.map((root) => getChordDegrees(scaleLength, root, chordSize, inversion));
  const chordsByDegree = new Map<number, number[]>();
  chords.forEach((degrees, chordIndex) => {
    for (const degree of degrees) {
      chordsByDegree.set(degree, [...(chordsByDegree.get(degree) ?? []), chordIndex]);
    }
  });
  const shown = markers.filter((m) => chordsByDegree.has(m.degree) && inWindow(m));

  if (currentStep !== null && currentStep >= 0 && currentStep < chords.length) {
    const shape = findChordShape(markers, chords[currentStep], window);
    const drawn = new Set(shown.map(markerKey));
    const extra = (shape ?? []).filter((m) => !drawn.has(markerKey(m)));
    return { notes: ringShape([...shown, ...extra], shape), chordsByDegree };
  }

  // No current chord (a progression without a legend)
  const bassKeys = new Set(
    chords.map((degrees) => findLowestMarker(shown, degrees[0])).filter((m): m is Marker => m !== null).map(markerKey)
  );
  const anchor = window ? shown.find((m) => m.stringIndex === rootStringIndex && m.degree === 1) : undefined;
  const anchorKey = anchor ? markerKey(anchor) : null;
  return {
    notes: shown.map((marker) => {
      const key = markerKey(marker);
      const ring: FretRing =
        key === anchorKey ? 'anchor' : bassKeys.has(key) ? 'bass' : marker.degree === 1 ? 'accent' : 'plain';
      return { marker, ring };
    }),
    chordsByDegree,
  };
}

/** Rings drawn thick (stroke 3, radius 12). */
export const hasThickRing = (ring: FretRing) => ring === 'bass' || ring === 'shape' || ring === 'anchor';
