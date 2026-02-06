/**
 * Cost-Effectiveness Threshold Analysis
 * 
 * Estimates Optimal Spending Levels from intervention-level
 * cost-effectiveness data (cost per QALY/DALY).
 * 
 * @see https://obg.warondisease.org/#cost-effectiveness-threshold-analysis
 */

export interface Intervention {
  id: string;
  name: string;
  categoryId: string;
  targetPopulation: number;      // Number of people who could benefit
  costPerPerson: number;         // USD per person
  qalyPerPerson: number;         // QALYs gained per person
  costPerQaly: number;           // Derived: cost / QALY
  source: string;
  year: number;
}

export interface CEAThresholdConfig {
  /** Willingness-to-pay per QALY (USD) */
  wtpThreshold: number;
  /** Include interventions below this cost-effectiveness threshold */
  includeAboveThreshold: boolean;
}

const DEFAULT_WTP_THRESHOLD = 100_000; // $100K per QALY (mid-range US)

/**
 * Filter interventions by cost-effectiveness threshold
 */
export function filterByCostEffectiveness(
  interventions: Intervention[],
  wtpThreshold: number = DEFAULT_WTP_THRESHOLD
): Intervention[] {
  return interventions
    .filter(i => i.costPerQaly <= wtpThreshold)
    .sort((a, b) => a.costPerQaly - b.costPerQaly); // Most cost-effective first
}

/**
 * Calculate OSL from intervention-level cost-effectiveness data
 * Sum of (targetPopulation × costPerPerson) for all cost-effective interventions
 */
export function calculateOSLFromCEA(
  interventions: Intervention[],
  wtpThreshold: number = DEFAULT_WTP_THRESHOLD
): {
  oslUsd: number;
  totalQalys: number;
  interventionCount: number;
  includedInterventions: Intervention[];
} {
  const included = filterByCostEffectiveness(interventions, wtpThreshold);
  
  const oslUsd = included.reduce(
    (sum, i) => sum + i.targetPopulation * i.costPerPerson,
    0
  );
  
  const totalQalys = included.reduce(
    (sum, i) => sum + i.targetPopulation * i.qalyPerPerson,
    0
  );
  
  return {
    oslUsd,
    totalQalys,
    interventionCount: included.length,
    includedInterventions: included,
  };
}

/**
 * Calculate aggregate cost per QALY for a set of interventions
 */
export function aggregateCostPerQaly(interventions: Intervention[]): number {
  const totalCost = interventions.reduce(
    (sum, i) => sum + i.targetPopulation * i.costPerPerson,
    0
  );
  const totalQalys = interventions.reduce(
    (sum, i) => sum + i.targetPopulation * i.qalyPerPerson,
    0
  );
  return totalCost / totalQalys;
}

/**
 * Value conversions for multi-unit reporting
 */
export const VALUE_CONVERSIONS = {
  /** Value of Statistical Life (EPA/DOT standard) */
  VSL_USD: 10_000_000,
  
  /** Value per QALY (mid-range) */
  QALY_USD: 100_000,
  
  /** Life-year to QALY conversion (age-adjusted average) */
  LIFE_YEAR_TO_QALY: 0.85,
};

/**
 * Convert QALYs to monetary value
 */
export function qalysToUsd(
  qalys: number,
  valuePerQaly: number = VALUE_CONVERSIONS.QALY_USD
): number {
  return qalys * valuePerQaly;
}

/**
 * Calculate ROI from cost and QALYs gained
 */
export function calculateROI(
  costUsd: number,
  qalysGained: number,
  valuePerQaly: number = VALUE_CONVERSIONS.QALY_USD
): number {
  const monetizedBenefit = qalysToUsd(qalysGained, valuePerQaly);
  return monetizedBenefit / costUsd;
}
