import { useState, type FC } from 'react';
import type { PairwiseCardProps } from '../types.js';

const PRESETS = [
  { label: '80/20', value: 80 },
  { label: '60/40', value: 60 },
  { label: '50/50', value: 50 },
  { label: '40/60', value: 40 },
  { label: '20/80', value: 20 },
] as const;

export const PairwiseCard: FC<PairwiseCardProps> = ({ itemA, itemB, onCompare }) => {
  const [allocation, setAllocation] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (value: number) => {
    setAllocation(value);
    setSubmitted(true);
    onCompare(value);
  };

  if (submitted) {
    return (
      <div className="opto-card opto-pairwise-card opto-pairwise-card--submitted">
        <div className="opto-pairwise-card__result">
          <span className="opto-pairwise-card__item">{itemA}: {allocation}%</span>
          <span className="opto-pairwise-card__divider">|</span>
          <span className="opto-pairwise-card__item">{itemB}: {100 - allocation}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-pairwise-card">
      <div className="opto-pairwise-card__header">
        How would you allocate between these?
      </div>
      <div className="opto-pairwise-card__items">
        <span className="opto-pairwise-card__item-label">{itemA}</span>
        <span className="opto-pairwise-card__vs">vs</span>
        <span className="opto-pairwise-card__item-label">{itemB}</span>
      </div>
      <div className="opto-pairwise-card__slider-container">
        <span className="opto-pairwise-card__alloc">{allocation}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={allocation}
          onChange={(e) => setAllocation(Number(e.target.value))}
          className="opto-pairwise-card__slider"
          aria-label={`Allocation for ${itemA}`}
        />
        <span className="opto-pairwise-card__alloc">{100 - allocation}%</span>
      </div>
      <div className="opto-pairwise-card__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="opto-pairwise-card__preset-btn"
            onClick={() => handleSubmit(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button
        className="opto-pairwise-card__submit"
        onClick={() => handleSubmit(allocation)}
      >
        Confirm
      </button>
    </div>
  );
};
