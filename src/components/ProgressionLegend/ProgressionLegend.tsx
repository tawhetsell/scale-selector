import { formatNumeral } from '../../lib/music/chords';
import { stepBack, stepForward } from './legendSteps';

export type LegendChord = {
  numeral: string; // e.g. 'ii7', ASCII ('bVI'); shown with music signs
  name: string;    // e.g. 'F#m7'
  color: string;
};

type Props = {
  chords: LegendChord[];
  currentStep: number; // the legend always has a current chord
  onStepChange: (step: number) => void;
};

/** Chord list with step controls for a multi-chord progression (shared by guitar and piano). */
export default function ProgressionLegend({ chords, currentStep, onStepChange }: Props) {
  const goTo = (step: number | null) => {
    if (step !== null) onStepChange(step);
  };

  return (
    <div className="progression-legend">
      <div className="legend-chords">
        {chords.map((chord, i) => (
          <div
            key={i}
            className={`legend-chord ${currentStep === i ? 'legend-chord--active' : 'legend-chord--dimmed'}`}
            onClick={() => onStepChange(i)}
            role="button"
            tabIndex={0}
            aria-pressed={currentStep === i}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepChange(i);
              }
            }}
          >
            <span className="legend-dot" style={{ background: chord.color }} />
            <span className="legend-numeral">{formatNumeral(chord.numeral)}</span>
            <span className="legend-name">({chord.name})</span>
            {i < chords.length - 1 && <span className="legend-arrow">→</span>}
          </div>
        ))}
      </div>
      <div className="step-controls">
        <button className="step-btn" onClick={() => goTo(stepBack(currentStep, chords.length))} title="Previous chord" aria-label="Previous chord">◀</button>
        <button className="step-btn" onClick={() => goTo(stepForward(currentStep, chords.length))} title="Next chord" aria-label="Next chord">▶</button>
      </div>
    </div>
  );
}
