/**
 * Generic CSV/Spreadsheet Importer
 *
 * A flexible CSV parser that can import health data from any CSV file.
 * Auto-detects delimiters and date columns, or accepts explicit column mappings.
 *
 * @example
 * ```typescript
 * import { parseGenericCsv, autoDetectCsvColumns } from '@optimitron/data';
 *
 * // Auto-detect columns
 * const detected = autoDetectCsvColumns(csvString);
 * console.log(detected.dateColumn, detected.valueColumns);
 *
 * // Parse with explicit mapping
 * const records = parseGenericCsv(csvString, {
 *   delimiter: ',',
 *   sourceName: 'My Tracker',
 *   unitName: 'Count',
 *   mapping: {
 *     dateColumn: 'Date',
 *     valueColumns: { 'Steps': 'Daily Step Count', 'Weight': 'Weight' },
 *   },
 * });
 * ```
 */

import type { ParsedHealthRecord } from './apple-health.js';
import { buildImportSummary, type ImportSummary, type GenericCsvOptions, type CsvColumnMapping } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SOURCE = 'CSV Import';

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsvLine(line: string, delimiter: string): string[] {
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

// ---------------------------------------------------------------------------
// Delimiter detection
// ---------------------------------------------------------------------------

const DELIMITERS = [',', '\t', ';'] as const;

/**
 * Auto-detect the delimiter by counting occurrences in the first few lines
 * and picking the most consistent one.
 */
export function detectDelimiter(text: string): ',' | '\t' | ';' {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, 5);
  if (lines.length === 0) return ',';

  let bestDelimiter: ',' | '\t' | ';' = ',';
  let bestScore = -1;

  for (const delim of DELIMITERS) {
    const counts = lines.map((l) => parseCsvLine(l, delim).length);
    const first = counts[0] ?? 1;
    // Score: consistency (all lines same count) × field count
    const allSame = counts.every((c) => c === first);
    const score = allSame && first > 1 ? first : 0;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

// ---------------------------------------------------------------------------
// Date detection
// ---------------------------------------------------------------------------

/** Common date patterns for detection */
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}/, // ISO: 2024-01-15
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US/EU: 1/15/2024
  /^\d{1,2}-\d{1,2}-\d{2,4}/, // 01-15-2024
  /^\w{3,}\s+\d{1,2},?\s+\d{4}/, // Jan 15, 2024
  /^\d{1,2}\s+\w{3,}\s+\d{4}/, // 15 Jan 2024
  /^\d{4}\/\d{2}\/\d{2}/, // 2024/01/15
];

function looksLikeDate(value: string): boolean {
  if (!value || value.length < 6) return false;
  // Quick check: does it parse as a valid date?
  const d = new Date(value);
  if (!Number.isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
    return true;
  }
  return DATE_PATTERNS.some((p) => p.test(value));
}

function looksLikeNumber(value: string): boolean {
  if (!value) return false;
  const cleaned = value.replace(/,/g, '');
  return !Number.isNaN(Number(cleaned)) && cleaned !== '';
}

// ---------------------------------------------------------------------------
// Column auto-detection
// ---------------------------------------------------------------------------

/** Result of auto-detecting CSV columns */
export interface DetectedColumns {
  delimiter: ',' | '\t' | ';';
  headers: string[];
  dateColumn: string | null;
  valueColumns: string[];
  sampleValues: Record<string, string[]>;
}

/**
 * Auto-detect columns in a CSV file.
 * Returns the detected delimiter, headers, probable date column, and numeric columns.
 */
export function autoDetectCsvColumns(text: string): DetectedColumns {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) {
    return { delimiter, headers: [], dateColumn: null, valueColumns: [], sampleValues: {} };
  }

  const headers = parseCsvLine(lines[0]!, delimiter);
  const sampleRows = lines.slice(1, Math.min(11, lines.length)).map((l) => parseCsvLine(l, delimiter));

  let dateColumn: string | null = null;
  const valueColumns: string[] = [];
  const sampleValues: Record<string, string[]> = {};

  for (let col = 0; col < headers.length; col++) {
    const header = headers[col]!;
    const samples = sampleRows.map((r) => r[col] ?? '').filter(Boolean);
    sampleValues[header] = samples.slice(0, 3);

    // Check if this column contains dates
    const dateScore = samples.filter((s) => looksLikeDate(s)).length;
    if (dateScore > samples.length * 0.5 && dateColumn === null) {
      dateColumn = header;
      continue;
    }

    // Check if numeric
    const numScore = samples.filter((s) => looksLikeNumber(s)).length;
    if (numScore > samples.length * 0.5) {
      valueColumns.push(header);
    }
  }

  // Fallback: check header names for date-like columns
  if (dateColumn === null) {
    const dateNames = ['date', 'time', 'datetime', 'timestamp', 'day', 'recorded'];
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    for (const name of dateNames) {
      const idx = lowerHeaders.indexOf(name);
      if (idx >= 0) {
        dateColumn = headers[idx]!;
        // Remove from value columns if present
        const valIdx = valueColumns.indexOf(dateColumn);
        if (valIdx >= 0) valueColumns.splice(valIdx, 1);
        break;
      }
    }
  }

  return { delimiter, headers, dateColumn, valueColumns, sampleValues };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function toIso(dateStr: string): string {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toISOString();
}

/**
 * Parse a generic CSV file into ParsedHealthRecord[].
 *
 * If no mapping is provided, auto-detects the date column and treats all
 * numeric columns as value columns using their header names as variable names.
 */
export function parseGenericCsv(
  text: string,
  options: GenericCsvOptions = {},
): ParsedHealthRecord[] {
  const delimiter = options.delimiter ?? detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!, delimiter);
  const rows = lines.slice(1).map((l) => parseCsvLine(l, delimiter));
  const sourceName = options.sourceName ?? DEFAULT_SOURCE;
  const unitName = options.unitName ?? 'Count';
  const categoryName = options.variableCategoryName ?? 'Uncategorized';

  // Resolve column indices
  let dateColIdx: number;
  let valueCols: Array<{ idx: number; variableName: string }>;

  if (options.mapping) {
    const mapping = options.mapping;
    dateColIdx = resolveColIndex(headers, mapping.dateColumn);

    valueCols = Object.entries(mapping.valueColumns).map(([col, varName]) => ({
      idx: resolveColIndex(headers, col),
      variableName: varName,
    }));
  } else {
    // Auto-detect
    const detected = autoDetectCsvColumns(text);
    if (!detected.dateColumn) return [];

    dateColIdx = headers.indexOf(detected.dateColumn);
    valueCols = detected.valueColumns.map((h) => ({
      idx: headers.indexOf(h),
      variableName: h,
    }));
  }

  if (dateColIdx < 0) return [];

  const records: ParsedHealthRecord[] = [];

  for (const row of rows) {
    const dateStr = row[dateColIdx];
    if (!dateStr || !looksLikeDate(dateStr)) continue;

    const iso = toIso(dateStr);

    for (const { idx, variableName } of valueCols) {
      if (idx < 0) continue;
      const raw = row[idx];
      if (!raw) continue;
      const val = Number(raw.replace(/,/g, ''));
      if (Number.isNaN(val) || val === 0) continue;

      records.push({
        variableName,
        variableCategoryName: categoryName,
        value: Math.round(val * 1000) / 1000,
        unitName,
        unitAbbreviation: unitName,
        startAt: iso,
        endAt: iso,
        sourceName,
      });
    }
  }

  return records;
}

/**
 * Resolve a column reference (name or index) to a numeric index.
 */
function resolveColIndex(headers: string[], ref: string | number): number {
  if (typeof ref === 'number') return ref;
  const idx = headers.findIndex((h) => h.toLowerCase() === ref.toLowerCase());
  return idx;
}

/**
 * Summarize a generic CSV import.
 */
export function summarizeGenericCsvImport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
