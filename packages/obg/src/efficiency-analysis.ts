/**
 * Efficiency Analysis — "Cheapest High Performer"
 *
 * For each spending category, finds countries that achieve top-quartile
 * outcomes at the lowest cost. This is the canonical algorithm for
 * "who does this well and cheaply?"
 *
 * Algorithm:
 * 1. Compute 75th percentile outcome across all panel countries
 * 2. Filter to "high performers" (at or above 75th percentile)
 * 3. Rank high performers by spending (lowest first)
 * 4. "Best value" = cheapest high performer
 * 5. "Floor" = best value's spending
 * 6. Overspend = target jurisdiction spending / floor
 *
 * No GDP filters, no jurisdiction-centric logic, no clamping.
 * Works for any jurisdiction as the target.
 */

import { z } from 'zod';
import type { SpendingOutcomePoint } from './diminishing-returns.js';

// ─── Types ──────────────────────────────────────────────────────────

export const CountryComparisonSchema = z.object({
  code: z.string(),
  name: z.string(),
  spendingPerCapita: z.number(),
  outcome: z.number(),
  rank: z.number(),
});

export type CountryComparison = z.infer<typeof CountryComparisonSchema>;

export const EfficiencyAnalysisSchema = z.object({
  /** Every compared country has observations for this exact set of years. */
  comparisonYears: z.array(z.number().int()).optional(),
  /** Target jurisdiction's efficiency rank (by outcome/spending ratio, 1 = best) */
  rank: z.number().int().positive(),
  /** Total countries compared */
  totalCountries: z.number().int().positive(),
  /** Target jurisdiction's spending per capita */
  spendingPerCapita: z.number(),
  /** Target jurisdiction's outcome value */
  outcome: z.number(),
  /** Outcome metric name */
  outcomeName: z.string(),
  /** Cheapest high performer (best value) */
  bestCountry: CountryComparisonSchema,
  /** Top 3 cheapest high performers */
  topEfficient: z.array(CountryComparisonSchema),
  /** Floor spending per capita = cheapest high performer's spending */
  floorSpendingPerCapita: z.number(),
  /** Floor outcome = cheapest high performer's outcome */
  floorOutcome: z.number(),
  /** Overspend ratio: target spending / floor (>1 = overspending) */
  overspendRatio: z.number(),
  /** Potential savings per capita if spending at floor */
  potentialSavingsPerCapita: z.number(),
  /** Potential total savings (per capita × population) */
  potentialSavingsTotal: z.number(),
});

export type EfficiencyAnalysis = z.infer<typeof EfficiencyAnalysisSchema>;

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Find the latest target year with at least five same-year comparators.
 * Average up to three target observation years only when every included
 * country has that exact set. Never substitute a country's own latest years.
 */
function alignedAverages(
  data: SpendingOutcomePoint[],
  targetCode: string,
): { years: number[]; countries: Array<{ code: string; spending: number; outcome: number }> } | null {
  const byJurisdiction = new Map<string, Map<number, SpendingOutcomePoint>>();
  for (const d of data) {
    if (!Number.isInteger(d.year) || !Number.isFinite(d.spending)
      || !Number.isFinite(d.outcome) || d.spending <= 0) continue;
    const years = byJurisdiction.get(d.jurisdiction) ?? new Map<number, SpendingOutcomePoint>();
    years.set(d.year, d);
    byJurisdiction.set(d.jurisdiction, years);
  }

  const targetYears = [...(byJurisdiction.get(targetCode)?.keys() ?? [])].sort((a, b) => b - a);
  for (let end = 0; end < targetYears.length; end++) {
    for (let size = Math.min(3, targetYears.length - end); size >= 1; size--) {
      const years = targetYears.slice(end, end + size).sort((a, b) => a - b);
      const countries = [...byJurisdiction.entries()]
        .flatMap(([code, points]) => {
          const aligned = years.flatMap(year => {
            const point = points.get(year);
            return point ? [point] : [];
          });
          if (aligned.length !== years.length) return [];
          return [{
            code,
            spending: aligned.reduce((sum, point) => sum + point.spending, 0) / years.length,
            outcome: aligned.reduce((sum, point) => sum + point.outcome, 0) / years.length,
          }];
        });
      if (countries.length >= 5) return { years, countries };
    }
  }
  return null;
}

// ─── Main Function ──────────────────────────────────────────────────

export interface AnalyzeEfficiencyOptions {
  /** ISO3 code of the target jurisdiction (default: 'USA') */
  jurisdictionCode?: string;
  /** Population for total savings calculation */
  population?: number;
  /** Human-readable country names: code → name */
  countryNames?: Record<string, string>;
  /** Name of the outcome metric */
  outcomeName?: string;
}

/**
 * "Cheapest High Performer" efficiency analysis.
 *
 * @param data - Cross-country spending→outcome pairs (e.g., from OECD panel)
 * @param options - Configuration
 * @returns EfficiencyAnalysis or null if insufficient data
 */
export function analyzeEfficiency(
  data: SpendingOutcomePoint[],
  options: AnalyzeEfficiencyOptions = {},
): EfficiencyAnalysis | null {
  const {
    jurisdictionCode = 'USA',
    population = 339_000_000,
    countryNames = {},
    outcomeName = 'Outcome',
  } = options;

  const aligned = alignedAverages(data, jurisdictionCode);
  if (!aligned) return null;
  const { countries } = aligned;

  const target = countries.find(c => c.code === jurisdictionCode);
  if (!target) return null;

  const nameOf = (code: string) => countryNames[code] ?? code;

  // 1. Compute 75th percentile outcome
  const sortedOutcomes = countries.map(c => c.outcome).sort((a, b) => a - b);
  const p75Index = Math.floor(sortedOutcomes.length * 0.75);
  const p75 = sortedOutcomes[p75Index] ?? sortedOutcomes[sortedOutcomes.length - 1] ?? 0;

  // 2. High performers: at or above 75th percentile, sorted by spending (cheapest first)
  // A country at or above the 75th percentile can still score below the target,
  // and the output claims the target "pays more and ranks lower". Only accept a
  // floor that does at least as well as the target, so the claim stays true.
  const highPerformers = countries
    .filter(c => c.outcome >= p75 && (c.code === jurisdictionCode || c.outcome >= target.outcome))
    .sort((a, b) => a.spending - b.spending || a.code.localeCompare(b.code));

  if (highPerformers.length === 0) return null;

  // 3. Best value = cheapest high performer
  const bestValue = highPerformers[0];
  if (!bestValue) return null;

  // 4. Floor = best value's per-capita spending
  const floor = bestValue.spending;
  const ratio = floor > 0 ? target.spending / floor : 1;
  const savingsPerCapita = Math.max(0, target.spending - floor);

  // 5. Top 3 cheapest high performers (map internal `spending` → output `spendingPerCapita`)
  const topEfficient: CountryComparison[] = highPerformers.slice(0, 3).map((c, i) => ({
    code: c.code,
    name: nameOf(c.code),
    spendingPerCapita: Math.round(c.spending),
    outcome: Math.round(c.outcome * 100) / 100,
    rank: i + 1,
  }));

  // 6. Rank target by outcome/spending ratio (for context)
  const allByRatio = [...countries]
    .sort((a, b) => (b.outcome / b.spending) - (a.outcome / a.spending) || a.code.localeCompare(b.code));
  const targetRank = allByRatio.findIndex(c => c.code === jurisdictionCode) + 1;

  return {
    comparisonYears: aligned.years,
    rank: targetRank,
    totalCountries: countries.length,
    spendingPerCapita: Math.round(target.spending),
    outcome: Math.round(target.outcome * 100) / 100,
    outcomeName,
    bestCountry: {
      code: bestValue.code,
      name: nameOf(bestValue.code),
      spendingPerCapita: Math.round(bestValue.spending),
      outcome: Math.round(bestValue.outcome * 100) / 100,
      rank: 1,
    },
    topEfficient,
    floorSpendingPerCapita: Math.round(floor),
    floorOutcome: Math.round(bestValue.outcome * 100) / 100,
    overspendRatio: Math.round(ratio * 10) / 10,
    potentialSavingsPerCapita: Math.round(savingsPerCapita),
    potentialSavingsTotal: Math.round(savingsPerCapita * population),
  };
}
