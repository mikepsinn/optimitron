import type { FC } from "react";
import { getOutcomeHubPath } from "@/lib/analysis-explorer-routes";

interface OutcomeCardProps {
  outcome: { label: string; topPredictor: string; score: number; id: string };
}

export const OutcomeCard: FC<OutcomeCardProps> = ({ outcome }) => (
  <div className="opto-card opto-outcome-card">
    <div className="opto-outcome-card__header">
      <span className="opto-outcome-card__icon">📊</span>
      <span className="opto-outcome-card__title">{outcome.label}</span>
    </div>
    <div className="opto-outcome-card__predictor">
      <span className="opto-outcome-card__predictor-label">Top predictor: {outcome.topPredictor}</span>
      <div className="opto-outcome-card__bar-track">
        <div
          className="opto-outcome-card__bar-fill"
          style={{ width: `${Math.min(Math.abs(outcome.score) * 100, 100)}%` }}
        />
      </div>
      <span className="opto-outcome-card__score">{(outcome.score * 100).toFixed(0)}%</span>
    </div>
    <a href={getOutcomeHubPath(outcome.id)} className="opto-outcome-card__link">
      See full analysis
    </a>
  </div>
);
