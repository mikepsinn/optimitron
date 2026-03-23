/**
 * Jurisdiction-Agnostic Budget Types
 *
 * Generic types for government budget data that work for any jurisdiction
 * (federal, state, city, country). Jurisdiction-specific data files
 * (us-federal-budget.ts, etc.) import these types.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OutcomeMetric {
  /** Human-readable metric name */
  name: string;
  /** Numeric value */
  value: number;
  /** Unit of measurement (e.g. "per 100K", "%", "rank") */
  unit: string;
  /** Year the metric was measured */
  year: number;
  /** Authoritative data source */
  source: string;
  /** Direction of recent trend */
  trend: 'improving' | 'declining' | 'stable';
}

export interface HistoricalSpending {
  year: number;
  /** Outlays in billions of current-year USD */
  amount: number;
}

export interface BudgetCategory {
  /** Stable machine-readable identifier (e.g., 'military', 'education') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Current-year outlays in billions of nominal USD */
  spendingBillions: number;
  /** Percent of total outlays */
  percentOfTotal: number;
  /** Whether this is mandatory or discretionary spending */
  type: 'mandatory' | 'discretionary' | 'net_interest';
  /** Historical outlays */
  historicalSpending: HistoricalSpending[];
  /** Real-world outcome metrics tied to this spending area */
  outcomeMetrics: OutcomeMetric[];
}

export interface JurisdictionBudget {
  /** ISO 3166-1 alpha-3 code or custom jurisdiction identifier */
  jurisdictionCode: string;
  /** Population of this jurisdiction */
  population: number;
  /** Fiscal year of the primary snapshot */
  fiscalYear: number;
  /** Total outlays in billions USD */
  totalOutlays: number;
  /** Total revenues in billions USD */
  totalRevenues: number;
  /** Deficit (negative) or surplus in billions USD */
  deficit: number;
  /** Gross debt in billions USD */
  grossDebt: number;
  /** GDP in billions USD for context */
  gdp: number;
  /** Budget categories with spending and outcomes */
  categories: BudgetCategory[];
  /** Data sources and methodology notes */
  metadata: {
    sources: string[];
    methodology: string;
    lastUpdated: string;
  };
}

