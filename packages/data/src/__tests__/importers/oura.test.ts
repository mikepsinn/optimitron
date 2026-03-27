import { describe, it, expect } from 'vitest';
import { parseOuraExport, summarizeOuraExport } from '../../importers/oura';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const OURA_EXPORT_V1 = JSON.stringify({
  sleep: [
    {
      summary_date: '2024-01-15',
      bedtime_start: '2024-01-14T23:00:00+00:00',
      bedtime_end: '2024-01-15T07:00:00+00:00',
      score: 85,
      total: 25200, // 7 hours in seconds
      deep: 5400, // 90 min
      rem: 4200, // 70 min
      light: 12600, // 210 min
      efficiency: 92,
      hr_lowest: 52,
      hr_average: 58,
      rmssd: 45,
      breath_average: 14.5,
      temperature_delta: 0.3,
      spo2_percentage: { average: 97 },
    },
  ],
  activity: [
    {
      summary_date: '2024-01-15',
      score: 88,
      steps: 9500,
      cal_total: 2200,
      cal_active: 450,
      daily_movement: 8500, // metres
      high: 25,
      medium: 45,
      low: 120,
    },
  ],
  readiness: [
    {
      summary_date: '2024-01-15',
      score: 82,
      score_temperature: 95,
      score_hrv_balance: 78,
      score_resting_hr: 90,
      score_recovery_index: 85,
      score_sleep_balance: 88,
      score_activity_balance: 75,
    },
  ],
});

const OURA_EXPORT_V2 = JSON.stringify({
  daily_sleep: [
    {
      summary_date: '2024-02-01',
      score: 90,
      total: 28800,
      deep: 6000,
      rem: 5400,
    },
  ],
  daily_activity: [
    {
      summary_date: '2024-02-01',
      score: 92,
      steps: 11000,
    },
  ],
  daily_readiness: [
    {
      summary_date: '2024-02-01',
      score: 95,
    },
  ],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Oura importer', () => {
  describe('parseOuraExport (v1 format)', () => {
    it('parses sleep records', () => {
      const records = parseOuraExport(OURA_EXPORT_V1);
      const sleepScore = records.find((r) => r.variableName === 'Overall Sleep Score');
      expect(sleepScore).toBeDefined();
      expect(sleepScore!.value).toBe(85);
      expect(sleepScore!.sourceName).toBe('Oura');

      const sleepDuration = records.find((r) => r.variableName === 'Sleep Duration');
      expect(sleepDuration).toBeDefined();
      expect(sleepDuration!.value).toBe(7); // 25200 sec = 7 hours

      const deepSleep = records.find((r) => r.variableName === 'Deep Sleep Duration');
      expect(deepSleep).toBeDefined();
      expect(deepSleep!.value).toBe(90); // 5400 sec = 90 min

      const hrv = records.find((r) => r.variableName === 'Heart Rate Variability');
      expect(hrv).toBeDefined();
      expect(hrv!.value).toBe(45);
      expect(hrv!.unitName).toBe('Milliseconds');

      const tempDev = records.find((r) => r.variableName === 'Body Temperature Deviation');
      expect(tempDev).toBeDefined();
      expect(tempDev!.value).toBe(0.3);

      const spo2 = records.find((r) => r.variableName === 'Blood Oxygen');
      expect(spo2).toBeDefined();
      expect(spo2!.value).toBe(97);
    });

    it('parses activity records', () => {
      const records = parseOuraExport(OURA_EXPORT_V1);
      const steps = records.find((r) => r.variableName === 'Steps');
      expect(steps).toBeDefined();
      expect(steps!.value).toBe(9500);

      const activityScore = records.find((r) => r.variableName === 'Daily Activity Score');
      expect(activityScore!.value).toBe(88);

      const movement = records.find((r) => r.variableName === 'Daily Movement Distance');
      expect(movement!.value).toBe(8.5); // 8500m = 8.5km
    });

    it('parses readiness records', () => {
      const records = parseOuraExport(OURA_EXPORT_V1);
      const readiness = records.find((r) => r.variableName === 'Daily Readiness Score');
      expect(readiness!.value).toBe(82);

      const hrvBalance = records.find((r) => r.variableName === 'HRV Balance Score');
      expect(hrvBalance!.value).toBe(78);
    });
  });

  describe('parseOuraExport (v2 format)', () => {
    it('parses daily_sleep, daily_activity, daily_readiness keys', () => {
      const records = parseOuraExport(OURA_EXPORT_V2);
      expect(records.length).toBeGreaterThan(0);

      const sleepScore = records.find((r) => r.variableName === 'Overall Sleep Score');
      expect(sleepScore!.value).toBe(90);

      const steps = records.find((r) => r.variableName === 'Steps');
      expect(steps!.value).toBe(11000);

      const readiness = records.find((r) => r.variableName === 'Daily Readiness Score');
      expect(readiness!.value).toBe(95);
    });
  });

  describe('edge cases', () => {
    it('returns empty for invalid JSON', () => {
      expect(parseOuraExport('not json')).toEqual([]);
    });

    it('returns empty for non-object', () => {
      expect(parseOuraExport('"string"')).toEqual([]);
      expect(parseOuraExport('42')).toEqual([]);
    });

    it('returns empty for empty export', () => {
      expect(parseOuraExport('{}')).toEqual([]);
    });

    it('skips entries without dates', () => {
      const json = JSON.stringify({ sleep: [{ score: 85 }] });
      expect(parseOuraExport(json)).toEqual([]);
    });
  });

  describe('summarizeOuraExport', () => {
    it('produces correct summary', () => {
      const records = parseOuraExport(OURA_EXPORT_V1);
      const summary = summarizeOuraExport(records);

      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Oura']);
      expect(summary.dateRange).not.toBeNull();
    });
  });
});
