import { useState, type FC } from 'react';
import type { MoodCardProps } from '../types.js';

const MOODS = [
  { emoji: '😢', value: 1, label: 'Very Bad' },
  { emoji: '😐', value: 2, label: 'Bad' },
  { emoji: '🙂', value: 3, label: 'Okay' },
  { emoji: '😊', value: 4, label: 'Good' },
  { emoji: '😄', value: 5, label: 'Great' },
] as const;

export const MoodCard: FC<MoodCardProps> = ({ onRate }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const handleRate = (value: number) => {
    setSelected(value);
    setTimestamp(new Date().toLocaleTimeString());
    onRate(value);
  };

  if (selected !== null) {
    const mood = MOODS.find((m) => m.value === selected);
    return (
      <div className="opto-card opto-mood-card opto-mood-card--confirmed">
        <div className="opto-mood-card__confirmation">
          <span className="opto-mood-card__emoji-large">{mood?.emoji}</span>
          <span className="opto-mood-card__label">
            Mood recorded: {mood?.label}
          </span>
          <span className="opto-mood-card__timestamp">{timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-mood-card">
      <div className="opto-mood-card__header">How are you feeling?</div>
      <div className="opto-mood-card__buttons">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            className="opto-mood-card__btn"
            onClick={() => handleRate(mood.value)}
            aria-label={mood.label}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
