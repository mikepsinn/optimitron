/**
 * Unit Conversion System
 *
 * Provides unit conversion, compatibility checking, and normalization for
 * all measurement units used across health data importers.
 *
 * Ported from legacy API: https://github.com/mikepsinn/curedao-api/blob/main/app/Slim/Model/QMUnit.php
 * Specifically QMUnit::convertTo and related conversion logic.
 *
 * Design:
 * - Units are grouped into categories (Weight, Volume, Time, etc.)
 * - Each category has a base unit; all conversions go through base
 * - Temperature uses special formula-based conversion (not ratio-based)
 * - Rating scales use linear rescaling between min/max
 *
 * @see https://dfda-spec.warondisease.org
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnitDefinition {
  /** Canonical name (e.g. "Milligrams") */
  name: string;
  /** Short abbreviation (e.g. "mg") */
  abbreviation: string;
  /** Category grouping */
  category: UnitCategory;
  /**
   * Multiplier to convert TO the base unit of this category.
   * E.g., for mg in Weight (base=g): toBase = 0.001 (1 mg = 0.001 g)
   * Null for temperature and ratings which use formula-based conversion.
   */
  toBaseFactor: number | null;
  /**
   * Additive offset applied AFTER multiplication (for temperature).
   * conversion: baseValue = value * toBaseFactor + toBaseOffset
   */
  toBaseOffset?: number;
  /** Minimum valid value in this unit (inclusive) */
  minimumValue?: number;
  /** Maximum valid value in this unit (inclusive) */
  maximumValue?: number;
}

export type UnitCategory =
  | 'Weight'
  | 'Volume'
  | 'Time'
  | 'Distance'
  | 'Temperature'
  | 'Energy'
  | 'Percentage'
  | 'Count'
  | 'Rating';

// ---------------------------------------------------------------------------
// Unit Definitions
// ---------------------------------------------------------------------------

/**
 * All supported units, keyed by their canonical abbreviation.
 *
 * Within each category there is a "base unit" (toBaseFactor = 1):
 * - Weight: grams (g)
 * - Volume: millilitres (mL)
 * - Time: seconds (s)
 * - Distance: metres (m)
 * - Temperature: celsius (°C) — base, with formula conversion
 * - Energy: kilocalories (kcal)
 * - Percentage: percent (%)
 * - Count: count
 * - Rating: 1-5 scale is base, others rescale to it
 */
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // ── Weight (base: grams) ───────────────────────────────────────────────
  mg: {
    name: 'Milligrams',
    abbreviation: 'mg',
    category: 'Weight',
    toBaseFactor: 0.001,
    minimumValue: 0,
  },
  g: {
    name: 'Grams',
    abbreviation: 'g',
    category: 'Weight',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  kg: {
    name: 'Kilograms',
    abbreviation: 'kg',
    category: 'Weight',
    toBaseFactor: 1000,
    minimumValue: 0,
  },
  oz: {
    name: 'Ounces',
    abbreviation: 'oz',
    category: 'Weight',
    toBaseFactor: 28.3495,
    minimumValue: 0,
  },
  lbs: {
    name: 'Pounds',
    abbreviation: 'lbs',
    category: 'Weight',
    toBaseFactor: 453.592,
    minimumValue: 0,
  },
  mcg: {
    name: 'Micrograms',
    abbreviation: 'µg',
    category: 'Weight',
    toBaseFactor: 0.000001,
    minimumValue: 0,
  },

  // ── Volume (base: millilitres) ─────────────────────────────────────────
  mL: {
    name: 'Millilitres',
    abbreviation: 'mL',
    category: 'Volume',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  L: {
    name: 'Litres',
    abbreviation: 'L',
    category: 'Volume',
    toBaseFactor: 1000,
    minimumValue: 0,
  },
  'fl oz': {
    name: 'Fluid Ounces',
    abbreviation: 'fl oz',
    category: 'Volume',
    toBaseFactor: 29.5735,
    minimumValue: 0,
  },
  cup: {
    name: 'Cups',
    abbreviation: 'cup',
    category: 'Volume',
    toBaseFactor: 236.588,
    minimumValue: 0,
  },
  tbsp: {
    name: 'Tablespoons',
    abbreviation: 'tbsp',
    category: 'Volume',
    toBaseFactor: 14.7868,
    minimumValue: 0,
  },
  tsp: {
    name: 'Teaspoons',
    abbreviation: 'tsp',
    category: 'Volume',
    toBaseFactor: 4.92892,
    minimumValue: 0,
  },

  // ── Time (base: seconds) ───────────────────────────────────────────────
  s: {
    name: 'Seconds',
    abbreviation: 's',
    category: 'Time',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  min: {
    name: 'Minutes',
    abbreviation: 'min',
    category: 'Time',
    toBaseFactor: 60,
    minimumValue: 0,
  },
  h: {
    name: 'Hours',
    abbreviation: 'h',
    category: 'Time',
    toBaseFactor: 3600,
    minimumValue: 0,
  },
  d: {
    name: 'Days',
    abbreviation: 'd',
    category: 'Time',
    toBaseFactor: 86400,
    minimumValue: 0,
  },

  // ── Distance (base: metres) ────────────────────────────────────────────
  m: {
    name: 'Metres',
    abbreviation: 'm',
    category: 'Distance',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  km: {
    name: 'Kilometres',
    abbreviation: 'km',
    category: 'Distance',
    toBaseFactor: 1000,
    minimumValue: 0,
  },
  mi: {
    name: 'Miles',
    abbreviation: 'mi',
    category: 'Distance',
    toBaseFactor: 1609.344,
    minimumValue: 0,
  },
  ft: {
    name: 'Feet',
    abbreviation: 'ft',
    category: 'Distance',
    toBaseFactor: 0.3048,
    minimumValue: 0,
  },
  cm: {
    name: 'Centimetres',
    abbreviation: 'cm',
    category: 'Distance',
    toBaseFactor: 0.01,
    minimumValue: 0,
  },

  // ── Temperature (base: celsius, formula-based) ─────────────────────────
  '°C': {
    name: 'Degrees Celsius',
    abbreviation: '°C',
    category: 'Temperature',
    toBaseFactor: 1,
    toBaseOffset: 0,
  },
  '°F': {
    name: 'Degrees Fahrenheit',
    abbreviation: '°F',
    category: 'Temperature',
    // Conversion: C = (F - 32) * 5/9
    // We encode this as: toBase = value * (5/9) + (-32 * 5/9) = value * 0.5556 - 17.7778
    toBaseFactor: 5 / 9,
    toBaseOffset: -32 * (5 / 9),
  },

  // ── Energy (base: kilocalories) ────────────────────────────────────────
  kcal: {
    name: 'Kilocalories',
    abbreviation: 'kcal',
    category: 'Energy',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  cal: {
    name: 'Calories',
    abbreviation: 'cal',
    category: 'Energy',
    toBaseFactor: 0.001,
    minimumValue: 0,
  },
  kJ: {
    name: 'Kilojoules',
    abbreviation: 'kJ',
    category: 'Energy',
    toBaseFactor: 1 / 4.184,
    minimumValue: 0,
  },

  // ── Percentage (base: percent) ─────────────────────────────────────────
  '%': {
    name: 'Percent',
    abbreviation: '%',
    category: 'Percentage',
    toBaseFactor: 1,
    minimumValue: 0,
    maximumValue: 100,
  },
  ratio: {
    name: 'Ratio (0-1)',
    abbreviation: 'ratio',
    category: 'Percentage',
    toBaseFactor: 100, // 0.5 ratio = 50%
    minimumValue: 0,
    maximumValue: 1,
  },

  // ── Count (base: count) ────────────────────────────────────────────────
  count: {
    name: 'Count',
    abbreviation: 'count',
    category: 'Count',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  doses: {
    name: 'Doses',
    abbreviation: 'doses',
    category: 'Count',
    toBaseFactor: 1,
    minimumValue: 0,
  },
  servings: {
    name: 'Servings',
    abbreviation: 'servings',
    category: 'Count',
    toBaseFactor: 1,
    minimumValue: 0,
  },

  // ── Rating scales (base: 1-5) ─────────────────────────────────────────
  // Ratings are conceptually different — they rescale linearly between ranges.
  // 1-5 is base; 1-10 and 0-100 rescale to it.
  '1-5': {
    name: 'Rating (1-5)',
    abbreviation: '1-5',
    category: 'Rating',
    toBaseFactor: 1,
    minimumValue: 1,
    maximumValue: 5,
  },
  '1-10': {
    name: 'Rating (1-10)',
    abbreviation: '1-10',
    category: 'Rating',
    toBaseFactor: null, // formula-based
    minimumValue: 1,
    maximumValue: 10,
  },
  '0-100': {
    name: 'Rating (0-100)',
    abbreviation: '0-100',
    category: 'Rating',
    toBaseFactor: null, // formula-based
    minimumValue: 0,
    maximumValue: 100,
  },
};

// ---------------------------------------------------------------------------
// Alias map: alternative names → canonical abbreviation
// ---------------------------------------------------------------------------

/**
 * Maps alternative names, abbreviations, and common misspellings to the
 * canonical abbreviation used as keys in UNIT_DEFINITIONS.
 */
const UNIT_ALIASES: Record<string, string> = {
  // Weight
  milligrams: 'mg',
  milligram: 'mg',
  grams: 'g',
  gram: 'g',
  kilograms: 'kg',
  kilogram: 'kg',
  ounces: 'oz',
  ounce: 'oz',
  pounds: 'lbs',
  pound: 'lbs',
  lb: 'lbs',
  micrograms: 'mcg',
  microgram: 'mcg',
  'µg': 'mcg',
  μg: 'mcg',
  ug: 'mcg',

  // Volume
  millilitres: 'mL',
  milliliters: 'mL',
  milliliter: 'mL',
  millilitre: 'mL',
  ml: 'mL',
  litres: 'L',
  liters: 'L',
  liter: 'L',
  litre: 'L',
  l: 'L',
  'fluid ounces': 'fl oz',
  'fluid ounce': 'fl oz',
  'fl_oz': 'fl oz',
  'fl_oz_us': 'fl oz',
  floz: 'fl oz',
  cups: 'cup',
  tablespoons: 'tbsp',
  tablespoon: 'tbsp',
  teaspoons: 'tsp',
  teaspoon: 'tsp',

  // Time
  seconds: 's',
  second: 's',
  sec: 's',
  secs: 's',
  minutes: 'min',
  minute: 'min',
  mins: 'min',
  hours: 'h',
  hour: 'h',
  hr: 'h',
  hrs: 'h',
  days: 'd',
  day: 'd',

  // Distance
  metres: 'm',
  meters: 'm',
  metre: 'm',
  meter: 'm',
  kilometres: 'km',
  kilometers: 'km',
  kilometre: 'km',
  kilometer: 'km',
  miles: 'mi',
  mile: 'mi',
  feet: 'ft',
  foot: 'ft',
  centimetres: 'cm',
  centimeters: 'cm',
  centimetre: 'cm',
  centimeter: 'cm',

  // Temperature
  celsius: '°C',
  degc: '°C',
  'degrees celsius': '°C',
  '°c': '°C',
  c: '°C',
  fahrenheit: '°F',
  degf: '°F',
  'degrees fahrenheit': '°F',
  '°f': '°F',
  f: '°F',

  // Energy
  kilocalories: 'kcal',
  kilocalorie: 'kcal',
  calories: 'cal',
  calorie: 'cal',
  kilojoules: 'kJ',
  kilojoule: 'kJ',
  kj: 'kJ',

  // Percentage
  percent: '%',
  percentage: '%',
  'ratio (0-1)': 'ratio',

  // Count
  dose: 'doses',
  serving: 'servings',

  // Rating
  'rating (1-5)': '1-5',
  'rating (1-10)': '1-10',
  'rating (0-100)': '0-100',
  '1 to 5': '1-5',
  '1 to 10': '1-10',
  '0 to 100': '0-100',
};

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a unit string to its canonical abbreviation.
 *
 * Handles:
 * - Case insensitivity ("Mg" → "mg", "MILLIGRAMS" → "mg")
 * - Full names ("milligrams" → "mg")
 * - Common variants ("fl_oz" → "fl oz")
 * - Whitespace trimming
 *
 * Returns the canonical abbreviation, or the original string if unrecognized.
 */
export function normalizeUnit(unitString: string): string {
  const trimmed = unitString.trim();
  if (!trimmed) return trimmed;

  // Direct match on canonical abbreviation (case-sensitive)
  if (UNIT_DEFINITIONS[trimmed]) return trimmed;

  // Case-insensitive match on abbreviation
  const lower = trimmed.toLowerCase();
  for (const abbr of Object.keys(UNIT_DEFINITIONS)) {
    if (abbr.toLowerCase() === lower) return abbr;
  }

  // Check aliases (case-insensitive)
  const aliasResult = UNIT_ALIASES[lower];
  if (aliasResult) return aliasResult;

  // Return original if nothing matched
  return trimmed;
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Get the UnitDefinition for a unit string (handles normalization).
 * Returns undefined if the unit is not recognized.
 */
export function getUnitDefinition(unit: string): UnitDefinition | undefined {
  const normalized = normalizeUnit(unit);
  return UNIT_DEFINITIONS[normalized];
}

/**
 * Get the category for a unit string.
 * Returns 'Unknown' if the unit is not recognized.
 */
export function getUnitCategory(unit: string): string {
  const def = getUnitDefinition(unit);
  return def?.category ?? 'Unknown';
}

/**
 * Check if two units are compatible (same category, can be converted).
 */
export function isCompatibleUnit(unit1: string, unit2: string): boolean {
  const cat1 = getUnitCategory(unit1);
  const cat2 = getUnitCategory(unit2);
  if (cat1 === 'Unknown' || cat2 === 'Unknown') return false;
  return cat1 === cat2;
}

// ---------------------------------------------------------------------------
// Rating conversion helpers
// ---------------------------------------------------------------------------

/**
 * Linear rescale a value from one range to another.
 * rescale(7, 1, 10, 1, 5) → 3.667 (7 on a 1-10 scale → ~3.67 on a 1-5 scale)
 */
function rescale(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  if (fromMax === fromMin) return toMin; // degenerate
  const normalized = (value - fromMin) / (fromMax - fromMin);
  return toMin + normalized * (toMax - toMin);
}

/** Rating scale definitions: abbreviation → [min, max] */
const RATING_RANGES: Record<string, [number, number]> = {
  '1-5': [1, 5],
  '1-10': [1, 10],
  '0-100': [0, 100],
};

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

/**
 * Convert a value from one unit to another.
 *
 * Supports all unit categories: weight, volume, time, distance, temperature,
 * energy, percentage, count, and ratings.
 *
 * For temperature, uses the formula: C = (F - 32) × 5/9 and inverse.
 * For ratings, uses linear rescaling between scale ranges.
 *
 * @param value - The numeric value to convert
 * @param fromUnit - Source unit (abbreviation, name, or alias)
 * @param toUnit - Target unit (abbreviation, name, or alias)
 * @returns The converted value
 * @throws Error if units are incompatible or unrecognized
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  const fromNorm = normalizeUnit(fromUnit);
  const toNorm = normalizeUnit(toUnit);

  // Same unit — no conversion needed
  if (fromNorm === toNorm) return value;

  const fromDef = UNIT_DEFINITIONS[fromNorm];
  const toDef = UNIT_DEFINITIONS[toNorm];

  if (!fromDef) {
    throw new Error(`Unrecognized unit: "${fromUnit}" (normalized: "${fromNorm}")`);
  }
  if (!toDef) {
    throw new Error(`Unrecognized unit: "${toUnit}" (normalized: "${toNorm}")`);
  }

  if (fromDef.category !== toDef.category) {
    throw new Error(
      `Incompatible units: "${fromUnit}" (${fromDef.category}) and "${toUnit}" (${toDef.category})`,
    );
  }

  // ── Rating conversion (linear rescaling) ───────────────────────────────
  if (fromDef.category === 'Rating') {
    const fromRange = RATING_RANGES[fromNorm];
    const toRange = RATING_RANGES[toNorm];
    if (!fromRange || !toRange) {
      throw new Error(`Missing rating range for "${fromNorm}" or "${toNorm}"`);
    }
    return rescale(value, fromRange[0], fromRange[1], toRange[0], toRange[1]);
  }

  // ── Temperature conversion (formula-based) ─────────────────────────────
  if (fromDef.category === 'Temperature') {
    // Convert to base (Celsius) first
    const celsius =
      value * (fromDef.toBaseFactor ?? 1) + (fromDef.toBaseOffset ?? 0);
    // Convert from Celsius to target
    const toFactor = toDef.toBaseFactor ?? 1;
    const toOffset = toDef.toBaseOffset ?? 0;
    // Inverse: value = (celsius - toOffset) / toFactor
    return (celsius - toOffset) / toFactor;
  }

  // ── Standard ratio-based conversion ────────────────────────────────────
  const fromFactor = fromDef.toBaseFactor;
  const toFactor = toDef.toBaseFactor;

  if (fromFactor == null || toFactor == null) {
    throw new Error(
      `Cannot convert between "${fromUnit}" and "${toUnit}" — missing conversion factor`,
    );
  }

  // value_in_from → base → value_in_to
  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}
