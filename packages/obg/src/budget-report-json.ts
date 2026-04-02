/**
 * Type definitions for the budget analysis report.
 *
 * These types are the contract between:
 *   - The generator (packages/examples/generate-web-data.ts)
 *   - The web app (packages/web/src/data/us-budget-analysis.ts)
 *
 * The generated .ts file uses `satisfies BudgetReportJSON` so TypeScript
 * validates the data at compile time. No runtime validation needed.
 */

import type { EfficiencyAnalysis } from './efficiency-analysis.js';

export interface BudgetReportDiminishingReturns {
  modelType: string;
  r2: number;
  n: number;
  marginalReturn: number;
  elasticity: number | null;
  outcomeName: string;
}

export interface BudgetReportOutcomeMetric {
  name: string;
  value: number;
  trend: string;
}

export interface BudgetReportHistoricalPoint {
  year: number;
  nominalBillions: number;
  realPerCapita: number;
}

export interface BudgetReportCategory {
  id: string;
  name: string;
  currentSpending: number;
  currentSpendingRealPerCapita: number;
  optimalSpendingPerCapita: number;
  optimalSpendingNominal: number;
  gap: number;
  gapPercent: number;
  recommendation: string;
  evidenceSource: string;
  outcomeMetrics: BudgetReportOutcomeMetric[];
  historicalRealPerCapita?: BudgetReportHistoricalPoint[];
  diminishingReturns?: BudgetReportDiminishingReturns;
  efficiency?: EfficiencyAnalysis;
}

export interface BudgetReportJSON {
  jurisdiction: string;
  totalSpendingNominal: number;
  categories: BudgetReportCategory[];
  topRecommendations: string[];
  generatedAt: string;
  generatedBy?: string;
  inflationAdjustment?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  note?: string;
}
