import type { Prisma } from "../generated/prisma/client.js";

export type SeedTaskImpactMetric = {
  metricKey: string;
  unit: string;
  baseValue: number;
  lowValue?: number | null;
  highValue?: number | null;
  displayGroup?: string | null;
  metadataJson?: Prisma.InputJsonValue;
};

/**
 * Seed impact inputs carry CONDITIONAL (if-success) values straight from the
 * parameter catalog. The persisted frame columns `expected*` must be
 * probability-weighted — the ranking layer treats them as already weighted
 * (see rank-tasks.ts) and sync-managed-tasks.ts writes the same convention.
 */
export type SeedTaskImpactInput = {
  estimatedCashCostUsdBase: number;
  conditionalEconomicValueUsdBase: number;
  conditionalDalysAvertedBase: number;
  delayEconomicValueUsdLostPerDayBase: number;
  delayDalysLostPerDayBase: number;
  successProbabilityBase: number;
  benefitDurationYears: number;
  medianHealthyLifeYearsEffectBase?: number;
  medianIncomeGrowthEffectPpPerYearBase?: number;
  metrics?: SeedTaskImpactMetric[];
};

export function weightSeedImpactFrame(impact: SeedTaskImpactInput): {
  expectedEconomicValueUsdBase: number;
  expectedDalysAvertedBase: number;
} {
  return {
    expectedEconomicValueUsdBase:
      impact.conditionalEconomicValueUsdBase * impact.successProbabilityBase,
    expectedDalysAvertedBase:
      impact.conditionalDalysAvertedBase * impact.successProbabilityBase,
  };
}
