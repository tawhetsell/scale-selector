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
  const width = padding * 2 + maxFrets * fretWidth + fretWidth; // include nut column
  const height = padding * 2 + (strings - 1) * stringGap;

  const markers = computeFretMap(openPcs, maxFrets, rootPc, intervals);

  const fretX = (fret: number) => padding + fret * fretWidth;
  const stringY = (sIdx: number) => padding + (strings - 1 - sIdx) * stringGap; // highest string on top

  const inlayFrets = [3,5,7,9,12,15,17,19,21,24];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Guitar fretboard">
      {/* board background */}
      <rect x={0} y={0} width={width} height={height} fill="#f6f6f6" rx={8} />

      {/* strings */}
      {openPcs.map((_, s) => (
        <line key={`str-${s}`} x1={padding} y1={stringY(s)} x2={width - padding} y2={stringY(s)} stroke="#999" strokeWidth={1.5}/>
      ))}

      {/* nut */}
      <rect x={fretX(0) - 6} y={padding - 12} width={6} height={height - padding * 2 + 24} fill="#444" />

      {/* frets */}
      {Array.from({ length: maxFrets + 1 }).map((_, f) => (
        <line key={`f-${f}`} x1={fretX(f)} y1={padding - 12} x2={fretX(f)} y2={height - padding + 12} stroke="#ccc" strokeWidth={f % 12 === 0 ? 2 : 1}/>
      ))}

      {/* inlays */}
      {inlayFrets.map(f => {
        const cx = fretX(f) - (fretWidth / 2);
        const isOctave = f % 12 === 0;
        const ys = isOctave ? [height / 2 - 8, height / 2 + 8] : [height / 2];
        return ys.map((y, i) => (
          <circle key={`inlay-${f}-${i}`} cx={cx} cy={y} r={4} fill="#bbb" />
        ));
      })}

      {/* markers */}
      {markers.map(m => {
        const x = fretX(m.fret) - fretWidth / 2;
        const y = stringY(m.stringIndex);
        const isRoot = m.degree === 1;
        const label = showDegrees ? String(m.degree) : pcToName(m.pc, preferSharps);
        return (
          <g key={`m-${m.stringIndex}-${m.fret}`}>
            <circle cx={x} cy={y} r={10} fill={isRoot ? '#ffefd5' : 'white'} stroke={isRoot ? '#d97706' : '#666'} strokeWidth={isRoot ? 2.5 : 1.5}/>
            <text x={x} y={y} fontSize="10" dominantBaseline="middle" textAnchor="middle">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
