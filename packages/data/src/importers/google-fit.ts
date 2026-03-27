/**
 * Google Fit / Google Takeout Export Importer
 *
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/GoogleFitConnector.php
 *
 * Parses Google Fit data from a Google Takeout export. The Takeout zip
 * contains JSON files under `Takeout/Fit/` organised by data type:
 *   - Daily activity metrics/
 *   - All Sessions/
 *   - Raw Data/
 *   - Derived/
 *
 * Individual JSON files follow the pattern:
 * ```json
 * [{ "startTimeNanos": "...", "endTimeNanos": "...",
 *    "fitValue": [{ "value": { "fpVal": 72.0 } }] }]
 * ```
 *
 * @example
 * ```typescript
 * import { parseGoogleFitExport } from '@optimitron/data';
 * const records = parseGoogleFitExport({
 *   dailyActivityMetrics: [json1, json2],
 *   rawData: { steps: stepsJson, heartRate: hrJson },
 * });
 * ```
 */

import type { ParsedHealthRecord } from './apple-health';
import { resolveVariableName } from './standard-variable-names';
import { buildImportSummary, type ImportSummary } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Google Fit';

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

function nanosToIso(nanos: string | number): string {
  const ms = Number(nanos) / 1_000_000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? String(nanos) : d.toISOString();
}

function toIso(dateStr: string): string {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toISOString();
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
  return {
    variableName,
    variableCategoryName: categoryName,
    value: Math.round(value * 1000) / 1000,
    unitName,
    unitAbbreviation,
    startAt,
    endAt: endAt ?? startAt,
    sourceName: SOURCE,
  };
}

// ---------------------------------------------------------------------------
// Google Fit data shapes
// ---------------------------------------------------------------------------

interface FitValue {
  value?: {
    fpVal?: number;
    intVal?: number;
    mapVal?: Array<{ key?: string; value?: { fpVal?: number } }>;
  };
}

interface FitDataPoint {
  startTimeNanos?: string;
  endTimeNanos?: string;
  originDataSourceId?: string;
  fitValue?: FitValue[];
}

/** Daily activity metrics JSON shape */
interface DailyActivityMetric {
  date?: { year?: number; month?: number; day?: number };
  // Various metric keys
  steps?: number;
  distance?: number; // metres
  calories?: number;
  activeMinutes?: number;
  heartRate?: { bpm?: number };
  weight?: number; // kg
  // Or it may use a "bucket" style
  bucket?: Array<{
    startTimeMillis?: string;
    endTimeMillis?: string;
    dataset?: Array<{
      dataSourceId?: string;
      point?: FitDataPoint[];
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// Type-detect by filename or data source id
// ---------------------------------------------------------------------------

interface DataTypeMapping {
  pattern: RegExp;
  variableName: string;
  categoryName: string;
  unitName: string;
  unitAbbreviation: string;
  /** Convert raw value */
  convert?: (v: number) => number;
}

const DATA_TYPE_MAPPINGS: DataTypeMapping[] = [
  { pattern: /step/i, variableName: 'Daily Step Count', categoryName: 'Physical Activity', unitName: 'Count', unitAbbreviation: 'count' },
  { pattern: /heart.*rate/i, variableName: 'Heart Rate', categoryName: 'Vital Signs', unitName: 'Beats per Minute', unitAbbreviation: 'bpm' },
  { pattern: /weight/i, variableName: 'Weight', categoryName: 'Physique', unitName: 'Kilograms', unitAbbreviation: 'kg' },
  { pattern: /calories.*expended|active.*calories/i, variableName: 'Calories Burned', categoryName: 'Physical Activity', unitName: 'Kilocalories', unitAbbreviation: 'kcal' },
  { pattern: /distance/i, variableName: 'Walking Distance', categoryName: 'Physical Activity', unitName: 'Kilometres', unitAbbreviation: 'km', convert: (v) => v / 1000 },
  { pattern: /sleep/i, variableName: 'Sleep Duration', categoryName: 'Sleep', unitName: 'Hours', unitAbbreviation: 'h' },
  { pattern: /active.*min/i, variableName: 'Active Minutes', categoryName: 'Physical Activity', unitName: 'Minutes', unitAbbreviation: 'min' },
  { pattern: /height/i, variableName: 'Height', categoryName: 'Physique', unitName: 'Centimetres', unitAbbreviation: 'cm', convert: (v) => v * 100 },
  { pattern: /speed/i, variableName: 'Speed', categoryName: 'Physical Activity', unitName: 'Metres per Second', unitAbbreviation: 'm/s' },
  { pattern: /cycling/i, variableName: 'Cycling Distance', categoryName: 'Physical Activity', unitName: 'Kilometres', unitAbbreviation: 'km', convert: (v) => v / 1000 },
  { pattern: /oxygen/i, variableName: 'Blood Oxygen', categoryName: 'Vital Signs', unitName: 'Percent', unitAbbreviation: '%' },
];

function detectDataType(hint: string): DataTypeMapping | null {
  for (const mapping of DATA_TYPE_MAPPINGS) {
    if (mapping.pattern.test(hint)) return mapping;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Parsing raw data point arrays
// ---------------------------------------------------------------------------

function parseFitDataPoints(
  points: FitDataPoint[],
  typeHint: string,
): ParsedHealthRecord[] {
  const mapping = detectDataType(typeHint);
  if (!mapping) return [];

  const records: ParsedHealthRecord[] = [];

  for (const pt of points) {
    const startNanos = pt.startTimeNanos;
    if (!startNanos) continue;

    const startAt = nanosToIso(startNanos);
    const endAt = pt.endTimeNanos ? nanosToIso(pt.endTimeNanos) : startAt;

    for (const fv of pt.fitValue ?? []) {
      const raw = fv.value?.fpVal ?? fv.value?.intVal;
      if (raw == null) continue;
      const value = mapping.convert ? mapping.convert(raw) : raw;
      if (value === 0) continue;
      records.push(rec(mapping.variableName, mapping.categoryName, value, mapping.unitName, mapping.unitAbbreviation, startAt, endAt));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Daily activity metrics
// ---------------------------------------------------------------------------

function parseDailyActivityMetrics(entries: DailyActivityMetric[]): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const entry of entries) {
    if (!entry.date) continue;
    const { year, month, day } = entry.date;
    if (!year || !month || !day) continue;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`;

    if (entry.steps != null && entry.steps > 0) {
      records.push(rec('Daily Step Count', 'Physical Activity', entry.steps, 'Count', 'count', dateStr));
    }
    if (entry.distance != null && entry.distance > 0) {
      records.push(rec('Walking Distance', 'Physical Activity', entry.distance / 1000, 'Kilometres', 'km', dateStr));
    }
    if (entry.calories != null && entry.calories > 0) {
      records.push(rec('Calories Burned', 'Physical Activity', entry.calories, 'Kilocalories', 'kcal', dateStr));
    }
    if (entry.activeMinutes != null && entry.activeMinutes > 0) {
      records.push(rec('Active Minutes', 'Physical Activity', entry.activeMinutes, 'Minutes', 'min', dateStr));
    }
    if (entry.heartRate?.bpm != null) {
      records.push(rec('Heart Rate', 'Vital Signs', entry.heartRate.bpm, 'Beats per Minute', 'bpm', dateStr));
    }
    if (entry.weight != null && entry.weight > 0) {
      records.push(rec('Weight', 'Physique', entry.weight, 'Kilograms', 'kg', dateStr));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Input for the aggregate Google Fit export parser */
export interface GoogleFitExportFiles {
  /** JSON strings from the Daily activity metrics/ folder */
  dailyActivityMetrics?: string[];
  /** Map of data-type hint (filename or data source id) → JSON string with data point arrays */
  rawData?: Record<string, string>;
}

/**
 * Parse a single Google Fit JSON file with an explicit data type hint.
 * The hint is typically the filename (e.g., "steps_2024.json") or
 * a data source ID.
 */
export function parseGoogleFitFile(json: string, typeHint: string): ParsedHealthRecord[] {
  const parsed = safeParseJson(json);
  if (!parsed) return [];

  // Array of data points
  if (Array.isArray(parsed)) {
    // Could be daily activity metrics or raw data points
    if (parsed.length > 0 && 'date' in (parsed[0] as Record<string, unknown>)) {
      return parseDailyActivityMetrics(parsed as DailyActivityMetric[]);
    }
    return parseFitDataPoints(parsed as FitDataPoint[], typeHint);
  }

  // Single object with nested points
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj['point'])) {
    return parseFitDataPoints(obj['point'] as FitDataPoint[], typeHint);
  }

  return [];
}

/**
 * Parse all Google Fit export files at once.
 */
export function parseGoogleFitExport(files: GoogleFitExportFiles): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  for (const json of files.dailyActivityMetrics ?? []) {
    const parsed = safeParseJson(json);
    if (Array.isArray(parsed)) {
      records.push(...parseDailyActivityMetrics(parsed as DailyActivityMetric[]));
    }
  }

  if (files.rawData) {
    for (const [hint, json] of Object.entries(files.rawData)) {
      records.push(...parseGoogleFitFile(json, hint));
    }
  }

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'google_fit');
  }

  return records;
}

/**
 * Summarize a Google Fit import.
 */
export function summarizeGoogleFitExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
