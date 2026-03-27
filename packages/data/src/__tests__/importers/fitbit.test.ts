import { describe, it, expect } from 'vitest';
import {
  parseFitbitSleepFile,
  parseFitbitStepsFile,
  parseFitbitHeartRateFile,
  parseFitbitExerciseFile,
  parseFitbitBodyFile,
  parseFitbitExport,
  summarizeFitbitExport,
} from '../../importers/fitbit';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SLEEP_JSON = JSON.stringify([
  {
    dateOfSleep: '2024-01-15',
    startTime: '2024-01-14T23:30:00.000',
    endTime: '2024-01-15T07:00:00.000',
    duration: 27_000_000, // 7.5 hours in ms
    minutesAsleep: 420,
    minutesAwake: 30,
    levels: {
      summary: {
        deep: { minutes: 90 },
        light: { minutes: 200 },
        rem: { minutes: 100 },
        wake: { minutes: 30 },
      },
    },
  },
]);

const STEPS_JSON = JSON.stringify([
  { dateTime: '2024-01-15', value: '8500' },
  { dateTime: '2024-01-16', value: '12000' },
  { dateTime: '2024-01-17', value: '0' }, // should be skipped
]);

const HEART_RATE_JSON = JSON.stringify([
  {
    dateTime: '2024-01-15 08:30:00',
    value: { bpm: 72, confidence: 3 },
  },
  {
    dateTime: '2024-01-15',
    value: {
      restingHeartRate: 58,
      heartRateZones: [
        { name: 'Fat Burn', minutes: 45, caloriesOut: 350 },
        { name: 'Cardio', minutes: 20, caloriesOut: 250 },
        { name: 'Peak', minutes: 0, caloriesOut: 0 },
      ],
    },
  },
]);

const EXERCISE_JSON = JSON.stringify([
  {
    activityName: 'Running',
    startTime: '2024-01-15T07:00:00.000',
    activeDuration: 1_800_000, // 30 min
    calories: 350,
    steps: 4000,
    distance: 5.2,
    averageHeartRate: 155,
  },
]);

const BODY_JSON = JSON.stringify([
  { dateTime: '2024-01-15', weight: 75.5, bmi: 24.2, fat: 18.5 },
  { dateTime: '2024-01-16', weight: 75.3 },
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Fitbit importer', () => {
  describe('parseFitbitSleepFile', () => {
    it('parses sleep records with stages', () => {
      const records = parseFitbitSleepFile(SLEEP_JSON);
      expect(records.length).toBe(5); // duration + 4 stages

      const duration = records.find((r) => r.variableName === 'Sleep Duration');
      expect(duration).toBeDefined();
      expect(duration!.value).toBe(7); // 420 minutes = 7 hours
      expect(duration!.unitName).toBe('Hours');
      expect(duration!.sourceName).toBe('Fitbit');

      const deep = records.find((r) => r.variableName === 'Deep Sleep Duration');
      expect(deep).toBeDefined();
      expect(deep!.value).toBe(90);
      expect(deep!.unitName).toBe('Minutes');
    });

    it('returns empty for invalid JSON', () => {
      expect(parseFitbitSleepFile('not json')).toEqual([]);
      expect(parseFitbitSleepFile('null')).toEqual([]);
      expect(parseFitbitSleepFile('{}')).toEqual([]);
    });

    it('returns empty for empty array', () => {
      expect(parseFitbitSleepFile('[]')).toEqual([]);
    });

    it('handles entries without stages', () => {
      const json = JSON.stringify([
        { dateOfSleep: '2024-01-15', minutesAsleep: 480 },
      ]);
      const records = parseFitbitSleepFile(json);
      expect(records.length).toBe(1);
      expect(records[0]!.value).toBe(8); // 480 min = 8 hours
    });
  });

  describe('parseFitbitStepsFile', () => {
    it('parses step entries and skips zeros', () => {
      const records = parseFitbitStepsFile(STEPS_JSON);
      expect(records.length).toBe(2);
      expect(records[0]!.variableName).toBe('Daily Step Count');
      expect(records[0]!.value).toBe(8500);
      expect(records[1]!.value).toBe(12000);
    });

    it('returns empty for empty input', () => {
      expect(parseFitbitStepsFile('[]')).toEqual([]);
    });
  });

  describe('parseFitbitHeartRateFile', () => {
    it('parses BPM, resting HR, and zones', () => {
      const records = parseFitbitHeartRateFile(HEART_RATE_JSON);

      const bpm = records.find((r) => r.variableName === 'Heart Rate');
      expect(bpm).toBeDefined();
      expect(bpm!.value).toBe(72);

      const resting = records.find((r) => r.variableName === 'Resting Heart Rate');
      expect(resting).toBeDefined();
      expect(resting!.value).toBe(58);

      const fatBurnZone = records.find((r) => r.variableName === 'Heart Rate Zone: Fat Burn');
      expect(fatBurnZone).toBeDefined();
      expect(fatBurnZone!.value).toBe(45);

      // Peak zone (0 minutes) should be skipped
      const peak = records.find((r) => r.variableName === 'Heart Rate Zone: Peak');
      expect(peak).toBeUndefined();
    });
  });

  describe('parseFitbitExerciseFile', () => {
    it('parses exercise with all metrics', () => {
      const records = parseFitbitExerciseFile(EXERCISE_JSON);
      expect(records.length).toBe(5); // duration, calories, steps, distance, hr

      const duration = records.find((r) => r.variableName === 'Running Duration');
      expect(duration).toBeDefined();
      expect(duration!.value).toBe(30); // 30 minutes

      const calories = records.find((r) => r.variableName === 'Calories Burned');
      expect(calories!.value).toBe(350);
    });
  });

  describe('parseFitbitBodyFile', () => {
    it('parses weight, BMI, and body fat', () => {
      const records = parseFitbitBodyFile(BODY_JSON);
      expect(records.length).toBe(4); // weight+bmi+fat + weight only

      const weight = records.filter((r) => r.variableName === 'Weight');
      expect(weight.length).toBe(2);
      expect(weight[0]!.value).toBe(75.5);
    });
  });

  describe('parseFitbitExport', () => {
    it('combines all file types', () => {
      const records = parseFitbitExport({
        sleep: [SLEEP_JSON],
        steps: [STEPS_JSON],
        body: [BODY_JSON],
      });
      expect(records.length).toBeGreaterThan(5);
      expect(records.every((r) => r.sourceName === 'Fitbit')).toBe(true);
    });

    it('handles empty input', () => {
      expect(parseFitbitExport({})).toEqual([]);
    });
  });

  describe('summarizeFitbitExport', () => {
    it('produces correct summary', () => {
      const records = parseFitbitExport({ sleep: [SLEEP_JSON], steps: [STEPS_JSON] });
      const summary = summarizeFitbitExport(records);

      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Fitbit']);
      expect(summary.dateRange).not.toBeNull();
      expect(summary.variableCounts['Steps']).toBe(2);
    });
  });
});
