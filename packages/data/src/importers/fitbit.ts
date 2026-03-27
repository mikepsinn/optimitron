/**
 * Fitbit Export Importer
 *
 * Parses Fitbit's JSON data export (downloaded from fitbit.com/settings/data/export).
 * The export contains per-type JSON files: sleep-*.json, steps-*.json,
 * heart_rate-*.json, exercise-*.json, body-*.json, etc.
 *
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/FitbitConnector.php
 * Legacy API's FitbitConnector is a live OAuth2 connector (vs this file-based parser).
 * Legacy API extracts: sleep stages, heart rate zones, intraday activity, body composition, food logging.
 * legacy API Fitbit API SDK: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/Fitbit/Api/
 *
 * @example
 * ```typescript
 * import { parseFitbitExport, parseFitbitSleepFile } from '@optimitron/data';
 *
 * // Parse individual files
 * const sleepRecords = parseFitbitSleepFile(sleepJsonString);
 *
 * // Or parse all files at once
 * const allRecords = parseFitbitExport({
 *   sleep: [sleepJson1, sleepJson2],
 *   steps: [stepsJson],
 *   heartRate: [hrJson],
 *   exercise: [exerciseJson],
 *   body: [bodyJson],
 * });
 * ```
 */

import type { ParsedHealthRecord } from './apple-health';
import { resolveVariableName } from './standard-variable-names';
import { buildImportSummary, type ImportSummary } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Fitbit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toIso(dateStr: string): string {
  // Fitbit uses various formats: "2024-01-15", "01/15/24 12:00:00",
  // "2024-01-15T08:30:00.000" etc.
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

function makeRecord(
  variableName: string,
  categoryName: string,
  value: number,
  unitName: string,
  unitAbbreviation: string,
  startAt: string,
  endAt?: string,
): ParsedHealthRecord {
  const iso = toIso(startAt);
  return {
    variableName,
    variableCategoryName: categoryName,
    value: Math.round(value * 1000) / 1000,
    unitName,
    unitAbbreviation,
    startAt: iso,
    endAt: endAt ? toIso(endAt) : iso,
    sourceName: SOURCE,
  };
}

// ---------------------------------------------------------------------------
// Sleep parser
// ---------------------------------------------------------------------------

interface FitbitSleepEntry {
  dateOfSleep?: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // milliseconds
  minutesAsleep?: number;
  minutesAwake?: number;
  levels?: {
    summary?: {
      deep?: { minutes?: number };
      light?: { minutes?: number };
      rem?: { minutes?: number };
      wake?: { minutes?: number };
    };
  };
}

/**
 * Parse a Fitbit sleep-*.json file.
 */
export function parseFitbitSleepFile(json: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed || !Array.isArray(parsed)) return [];

  const records: ParsedHealthRecord[] = [];

  for (const entry of parsed as FitbitSleepEntry[]) {
    const date = entry.dateOfSleep ?? entry.startTime ?? '';
    if (!date) continue;
    const endDate = entry.endTime ?? date;

    // Total sleep duration
    if (entry.minutesAsleep != null) {
      records.push(
        makeRecord('Sleep Duration', 'Sleep', entry.minutesAsleep / 60, 'Hours', 'h', date, endDate),
      );
    } else if (entry.duration != null) {
      records.push(
        makeRecord('Sleep Duration', 'Sleep', entry.duration / 3_600_000, 'Hours', 'h', date, endDate),
      );
    }

    // Sleep stages
    const summary = entry.levels?.summary;
    if (summary) {
      if (summary.deep?.minutes != null) {
        records.push(makeRecord('Deep Sleep Duration', 'Sleep', summary.deep.minutes, 'Minutes', 'min', date, endDate));
      }
      if (summary.light?.minutes != null) {
        records.push(makeRecord('Light Sleep Duration', 'Sleep', summary.light.minutes, 'Minutes', 'min', date, endDate));
      }
      if (summary.rem?.minutes != null) {
        records.push(makeRecord('REM Sleep Duration', 'Sleep', summary.rem.minutes, 'Minutes', 'min', date, endDate));
      }
      if (summary.wake?.minutes != null) {
        records.push(makeRecord('Awake Duration During Sleep', 'Sleep', summary.wake.minutes, 'Minutes', 'min', date, endDate));
      }
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Steps parser
// ---------------------------------------------------------------------------

interface FitbitStepsEntry {
  dateTime?: string;
  value?: string | number;
}

/**
 * Parse a Fitbit steps-*.json or time_series file.
 */
export function parseFitbitStepsFile(json: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed || !Array.isArray(parsed)) return [];

  const records: ParsedHealthRecord[] = [];
  for (const entry of parsed as FitbitStepsEntry[]) {
    if (!entry.dateTime) continue;
    const val = Number(entry.value);
    if (Number.isNaN(val) || val === 0) continue;
    records.push(makeRecord('Daily Step Count', 'Physical Activity', val, 'Count', 'count', entry.dateTime));
  }
  return records;
}

// ---------------------------------------------------------------------------
// Heart rate parser
// ---------------------------------------------------------------------------

interface FitbitHeartRateEntry {
  dateTime?: string;
  value?: {
    bpm?: number;
    confidence?: number;
    restingHeartRate?: number;
    heartRateZones?: Array<{
      name?: string;
      minutes?: number;
      caloriesOut?: number;
    }>;
  };
}

/**
 * Parse a Fitbit heart_rate-*.json file.
 */
export function parseFitbitHeartRateFile(json: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed || !Array.isArray(parsed)) return [];

  const records: ParsedHealthRecord[] = [];
  for (const entry of parsed as FitbitHeartRateEntry[]) {
    if (!entry.dateTime) continue;

    // Intraday BPM
    if (entry.value?.bpm != null) {
      records.push(
        makeRecord('Heart Rate', 'Vital Signs', entry.value.bpm, 'Beats per Minute', 'bpm', entry.dateTime),
      );
    }

    // Resting heart rate (from daily summary)
    if (entry.value?.restingHeartRate != null) {
      records.push(
        makeRecord('Resting Heart Rate', 'Vital Signs', entry.value.restingHeartRate, 'Beats per Minute', 'bpm', entry.dateTime),
      );
    }

    // Heart rate zones
    if (entry.value?.heartRateZones) {
      for (const zone of entry.value.heartRateZones) {
        if (zone.name && zone.minutes != null && zone.minutes > 0) {
          records.push(
            makeRecord(
              `Heart Rate Zone: ${zone.name}`,
              'Physical Activity',
              zone.minutes,
              'Minutes',
              'min',
              entry.dateTime,
            ),
          );
        }
        if (zone.name && zone.caloriesOut != null && zone.caloriesOut > 0) {
          records.push(
            makeRecord(
              `Calories Burned in ${zone.name} Zone`,
              'Physical Activity',
              zone.caloriesOut,
              'Kilocalories',
              'kcal',
              entry.dateTime,
            ),
          );
        }
      }
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Exercise parser
// ---------------------------------------------------------------------------

interface FitbitExerciseEntry {
  activityName?: string;
  startTime?: string;
  startDate?: string;
  duration?: number; // milliseconds
  activeDuration?: number; // milliseconds
  calories?: number;
  steps?: number;
  distance?: number;
  distanceUnit?: string;
  averageHeartRate?: number;
}

/**
 * Parse a Fitbit exercise-*.json file.
 */
export function parseFitbitExerciseFile(json: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed || !Array.isArray(parsed)) return [];

  const records: ParsedHealthRecord[] = [];
  for (const entry of parsed as FitbitExerciseEntry[]) {
    const date = entry.startTime ?? entry.startDate ?? '';
    if (!date) continue;

    const activityName = entry.activityName ?? 'Exercise';

    // Active duration
    const durationMs = entry.activeDuration ?? entry.duration;
    if (durationMs != null && durationMs > 0) {
      records.push(
        makeRecord(`${activityName} Duration`, 'Physical Activity', durationMs / 60_000, 'Minutes', 'min', date),
      );
    }

    // Calories burned
    if (entry.calories != null && entry.calories > 0) {
      records.push(
        makeRecord('Calories Burned', 'Physical Activity', entry.calories, 'Kilocalories', 'kcal', date),
      );
    }

    // Steps during exercise
    if (entry.steps != null && entry.steps > 0) {
      records.push(
        makeRecord(`${activityName} Steps`, 'Physical Activity', entry.steps, 'Count', 'count', date),
      );
    }

    // Distance
    if (entry.distance != null && entry.distance > 0) {
      records.push(
        makeRecord(`${activityName} Distance`, 'Physical Activity', entry.distance, 'Kilometres', 'km', date),
      );
    }

    // Average heart rate
    if (entry.averageHeartRate != null) {
      records.push(
        makeRecord('Average Heart Rate During Exercise', 'Vital Signs', entry.averageHeartRate, 'Beats per Minute', 'bpm', date),
      );
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Body parser
// ---------------------------------------------------------------------------

interface FitbitBodyEntry {
  dateTime?: string;
  date?: string;
  weight?: number;
  bmi?: number;
  fat?: number;
}

/**
 * Parse a Fitbit body-*.json file (weight, BMI, body fat).
 */
export function parseFitbitBodyFile(json: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed || !Array.isArray(parsed)) return [];

  const records: ParsedHealthRecord[] = [];
  for (const entry of parsed as FitbitBodyEntry[]) {
    const date = entry.dateTime ?? entry.date ?? '';
    if (!date) continue;

    if (entry.weight != null && entry.weight > 0) {
      records.push(makeRecord('Weight', 'Physique', entry.weight, 'Kilograms', 'kg', date));
    }
    if (entry.bmi != null && entry.bmi > 0) {
      records.push(makeRecord('Body Mass Index', 'Physique', entry.bmi, 'Count', 'kg/m²', date));
    }
    if (entry.fat != null && entry.fat > 0) {
      records.push(makeRecord('Body Fat Percentage', 'Physique', entry.fat, 'Percent', '%', date));
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Aggregate parser
// ---------------------------------------------------------------------------

/** Input for the aggregate Fitbit export parser */
export interface FitbitExportFiles {
  sleep?: string[];
  steps?: string[];
  heartRate?: string[];
  exercise?: string[];
  body?: string[];
}

/**
 * Parse all Fitbit export files at once and return a flat array of records.
 */
export function parseFitbitExport(files: FitbitExportFiles): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const json of files.sleep ?? []) records.push(...parseFitbitSleepFile(json));
  for (const json of files.steps ?? []) records.push(...parseFitbitStepsFile(json));
  for (const json of files.heartRate ?? []) records.push(...parseFitbitHeartRateFile(json));
  for (const json of files.exercise ?? []) records.push(...parseFitbitExerciseFile(json));
  for (const json of files.body ?? []) records.push(...parseFitbitBodyFile(json));

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'fitbit');
  }

  return records;
}

/**
 * Summarize a Fitbit import.
 */
export function summarizeFitbitExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
