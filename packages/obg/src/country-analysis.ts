/**
 * N-of-1 Country-Level Causal Analysis Pipeline
 * 
 * Treats each country/jurisdiction as a longitudinal N-of-1 study:
 * 1. Build time series of predictor (spending) and outcome (life expectancy, etc.)
 * 2. Run optimizer's runFullAnalysis() per country with onset delays & duration of action
 * 3. Aggregate N-of-1 results across countries (meta-analysis style)
 * 4. Generate markdown reports
 * 
 * This is the correct approach: within-country changes over time,
 * not cross-sectional snapshots that confound wealth with health.
 * 
 * @see https://obg.warondisease.org — Optimal Budget Generator
 */

import {
  runFullAnalysis,
  generateMarkdownReport,
  type FullAnalysisResult,
  type AnalysisConfig,
  type TimeSeries,
  type Measurement,
} from '@optomitron/optimizer';

// ─── Types ───────────────────────────────────────────────────────────

/** A single variable's annual measurements for one jurisdiction */
export interface AnnualTimeSeries {
  /** ISO3 country code or jurisdiction ID */
  jurisdictionId: string;
  /** Human-readable name */
  jurisdictionName: string;
  /** Variable identifier */
  variableId: string;
  /** Variable name */
  variableName: string;
  /** Unit of measurement */
  unit: string;
  /** Annual data points: year → value */
  annualValues: Map<number, number>;
}

/** Input to the N-of-1 analysis pipeline */
export interface CountryAnalysisInput {
  /** Predictor time series per jurisdiction (e.g., health spending per capita) */
  predictors: AnnualTimeSeries[];
  /** Outcome time series per jurisdiction (e.g., life expectancy) */
  outcomes: AnnualTimeSeries[];
  /** Analysis configuration overrides */
  config?: Partial<CountryAnalysisConfig>;
}

/** Configuration for the country analysis pipeline */
export interface CountryAnalysisConfig {
  /** Onset delay in days (default: 365 — 1 year for annual policy data) */
  onsetDelayDays: number;
  /** Duration of action in days (default: 1095 — 3 years) */
  durationOfActionDays: number;
  /** Filling type for missing values */
  fillingType: 'zero' | 'value' | 'none' | 'interpolation';
  /** Minimum data points required per country */
  minimumDataPoints: number;
  /** Plausibility score override (0-1) */
  plausibilityScore: number;
  /** Coherence score override (0-1) */
  coherenceScore: number;
  /** Analogy score override (0-1) */
  analogyScore: number;
  /** Specificity score override (0-1) */
  specificityScore: number;
}

/** Result for a single jurisdiction's N-of-1 analysis */
export interface JurisdictionResult {
  jurisdictionId: string;
  jurisdictionName: string;
  predictorName: string;
  outcomeName: string;
  analysis: FullAnalysisResult;
  report: string;
}

/** Aggregated results across all jurisdictions */
export interface AggregateAnalysis {
  /** Number of jurisdictions successfully analyzed */
  n: number;
  /** Number of jurisdictions skipped (insufficient data) */
  skipped: number;
  /** Mean forward Pearson correlation across jurisdictions */
  meanForwardPearson: number;
  /** Median forward Pearson correlation */
  medianForwardPearson: number;
  /** Mean effect size (z-score) */
  meanEffectSize: number;
  /** Mean percent change from baseline */
  meanPercentChange: number;
  /** Mean optimal predictor value */
  meanOptimalValue: number;
  /** Mean Predictor Impact Score */
  meanPIS: number;
  /** Jurisdictions with positive correlation */
  positiveCount: number;
  /** Jurisdictions with negative correlation */
  negativeCount: number;
  /** Aggregated Bradford Hill scores */
  meanBradfordHill: {
    strength: number;
    consistency: number;
    temporality: number;
    gradient: number;
    experiment: number;
    plausibility: number;
    coherence: number;
    analogy: number;
    specificity: number;
  };
}

/** Complete result from the N-of-1 country analysis pipeline */
export interface CountryAnalysisResult {
  /** Configuration used */
  config: CountryAnalysisConfig;
  /** Individual jurisdiction results */
  jurisdictions: JurisdictionResult[];
  /** Aggregated analysis */
  aggregate: AggregateAnalysis;
  /** Predictor variable name */
  predictorName: string;
  /** Outcome variable name */
  outcomeName: string;
  /** Timestamp of analysis */
  analyzedAt: string;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: CountryAnalysisConfig = {
  onsetDelayDays: 365,           // 1 year — policy changes take time
  durationOfActionDays: 1095,    // 3 years — effects persist
  fillingType: 'interpolation',  // Annual data, fill gaps linearly
  minimumDataPoints: 5,          // Need at least 5 years of data
  plausibilityScore: 0.7,
  coherenceScore: 0.6,
  analogyScore: 0.7,
  specificityScore: 0.3,
};

// ─── Helpers ─────────────────────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 0
    ? ((sorted[n / 2 - 1] ?? 0) + (sorted[n / 2] ?? 0)) / 2
    : (sorted[Math.floor(n / 2)] ?? 0);
}

/** Convert AnnualTimeSeries to optimizer TimeSeries format */
function toTimeSeries(annual: AnnualTimeSeries): TimeSeries {
  const measurements: Measurement[] = [];
  const sortedYears = [...annual.annualValues.keys()].sort();

  for (const year of sortedYears) {
    const value = annual.annualValues.get(year)!;
    measurements.push({
      timestamp: new Date(`${year}-07-01`).getTime(), // mid-year
      value,
      unit: annual.unit,
    });
  }

  return {
    variableId: `${annual.jurisdictionId}:${annual.variableId}`,
    name: `${annual.variableName} (${annual.jurisdictionName})`,
    measurements,
  };
}

// ─── Core Pipeline ───────────────────────────────────────────────────

/**
 * Run N-of-1 causal analysis for a single jurisdiction.
 * 
 * @param predictor - Annual predictor time series for this jurisdiction
 * @param outcome - Annual outcome time series for this jurisdiction
 * @param config - Analysis configuration
 * @returns JurisdictionResult or null if insufficient data
 */
export function analyzeJurisdiction(
  predictor: AnnualTimeSeries,
  outcome: AnnualTimeSeries,
  config: CountryAnalysisConfig = DEFAULT_CONFIG,
): JurisdictionResult | null {
  if (predictor.annualValues.size < config.minimumDataPoints ||
      outcome.annualValues.size < config.minimumDataPoints) {
    return null;
  }

  const predictorTS = toTimeSeries(predictor);
  const outcomeTS = toTimeSeries(outcome);

  const analysisConfig: AnalysisConfig = {
    onsetDelaySeconds: config.onsetDelayDays * 24 * 3600,
    durationOfActionSeconds: config.durationOfActionDays * 24 * 3600,
    fillingType: config.fillingType,
    subjectCount: 1, // N-of-1
    plausibilityScore: config.plausibilityScore,
    coherenceScore: config.coherenceScore,
    analogyScore: config.analogyScore,
    specificityScore: config.specificityScore,
  };

  const analysis = runFullAnalysis(predictorTS, outcomeTS, analysisConfig);
  const report = generateMarkdownReport(analysis);

  return {
    jurisdictionId: predictor.jurisdictionId,
    jurisdictionName: predictor.jurisdictionName,
    predictorName: predictor.variableName,
    outcomeName: outcome.variableName,
    analysis,
    report,
  };
}

/**
 * Aggregate N-of-1 results across jurisdictions.
 * Like a meta-analysis of single-subject studies.
 */
export function aggregateJurisdictionResults(
  results: JurisdictionResult[],
  skippedCount: number = 0,
): AggregateAnalysis {
  const n = results.length;
  const pearsonValues = results.map(r => r.analysis.forwardPearson);

  return {
    n,
    skipped: skippedCount,
    meanForwardPearson: avg(pearsonValues),
    medianForwardPearson: median(pearsonValues),
    meanEffectSize: avg(results.map(r => r.analysis.effectSize.zScore)),
    meanPercentChange: avg(results.map(r =>
      r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline
    )),
    meanOptimalValue: avg(results.map(r =>
      r.analysis.optimalValues.valuePredictingHighOutcome
    )),
    meanPIS: avg(results.map(r => r.analysis.pis.score)),
    positiveCount: results.filter(r => r.analysis.forwardPearson > 0).length,
    negativeCount: results.filter(r => r.analysis.forwardPearson < 0).length,
    meanBradfordHill: {
      strength: avg(results.map(r => r.analysis.bradfordHill.strength)),
      consistency: avg(results.map(r => r.analysis.bradfordHill.consistency)),
      temporality: avg(results.map(r => r.analysis.bradfordHill.temporality)),
      gradient: avg(results.map(r => r.analysis.bradfordHill.gradient ?? 0)),
      experiment: avg(results.map(r => r.analysis.bradfordHill.experiment)),
      plausibility: avg(results.map(r => r.analysis.bradfordHill.plausibility)),
      coherence: avg(results.map(r => r.analysis.bradfordHill.coherence)),
      analogy: avg(results.map(r => r.analysis.bradfordHill.analogy)),
      specificity: avg(results.map(r => r.analysis.bradfordHill.specificity)),
    },
  };
}

/**
 * Run the full N-of-1 analysis pipeline across multiple jurisdictions.
 * 
 * For each jurisdiction that has both a predictor and outcome time series,
 * runs the optimizer's causal analysis pipeline and aggregates results.
 * 
 * @param input - Predictor and outcome time series for all jurisdictions
 * @returns Complete analysis result with individual + aggregate reports
 */
export function runCountryAnalysis(input: CountryAnalysisInput): CountryAnalysisResult {
  const config = { ...DEFAULT_CONFIG, ...input.config };

  // Group predictors and outcomes by jurisdiction
  const predictorsByJurisdiction = new Map<string, AnnualTimeSeries>();
  const outcomesByJurisdiction = new Map<string, AnnualTimeSeries>();

  for (const p of input.predictors) {
    predictorsByJurisdiction.set(p.jurisdictionId, p);
  }
  for (const o of input.outcomes) {
    outcomesByJurisdiction.set(o.jurisdictionId, o);
  }

  const results: JurisdictionResult[] = [];
  let skipped = 0;

  // Analyze each jurisdiction that has both predictor and outcome
  for (const [id, predictor] of predictorsByJurisdiction) {
    const outcome = outcomesByJurisdiction.get(id);
    if (!outcome) {
      skipped++;
      continue;
    }

    try {
      const result = analyzeJurisdiction(predictor, outcome, config);
      if (result) {
        results.push(result);
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  const aggregate = aggregateJurisdictionResults(results, skipped);

  return {
    config,
    jurisdictions: results,
    aggregate,
    predictorName: input.predictors[0]?.variableName ?? 'Unknown Predictor',
    outcomeName: input.outcomes[0]?.variableName ?? 'Unknown Outcome',
    analyzedAt: new Date().toISOString(),
  };
}
