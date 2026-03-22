/**
 * Efficiency Analysis — Unified Cross-Country Spending Efficiency
 *
 * Combines efficient frontier ranking, minimum effective spending (floor),
 * and overspend ratio into a single per-category analysis for a jurisdiction.
 *
 * This is the canonical type for "how does this jurisdiction compare to peers?"
 * Used by report generators, web UI, and legislation drafter.
 */

import { z } from 'zod';
import {
  efficientFrontier,
  type CountryEfficiencyDatum,
} from './efficient-frontier.js';
import {
  findMinimumEffectiveSpending,
  type SpendingDecile,
} from './minimum-effective-spending.js';
import type { SpendingOutcomePoint } from './diminishing-returns.js';

// ─── Types ──────────────────────────────────────────────────────────

export const CountryComparisonSchema = z.object({
  code: z.string(),
  name: z.string(),
  spending: z.number(),
  outcome: z.number(),
  rank: z.number(),
});

export type CountryComparison = z.infer<typeof CountryComparisonSchema>;

export const EfficiencyAnalysisSchema = z.object({
  /** This jurisdiction's efficiency rank (1 = most efficient) */
  rank: z.number().int().positive(),
  /** Total countries compared */
  totalCountries: z.number().int().positive(),
  /** This jurisdiction's spending per capita */
  spending: z.number(),
  /** This jurisdiction's outcome value */
  outcome: z.number(),
  /** Outcome metric name (e.g., "Life Expectancy") */
  outcomeName: z.string(),
  /** Most efficient country */
  bestCountry: CountryComparisonSchema,
  /** Top 3 most efficient countries */
  topEfficient: z.array(CountryComparisonSchema),
  /** Minimum effective spending level (floor) */
  floorSpending: z.number(),
  /** Outcome at the floor spending level */
  floorOutcome: z.number(),
  /** Overspend ratio: actual / floor (>1 = overspending) */
  overspendRatio: z.number(),
  /** Potential savings per capita if spending at floor */
  potentialSavingsPerCapita: z.number(),
  /** Potential total savings (per capita × population) */
  potentialSavingsTotal: z.number(),
});

export type EfficiencyAnalysis = z.infer<typeof EfficiencyAnalysisSchema>;

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Build spending deciles from per-country data points.
 * Groups countries into 10 bins by spending level, computes average outcome per bin.
 */
function buildDeciles(
  countries: Array<{ spending: number; outcome: number }>,
): SpendingDecile[] {
  const sorted = [...countries].sort((a, b) => a.spending - b.spending);
  const decileSize = Math.max(1, Math.floor(sorted.length / 10));
  const deciles: SpendingDecile[] = [];

  for (let d = 0; d < 10; d++) {
    const start = d * decileSize;
    const end = d === 9 ? sorted.length : start + decileSize;
    const slice = sorted.slice(start, end);
    if (slice.length === 0) continue;
    const avgSpending = slice.reduce((s, c) => s + c.spending, 0) / slice.length;
    const avgOutcome = slice.reduce((s, c) => s + c.outcome, 0) / slice.length;
    deciles.push({ decile: d + 1, avgSpending, outcome: avgOutcome });
  }
  return deciles;
}

/**
 * Average the latest N data points per jurisdiction from spending→outcome pairs.
 */
function latestAverages(
  data: SpendingOutcomePoint[],
  latestN: number = 3,
): Array<{ code: string; spending: number; outcome: number }> {
  const byJurisdiction = new Map<string, SpendingOutcomePoint[]>();
  for (const d of data) {
    const existing = byJurisdiction.get(d.jurisdiction);
    if (existing) {
      existing.push(d);
    } else {
      byJurisdiction.set(d.jurisdiction, [d]);
    }
  }

  return [...byJurisdiction.entries()].map(([code, points]) => {
    const recent = points.slice(-latestN);
    const avgS = recent.reduce((s, p) => s + p.spending, 0) / recent.length;
    const avgO = recent.reduce((s, p) => s + p.outcome, 0) / recent.length;
    return { code, spending: avgS, outcome: avgO };
  }).filter(c => c.spending > 0);
}

// ─── Main Function ──────────────────────────────────────────────────

export interface AnalyzeEfficiencyOptions {
  /** ISO3 code of the jurisdiction to analyze (default: 'USA') */
  jurisdictionCode?: string;
  /** Population for total savings calculation */
  population?: number;
  /** Human-readable country names: code → name */
  countryNames?: Record<string, string>;
  /** Name of the outcome metric (e.g., 'Life Expectancy') */
  outcomeName?: string;
  /** Tolerance for minimum effective spending floor detection */
  floorTolerance?: number;
}

/**
 * Run unified efficiency analysis for a jurisdiction against cross-country data.
 *
 * Combines:
 * 1. Efficient frontier ranking (outcome-per-dollar)
 * 2. Minimum effective spending floor detection
 * 3. Overspend ratio calculation
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
    floorTolerance = 1,
  } = options;

  // Average latest data per country
  const countries = latestAverages(data);
  if (countries.length < 5) return null;

  const target = countries.find(c => c.code === jurisdictionCode);
  if (!target) return null;

  const nameOf = (code: string) => countryNames[code] ?? code;

  // 1. Efficient frontier — rank by outcome-per-dollar
  const frontierResult = efficientFrontier([{
    categoryId: 'analysis',
    categoryName: outcomeName,
    outcomeDirection: 'higher',
    countries: countries.map(c => ({
      countryCode: c.code,
      countryName: nameOf(c.code),
      spending: c.spending,
      outcome: c.outcome,
    })),
  }]);

  const rankings = frontierResult[0]?.rankings ?? [];
  const targetRanking = rankings.find(r => r.countryCode === jurisdictionCode);
  if (!targetRanking) return null;

  // 2. Minimum effective spending floor
  const deciles = buildDeciles(countries);
  const floorResult = findMinimumEffectiveSpending([{
    categoryId: 'analysis',
    categoryName: outcomeName,
    deciles,
  }], {
    outcomeTolerance: floorTolerance,
    outcomeDirection: 'higher',
  });

  const floor = floorResult[0];
  let floorSpending = floor?.floorSpending ?? target.spending;
  const floorOutcome = floor?.floorOutcome ?? target.outcome;

  // Clamp floor to not exceed the best country's spending.
  // The decile-based floor can be higher than the single best performer
  // because it averages multiple countries in a bin. But the floor should
  // never exceed the best — that's the definition of "minimum effective."
  const bestSpending = rankings[0]?.spending ?? floorSpending;
  floorSpending = Math.min(floorSpending, bestSpending);

  // 3. Overspend ratio
  const ratio = floorSpending > 0 ? target.spending / floorSpending : 1;
  const savingsPerCapita = Math.max(0, target.spending - floorSpending);

  // Top 3 efficient
  const topEfficient: CountryComparison[] = rankings.slice(0, 3).map(r => ({
    code: r.countryCode,
    name: nameOf(r.countryCode),
    spending: Math.round(r.spending),
    outcome: Math.round(r.outcome * 100) / 100,
    rank: r.rank,
  }));

  const best = rankings[0]!;

  return {
    rank: targetRanking.rank,
    totalCountries: rankings.length,
    spending: Math.round(target.spending),
    outcome: Math.round(target.outcome * 100) / 100,
    outcomeName,
    bestCountry: {
      code: best.countryCode,
      name: nameOf(best.countryCode),
      spending: Math.round(best.spending),
      outcome: Math.round(best.outcome * 100) / 100,
      rank: 1,
    },
    topEfficient,
    floorSpending: Math.round(floorSpending),
    floorOutcome: Math.round(floorOutcome * 100) / 100,
    overspendRatio: Math.round(ratio * 10) / 10,
    potentialSavingsPerCapita: Math.round(savingsPerCapita),
    potentialSavingsTotal: Math.round(savingsPerCapita * population),
  };
}
