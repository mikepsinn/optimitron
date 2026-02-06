/**
 * Withings (Health Mate) Export Importer
 *
 * Parses Withings CSV exports from the Health Mate app.
 * Export contains separate CSV files: weight.csv, blood_pressure.csv,
 * sleep.csv, activity.csv, heart_rate.csv, etc.
 *
 * @example
 * ```typescript
 * import { parseWithingsExport, parseWithingsWeightFile } from '@optomitron/data';
 *
 * const weightRecords = parseWithingsWeightFile(csvString);
 * const allRecords = parseWithingsExport({
 *   weight: weightCsv,
 *   bloodPressure: bpCsv,
 *   sleep: sleepCsv,
 *   activity: activityCsv,
 *   heartRate: hrCsv,
 * });
 * ```
 */

import type { ParsedHealthRecord } from './apple-health.js';
import { buildImportSummary, type ImportSummary } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Withings';

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsvLine(line: string, delimiter = ','): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): { headers: string[]; rows: string[][]; delimiter: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ',' };

  // Detect delimiter: Withings uses comma or semicolon depending on locale
  const firstLine = lines[0]!;
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const headers = parseCsvLine(firstLine, delimiter);
  const rows = lines.slice(1).map((l) => parseCsvLine(l, delimiter));
  return { headers, rows, delimiter };
}

function findCol(headers: string[], ...names: string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const name of names) {
    const idx = lowerHeaders.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

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

function parseNum(s: string | undefined): number | null {
  if (!s) return null;
  const v = Number(s.replace(/,/g, '.'));
  return Number.isNaN(v) ? null : v;
}

// ---------------------------------------------------------------------------
// Weight file
// ---------------------------------------------------------------------------

/**
 * Parse Withings weight.csv.
 * Columns: Date, Weight (kg), Fat mass (kg), Fat free mass (kg), Bone mass (kg),
 * Muscle mass (kg), Hydration (kg), BMI, Comments
 */
export function parseWithingsWeightFile(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'date', 'Date');
  const weightCol = findCol(headers, 'weight (kg)', 'weight', 'poids (kg)');
  const fatMassCol = findCol(headers, 'fat mass (kg)', 'fat mass', 'masse grasse (kg)');
  const fatFreeCol = findCol(headers, 'fat free mass (kg)', 'fat free mass', 'masse maigre (kg)');
  const bmiCol = findCol(headers, 'bmi', 'imc');
  const boneMassCol = findCol(headers, 'bone mass (kg)', 'bone mass', 'masse osseuse (kg)');
  const muscleMassCol = findCol(headers, 'muscle mass (kg)', 'muscle mass', 'masse musculaire (kg)');
  const fatRatioCol = findCol(headers, 'fat ratio (%)', 'fat ratio');

  if (dateCol < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const date = row[dateCol];
    if (!date) continue;

    const weight = parseNum(row[weightCol]);
    if (weight != null && weight > 0) {
      records.push(rec('Weight', 'Physique', weight, 'Kilograms', 'kg', date));
    }

    const fatMass = parseNum(row[fatMassCol]);
    if (fatMass != null && fatMass > 0) {
      records.push(rec('Fat Mass', 'Physique', fatMass, 'Kilograms', 'kg', date));
    }

    const fatFree = parseNum(row[fatFreeCol]);
    if (fatFree != null && fatFree > 0) {
      records.push(rec('Fat Free Mass', 'Physique', fatFree, 'Kilograms', 'kg', date));
    }

    const bmi = parseNum(row[bmiCol]);
    if (bmi != null && bmi > 0) {
      records.push(rec('Body Mass Index', 'Physique', bmi, 'Count', 'kg/m²', date));
    }

    const boneMass = parseNum(row[boneMassCol]);
    if (boneMass != null && boneMass > 0) {
      records.push(rec('Bone Mass', 'Physique', boneMass, 'Kilograms', 'kg', date));
    }

    const muscleMass = parseNum(row[muscleMassCol]);
    if (muscleMass != null && muscleMass > 0) {
      records.push(rec('Muscle Mass', 'Physique', muscleMass, 'Kilograms', 'kg', date));
    }

    const fatRatio = parseNum(row[fatRatioCol]);
    if (fatRatio != null) {
      records.push(rec('Body Fat Percentage', 'Physique', fatRatio, 'Percent', '%', date));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Blood pressure file
// ---------------------------------------------------------------------------

/**
 * Parse Withings blood_pressure.csv.
 * Columns: Date, Systolic (mmHg), Diastolic (mmHg), Heart rate (bpm), Comments
 */
export function parseWithingsBloodPressureFile(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'date');
  const sysCol = findCol(headers, 'systolic (mmhg)', 'systolic', 'systolique (mmhg)');
  const diaCol = findCol(headers, 'diastolic (mmhg)', 'diastolic', 'diastolique (mmhg)');
  const hrCol = findCol(headers, 'heart rate (bpm)', 'heart rate', 'pulse (bpm)');

  if (dateCol < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const date = row[dateCol];
    if (!date) continue;

    const sys = parseNum(row[sysCol]);
    if (sys != null && sys > 0) {
      records.push(rec('Blood Pressure Systolic', 'Vital Signs', sys, 'Millimetres of Mercury', 'mmHg', date));
    }

    const dia = parseNum(row[diaCol]);
    if (dia != null && dia > 0) {
      records.push(rec('Blood Pressure Diastolic', 'Vital Signs', dia, 'Millimetres of Mercury', 'mmHg', date));
    }

    const hr = parseNum(row[hrCol]);
    if (hr != null && hr > 0) {
      records.push(rec('Heart Rate', 'Vital Signs', hr, 'Beats per Minute', 'bpm', date));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Sleep file
// ---------------------------------------------------------------------------

/**
 * Parse Withings sleep.csv.
 * Columns vary but typically: Date, Duration, Deep (s), Light (s), REM (s),
 * Awake (s), Sleep Score, etc.
 */
export function parseWithingsSleepFile(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'from', 'start date', 'date');
  const endCol = findCol(headers, 'to', 'end date');
  const durationCol = findCol(headers, 'duration (s)', 'duration');
  const deepCol = findCol(headers, 'deep (s)', 'deep sleep duration (s)', 'deep');
  const lightCol = findCol(headers, 'light (s)', 'light sleep duration (s)', 'light');
  const remCol = findCol(headers, 'rem (s)', 'rem sleep duration (s)', 'rem');
  const awakeCol = findCol(headers, 'awake (s)', 'awake duration (s)', 'awake');
  const scoreCol = findCol(headers, 'sleep score', 'score');

  if (dateCol < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const date = row[dateCol];
    if (!date) continue;
    const end = endCol >= 0 ? row[endCol] : undefined;

    const duration = parseNum(row[durationCol]);
    if (duration != null && duration > 0) {
      records.push(rec('Sleep Duration', 'Sleep', duration / 3600, 'Hours', 'h', date, end));
    }

    const deep = parseNum(row[deepCol]);
    if (deep != null && deep > 0) {
      records.push(rec('Deep Sleep Duration', 'Sleep', deep / 60, 'Minutes', 'min', date, end));
    }

    const light = parseNum(row[lightCol]);
    if (light != null && light > 0) {
      records.push(rec('Light Sleep Duration', 'Sleep', light / 60, 'Minutes', 'min', date, end));
    }

    const rem = parseNum(row[remCol]);
    if (rem != null && rem > 0) {
      records.push(rec('REM Sleep Duration', 'Sleep', rem / 60, 'Minutes', 'min', date, end));
    }

    const awake = parseNum(row[awakeCol]);
    if (awake != null && awake > 0) {
      records.push(rec('Awake Duration During Sleep', 'Sleep', awake / 60, 'Minutes', 'min', date, end));
    }

    const score = parseNum(row[scoreCol]);
    if (score != null) {
      records.push(rec('Sleep Score', 'Sleep', score, 'Percent', '%', date, end));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Activity file
// ---------------------------------------------------------------------------

/**
 * Parse Withings activity.csv.
 * Columns: Date, Steps, Distance (m), Elevation (m), Active calories (kcal),
 * Total calories (kcal), Duration (s), etc.
 */
export function parseWithingsActivityFile(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'date', 'from');
  const stepsCol = findCol(headers, 'steps');
  const distCol = findCol(headers, 'distance (m)', 'distance');
  const activeCalCol = findCol(headers, 'active calories (kcal)', 'active calories');
  const totalCalCol = findCol(headers, 'total calories (kcal)', 'total calories');
  const elevCol = findCol(headers, 'elevation (m)', 'elevation');

  if (dateCol < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const date = row[dateCol];
    if (!date) continue;

    const steps = parseNum(row[stepsCol]);
    if (steps != null && steps > 0) {
      records.push(rec('Daily Step Count', 'Physical Activity', steps, 'Count', 'count', date));
    }

    const dist = parseNum(row[distCol]);
    if (dist != null && dist > 0) {
      records.push(rec('Walking Distance', 'Physical Activity', dist / 1000, 'Kilometres', 'km', date));
    }

    const activeCal = parseNum(row[activeCalCol]);
    if (activeCal != null && activeCal > 0) {
      records.push(rec('Active Calories Burned', 'Physical Activity', activeCal, 'Kilocalories', 'kcal', date));
    }

    const totalCal = parseNum(row[totalCalCol]);
    if (totalCal != null && totalCal > 0) {
      records.push(rec('Calories Burned', 'Physical Activity', totalCal, 'Kilocalories', 'kcal', date));
    }

    const elev = parseNum(row[elevCol]);
    if (elev != null && elev > 0) {
      records.push(rec('Elevation Gain', 'Physical Activity', elev, 'Metres', 'm', date));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Heart rate file
// ---------------------------------------------------------------------------

/**
 * Parse Withings heart_rate.csv.
 * Columns: Date, Heart Rate (bpm)
 */
export function parseWithingsHeartRateFile(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'date');
  const hrCol = findCol(headers, 'heart rate (bpm)', 'heart rate', 'hr', 'hr (bpm)');

  if (dateCol < 0 || hrCol < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const date = row[dateCol];
    if (!date) continue;

    const hr = parseNum(row[hrCol]);
    if (hr != null && hr > 0) {
      records.push(rec('Heart Rate', 'Vital Signs', hr, 'Beats per Minute', 'bpm', date));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Aggregate parser
// ---------------------------------------------------------------------------

/** Input for the aggregate Withings export parser */
export interface WithingsExportFiles {
  weight?: string;
  bloodPressure?: string;
  sleep?: string;
  activity?: string;
  heartRate?: string;
}

/**
 * Parse all Withings export CSV files at once.
 */
export function parseWithingsExport(files: WithingsExportFiles): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  if (files.weight) records.push(...parseWithingsWeightFile(files.weight));
  if (files.bloodPressure) records.push(...parseWithingsBloodPressureFile(files.bloodPressure));
  if (files.sleep) records.push(...parseWithingsSleepFile(files.sleep));
  if (files.activity) records.push(...parseWithingsActivityFile(files.activity));
  if (files.heartRate) records.push(...parseWithingsHeartRateFile(files.heartRate));

  return records;
}

/**
 * Summarize a Withings import.
 */
export function summarizeWithingsExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
