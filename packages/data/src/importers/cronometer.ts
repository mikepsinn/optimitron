/**
 * Cronometer Export Importer
 *
 * Parses Cronometer CSV export (very detailed nutrition tracking).
 * Users export from Settings → Export Data → Daily Nutrition.
 *
 * The CSV has one row per day with 60+ columns covering all macro and
 * micronutrients: calories, protein, fat, carbs, fiber, all B vitamins,
 * A, C, D, E, K, iron, zinc, calcium, magnesium, etc.
 *
 * @example
 * ```typescript
 * import { parseCronometerExport } from '@optimitron/data';
 * const records = parseCronometerExport(csvString);
 * ```
 */

import type { ParsedHealthRecord } from './apple-health';
import { resolveVariableName } from './standard-variable-names';
import { buildImportSummary, type ImportSummary } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'Cronometer';

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
  };
}

// ---------------------------------------------------------------------------
// Nutrient column → variable mapping (50+ nutrients)
// ---------------------------------------------------------------------------

interface NutrientDef {
  variableName: string;
  unit: string;
  abbr: string;
  category: string;
}

/**
 * Map of lowercase column header patterns → nutrient definitions.
 * Cronometer uses headers like "Energy (kcal)", "Protein (g)", etc.
 */
const NUTRIENT_MAP: Array<{ pattern: RegExp; def: NutrientDef }> = [
  // Macros
  { pattern: /^energy\s*\(kcal\)$/i, def: { variableName: 'Calories', unit: 'Kilocalories', abbr: 'kcal', category: 'Foods' } },
  { pattern: /^calories$/i, def: { variableName: 'Calories', unit: 'Kilocalories', abbr: 'kcal', category: 'Foods' } },
  { pattern: /^protein\s*\(g\)$/i, def: { variableName: 'Protein', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^protein$/i, def: { variableName: 'Protein', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^fat\s*\(g\)$/i, def: { variableName: 'Total Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^fat$/i, def: { variableName: 'Total Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^carbs?\s*\(g\)$/i, def: { variableName: 'Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^carbs?$/i, def: { variableName: 'Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^net\s*carbs?\s*\(g\)$/i, def: { variableName: 'Net Carbohydrates', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^fiber\s*\(g\)$/i, def: { variableName: 'Fiber', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^fiber$/i, def: { variableName: 'Fiber', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^sugar(s)?\s*\(g\)$/i, def: { variableName: 'Sugar', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^sugar(s)?$/i, def: { variableName: 'Sugar', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^starch\s*\(g\)$/i, def: { variableName: 'Starch', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^alcohol\s*\(g\)$/i, def: { variableName: 'Alcohol', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^water\s*\(g\)$/i, def: { variableName: 'Water', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^caffeine\s*\(mg\)$/i, def: { variableName: 'Caffeine', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },

  // Fats
  { pattern: /^saturated\s*\(g\)$/i, def: { variableName: 'Saturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^saturated\s*fat/i, def: { variableName: 'Saturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^monounsaturated\s*\(g\)$/i, def: { variableName: 'Monounsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^polyunsaturated\s*\(g\)$/i, def: { variableName: 'Polyunsaturated Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^trans[\s-]*fat(s)?\s*\(g\)$/i, def: { variableName: 'Trans Fat', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^omega[\s-]*3\s*\(g\)$/i, def: { variableName: 'Omega-3', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^omega[\s-]*6\s*\(g\)$/i, def: { variableName: 'Omega-6', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^cholesterol\s*\(mg\)$/i, def: { variableName: 'Cholesterol', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^cholesterol$/i, def: { variableName: 'Cholesterol', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },

  // Amino acids
  { pattern: /^tryptophan\s*\(g\)$/i, def: { variableName: 'Tryptophan', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^threonine\s*\(g\)$/i, def: { variableName: 'Threonine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^isoleucine\s*\(g\)$/i, def: { variableName: 'Isoleucine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^leucine\s*\(g\)$/i, def: { variableName: 'Leucine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^lysine\s*\(g\)$/i, def: { variableName: 'Lysine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^methionine\s*\(g\)$/i, def: { variableName: 'Methionine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^phenylalanine\s*\(g\)$/i, def: { variableName: 'Phenylalanine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^valine\s*\(g\)$/i, def: { variableName: 'Valine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },
  { pattern: /^histidine\s*\(g\)$/i, def: { variableName: 'Histidine', unit: 'Grams', abbr: 'g', category: 'Nutrients' } },

  // Vitamins
  { pattern: /^vitamin\s*a\s*\(.*\)$/i, def: { variableName: 'Vitamin A', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*a$/i, def: { variableName: 'Vitamin A', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  // B12 must come before B1 to avoid B1 matching "B12"
  { pattern: /^b12\s*\(cobalamin\)|^cobalamin|^vitamin\s*b12/i, def: { variableName: 'Vitamin B12', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^b1\s*\(thiamine\)|^thiamine|^vitamin\s*b1(?!\d)/i, def: { variableName: 'Vitamin B1 (Thiamine)', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^b2\s*\(riboflavin\)|^riboflavin|^vitamin\s*b2/i, def: { variableName: 'Vitamin B2 (Riboflavin)', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^b3\s*\(niacin\)|^niacin|^vitamin\s*b3/i, def: { variableName: 'Vitamin B3 (Niacin)', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^b5\s*\(pantothenic\)|^pantothenic|^vitamin\s*b5/i, def: { variableName: 'Vitamin B5 (Pantothenic Acid)', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^b6\s*\(pyridoxine\)|^pyridoxine|^vitamin\s*b6/i, def: { variableName: 'Vitamin B6', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^folate|^folic\s*acid|^b9/i, def: { variableName: 'Folate', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^biotin|^b7/i, def: { variableName: 'Biotin', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^choline/i, def: { variableName: 'Choline', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*c\s*\(.*\)$/i, def: { variableName: 'Vitamin C', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*c$/i, def: { variableName: 'Vitamin C', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*d\s*\(.*\)$/i, def: { variableName: 'Vitamin D', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*d$/i, def: { variableName: 'Vitamin D', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*e\s*\(.*\)$/i, def: { variableName: 'Vitamin E', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*e$/i, def: { variableName: 'Vitamin E', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*k\s*\(.*\)$/i, def: { variableName: 'Vitamin K', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^vitamin\s*k$/i, def: { variableName: 'Vitamin K', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },

  // Minerals
  { pattern: /^calcium\s*\(mg\)$/i, def: { variableName: 'Calcium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^calcium$/i, def: { variableName: 'Calcium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^iron\s*\(mg\)$/i, def: { variableName: 'Iron', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^iron$/i, def: { variableName: 'Iron', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^magnesium\s*\(mg\)$/i, def: { variableName: 'Magnesium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^magnesium$/i, def: { variableName: 'Magnesium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^phosphorus\s*\(mg\)$/i, def: { variableName: 'Phosphorus', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^phosphorus$/i, def: { variableName: 'Phosphorus', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^potassium\s*\(mg\)$/i, def: { variableName: 'Potassium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^potassium$/i, def: { variableName: 'Potassium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^sodium\s*\(mg\)$/i, def: { variableName: 'Sodium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^sodium$/i, def: { variableName: 'Sodium', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^zinc\s*\(mg\)$/i, def: { variableName: 'Zinc', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^zinc$/i, def: { variableName: 'Zinc', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^copper\s*\(mg\)$/i, def: { variableName: 'Copper', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^copper$/i, def: { variableName: 'Copper', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^manganese\s*\(mg\)$/i, def: { variableName: 'Manganese', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^manganese$/i, def: { variableName: 'Manganese', unit: 'Milligrams', abbr: 'mg', category: 'Nutrients' } },
  { pattern: /^selenium\s*\(.*\)$/i, def: { variableName: 'Selenium', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^selenium$/i, def: { variableName: 'Selenium', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^chromium\s*\(.*\)$/i, def: { variableName: 'Chromium', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^iodine\s*\(.*\)$/i, def: { variableName: 'Iodine', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^molybdenum\s*\(.*\)$/i, def: { variableName: 'Molybdenum', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },

  // Other
  { pattern: /^lycopene/i, def: { variableName: 'Lycopene', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^lutein/i, def: { variableName: 'Lutein + Zeaxanthin', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
  { pattern: /^beta[\s-]*carotene/i, def: { variableName: 'Beta-Carotene', unit: 'Micrograms', abbr: 'µg', category: 'Nutrients' } },
];

function matchNutrient(header: string): NutrientDef | null {
  for (const { pattern, def } of NUTRIENT_MAP) {
    if (pattern.test(header)) return def;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a Cronometer daily nutrition CSV export.
 *
 * Cronometer exports have a "Date" column followed by 50+ nutrient columns.
 * This parser auto-detects known nutrient columns and maps them.
 */
export function parseCronometerExport(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const dateIdx = lowerHeaders.findIndex((h) => h === 'date' || h === 'day');
  if (dateIdx < 0) return [];

  // Build column mappings
  const colMappings: Array<{ colIdx: number; def: NutrientDef }> = [];
  for (let i = 0; i < headers.length; i++) {
    if (i === dateIdx) continue;
    const def = matchNutrient(headers[i]!);
    if (def) {
      colMappings.push({ colIdx: i, def });
    }
  }

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const dateStr = row[dateIdx];
    if (!dateStr) continue;

    for (const { colIdx, def } of colMappings) {
      const raw = row[colIdx];
      if (!raw) continue;
      const val = Number(raw.replace(/,/g, ''));
      if (Number.isNaN(val) || val === 0) continue;

      records.push(rec(def.variableName, def.category, val, def.unit, def.abbr, dateStr));
    }
  }

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'cronometer');
  }

  return records;
}

/**
 * Parse a Cronometer food diary CSV (individual entries per food item).
 * Columns: Date, Group, Food Name, Amount, Energy (kcal), ...nutrients...
 */
export function parseCronometerFoodDiary(csv: string): ParsedHealthRecord[] {
  const { headers, rows } = parseCsv(csv);
  if (headers.length === 0) return [];

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const dateIdx = lowerHeaders.findIndex((h) => h === 'date' || h === 'day');
  const foodIdx = lowerHeaders.findIndex((h) => h === 'food name' || h === 'food' || h === 'name');
  const groupIdx = lowerHeaders.findIndex((h) => h === 'group' || h === 'meal');

  if (dateIdx < 0) return [];

  const records: ParsedHealthRecord[] = [];
  for (const row of rows) {
    const dateStr = row[dateIdx];
    if (!dateStr) continue;

    const food = foodIdx >= 0 ? row[foodIdx] : undefined;
    const group = groupIdx >= 0 ? row[groupIdx] : undefined;
    const note = [group, food].filter(Boolean).join(': ') || undefined;

    // Map nutrient columns
    for (let i = 0; i < headers.length; i++) {
      if (i === dateIdx || i === foodIdx || i === groupIdx) continue;
      const def = matchNutrient(headers[i]!);
      if (!def) continue;

      const raw = row[i];
      if (!raw) continue;
      const val = Number(raw.replace(/,/g, ''));
      if (Number.isNaN(val) || val === 0) continue;

      records.push({
        ...rec(def.variableName, def.category, val, def.unit, def.abbr, dateStr),
        ...(note ? { note } : {}),
      });
    }
  }

  // Normalize variable names to canonical forms
  for (const record of records) {
    record.variableName = resolveVariableName(record.variableName, 'cronometer');
  }

  return records;
}

/**
 * Summarize a Cronometer import.
 */
export function summarizeCronometerExport(records: readonly ParsedHealthRecord[]): ImportSummary {
  return buildImportSummary(records);
}
