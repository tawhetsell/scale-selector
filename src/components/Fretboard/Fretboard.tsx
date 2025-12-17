import { useMemo, useCallback } from 'react';
import { computeFretMap } from '../../lib/music/theory';
import { pcToName, getChordName, normalizePc } from '../../lib/music/notes';
import { getScaleDegreeColors } from '../../lib/music/colors';
import { SCALES } from '../../lib/music/scales';
import type { ChordQuality } from '../../lib/music/progressions';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;
type ViewMode = 'scale' | 'triads' | 'tetrads';
type RootString = 6 | 5 | 4;
type Voicing = 'root' | '1st' | '2nd' | '3rd';

type Marker = {
  stringIndex: number;
  fret: number;
  pc: number;
  degree: number;
};

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
  progressionNumerals: number[] | null; // chord degrees in the progression (or single-chord voicing)
  usePositionMode: boolean; // whether to use CAGED position filtering
  rootString: RootString;
  voicing: Voicing;
  chordQualities: ChordQuality[];
  currentStep: number | null;
  onStepChange: (step: number | null) => void;
  progressionName: string | null;
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

/**
 * Find complete chord shapes where the bass note matches the target inversion.
 * Returns ONE optimal shape per bass note position (not all possible notes).
 */
function findChordShapesForInversion(
  markers: Marker[],
  chordDegrees: number[],
  targetBassDegree: number
): Set<string> {
  const validMarkerKeys = new Set<string>();
  const numNotesNeeded = chordDegrees.length;

  // Pre-build lookup Map of markers by string for O(1) access
  const markersByString = new Map<number, Marker[]>();
  const chordDegreeSet = new Set(chordDegrees);
  for (const m of markers) {
    if (chordDegreeSet.has(m.degree)) {
      const list = markersByString.get(m.stringIndex);
      if (list) {
        list.push(m);
      } else {
        markersByString.set(m.stringIndex, [m]);
      }
    }
  }

  // Track which bass fret positions we've already found a shape for
  const usedBassFrets = new Set<number>();

  // Find all bass note positions for this inversion
  const bassMarkers = markers.filter(m => m.degree === targetBassDegree);

  // Sort by fret to process in order (low to high)
  bassMarkers.sort((a, b) => a.fret - b.fret);

  for (const bassMarker of bassMarkers) {
    // Skip if we already have a shape starting at this fret
    if (usedBassFrets.has(bassMarker.fret)) continue;

    // Try to build a shape starting from this bass note
    const shape = tryBuildShapeFromBass(
      markersByString,
      chordDegrees,
      bassMarker,
      numNotesNeeded
    );

    if (shape) {
      // Mark this bass fret as used
      usedBassFrets.add(bassMarker.fret);

      // Add all markers in this shape
      for (const m of shape) {
        validMarkerKeys.add(`${m.stringIndex}:${m.fret}`);
      }
    }
  }

  return validMarkerKeys;
}

/**
 * Try to build a chord shape starting from a specific bass note.
 * The bass note defines the lowest string; remaining notes go on higher strings.
 */
function tryBuildShapeFromBass(
  markersByString: Map<number, Marker[]>,
  chordDegrees: number[],
  bassMarker: Marker,
  numStrings: number
): Marker[] | null {
  // The bass marker defines the lowest string
  const lowestStringIdx = bassMarker.stringIndex;

  // Need (numStrings - 1) more strings above the bass
  // stringIndex decreases as we go to higher-pitched strings
  const stringIndices = [lowestStringIdx];
  for (let i = 1; i < numStrings; i++) {
    const nextString = lowestStringIdx - i;
    if (nextString < 0) return null; // Not enough strings above
    stringIndices.push(nextString);
  }

  // Build shape starting with bass marker
  const shape: Marker[] = [bassMarker];
  const usedDegrees = new Set<number>([bassMarker.degree]);
  let minFret = bassMarker.fret;
  let maxFret = bassMarker.fret;

  // Fill remaining strings (from 2nd lowest to highest)
  for (let i = 1; i < stringIndices.length; i++) {
    const stringIdx = stringIndices[i];
    const stringMarkers = markersByString.get(stringIdx) ?? [];

    // Find chord tones on this string within fret span
    const candidates: Marker[] = [];
    for (const m of stringMarkers) {
      if (!chordDegrees.includes(m.degree)) continue;
      const newMin = Math.min(minFret, m.fret);
      const newMax = Math.max(maxFret, m.fret);
      if (newMax - newMin <= 4) { // 4-fret span
        candidates.push(m);
      }
    }

    if (candidates.length === 0) return null;

    // Prefer unused degrees, then closest to existing fret range
    candidates.sort((a, b) => {
      // Prioritize unused degrees
      const aNew = !usedDegrees.has(a.degree) ? 0 : 1;
      const bNew = !usedDegrees.has(b.degree) ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;

      // Then prefer notes closer to the center of the shape
      const center = (minFret + maxFret) / 2;
      return Math.abs(a.fret - center) - Math.abs(b.fret - center);
    });

    const best = candidates[0];
    shape.push(best);
    usedDegrees.add(best.degree);
    minFret = Math.min(minFret, best.fret);
    maxFret = Math.max(maxFret, best.fret);
  }

  // Verify we have all chord tones
  const hasAllTones = chordDegrees.every(d => usedDegrees.has(d));
  return hasAllTones ? shape : null;
}

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
  usePositionMode,
  rootString,
  voicing,
  chordQualities,
  currentStep,
  onStepChange,
  progressionName: _progressionName,
}: Props) {
  void _progressionName; // Reserved for future use (e.g., displaying progression title)
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

  // Get the bass note degrees (first note of each chord after inversion)
  // This is used as a fallback when not in position mode
  const bassNoteDegrees = isProgressionMode
    ? new Set(progressionNumerals.map((chordRoot) => getChordDegrees(chordRoot)[0]))
    : null;

  // Create a mapping from marker degree to which chords in the progression it belongs to
  // A degree can belong to multiple chords (shared tones are common in diatonic harmony)
  const degreeToProgressionChords = isProgressionMode
    ? (() => {
        const map = new Map<number, number[]>();
        progressionNumerals.forEach((chordRoot, chordIndex) => {
          const degrees = getChordDegrees(chordRoot);

          // Map each degree to all chords it belongs to
          degrees.forEach((deg) => {
            const existing = map.get(deg) ?? [];
            if (!existing.includes(chordIndex)) {
              map.set(deg, [...existing, chordIndex]);
            }
          });
        });
        return map;
      })()
    : null;

  // Find the position (fret range) for position-based display
  const positionFretRange = useMemo(() => {
    if (!usePositionMode || !isProgressionMode || !progressionNumerals) {
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
  }, [usePositionMode, isProgressionMode, progressionNumerals, strings, rootString, markers]);

  // Filter markers for triads/tetrads or progressions
  const filteredMarkers = useMemo(() => {
    if (isProgressionMode && progressionChordDegrees) {
      // In progression mode, show all chord tones from all chords in progression
      const uniqueDegrees = [...new Set(progressionChordDegrees)];
      let filtered = markers.filter((m) => uniqueDegrees.includes(m.degree));

      // Filter to the fret range for position-based display
      if (positionFretRange) {
        filtered = filtered.filter(
          (m) => m.fret >= positionFretRange.minFret && m.fret <= positionFretRange.maxFret
        );
      }

      return filtered;
    }
    if ((viewMode === 'triads' || viewMode === 'tetrads') && triadDegrees) {
      // First filter to just chord tones
      let filtered = markers.filter((m) => triadDegrees.includes(m.degree));

      // Apply inversion filtering based on voicing
      // triadDegrees is in order: [root, 3rd, 5th] for triads, [root, 3rd, 5th, 7th] for tetrads
      const bassIndex =
        voicing === 'root' ? 0 :
        voicing === '1st' ? 1 :
        voicing === '2nd' ? 2 : 3;

      const targetBassDegree = triadDegrees[bassIndex];

      if (targetBassDegree !== undefined) {
        const validShapeKeys = findChordShapesForInversion(
          filtered,
          triadDegrees,
          targetBassDegree
        );
        filtered = filtered.filter(m => validShapeKeys.has(`${m.stringIndex}:${m.fret}`));
      }

      return filtered;
    }
    return markers;
  }, [isProgressionMode, progressionChordDegrees, markers, positionFretRange, viewMode, triadDegrees, voicing]);

  // In position mode (when positionFretRange is active), compute specific bass markers
  // Each chord in the progression gets exactly one bass note marker (the lowest-pitched one in the box)
  const positionBassMarkerKeys = useMemo((): Set<string> | null => {
    if (!isProgressionMode || !positionFretRange || !progressionNumerals) {
      return null;
    }

    const bassKeys = new Set<string>();

    for (const chordRoot of progressionNumerals) {
      const chordDegrees = getChordDegrees(chordRoot);
      const bassDegree = chordDegrees[0]; // First element is the bass note for this voicing

      // Find all markers in the filtered set with this bass degree
      const bassMarkersForChord = filteredMarkers.filter((m) => m.degree === bassDegree);

      if (bassMarkersForChord.length === 0) {
        continue;
      }

      // Choose the lowest-pitched marker
      // Lower stringIndex = higher string (thinner, higher pitch)
      // Higher stringIndex = lower string (thicker, lower pitch)
      // Lower fret = lower pitch on same string
      // So we want: highest stringIndex first, then lowest fret
      const lowestPitched = bassMarkersForChord.reduce((lowest, current) => {
        // Compare by string first (higher stringIndex = lower pitch = preferred)
        if (current.stringIndex > lowest.stringIndex) {
          return current;
        }
        if (current.stringIndex < lowest.stringIndex) {
          return lowest;
        }
        // Same string: lower fret = lower pitch = preferred
        return current.fret < lowest.fret ? current : lowest;
      });

      bassKeys.add(`${lowestPitched.stringIndex}:${lowestPitched.fret}`);
    }

    return bassKeys;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProgressionMode, positionFretRange, progressionNumerals, filteredMarkers, intervals.length, useTetrads, voicing]);

  // In position mode, identify the key root anchor marker (degree 1 on the selected root string)
  // This marker gets a special halo effect
  const keyRootAnchorKey = useMemo((): string | null => {
    if (!isProgressionMode || !positionFretRange) {
      return null;
    }

    const rootStringIndex = strings - rootString;
    if (rootStringIndex < 0 || rootStringIndex >= strings) {
      return null;
    }

    // Find the degree 1 marker on the root string within the position
    const anchorMarker = filteredMarkers.find(
      (m) => m.stringIndex === rootStringIndex && m.degree === 1
    );

    return anchorMarker ? `${anchorMarker.stringIndex}:${anchorMarker.fret}` : null;
  }, [isProgressionMode, positionFretRange, strings, rootString, filteredMarkers]);

  const fretX = (fret: number) => nutX + fret * fretWidth;
  const stringY = (sIdx: number) => padding + (strings - 1 - sIdx) * stringGap;
  const stringStartX = padding;
  const stringEndX = stringsEnd;

  const indicatorY = boardHeight + 12;
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  const svgElement = (
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

        const markerKey = `${marker.stringIndex}:${marker.fret}`;

        // Check if this is the key root anchor (degree 1 on root string in position mode)
        const isKeyRootAnchor = keyRootAnchorKey === markerKey;

        // Determine if this marker is a bass note
        // In position mode: use the specific bass marker keys (one per chord)
        // BUT exclude degree-1 notes that aren't the key root anchor (they're just regular roots)
        // Otherwise: use the degree-based check (all markers with bass degree)
        const isBassNote = isProgressionMode && (
          positionBassMarkerKeys
            ? positionBassMarkerKeys.has(markerKey) && (marker.degree !== 1 || isKeyRootAnchor)
            : bassNoteDegrees?.has(marker.degree)
        );

        // Determine fill color based on mode
        // Mono mode always uses neutral grayscale, regardless of chords/progression/voicing
        // Multi-chord progressions (2+ chords) use progression colors in Color mode
        // Single-chord voicing mode uses degree colors in Color mode
        const isMultiChordProgression = progressionNumerals !== null && progressionNumerals.length > 1;
        // Get all chords this degree belongs to (shared tones belong to multiple chords)
        const markerChordIndices = degreeToProgressionChords?.get(marker.degree) ?? [0];
        const markerChordIndex = markerChordIndices[0]; // Use first chord for base color
        let fill: string;
        if (colorMode === 'mono') {
          fill = isRoot ? MONO_ROOT : MONO_TONE;
        } else if (isMultiChordProgression && degreeToProgressionChords) {
          // Use progression chord colors (only for real multi-chord progressions in Color mode)
          fill = PROGRESSION_COLORS[markerChordIndex % PROGRESSION_COLORS.length];
        } else {
          fill = degreeColors[Math.min(Math.max(marker.degree, 1) - 1, degreeColors.length - 1)];
        }

        // Determine opacity for step mode - dim non-active chords
        // A marker is active if ANY of the chords it belongs to is the current step
        const isActiveInStepMode = currentStep === null || markerChordIndices.includes(currentStep);
        const markerOpacity = isActiveInStepMode ? 1 : 0.2;

        const label =
          labelMode === 'degree'
            ? scale.degreeLabels[marker.degree - 1] ?? String(marker.degree)
            : pcToName(marker.pc, preferSharps);

        const textFill = colorMode !== 'mono' ? '#09121f' : '#121417';
        const glow =
          colorMode === 'mono'
            ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.14))'
            : `drop-shadow(0 0 12px ${fill}44)`;

        // Determine stroke style - bass notes and key root anchor get a thick white outline
        // In mono mode, root notes (white fill) get a gray stroke for contrast
        const hasThickStroke = isBassNote || isKeyRootAnchor;
        let strokeColor: string;
        if (hasThickStroke) {
          strokeColor = '#ffffff';
        } else if (colorMode === 'mono') {
          // In mono mode: root (white fill) gets gray stroke, others get light stroke
          strokeColor = isRoot ? 'rgba(141, 148, 156, 0.8)' : 'rgba(255, 255, 255, 0.65)';
        } else {
          strokeColor = 'rgba(255, 255, 255, 0.9)';
        }
        const strokeWidth = hasThickStroke ? 3 : (isRoot ? 2.2 : 1.4);
        const radius = hasThickStroke ? 12 : 11;

        return (
          <g key={`m-${marker.stringIndex}-${marker.fret}`} opacity={markerOpacity}>
            {/* Halo for key root anchor in position mode */}
            {isKeyRootAnchor && (
              <circle
                cx={x}
                cy={y}
                r={20}
                fill="rgba(255, 255, 255, 0.15)"
              />
            )}
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

  // Build legend data for multi-chord progressions
  const legendData = isProgressionMode && progressionNumerals && progressionNumerals.length > 1
    ? progressionNumerals.map((chordRoot, index) => {
        const quality = chordQualities[chordRoot - 1] ?? 'maj';
        const chordRootPc = normalizePc(rootPc + intervals[chordRoot - 1]);
        const chordName = getChordName(chordRootPc, quality, preferSharps);

        // Build Roman numeral with proper case
        const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
        let romanNumeral = numerals[chordRoot - 1] ?? String(chordRoot);
        if (quality === 'min' || quality === 'dim' || quality === 'min7' || quality === 'dim7' || quality === 'half-dim' || quality === 'minMaj7') {
          romanNumeral = romanNumeral.toLowerCase();
        }

        // Add quality symbol
        let qualitySymbol = '';
        if (quality === 'dim' || quality === 'dim7') qualitySymbol = '°';
        else if (quality === 'aug' || quality === 'aug7') qualitySymbol = '+';
        else if (quality === 'half-dim') qualitySymbol = 'ø';

        return {
          chordRoot,
          color: PROGRESSION_COLORS[index % PROGRESSION_COLORS.length],
          romanNumeral,
          qualitySymbol,
          chordName,
          index,
        };
      })
    : null;

  const handlePrevStep = useCallback(() => {
    if (!progressionNumerals) return;
    if (currentStep === null) {
      onStepChange(progressionNumerals.length - 1);
    } else if (currentStep === 0) {
      onStepChange(null);
    } else {
      onStepChange(currentStep - 1);
    }
  }, [progressionNumerals, currentStep, onStepChange]);

  const handleNextStep = useCallback(() => {
    if (!progressionNumerals) return;
    if (currentStep === null) {
      onStepChange(0);
    } else if (currentStep >= progressionNumerals.length - 1) {
      onStepChange(null);
    } else {
      onStepChange(currentStep + 1);
    }
  }, [progressionNumerals, currentStep, onStepChange]);

  const handleShowAll = useCallback(() => {
    onStepChange(null);
  }, [onStepChange]);

  return (
    <div className="fretboard-container">
      {svgElement}
      {legendData && (
        <div className="progression-legend">
          <div className="legend-chords">
            {legendData.map((chord, i) => (
              <div
                key={chord.chordRoot}
                className={`legend-chord ${currentStep === i ? 'legend-chord--active' : ''} ${currentStep !== null && currentStep !== i ? 'legend-chord--dimmed' : ''}`}
                onClick={() => onStepChange(currentStep === i ? null : i)}
              >
                <span className="legend-dot" style={{ background: chord.color }} />
                <span className="legend-numeral">{chord.romanNumeral}{chord.qualitySymbol}</span>
                <span className="legend-name">({chord.chordName})</span>
                {i < legendData.length - 1 && <span className="legend-arrow">→</span>}
              </div>
            ))}
          </div>
          <div className="step-controls">
            <button className="step-btn" onClick={handlePrevStep} title="Previous chord">◀</button>
            <button className="step-btn step-btn--all" onClick={handleShowAll} title="Show all chords">All</button>
            <button className="step-btn" onClick={handleNextStep} title="Next chord">▶</button>
          </div>
        </div>
      )}
    </div>
  );
}
