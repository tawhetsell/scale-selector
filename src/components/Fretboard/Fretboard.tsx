import { useEffect, useMemo, useRef, useState } from 'react';
import { computeFretMap } from '../../lib/music/theory';
import { pcToName } from '../../lib/music/notes';
import type { ChordSize, Inversion } from '../../lib/music/chords';
import { getFretboardDisplay, hasThickRing } from '../../lib/music/fretboardDisplay';
import { getScaleDegreeColors, pickTextColor } from '../../lib/music/colors';
import { SCALES, formatDegreeLabel } from '../../lib/music/scales';
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
  rootString: RootString; // anchors the position window for chords
  currentStep: number | null;
  fitToContainer?: boolean; // full-screen view: stretch to the container's height
};

const INLAY_COLOR = '#b6bcc3';
const STRING_COLOR = 'rgba(255, 255, 255, 0.5)';
const STANDOUT_OUTLINE = '#ffffff';

const BASE_STRING_GAP = 28;
// Larger screens stop looking like a neck past 48; a sideways phone needs more to fill its height
const MAX_STRING_GAP = 48;
const MAX_STRING_GAP_PHONE = 64;
const PHONE_MAX_WIDTH = 900;
// Notes grow with the string gap, up to 1.8x (1.5x on the narrower frets of the 24-fret neck)
const MAX_MARKER_SCALE = 1.8;
const MAX_MARKER_SCALE_FULL_NECK = 1.5;
const INLAY_GUTTER = 16; // space below the strings for the fret dots
// Full-screen view: a deeper gutter (the larger notes would crowd the dots) and the same again
// above the strings for a second row of dots, so the board is even top and bottom
const FULLSCREEN_INLAY_GUTTER = INLAY_GUTTER + 8;

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
  const bottomGutter = fitToContainer ? FULLSCREEN_INLAY_GUTTER : INLAY_GUTTER;
  const topGutter = fitToContainer ? FULLSCREEN_INLAY_GUTTER : 0;

  // In the full-screen view, spread the strings out to fill the container's height
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerBox, setContainerBox] = useState<{ width: number; aspect: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!fitToContainer || !el) return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0) {
        setContainerBox({
          width: el.clientWidth,
          aspect: Math.round((el.clientHeight / el.clientWidth) * 100) / 100,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitToContainer]);
  const fittedGap =
    fitToContainer && containerBox
      ? (containerBox.aspect * width - padding * 2 - topGutter - bottomGutter) / (strings - 1)
      : BASE_STRING_GAP;
  const maxGap = containerBox && containerBox.width < PHONE_MAX_WIDTH ? MAX_STRING_GAP_PHONE : MAX_STRING_GAP;
  const stringGap = Math.min(Math.max(fittedGap, BASE_STRING_GAP), maxGap);
  const markerScale = Math.min(stringGap / BASE_STRING_GAP, isCompact ? MAX_MARKER_SCALE : MAX_MARKER_SCALE_FULL_NECK);

  const stringAreaHeight = padding * 2 + (strings - 1) * stringGap;
  const boardHeight = topGutter + stringAreaHeight + bottomGutter;
  const totalHeight = boardHeight;

  const markers = useMemo(
    () => computeFretMap(openStrings, maxFrets, rootPc, intervals),
    [openStrings, maxFrets, rootPc, intervals]
  );
  const degreeColors = getScaleDegreeColors(scaleId);
  const scale = SCALES[scaleId];
  const markerFontSize = `calc(var(--marker-font-size, 10px) * ${markerScale})`;
  // Two-spelling labels such as '♯4/♭5' are wider than a marker at the normal size
  const longLabelFontSize = `calc(var(--marker-font-size, 10px) * ${markerScale * 0.78})`;
  const colorForDegree = (degree: number) =>
    degreeColors[Math.min(Math.max(degree, 1) - 1, degreeColors.length - 1)];

  const display = useMemo(
    () =>
      getFretboardDisplay({
        markers,
        scaleLength: intervals.length,
        strings,
        maxFrets,
        chordSize,
        chordRootDegree,
        progressionNumerals,
        inversion,
        rootString,
        currentStep,
      }),
    [markers, intervals.length, strings, maxFrets, chordSize, chordRootDegree, progressionNumerals, inversion, rootString, currentStep]
  );

  const fretX = (fret: number) => nutX + fret * fretWidth;
  const stringY = (sIdx: number) => topGutter + padding + (strings - 1 - sIdx) * stringGap;
  const stringStartX = padding;
  const stringEndX = stringsEnd;

  // Inlay dots centered between visual grid bottom (where fret lines end) and panel bottom
  const fretTop = topGutter + padding - 16; // fret lines extend 16 units past the outer strings
  const fretBottom = topGutter + stringAreaHeight - padding + 16;
  // Dots below the strings, and in the full-screen view above them too
  const inlayRows = topGutter > 0 ? [(fretBottom + boardHeight) / 2, fretTop / 2] : [(fretBottom + boardHeight) / 2];
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
          y={fretTop}
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
            y1={fretTop}
            x2={fretX(f)}
            y2={fretBottom}
            stroke={f % 12 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth={f % 12 === 0 ? 1.8 : 1}
          />
        ))}

        {/* inlays */}
        {inlayFrets.map((fret) => {
          if (fret > maxFrets) return null;
          const centerX = fretX(fret) - fretWidth / 2;
          const isOctave = fret % 12 === 0;
          const dots = inlayRows.flatMap((y) =>
            isOctave
              ? [
                  { x: centerX - 7, y },
                  { x: centerX + 7, y },
                ]
              : [{ x: centerX, y }]
          );
          return dots.map(({ x, y }, idx) => (
            <circle key={`inlay-${fret}-${idx}`} cx={x} cy={y} r={4} fill={INLAY_COLOR} />
          ));
        })}

        {/* markers */}
        {display.notes.map(({ marker, ring }) => {
          const x = fretX(marker.fret) - fretWidth / 2;
          const y = stringY(marker.stringIndex);
          const isKeyRootAnchor = ring === 'anchor';
          const isAccent = ring === 'accent';

          // Shared tones belong to several chords; the first chord picks the color
          const chordIndices = display.chordsByDegree?.get(marker.degree) ?? null;

          // Mono: board color fill for an outline-only look that still masks the strings.
          // Multi-chord progressions: the color of the chord's root degree (same as the piano).
          let fill: string;
          if (colorMode === 'mono') {
            fill = '#050505';
          } else if (chordIndices && progressionNumerals && progressionNumerals.length > 1) {
            // While stepping, the current chord's tones all take its color, shared tones included
            const chordIndex = currentStep !== null && chordIndices.includes(currentStep) ? currentStep : chordIndices[0];
            fill = colorForDegree(progressionNumerals[chordIndex]);
          } else {
            fill = colorForDegree(marker.degree);
          }

          // Step mode: dim markers that don't belong to the current chord
          const isActiveInStepMode = currentStep === null || !chordIndices || chordIndices.includes(currentStep);
          const markerOpacity = isActiveInStepMode ? 1 : 0.2;

          const label =
            labelMode === 'degree'
              ? formatDegreeLabel(scale.degreeLabels[marker.degree - 1] ?? String(marker.degree))
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

          // Thick stroke for the shape to play (or each chord's bass); medium stroke for degree 1 in scale mode
          const hasThickStroke = hasThickRing(ring);
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
              {/* Halo on the shape's bass note (or the key root with no current chord) */}
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
                fontSize={label.length > 3 ? longLabelFontSize : markerFontSize}
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
