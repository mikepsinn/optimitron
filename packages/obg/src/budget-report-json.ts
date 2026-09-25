/**
 * Type definitions for the budget analysis report.
 *
 * These types are the contract between:
 *   - The generator (packages/examples/generate-web-data.ts)
 *   - The web app (apps/optimitron/src/data/us-budget-analysis.ts)
 *
 * The generated .ts file uses `satisfies BudgetReportJSON` so TypeScript
 * validates the data at compile time. No runtime validation needed.
 */

import type { EfficiencyAnalysis } from './efficiency-analysis.js';
import type { EfficiencyEvidenceScope } from './efficiency-attribution.js';

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

/** The cross-country field behind a category's `efficiency`, and whether it measures the category itself. */
export interface BudgetReportOecdBenchmark {
  /** OECD panel spending field, e.g. 'militarySpendingPerCapitaPpp' */
  spendingField: string;
  /** What the field measures, e.g. 'Total health spending, public and private' */
  fieldLabel: string;
  /** `national_field_proxy` means `efficiency` describes the field, not this line */
  scope: EfficiencyEvidenceScope;
  /** This line's real spending per capita ÷ the field's spending per capita */
  lineShareOfField: number;
}

export interface BudgetReportCategory {
  id: string;
  name: string;
  currentSpending: number;
  currentSpendingRealPerCapita: number;
  /** Null when no benchmark measures this line (see `oecdBenchmark.scope`) */
  optimalSpendingPerCapita: number | null;
  /** Null when no benchmark measures this line (see `oecdBenchmark.scope`) */
  optimalSpendingNominal: number | null;
  /** current − optimal; 0 when the optimal is null */
  gap: number;
  gapPercent: number;
  recommendation: string;
  evidenceSource: string;
  outcomeMetrics: BudgetReportOutcomeMetric[];
  historicalRealPerCapita?: BudgetReportHistoricalPoint[];
  diminishingReturns?: BudgetReportDiminishingReturns;
  efficiency?: EfficiencyAnalysis;
  oecdBenchmark?: BudgetReportOecdBenchmark;
}

export interface EfficientFrontierDecile {
  decile: number;
  spending: number;
  outcome: number;
  countries: number;
}

export interface EfficientFrontierCategory {
  spendingField: string;
  outcomeField: string;
  outcomeName: string;
  deciles: EfficientFrontierDecile[];
}

export interface EfficientFrontierTotals {
  usCurrentTotalPerCapita: number;
  efficientFrontierTotalPerCapita: number;
  ratio: number;
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
  /** Efficient frontier decile data for scatter plot visualization */
  efficientFrontier?: {
    categories: Record<string, EfficientFrontierCategory>;
    totals: EfficientFrontierTotals;
  };
}
