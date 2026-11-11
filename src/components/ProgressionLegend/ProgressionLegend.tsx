import { useCallback } from 'react';

export type LegendChord = {
  numeral: string; // e.g. 'ii7'
  name: string;    // e.g. 'F#m7'
  color: string;
};

type Props = {
  chords: LegendChord[];
  currentStep: number | null;
  onStepChange: (step: number | null) => void;
};

/** Chord list with step controls for a multi-chord progression (shared by guitar and piano). */
export default function ProgressionLegend({ chords, currentStep, onStepChange }: Props) {
  const handlePrevStep = useCallback(() => {
    if (currentStep === null) {
      onStepChange(chords.length - 1);
    } else if (currentStep === 0) {
      onStepChange(null);
    } else {
      onStepChange(currentStep - 1);
    }
  }, [chords.length, currentStep, onStepChange]);

  const handleNextStep = useCallback(() => {
    if (currentStep === null) {
      onStepChange(0);
    } else if (currentStep >= chords.length - 1) {
      onStepChange(null);
    } else {
      onStepChange(currentStep + 1);
    }
  }, [chords.length, currentStep, onStepChange]);

  return (
    <div className="progression-legend">
      <div className="legend-chords">
        {chords.map((chord, i) => (
          <div
            key={i}
            className={`legend-chord ${currentStep === i ? 'legend-chord--active' : ''} ${currentStep !== null && currentStep !== i ? 'legend-chord--dimmed' : ''}`}
            onClick={() => onStepChange(currentStep === i ? null : i)}
            role="button"
            tabIndex={0}
            aria-pressed={currentStep === i}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepChange(currentStep === i ? null : i);
              }
            }}
          >
            <span className="legend-dot" style={{ background: chord.color }} />
            <span className="legend-numeral">{chord.numeral}</span>
            <span className="legend-name">({chord.name})</span>
            {i < chords.length - 1 && <span className="legend-arrow">→</span>}
          </div>
        ))}
      </div>
      <div className="step-controls">
        <button className="step-btn" onClick={handlePrevStep} title="Previous chord">◀</button>
        <button className="step-btn step-btn--all" onClick={() => onStepChange(null)} title="Show all chords">All</button>
        <button className="step-btn" onClick={handleNextStep} title="Next chord">▶</button>
      </div>
    </div>
  );
}
