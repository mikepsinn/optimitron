/**
 * MyFitnessPal Export Importer
 *
 * Parses MyFitnessPal CSV export files (Food Diary and Exercise).
 * Users can export from Settings → Diary Settings → Export.
 *
 * The food diary CSV has columns like:
 * Date, Meal, Food Name, Calories, Fat (g), Protein (g), Carbs (g), etc.
 *
 * @example
 * ```typescript
 * import { parseMyFitnessPalExport } from '@optomitron/data';
 * const records = parseMyFitnessPalExport(csvString);
 * ```
 */

import type { ParsedHealthRecord } from './apple-health.js';
import { buildImportSummary, type ImportSummary } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'MyFitnessPal';

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/**
 * Minimal CSV line parser that handles quoted fields.
 */
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

function parseCsv(text: string, delimiter = ','): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]!, delimiter);
  const rows = lines.slice(1).map((l) => parseCsvLine(l, delimiter));
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIso(dateStr: string): string {
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
    endAt: iso,
    sourceName: SOURCE,
    ...(note ? { note } : {}),
  };
}

/** Known nutrient column mappings */
const NUTRIENT_MAP: Record<string, { variableName: string; unit: string; abbr: string; category: string }> = {
  calories: { variableName: 'Calories', unit: 'Kilocalories', abbr: 'kcal', category: 'Foods' },
  'calories (kcal)': { variableName: 'Calories', unit: 'Kilocalories', abbr: 'kcal', category: 'Foods' },
  'fat (g)': { variableName: 'Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  fat: { variableName: 'Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'saturated fat': { variableName: 'Saturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'saturated fat (g)': { variableName: 'Saturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'polyunsaturated fat': { variableName: 'Polyunsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'polyunsaturated fat (g)': { variableName: 'Polyunsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'monounsaturated fat': { variableName: 'Monounsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'monounsaturated fat (g)': { variableName: 'Monounsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'trans fat': { variableName: 'Trans Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'trans fat (g)': { variableName: 'Trans Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  cholesterol: { variableName: 'Cholesterol', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  'cholesterol (mg)': { variableName: 'Cholesterol', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  'sodium (mg)': { variableName: 'Sodium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  sodium: { variableName: 'Sodium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  'potassium (mg)': { variableName: 'Potassium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  potassium: { variableName: 'Potassium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' },
  'carbohydrates (g)': { variableName: 'Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  carbs: { variableName: 'Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  carbohydrates: { variableName: 'Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'fiber (g)': { variableName: 'Fiber', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  fiber: { variableName: 'Fiber', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'sugar (g)': { variableName: 'Sugar', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  sugar: { variableName: 'Sugar', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'protein (g)': { variableName: 'Protein', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  protein: { variableName: 'Protein', unit: 'Grams', abbr: 'g', category: 'Nutrients' },
  'vitamin a (%)': { variableName: 'Vitamin A', unit: 'Percent', abbr: '%', category: 'Nutrients' },
  'vitamin c (%)': { variableName: 'Vitamin C', unit: 'Percent', abbr: '%', category: 'Nutrients' },
  'calcium (%)': { variableName: 'Calcium', unit: 'Percent', abbr: '%', category: 'Nutrients' },
  'iron (%)': { variableName: 'Iron', unit: 'Percent', abbr: '%', category: 'Nutrients' },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a MyFitnessPal food diary CSV export.
 *
 * Handles both the full diary format (with Date, Meal, Food columns) and
 * the daily totals format (Date + nutrient columns).
 */
export function parseMyFitnessPalExport(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const dateIdx = lowerHeaders.findIndex((h) => h === 'date');
  const mealIdx = lowerHeaders.findIndex((h) => h === 'meal');
  const foodIdx = lowerHeaders.findIndex(
    (h) => h === 'food name' || h === 'food' || h === 'name' || h === 'description',
  );

  if (dateIdx < 0) return []; // can't parse without dates

  // Build column → nutrient mappings
  const colMappings: Array<{ colIdx: number; mapping: (typeof NUTRIENT_MAP)[string] }> = [];
  for (let i = 0; i < lowerHeaders.length; i++) {
    const key = lowerHeaders[i]!;
    const mapping = NUTRIENT_MAP[key];
    if (mapping) {
      colMappings.push({ colIdx: i, mapping });
    }
  }

  const records: ParsedHealthRecord[] = [];

  for (const row of rows) {
    const dateStr = row[dateIdx];
    if (!dateStr) continue;

    const meal = mealIdx >= 0 ? row[mealIdx] : undefined;
    const food = foodIdx >= 0 ? row[foodIdx] : undefined;
    const note = [meal, food].filter(Boolean).join(': ') || undefined;

    for (const { colIdx, mapping } of colMappings) {
      const raw = row[colIdx];
      if (!raw) continue;
      // Strip commas from numbers like "1,234"
      const val = Number(raw.replace(/,/g, ''));
      if (Number.isNaN(val) || val === 0) continue;

      records.push(
        makeRecord(mapping.variableName, mapping.category, val, mapping.unit, mapping.abbr, dateStr, note),
      );
    }

    // Individual food item record
    if (food && food.toLowerCase() !== 'totals') {
      const calIdx = colMappings.find((c) => c.mapping.variableName === 'Calories');
      if (calIdx) {
        const calVal = Number((row[calIdx.colIdx] ?? '').replace(/,/g, ''));
        if (!Number.isNaN(calVal) && calVal > 0) {
          records.push(makeRecord(food, 'Foods', calVal, 'Kilocalories', 'kcal', dateStr, meal));
        }
      }
    }
  }

  return records;
}

/**
 * Parse a MyFitnessPal exercise CSV export.
 */
export function parseMyFitnessPalExercise(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const dateIdx = lowerHeaders.findIndex((h) => h === 'date');
  const nameIdx = lowerHeaders.findIndex((h) => h === 'exercise name' || h === 'exercise' || h === 'name');
  const calIdx = lowerHeaders.findIndex((h) => h === 'calories burned' || h === 'calories');
  const minIdx = lowerHeaders.findIndex((h) => h === 'minutes' || h === 'duration' || h === 'duration (minutes)');

  if (dateIdx < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const dateStr = row[dateIdx];
    if (!dateStr) continue;

    const name = nameIdx >= 0 ? row[nameIdx] ?? 'Exercise' : 'Exercise';

    if (calIdx >= 0) {
      const val = Number((row[calIdx] ?? '').replace(/,/g, ''));
      if (!Number.isNaN(val) && val > 0) {
        records.push(makeRecord('Calories Burned', 'Physical Activity', val, 'Kilocalories', 'kcal', dateStr, name));
      }
    }

    if (minIdx >= 0) {
      const val = Number((row[minIdx] ?? '').replace(/,/g, ''));
      if (!Number.isNaN(val) && val > 0) {
        records.push(makeRecord(`${name} Duration`, 'Physical Activity', val, 'Minutes', 'min', dateStr));
      }
    }
  }

  return records;
}

/**
 * Summarize a MyFitnessPal import.
 */
export function summarizeMyFitnessPalExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
