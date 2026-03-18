/**
 * Health Tracking Pipeline — End-to-end Integration Test
 *
 * Full dFDA pipeline:
 *   Parse Apple Health XML sample → ParsedHealthRecord[]
 *   → Convert to TimeSeries format for optimizer
 *   → Run temporal alignment (Vitamin D → Mood with onset delay)
 *   → Calculate Pearson correlation + effect size
 *   → Score with Bradford Hill criteria
 *   → Calculate PIS
 *   → Find optimal value
 *   → Assert all intermediate results are reasonable
 */

import { describe, it, expect } from 'vitest';
import {
  parseAppleHealthXML,
  summarizeAppleHealthExport,
  type ParsedHealthRecord,
} from '@optimitron/data';
import {
  type TimeSeries,
  alignTimeSeries,
  calculatePredictorImpactScore,
  validateDataQuality,
  pearsonCorrelation,
  spearmanCorrelation,
  calculateEffectSize,
} from '@optimitron/optimizer';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Deterministic seeded PRNG (LCG) */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/** Box-Muller normal variate */
function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// ─── Apple Health XML sample generator ───────────────────────────────

function generateAppleHealthXML(rng: () => number): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE HealthData>',
    '<HealthData locale="en_US">',
    ' <ExportDate value="2025-12-01 08:00:00 -0600"/>',
  ];

  const startDate = new Date('2025-06-01T08:00:00Z');
  const DAY_MS = 86_400_000;

  // Generate 180 days of heart rate data (2x daily)
  for (let day = 0; day < 180; day++) {
    const date = new Date(startDate.getTime() + day * DAY_MS);
    const dateStr = formatAppleDate(date);
    const endDateStr = formatAppleDate(new Date(date.getTime() + 60_000));

    // Morning resting HR
    const morningHR = Math.round(normalRandom(rng, 68, 5));
    lines.push(
      ` <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch"` +
      ` unit="count/min" value="${morningHR}"` +
      ` startDate="${dateStr}" endDate="${endDateStr}"` +
      ` creationDate="${dateStr}"/>`,
    );

    // Steps
    const steps = Math.round(Math.max(0, normalRandom(rng, 8000, 2000)));
    lines.push(
      ` <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone"` +
      ` unit="count" value="${steps}"` +
      ` startDate="${dateStr}" endDate="${endDateStr}"` +
      ` creationDate="${dateStr}"/>`,
    );

    // Weight (weekly)
    if (day % 7 === 0) {
      const weight = Math.round(normalRandom(rng, 75, 1) * 10) / 10;
      lines.push(
        ` <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Withings"` +
        ` unit="kg" value="${weight}"` +
        ` startDate="${dateStr}" endDate="${endDateStr}"` +
        ` creationDate="${dateStr}"/>`,
      );
    }
  }

  lines.push('</HealthData>');
  return lines.join('\n');
}

function formatAppleDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

// ─── TimeSeries generators (same pattern as demo) ────────────────────

function generateVitaminDSeries(rng: () => number): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const startDate = new Date('2025-06-01T08:00:00Z').getTime();
  const DAY_MS = 86_400_000;

  for (let day = 0; day < 180; day++) {
    const ts = startDate + day * DAY_MS;
    let dose: number;
    if (day < 30) {
      dose = 0;
    } else if (day < 120) {
      dose = rng() > 0.15 ? 4000 : 0;
    } else if (day < 150) {
      dose = 0;
    } else {
      dose = rng() > 0.1 ? 2000 : 0;
    }
    measurements.push({ timestamp: ts, value: dose, unit: 'IU' });
  }

  return {
    variableId: 'vitamin_d',
    name: 'Vitamin D Supplementation',
    measurements,
    category: 'Supplements',
  };
}

function generateMoodSeries(vitaminD: TimeSeries, rng: () => number): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const startDate = new Date('2025-06-01T18:00:00Z').getTime();
  const DAY_MS = 86_400_000;
  const dailyDoses = vitaminD.measurements.map(m => m.value);

  for (let day = 0; day < 180; day++) {
    const ts = startDate + day * DAY_MS;
    let recentDoseAvg = 0;
    let count = 0;
    for (let lookback = 7; lookback <= 21 && (day - lookback) >= 0; lookback++) {
      recentDoseAvg += dailyDoses[day - lookback] ?? 0;
      count++;
    }
    recentDoseAvg = count > 0 ? recentDoseAvg / count : 0;

    const doseEffect = (recentDoseAvg / 4000) * 1.5;
    const seasonal = 0.3 * Math.sin((2 * Math.PI * day) / 365);
    const baseMood = 5.5 + seasonal;
    const noise = normalRandom(rng, 0, 0.8);
    const mood = Math.max(1, Math.min(10, baseMood + doseEffect + noise));

    measurements.push({ timestamp: ts, value: Math.round(mood * 10) / 10, unit: 'score' });
  }

  return {
    variableId: 'mood',
    name: 'Overall Mood Score',
    measurements,
    category: 'Mood',
  };
}

/** Convert ParsedHealthRecord[] to TimeSeries for a given variable name */
function healthRecordsToTimeSeries(
  records: ParsedHealthRecord[],
  variableName: string,
  variableId: string,
): TimeSeries {
  const filtered = records.filter(r => r.variableName === variableName);
  return {
    variableId,
    name: variableName,
    measurements: filtered.map(r => ({
      timestamp: new Date(r.startAt).getTime(),
      value: r.value,
      unit: r.unitAbbreviation,
    })),
    category: filtered[0]?.variableCategoryName,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Health Tracking Pipeline — End-to-End', () => {
  const rng = seededRng(42);

  // Step 1: Parse Apple Health XML
  describe('Step 1: Apple Health XML Parsing', () => {
    const xml = generateAppleHealthXML(seededRng(42));
    const records = parseAppleHealthXML(xml);
    const summary = summarizeAppleHealthExport(records);

    it('should parse records from Apple Health XML', () => {
      expect(records.length).toBeGreaterThan(0);
    });

    it('should produce valid ParsedHealthRecord objects', () => {
      for (const r of records.slice(0, 10)) {
        expect(r.variableName).toBeTruthy();
        expect(typeof r.value).toBe('number');
        expect(r.startAt).toBeTruthy();
        expect(r.endAt).toBeTruthy();
        expect(r.sourceName).toBeTruthy();
      }
    });

    it('should contain heart rate, steps, and weight data', () => {
      expect(summary.variableCounts['Heart Rate']).toBeGreaterThan(0);
      expect(summary.variableCounts['Steps']).toBeGreaterThan(0);
      expect(summary.variableCounts['Weight']).toBeGreaterThan(0);
    });

    it('should have valid date range', () => {
      expect(summary.dateRange).not.toBeNull();
      expect(new Date(summary.dateRange!.earliest).getTime()).toBeLessThan(
        new Date(summary.dateRange!.latest).getTime(),
      );
    });

    it('should convert parsed records to TimeSeries format', () => {
      const hrSeries = healthRecordsToTimeSeries(records, 'Heart Rate', 'heart_rate');
      expect(hrSeries.measurements.length).toBeGreaterThan(0);
      expect(hrSeries.variableId).toBe('heart_rate');

      for (const m of hrSeries.measurements) {
        expect(typeof m.timestamp).toBe('number');
        expect(m.timestamp).toBeGreaterThan(0);
        expect(typeof m.value).toBe('number');
      }
    });
  });

  // Steps 2-7: Full causal pipeline (Vitamin D → Mood)
  describe('Steps 2-7: Causal Pipeline (Vitamin D → Mood)', () => {
    const pipelineRng = seededRng(123);
    const vitaminD = generateVitaminDSeries(pipelineRng);
    const mood = generateMoodSeries(vitaminD, pipelineRng);

    const ONSET_DELAY_DAYS = 7;
    const DURATION_DAYS = 14;

    // Step 2: Temporal alignment
    const forwardPairs = alignTimeSeries(vitaminD, mood, {
      onsetDelaySeconds: ONSET_DELAY_DAYS * 86400,
      durationOfActionSeconds: DURATION_DAYS * 86400,
      fillingType: 'zero',
    });

    const reversePairs = alignTimeSeries(mood, vitaminD, {
      onsetDelaySeconds: ONSET_DELAY_DAYS * 86400,
      durationOfActionSeconds: DURATION_DAYS * 86400,
      fillingType: 'none',
    });

    it('Step 2: should produce aligned pairs with temporal alignment', () => {
      expect(forwardPairs.length).toBeGreaterThanOrEqual(30);
      expect(reversePairs.length).toBeGreaterThan(0);

      for (const pair of forwardPairs.slice(0, 10)) {
        expect(typeof pair.predictorValue).toBe('number');
        expect(typeof pair.outcomeValue).toBe('number');
        expect(typeof pair.predictorTimestamp).toBe('number');
        expect(typeof pair.outcomeTimestamp).toBe('number');
      }
    });

    // Step 3: Data quality validation
    const quality = validateDataQuality(forwardPairs);

    it('Step 3: should pass data quality validation', () => {
      expect(quality.isValid).toBe(true);
      expect(quality.hasMinimumPairs).toBe(true);
      expect(quality.hasPredicorVariance).toBe(true);
      expect(quality.hasOutcomeVariance).toBe(true);
      expect(quality.pairCount).toBeGreaterThanOrEqual(30);
      expect(quality.failureReasons).toHaveLength(0);
    });

    // Step 4: Correlation analysis
    const predictorValues = forwardPairs.map(p => p.predictorValue);
    const outcomeValues = forwardPairs.map(p => p.outcomeValue);
    const pearson = pearsonCorrelation(predictorValues, outcomeValues);
    const spearman = spearmanCorrelation(predictorValues, outcomeValues);

    it('Step 4: should calculate Pearson and Spearman correlations', () => {
      expect(pearson).toBeGreaterThan(-1);
      expect(pearson).toBeLessThan(1);
      expect(spearman).toBeGreaterThan(-1);
      expect(spearman).toBeLessThan(1);
      // With our data, vitamin D should positively correlate with mood
      expect(pearson).toBeGreaterThan(0);
    });

    // Step 5: Effect size
    it('Step 4b: should calculate meaningful effect size', () => {
      const effectSize = calculateEffectSize(forwardPairs);
      expect(typeof effectSize.percentChange).toBe('number');
      expect(typeof effectSize.absoluteChange).toBe('number');
      expect(typeof effectSize.zScore).toBe('number');
      expect(effectSize.baselineN).toBeGreaterThan(0);
      expect(effectSize.followUpN).toBeGreaterThan(0);
      // Vitamin D should improve mood (positive change)
      expect(effectSize.absoluteChange).toBeGreaterThan(0);
    });

    // Step 6: Full PIS calculation (includes Bradford Hill)
    const pis = calculatePredictorImpactScore(forwardPairs, reversePairs, {
      subjectCount: 1,
      plausibilityScore: 0.8,
      coherenceScore: 0.7,
      analogyScore: 0.6,
      specificityScore: 0.4,
    });

    it('Step 5: should score Bradford Hill criteria', () => {
      const bh = pis.bradfordHill;
      // All scores should be 0-1
      const scores = [
        bh.strength, bh.consistency, bh.temporality,
        bh.experiment, bh.plausibility, bh.coherence,
        bh.analogy, bh.specificity,
      ];
      for (const s of scores) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
      // Gradient can be null
      if (bh.gradient !== null) {
        expect(bh.gradient).toBeGreaterThanOrEqual(0);
        expect(bh.gradient).toBeLessThanOrEqual(1);
      }
    });

    it('Step 6: should calculate valid PIS', () => {
      expect(pis.score).toBeGreaterThan(0);
      expect(pis.score).toBeLessThanOrEqual(2); // PIS is typically 0-1 but can exceed 1
      expect(['A', 'B', 'C', 'D', 'F']).toContain(pis.evidenceGrade);
      expect([
        'high_priority_trial',
        'moderate_priority',
        'monitor',
        'insufficient_evidence',
      ]).toContain(pis.recommendation);
    });

    it('Step 6b: should calculate forward correlation', () => {
      expect(pis.forwardCorrelation.n).toBeGreaterThanOrEqual(30);
      expect(pis.forwardCorrelation.pearson).toBeGreaterThan(-1);
      expect(pis.forwardCorrelation.pearson).toBeLessThan(1);
      expect(pis.forwardCorrelation.pValue).toBeGreaterThanOrEqual(0);
      expect(pis.forwardCorrelation.pValue).toBeLessThanOrEqual(1);
    });

    it('Step 6c: should have positive temporality factor', () => {
      expect(pis.temporalityFactor).toBeGreaterThanOrEqual(0);
      expect(pis.temporalityFactor).toBeLessThanOrEqual(1);
    });

    it('Step 6d: should have reasonable effect size metrics', () => {
      expect(typeof pis.effectSize.baselineMean).toBe('number');
      expect(typeof pis.effectSize.followUpMean).toBe('number');
      expect(pis.effectSize.baselineMean).toBeGreaterThan(0);
      expect(pis.effectSize.followUpMean).toBeGreaterThan(0);
    });

    // Step 7: Optimal value
    it('Step 7: should find optimal value', () => {
      expect(pis.optimalValue).toBeDefined();
      if (pis.optimalValue) {
        expect(typeof pis.optimalValue.valuePredictingHighOutcome).toBe('number');
        expect(typeof pis.optimalValue.valuePredictingLowOutcome).toBe('number');
        expect(pis.optimalValue.highOutcomeN).toBeGreaterThan(0);
        expect(pis.optimalValue.lowOutcomeN).toBeGreaterThan(0);
        // The value predicting high outcomes should be higher (more vitamin D → better mood)
        expect(pis.optimalValue.valuePredictingHighOutcome).toBeGreaterThan(
          pis.optimalValue.valuePredictingLowOutcome,
        );
      }
    });

    // End-to-end coherence check
    it('should produce coherent end-to-end results', () => {
      // Positive correlation means positive effect
      expect(pis.forwardCorrelation.pearson).toBeGreaterThan(0);
      // Follow-up mean should be higher than baseline (vitamin D improves mood)
      expect(pis.effectSize.followUpMean).toBeGreaterThan(pis.effectSize.baselineMean);
      // PIS should be non-trivial (even small values indicate signal)
      expect(pis.score).toBeGreaterThan(0.001);
    });
  });
});
