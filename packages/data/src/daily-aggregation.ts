/**
 * Daily Value Aggregation
 *
 * Aggregates individual measurements (multiple per day, varying timestamps)
 * into daily values. This is critical for temporal alignment — the optimizer
 * expects one value per variable per day.
 *
 * Supports:
 * - SUM: For treatments/foods — total daily intake ("took 500mg in morning + 500mg at night = 1000mg/day")
 * - MEAN: For vitals/mood — average daily state ("blood pressure averaged 120 today")
 * - MAX / MIN: For peak/trough tracking
 *
 * Missing-day filling:
 * - ZERO: Assumes 0 (critical for treatments — "no dose taken" is meaningfully 0)
 * - NONE: Leave gaps (no interpolation)
 * - INTERPOLATION: Linear interpolation between nearest known values
 * - VALUE: Fill with a specific constant
 *
 * @see https://dfda-spec.warondisease.org
 */

import type { ParsedHealthRecord } from './importers/apple-health';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyAggregationConfig {
  /** How to combine multiple measurements within a single day */
  combinationOperation: 'SUM' | 'MEAN' | 'MAX' | 'MIN';
  /** How to handle days with no measurements */
  fillingType: 'ZERO' | 'NONE' | 'INTERPOLATION' | 'VALUE';
  /** Value to use when fillingType is 'VALUE' */
  fillingValue?: number;
  /** Override start of date range (inclusive). Defaults to earliest measurement. */
  startDate?: Date;
  /** Override end of date range (inclusive). Defaults to latest measurement. */
  endDate?: Date;
}

export interface DailyValue {
  /** YYYY-MM-DD format */
  date: string;
  /** Aggregated value for this day */
  value: number;
  /** Number of individual measurements that contributed to this value */
  numberOfMeasurements: number;
  /** Source name(s) — comma-joined if multiple */
  source: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract YYYY-MM-DD from an ISO-8601 datetime string.
 */
function toDateKey(isoString: string): string {
  // Handle both "2024-01-15T08:30:00Z" and "2024-01-15" formats
  return isoString.slice(0, 10);
}

/**
 * Parse a YYYY-MM-DD string to a Date object (midnight UTC).
 */
function parseDateKey(dateKey: string): Date {
  return new Date(dateKey + 'T00:00:00Z');
}

/**
 * Format a Date to YYYY-MM-DD.
 */
function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Generate all YYYY-MM-DD strings from start to end (inclusive).
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  while (current <= end) {
    dates.push(formatDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

interface DayBucket {
  values: number[];
  sources: Set<string>;
}

/**
 * Combine values within a single day according to the operation.
 */
function combineValues(
  values: number[],
  operation: DailyAggregationConfig['combinationOperation'],
): number {
  if (values.length === 0) return 0;

  switch (operation) {
    case 'SUM':
      return values.reduce((sum, v) => sum + v, 0);
    case 'MEAN':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
  }
}

/**
 * Apply linear interpolation to fill missing days between known data points.
 *
 * Given a sparse map of date → value, fills gaps with linearly interpolated values.
 */
function interpolateMissing(
  allDates: string[],
  knownValues: Map<string, DailyValue>,
): Map<string, DailyValue> {
  const result = new Map(knownValues);

  // Collect known dates in order
  const knownDates = allDates.filter((d) => knownValues.has(d));
  if (knownDates.length < 2) return result; // need at least 2 points

  // For each pair of consecutive known dates, interpolate the gap
  for (let i = 0; i < knownDates.length - 1; i++) {
    const startDate = knownDates[i]!;
    const endDate = knownDates[i + 1]!;
    const startVal = knownValues.get(startDate)!.value;
    const endVal = knownValues.get(endDate)!.value;

    const startIdx = allDates.indexOf(startDate);
    const endIdx = allDates.indexOf(endDate);
    const span = endIdx - startIdx;

    for (let j = startIdx + 1; j < endIdx; j++) {
      const date = allDates[j]!;
      if (knownValues.has(date)) continue; // already has a value

      const fraction = (j - startIdx) / span;
      const interpolatedValue = startVal + (endVal - startVal) * fraction;

      result.set(date, {
        date,
        value: Math.round(interpolatedValue * 1000) / 1000,
        numberOfMeasurements: 0,
        source: 'interpolated',
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregate an array of health records into daily values.
 *
 * Groups measurements by date, applies the combination operation (SUM, MEAN,
 * MAX, MIN), then fills missing days according to the filling strategy.
 *
 * @param measurements - Array of ParsedHealthRecord (typically already filtered to a single variable)
 * @param config - Aggregation configuration
 * @returns Sorted array of DailyValue (one per day)
 *
 * @example
 * ```typescript
 * // Treatment: sum daily doses, fill missing days with 0
 * const dailyDoses = aggregateToDaily(measurements, {
 *   combinationOperation: 'SUM',
 *   fillingType: 'ZERO',
 * });
 *
 * // Vital sign: average daily readings, no filling
 * const dailyBP = aggregateToDaily(measurements, {
 *   combinationOperation: 'MEAN',
 *   fillingType: 'NONE',
 * });
 * ```
 */
export function aggregateToDaily(
  measurements: ParsedHealthRecord[],
  config: DailyAggregationConfig,
): DailyValue[] {
  if (measurements.length === 0) return [];

  // ── Step 1: Group by date ──────────────────────────────────────────────
  const buckets = new Map<string, DayBucket>();

  for (const m of measurements) {
    const dateKey = toDateKey(m.startAt);
    let bucket = buckets.get(dateKey);
    if (!bucket) {
      bucket = { values: [], sources: new Set() };
      buckets.set(dateKey, bucket);
    }
    bucket.values.push(m.value);
    bucket.sources.add(m.sourceName);
  }

  // ── Step 2: Apply combination operation to each day ────────────────────
  const knownValues = new Map<string, DailyValue>();
  for (const [dateKey, bucket] of buckets) {
    knownValues.set(dateKey, {
      date: dateKey,
      value:
        Math.round(
          combineValues(bucket.values, config.combinationOperation) * 1000,
        ) / 1000,
      numberOfMeasurements: bucket.values.length,
      source: [...bucket.sources].sort().join(', '),
    });
  }

  // ── Step 3: Determine date range ───────────────────────────────────────
  const allDateKeys = [...knownValues.keys()].sort();
  const rangeStart = config.startDate
    ? formatDateKey(config.startDate)
    : allDateKeys[0]!;
  const rangeEnd = config.endDate
    ? formatDateKey(config.endDate)
    : allDateKeys[allDateKeys.length - 1]!;

  // ── Step 4: Fill missing days ──────────────────────────────────────────
  if (config.fillingType === 'NONE') {
    // Just return known values sorted
    return [...knownValues.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  const fullRange = generateDateRange(rangeStart, rangeEnd);

  if (config.fillingType === 'INTERPOLATION') {
    const interpolated = interpolateMissing(fullRange, knownValues);
    return fullRange
      .filter((d) => interpolated.has(d))
      .map((d) => interpolated.get(d)!);
  }

  // ZERO or VALUE filling
  const fillValue =
    config.fillingType === 'ZERO' ? 0 : (config.fillingValue ?? 0);

  return fullRange.map((date) => {
    const existing = knownValues.get(date);
    if (existing) return existing;

    return {
      date,
      value: fillValue,
      numberOfMeasurements: 0,
      source: 'filled',
    };
  });
}
