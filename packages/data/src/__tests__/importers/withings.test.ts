import { describe, it, expect } from 'vitest';
import {
  parseWithingsWeightFile,
  parseWithingsBloodPressureFile,
  parseWithingsSleepFile,
  parseWithingsActivityFile,
  parseWithingsHeartRateFile,
  parseWithingsExport,
  summarizeWithingsExport,
} from '../../importers/withings';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const WEIGHT_CSV = `Date,Weight (kg),Fat mass (kg),Fat free mass (kg),BMI,Bone mass (kg),Muscle mass (kg)
2024-01-15 07:30:00,75.5,14.2,61.3,24.2,3.1,35.8
2024-01-16 07:25:00,75.3,14.0,61.3,24.1,3.1,35.9`;

const BP_CSV = `Date,Systolic (mmHg),Diastolic (mmHg),Heart rate (bpm)
2024-01-15 08:00:00,120,80,68
2024-01-15 20:00:00,118,78,72`;

const SLEEP_CSV = `From,To,Duration (s),Deep (s),Light (s),REM (s),Awake (s),Sleep Score
2024-01-14 23:00:00,2024-01-15 07:00:00,28800,5400,14400,6000,3000,82
2024-01-15 23:30:00,2024-01-16 06:45:00,26100,4800,13200,5400,2700,78`;

const ACTIVITY_CSV = `Date,Steps,Distance (m),Active calories (kcal),Total calories (kcal),Elevation (m)
2024-01-15,9200,7200,420,2100,15
2024-01-16,11500,9000,550,2350,22`;

const HR_CSV = `Date,Heart rate (bpm)
2024-01-15 08:00:00,68
2024-01-15 12:00:00,75
2024-01-15 18:00:00,82`;

// Semicolon-delimited (European locale)
const WEIGHT_CSV_EURO = `Date;Weight (kg);BMI
2024-01-15 07:30:00;75,5;24,2`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Withings importer', () => {
  describe('parseWithingsWeightFile', () => {
    it('parses weight, fat mass, BMI, and other metrics', () => {
      const records = parseWithingsWeightFile(WEIGHT_CSV);
      expect(records.length).toBeGreaterThan(0);

      const weight = records.filter((r) => r.variableName === 'Weight');
      expect(weight.length).toBe(2);
      expect(weight[0]!.value).toBe(75.5);
      expect(weight[0]!.unitName).toBe('Kilograms');
      expect(weight[0]!.sourceName).toBe('Withings');

      const fatMass = records.filter((r) => r.variableName === 'Fat Mass');
      expect(fatMass.length).toBe(2);
      expect(fatMass[0]!.value).toBe(14.2);

      const bmi = records.filter((r) => r.variableName === 'Body Mass Index');
      expect(bmi.length).toBe(2);
    });

    it('handles semicolon-delimited European format', () => {
      const records = parseWithingsWeightFile(WEIGHT_CSV_EURO);
      expect(records.length).toBe(2); // weight + BMI
      const weight = records.find((r) => r.variableName === 'Weight');
      expect(weight!.value).toBe(75.5);
    });
  });

  describe('parseWithingsBloodPressureFile', () => {
    it('parses systolic, diastolic, and heart rate', () => {
      const records = parseWithingsBloodPressureFile(BP_CSV);
      expect(records.length).toBe(6); // 2 entries × 3 metrics

      const systolic = records.filter((r) => r.variableName === 'Blood Pressure Systolic');
      expect(systolic.length).toBe(2);
      expect(systolic[0]!.value).toBe(120);
      expect(systolic[0]!.unitAbbreviation).toBe('mmHg');
    });
  });

  describe('parseWithingsSleepFile', () => {
    it('parses sleep duration, stages, and score', () => {
      const records = parseWithingsSleepFile(SLEEP_CSV);
      expect(records.length).toBeGreaterThan(0);

      const duration = records.filter((r) => r.variableName === 'Sleep Duration');
      expect(duration.length).toBe(2);
      expect(duration[0]!.value).toBe(8); // 28800s = 8h

      const deep = records.filter((r) => r.variableName === 'Deep Sleep Duration');
      expect(deep.length).toBe(2);
      expect(deep[0]!.value).toBe(90); // 5400s = 90 min

      const score = records.filter((r) => r.variableName === 'Sleep Score');
      expect(score.length).toBe(2);
      expect(score[0]!.value).toBe(82);
    });
  });

  describe('parseWithingsActivityFile', () => {
    it('parses steps, distance, calories', () => {
      const records = parseWithingsActivityFile(ACTIVITY_CSV);
      expect(records.length).toBeGreaterThan(0);

      const steps = records.filter((r) => r.variableName === 'Daily Step Count');
      expect(steps.length).toBe(2);
      expect(steps[0]!.value).toBe(9200);

      const dist = records.filter((r) => r.variableName === 'Walking Distance');
      expect(dist.length).toBe(2);
      expect(dist[0]!.value).toBe(7.2); // 7200m = 7.2km
    });
  });

  describe('parseWithingsHeartRateFile', () => {
    it('parses heart rate entries', () => {
      const records = parseWithingsHeartRateFile(HR_CSV);
      expect(records.length).toBe(3);
      expect(records[0]!.value).toBe(68);
      expect(records[0]!.unitAbbreviation).toBe('bpm');
    });
  });

  describe('parseWithingsExport (aggregate)', () => {
    it('combines all file types', () => {
      const records = parseWithingsExport({
        weight: WEIGHT_CSV,
        bloodPressure: BP_CSV,
        sleep: SLEEP_CSV,
        activity: ACTIVITY_CSV,
        heartRate: HR_CSV,
      });
      expect(records.length).toBeGreaterThan(10);
      expect(records.every((r) => r.sourceName === 'Withings')).toBe(true);
    });

    it('handles partial input', () => {
      const records = parseWithingsExport({ weight: WEIGHT_CSV });
      expect(records.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty CSV', () => {
      expect(parseWithingsWeightFile('')).toEqual([]);
    });

    it('returns empty for headers only', () => {
      expect(parseWithingsWeightFile('Date,Weight (kg)')).toEqual([]);
    });
  });

  describe('summarizeWithingsExport', () => {
    it('produces correct summary', () => {
      const records = parseWithingsExport({ weight: WEIGHT_CSV, bloodPressure: BP_CSV });
      const summary = summarizeWithingsExport(records);
      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Withings']);
    });
  });
});
