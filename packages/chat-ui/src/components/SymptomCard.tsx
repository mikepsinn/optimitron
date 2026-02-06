import { useState, type FC } from 'react';
import type { SymptomCardProps } from '../types.js';

/** Color gradients for symptom severity */
const POSITIVE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'] as const;
const NEGATIVE_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'] as const;

export const SymptomCard: FC<SymptomCardProps> = ({ name, valence, onRate }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const colors = valence === 'positive' ? POSITIVE_COLORS : NEGATIVE_COLORS;

  const handleRate = (value: number) => {
    setSelected(value);
    onRate(value);
  };

  if (selected !== null) {
    const colorIndex = selected - 1;
    const color = colors[colorIndex] ?? colors[0];
    return (
      <div className="opto-card opto-symptom-card opto-symptom-card--confirmed">
        <div className="opto-symptom-card__header">{name}</div>
        <div className="opto-symptom-card__result">
          <span
            className="opto-symptom-card__badge"
            style={{ backgroundColor: color }}
          >
            {selected}/5
          </span>
          <span className="opto-symptom-card__recorded">Recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-symptom-card">
      <div className="opto-symptom-card__header">{name}</div>
      <div className="opto-symptom-card__scale">
        {[1, 2, 3, 4, 5].map((value) => {
          const colorIndex = value - 1;
          const color = colors[colorIndex] ?? colors[0];
          return (
            <button
              key={value}
              className="opto-symptom-card__btn"
              style={{ backgroundColor: color }}
              onClick={() => handleRate(value)}
              aria-label={`Rate ${name} ${value} out of 5`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
};
