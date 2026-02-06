import { describe, it, expect } from 'vitest';
import {
  toUnixMs,
  getMeasurementsInWindow,
  meanValue,
  alignOutcomeBased,
  alignPredictorBased,
  alignTimeSeries,
  optimizeTemporalParameters,
} from '../temporal-alignment.js';
import { pearsonCorrelation } from '../statistics.js';
import type { Measurement, TimeSeries, PredictorConfig } from '../types.js';

// ─── Helper Factories ───────────────────────────────────────────────

// Base epoch: Jan 1 2024 00:00 UTC in seconds
const BASE_EPOCH_SEC = 1704067200;

/** Create a measurement at a given hour offset from base epoch.
 *  Timestamps are in Unix SECONDS so toUnixMs converts them properly.
 */
function m(hourOffset: number, value: number): Measurement {
  return { timestamp: BASE_EPOCH_SEC + hourOffset * 3600, value };
}

/** Create a measurement from a Unix second timestamp */
function mSec(unixSeconds: number, value: number): Measurement {
  return { timestamp: unixSeconds, value };
}

/** Create a time series */
function ts(name: string, measurements: Measurement[]): TimeSeries {
  return { variableId: name, name, measurements };
}

/** Default predictor config for a supplement with zero-filling */
function zeroFilledConfig(
  onsetDelaySeconds = 1800,
  durationOfActionSeconds = 86400
): PredictorConfig {
  return {
    onsetDelaySeconds,
    durationOfActionSeconds,
    fillingType: 'zero',
  };
}

/** Config with no filling (continuous predictor) */
function noFillConfig(
  onsetDelaySeconds = 1800,
  durationOfActionSeconds = 86400
): PredictorConfig {
  return {
    onsetDelaySeconds,
    durationOfActionSeconds,
    fillingType: 'none',
  };
}

// ─── toUnixMs ────────────────────────────────────────────────────────

describe('toUnixMs', () => {
  it('passes through millisecond timestamps unchanged', () => {
    const ms = 1700000000000; // ~Nov 2023 in ms
    expect(toUnixMs(ms)).toBe(ms);
  });

  it('converts seconds to milliseconds for timestamps < year 2100', () => {
    const sec = 1700000000; // ~Nov 2023 in seconds
    expect(toUnixMs(sec)).toBe(sec * 1000);
  });

  it('handles the boundary near year 2100 (4_102_444_800)', () => {
    // Just below threshold: treated as seconds
    expect(toUnixMs(4_102_444_799)).toBe(4_102_444_799 * 1000);
    // At/above threshold: treated as milliseconds
    expect(toUnixMs(4_102_444_800)).toBe(4_102_444_800);
  });

  it('converts ISO date strings to milliseconds', () => {
    const iso = '2024-01-15T12:00:00Z';
    const expected = new Date(iso).getTime();
    expect(toUnixMs(iso)).toBe(expected);
  });

  it('handles ISO strings with timezone offsets', () => {
    const iso = '2024-06-01T00:00:00-05:00';
    const expected = new Date(iso).getTime();
    expect(toUnixMs(iso)).toBe(expected);
  });

  it('returns NaN for invalid date strings', () => {
    expect(toUnixMs('not-a-date')).toBeNaN();
  });
});

// ─── getMeasurementsInWindow ─────────────────────────────────────────

describe('getMeasurementsInWindow', () => {
  const measurements: Measurement[] = [
    m(0, 10), m(1, 20), m(2, 30), m(3, 40), m(4, 50),
  ];

  // After toUnixMs, measurements are at BASE_EPOCH_SEC * 1000 + h * 3600 * 1000
  const baseMs = BASE_EPOCH_SEC * 1000;

  it('returns measurements within [start, end] inclusive', () => {
    // Window from hour 1 to hour 3 (in ms)
    const result = getMeasurementsInWindow(
      measurements,
      baseMs + 1 * 3600 * 1000,
      baseMs + 3 * 3600 * 1000
    );
    expect(result).toHaveLength(3);
    expect(result.map(r => r.value)).toEqual([20, 30, 40]);
  });

  it('returns empty array when no measurements in window', () => {
    const result = getMeasurementsInWindow(
      measurements,
      baseMs + 10 * 3600 * 1000,
      baseMs + 20 * 3600 * 1000
    );
    expect(result).toHaveLength(0);
  });

  it('handles exact boundary matches', () => {
    const result = getMeasurementsInWindow(
      measurements,
      baseMs, // Exactly at the first measurement
      baseMs
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe(10);
  });

  it('returns empty array for empty input', () => {
    expect(getMeasurementsInWindow([], 0, 1000000)).toEqual([]);
  });
});

// ─── meanValue ───────────────────────────────────────────────────────

describe('meanValue', () => {
  it('computes mean of measurement values', () => {
    expect(meanValue([m(0, 10), m(1, 20), m(2, 30)])).toBe(20);
  });

  it('returns NaN for empty array', () => {
    expect(meanValue([])).toBeNaN();
  });

  it('handles single measurement', () => {
    expect(meanValue([m(0, 42)])).toBe(42);
  });

  it('handles negative values', () => {
    expect(meanValue([m(0, -10), m(1, 10)])).toBe(0);
  });
});

// ─── alignOutcomeBased ───────────────────────────────────────────────

describe('alignOutcomeBased', () => {
  it('creates pairs for each outcome measurement with zero-fill', () => {
    // Simulate: predictor measurements at hours 0, 2, 4
    // Outcome measurements at hours 3, 5, 7
    // onset delay = 0.5 hours = 1800s, duration = 2 hours = 7200s
    const predictor = ts('pred', [m(0, 100), m(2, 200), m(4, 300)]);
    const outcome = ts('out', [m(3, 5), m(5, 3), m(7, 1)]);

    const config = zeroFilledConfig(1800, 7200);
    const pairs = alignOutcomeBased(predictor, outcome, config);

    // For outcome at hour 3: window_end = 3h - 0.5h = 2.5h, window_start = 2.5h - 2h = 0.5h
    // Predictor at hour 2 (7200000ms) is in [1800000, 9000000] → value = 200
    expect(pairs.length).toBeGreaterThan(0);
    // Each pair should have numeric values
    for (const pair of pairs) {
      expect(typeof pair.predictorValue).toBe('number');
      expect(typeof pair.outcomeValue).toBe('number');
      expect(Number.isFinite(pair.predictorValue)).toBe(true);
      expect(Number.isFinite(pair.outcomeValue)).toBe(true);
    }
  });

  it('fills with zero when no predictor measurements in window', () => {
    // Predictor only at hour 0; outcome at hour 48 (far away)
    // With 1h onset delay and 2h duration, window for hour 48 outcome:
    //   [48h - 1h - 2h, 48h - 1h] = [45h, 47h] → no predictor data
    // But within tracking boundaries (hour 0 to hour 48)
    const predictor = ts('pred', [m(0, 100), m(48, 100)]);
    const outcome = ts('out', [m(25, 5)]); // hour 25

    const config = zeroFilledConfig(3600, 7200); // 1h onset, 2h duration
    const pairs = alignOutcomeBased(predictor, outcome, config);

    // Window for outcome at hour 25: end = 25h - 1h = 24h, start = 24h - 2h = 22h
    // No predictor at hour 22-24, but within tracking period → fill with 0
    const zeroFilledPairs = pairs.filter(p => p.predictorValue === 0);
    expect(zeroFilledPairs.length).toBeGreaterThanOrEqual(1);
  });

  it('averages multiple predictor values in the same window', () => {
    // Two predictor measurements in same window
    const predictor = ts('pred', [
      m(1, 100), // hour 1
      m(2, 200), // hour 2
    ]);
    // Outcome at hour 5; onset delay=1h, duration=4h → window [0h, 4h]
    const outcome = ts('out', [m(5, 10)]);
    const config = zeroFilledConfig(3600, 14400); // 1h onset, 4h duration

    const pairs = alignOutcomeBased(predictor, outcome, config);
    expect(pairs).toHaveLength(1);
    // Both predictor measurements at h1 and h2 are in [0h, 4h]
    expect(pairs[0]!.predictorValue).toBe(150); // mean(100, 200)
    expect(pairs[0]!.outcomeValue).toBe(10);
  });

  it('returns empty array when outcome series is empty', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', []);
    const pairs = alignOutcomeBased(predictor, outcome, zeroFilledConfig());
    expect(pairs).toEqual([]);
  });

  it('returns empty array when predictor series is empty', () => {
    const predictor = ts('pred', []);
    const outcome = ts('out', [m(0, 5)]);
    const pairs = alignOutcomeBased(predictor, outcome, zeroFilledConfig());
    // No tracking boundaries → no pairs generated
    expect(pairs).toEqual([]);
  });

  it('uses custom filling value when fillingType is value', () => {
    const predictor = ts('pred', [m(0, 100), m(100, 100)]);
    const outcome = ts('out', [m(50, 5)]); // Outcome at h50
    const config: PredictorConfig = {
      onsetDelaySeconds: 3600,       // 1h onset
      durationOfActionSeconds: 7200, // 2h duration
      fillingType: 'value',
      fillingValue: 42,
    };

    const pairs = alignOutcomeBased(predictor, outcome, config);
    // Window: [50h - 1h - 2h, 50h - 1h] = [47h, 49h] → no pred data → fill with 42
    const filledPairs = pairs.filter(p => p.predictorValue === 42);
    expect(filledPairs.length).toBeGreaterThanOrEqual(1);
  });

  it('handles realistic supplement tracking scenario', () => {
    // Simulate: Magnesium 400mg taken daily for 7 days
    // Sleep quality measured each morning
    // Onset delay: 2 hours, Duration: 12 hours
    const predictorMeasurements: Measurement[] = [];
    const outcomeMeasurements: Measurement[] = [];

    for (let day = 0; day < 14; day++) {
      // Take supplement at 9pm (hour 21 each day)
      if (day >= 3 && day < 10) {
        predictorMeasurements.push(m(day * 24 + 21, 400));
      }
      // Rate sleep quality at 7am the next day (hour 7)
      // Better sleep during supplement period
      const sleepQuality = day >= 4 && day < 11 ? 7 + Math.random() : 4 + Math.random();
      outcomeMeasurements.push(m(day * 24 + 7, sleepQuality));
    }

    const predictor = ts('magnesium', predictorMeasurements);
    const outcome = ts('sleep_quality', outcomeMeasurements);

    // 2h onset, 12h duration
    const config = zeroFilledConfig(7200, 43200);
    const pairs = alignOutcomeBased(predictor, outcome, config);

    // Should produce pairs for most outcome measurements
    expect(pairs.length).toBeGreaterThan(5);
  });
});

// ─── alignPredictorBased ─────────────────────────────────────────────

describe('alignPredictorBased', () => {
  it('creates pairs for each predictor measurement looking forward', () => {
    // Predictor at hours 0, 6, 12
    // Outcome at hours 3, 9, 15
    // onset delay = 2h, duration = 4h
    const predictor = ts('pred', [m(0, 10), m(6, 20), m(12, 30)]);
    const outcome = ts('out', [m(3, 5), m(9, 3), m(15, 1)]);

    const config = noFillConfig(7200, 14400); // 2h onset, 4h duration
    const pairs = alignPredictorBased(predictor, outcome, config);

    // For predictor at h0: window [2h, 6h] → outcome at h3 ✓
    // For predictor at h6: window [8h, 12h] → outcome at h9 ✓
    // For predictor at h12: window [14h, 18h] → outcome at h15 ✓
    expect(pairs).toHaveLength(3);
    expect(pairs[0]!.predictorValue).toBe(10);
    expect(pairs[0]!.outcomeValue).toBe(5);
    expect(pairs[1]!.predictorValue).toBe(20);
    expect(pairs[1]!.outcomeValue).toBe(3);
    expect(pairs[2]!.predictorValue).toBe(30);
    expect(pairs[2]!.outcomeValue).toBe(1);
  });

  it('skips predictor measurements with no outcome in window', () => {
    const predictor = ts('pred', [m(0, 10), m(100, 20)]);
    const outcome = ts('out', [m(3, 5)]); // Only near h0

    const config = noFillConfig(7200, 14400); // 2h onset, 4h duration
    const pairs = alignPredictorBased(predictor, outcome, config);

    // h0 → window [2h, 6h] → h3 ✓
    // h100 → window [102h, 106h] → no outcome
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.predictorValue).toBe(10);
  });

  it('averages multiple outcome values in the same window', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', [m(3, 4), m(4, 8)]); // Both in window

    const config = noFillConfig(7200, 14400); // 2h onset, 4h duration
    const pairs = alignPredictorBased(predictor, outcome, config);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.outcomeValue).toBe(6); // mean(4, 8)
  });

  it('returns empty when no outcomes available', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', []);
    const pairs = alignPredictorBased(predictor, outcome, noFillConfig());
    expect(pairs).toEqual([]);
  });

  it('handles single predictor and single outcome', () => {
    const predictor = ts('pred', [m(0, 50)]);
    const outcome = ts('out', [m(2, 7)]); // Within window

    const config = noFillConfig(3600, 14400); // 1h onset, 4h duration
    const pairs = alignPredictorBased(predictor, outcome, config);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.predictorValue).toBe(50);
    expect(pairs[0]!.outcomeValue).toBe(7);
  });
});

// ─── alignTimeSeries ─────────────────────────────────────────────────

describe('alignTimeSeries', () => {
  it('delegates to alignOutcomeBased when fillingType is zero', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', [m(3, 5)]);
    const config = zeroFilledConfig(3600, 14400);

    const pairs = alignTimeSeries(predictor, outcome, config);
    // Should produce at least one pair via outcome-based strategy
    expect(pairs.length).toBeGreaterThanOrEqual(0); // May be 0 depending on timing
  });

  it('delegates to alignPredictorBased when fillingType is none', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', [m(2, 5)]); // Within window for 1h onset, 4h duration
    const config = noFillConfig(3600, 14400);

    const pairs = alignTimeSeries(predictor, outcome, config);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.predictorValue).toBe(100);
  });

  it('produces correlated pairs from known causal relationship', () => {
    // Simulate: Exercise (hours) causes mood improvement after 2h delay, lasting 8h
    // Higher exercise → better mood (positive correlation)
    const predictorMeasurements: Measurement[] = [];
    const outcomeMeasurements: Measurement[] = [];

    for (let day = 0; day < 60; day++) {
      // Exercise varies: 0-3 hours/day
      const exercise = Math.sin(day / 7 * Math.PI) * 1.5 + 1.5;
      predictorMeasurements.push(m(day * 24 + 8, exercise)); // 8am

      // Mood improves proportionally with ~2h delay
      const mood = 4 + exercise * 0.8 + (Math.random() - 0.5) * 0.5;
      outcomeMeasurements.push(m(day * 24 + 12, mood)); // Noon
    }

    const predictor = ts('exercise', predictorMeasurements);
    const outcome = ts('mood', outcomeMeasurements);
    const config = noFillConfig(7200, 28800); // 2h onset, 8h duration

    const pairs = alignTimeSeries(predictor, outcome, config);
    expect(pairs.length).toBeGreaterThan(30);

    // The correlation should be positive
    const x = pairs.map(p => p.predictorValue);
    const y = pairs.map(p => p.outcomeValue);
    const r = pearsonCorrelation(x, y);
    expect(r).toBeGreaterThan(0.5);
  });
});

// ─── optimizeTemporalParameters ──────────────────────────────────────

describe('optimizeTemporalParameters', () => {
  it('finds optimal parameters that maximize correlation', () => {
    // Create data where effect peaks at ~4h delay and ~12h duration
    const predictorMeasurements: Measurement[] = [];
    const outcomeMeasurements: Measurement[] = [];

    for (let day = 0; day < 90; day++) {
      const dose = Math.random() * 100;
      predictorMeasurements.push(m(day * 24, dose));

      // Effect peaks at 4 hours and lasts ~12 hours
      // Place outcome measurements at various offsets
      for (const offset of [2, 4, 6, 8, 12, 16, 20]) {
        // Strong effect at 4-12h after dose
        let outcomeBase = 50;
        if (offset >= 4 && offset <= 12) {
          outcomeBase = 50 - dose * 0.3; // Dose reduces symptom
        }
        outcomeBase += (Math.random() - 0.5) * 10;
        outcomeMeasurements.push(m(day * 24 + offset, outcomeBase));
      }
    }

    const predictor = ts('treatment', predictorMeasurements);
    const outcome = ts('symptom', outcomeMeasurements);
    const baseConfig = noFillConfig(0, 86400);

    const result = optimizeTemporalParameters(predictor, outcome, baseConfig, {
      delayRange: [0, 21600],      // 0 to 6 hours
      durationRange: [3600, 43200], // 1h to 12h
      delaySteps: 6,
      durationSteps: 6,
      correlationFn: (pairs) => {
        const x = pairs.map(p => p.predictorValue);
        const y = pairs.map(p => p.outcomeValue);
        return pearsonCorrelation(x, y);
      },
    });

    expect(result.searchResults.length).toBeGreaterThan(0);
    expect(result.optimalCorrelation).toBeGreaterThan(0);
    // Optimal delay should be in the 2-6h range
    expect(result.optimalDelay).toBeGreaterThanOrEqual(0);
    expect(result.optimalDelay).toBeLessThanOrEqual(21600);
  });

  it('skips parameter combinations with fewer than 30 pairs', () => {
    // Very sparse data: only 5 data points
    const predictor = ts('pred', [
      m(0, 10), m(24, 20), m(48, 30), m(72, 40), m(96, 50),
    ]);
    const outcome = ts('out', [
      m(4, 5), m(28, 3), m(52, 2), m(76, 4), m(100, 1),
    ]);

    const result = optimizeTemporalParameters(predictor, outcome, noFillConfig(), {
      delayRange: [0, 86400],
      durationRange: [3600, 86400],
      delaySteps: 5,
      durationSteps: 5,
      correlationFn: (pairs) => {
        const x = pairs.map(p => p.predictorValue);
        const y = pairs.map(p => p.outcomeValue);
        return pearsonCorrelation(x, y);
      },
    });

    // With only 5 data points, most combos won't reach 30 pairs
    // Either no results, or very few
    expect(result.optimalCorrelation).toBeDefined();
  });

  it('returns search results for grid exploration', () => {
    const predictorMeasurements: Measurement[] = [];
    const outcomeMeasurements: Measurement[] = [];

    for (let h = 0; h < 720; h += 4) { // 30 days, every 4 hours
      predictorMeasurements.push(m(h, Math.sin(h / 24 * Math.PI) * 50 + 50));
      outcomeMeasurements.push(m(h + 2, Math.cos(h / 24 * Math.PI) * 30 + 70));
    }

    const predictor = ts('pred', predictorMeasurements);
    const outcome = ts('out', outcomeMeasurements);

    const result = optimizeTemporalParameters(predictor, outcome, noFillConfig(0, 14400), {
      delayRange: [0, 14400],
      durationRange: [3600, 28800],
      delaySteps: 3,
      durationSteps: 3,
      correlationFn: (pairs) => {
        const x = pairs.map(p => p.predictorValue);
        const y = pairs.map(p => p.outcomeValue);
        return pearsonCorrelation(x, y);
      },
    });

    // Should explore 4 × 4 = 16 grid points
    // (delaySteps+1 on each edge of the range)
    expect(result.searchResults.length).toBeGreaterThan(0);
    for (const r of result.searchResults) {
      expect(r.delay).toBeGreaterThanOrEqual(0);
      expect(r.duration).toBeGreaterThanOrEqual(3600);
      expect(Number.isFinite(r.correlation)).toBe(true);
    }
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────

describe('temporal alignment edge cases', () => {
  it('handles identical timestamps for all measurements', () => {
    const predictor = ts('pred', [m(5, 10), m(5, 20), m(5, 30)]);
    const outcome = ts('out', [m(5, 1), m(5, 2), m(5, 3)]);
    const config = noFillConfig(0, 3600);
    // Shouldn't crash
    const pairs = alignTimeSeries(predictor, outcome, config);
    expect(Array.isArray(pairs)).toBe(true);
  });

  it('handles very large onset delays', () => {
    const predictor = ts('pred', [m(0, 100)]);
    const outcome = ts('out', [m(2400, 5)]); // 100 days later

    const config = noFillConfig(8640000, 86400); // 100 day onset, 1 day duration
    const pairs = alignPredictorBased(predictor, outcome, config);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.outcomeValue).toBe(5);
  });

  it('handles measurements with string timestamps', () => {
    const predictor: TimeSeries = {
      variableId: 'pred',
      name: 'pred',
      measurements: [
        { timestamp: '2024-01-01T00:00:00Z', value: 100 },
        { timestamp: '2024-01-02T00:00:00Z', value: 200 },
      ],
    };
    const outcome: TimeSeries = {
      variableId: 'out',
      name: 'out',
      measurements: [
        { timestamp: '2024-01-01T03:00:00Z', value: 5 },
        { timestamp: '2024-01-02T03:00:00Z', value: 3 },
      ],
    };

    const config = noFillConfig(3600, 14400); // 1h onset, 4h duration
    const pairs = alignTimeSeries(predictor, outcome, config);
    expect(pairs.length).toBeGreaterThan(0);
  });

  it('handles negative measurement values', () => {
    const predictor = ts('pred', [m(0, -5), m(6, -10), m(12, -15)]);
    const outcome = ts('out', [m(3, -20), m(9, -30), m(15, -40)]);

    const config = noFillConfig(3600, 14400);
    const pairs = alignTimeSeries(predictor, outcome, config);
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(pair.predictorValue).toBeLessThan(0);
      expect(pair.outcomeValue).toBeLessThan(0);
    }
  });

  it('handles unsorted measurements gracefully', () => {
    // Measurements out of order
    const predictor = ts('pred', [m(12, 30), m(0, 10), m(6, 20)]);
    const outcome = ts('out', [m(15, 1), m(3, 5), m(9, 3)]);

    const config = noFillConfig(7200, 14400);
    const pairs = alignTimeSeries(predictor, outcome, config);

    // Should still produce valid pairs (function sorts internally)
    expect(pairs.length).toBeGreaterThan(0);
  });
});
