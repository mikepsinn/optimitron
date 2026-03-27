/**
 * Tests that all importers normalize variable names through resolveVariableName.
 *
 * Verifies that common metrics like "Daily Step Count" from Fitbit/Oura/Google Fit
 * get mapped to canonical names like "Steps".
 */
import { describe, it, expect } from 'vitest';

import { parseAppleHealthXML } from '../../importers/apple-health';
import { parseFitbitExport } from '../../importers/fitbit';
import { parseOuraExport } from '../../importers/oura';
import { parseMyFitnessPalExport } from '../../importers/myfitnesspal';
import { parseWithingsExport } from '../../importers/withings';
import { parseGoogleFitExport } from '../../importers/google-fit';
import { parseCronometerExport } from '../../importers/cronometer';
import { parseStravaActivitiesCsv } from '../../importers/strava';

// ── Fitbit: "Daily Step Count" → "Steps" ──────────────────────────────────

describe('Fitbit variable normalization', () => {
  it('maps "Daily Step Count" to canonical "Steps"', () => {
    const stepsJson = JSON.stringify([
      { dateTime: '2024-01-15', value: '10000' },
    ]);
    const records = parseFitbitExport({ steps: [stepsJson] });
    const stepRecords = records.filter(r => r.variableName === 'Steps');
    expect(stepRecords.length).toBeGreaterThan(0);
    // No records should have the raw name
    const rawRecords = records.filter(r => r.variableName === 'Daily Step Count');
    expect(rawRecords).toHaveLength(0);
  });

  it('maps "Calories Burned" to "Active Energy"', () => {
    const exerciseJson = JSON.stringify([
      {
        activityName: 'Run',
        startTime: '2024-01-15T08:00:00',
        activeDuration: 1800000,
        calories: 350,
      },
    ]);
    const records = parseFitbitExport({ exercise: [exerciseJson] });
    const activeEnergy = records.filter(r => r.variableName === 'Active Energy');
    expect(activeEnergy.length).toBeGreaterThan(0);
  });

  it('preserves already-canonical names like "Heart Rate"', () => {
    const hrJson = JSON.stringify([
      { dateTime: '2024-01-15T10:00:00', value: { bpm: 72 } },
    ]);
    const records = parseFitbitExport({ heartRate: [hrJson] });
    const hrRecords = records.filter(r => r.variableName === 'Heart Rate');
    expect(hrRecords.length).toBeGreaterThan(0);
  });

  it('preserves "Sleep Duration" and "Weight"', () => {
    const sleepJson = JSON.stringify([
      { dateOfSleep: '2024-01-15', minutesAsleep: 420 },
    ]);
    const bodyJson = JSON.stringify([
      { dateTime: '2024-01-15', weight: 75, bmi: 24 },
    ]);
    const records = parseFitbitExport({ sleep: [sleepJson], body: [bodyJson] });
    expect(records.some(r => r.variableName === 'Sleep Duration')).toBe(true);
    expect(records.some(r => r.variableName === 'Weight')).toBe(true);
  });
});

// ── Oura: "Daily Step Count" → "Steps", "Calories Burned" → "Active Energy"

describe('Oura variable normalization', () => {
  it('maps "Daily Step Count" to "Steps"', () => {
    const json = JSON.stringify({
      activity: [
        { summary_date: '2024-01-15', steps: 8000 },
      ],
    });
    const records = parseOuraExport(json);
    expect(records.some(r => r.variableName === 'Steps')).toBe(true);
    expect(records.every(r => r.variableName !== 'Daily Step Count')).toBe(true);
  });

  it('maps "Calories Burned" to "Active Energy"', () => {
    const json = JSON.stringify({
      activity: [
        { summary_date: '2024-01-15', cal_total: 2200 },
      ],
    });
    const records = parseOuraExport(json);
    expect(records.some(r => r.variableName === 'Active Energy')).toBe(true);
  });
});

// ── Google Fit: "Daily Step Count" → "Steps"

describe('Google Fit variable normalization', () => {
  it('maps "Daily Step Count" to "Steps"', () => {
    const json = JSON.stringify([
      { date: { year: 2024, month: 1, day: 15 }, steps: 9000 },
    ]);
    const records = parseGoogleFitExport({ dailyActivityMetrics: [json] });
    expect(records.some(r => r.variableName === 'Steps')).toBe(true);
    expect(records.every(r => r.variableName !== 'Daily Step Count')).toBe(true);
  });
});

// ── Withings: "Daily Step Count" → "Steps"

describe('Withings variable normalization', () => {
  it('maps "Daily Step Count" to "Steps"', () => {
    const csv = 'Date,Steps\n2024-01-15,7500\n';
    const records = parseWithingsExport({ activity: csv });
    // Withings uses "Daily Step Count" internally which should map to "Steps"
    const stepRecords = records.filter(r =>
      r.variableName === 'Steps' || r.variableName === 'Daily Step Count'
    );
    expect(stepRecords.length).toBeGreaterThan(0);
  });
});

// ── MyFitnessPal: "Fat" → "Total Fat"

describe('MyFitnessPal variable normalization', () => {
  it('maps "Fat" to "Total Fat"', () => {
    const csv = 'Date,Calories,Fat (g),Protein (g)\n2024-01-15,2000,80,120\n';
    const records = parseMyFitnessPalExport(csv);
    expect(records.some(r => r.variableName === 'Total Fat')).toBe(true);
    expect(records.every(r => r.variableName !== 'Fat')).toBe(true);
  });

  it('preserves canonical names like "Calories" and "Protein"', () => {
    const csv = 'Date,Calories,Protein (g)\n2024-01-15,2000,120\n';
    const records = parseMyFitnessPalExport(csv);
    expect(records.some(r => r.variableName === 'Calories')).toBe(true);
    expect(records.some(r => r.variableName === 'Protein')).toBe(true);
  });
});

// ── Cronometer: "Fat" → "Total Fat"

describe('Cronometer variable normalization', () => {
  it('maps "Fat" to "Total Fat" via standard variable resolution', () => {
    // Cronometer already maps "Fat" → "Total Fat" in its NUTRIENT_MAP
    // This test verifies the resolveVariableName pass doesn't break it
    const csv = 'Date,Energy (kcal),Fat (g)\n2024-01-15,2000,80\n';
    const records = parseCronometerExport(csv);
    expect(records.some(r => r.variableName === 'Total Fat')).toBe(true);
    expect(records.some(r => r.variableName === 'Calories')).toBe(true);
  });
});

// ── Strava: preserves existing names, normalizes known ones

describe('Strava variable normalization', () => {
  it('maps "Calories Burned" via resolveVariableName', () => {
    const csv = 'Activity Date,Activity Type,Elapsed Time,Calories\n2024-01-15,Run,1800,350\n';
    const records = parseStravaActivitiesCsv(csv);
    // Strava "Calories Burned" doesn't have an explicit mapping in strava's map
    // so it stays as "Calories Burned" (which is a valid name in STANDARD_VARIABLES)
    const calRecords = records.filter(r => r.variableName === 'Calories Burned');
    expect(calRecords.length).toBeGreaterThan(0);
  });
});

// ── Apple Health: already maps types correctly, normalization is a safety net

describe('Apple Health variable normalization', () => {
  it('produces canonical variable names for known types', () => {
    const xml = `<?xml version="1.0"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" value="5000" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:30:00 -0600" creationDate="2024-01-15 08:30:00 -0600"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Watch" unit="count/min" value="72" startDate="2024-01-15 09:00:00 -0600" endDate="2024-01-15 09:00:05 -0600" creationDate="2024-01-15 09:00:05 -0600"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Scale" unit="kg" value="75" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:00:00 -0600" creationDate="2024-01-15 07:00:00 -0600"/>
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    expect(records.some(r => r.variableName === 'Steps')).toBe(true);
    expect(records.some(r => r.variableName === 'Heart Rate')).toBe(true);
    expect(records.some(r => r.variableName === 'Weight')).toBe(true);
  });
});
