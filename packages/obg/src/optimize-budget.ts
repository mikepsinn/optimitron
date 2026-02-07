/**
 * End-to-End Budget Optimization Pipeline
 * 
 * The holy grail: given a jurisdiction's total budget and spending categories,
 * run N-of-1 causal analysis per category against outcome metrics,
 * estimate optimal spending per category via change-from-baseline,
 * and output a complete reallocation recommendation.
 * 
 * Pipeline:
 * 1. For each budget category, run causal analysis (spending → outcome) across countries
 * 2. Calculate effect size (z-score) and optimal spending level per category
 * 3. Rank categories by marginal welfare return
 * 4. Reallocate fixed total budget to maximize welfare
 * 5. Generate report with specific dollar amounts
 * 
 * @see https://obg.warondisease.org — Optimal Budget Generator
 */

import {
  analyzeJurisdiction,
  type AnnualTimeSeries,
  type CountryAnalysisConfig,
  type JurisdictionResult,
} from './country-analysis.js';

// ─── Types ───────────────────────────────────────────────────────────

/** A budget category with cross-country spending and outcome data */
export interface BudgetCategoryInput {
  /** Category identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Current spending in USD for the target jurisdiction */
  currentSpendingUsd: number;
  /** Spending time series across multiple jurisdictions */
  spendingSeries: AnnualTimeSeries[];
  /** Outcome time series across multiple jurisdictions (same jurisdictions) */
  outcomeSeries: AnnualTimeSeries[];
  /** What outcome this category targets */
  outcomeDescription: string;
}

/** Input to the budget optimization pipeline */
export interface BudgetOptimizationInput {
  /** Name of the jurisdiction being optimized */
  jurisdictionName: string;
  /** Target jurisdiction's ISO code (for highlighting in analysis) */
  jurisdictionId: string;
  /** Total budget to allocate (fixed constraint) */
  totalBudgetUsd: number;
  /** Budget categories with data */
  categories: BudgetCategoryInput[];
  /** Analysis config overrides */
  config?: Partial<CountryAnalysisConfig>;
}

/** Result for a single budget category */
export interface CategoryOptimizationResult {
  id: string;
  name: string;
  currentSpendingUsd: number;
  /** Optimal spending based on cross-country N-of-1 analysis */
  optimalSpendingUsd: number;
  /** Gap: optimal - current */
  gapUsd: number;
  /** Gap as percentage */
  gapPct: number;
  /** Recommendation */
  recommendation: 'increase' | 'decrease' | 'maintain';
  /** Mean z-score across countries (effect size) */
  meanZScore: number;
  /** Mean % change from baseline across countries */
  meanPercentChange: number;
  /** How many countries showed positive effect */
  countriesPositive: number;
  /** Total countries analyzed */
  countriesAnalyzed: number;
  /** Mean forward Pearson */
  meanForwardPearson: number;
  /** Outcome description */
  outcomeDescription: string;
  /** Per-country results */
  countryResults: JurisdictionResult[];
  /** Result for the target jurisdiction specifically */
  targetJurisdictionResult: JurisdictionResult | null;
}

/** Complete budget optimization result */
export interface OptimalBudgetResult {
  jurisdictionName: string;
  jurisdictionId: string;
  totalBudgetUsd: number;
  totalOptimalUsd: number;
  /** Categories sorted by priority (largest positive gap first) */
  categories: CategoryOptimizationResult[];
  /** Summary of reallocations */
  reallocations: {
    from: { name: string; amount: number }[];
    to: { name: string; amount: number }[];
  };
  /** Estimated total welfare improvement */
  estimatedWelfareImprovement: number;
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

// ─── Core Pipeline ───────────────────────────────────────────────────

/**
 * Analyze a single budget category across multiple countries.
 * Returns the optimal spending level based on N-of-1 results.
 */
function analyzeCategory(
  category: BudgetCategoryInput,
  targetJurisdictionId: string,
  config: CountryAnalysisConfig,
): CategoryOptimizationResult {
  const results: JurisdictionResult[] = [];
  let targetResult: JurisdictionResult | null = null;

  // Run N-of-1 analysis per country
  for (const spending of category.spendingSeries) {
    const outcome = category.outcomeSeries.find(
      o => o.jurisdictionId === spending.jurisdictionId,
    );
    if (!outcome) continue;

    try {
      const result = analyzeJurisdiction(spending, outcome, config);
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
      id: category.id,
      name: category.name,
      currentSpendingUsd: category.currentSpendingUsd,
      optimalSpendingUsd: category.currentSpendingUsd, // No data → keep current
      gapUsd: 0,
      gapPct: 0,
      recommendation: 'maintain',
      meanZScore: 0,
      meanPercentChange: 0,
      countriesPositive: 0,
      countriesAnalyzed: 0,
      meanForwardPearson: 0,
      outcomeDescription: category.outcomeDescription,
      countryResults: [],
      targetJurisdictionResult: null,
    };
  }

  // Calculate aggregate metrics
  const zScores = results.map(r => r.analysis.effectSize.zScore);
  const pctChanges = results.map(r =>
    r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline,
  );
  const optimalValues = results.map(r =>
    r.analysis.optimalValues.valuePredictingHighOutcome,
  );
  const forwardPearsons = results.map(r => r.analysis.forwardPearson);

  const meanZScore = avg(zScores);
  const meanPercentChange = avg(pctChanges);
  const meanOptimal = avg(optimalValues);
  const countriesPositive = results.filter(r =>
    r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline > 0,
  ).length;

  // The optimal spending for the target jurisdiction:
  // Use the target's own optimal if available, else use cross-country mean
  const optimalSpendingUsd = targetResult
    ? targetResult.analysis.optimalValues.valuePredictingHighOutcome
    : meanOptimal;

  const gapUsd = optimalSpendingUsd - category.currentSpendingUsd;
  const gapPct = category.currentSpendingUsd > 0
    ? (gapUsd / category.currentSpendingUsd) * 100
    : 0;

  const recommendation: 'increase' | 'decrease' | 'maintain' =
    gapPct > 5 ? 'increase' :
    gapPct < -5 ? 'decrease' :
    'maintain';

  return {
    id: category.id,
    name: category.name,
    currentSpendingUsd: category.currentSpendingUsd,
    optimalSpendingUsd,
    gapUsd,
    gapPct,
    recommendation,
    meanZScore,
    meanPercentChange,
    countriesPositive,
    countriesAnalyzed: results.length,
    meanForwardPearson: avg(forwardPearsons),
    outcomeDescription: category.outcomeDescription,
    countryResults: results,
    targetJurisdictionResult: targetResult,
  };
}

/**
 * Run the complete budget optimization pipeline.
 * 
 * For each category, runs N-of-1 causal analysis across countries,
 * determines optimal spending, and produces a reallocation plan.
 */
export function optimizeBudget(input: BudgetOptimizationInput): OptimalBudgetResult {
  const config = { ...DEFAULT_CONFIG, ...input.config };

  // Analyze each category
  const categoryResults = input.categories.map(cat =>
    analyzeCategory(cat, input.jurisdictionId, config),
  );

  // Calculate total optimal
  const totalOptimal = categoryResults.reduce(
    (sum, c) => sum + c.optimalSpendingUsd, 0,
  );

  // Build reallocation summary
  const decreases = categoryResults
    .filter(c => c.recommendation === 'decrease')
    .sort((a, b) => a.gapUsd - b.gapUsd) // Most negative first
    .map(c => ({ name: c.name, amount: Math.abs(c.gapUsd) }));

  const increases = categoryResults
    .filter(c => c.recommendation === 'increase')
    .sort((a, b) => b.gapUsd - a.gapUsd) // Largest increase first
    .map(c => ({ name: c.name, amount: c.gapUsd }));

  // Estimate welfare improvement
  // Sum of (z-score × pct change) weighted by budget share
  const welfareImprovement = categoryResults.reduce((sum, c) => {
    if (c.recommendation === 'maintain') return sum;
    const budgetShare = c.currentSpendingUsd / input.totalBudgetUsd;
    return sum + Math.abs(c.meanPercentChange) * budgetShare;
  }, 0);

  return {
    jurisdictionName: input.jurisdictionName,
    jurisdictionId: input.jurisdictionId,
    totalBudgetUsd: input.totalBudgetUsd,
    totalOptimalUsd: totalOptimal,
    categories: categoryResults.sort((a, b) =>
      Math.abs(b.meanZScore) - Math.abs(a.meanZScore),
    ),
    reallocations: {
      from: decreases,
      to: increases,
    },
    estimatedWelfareImprovement: welfareImprovement,
    analyzedAt: new Date().toISOString(),
  };
}

// ─── Report Generator ────────────────────────────────────────────────

/**
 * Generate a markdown report from budget optimization results.
 */
export function generateOptimalBudgetReport(result: OptimalBudgetResult): string {
  const lines: string[] = [];

  lines.push(`# Optimal Budget: ${result.jurisdictionName}`);
  lines.push('');
  lines.push(`> Generated ${new Date(result.analyzedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })} by @optomitron/obg`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`Current budget: **${fmtUsd(result.totalBudgetUsd)}**`);
  lines.push(`Optimal budget: **${fmtUsd(result.totalOptimalUsd)}**`);
  lines.push(`Estimated welfare improvement from reallocation: **${result.estimatedWelfareImprovement.toFixed(2)}%**`);
  lines.push('');

  // Reallocation Plan
  if (result.reallocations.to.length > 0 || result.reallocations.from.length > 0) {
    lines.push('## Recommended Reallocations');
    lines.push('');
    if (result.reallocations.from.length > 0) {
      lines.push('### 📉 Decrease Spending');
      lines.push('');
      for (const r of result.reallocations.from) {
        lines.push(`- **${r.name}**: reduce by ${fmtUsd(r.amount)}`);
      }
      lines.push('');
    }
    if (result.reallocations.to.length > 0) {
      lines.push('### 📈 Increase Spending');
      lines.push('');
      for (const r of result.reallocations.to) {
        lines.push(`- **${r.name}**: increase by ${fmtUsd(r.amount)}`);
      }
      lines.push('');
    }
  }

  // Category Analysis Table
  lines.push('## Category Analysis');
  lines.push('');
  lines.push('Sorted by effect size (how strongly spending changes affect outcomes):');
  lines.push('');
  lines.push('| Category | Current | Optimal | Gap | % Change | z-score | Countries | Rec |');
  lines.push('|----------|---------|---------|-----|----------|---------|-----------|-----|');

  for (const c of result.categories) {
    const emoji = c.recommendation === 'increase' ? '📈' :
                  c.recommendation === 'decrease' ? '📉' : '➡️';
    lines.push(
      `| ${c.name} ` +
      `| ${fmtUsd(c.currentSpendingUsd)} ` +
      `| ${fmtUsd(c.optimalSpendingUsd)} ` +
      `| ${c.gapPct >= 0 ? '+' : ''}${c.gapPct.toFixed(1)}% ` +
      `| ${c.meanPercentChange >= 0 ? '+' : ''}${c.meanPercentChange.toFixed(2)}% ` +
      `| ${c.meanZScore.toFixed(2)} ` +
      `| ${c.countriesPositive}/${c.countriesAnalyzed} positive ` +
      `| ${emoji} ${c.recommendation} |`
    );
  }
  lines.push('');

  // Per-category evidence
  lines.push('## Evidence by Category');
  lines.push('');

  for (const c of result.categories) {
    if (c.countriesAnalyzed === 0) continue;

    lines.push(`### ${c.name}`);
    lines.push('');
    lines.push(`**Outcome measured:** ${c.outcomeDescription}`);
    lines.push(`**Countries analyzed:** ${c.countriesAnalyzed} (${c.countriesPositive} showed positive effect)`);
    lines.push(`**Mean effect:** ${c.meanPercentChange >= 0 ? '+' : ''}${c.meanPercentChange.toFixed(2)}% change from baseline (z = ${c.meanZScore.toFixed(2)})`);
    lines.push(`**Current spending:** ${fmtUsd(c.currentSpendingUsd)} → **Optimal:** ${fmtUsd(c.optimalSpendingUsd)}`);
    lines.push('');

    if (c.targetJurisdictionResult) {
      const a = c.targetJurisdictionResult.analysis;
      lines.push(`**${result.jurisdictionName} specifically:**`);
      lines.push(`- Baseline outcome: ${a.baselineFollowup.outcomeBaselineAverage.toFixed(2)} → Follow-up: ${a.baselineFollowup.outcomeFollowUpAverage.toFixed(2)} (${a.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline.toFixed(2)}% change)`);
      lines.push(`- Optimal spending level: ${fmtUsd(a.optimalValues.valuePredictingHighOutcome)}`);
      lines.push(`- z-score: ${a.effectSize.zScore.toFixed(2)}`);
      lines.push('');
    }
  }

  // Methodology
  lines.push('## Methodology');
  lines.push('');
  lines.push('1. For each budget category, collect spending and outcome data across multiple countries over 20+ years');
  lines.push('2. Run N-of-1 causal analysis per country: temporal alignment with onset delay, change from baseline, Bradford Hill scoring');
  lines.push('3. Aggregate results: mean z-score (effect size), mean % change from baseline');
  lines.push('4. Determine optimal spending: the spending level associated with the best outcomes within each country');
  lines.push('5. Calculate reallocation: gap between current and optimal for each category');
  lines.push('6. Estimate welfare improvement from reallocation');
  lines.push('');
  lines.push('**Key metric: Change from baseline.** For each country, when spending is above its own historical mean, how much does the outcome improve? This controls for cross-country confounders and requires no distributional assumptions.');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Optomitron](https://github.com/mikepsinn/optomitron) — the open-source world optimization engine.*');

  return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function fmtUsd(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
