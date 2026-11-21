// Stepping rules for the progression legend. A legend always has a current chord; the step is
// null only when there is no legend (no progression, or one with fewer than 2 chords).

/** The current chord for a legend of chordCount chords: the chosen step, or the first chord if it's out of range. */
export function resolveStep(step: number | null, chordCount: number): number | null {
  if (chordCount < 2) return null;
  return step !== null && Number.isInteger(step) && step >= 0 && step < chordCount ? step : 0;
}

/** ▶: the next chord, from the last round to the first. */
export function stepForward(step: number | null, chordCount: number): number | null {
  if (chordCount < 2) return null;
  return ((resolveStep(step, chordCount) ?? 0) + 1) % chordCount;
}

/** ◀: the previous chord, from the first round to the last. */
export function stepBack(step: number | null, chordCount: number): number | null {
  if (chordCount < 2) return null;
  return ((resolveStep(step, chordCount) ?? 0) - 1 + chordCount) % chordCount;
}
