import type { FC } from 'react';
import type { InsightCardProps } from '../types.js';

export const InsightCard: FC<InsightCardProps> = ({
  title,
  body,
  icon = '💡',
  showChart = false,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="opto-card opto-insight-card">
      <div className="opto-insight-card__header">
        <span className="opto-insight-card__icon">{icon}</span>
        <span className="opto-insight-card__title">{title}</span>
      </div>
      <div className="opto-insight-card__body">{body}</div>
      {showChart && (
        <div className="opto-insight-card__chart-placeholder">
          📊 Chart
        </div>
      )}
      {actionLabel && onAction && (
        <button className="opto-insight-card__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
