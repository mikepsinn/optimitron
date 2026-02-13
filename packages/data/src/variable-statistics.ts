/**
 * Unit Variable Statistics & Global Variable Statistics
 *
 * Calculates running statistics from measurement values for individual unit
 * variables, and aggregates them across units for global variable statistics.
 *
 * Ported from legacy CureDAO API:
 * - QMUserVariable::calculateAttributes() (legacy API naming)
 * - UnitVariable-equivalent property calculators (Mean, Median, Skewness, Kurtosis, etc.)
 * - QMCommonVariable aggregation
 *
 * @see https://dfda-spec.warondisease.org
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMUserVariable.php
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMCommonVariable.php
 */

// ─── Unit Variable Statistics ────────────────────────────────────────────────

/**
 * Statistics calculated from a single unit's measurements for one variable.
 * Mirrors the statistical fields on the Prisma `UnitVariable` model.
 */
export interface UnitVariableStatistics {
  /** Arithmetic mean of measurement values */
  mean: number;
  /** Median of measurement values */
  median: number;
  /** Population standard deviation of measurement values */
  standardDeviation: number;
  /** Population variance of measurement values */
  variance: number;
  /** Sample skewness (adjusted Fisher–Pearson); 0 when n < 3 or stddev = 0 */
  skewness: number;
  /** Excess kurtosis (Fisher definition, normal = 0); 0 when n < 4 or stddev = 0 */
  kurtosis: number;
  /** Smallest measurement value recorded */
  minimumRecordedValue: number;
  /** Largest measurement value recorded */
  maximumRecordedValue: number;
  /** Total number of measurements */
  numberOfMeasurements: number;
  /** Count of distinct values */
  numberOfUniqueValues: number;
  /** Most frequently occurring value, or null if ambiguous / empty */
  mostCommonValue: number | null;
  /** Second most frequently occurring value, or null */
  secondMostCommonValue: number | null;
  /** Timestamp of the latest measurement, or null */
  lastMeasurementAt: Date | null;
  /** Timestamp of the earliest measurement, or null */
  firstMeasurementAt: Date | null;
  /** Median number of seconds between consecutive measurements, or null if < 2 timestamps */
  medianSecondsBetweenMeasurements: number | null;
}

// ─── Global Variable Statistics ──────────────────────────────────────────────

/**
 * Aggregated statistics across multiple units for a single global variable.
 * Mirrors the statistical fields on the Prisma `GlobalVariable` model.
 */
export interface GlobalVariableStatistics {
  /** Number of units that track this variable */
  numberOfUnitVariables: number;
  /** Weighted mean across all units (weighted by numberOfMeasurements) */
  globalMean: number;
  /** Weighted standard deviation across all units */
  globalStandardDeviation: number;
  /** Minimum recorded value across all units */
  globalMinimumRecordedValue: number;
  /** Maximum recorded value across all units */
  globalMaximumRecordedValue: number;
  /** Sum of measurements across all units */
  totalMeasurements: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute the median of a sorted-numeric array.
 * Assumes `sorted` is already sorted in ascending order and non-empty.
 */
function medianOfSorted(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/**
 * Return the top-N most common values from `values`, ordered by frequency desc
 * then by value asc (for determinism). Returns up to `n` entries.
 */
function topNMostCommon(values: number[], n: number): (number | null)[] {
  if (values.length === 0) return Array(n).fill(null) as (number | null)[];

  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }

  const entries = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // descending frequency
    return a[0] - b[0]; // ascending value for determinism
  });

  const result: (number | null)[] = [];
  for (let i = 0; i < n; i++) {
    result.push(entries[i]?.[0] ?? null);
  }
  return result;
}

// ─── Core Calculation ────────────────────────────────────────────────────────

/**
 * Calculate descriptive statistics from an array of measurement values
 * and optional timestamps.
 *
 * Edge cases:
 * - Empty array → all-zero numeric fields, null for optional fields
 * - Single value → variance/stddev/skewness/kurtosis are 0
 * - All identical values → variance/stddev/skewness/kurtosis are 0
 *
 * Skewness uses the adjusted Fisher–Pearson standardised moment coefficient:
 *   G₁ = (n / ((n-1)(n-2))) × Σ((xi - mean) / stddev)³
 *
 * Kurtosis uses excess kurtosis (Fisher definition, normal distribution = 0):
 *   G₂ = ((n(n+1)) / ((n-1)(n-2)(n-3))) × Σ((xi-mean)/stddev)⁴ − (3(n-1)²)/((n-2)(n-3))
 */
export function calculateUnitVariableStatistics(
  values: number[],
  timestamps?: Date[],
): UnitVariableStatistics {
  const n = values.length;

  // ── Empty array ────────────────────────────────────────────────────────
  if (n === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      skewness: 0,
      kurtosis: 0,
      minimumRecordedValue: 0,
      maximumRecordedValue: 0,
      numberOfMeasurements: 0,
      numberOfUniqueValues: 0,
      mostCommonValue: null,
      secondMostCommonValue: null,
      lastMeasurementAt: null,
      firstMeasurementAt: null,
      medianSecondsBetweenMeasurements: null,
    };
  }

  // ── Basic aggregates ───────────────────────────────────────────────────
  let sum = 0;
  let min = values[0]!;
  let max = values[0]!;
  for (let i = 0; i < n; i++) {
    const v = values[i]!;
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const mean = sum / n;

  // ── Sorted copy for median ─────────────────────────────────────────────
  const sorted = [...values].sort((a, b) => a - b);
  const median = medianOfSorted(sorted);

  // ── Variance (population) ──────────────────────────────────────────────
  let sumSqDiff = 0;
  for (let i = 0; i < n; i++) {
    const diff = values[i]! - mean;
    sumSqDiff += diff * diff;
  }
  const variance = n > 1 ? sumSqDiff / (n - 1) : 0; // sample variance
  const standardDeviation = Math.sqrt(variance);

  // ── Skewness (adjusted Fisher–Pearson) ─────────────────────────────────
  let skewness = 0;
  if (n >= 3 && standardDeviation > 0) {
    let sumCubed = 0;
    for (let i = 0; i < n; i++) {
      const z = (values[i]! - mean) / standardDeviation;
      sumCubed += z * z * z;
    }
    skewness = (n / ((n - 1) * (n - 2))) * sumCubed;
  }

  // ── Kurtosis (excess, Fisher definition) ───────────────────────────────
  let kurtosis = 0;
  if (n >= 4 && standardDeviation > 0) {
    let sumFourth = 0;
    for (let i = 0; i < n; i++) {
      const z = (values[i]! - mean) / standardDeviation;
      sumFourth += z * z * z * z;
    }
    // Excess kurtosis with bias correction
    const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const b = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    kurtosis = a * sumFourth - b;
  }

  // ── Unique values & mode ───────────────────────────────────────────────
  const uniqueSet = new Set(values);
  const numberOfUniqueValues = uniqueSet.size;
  const [mostCommonValue, secondMostCommonValue] = topNMostCommon(values, 2);

  // ── Timestamps ─────────────────────────────────────────────────────────
  let firstMeasurementAt: Date | null = null;
  let lastMeasurementAt: Date | null = null;
  let medianSecondsBetweenMeasurements: number | null = null;

  if (timestamps && timestamps.length > 0) {
    const sortedTs = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
    firstMeasurementAt = sortedTs[0]!;
    lastMeasurementAt = sortedTs[sortedTs.length - 1]!;

    if (sortedTs.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < sortedTs.length; i++) {
        const diffSec =
          (sortedTs[i]!.getTime() - sortedTs[i - 1]!.getTime()) / 1000;
        diffs.push(diffSec);
      }
      diffs.sort((a, b) => a - b);
      medianSecondsBetweenMeasurements = medianOfSorted(diffs);
    }
  }

  return {
    mean,
    median,
    standardDeviation,
    variance,
    skewness,
    kurtosis,
    minimumRecordedValue: min,
    maximumRecordedValue: max,
    numberOfMeasurements: n,
    numberOfUniqueValues,
    mostCommonValue: mostCommonValue ?? null,
    secondMostCommonValue: secondMostCommonValue ?? null,
    lastMeasurementAt,
    firstMeasurementAt,
    medianSecondsBetweenMeasurements,
  };
}

// ─── Global Aggregation ──────────────────────────────────────────────────────

/**
 * Aggregate unit-level statistics into global variable statistics.
 *
 * Uses measurement-count weighting so units with more data have proportionally
 * more influence on the global mean and standard deviation.
 *
 * Weighted mean:  μ = Σ(wᵢ × meanᵢ) / Σ(wᵢ)
 * Weighted stddev (combined variance approach):
 *   σ² = Σ(wᵢ × (varianceᵢ + (meanᵢ − μ)²)) / Σ(wᵢ)
 *
 * @param unitStats Array of per-unit statistics for the same global variable
 */
export function aggregateGlobalStatistics(
  unitStats: UnitVariableStatistics[],
): GlobalVariableStatistics {
  if (unitStats.length === 0) {
    return {
      numberOfUnitVariables: 0,
      globalMean: 0,
      globalStandardDeviation: 0,
      globalMinimumRecordedValue: 0,
      globalMaximumRecordedValue: 0,
      totalMeasurements: 0,
    };
  }

  let totalMeasurements = 0;
  let weightedMeanSum = 0;
  let globalMin = Infinity;
  let globalMax = -Infinity;

  for (const us of unitStats) {
    if (us.numberOfMeasurements === 0) continue;
    totalMeasurements += us.numberOfMeasurements;
    weightedMeanSum += us.numberOfMeasurements * us.mean;
    if (us.minimumRecordedValue < globalMin) globalMin = us.minimumRecordedValue;
    if (us.maximumRecordedValue > globalMax) globalMax = us.maximumRecordedValue;
  }

  // If all units had 0 measurements
  if (totalMeasurements === 0) {
    return {
      numberOfUnitVariables: unitStats.length,
      globalMean: 0,
      globalStandardDeviation: 0,
      globalMinimumRecordedValue: 0,
      globalMaximumRecordedValue: 0,
      totalMeasurements: 0,
    };
  }

  const globalMean = weightedMeanSum / totalMeasurements;

  // Combined variance: Σ wᵢ × (σᵢ² + (μᵢ − μ_global)²) / Σ wᵢ
  let weightedVarSum = 0;
  for (const us of unitStats) {
    if (us.numberOfMeasurements === 0) continue;
    const diff = us.mean - globalMean;
    weightedVarSum +=
      us.numberOfMeasurements * (us.variance + diff * diff);
  }
  const globalVariance = weightedVarSum / totalMeasurements;
  const globalStandardDeviation = Math.sqrt(globalVariance);

  return {
    numberOfUnitVariables: unitStats.length,
    globalMean,
    globalStandardDeviation,
    globalMinimumRecordedValue: globalMin === Infinity ? 0 : globalMin,
    globalMaximumRecordedValue: globalMax === -Infinity ? 0 : globalMax,
    totalMeasurements,
  };
}
