/**
 * Multi-Outcome Budget Optimization
 *
 * Extends the single-outcome budget optimizer to optimize across MULTIPLE
 * outcomes simultaneously using a weighted welfare function.
 *
 * Key insight: different spending categories affect different outcomes
 * (income, health, safety, environment, etc.). A single-outcome optimizer
 * can only rank categories by their effect on ONE metric. Multi-outcome
 * optimization computes a weighted welfare score across all outcomes and
 * finds the allocation that maximizes total welfare.
 *
 * Welfare function:
 *   welfare_i = Σ_k (weight_k × z_score_ik)
 * where z_score normalizes across different outcome scales:
 *   z_score_ik = (meanPercentChange_ik − μ_k) / σ_k
 *
 * "returnToCitizens" virtual category:
 *   If every category's spending is less effective per dollar than simply
 *   returning money to citizens (tax cuts → income growth), the rational
 *   choice is to shrink government. This baseline ensures every category
 *   must beat the counterfactual.
 *
 * @see optimize-budget.ts for the single-outcome version (unchanged)
 */

import {
  analyzeJurisdiction,
  type AnnualTimeSeries,
  type CountryAnalysisConfig,
  type JurisdictionResult,
} from './country-analysis.js';

// ─── Types ───────────────────────────────────────────────────────────

/** A single outcome to optimize for */
export interface OutcomeConfig {
  /** Unique outcome identifier */
  outcomeId: string;
  /** Human-readable name */
  outcomeName: string;
  /** Weight in the welfare function (will be normalized to sum to 1) */
  weight: number;
  /** Outcome time series across multiple jurisdictions */
  data: AnnualTimeSeries[];
}

/** A budget category for multi-outcome optimization */
export interface MultiOutcomeCategoryInput {
  /** Category identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Current spending in USD for the target jurisdiction */
  currentSpendingUsd: number;
  /** Spending time series across multiple jurisdictions */
  spendingSeries: AnnualTimeSeries[];
}

/** Input to the multi-outcome budget optimization pipeline */
export interface MultiOutcomeBudgetInput {
  /** Name of the jurisdiction being optimized */
  jurisdictionName: string;
  /** Target jurisdiction's ISO code */
  jurisdictionId: string;
  /** Total budget to allocate (fixed constraint) */
  totalBudgetUsd: number;
  /** Budget categories with spending data (outcomes are separate) */
  categories: MultiOutcomeCategoryInput[];
  /** Outcomes to optimize across (with weights) */
  outcomes: OutcomeConfig[];
  /**
   * Population of the target jurisdiction.
   * When provided, converts per-capita optimal values back to total budget amounts.
   */
  population?: number;
  /**
   * Whether to include a "return to citizens" virtual category.
   * This models: "what if we just gave this money back as tax cuts?"
   * The income outcome is used as the baseline return.
   * Default: false
   */
  includeReturnToCitizens?: boolean;
  /**
   * If includeReturnToCitizens is true, which outcomeId corresponds to
   * income/economic growth? Defaults to the first outcome.
   */
  returnToCitizensOutcomeId?: string;
  /** Analysis config overrides */
  config?: Partial<CountryAnalysisConfig>;
}

/** Per-outcome analysis result for a single category */
export interface CategoryOutcomeResult {
  outcomeId: string;
  outcomeName: string;
  /** Mean z-score across countries for this outcome */
  meanZScore: number;
  /** Mean % change from baseline */
  meanPercentChange: number;
  /** Mean forward Pearson */
  meanForwardPearson: number;
  /** Countries analyzed for this outcome */
  countriesAnalyzed: number;
  /** Countries showing positive effect */
  countriesPositive: number;
  /** Optimal spending from this outcome's perspective */
  optimalSpendingUsd: number;
  /** Per-country results */
  countryResults: JurisdictionResult[];
}

/** Result for a single category in multi-outcome optimization */
export interface MultiOutcomeCategoryResult {
  id: string;
  name: string;
  currentSpendingUsd: number;
  /** Weighted welfare score across all outcomes */
  welfareScore: number;
  /** Optimal spending (welfare-weighted average of per-outcome optimals) */
  optimalSpendingUsd: number;
  /** Gap: optimal - current */
  gapUsd: number;
  /** Gap as percentage */
  gapPct: number;
  /** Recommendation */
  recommendation: 'increase' | 'decrease' | 'maintain';
  /** Per-outcome detailed results */
  outcomeResults: CategoryOutcomeResult[];
  /** Is this the virtual "return to citizens" category? */
  isReturnToCitizens: boolean;
}

/** Complete multi-outcome budget optimization result */
export interface MultiOutcomeBudgetResult {
  jurisdictionName: string;
  jurisdictionId: string;
  totalBudgetUsd: number;
  /** Total optimal spending across all categories */
  totalOptimalUsd: number;
  /** Outcomes used and their normalized weights */
  outcomes: { outcomeId: string; outcomeName: string; normalizedWeight: number }[];
  /** Categories sorted by welfare score (highest first) */
  categories: MultiOutcomeCategoryResult[];
  /** Summary of reallocations */
  reallocations: {
    from: { name: string; amount: number }[];
    to: { name: string; amount: number }[];
  };
  /** Estimated total welfare improvement (sum of positive welfare scores) */
  estimatedWelfareImprovement: number;
  /** Does the "return to citizens" baseline beat any categories? */
  returnToCitizensBeats: string[];
  analyzedAt: string;
}

// ─── Default config ──────────────────────────────────────────────────

const DEFAULT_CONFIG: CountryAnalysisConfig = {
  onsetDelayDays: 365,
  durationOfActionDays: 1095,
  fillingType: 'interpolation',
  minimumDataPoints: 5,
  plausibilityScore: 0.5,
  coherenceScore: 0.5,
  analogyScore: 0.5,
  specificityScore: 0.5,
};

// ─── Helpers ─────────────────────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = avg(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Compute z-score: (value - mean) / stddev
 * If stddev is 0, returns 0 (all values identical → no differentiation).
 */
function zScore(value: number, mean: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - mean) / sd;
}

// ─── Core: analyze a category against a single outcome ───────────────

function analyzeCategoryForOutcome(
  category: MultiOutcomeCategoryInput,
  outcome: OutcomeConfig,
  targetJurisdictionId: string,
  config: CountryAnalysisConfig,
  population: number | undefined,
): CategoryOutcomeResult {
  const results: JurisdictionResult[] = [];
  let targetResult: JurisdictionResult | null = null;

  for (const spending of category.spendingSeries) {
    const outcomeSeries = outcome.data.find(
      o => o.jurisdictionId === spending.jurisdictionId,
    );
    if (!outcomeSeries) continue;

    try {
      const result = analyzeJurisdiction(spending, outcomeSeries, config);
      if (result) {
        results.push(result);
        if (result.jurisdictionId === targetJurisdictionId) {
          targetResult = result;
        }
      }
    } catch {
      // Skip countries with insufficient data
    }
  }

  if (results.length === 0) {
    return {
      outcomeId: outcome.outcomeId,
      outcomeName: outcome.outcomeName,
      meanZScore: 0,
      meanPercentChange: 0,
      meanForwardPearson: 0,
      countriesAnalyzed: 0,
      countriesPositive: 0,
      optimalSpendingUsd: category.currentSpendingUsd,
      countryResults: [],
    };
  }

  const zScores = results.map(r => r.analysis.effectSize.zScore);
  const pctChanges = results.map(r =>
    r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline,
  );
  const optimalValues = results.map(r =>
    r.analysis.optimalValues.valuePredictingHighOutcome,
  );
  const forwardPearsons = results.map(r => r.analysis.forwardPearson);
  const countriesPositive = results.filter(r =>
    r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline > 0,
  ).length;

  const optimalPerUnit = targetResult
    ? targetResult.analysis.optimalValues.valuePredictingHighOutcome
    : avg(optimalValues);

  const optimalSpendingUsd = population
    ? optimalPerUnit * population
    : optimalPerUnit;

  return {
    outcomeId: outcome.outcomeId,
    outcomeName: outcome.outcomeName,
    meanZScore: avg(zScores),
    meanPercentChange: avg(pctChanges),
    meanForwardPearson: avg(forwardPearsons),
    countriesAnalyzed: results.length,
    countriesPositive,
    optimalSpendingUsd,
    countryResults: results,
  };
}

// ─── Main Pipeline ───────────────────────────────────────────────────

/**
 * Optimize budget across multiple outcomes simultaneously.
 *
 * For each category × outcome pair, runs the existing N-of-1 causal analysis.
 * Then computes a weighted welfare score using z-score normalization across
 * categories for each outcome, combined via the specified weights.
 *
 * @param input - Multi-outcome budget optimization input
 * @returns Complete multi-outcome budget optimization result
 */
export function optimizeBudgetMultiOutcome(
  input: MultiOutcomeBudgetInput,
): MultiOutcomeBudgetResult {
  const config = { ...DEFAULT_CONFIG, ...input.config };

  // Normalize outcome weights to sum to 1
  const totalWeight = input.outcomes.reduce((s, o) => s + o.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Outcome weights must sum to a positive number');
  }
  const normalizedOutcomes = input.outcomes.map(o => ({
    ...o,
    normalizedWeight: o.weight / totalWeight,
  }));

  // Step 1: Run analysis for every category × outcome pair
  // Structure: categoryId → outcomeId → CategoryOutcomeResult
  const allResults = new Map<string, Map<string, CategoryOutcomeResult>>();

  for (const category of input.categories) {
    const outcomeMap = new Map<string, CategoryOutcomeResult>();
    for (const outcome of normalizedOutcomes) {
      const result = analyzeCategoryForOutcome(
        category, outcome, input.jurisdictionId, config, input.population,
      );
      outcomeMap.set(outcome.outcomeId, result);
    }
    allResults.set(category.id, outcomeMap);
  }

  // Step 1b: If returnToCitizens is enabled, create a virtual category
  // The "return to citizens" baseline: money returned → income growth
  // We model this as a category whose only positive effect is on income
  let returnToCitizensCategory: MultiOutcomeCategoryInput | null = null;
  if (input.includeReturnToCitizens) {
    const incomeOutcomeId = input.returnToCitizensOutcomeId
      ?? normalizedOutcomes[0]?.outcomeId;

    // Virtual category: the spending IS the return (negative spending = tax cut)
    // For the baseline, we assume the effect on income is proportional to
    // the average income outcome across categories (a conservative estimate).
    returnToCitizensCategory = {
      id: '__returnToCitizens',
      name: 'Return to Citizens (Tax Cuts)',
      currentSpendingUsd: 0,
      spendingSeries: [], // No real spending series
    };

    // Build synthetic outcome results for the virtual category.
    // For income: use the average positive effect across real categories.
    // For non-income outcomes: zero effect (tax cuts don't directly improve health).
    const outcomeMap = new Map<string, CategoryOutcomeResult>();

    for (const outcome of normalizedOutcomes) {
      if (outcome.outcomeId === incomeOutcomeId) {
        // Collect all real categories' income effect sizes
        const incomeEffects: number[] = [];
        for (const [, catResults] of allResults) {
          const incomeResult = catResults.get(incomeOutcomeId);
          if (incomeResult && incomeResult.countriesAnalyzed > 0) {
            incomeEffects.push(incomeResult.meanPercentChange);
          }
        }
        // Baseline effect: median of positive income effects across categories.
        // Rationale: returning $1 to citizens should produce at least a
        // median-level income benefit (conservative).
        const positiveEffects = incomeEffects.filter(e => e > 0);
        const baselineEffect = positiveEffects.length > 0
          ? median(positiveEffects)
          : 0;

        outcomeMap.set(outcome.outcomeId, {
          outcomeId: outcome.outcomeId,
          outcomeName: outcome.outcomeName,
          meanZScore: baselineEffect > 0 ? 0.5 : 0, // Moderate positive baseline
          meanPercentChange: baselineEffect,
          meanForwardPearson: baselineEffect > 0 ? 0.3 : 0,
          countriesAnalyzed: 1,
          countriesPositive: baselineEffect > 0 ? 1 : 0,
          optimalSpendingUsd: 0,
          countryResults: [],
        });
      } else {
        // Non-income outcomes: tax cuts have no direct effect
        outcomeMap.set(outcome.outcomeId, {
          outcomeId: outcome.outcomeId,
          outcomeName: outcome.outcomeName,
          meanZScore: 0,
          meanPercentChange: 0,
          meanForwardPearson: 0,
          countriesAnalyzed: 0,
          countriesPositive: 0,
          optimalSpendingUsd: 0,
          countryResults: [],
        });
      }
    }

    allResults.set('__returnToCitizens', outcomeMap);
  }

  // Step 2: For each outcome, compute z-scores across categories.
  // This normalizes different outcome scales (% GDP growth vs years of life).
  //
  // For each outcome k:
  //   Collect meanPercentChange_ik for all categories i
  //   μ_k = mean of those values
  //   σ_k = stddev of those values
  //   z_score_ik = (meanPercentChange_ik - μ_k) / σ_k

  // Collect all category IDs (including virtual if present)
  const allCategoryIds = [...allResults.keys()];

  // outcomeId → { mean, stddev } across categories
  const outcomeStats = new Map<string, { mean: number; sd: number }>();

  for (const outcome of normalizedOutcomes) {
    const values: number[] = [];
    for (const catId of allCategoryIds) {
      const catResults = allResults.get(catId)!;
      const outcomeResult = catResults.get(outcome.outcomeId);
      if (outcomeResult) {
        values.push(outcomeResult.meanPercentChange);
      }
    }
    outcomeStats.set(outcome.outcomeId, {
      mean: avg(values),
      sd: stddev(values),
    });
  }

  // Step 3: Compute weighted welfare score per category
  // welfare_i = Σ_k (normalizedWeight_k × z_score_ik)

  const categoryResults: MultiOutcomeCategoryResult[] = [];

  for (const catId of allCategoryIds) {
    const catResults = allResults.get(catId)!;
    const isVirtual = catId === '__returnToCitizens';

    // Find the actual category input (or virtual)
    const catInput = isVirtual
      ? returnToCitizensCategory!
      : input.categories.find(c => c.id === catId)!;

    // Compute welfare score
    let welfareScore = 0;
    const outcomeResultsList: CategoryOutcomeResult[] = [];

    for (const outcome of normalizedOutcomes) {
      const outcomeResult = catResults.get(outcome.outcomeId);
      if (!outcomeResult) continue;

      const stats = outcomeStats.get(outcome.outcomeId)!;
      const z = zScore(outcomeResult.meanPercentChange, stats.mean, stats.sd);
      welfareScore += outcome.normalizedWeight * z;

      outcomeResultsList.push(outcomeResult);
    }

    // Compute welfare-weighted optimal spending
    // Weight each outcome's optimal by the normalized outcome weight
    let weightedOptimal = 0;
    let totalUsedWeight = 0;

    for (const outcome of normalizedOutcomes) {
      const outcomeResult = catResults.get(outcome.outcomeId);
      if (!outcomeResult || outcomeResult.countriesAnalyzed === 0) continue;
      weightedOptimal += outcome.normalizedWeight * outcomeResult.optimalSpendingUsd;
      totalUsedWeight += outcome.normalizedWeight;
    }

    const optimalSpendingUsd = totalUsedWeight > 0
      ? weightedOptimal / totalUsedWeight
      : catInput.currentSpendingUsd;

    const gapUsd = optimalSpendingUsd - catInput.currentSpendingUsd;
    const gapPct = catInput.currentSpendingUsd > 0
      ? (gapUsd / catInput.currentSpendingUsd) * 100
      : 0;

    const recommendation: 'increase' | 'decrease' | 'maintain' =
      gapPct > 5 ? 'increase' :
      gapPct < -5 ? 'decrease' :
      'maintain';

    categoryResults.push({
      id: catId,
      name: catInput.name,
      currentSpendingUsd: catInput.currentSpendingUsd,
      welfareScore,
      optimalSpendingUsd,
      gapUsd,
      gapPct,
      recommendation,
      outcomeResults: outcomeResultsList,
      isReturnToCitizens: isVirtual,
    });
  }

  // Sort by welfare score descending
  categoryResults.sort((a, b) => b.welfareScore - a.welfareScore);

  // Total optimal
  const totalOptimalUsd = categoryResults
    .filter(c => !c.isReturnToCitizens)
    .reduce((s, c) => s + c.optimalSpendingUsd, 0);

  // Reallocations (exclude virtual category)
  const realCategories = categoryResults.filter(c => !c.isReturnToCitizens);
  const decreases = realCategories
    .filter(c => c.recommendation === 'decrease')
    .sort((a, b) => a.gapUsd - b.gapUsd)
    .map(c => ({ name: c.name, amount: Math.abs(c.gapUsd) }));

  const increases = realCategories
    .filter(c => c.recommendation === 'increase')
    .sort((a, b) => b.gapUsd - a.gapUsd)
    .map(c => ({ name: c.name, amount: c.gapUsd }));

  // Which categories does "return to citizens" beat?
  const returnToCitizensBeats: string[] = [];
  if (input.includeReturnToCitizens) {
    const rtcResult = categoryResults.find(c => c.isReturnToCitizens);
    if (rtcResult) {
      for (const c of categoryResults) {
        if (!c.isReturnToCitizens && c.welfareScore < rtcResult.welfareScore) {
          returnToCitizensBeats.push(c.name);
        }
      }
    }
  }

  // Welfare improvement estimate
  const welfareImprovement = realCategories.reduce((sum, c) => {
    if (c.recommendation === 'maintain') return sum;
    return sum + Math.abs(c.welfareScore);
  }, 0);

  return {
    jurisdictionName: input.jurisdictionName,
    jurisdictionId: input.jurisdictionId,
    totalBudgetUsd: input.totalBudgetUsd,
    totalOptimalUsd: totalOptimalUsd,
    outcomes: normalizedOutcomes.map(o => ({
      outcomeId: o.outcomeId,
      outcomeName: o.outcomeName,
      normalizedWeight: o.normalizedWeight,
    })),
    categories: categoryResults,
    reallocations: { from: decreases, to: increases },
    estimatedWelfareImprovement: welfareImprovement,
    returnToCitizensBeats,
    analyzedAt: new Date().toISOString(),
  };
}

// ─── Helpers (private) ───────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 0
    ? ((sorted[n / 2 - 1]!) + (sorted[n / 2]!)) / 2
    : sorted[Math.floor(n / 2)]!;
}
