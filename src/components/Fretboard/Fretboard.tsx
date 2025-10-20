import React from 'react';
import { computeFretMap } from '../../lib/music/theory';
import { pcToName } from '../../lib/music/notes';

type Props = {
  openPcs: number[];       // lowest string first
  maxFrets: number;        // e.g., 24
  rootPc: number;
  intervals: number[];     // from selected scale
  showDegrees?: boolean;
  preferSharps?: boolean;
};

const ROOT_COLOR = '#FF7664';
const NOTE_COLOR = '#55A8FF';
const INLAY_COLOR = '#2ED8A3';

export default function Fretboard({
  openPcs,
  maxFrets,
  rootPc,
  intervals,
  showDegrees = true,
  preferSharps = true,
}: Props) {
  const strings = openPcs.length;
  const fretWidth = 48;
  const stringGap = 28;
  const padding = 24;
  const openPadding = 44;
  const width = padding * 2 + openPadding + maxFrets * fretWidth + fretWidth; // include nut column and open string space
  const boardHeight = padding * 2 + (strings - 1) * stringGap;
  const bottomMargin = 40;
  const totalHeight = boardHeight + bottomMargin;

  const markers = computeFretMap(openPcs, maxFrets, rootPc, intervals);

  const fretX = (fret: number) => padding + openPadding + fret * fretWidth;
  const stringY = (sIdx: number) => padding + (strings - 1 - sIdx) * stringGap; // highest string on top
  const stringStartX = fretX(0) - fretWidth / 2;
  const stringEndX = width - padding;

  const inlayFrets = [3,5,7,9,12,15,17,19,21,24];

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
        x={fretX(0) - 7}
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
      {inlayFrets.map(f => {
        const centerX = fretX(f) - fretWidth / 2;
        const isOctave = f % 12 === 0;
        const dots = isOctave
          ? [
              { x: centerX - 6, y: boardHeight + 18 },
              { x: centerX + 6, y: boardHeight + 18 },
            ]
          : [{ x: centerX, y: boardHeight + 18 }];
        return dots.map(({ x, y }, i) => (
          <circle key={`inlay-${f}-${i}`} cx={x} cy={y} r={4} fill={INLAY_COLOR} />
        ));
      })}

      {/* markers */}
      {markers.map(m => {
        const x = fretX(m.fret) - fretWidth / 2;
        const y = stringY(m.stringIndex);
        const isRoot = m.degree === 1;
        const fill = isRoot ? ROOT_COLOR : NOTE_COLOR;
        const label = showDegrees ? String(m.degree) : pcToName(m.pc, preferSharps);
        return (
          <g key={`m-${m.stringIndex}-${m.fret}`}>
            <circle
              cx={x}
              cy={y}
              r={11}
              fill={fill}
              stroke="rgba(249, 249, 249, 0.85)"
              strokeWidth={isRoot ? 2.2 : 1.4}
              style={{ filter: `drop-shadow(0 0 10px ${fill}66)` }}
            />
            <text
              x={x}
              y={y}
              fontSize="10"
              dominantBaseline="middle"
              textAnchor="middle"
              fill={isRoot ? '#050505' : '#ffffff'}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
