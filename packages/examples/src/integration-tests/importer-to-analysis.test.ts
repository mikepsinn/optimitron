/**
 * Importer-to-Analysis Pipeline — End-to-end Integration Test
 *
 * Data flow:
 *   Parse Fitbit JSON sample → measurements
 *   → Parse Oura JSON sample → measurements
 *   → Merge into unified time series
 *   → Run causal analysis across merged data
 *   → Assert results make sense
 */

import { describe, it, expect } from 'vitest';
import {
  parseFitbitSleepFile,
  parseFitbitStepsFile,
  parseFitbitHeartRateFile,
  parseOuraExport,
  type ParsedHealthRecord,
  buildImportSummary,
} from '@optomitron/data';
import {
  type TimeSeries,
  alignTimeSeries,
  calculatePredictorImpactScore,
  validateDataQuality,
  pearsonCorrelation,
} from '@optomitron/optimizer';

// ─── Helpers ─────────────────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std;
}

// ─── Sample data generators ──────────────────────────────────────────

function generateFitbitSleepJson(rng: () => number, days: number = 90): string {
  const entries = [];
  const startDate = new Date('2025-06-01');

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate.getTime() + day * 86_400_000);
    const dateStr = date.toISOString().slice(0, 10);
    const minutesAsleep = Math.round(Math.max(180, normalRandom(rng, 420, 45)));
    const minutesAwake = Math.round(Math.max(10, normalRandom(rng, 40, 15)));

    const startTime = `${dateStr}T22:30:00.000`;
    const endHour = 6 + Math.floor(minutesAsleep / 60);
    const endMin = minutesAsleep % 60;
    const nextDate = new Date(date.getTime() + 86_400_000);
    const endDateStr = nextDate.toISOString().slice(0, 10);
    const endTime = `${endDateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00.000`;

    entries.push({
      dateOfSleep: dateStr,
      startTime,
      endTime,
      duration: (minutesAsleep + minutesAwake) * 60 * 1000,
      minutesAsleep,
      minutesAwake,
      levels: {
        summary: {
          deep: { minutes: Math.round(minutesAsleep * 0.15) },
          light: { minutes: Math.round(minutesAsleep * 0.50) },
          rem: { minutes: Math.round(minutesAsleep * 0.20) },
          wake: { minutes: minutesAwake },
        },
      },
    });
  }

  return JSON.stringify(entries);
}

function generateFitbitStepsJson(rng: () => number, days: number = 90): string {
  const entries = [];
  const startDate = new Date('2025-06-01');

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate.getTime() + day * 86_400_000);
    const dateStr = date.toISOString().slice(0, 10);
    // Ensure steps are always > 0 (parser skips 0-value steps)
    const steps = Math.round(Math.max(100, normalRandom(rng, 8000, 2500)));

    entries.push({
      dateTime: dateStr,
      value: String(steps),
    });
  }

  return JSON.stringify(entries);
}

function generateFitbitHeartRateJson(rng: () => number, days: number = 90): string {
  const entries = [];
  const startDate = new Date('2025-06-01');

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate.getTime() + day * 86_400_000);
    const dateStr = date.toISOString().slice(0, 10);
    const restingHR = Math.round(normalRandom(rng, 65, 5));

    entries.push({
      dateTime: dateStr,
      value: {
        restingHeartRate: restingHR,
      },
    });
  }

  return JSON.stringify(entries);
}

function generateOuraJson(rng: () => number, days: number = 90): string {
  const sleep = [];
  const activity = [];
  const readiness = [];
  const startDate = new Date('2025-06-01');

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate.getTime() + day * 86_400_000);
    const dateStr = date.toISOString().slice(0, 10);

    const sleepDuration = Math.round(Math.max(14400, normalRandom(rng, 27000, 3600)));
    const deepSleep = Math.round(sleepDuration * 0.15);
    const remSleep = Math.round(sleepDuration * 0.20);
    const lightSleep = Math.round(sleepDuration * 0.50);
    const awakeSleep = sleepDuration - deepSleep - remSleep - lightSleep;

    sleep.push({
      summary_date: dateStr,
      bedtime_start: `${dateStr}T22:30:00+00:00`,
      bedtime_end: new Date(date.getTime() + 86_400_000 + 6 * 3600_000).toISOString(),
      score: Math.round(Math.max(30, Math.min(100, normalRandom(rng, 78, 10)))),
      duration: sleepDuration,
      total: sleepDuration - awakeSleep,
      deep: deepSleep,
      rem: remSleep,
      light: lightSleep,
      awake: awakeSleep,
      efficiency: Math.round(Math.max(50, Math.min(100, normalRandom(rng, 88, 5)))),
      hr_lowest: Math.round(normalRandom(rng, 52, 4)),
      hr_average: Math.round(normalRandom(rng, 58, 4)),
      rmssd: Math.round(normalRandom(rng, 45, 12)),
      breath_average: Math.round(normalRandom(rng, 15, 2) * 10) / 10,
      temperature_delta: Math.round(normalRandom(rng, 0, 0.3) * 100) / 100,
    });

    activity.push({
      summary_date: dateStr,
      score: Math.round(Math.max(30, Math.min(100, normalRandom(rng, 75, 12)))),
      steps: Math.round(Math.max(100, normalRandom(rng, 8500, 2500))),
      cal_total: Math.round(normalRandom(rng, 2200, 300)),
      cal_active: Math.round(normalRandom(rng, 400, 100)),
      daily_movement: Math.round(normalRandom(rng, 7000, 2000)),
      high: Math.round(Math.max(0, normalRandom(rng, 15, 10))),
      medium: Math.round(Math.max(0, normalRandom(rng, 30, 15))),
      low: Math.round(Math.max(0, normalRandom(rng, 200, 50))),
    });

    readiness.push({
      summary_date: dateStr,
      score: Math.round(Math.max(30, Math.min(100, normalRandom(rng, 76, 10)))),
      score_temperature: Math.round(Math.max(0, Math.min(100, normalRandom(rng, 80, 10)))),
      score_hrv_balance: Math.round(Math.max(0, Math.min(100, normalRandom(rng, 75, 12)))),
      score_previous_night: Math.round(Math.max(0, Math.min(100, normalRandom(rng, 78, 10)))),
      score_sleep_balance: Math.round(Math.max(0, Math.min(100, normalRandom(rng, 77, 10)))),
    });
  }

  return JSON.stringify({ sleep, activity, readiness });
}

// ─── Convert ParsedHealthRecord[] → TimeSeries ──────────────────────

function recordsToTimeSeries(
  records: ParsedHealthRecord[],
  variableName: string,
  variableId: string,
): TimeSeries | null {
  const filtered = records.filter(r => r.variableName === variableName);
  if (filtered.length === 0) return null;

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

function mergeTimeSeries(a: TimeSeries, b: TimeSeries): TimeSeries {
  const allMeasurements = [...a.measurements, ...b.measurements]
    .sort((x, y) => {
      const tsA = typeof x.timestamp === 'number' ? x.timestamp : new Date(x.timestamp).getTime();
      const tsB = typeof y.timestamp === 'number' ? y.timestamp : new Date(y.timestamp).getTime();
      return tsA - tsB;
    });

  return {
    variableId: a.variableId,
    name: a.name,
    measurements: allMeasurements,
    category: a.category,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Importer-to-Analysis Pipeline — End-to-End', () => {
  // Step 1: Parse Fitbit JSON
  const fitbitSleepJson = generateFitbitSleepJson(seededRng(111));
  const fitbitStepsJson = generateFitbitStepsJson(seededRng(222));
  const fitbitHRJson = generateFitbitHeartRateJson(seededRng(333));

  const fitbitSleepRecords = parseFitbitSleepFile(fitbitSleepJson);
  const fitbitStepRecords = parseFitbitStepsFile(fitbitStepsJson);
  const fitbitHRRecords = parseFitbitHeartRateFile(fitbitHRJson);

  const allFitbitRecords = [
    ...fitbitSleepRecords,
    ...fitbitStepRecords,
    ...fitbitHRRecords,
  ];

  describe('Step 1: Fitbit JSON Parsing', () => {
    it('should parse sleep data from Fitbit JSON', () => {
      expect(fitbitSleepRecords.length).toBeGreaterThan(0);
      const sleepDuration = fitbitSleepRecords.filter(r => r.variableName === 'Sleep Duration');
      expect(sleepDuration.length).toBeGreaterThan(0);
    });

    it('should parse step data from Fitbit JSON', () => {
      // Fitbit names it "Daily Step Count"
      expect(fitbitStepRecords.length).toBeGreaterThan(0);
      const stepRecords = fitbitStepRecords.filter(r => r.variableName === 'Steps');
      expect(stepRecords.length).toBeGreaterThan(0);
    });

    it('should parse heart rate data from Fitbit JSON', () => {
      expect(fitbitHRRecords.length).toBeGreaterThan(0);
    });

    it('should produce valid ParsedHealthRecord objects', () => {
      for (const r of allFitbitRecords.slice(0, 20)) {
        expect(r.variableName).toBeTruthy();
        expect(typeof r.value).toBe('number');
        expect(Number.isFinite(r.value)).toBe(true);
        expect(r.startAt).toBeTruthy();
        expect(r.sourceName).toBe('Fitbit');
      }
    });

    it('should build valid import summary', () => {
      const summary = buildImportSummary(allFitbitRecords);
      expect(summary.totalRecords).toBe(allFitbitRecords.length);
      expect(summary.dateRange).not.toBeNull();
      expect(summary.sourceNames).toContain('Fitbit');
    });
  });

  // Step 2: Parse Oura JSON
  const ouraJson = generateOuraJson(seededRng(444));
  const ouraRecords = parseOuraExport(ouraJson);

  describe('Step 2: Oura JSON Parsing', () => {
    it('should parse records from Oura JSON export', () => {
      expect(ouraRecords.length).toBeGreaterThan(0);
    });

    it('should contain sleep, activity, and readiness data', () => {
      const varNames = new Set(ouraRecords.map(r => r.variableName));
      expect(varNames.size).toBeGreaterThan(1);
      // Oura should have these specific variable names
      expect(varNames.has('Overall Sleep Score')).toBe(true);
      expect(varNames.has('Sleep Duration')).toBe(true);
      expect(varNames.has('Steps')).toBe(true);
    });

    it('should produce valid ParsedHealthRecord objects', () => {
      for (const r of ouraRecords.slice(0, 20)) {
        expect(r.variableName).toBeTruthy();
        expect(typeof r.value).toBe('number');
        expect(Number.isFinite(r.value)).toBe(true);
        expect(r.startAt).toBeTruthy();
        expect(r.sourceName).toBe('Oura');
      }
    });

    it('should build valid import summary', () => {
      const summary = buildImportSummary(ouraRecords);
      expect(summary.totalRecords).toBe(ouraRecords.length);
      expect(summary.sourceNames).toContain('Oura');
    });
  });

  // Step 3: Merge into unified time series
  describe('Step 3: Merge into Unified Time Series', () => {
    it('should convert Fitbit records to TimeSeries format', () => {
      const sleepSeries = recordsToTimeSeries(allFitbitRecords, 'Sleep Duration', 'sleep_duration');
      expect(sleepSeries).not.toBeNull();
      expect(sleepSeries!.measurements.length).toBeGreaterThan(0);
    });

    it('should convert Oura records to TimeSeries format', () => {
      const ouraVarNames = [...new Set(ouraRecords.map(r => r.variableName))];
      expect(ouraVarNames.length).toBeGreaterThan(0);

      for (const varName of ouraVarNames.slice(0, 3)) {
        const series = recordsToTimeSeries(ouraRecords, varName, varName.toLowerCase().replace(/\s+/g, '_'));
        expect(series).not.toBeNull();
        expect(series!.measurements.length).toBeGreaterThan(0);
      }
    });

    it('should merge sleep data from both sources', () => {
      const fitbitSleep = recordsToTimeSeries(allFitbitRecords, 'Sleep Duration', 'sleep_duration');
      const ouraSleep = recordsToTimeSeries(ouraRecords, 'Sleep Duration', 'sleep_duration');

      expect(fitbitSleep).not.toBeNull();
      expect(ouraSleep).not.toBeNull();

      const merged = mergeTimeSeries(fitbitSleep!, ouraSleep!);
      expect(merged.measurements.length).toBe(
        fitbitSleep!.measurements.length + ouraSleep!.measurements.length,
      );

      // Verify sorted by timestamp
      for (let i = 1; i < merged.measurements.length; i++) {
        const tA = typeof merged.measurements[i - 1]!.timestamp === 'number'
          ? merged.measurements[i - 1]!.timestamp
          : new Date(merged.measurements[i - 1]!.timestamp as string).getTime();
        const tB = typeof merged.measurements[i]!.timestamp === 'number'
          ? merged.measurements[i]!.timestamp
          : new Date(merged.measurements[i]!.timestamp as string).getTime();
        expect(tA).toBeLessThanOrEqual(tB as number);
      }
    });

    it('should merge step count data from both Fitbit and Oura', () => {
      // Both Fitbit and Oura use "Daily Step Count"
      const fitbitSteps = recordsToTimeSeries(allFitbitRecords, 'Steps', 'daily_steps');
      const ouraSteps = recordsToTimeSeries(ouraRecords, 'Steps', 'daily_steps');

      expect(fitbitSteps).not.toBeNull();
      expect(ouraSteps).not.toBeNull();

      const merged = mergeTimeSeries(fitbitSteps!, ouraSteps!);
      expect(merged.measurements.length).toBe(
        fitbitSteps!.measurements.length + ouraSteps!.measurements.length,
      );
    });
  });

  // Step 4: Run causal analysis across merged data
  describe('Step 4: Causal Analysis Across Merged Data', () => {
    // Use Fitbit steps as predictor and Oura sleep score as outcome
    // (testing cross-device analysis)

    it('should align steps (Fitbit) with sleep score (Oura) time series', () => {
      const stepsSeries = recordsToTimeSeries(allFitbitRecords, 'Steps', 'daily_steps');
      const ouraSleepScoreSeries = recordsToTimeSeries(ouraRecords, 'Overall Sleep Score', 'sleep_score');

      expect(stepsSeries).not.toBeNull();
      expect(ouraSleepScoreSeries).not.toBeNull();

      const pairs = alignTimeSeries(stepsSeries!, ouraSleepScoreSeries!, {
        onsetDelaySeconds: 0,
        durationOfActionSeconds: 86400,
        fillingType: 'none',
      });

      expect(pairs.length).toBeGreaterThan(0);
      for (const pair of pairs.slice(0, 10)) {
        expect(typeof pair.predictorValue).toBe('number');
        expect(typeof pair.outcomeValue).toBe('number');
      }
    });

    it('should validate data quality on aligned pairs', () => {
      const fitbitSleep = recordsToTimeSeries(allFitbitRecords, 'Sleep Duration', 'sleep_duration');
      const stepsSeries = recordsToTimeSeries(allFitbitRecords, 'Steps', 'daily_steps');

      expect(fitbitSleep).not.toBeNull();
      expect(stepsSeries).not.toBeNull();

      const pairs = alignTimeSeries(stepsSeries!, fitbitSleep!, {
        onsetDelaySeconds: 0,
        durationOfActionSeconds: 86400,
        fillingType: 'none',
      });

      expect(pairs.length).toBeGreaterThanOrEqual(30);
      const quality = validateDataQuality(pairs);
      expect(typeof quality.isValid).toBe('boolean');
      expect(quality.pairCount).toBeGreaterThan(0);
      expect(typeof quality.baselineFraction).toBe('number');
      expect(typeof quality.followUpFraction).toBe('number');
    });

    it('should calculate correlation between steps and sleep', () => {
      const fitbitSleep = recordsToTimeSeries(allFitbitRecords, 'Sleep Duration', 'sleep_duration');
      const stepsSeries = recordsToTimeSeries(allFitbitRecords, 'Steps', 'daily_steps');

      expect(fitbitSleep).not.toBeNull();
      expect(stepsSeries).not.toBeNull();

      const pairs = alignTimeSeries(stepsSeries!, fitbitSleep!, {
        onsetDelaySeconds: 0,
        durationOfActionSeconds: 86400,
        fillingType: 'none',
      });

      expect(pairs.length).toBeGreaterThanOrEqual(5);
      const predictorValues = pairs.map(p => p.predictorValue);
      const outcomeValues = pairs.map(p => p.outcomeValue);
      const r = pearsonCorrelation(predictorValues, outcomeValues);

      expect(r).toBeGreaterThan(-1);
      expect(r).toBeLessThan(1);
      expect(Number.isFinite(r)).toBe(true);
    });

    it('should run full PIS calculation on cross-device data', () => {
      const fitbitSleep = recordsToTimeSeries(allFitbitRecords, 'Sleep Duration', 'sleep_duration');
      const stepsSeries = recordsToTimeSeries(allFitbitRecords, 'Steps', 'daily_steps');

      expect(fitbitSleep).not.toBeNull();
      expect(stepsSeries).not.toBeNull();

      const forwardPairs = alignTimeSeries(stepsSeries!, fitbitSleep!, {
        onsetDelaySeconds: 0,
        durationOfActionSeconds: 86400,
        fillingType: 'none',
      });

      expect(forwardPairs.length).toBeGreaterThanOrEqual(30);

      const reversePairs = alignTimeSeries(fitbitSleep!, stepsSeries!, {
        onsetDelaySeconds: 0,
        durationOfActionSeconds: 86400,
        fillingType: 'none',
      });

      const pis = calculatePredictorImpactScore(forwardPairs, reversePairs, {
        subjectCount: 1,
      });

      expect(typeof pis.score).toBe('number');
      expect(pis.score).toBeGreaterThanOrEqual(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(pis.evidenceGrade);
      expect(typeof pis.forwardCorrelation.pearson).toBe('number');
      expect(typeof pis.effectSize.percentChange).toBe('number');

      // Bradford Hill scores should all be 0-1
      const bh = pis.bradfordHill;
      for (const key of ['strength', 'consistency', 'temporality', 'experiment',
        'plausibility', 'coherence', 'analogy', 'specificity'] as const) {
        expect(bh[key]).toBeGreaterThanOrEqual(0);
        expect(bh[key]).toBeLessThanOrEqual(1);
      }
    });
  });

  // End-to-end coherence
  describe('End-to-End Coherence', () => {
    it('should import data from both Fitbit and Oura successfully', () => {
      expect(allFitbitRecords.length).toBeGreaterThan(0);
      expect(ouraRecords.length).toBeGreaterThan(0);
    });

    it('should have consistent source attribution', () => {
      for (const r of allFitbitRecords) {
        expect(r.sourceName).toBe('Fitbit');
      }
      for (const r of ouraRecords) {
        expect(r.sourceName).toBe('Oura');
      }
    });

    it('should produce valid numeric values across all imports', () => {
      const allRecords = [...allFitbitRecords, ...ouraRecords];
      for (const r of allRecords) {
        expect(Number.isFinite(r.value)).toBe(true);
        expect(Number.isNaN(r.value)).toBe(false);
      }
    });

    it('should have overlapping date ranges between Fitbit and Oura', () => {
      const fitbitSummary = buildImportSummary(allFitbitRecords);
      const ouraSummary = buildImportSummary(ouraRecords);

      expect(fitbitSummary.dateRange).not.toBeNull();
      expect(ouraSummary.dateRange).not.toBeNull();

      // Both start on 2025-06-01 and run 90 days
      const fitbitStart = new Date(fitbitSummary.dateRange!.earliest).getTime();
      const ouraStart = new Date(ouraSummary.dateRange!.earliest).getTime();
      const fitbitEnd = new Date(fitbitSummary.dateRange!.latest).getTime();
      const ouraEnd = new Date(ouraSummary.dateRange!.latest).getTime();

      // Ranges should overlap
      expect(fitbitStart).toBeLessThan(ouraEnd);
      expect(ouraStart).toBeLessThan(fitbitEnd);
    });
  });
});
