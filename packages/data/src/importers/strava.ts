/**
 * Strava Bulk Export Importer
 *
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/StravaConnector.php
 *
 * Parses Strava's bulk export. Users request their data from
 * strava.com/athlete/delete_your_account (Download or Delete Your Account).
 * The export zip contains:
 *   - activities.csv — summary of all activities
 *   - Individual .gpx, .fit, .tcx files for each activity
 *
 * This importer handles activities.csv. GPX/FIT parsing is out of scope
 * for this file-based approach (would need binary parsers).
 *
 * @example
 * ```typescript
 * import { parseStravaActivitiesCsv } from '@optimitron/data';
 * const records = parseStravaActivitiesCsv(csvString);
 * ```
 */

import type { ParsedHealthRecord } from './apple-health';
import { resolveVariableName } from './standard-variable-names';
import { buildImportSummary, type ImportSummary } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Strava';

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

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]!);
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  note?: string,
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
    ...(note ? { note } : {}),
  };
}

function parseNum(s: string | undefined): number | null {
  if (!s) return null;
  const v = Number(s.replace(/,/g, ''));
  return Number.isNaN(v) ? null : v;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse Strava's activities.csv export.
 *
 * Columns include: Activity ID, Activity Date, Activity Name, Activity Type,
 * Elapsed Time, Moving Time, Distance, Elevation Gain, Average Heart Rate,
 * Calories, etc.
 */
export function parseStravaActivitiesCsv(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const dateCol = findCol(headers, 'activity date', 'date');
  const typeCol = findCol(headers, 'activity type', 'type');
  const nameCol = findCol(headers, 'activity name', 'name');
  const elapsedCol = findCol(headers, 'elapsed time', 'elapsed time (s)');
  const movingCol = findCol(headers, 'moving time', 'moving time (s)');
  const distCol = findCol(headers, 'distance', 'distance (km)');
  const elevCol = findCol(headers, 'elevation gain', 'elevation gain (m)');
  const hrCol = findCol(headers, 'average heart rate', 'avg heart rate', 'avg hr');
  const maxHrCol = findCol(headers, 'max heart rate', 'max hr');
  const calCol = findCol(headers, 'calories');
  const avgSpeedCol = findCol(headers, 'average speed', 'avg speed');
  const maxSpeedCol = findCol(headers, 'max speed');
  const avgCadenceCol = findCol(headers, 'average cadence', 'avg cadence');
  const avgPowerCol = findCol(headers, 'average watts', 'avg power', 'average power');

  if (dateCol < 0) return [];

  const records: ParsedHealthRecord[] = [];

  for (const row of rows) {
    const dateStr = row[dateCol];
    if (!dateStr) continue;

    const activityType = typeCol >= 0 ? (row[typeCol] ?? 'Activity') : 'Activity';
    const activityName = nameCol >= 0 ? row[nameCol] : undefined;
    const note = activityName ?? activityType;

    // Activity type record
    records.push(rec(`${activityType}`, 'Physical Activity', 1, 'Count', 'count', dateStr, undefined, note));

    // Duration (elapsed time in seconds → minutes)
    const elapsed = parseNum(row[elapsedCol]);
    if (elapsed != null && elapsed > 0) {
      records.push(rec(`${activityType} Duration`, 'Physical Activity', elapsed / 60, 'Minutes', 'min', dateStr, undefined, note));
    }

    // Moving time
    const moving = parseNum(row[movingCol]);
    if (moving != null && moving > 0) {
      records.push(rec(`${activityType} Moving Time`, 'Physical Activity', moving / 60, 'Minutes', 'min', dateStr, undefined, note));
    }

    // Distance (Strava may export in km or m depending on settings)
    const dist = parseNum(row[distCol]);
    if (dist != null && dist > 0) {
      // Strava typically exports distance in km
      records.push(rec(`${activityType} Distance`, 'Physical Activity', dist, 'Kilometres', 'km', dateStr, undefined, note));
    }

    // Elevation gain
    const elev = parseNum(row[elevCol]);
    if (elev != null && elev > 0) {
      records.push(rec('Elevation Gain', 'Physical Activity', elev, 'Metres', 'm', dateStr, undefined, note));
    }

    // Average heart rate
    const hr = parseNum(row[hrCol]);
    if (hr != null && hr > 0) {
      records.push(rec('Average Heart Rate During Exercise', 'Vital Signs', hr, 'Beats per Minute', 'bpm', dateStr, undefined, note));
    }

    // Max heart rate
    const maxHr = parseNum(row[maxHrCol]);
    if (maxHr != null && maxHr > 0) {
      records.push(rec('Max Heart Rate During Exercise', 'Vital Signs', maxHr, 'Beats per Minute', 'bpm', dateStr, undefined, note));
    }

    // Calories
    const cal = parseNum(row[calCol]);
    if (cal != null && cal > 0) {
      records.push(rec('Calories Burned', 'Physical Activity', cal, 'Kilocalories', 'kcal', dateStr, undefined, note));
    }

    // Average speed
    const avgSpeed = parseNum(row[avgSpeedCol]);
    if (avgSpeed != null && avgSpeed > 0) {
      records.push(rec(`${activityType} Average Speed`, 'Physical Activity', avgSpeed, 'Kilometres per Hour', 'km/h', dateStr, undefined, note));
    }

    // Max speed
    const maxSpeed = parseNum(row[maxSpeedCol]);
    if (maxSpeed != null && maxSpeed > 0) {
      records.push(rec(`${activityType} Max Speed`, 'Physical Activity', maxSpeed, 'Kilometres per Hour', 'km/h', dateStr, undefined, note));
    }

    // Average cadence
    const cadence = parseNum(row[avgCadenceCol]);
    if (cadence != null && cadence > 0) {
      records.push(rec(`${activityType} Average Cadence`, 'Physical Activity', cadence, 'Count', 'rpm', dateStr, undefined, note));
    }

    // Average power
    const power = parseNum(row[avgPowerCol]);
    if (power != null && power > 0) {
      records.push(rec(`${activityType} Average Power`, 'Physical Activity', power, 'Watts', 'W', dateStr, undefined, note));
    }
  }

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'strava');
  }

  return records;
}

/**
 * Summarize a Strava import.
 */
export function summarizeStravaExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
