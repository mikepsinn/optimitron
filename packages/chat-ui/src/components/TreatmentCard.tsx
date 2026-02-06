import { useState, type FC } from 'react';
import type { TreatmentCardProps, TreatmentAction } from '../types.js';

const SNOOZE_OPTIONS = [
  { minutes: 15, label: '15min' },
  { minutes: 30, label: '30min' },
  { minutes: 60, label: '1hr' },
] as const;

export const TreatmentCard: FC<TreatmentCardProps> = ({ name, dose, onAction }) => {
  const [showSnooze, setShowSnooze] = useState(false);
  const [completed, setCompleted] = useState<TreatmentAction | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState<number | undefined>();

  const handleAction = (action: TreatmentAction, minutes?: number) => {
    setCompleted(action);
    setSnoozeMinutes(minutes);
    onAction(action, minutes);
  };

  if (completed !== null) {
    const labels: Record<TreatmentAction, string> = {
      done: '✅ Taken',
      skip: '⏭️ Skipped',
      snooze: `⏰ Snoozed ${snoozeMinutes ?? ''}min`,
    };
    return (
      <div className="opto-card opto-treatment-card opto-treatment-card--completed">
        <div className="opto-treatment-card__header">
          <span className="opto-treatment-card__name">{name}</span>
          <span className="opto-treatment-card__dose">{dose}</span>
        </div>
        <div className="opto-treatment-card__status">{labels[completed]}</div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-treatment-card">
      <div className="opto-treatment-card__header">
        <span className="opto-treatment-card__name">{name}</span>
        <span className="opto-treatment-card__dose">{dose}</span>
      </div>
      {showSnooze ? (
        <div className="opto-treatment-card__snooze-options">
          <span className="opto-treatment-card__snooze-label">Snooze for:</span>
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              className="opto-treatment-card__snooze-btn"
              onClick={() => handleAction('snooze', opt.minutes)}
            >
              {opt.label}
            </button>
          ))}
          <button
            className="opto-treatment-card__snooze-cancel"
            onClick={() => setShowSnooze(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="opto-treatment-card__actions">
          <button
            className="opto-treatment-card__btn opto-treatment-card__btn--done"
            onClick={() => handleAction('done')}
          >
            ✅ Done
          </button>
          <button
            className="opto-treatment-card__btn opto-treatment-card__btn--skip"
            onClick={() => handleAction('skip')}
          >
            ⏭️ Skip
          </button>
          <button
            className="opto-treatment-card__btn opto-treatment-card__btn--snooze"
            onClick={() => setShowSnooze(true)}
          >
            ⏰ Snooze
          </button>
        </div>
      )}
    </div>
  );
};
