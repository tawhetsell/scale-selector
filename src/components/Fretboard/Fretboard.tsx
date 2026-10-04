import { useEffect, useMemo, useRef, useState } from 'react';
import { computeFretMap, type Marker } from '../../lib/music/theory';
import { pcToName } from '../../lib/music/notes';
import { getChordDegrees, type ChordSize, type Inversion } from '../../lib/music/chords';
import { findChordShapes, findLowestMarker, getPositionWindow } from '../../lib/music/voicings';
import { getScaleDegreeColors, pickTextColor } from '../../lib/music/colors';
import { SCALES } from '../../lib/music/scales';
import { playNote } from '../../lib/audio/synth';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;
type RootString = 6 | 5 | 4;

type Props = {
  openStrings: number[]; // open-string MIDI notes, lowest string first
  maxFrets: number;
  rootPc: number;
  intervals: number[];
  scaleId: ScaleId;
  degreeNames: string[]; // spelled note name for each scale degree
  labelMode: LabelMode;
  colorMode: ColorMode;
  chordSize: ChordSize | null; // null = scale mode
  chordRootDegree: number; // the chord shown when no progression is active
  progressionNumerals: number[] | null; // chord roots of the active progression
  inversion: Inversion;
  rootString: RootString; // anchors the position window in progression mode
  currentStep: number | null;
  fitToContainer?: boolean; // full-screen view: stretch to the container's height
};

type Display = {
  markers: Marker[];
  bassKeys: Set<string>; // thick ring: the bass note of each shape (single chord) or chord (progression)
  anchorKey: string | null; // thick ring + halo: key root on the root string (progression)
  accentDegree: number; // medium ring
  chordsByDegree: Map<number, number[]> | null; // progression chords containing each degree
};

const INLAY_COLOR = '#b6bcc3';
const STRING_COLOR = 'rgba(255, 255, 255, 0.5)';
const STANDOUT_OUTLINE = '#ffffff';

const markerKey = (m: Marker) => `${m.stringIndex}:${m.fret}`;

const BASE_STRING_GAP = 28;
const MAX_STRING_GAP = 48; // enough to fill a sideways phone; more stops looking like a neck
const MAX_MARKER_SCALE = 1.4;

export default function Fretboard({
  openStrings,
  maxFrets,
  rootPc,
  intervals,
  scaleId,
  degreeNames,
  labelMode,
  colorMode,
  chordSize,
  chordRootDegree,
  progressionNumerals,
  inversion,
  rootString,
  currentStep,
  fitToContainer = false,
}: Props) {
  const strings = openStrings.length;
  const isCompact = maxFrets <= 12;
  const fretWidth = isCompact ? 68 : 48;
  const padding = isCompact ? 24 : 24;
  const openSpacing = isCompact ? 60 : 48;
  const nutX = padding + openSpacing;
  const stringsEnd = nutX + maxFrets * fretWidth;
  const width = stringsEnd + padding;
  const inlayGutter = 16; // Space below strings for fret marker dots

  // In the full-screen view, spread the strings out to fill the container's height
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerAspect, setContainerAspect] = useState<number | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!fitToContainer || !el) return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0) setContainerAspect(Math.round((el.clientHeight / el.clientWidth) * 100) / 100);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitToContainer]);
  const fittedGap =
    fitToContainer && containerAspect
      ? (containerAspect * width - padding * 2 - inlayGutter) / (strings - 1)
      : BASE_STRING_GAP;
  const stringGap = Math.min(Math.max(fittedGap, BASE_STRING_GAP), MAX_STRING_GAP);
  const markerScale = Math.min(stringGap / BASE_STRING_GAP, MAX_MARKER_SCALE);

  const stringAreaHeight = padding * 2 + (strings - 1) * stringGap;
  const boardHeight = stringAreaHeight + inlayGutter;
  const totalHeight = boardHeight;

  const markers = useMemo(
    () => computeFretMap(openStrings, maxFrets, rootPc, intervals),
    [openStrings, maxFrets, rootPc, intervals]
  );
  const degreeColors = getScaleDegreeColors(scaleId);
  const scale = SCALES[scaleId];
  const markerFontSize = `calc(var(--marker-font-size, 10px) * ${markerScale})`;
  const colorForDegree = (degree: number) =>
    degreeColors[Math.min(Math.max(degree, 1) - 1, degreeColors.length - 1)];

  const display = useMemo((): Display => {
    if (chordSize === null) {
      return { markers, bassKeys: new Set(), anchorKey: null, accentDegree: 1, chordsByDegree: null };
    }

    if (progressionNumerals === null) {
      // Single chord: playable shapes for the selected inversion, across the whole neck
      const degrees = getChordDegrees(intervals.length, chordRootDegree, chordSize, inversion);
      const shapes = findChordShapes(markers, degrees, degrees[0]);
      const inShape = new Set(shapes.flat().map(markerKey));
      return {
        markers: markers.filter((m) => inShape.has(markerKey(m))),
        bassKeys: new Set(shapes.map((shape) => markerKey(shape[0]))),
        anchorKey: null,
        accentDegree: chordRootDegree,
        chordsByDegree: null,
      };
    }

    // Progression: every chord's tones inside the position window anchored on the root string
    const chords = progressionNumerals.map((root) => getChordDegrees(intervals.length, root, chordSize, inversion));
    const chordsByDegree = new Map<number, number[]>();
    chords.forEach((degrees, chordIndex) => {
      for (const degree of degrees) {
        chordsByDegree.set(degree, [...(chordsByDegree.get(degree) ?? []), chordIndex]);
      }
    });

    const rootStringIndex = strings - rootString; // guitar string number -> index (0 = lowest string)
    const fretWindow = getPositionWindow(markers, rootStringIndex);
    const shown = markers.filter(
      (m) =>
        chordsByDegree.has(m.degree) &&
        (!fretWindow || (m.fret >= fretWindow.minFret && m.fret <= fretWindow.maxFret))
    );

    const bassKeys = new Set<string>();
    for (const degrees of chords) {
      const bass = findLowestMarker(shown, degrees[0]);
      if (bass) bassKeys.add(markerKey(bass));
    }

    const anchor = fretWindow
      ? shown.find((m) => m.stringIndex === rootStringIndex && m.degree === 1)
      : undefined;

    return {
      markers: shown,
      bassKeys,
      anchorKey: anchor ? markerKey(anchor) : null,
      accentDegree: 1,
      chordsByDegree,
    };
  }, [markers, chordSize, progressionNumerals, intervals.length, chordRootDegree, inversion, strings, rootString]);

  const fretX = (fret: number) => nutX + fret * fretWidth;
  const stringY = (sIdx: number) => padding + (strings - 1 - sIdx) * stringGap;
  const stringStartX = padding;
  const stringEndX = stringsEnd;

  // Inlay dots centered between visual grid bottom (where fret lines end) and panel bottom
  const gridVisualBottom = stringAreaHeight - padding + 16; // fret lines extend 16px below lowest string
  const indicatorY = (gridVisualBottom + boardHeight) / 2;
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  return (
    <div className="fretboard-container" ref={containerRef}>
      <svg width="100%" viewBox={`0 0 ${width} ${totalHeight}`} role="img" aria-label="Guitar fretboard">
        {/* board background */}
        <rect x={0} y={0} width={width} height={boardHeight} fill="#050505" rx={14} stroke="rgba(255, 255, 255, 0.2)" />

        {/* strings */}
        {openStrings.map((_, s) => (
          <line
            key={`str-${s}`}
            x1={stringStartX}
            y1={stringY(s)}
            x2={stringEndX}
            y2={stringY(s)}
            stroke={STRING_COLOR}
            strokeWidth={1.4}
          />
        ))}

        {/* nut */}
        <rect
          x={nutX - 7}
          y={padding - 16}
          width={7}
          height={stringAreaHeight - padding * 2 + 32}
          fill="#ffffff"
          opacity={0.8}
        />

        {/* frets - stay within string area, don't extend into marker lane */}
        {Array.from({ length: maxFrets + 1 }).map((_, f) => (
          <line
            key={`f-${f}`}
            x1={fretX(f)}
            y1={padding - 16}
            x2={fretX(f)}
            y2={stringAreaHeight - padding + 16}
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
        {display.markers.map((marker) => {
          const x = fretX(marker.fret) - fretWidth / 2;
          const y = stringY(marker.stringIndex);
          const key = markerKey(marker);
          const isKeyRootAnchor = display.anchorKey === key;
          const isBassNote = display.bassKeys.has(key);
          const isAccent = marker.degree === display.accentDegree;

          // Shared tones belong to several chords; the first chord picks the color
          const chordIndices = display.chordsByDegree?.get(marker.degree) ?? null;

          // Mono: board color fill for an outline-only look that still masks the strings.
          // Multi-chord progressions: the color of the chord's root degree (same as the piano).
          let fill: string;
          if (colorMode === 'mono') {
            fill = '#050505';
          } else if (chordIndices && progressionNumerals && progressionNumerals.length > 1) {
            fill = colorForDegree(progressionNumerals[chordIndices[0]]);
          } else {
            fill = colorForDegree(marker.degree);
          }

          // Step mode: dim markers that don't belong to the current chord
          const isActiveInStepMode = currentStep === null || !chordIndices || chordIndices.includes(currentStep);
          const markerOpacity = isActiveInStepMode ? 1 : 0.2;

          const label =
            labelMode === 'degree'
              ? scale.degreeLabels[marker.degree - 1] ?? String(marker.degree)
              : degreeNames[marker.degree - 1] ?? pcToName(marker.pc);

          // Compute text color based on fill luminance for contrast
          // Mono: softened white text on transparent/dark background
          const monoWhite = 'rgba(255,255,255,0.88)';
          const textFill = colorMode !== 'mono' ? pickTextColor(fill) : monoWhite;
          // Subtle shadow for text readability (no stroke/outline)
          const textShadow = colorMode !== 'mono' ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55))' : undefined;
          // Mono: subtle lift shadow for separation; Color: soft colored glow
          const dotFilter =
            colorMode === 'mono'
              ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))'
              : `drop-shadow(0 0 12px ${fill}44)`;

          // Thick stroke for bass notes and the key root anchor; medium stroke for the accent degree
          const hasThickStroke = isBassNote || isKeyRootAnchor;
          const useStandoutOutline = hasThickStroke || isAccent;

          let strokeColor: string;
          let strokeWidth: number;
          if (colorMode === 'mono') {
            // Mono: accented notes (same as Color mode) get brighter/thicker ring
            if (useStandoutOutline) {
              strokeColor = 'rgba(255,255,255,0.98)';
              strokeWidth = 2;
            } else {
              strokeColor = monoWhite;
              strokeWidth = 1;
            }
          } else if (useStandoutOutline) {
            strokeColor = STANDOUT_OUTLINE;
            strokeWidth = hasThickStroke ? 3 : (isAccent ? 2.2 : 1.4);
          } else {
            // Default: use string color for outline
            strokeColor = STRING_COLOR;
            strokeWidth = hasThickStroke ? 3 : (isAccent ? 2.2 : 1.4);
          }
          const radius = (hasThickStroke ? 12 : 11) * markerScale;

          return (
            <g
              key={`m-${marker.stringIndex}-${marker.fret}`}
              className="fret-marker"
              opacity={markerOpacity}
              onClick={() => playNote(marker.midi)}
            >
              {/* Halo for key root anchor in position mode */}
              {isKeyRootAnchor && (
                <circle
                  cx={x}
                  cy={y}
                  r={20 * markerScale}
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
                style={{ filter: dotFilter }}
              />
              <text
                x={x}
                y={y}
                fontSize={markerFontSize}
                dominantBaseline="middle"
                textAnchor="middle"
                fill={textFill}
                style={{ filter: textShadow }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
