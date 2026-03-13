"use client";

import type { FC } from "react";

interface BudgetResultCardProps {
  allocations: Record<string, number>;
  actualAllocations?: Record<string, number>;
}

export const BudgetResultCard: FC<BudgetResultCardProps> = ({ allocations, actualAllocations }) => {
  const sorted = Object.entries(allocations).sort(([, a], [, b]) => b - a);
  const maxPct = Math.max(...sorted.map(([, v]) => v), 1);

  return (
    <div className="opto-card opto-budget-result">
      <div className="opto-budget-result__header">Your Budget Allocation</div>
      <div className="opto-budget-result__bars">
        {sorted.map(([name, pct]) => (
          <div key={name} className="opto-budget-result__row">
            <span className="opto-budget-result__name">{name}</span>
            <div className="opto-budget-result__bar-track">
              <div
                className="opto-budget-result__bar-fill opto-budget-result__bar-fill--user"
                style={{ width: `${(pct / maxPct) * 100}%` }}
              />
              {actualAllocations?.[name] != null && (
                <div
                  className="opto-budget-result__bar-fill opto-budget-result__bar-fill--actual"
                  style={{ width: `${((actualAllocations[name] ?? 0) / maxPct) * 100}%` }}
                />
              )}
            </div>
            <span className="opto-budget-result__pct">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      {actualAllocations && (
        <div className="opto-budget-result__legend">
          <span className="opto-budget-result__legend-item opto-budget-result__legend-item--user">You</span>
          <span className="opto-budget-result__legend-item opto-budget-result__legend-item--actual">US Gov</span>
        </div>
      )}
      <a href="/wishocracy" className="opto-budget-result__link">See your full alignment report</a>
    </div>
  );
};
