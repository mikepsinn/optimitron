/**
 * Apple Health XML Importer
 *
 * Parses Apple Health `export.xml` files into structured health records.
 * Uses a lightweight regex-based approach for the highly predictable Apple
 * Health XML format, with a streaming mode for memory efficiency on
 * large files (500 MB+).
 *
 * @example
 * ```typescript
 * import { parseAppleHealthXML, summarizeAppleHealthExport } from '@optomitron/data';
 *
 * const records = parseAppleHealthXML(xmlString);
 * const summary = summarizeAppleHealthExport(records);
 * console.log(summary.totalRecords, summary.variableCounts);
 * ```
 */

import { resolveVariableName } from './standard-variable-names.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single parsed health record from Apple Health export.xml */
export interface ParsedHealthRecord {
  variableName: string;
  variableCategoryName: string;
  value: number;
  unitName: string;
  unitAbbreviation: string;
  /** ISO-8601 date-time string */
  startAt: string;
  /** ISO-8601 date-time string */
  endAt: string;
  sourceName: string;
  note?: string;
}

/** Summary statistics for an Apple Health export */
export interface AppleHealthExportSummary {
  totalRecords: number;
  dateRange: { earliest: string; latest: string } | null;
  variableCounts: Record<string, number>;
  sourceNames: string[];
}

/** Raw attributes extracted from a <Record> element */
interface RawRecordAttributes {
  type: string;
  sourceName: string;
  unit: string;
  value: string;
  startDate: string;
  endDate: string;
  creationDate: string;
}

/** Mapping definition for an Apple Health type to our schema */
export interface AppleHealthTypeMapping {
  variableName: string;
  variableCategoryName: string;
  unitName: string;
  unitAbbreviation: string;
  /** Optional converter when Apple's unit differs from our preferred unit */
  convertValue?: (value: number, sourceUnit: string) => number;
  /** For category types (e.g. sleep), compute duration in specified unit */
  isDuration?: boolean;
  durationUnit?: 'hours' | 'minutes';
}

// ---------------------------------------------------------------------------
// Unit conversion helpers
// ---------------------------------------------------------------------------

/** Convert pounds to kilograms */
const lbToKg = (v: number): number => v * 0.45359237;

/** Convert Celsius to Fahrenheit */
const celsiusToFahrenheit = (v: number): number => (v * 9) / 5 + 32;

/** Convert miles to kilometres */
const milesToKm = (v: number): number => v * 1.60934;

/** Convert fluid ounces to millilitres */
const flozToMl = (v: number): number => v * 29.5735;

/** Convert inches to centimetres */
const inToCm = (v: number): number => v * 2.54;

/**
 * Resolve a value with optional unit-aware conversion.
 */
function resolveValue(
  raw: number,
  sourceUnit: string,
  mapping: AppleHealthTypeMapping,
): number {
  if (mapping.convertValue) {
    return mapping.convertValue(raw, sourceUnit);
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Apple Health type → our schema mapping  (30+ types)
// ---------------------------------------------------------------------------

const APPLE_HEALTH_TYPE_MAP: Record<string, AppleHealthTypeMapping> = {
  // ── Vital Signs ──────────────────────────────────────────────────────
  HKQuantityTypeIdentifierHeartRate: {
    variableName: 'Heart Rate',
    variableCategoryName: 'Vital Signs',
    unitName: 'Beats per Minute',
    unitAbbreviation: 'bpm',
  },
  HKQuantityTypeIdentifierRestingHeartRate: {
    variableName: 'Resting Heart Rate',
    variableCategoryName: 'Vital Signs',
    unitName: 'Beats per Minute',
    unitAbbreviation: 'bpm',
  },
  HKQuantityTypeIdentifierWalkingHeartRateAverage: {
    variableName: 'Walking Heart Rate Average',
    variableCategoryName: 'Vital Signs',
    unitName: 'Beats per Minute',
    unitAbbreviation: 'bpm',
  },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: {
    variableName: 'Heart Rate Variability',
    variableCategoryName: 'Vital Signs',
    unitName: 'Milliseconds',
    unitAbbreviation: 'ms',
  },
  HKQuantityTypeIdentifierBloodPressureSystolic: {
    variableName: 'Blood Pressure Systolic',
    variableCategoryName: 'Vital Signs',
    unitName: 'Millimetres of Mercury',
    unitAbbreviation: 'mmHg',
  },
  HKQuantityTypeIdentifierBloodPressureDiastolic: {
    variableName: 'Blood Pressure Diastolic',
    variableCategoryName: 'Vital Signs',
    unitName: 'Millimetres of Mercury',
    unitAbbreviation: 'mmHg',
  },
  HKQuantityTypeIdentifierRespiratoryRate: {
    variableName: 'Respiratory Rate',
    variableCategoryName: 'Vital Signs',
    unitName: 'Breaths per Minute',
    unitAbbreviation: 'breaths/min',
  },
  HKQuantityTypeIdentifierOxygenSaturation: {
    variableName: 'Blood Oxygen',
    variableCategoryName: 'Vital Signs',
    unitName: 'Percent',
    unitAbbreviation: '%',
    convertValue: (v: number, _unit: string) => v * 100, // Apple stores as 0–1
  },
  HKQuantityTypeIdentifierBodyTemperature: {
    variableName: 'Body Temperature',
    variableCategoryName: 'Vital Signs',
    unitName: 'Degrees Fahrenheit',
    unitAbbreviation: '°F',
    convertValue: (v: number, unit: string) =>
      unit === 'degC' ? celsiusToFahrenheit(v) : v,
  },
  HKQuantityTypeIdentifierBloodGlucose: {
    variableName: 'Blood Glucose',
    variableCategoryName: 'Vital Signs',
    unitName: 'mg/dL',
    unitAbbreviation: 'mg/dL',
  },

  // ── Body Measurements ────────────────────────────────────────────────
  HKQuantityTypeIdentifierBodyMass: {
    variableName: 'Weight',
    variableCategoryName: 'Physique',
    unitName: 'Kilograms',
    unitAbbreviation: 'kg',
    convertValue: (v: number, unit: string) => (unit === 'lb' ? lbToKg(v) : v),
  },
  HKQuantityTypeIdentifierBodyMassIndex: {
    variableName: 'Body Mass Index',
    variableCategoryName: 'Physique',
    unitName: 'Count',
    unitAbbreviation: 'kg/m²',
  },
  HKQuantityTypeIdentifierBodyFatPercentage: {
    variableName: 'Body Fat Percentage',
    variableCategoryName: 'Physique',
    unitName: 'Percent',
    unitAbbreviation: '%',
    convertValue: (v: number, _unit: string) => v * 100, // Apple stores as 0–1
  },
  HKQuantityTypeIdentifierHeight: {
    variableName: 'Height',
    variableCategoryName: 'Physique',
    unitName: 'Centimetres',
    unitAbbreviation: 'cm',
    convertValue: (v: number, unit: string) => (unit === 'in' ? inToCm(v) : v),
  },
  HKQuantityTypeIdentifierLeanBodyMass: {
    variableName: 'Lean Body Mass',
    variableCategoryName: 'Physique',
    unitName: 'Kilograms',
    unitAbbreviation: 'kg',
    convertValue: (v: number, unit: string) => (unit === 'lb' ? lbToKg(v) : v),
  },
  HKQuantityTypeIdentifierWaistCircumference: {
    variableName: 'Waist Circumference',
    variableCategoryName: 'Physique',
    unitName: 'Centimetres',
    unitAbbreviation: 'cm',
    convertValue: (v: number, unit: string) => (unit === 'in' ? inToCm(v) : v),
  },

  // ── Physical Activity ────────────────────────────────────────────────
  HKQuantityTypeIdentifierStepCount: {
    variableName: 'Steps',
    variableCategoryName: 'Physical Activity',
    unitName: 'Count',
    unitAbbreviation: 'count',
  },
  HKQuantityTypeIdentifierDistanceWalkingRunning: {
    variableName: 'Walking Distance',
    variableCategoryName: 'Physical Activity',
    unitName: 'Kilometres',
    unitAbbreviation: 'km',
    convertValue: (v: number, unit: string) =>
      unit === 'mi' ? milesToKm(v) : v,
  },
  HKQuantityTypeIdentifierDistanceCycling: {
    variableName: 'Cycling Distance',
    variableCategoryName: 'Physical Activity',
    unitName: 'Kilometres',
    unitAbbreviation: 'km',
    convertValue: (v: number, unit: string) =>
      unit === 'mi' ? milesToKm(v) : v,
  },
  HKQuantityTypeIdentifierActiveEnergyBurned: {
    variableName: 'Active Energy',
    variableCategoryName: 'Physical Activity',
    unitName: 'Kilocalories',
    unitAbbreviation: 'kcal',
  },
  HKQuantityTypeIdentifierBasalEnergyBurned: {
    variableName: 'Basal Energy',
    variableCategoryName: 'Physical Activity',
    unitName: 'Kilocalories',
    unitAbbreviation: 'kcal',
  },
  HKQuantityTypeIdentifierFlightsClimbed: {
    variableName: 'Flights Climbed',
    variableCategoryName: 'Physical Activity',
    unitName: 'Count',
    unitAbbreviation: 'count',
  },
  HKQuantityTypeIdentifierAppleExerciseTime: {
    variableName: 'Exercise Time',
    variableCategoryName: 'Physical Activity',
    unitName: 'Minutes',
    unitAbbreviation: 'min',
  },
  HKQuantityTypeIdentifierAppleStandTime: {
    variableName: 'Stand Time',
    variableCategoryName: 'Physical Activity',
    unitName: 'Minutes',
    unitAbbreviation: 'min',
  },
  HKQuantityTypeIdentifierDistanceSwimming: {
    variableName: 'Swimming Distance',
    variableCategoryName: 'Physical Activity',
    unitName: 'Metres',
    unitAbbreviation: 'm',
  },
  HKQuantityTypeIdentifierSwimmingStrokeCount: {
    variableName: 'Swimming Strokes',
    variableCategoryName: 'Physical Activity',
    unitName: 'Count',
    unitAbbreviation: 'count',
  },
  HKQuantityTypeIdentifierVO2Max: {
    variableName: 'VO2 Max',
    variableCategoryName: 'Physical Activity',
    unitName: 'mL/kg·min',
    unitAbbreviation: 'mL/kg·min',
  },

  // ── Nutrition ────────────────────────────────────────────────────────
  HKQuantityTypeIdentifierDietaryEnergyConsumed: {
    variableName: 'Calories',
    variableCategoryName: 'Foods',
    unitName: 'Kilocalories',
    unitAbbreviation: 'kcal',
  },
  HKQuantityTypeIdentifierDietaryWater: {
    variableName: 'Water',
    variableCategoryName: 'Foods',
    unitName: 'Millilitres',
    unitAbbreviation: 'mL',
    convertValue: (v: number, unit: string) =>
      unit === 'fl_oz_us' ? flozToMl(v) : v,
  },
  HKQuantityTypeIdentifierDietaryProtein: {
    variableName: 'Protein',
    variableCategoryName: 'Nutrients',
    unitName: 'Grams',
    unitAbbreviation: 'g',
  },
  HKQuantityTypeIdentifierDietaryFatTotal: {
    variableName: 'Total Fat',
    variableCategoryName: 'Nutrients',
    unitName: 'Grams',
    unitAbbreviation: 'g',
  },
  HKQuantityTypeIdentifierDietaryCarbohydrates: {
    variableName: 'Carbohydrates',
    variableCategoryName: 'Nutrients',
    unitName: 'Grams',
    unitAbbreviation: 'g',
  },
  HKQuantityTypeIdentifierDietaryFiber: {
    variableName: 'Fiber',
    variableCategoryName: 'Nutrients',
    unitName: 'Grams',
    unitAbbreviation: 'g',
  },
  HKQuantityTypeIdentifierDietarySugar: {
    variableName: 'Sugar',
    variableCategoryName: 'Nutrients',
    unitName: 'Grams',
    unitAbbreviation: 'g',
  },
  HKQuantityTypeIdentifierDietarySodium: {
    variableName: 'Sodium',
    variableCategoryName: 'Nutrients',
    unitName: 'Milligrams',
    unitAbbreviation: 'mg',
  },
  HKQuantityTypeIdentifierDietaryCaffeine: {
    variableName: 'Caffeine',
    variableCategoryName: 'Nutrients',
    unitName: 'Milligrams',
    unitAbbreviation: 'mg',
  },
  HKQuantityTypeIdentifierDietaryCholesterol: {
    variableName: 'Cholesterol',
    variableCategoryName: 'Nutrients',
    unitName: 'Milligrams',
    unitAbbreviation: 'mg',
  },

  // ── Sleep ────────────────────────────────────────────────────────────
  HKCategoryTypeIdentifierSleepAnalysis: {
    variableName: 'Sleep Duration',
    variableCategoryName: 'Sleep',
    unitName: 'Hours',
    unitAbbreviation: 'h',
    isDuration: true,
    durationUnit: 'hours',
  },

  // ── Mindfulness ──────────────────────────────────────────────────────
  HKCategoryTypeIdentifierMindfulSession: {
    variableName: 'Meditation',
    variableCategoryName: 'Treatments',
    unitName: 'Minutes',
    unitAbbreviation: 'min',
    isDuration: true,
    durationUnit: 'minutes',
  },

  // ── Reproductive Health ──────────────────────────────────────────────
  HKQuantityTypeIdentifierBasalBodyTemperature: {
    variableName: 'Basal Body Temperature',
    variableCategoryName: 'Vital Signs',
    unitName: 'Degrees Fahrenheit',
    unitAbbreviation: '°F',
    convertValue: (v: number, unit: string) =>
      unit === 'degC' ? celsiusToFahrenheit(v) : v,
  },

  // ── Audio / Environment ──────────────────────────────────────────────
  HKQuantityTypeIdentifierEnvironmentalAudioExposure: {
    variableName: 'Environmental Sound Level',
    variableCategoryName: 'Environment',
    unitName: 'Decibels',
    unitAbbreviation: 'dBASPL',
  },
  HKQuantityTypeIdentifierHeadphoneAudioExposure: {
    variableName: 'Headphone Audio Level',
    variableCategoryName: 'Environment',
    unitName: 'Decibels',
    unitAbbreviation: 'dBASPL',
  },
};

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

/**
 * Parse an Apple Health date string into an ISO-8601 string.
 *
 * Apple Health uses the format: "2024-01-15 08:30:00 -0600"
 */
function parseAppleDate(dateStr: string): string {
  const trimmed = dateStr.trim();

  // Apple Health format: "2024-01-15 08:30:00 -0600"
  const match =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})$/.exec(
      trimmed,
    );
  if (match) {
    const [, date, time, tz] = match as unknown as [
      string,
      string,
      string,
      string,
    ];
    const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;
    return `${date}T${time}${tzFormatted}`;
  }

  // Already ISO or some other format — return as-is
  return trimmed;
}

/**
 * Compute duration between two date strings in the specified unit.
 */
function computeDuration(
  startDate: string,
  endDate: string,
  unit: 'hours' | 'minutes',
): number {
  const startMs = new Date(parseAppleDate(startDate)).getTime();
  const endMs = new Date(parseAppleDate(endDate)).getTime();
  const diffMs = Math.max(0, endMs - startMs);

  if (unit === 'hours') {
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  return Math.round((diffMs / (1000 * 60)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Record conversion
// ---------------------------------------------------------------------------

/**
 * Convert raw Record attributes into a ParsedHealthRecord.
 * Returns `null` when the record type is unrecognised.
 */
function convertRecord(attrs: RawRecordAttributes): ParsedHealthRecord | null {
  const mapping = APPLE_HEALTH_TYPE_MAP[attrs.type];
  if (!mapping) return null;

  let value: number;

  if (mapping.isDuration && mapping.durationUnit) {
    value = computeDuration(attrs.startDate, attrs.endDate, mapping.durationUnit);
  } else {
    if (attrs.value === '') return null;
    const raw = Number(attrs.value);
    if (Number.isNaN(raw)) return null;
    value = resolveValue(raw, attrs.unit, mapping);
  }

  // Round to reasonable precision
  value = Math.round(value * 1000) / 1000;

  return {
    variableName: mapping.variableName,
    variableCategoryName: mapping.variableCategoryName,
    value,
    unitName: mapping.unitName,
    unitAbbreviation: mapping.unitAbbreviation,
    startAt: parseAppleDate(attrs.startDate),
    endAt: parseAppleDate(attrs.endDate),
    sourceName: attrs.sourceName,
  };
}

// ---------------------------------------------------------------------------
// Attribute extraction
// ---------------------------------------------------------------------------

/**
 * Extract Record attributes from a self-closing `<Record .../>` tag using regex.
 * Apple Health XML uses a very predictable, machine-generated format making
 * regex extraction reliable and fast.
 */
function extractRecordAttributes(tag: string): RawRecordAttributes | null {
  const getAttr = (name: string): string => {
    const re = new RegExp(`${name}="([^"]*)"`, 'i');
    const m = re.exec(tag);
    return m?.[1] ?? '';
  };

  const type = getAttr('type');
  if (!type) return null;

  return {
    type,
    sourceName: getAttr('sourceName'),
    unit: getAttr('unit'),
    value: getAttr('value'),
    startDate: getAttr('startDate'),
    endDate: getAttr('endDate'),
    creationDate: getAttr('creationDate'),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the full mapping of Apple Health type identifiers to our variable schema.
 *
 * Useful for inspecting which types are supported or extending the map.
 */
export function getAppleHealthTypeMapping(): Map<string, AppleHealthTypeMapping> {
  return new Map(Object.entries(APPLE_HEALTH_TYPE_MAP));
}

/**
 * Parse an Apple Health export.xml string into structured health records.
 *
 * Best for files under ~50 MB. For larger files, use `streamParseAppleHealthXML`.
 *
 * @param xmlString - The full XML content of an Apple Health `export.xml`
 * @returns Array of parsed and mapped health records (unmapped types are skipped)
 */
export function parseAppleHealthXML(xmlString: string): ParsedHealthRecord[] {
  const records: ParsedHealthRecord[] = [];

  // Apple Health XML uses self-closing <Record ... /> tags exclusively
  const recordRegex = /<Record\s[^>]*\/>/gi;
  let match: RegExpExecArray | null;

  while ((match = recordRegex.exec(xmlString)) !== null) {
    const attrs = extractRecordAttributes(match[0]);
    if (!attrs) continue;

    const record = convertRecord(attrs);
    if (record) {
      records.push(record);
    }
  }

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'apple_health');
  }

  return records;
}

/**
 * Stream-parse an Apple Health export.xml for memory efficiency.
 *
 * Processes the XML in chunks, yielding ParsedHealthRecord objects as they
 * are encountered. Suitable for files of any size (500 MB+).
 *
 * Uses a chunked regex scanner over the ReadableStream — no DOM or SAX parser
 * needed because Apple Health XML has a very predictable, machine-generated
 * structure with self-closing `<Record ... />` elements.
 *
 * @param readableStream - A ReadableStream of the XML file bytes
 * @yields ParsedHealthRecord objects as they are parsed
 */
export async function* streamParseAppleHealthXML(
  readableStream: ReadableStream<Uint8Array>,
): AsyncGenerator<ParsedHealthRecord> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const reader = readableStream.getReader();
  const recordRegex = /<Record\s[^>]*\/>/gi;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Find complete <Record .../> tags in the buffer
      let match: RegExpExecArray | null;
      let lastIndex = 0;

      while ((match = recordRegex.exec(buffer)) !== null) {
        const attrs = extractRecordAttributes(match[0]);
        if (attrs) {
          const record = convertRecord(attrs);
          if (record) {
            yield record;
          }
        }
        lastIndex = recordRegex.lastIndex;
      }

      // Keep only the unprocessed tail (may contain a partial <Record tag)
      if (lastIndex > 0) {
        buffer = buffer.slice(lastIndex);
      } else if (buffer.length > 1_000_000) {
        // Safety: if buffer grows huge without matches, trim old data
        const lastAngle = buffer.lastIndexOf('<');
        buffer = lastAngle > 0 ? buffer.slice(lastAngle) : '';
      }

      // Reset regex state for next iteration
      recordRegex.lastIndex = 0;
    }

    // Process any remaining content in the buffer
    if (buffer.length > 0) {
      let match: RegExpExecArray | null;
      while ((match = recordRegex.exec(buffer)) !== null) {
        const attrs = extractRecordAttributes(match[0]);
        if (attrs) {
          const record = convertRecord(attrs);
          if (record) {
            yield record;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Compute summary statistics for a collection of parsed health records.
 *
 * @param records - Array of ParsedHealthRecord
 * @returns Summary with total count, date range, per-variable counts, and source names
 */
export function summarizeAppleHealthExport(
  records: readonly ParsedHealthRecord[],
): AppleHealthExportSummary {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      dateRange: null,
      variableCounts: {},
      sourceNames: [],
    };
  }

  const variableCounts: Record<string, number> = {};
  const sources = new Set<string>();
  let earliest = records[0]!.startAt;
  let latest = records[0]!.startAt;

  for (const r of records) {
    variableCounts[r.variableName] =
      (variableCounts[r.variableName] ?? 0) + 1;
    sources.add(r.sourceName);

    if (r.startAt < earliest) earliest = r.startAt;
    if (r.startAt > latest) latest = r.startAt;
    if (r.endAt > latest) latest = r.endAt;
  }

  return {
    totalRecords: records.length,
    dateRange: { earliest, latest },
    variableCounts,
    sourceNames: [...sources].sort(),
  };
}
