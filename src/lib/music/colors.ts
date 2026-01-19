import { SCALES } from './scales';

// Scale degree color palette (index 0 = degree 1, etc.)
const DEGREE_COLOR_PALETTE = [
  '#EA3F75', // degree 1 - pink (root)
  '#FF7A66', // degree 2 - coral
  '#7A73EF', // degree 3 - violet
  '#4281EA', // degree 4 - blue
  '#00D4FF', // degree 5 - cyan
  '#00FFC8', // degree 6 - mint
  '#39FF88', // degree 7 - green
  '#F9FF4A', // degree 8 - yellow (only for 8-note scales)
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

/**
 * Compute relative luminance from a hex color (WCAG formula).
 * Returns a value between 0 (black) and 1 (white).
 */
function relativeLuminance(hex: string): number {
  // Remove # if present
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  // Convert to linear RGB
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  // Relative luminance
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Pick a contrasting text color (black or white) for a given background hex color.
 * Uses WCAG relative luminance to determine contrast.
 */
export function pickTextColor(bgHex: string): '#000000' | '#ffffff' {
  const lum = relativeLuminance(bgHex);
  // Use 0.4 as threshold (slightly lower than 0.5 to favor white text on medium colors)
  return lum > 0.4 ? '#000000' : '#ffffff';
}
