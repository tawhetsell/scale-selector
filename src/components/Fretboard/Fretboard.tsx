// import React from 'react';
import { computeFretMap } from '../../lib/music/theory';
import { pcToName } from '../../lib/music/notes';
import { getScaleDegreeColors } from '../../lib/music/colors';
import { SCALES } from '../../lib/music/scales';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;
type ViewMode = 'scale' | 'triads' | 'tetrads';
type DisplayMode = 'color-coded' | 'position';
type RootString = 6 | 5 | 4;
type Voicing = 'root' | '1st' | '2nd' | '3rd';

type Props = {
  openPcs: number[];
  maxFrets: number;
  rootPc: number;
  intervals: number[];
  scaleId: ScaleId;
  labelMode: LabelMode;
  colorMode: ColorMode;
  preferSharps?: boolean;
  viewMode: ViewMode;
  triadDegrees: number[] | null; // used for both triads and tetrads (chord degrees)
  progressionNumerals: number[] | null; // chord degrees in the progression
  displayMode: DisplayMode;
  rootString: RootString;
  voicing: Voicing;
};

const MONO_ROOT = '#f5f7fa';
const MONO_TONE = '#8d949c';
const INLAY_COLOR = '#b6bcc3';

// Colors for progression chords - matches the degree color palette style
const PROGRESSION_COLORS = [
  '#ff6b6b', // I - red
  '#4ecdc4', // ii/II - teal
  '#3A9BFF', // iii/III - blue (matches COLOR palette)
  '#96ceb4', // IV/iv - green
  '#ffeaa7', // V/v - yellow
  '#dfe6e9', // vi/VI - gray
  '#a29bfe', // vii/VII - purple
];

export default function Fretboard({
  openPcs,
  maxFrets,
  rootPc,
  intervals,
  scaleId,
  labelMode,
  colorMode,
  preferSharps = true,
  viewMode,
  triadDegrees,
  progressionNumerals,
  displayMode,
  rootString,
  voicing,
}: Props) {
  const strings = openPcs.length;
  const isCompact = maxFrets <= 12;
  const fretWidth = isCompact ? 68 : 48;
  const stringGap = 28;
  const padding = isCompact ? 24 : 24;
  const openSpacing = isCompact ? 60 : 48;
  const nutX = padding + openSpacing;
  const stringsEnd = nutX + maxFrets * fretWidth;
  const width = stringsEnd + padding;
  const boardHeight = padding * 2 + (strings - 1) * stringGap;
  const bottomMargin = 26;
  const totalHeight = boardHeight + bottomMargin;

  const markers = computeFretMap(openPcs, maxFrets, rootPc, intervals);
  const degreeColors = getScaleDegreeColors(scaleId);
  const scale = SCALES[scaleId];
  const markerFontSize = 'var(--marker-font-size, 10px)';

  const isProgressionMode = progressionNumerals !== null && progressionNumerals.length > 0;

  // For progression mode, we need to get all chord tones for all chords in the progression
  // Use tetrads (4 notes) if viewMode is 'tetrads', otherwise triads (3 notes)
  const useTetrads = viewMode === 'tetrads';

  // Helper to get chord degrees with inversion applied
  const getChordDegrees = (chordRoot: number): number[] => {
    const n = intervals.length;
    const rootIdx = chordRoot - 1;
    const thirdIdx = (rootIdx + 2) % n;
    const fifthIdx = (rootIdx + 4) % n;
    const seventhIdx = (rootIdx + 6) % n;

    // Build base chord tones
    let degrees: number[];
    if (useTetrads) {
      degrees = [rootIdx + 1, thirdIdx + 1, fifthIdx + 1, seventhIdx + 1];
    } else {
      degrees = [rootIdx + 1, thirdIdx + 1, fifthIdx + 1];
    }

    // Apply inversion by rotating the array
    // Inversion moves the bass note up, so we rotate left
    const inversionAmount =
      voicing === '1st' ? 1 :
      voicing === '2nd' ? 2 :
      voicing === '3rd' ? 3 : 0;

    // Rotate array left by inversionAmount
    const rotated = [...degrees.slice(inversionAmount), ...degrees.slice(0, inversionAmount)];
    return rotated;
  };

  const progressionChordDegrees = isProgressionMode
    ? progressionNumerals.flatMap((chordRoot) => getChordDegrees(chordRoot))
    : null;

  // Get the bass notes (first note of each chord after inversion)
  const bassNoteDegrees = isProgressionMode
    ? new Set(progressionNumerals.map((chordRoot) => getChordDegrees(chordRoot)[0]))
    : null;

  // Create a mapping from marker degree to which chord in the progression it belongs to
  const degreeToProgressionChord = isProgressionMode
    ? (() => {
        const map = new Map<number, number>();
        progressionNumerals.forEach((chordRoot, chordIndex) => {
          const degrees = getChordDegrees(chordRoot);

          // Map each degree to its chord index (prioritize root notes)
          degrees.forEach((deg) => {
            // Only set if not already set (first chord takes priority)
            if (!map.has(deg)) {
              map.set(deg, chordIndex);
            }
          });
        });
        return map;
      })()
    : null;

  // Find the position (fret range) for position-based display
  const positionFretRange = (() => {
    if (!isProgressionMode || displayMode !== 'position' || !progressionNumerals) {
      return null;
    }

    // Find the root note (degree 1) of the I chord on the selected root string
    // rootString is 6, 5, or 4 (guitar string numbers, where 6 = low E)
    // openPcs array is 0-indexed from high string, so we need to convert
    const rootStringIndex = strings - rootString; // Convert to 0-indexed from top

    if (rootStringIndex < 0 || rootStringIndex >= strings) {
      return null;
    }

    // Find all frets on the root string where the scale root (degree 1) appears
    const rootMarkersOnString = markers.filter(
      (m) => m.stringIndex === rootStringIndex && m.degree === 1
    );

    if (rootMarkersOnString.length === 0) {
      return null;
    }

    // Pick a root position (prefer lower frets, but not open string if possible)
    const preferredRoot = rootMarkersOnString.find((m) => m.fret >= 1 && m.fret <= 12)
      ?? rootMarkersOnString[0];

    // Define a 5-fret span centered around the root position
    const fretSpan = 5;
    const minFret = Math.max(0, preferredRoot.fret - 2);
    const maxFret = minFret + fretSpan;

    return { minFret, maxFret };
  })();

  // Filter markers for triads/tetrads or progressions
  const filteredMarkers = (() => {
    if (isProgressionMode && progressionChordDegrees) {
      // In progression mode, show all chord tones from all chords in progression
      const uniqueDegrees = [...new Set(progressionChordDegrees)];
      let filtered = markers.filter((m) => uniqueDegrees.includes(m.degree));

      // If position mode, further filter to the fret range
      if (displayMode === 'position' && positionFretRange) {
        filtered = filtered.filter(
          (m) => m.fret >= positionFretRange.minFret && m.fret <= positionFretRange.maxFret
        );
      }

      return filtered;
    }
    if ((viewMode === 'triads' || viewMode === 'tetrads') && triadDegrees) {
      return markers.filter((m) => triadDegrees.includes(m.degree));
    }
    return markers;
  })();

  const fretX = (fret: number) => nutX + fret * fretWidth;
  const stringY = (sIdx: number) => padding + (strings - 1 - sIdx) * stringGap;
  const stringStartX = padding;
  const stringEndX = stringsEnd;

  const indicatorY = boardHeight + 12;
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${totalHeight}`} role="img" aria-label="Guitar fretboard">
      {/* board background */}
      <rect x={0} y={0} width={width} height={boardHeight} fill="#050505" rx={14} stroke="rgba(255, 255, 255, 0.2)" />

      {/* strings */}
      {openPcs.map((_, s) => (
        <line
          key={`str-${s}`}
          x1={stringStartX}
          y1={stringY(s)}
          x2={stringEndX}
          y2={stringY(s)}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1.4}
        />
      ))}

      {/* nut */}
      <rect
        x={nutX - 7}
        y={padding - 16}
        width={7}
        height={boardHeight - padding * 2 + 32}
        fill="#ffffff"
        opacity={0.8}
      />

      {/* frets */}
      {Array.from({ length: maxFrets + 1 }).map((_, f) => (
        <line
          key={`f-${f}`}
          x1={fretX(f)}
          y1={padding - 16}
          x2={fretX(f)}
          y2={boardHeight - padding + 16}
          stroke={f % 12 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'}
          strokeWidth={f % 12 === 0 ? 1.8 : 1}
        />
      ))}

      {/* inlays */}
      {inlayFrets.map((fret) => {
        if (fret > maxFrets) return null;
        const centerX = fretX(fret) - fretWidth / 2;
        const isOctave = fret % 12 === 0;
        const dots = isOctave
          ? [
              { x: centerX - 7, y: indicatorY },
              { x: centerX + 7, y: indicatorY },
            ]
          : [{ x: centerX, y: indicatorY }];
        return dots.map(({ x, y }, idx) => (
          <circle key={`inlay-${fret}-${idx}`} cx={x} cy={y} r={4} fill={INLAY_COLOR} />
        ));
      })}

      {/* markers */}
      {filteredMarkers.map((marker) => {
        const x = fretX(marker.fret) - fretWidth / 2;
        const y = stringY(marker.stringIndex);
        const isRoot = marker.degree === 1;
        const isBassNote = isProgressionMode && bassNoteDegrees?.has(marker.degree);

        // Determine fill color based on mode
        // In progression mode, always use chord-based colors regardless of display mode
        let fill: string;
        if (isProgressionMode && degreeToProgressionChord) {
          // Use progression chord colors
          const chordIndex = degreeToProgressionChord.get(marker.degree) ?? 0;
          fill = PROGRESSION_COLORS[chordIndex % PROGRESSION_COLORS.length];
        } else if (colorMode === 'mono') {
          fill = isRoot ? MONO_ROOT : MONO_TONE;
        } else {
          fill = degreeColors[Math.min(Math.max(marker.degree, 1) - 1, degreeColors.length - 1)];
        }

        const label =
          labelMode === 'degree'
            ? scale.degreeLabels[marker.degree - 1] ?? String(marker.degree)
            : pcToName(marker.pc, preferSharps);

        const textFill = isProgressionMode || colorMode !== 'mono' ? '#09121f' : '#121417';
        const glow =
          colorMode === 'mono' && !isProgressionMode
            ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.14))'
            : `drop-shadow(0 0 12px ${fill}44)`;

        // Determine stroke style - bass notes get a thick white outline
        const strokeColor = isBassNote ? '#ffffff' : (colorMode === 'mono' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.9)');
        const strokeWidth = isBassNote ? 3 : (isRoot ? 2.2 : 1.4);
        const radius = isBassNote ? 12 : 11;

        return (
          <g key={`m-${marker.stringIndex}-${marker.fret}`}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{ filter: glow }}
            />
            <text
              x={x}
              y={y}
              fontSize={markerFontSize}
              dominantBaseline="middle"
              textAnchor="middle"
              fill={textFill}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
