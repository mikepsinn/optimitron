/**
 * Interesting Factor Module
 *
 * Filters out tautological, non-actionable, or trivially obvious
 * predictor-outcome relationships so that Predictor Impact Scores
 * surface genuinely useful signals.
 *
 * Legacy API equivalent: HasCauseAndEffect::getInterestingFactor(),
 * BaseInterestingVariableCategoryPairProperty, and the "stupid category pair" logic.
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Traits/HasCauseAndEffect.php#L135
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationQmScoreProperty.php
 * @see https://dfda-spec.warondisease.org
 */

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Configuration describing the predictor/outcome relationship context.
 * Used to compute how "interesting" or actionable a relationship is.
 */
export interface InterestingFactorConfig {
  /** Variable category of the predictor (e.g. "Treatments", "Foods", "Activities", "Software") */
  predictorCategory?: string;
  /** Variable category of the outcome (e.g. "Symptoms", "Mood", "Physique") */
  outcomeCategory?: string;
  /** Whether the user can directly control the predictor */
  predictorIsControllable?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Category pairs and their interesting-factor overrides.
 * Higher = more interesting / actionable.
 * Key format: "predictorCategory|outcomeCategory" (lowercased).
 */
const CATEGORY_PAIR_SCORES: Record<string, number> = {
  'treatments|symptoms': 1.0,
  'treatments|mood': 0.95,
  'treatments|physique': 0.9,
  'foods|symptoms': 0.9,
  'foods|mood': 0.85,
  'foods|physique': 0.85,
  'activities|mood': 0.9,
  'activities|symptoms': 0.85,
  'activities|physique': 0.85,
  'sleep|mood': 0.85,
  'sleep|symptoms': 0.85,
  'environment|symptoms': 0.8,
  'environment|mood': 0.8,
};

/** Threshold below which a factor is considered trivial */
export const TRIVIAL_FACTOR_THRESHOLD = 0.3;

// ─── Edit Distance ───────────────────────────────────────────────────

/**
 * Levenshtein edit distance between two strings.
 * Used for detecting near-duplicate variable names.
 */
export function editDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  // Short-circuit identical strings
  if (a === b) return 0;

  // Create DP matrix (only two rows needed)
  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j]! + 1,       // deletion
        curr[j - 1]! + 1,   // insertion
        prev[j - 1]! + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb]!;
}

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Normalize a category string for case-insensitive comparison.
 */
function normalizeCategory(cat: string): string {
  return cat.trim().toLowerCase();
}

/**
 * Calculate an "interesting factor" (0-1) for a predictor→outcome relationship.
 *
 * Rules (applied in priority order):
 * 1. If predictor is explicitly non-controllable → 0.25 (not actionable)
 * 2. If a known category pair exists → use the lookup score
 * 3. If predictor and outcome share the same category → 0.5 (likely tautological)
 * 4. Default → 0.7
 *
 * @returns A number in [0, 1]. Higher = more interesting.
 */
export function calculateInterestingFactor(config: InterestingFactorConfig): number {
  const { predictorCategory, outcomeCategory, predictorIsControllable } = config;

  // Non-controllable predictors are fundamentally less actionable
  if (predictorIsControllable === false) {
    return 0.25;
  }

  const hasBothCategories = predictorCategory != null && outcomeCategory != null;

  if (hasBothCategories) {
    const predCat = normalizeCategory(predictorCategory!);
    const outCat = normalizeCategory(outcomeCategory!);

    // Look up known pair score
    const key = `${predCat}|${outCat}`;
    const pairScore = CATEGORY_PAIR_SCORES[key];
    if (pairScore !== undefined) {
      return pairScore;
    }

    // Same category → likely tautological (e.g. Symptom→Symptom)
    if (predCat === outCat) {
      return 0.5;
    }
  }

  // Default: moderately interesting
  return 0.7;
}

/**
 * Determine whether a predictor→outcome relationship is trivially obvious
 * or meaningless and should be filtered out entirely.
 *
 * A relationship is trivial if ANY of:
 * - Predictor and outcome are the exact same variable
 * - Variable names are nearly identical (edit distance < 3)
 * - Same category AND not a treatment→symptom pair
 * - Interesting factor falls below TRIVIAL_FACTOR_THRESHOLD
 */
export function isTrivial(
  predictorName: string,
  outcomeName: string,
  config?: InterestingFactorConfig,
): boolean {
  // Normalize names for comparison
  const predNorm = predictorName.trim().toLowerCase();
  const outNorm = outcomeName.trim().toLowerCase();

  // Same variable → trivially tautological
  if (predNorm === outNorm) {
    return true;
  }

  // Very similar names (edit distance < 3) → effectively the same variable
  if (editDistance(predNorm, outNorm) < 3) {
    return true;
  }

  // If we have category info, check same-category rule
  if (config?.predictorCategory != null && config?.outcomeCategory != null) {
    const predCat = normalizeCategory(config.predictorCategory);
    const outCat = normalizeCategory(config.outcomeCategory);

    if (predCat === outCat) {
      // Exception: treatment→symptom within same category is still interesting
      const key = `${predCat}|${outCat}`;
      if (CATEGORY_PAIR_SCORES[key] === undefined) {
        return true;
      }
    }
  }

  // If factor is extremely low → trivial
  if (config) {
    const factor = calculateInterestingFactor(config);
    if (factor < TRIVIAL_FACTOR_THRESHOLD) {
      return true;
    }
  }

  return false;
}
