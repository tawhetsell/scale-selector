import { SCALES } from './scales';

const DEGREE_COLOR_PALETTE = [
  '#3A9BFF', // ion
  '#22B6C7', // plasma
  '#6EE7CF', // mint
  '#84E36A', // aurora
  '#E8B65A', // amber
  '#F58A4B', // ember
  '#D166D6', // magpulse
  '#8A7CFF', // uv
] as const;

type ScaleId = keyof typeof SCALES;

export function getScaleDegreeColors(scaleId: ScaleId): string[] {
  const scale = SCALES[scaleId];
  if (!scale) {
    return [];
  }

  const degrees = scale.intervals.length;
  return Array.from({ length: degrees }, (_, index) => {
    const paletteIndex = Math.min(index, DEGREE_COLOR_PALETTE.length - 1);
    return DEGREE_COLOR_PALETTE[paletteIndex];
  });
}

export function getDegreeColor(scaleId: ScaleId, degreeIndex: number): string | undefined {
  if (degreeIndex < 0) return undefined;
  const colors = getScaleDegreeColors(scaleId);
  if (!colors.length) return undefined;
  const clampedIndex = Math.min(degreeIndex, colors.length - 1);
  return colors[clampedIndex];
}
