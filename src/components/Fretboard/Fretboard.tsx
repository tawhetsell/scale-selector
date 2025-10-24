// import React from 'react';
import { computeFretMap } from '../../lib/music/theory';
import { pcToName } from '../../lib/music/notes';
import { getScaleDegreeColors } from '../../lib/music/colors';
import type { SCALES } from '../../lib/music/scales';

type LabelMode = 'degree' | 'letters';
type ColorMode = 'mono' | 'color';
type ScaleId = keyof typeof SCALES;

type Props = {
  openPcs: number[];
  maxFrets: number;
  rootPc: number;
  intervals: number[];
  scaleId: ScaleId;
  labelMode: LabelMode;
  colorMode: ColorMode;
  preferSharps?: boolean;
};

const MONO_ROOT = '#f5f7fa';
const MONO_TONE = '#8d949c';
const INLAY_COLOR = '#b6bcc3';

export default function Fretboard({
  openPcs,
  maxFrets,
  rootPc,
  intervals,
  scaleId,
  labelMode,
  colorMode,
  preferSharps = true,
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
      {markers.map((marker) => {
        const x = fretX(marker.fret) - fretWidth / 2;
        const y = stringY(marker.stringIndex);
        const isRoot = marker.degree === 1;
        const fill =
          colorMode === 'mono'
            ? isRoot
              ? MONO_ROOT
              : MONO_TONE
            : degreeColors[Math.min(Math.max(marker.degree, 1) - 1, degreeColors.length - 1)];
        const label = labelMode === 'degree' ? String(marker.degree) : pcToName(marker.pc, preferSharps);
        const textFill = colorMode === 'mono' ? '#121417' : '#09121f';
        const glow =
          colorMode === 'mono'
            ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.14))'
            : `drop-shadow(0 0 12px ${fill}44)`;

        return (
          <g key={`m-${marker.stringIndex}-${marker.fret}`}>
            <circle
              cx={x}
              cy={y}
              r={11}
              fill={fill}
              stroke={colorMode === 'mono' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.9)'}
              strokeWidth={isRoot ? 2.2 : 1.4}
              style={{ filter: glow }}
            />
            <text
              x={x}
              y={y}
              fontSize="10"
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
