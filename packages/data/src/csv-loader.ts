/**
 * CSV Loader for Gapminder-format CSVs
 *
 * Parses CSVs where rows are countries and columns are years.
 * Returns one TimeSeries per country, compatible with @optomitron/optimizer.
 *
 * Format expected:
 *   country,1800,1801,...,2100
 *   Afghanistan,28.2,28.2,...,77.7
 *   Albania,35.4,35.4,...,88.3
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types (compatible with @optomitron/optimizer TimeSeries but self-contained)
// ---------------------------------------------------------------------------

export const CsvMeasurementSchema = z.object({
  /** Year as integer (e.g. 2020) */
  timestamp: z.number().int(),
  /** Numeric value */
  value: z.number(),
});

export type CsvMeasurement = z.infer<typeof CsvMeasurementSchema>;

export const CsvTimeSeriesSchema = z.object({
  /** Unique id: "<datasetId>:<country>" */
  variableId: z.string(),
  /** Country or entity name */
  name: z.string(),
  /** Ordered measurements */
  measurements: z.array(CsvMeasurementSchema),
  /** Optional category/tag */
  category: z.string().optional(),
  /** Optional unit label */
  unit: z.string().optional(),
  /** Data source identifier */
  source: z.string().optional(),
});

export type CsvTimeSeries = z.infer<typeof CsvTimeSeriesSchema>;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export interface ParseCsvOptions {
  /** Dataset identifier used to build variableId */
  datasetId?: string;
  /** Category tag */
  category?: string;
  /** Unit label */
  unit?: string;
  /** Source label */
  source?: string;
}

/**
 * Parse a Gapminder-format CSV string into an array of CsvTimeSeries.
 *
 * - First row is the header: first column is the entity label (e.g. "country"),
 *   subsequent columns are year numbers.
 * - Each subsequent row is one entity (country) with values per year.
 * - Empty or non-numeric cells are silently skipped.
 */
export function parseGapminderCsv(
  csvText: string,
  options: ParseCsvOptions = {},
): CsvTimeSeries[] {
  const { datasetId = 'unknown', category, unit, source } = options;

  const lines = csvText
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  // Header row — parse year columns
  const headerLine = lines[0]!;
  const headers = parseCsvLine(headerLine);
  const yearColumns: { index: number; year: number }[] = [];

  for (let i = 1; i < headers.length; i++) {
    const year = Number(headers[i]);
    if (Number.isFinite(year) && Number.isInteger(year)) {
      yearColumns.push({ index: i, year });
    }
  }

  if (yearColumns.length === 0) {
    return [];
  }

  // Data rows
  const results: CsvTimeSeries[] = [];

  for (let r = 1; r < lines.length; r++) {
    const fields = parseCsvLine(lines[r]!);
    const entityName = (fields[0] ?? '').trim();

    if (entityName.length === 0) continue;

    const measurements: CsvMeasurement[] = [];

    for (const { index, year } of yearColumns) {
      const raw = (fields[index] ?? '').trim();
      if (raw === '') continue;

      const value = Number(raw);
      if (!Number.isFinite(value)) continue;

      measurements.push({ timestamp: year, value });
    }

    if (measurements.length === 0) continue;

    results.push({
      variableId: `${datasetId}:${entityName}`,
      name: entityName,
      measurements,
      ...(category !== undefined && { category }),
      ...(unit !== undefined && { unit }),
      ...(source !== undefined && { source }),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Minimal CSV line parser (handles quoted fields with commas/newlines)
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }

  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Local submodule helper — read CSV from the economic-data git submodule
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Root of the economic-data submodule (packages/data/economic-data/data/).
 * Works whether the consumer runs from the repo root or from packages/data/.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ECONOMIC_DATA_DIR = resolve(__dirname, '..', 'economic-data', 'data');

/**
 * Load a CSV file from the local economic-data git submodule and parse it.
 *
 * @param filename - CSV filename inside `economic-data/data/`, e.g.
 *   `"data_health_alcohol_consumption_per_adult_15plus_litres.csv"`
 */
export function loadEconomicDataCsv(
  filename: string,
  options: Omit<ParseCsvOptions, 'datasetId' | 'source'> = {},
): CsvTimeSeries[] {
  const filePath = join(ECONOMIC_DATA_DIR, filename);
  const csvText = readFileSync(filePath, 'utf-8');
  const datasetId = filename.replace(/\.csv$/i, '');

  return parseGapminderCsv(csvText, {
    ...options,
    datasetId,
    source: `economic-data/${filename}`,
  });
}

/**
 * List all `.csv` files available in the local economic-data submodule.
 */
export function listEconomicDataCsvFiles(): string[] {
  return readdirSync(ECONOMIC_DATA_DIR).filter(f =>
    f.toLowerCase().endsWith('.csv'),
  );
}

// ---------------------------------------------------------------------------
// Fetch helper — download a CSV from the economic-data repo on GitHub
// ---------------------------------------------------------------------------

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/mikepsinn/economic-data/main/data';

/**
 * Fetch a single CSV file from the mikepsinn/economic-data repo and parse it.
 *
 * @deprecated Prefer {@link loadEconomicDataCsv} which reads from the local
 * git submodule and doesn't require network access.
 */
export async function fetchEconomicDataCsv(
  filename: string,
  options: Omit<ParseCsvOptions, 'datasetId' | 'source'> = {},
): Promise<CsvTimeSeries[]> {
  const url = `${GITHUB_RAW_BASE}/${encodeURIComponent(filename)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${filename}: ${response.status} ${response.statusText}`,
    );
  }

  const csvText = await response.text();
  const datasetId = filename.replace(/\.csv$/i, '');

  return parseGapminderCsv(csvText, {
    ...options,
    datasetId,
    source: `mikepsinn/economic-data/${filename}`,
  });
}
