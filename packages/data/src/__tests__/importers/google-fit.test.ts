import { describe, it, expect } from 'vitest';
import {
  parseGoogleFitFile,
  parseGoogleFitExport,
  summarizeGoogleFitExport,
} from '../../importers/google-fit';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const DAILY_ACTIVITY_JSON = JSON.stringify([
  {
    date: { year: 2024, month: 1, day: 15 },
    steps: 9500,
    distance: 7200, // metres
    calories: 2100,
    activeMinutes: 45,
    heartRate: { bpm: 72 },
    weight: 75.5,
  },
  {
    date: { year: 2024, month: 1, day: 16 },
    steps: 11000,
    distance: 8500,
    calories: 2350,
    activeMinutes: 60,
  },
]);

const STEPS_RAW_JSON = JSON.stringify([
  {
    startTimeNanos: '1705315200000000000', // 2024-01-15T12:00:00Z
    endTimeNanos: '1705318800000000000', // 2024-01-15T13:00:00Z
    fitValue: [{ value: { intVal: 1250 } }],
  },
  {
    startTimeNanos: '1705318800000000000',
    endTimeNanos: '1705322400000000000',
    fitValue: [{ value: { intVal: 2100 } }],
  },
]);

const HR_RAW_JSON = JSON.stringify({
  point: [
    {
      startTimeNanos: '1705315200000000000',
      endTimeNanos: '1705315200000000000',
      fitValue: [{ value: { fpVal: 72.0 } }],
    },
  ],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Google Fit importer', () => {
  describe('parseGoogleFitFile (daily activity metrics)', () => {
    it('parses daily activity JSON', () => {
      const records = parseGoogleFitFile(DAILY_ACTIVITY_JSON, 'daily_metrics');
      // This will hit the daily activity metrics path since data has 'date' key
      expect(records.length).toBeGreaterThan(0);

      const steps = records.filter((r) => r.variableName === 'Daily Step Count');
      expect(steps.length).toBe(2);
      expect(steps[0]!.value).toBe(9500);
      expect(steps[0]!.sourceName).toBe('Google Fit');

      const weight = records.filter((r) => r.variableName === 'Weight');
      expect(weight.length).toBe(1);
      expect(weight[0]!.value).toBe(75.5);

      const distance = records.filter((r) => r.variableName === 'Walking Distance');
      expect(distance.length).toBe(2);
      expect(distance[0]!.value).toBe(7.2); // 7200m = 7.2km
    });
  });

  describe('parseGoogleFitFile (raw data points)', () => {
    it('parses step count raw data with type hint', () => {
      const records = parseGoogleFitFile(STEPS_RAW_JSON, 'step_count');
      expect(records.length).toBe(2);
      expect(records[0]!.variableName).toBe('Daily Step Count');
      expect(records[0]!.value).toBe(1250);
    });

    it('parses heart rate data from object with point array', () => {
      const records = parseGoogleFitFile(HR_RAW_JSON, 'heart_rate');
      expect(records.length).toBe(1);
      expect(records[0]!.variableName).toBe('Heart Rate');
      expect(records[0]!.value).toBe(72);
    });

    it('returns empty for unrecognised type hint', () => {
      const records = parseGoogleFitFile(STEPS_RAW_JSON, 'unknown_type_xyz');
      expect(records).toEqual([]);
    });
  });

  describe('parseGoogleFitExport', () => {
    it('combines daily metrics and raw data', () => {
      const records = parseGoogleFitExport({
        dailyActivityMetrics: [DAILY_ACTIVITY_JSON],
        rawData: { 'steps.json': STEPS_RAW_JSON, 'heart_rate.json': HR_RAW_JSON },
      });
      expect(records.length).toBeGreaterThan(5);
    });

    it('handles empty input', () => {
      expect(parseGoogleFitExport({})).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('returns empty for invalid JSON', () => {
      expect(parseGoogleFitFile('not json', 'steps')).toEqual([]);
    });

    it('returns empty for null/empty', () => {
      expect(parseGoogleFitFile('null', 'steps')).toEqual([]);
    });

    it('skips entries with missing dates', () => {
      const json = JSON.stringify([{ date: {}, steps: 100 }]);
      const records = parseGoogleFitFile(json, 'daily');
      expect(records).toEqual([]);
    });

    it('handles nanos timestamp conversion', () => {
      const records = parseGoogleFitFile(STEPS_RAW_JSON, 'step_count');
      expect(records[0]!.startAt).toContain('2024-01-15');
    });
  });

  describe('summarizeGoogleFitExport', () => {
    it('produces correct summary', () => {
      const records = parseGoogleFitExport({
        dailyActivityMetrics: [DAILY_ACTIVITY_JSON],
      });
      const summary = summarizeGoogleFitExport(records);
      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Google Fit']);
    });
  });
});
