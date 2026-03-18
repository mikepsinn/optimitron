/**
 * Shared types for all health data importers.
 *
 * Every importer produces `ParsedHealthRecord[]` — a flat, uniform format
 * that the rest of Optimitron can consume without knowing the data source.
 *
 * legacy API equivalent: MeasurementSet / Measurement model
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Slim/Model/Measurement/MeasurementSet.php
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Models/Measurement.php
 * legacy API normalizes all imported data into Measurement rows with common units.
 */

// Re-export the canonical ParsedHealthRecord from the Apple Health importer
// so every importer uses the exact same interface.
export type { ParsedHealthRecord } from './apple-health.js';

/** Summary statistics for an import run */
export interface ImportSummary {
  /** Total number of records successfully parsed */
  totalRecords: number;
  /** Earliest and latest timestamps in the data, or null if empty */
  dateRange: { earliest: string; latest: string } | null;
  /** Count of records per variable name */
  variableCounts: Record<string, number>;
  /** Unique source names encountered */
  sourceNames: string[];
  /** Non-fatal issues encountered during parsing */
  warnings: string[];
}

/**
 * Column mapping for the generic CSV importer.
 * Users specify which columns map to which fields.
 */
export interface CsvColumnMapping {
  /** Column name or index (0-based) for the date/time field */
  dateColumn: string | number;
  /** Map of column name/index → variable name */
  valueColumns: Record<string | number, string>;
  /** Optional: column for the source name */
  sourceColumn?: string | number;
  /** Optional: column for notes */
  noteColumn?: string | number;
}

/** Options for the generic CSV importer */
export interface GenericCsvOptions {
  /** Delimiter character (auto-detected if omitted) */
  delimiter?: ',' | '\t' | ';';
  /** Column mapping (auto-detected if omitted, but less accurate) */
  mapping?: CsvColumnMapping;
  /** Source name to use when no source column is provided */
  sourceName?: string;
  /** Unit name for all value columns (required if no per-column mapping) */
  unitName?: string;
  /** Variable category for all records */
  variableCategoryName?: string;
}

/**
 * Build an ImportSummary from an array of ParsedHealthRecord.
 */
export function buildImportSummary(
  records: readonly import('./apple-health.js').ParsedHealthRecord[],
  warnings: string[] = [],
): ImportSummary {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      dateRange: null,
      variableCounts: {},
      sourceNames: [],
      warnings,
    };
  }

  const variableCounts: Record<string, number> = {};
  const sources = new Set<string>();
  let earliest = records[0]!.startAt;
  let latest = records[0]!.startAt;

  for (const r of records) {
    variableCounts[r.variableName] = (variableCounts[r.variableName] ?? 0) + 1;
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
    warnings,
  };
}
