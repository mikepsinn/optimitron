/**
 * Oura Ring Export Importer
 *
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/OuraConnector.php
 *
 * Parses Oura Ring JSON export data. Users can export their data from the
 * Oura web dashboard. The export contains daily summaries for sleep,
 * readiness, and activity.
 *
 * @example
 * ```typescript
 * import { parseOuraExport } from '@optimitron/data';
 * const records = parseOuraExport(jsonString);
 * ```
 */

import type { ParsedHealthRecord } from './apple-health.js';
import { resolveVariableName } from './standard-variable-names.js';
import { buildImportSummary, type ImportSummary } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Oura';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIso(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

function rec(
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
// Oura data shape
// ---------------------------------------------------------------------------

interface OuraSleepEntry {
  summary_date?: string;
  bedtime_start?: string;
  bedtime_end?: string;
  score?: number;
  duration?: number; // seconds
  total?: number; // seconds
  deep?: number; // seconds
  rem?: number; // seconds
  light?: number; // seconds
  awake?: number; // seconds
  efficiency?: number;
  hr_lowest?: number;
  hr_average?: number;
  rmssd?: number; // HRV (root mean square of successive differences)
  breath_average?: number;
  temperature_delta?: number;
  score_total?: number;
  score_rem?: number;
  score_deep?: number;
  score_efficiency?: number;
  score_latency?: number;
  score_disturbances?: number;
  spo2_percentage?: { average?: number };
}

interface OuraActivityEntry {
  summary_date?: string;
  day_start?: string;
  day_end?: string;
  score?: number;
  steps?: number;
  cal_total?: number;
  cal_active?: number;
  daily_movement?: number; // metres
  high?: number; // minutes
  medium?: number; // minutes
  low?: number; // minutes
  inactive?: number; // minutes
  rest?: number; // minutes
  met_min_high?: number;
  met_min_medium?: number;
  met_min_low?: number;
}

interface OuraReadinessEntry {
  summary_date?: string;
  score?: number;
  score_temperature?: number;
  score_hrv_balance?: number;
  score_previous_night?: number;
  score_sleep_balance?: number;
  score_previous_day?: number;
  score_activity_balance?: number;
  score_resting_hr?: number;
  score_recovery_index?: number;
}

interface OuraExport {
  sleep?: OuraSleepEntry[];
  activity?: OuraActivityEntry[];
  readiness?: OuraReadinessEntry[];
  // v2 API-style format
  daily_sleep?: OuraSleepEntry[];
  daily_activity?: OuraActivityEntry[];
  daily_readiness?: OuraReadinessEntry[];
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseSleep(entries: OuraSleepEntry[]): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const e of entries) {
    const date = e.summary_date ?? e.bedtime_start ?? '';
    if (!date) continue;
    const end = e.bedtime_end ?? date;

    if (e.score != null) {
      records.push(rec('Overall Sleep Score', 'Sleep', e.score, 'Percent', '%', date, end));
    }

    // Duration: prefer 'total', fall back to 'duration'
    const totalSec = e.total ?? e.duration;
    if (totalSec != null && totalSec > 0) {
      records.push(rec('Sleep Duration', 'Sleep', totalSec / 3600, 'Hours', 'h', date, end));
    }
    if (e.deep != null && e.deep > 0) {
      records.push(rec('Deep Sleep Duration', 'Sleep', e.deep / 60, 'Minutes', 'min', date, end));
    }
    if (e.rem != null && e.rem > 0) {
      records.push(rec('REM Sleep Duration', 'Sleep', e.rem / 60, 'Minutes', 'min', date, end));
    }
    if (e.light != null && e.light > 0) {
      records.push(rec('Light Sleep Duration', 'Sleep', e.light / 60, 'Minutes', 'min', date, end));
    }
    if (e.efficiency != null) {
      records.push(rec('Sleep Efficiency', 'Sleep', e.efficiency, 'Percent', '%', date, end));
    }

    // Vital signs during sleep
    if (e.hr_lowest != null) {
      records.push(rec('Lowest Heart Rate During Sleep', 'Vital Signs', e.hr_lowest, 'Beats per Minute', 'bpm', date));
    }
    if (e.hr_average != null) {
      records.push(rec('Average Heart Rate During Sleep', 'Vital Signs', e.hr_average, 'Beats per Minute', 'bpm', date));
    }
    if (e.rmssd != null) {
      records.push(rec('Heart Rate Variability', 'Vital Signs', e.rmssd, 'Milliseconds', 'ms', date));
    }
    if (e.breath_average != null) {
      records.push(rec('Average Breathing Rate', 'Vital Signs', e.breath_average, 'Breaths per Minute', 'breaths/min', date));
    }
    if (e.temperature_delta != null) {
      records.push(rec('Body Temperature Deviation', 'Vital Signs', e.temperature_delta, 'Degrees Celsius', '°C', date));
    }

    // SpO2
    const spo2 = e.spo2_percentage?.average;
    if (spo2 != null) {
      records.push(rec('Blood Oxygen', 'Vital Signs', spo2, 'Percent', '%', date));
    }
  }

  return records;
}

function parseActivity(entries: OuraActivityEntry[]): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const e of entries) {
    const date = e.summary_date ?? e.day_start ?? '';
    if (!date) continue;

    if (e.score != null) {
      records.push(rec('Daily Activity Score', 'Physical Activity', e.score, 'Percent', '%', date));
    }
    if (e.steps != null && e.steps > 0) {
      records.push(rec('Daily Step Count', 'Physical Activity', e.steps, 'Count', 'count', date));
    }
    if (e.cal_total != null && e.cal_total > 0) {
      records.push(rec('Calories Burned', 'Physical Activity', e.cal_total, 'Kilocalories', 'kcal', date));
    }
    if (e.cal_active != null && e.cal_active > 0) {
      records.push(rec('Active Calories Burned', 'Physical Activity', e.cal_active, 'Kilocalories', 'kcal', date));
    }
    if (e.daily_movement != null && e.daily_movement > 0) {
      records.push(rec('Daily Movement Distance', 'Physical Activity', e.daily_movement / 1000, 'Kilometres', 'km', date));
    }
    if (e.high != null && e.high > 0) {
      records.push(rec('High Activity Time', 'Physical Activity', e.high, 'Minutes', 'min', date));
    }
    if (e.medium != null && e.medium > 0) {
      records.push(rec('Medium Activity Time', 'Physical Activity', e.medium, 'Minutes', 'min', date));
    }
    if (e.low != null && e.low > 0) {
      records.push(rec('Low Activity Time', 'Physical Activity', e.low, 'Minutes', 'min', date));
    }
  }

  return records;
}

function parseReadiness(entries: OuraReadinessEntry[]): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const e of entries) {
    const date = e.summary_date ?? '';
    if (!date) continue;

    if (e.score != null) {
      records.push(rec('Daily Readiness Score', 'Vital Signs', e.score, 'Percent', '%', date));
    }
    if (e.score_temperature != null) {
      records.push(rec('Temperature Readiness Score', 'Vital Signs', e.score_temperature, 'Percent', '%', date));
    }
    if (e.score_hrv_balance != null) {
      records.push(rec('HRV Balance Score', 'Vital Signs', e.score_hrv_balance, 'Percent', '%', date));
    }
    if (e.score_resting_hr != null) {
      records.push(rec('Resting Heart Rate Score', 'Vital Signs', e.score_resting_hr, 'Percent', '%', date));
    }
    if (e.score_recovery_index != null) {
      records.push(rec('Recovery Index Score', 'Vital Signs', e.score_recovery_index, 'Percent', '%', date));
    }
    if (e.score_sleep_balance != null) {
      records.push(rec('Sleep Balance Score', 'Sleep', e.score_sleep_balance, 'Percent', '%', date));
    }
    if (e.score_activity_balance != null) {
      records.push(rec('Activity Balance Score', 'Physical Activity', e.score_activity_balance, 'Percent', '%', date));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an Oura Ring JSON export string.
 *
 * Accepts both v1 (sleep/activity/readiness) and v2 (daily_sleep/daily_activity/
 * daily_readiness) export formats.
 */
export function parseOuraExport(json: string): ParsedHealthRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== 'object') return [];
  const data = parsed as OuraExport;

  const records: ParsedHealthRecord[] = [];

  records.push(...parseSleep(data.sleep ?? data.daily_sleep ?? []));
  records.push(...parseActivity(data.activity ?? data.daily_activity ?? []));
  records.push(...parseReadiness(data.readiness ?? data.daily_readiness ?? []));

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'oura');
  }

  return records;
}

/**
 * Summarize an Oura import.
 */
export function summarizeOuraExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
