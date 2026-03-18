// ============================================================================
// Measurement Schema — Types & Constants for NLP → Measurement parsing
// ============================================================================
//
// Ported from decentralized-fda's measurementSchema.ts and adapted to
// Optimitron's Prisma schema (VariableCategory.name, Unit.abbreviatedName).
//
// These constants are designed to be embedded in LLM prompts so the model
// knows exactly which category and unit strings are valid.
// ============================================================================

// ---------------------------------------------------------------------------
// Variable Categories
// ---------------------------------------------------------------------------

/**
 * All valid variable category names in Optimitron's database.
 * Maps to the `VariableCategory.name` column.
 *
 * Use these when telling an LLM which category a parsed variable belongs to.
 *
 * @example
 *   "Vitamin D" → category "Supplement"
 *   "Headache Severity" → category "Symptom"
 *   "Coffee" → category "Drink"
 */
export const VariableCategoryNames = [
  'Treatment',
  'Supplement',
  'Food',
  'Drink',
  'Activity',
  'Exercise',
  'Sleep',
  'Symptom',
  'Emotion',
  'Vital Sign',
  'Lab Result',
  'Environment',
  'Economic',
  'Policy',
  'Goal',
] as const;

/** Union type of all valid variable category names */
export type VariableCategoryName = (typeof VariableCategoryNames)[number];

// ---------------------------------------------------------------------------
// DFDA → Optimitron category mapping (used when porting prompts)
// ---------------------------------------------------------------------------

/**
 * Maps DFDA's 27 variable category names to Optimitron's 15 categories.
 * Used internally when adapting DFDA-era prompts and for LLM fallback.
 */
export const DFDA_CATEGORY_MAP: Record<string, VariableCategoryName> = {
  'Emotions': 'Emotion',
  'Physique': 'Vital Sign',
  'Physical Activity': 'Exercise',
  'Locations': 'Environment',
  'Miscellaneous': 'Activity',
  'Sleep': 'Sleep',
  'Social Interactions': 'Activity',
  'Vital Signs': 'Vital Sign',
  'Cognitive Performance': 'Symptom',
  'Symptoms': 'Symptom',
  'Nutrients': 'Food',
  'Goals': 'Goal',
  'Treatments': 'Treatment',
  'Activities': 'Activity',
  'Foods': 'Food',
  'Conditions': 'Symptom',
  'Environment': 'Environment',
  'Causes of Illness': 'Environment',
  'Books': 'Activity',
  'Software': 'Activity',
  'Payments': 'Economic',
  'Movies and TV': 'Activity',
  'Music': 'Activity',
  'Electronics': 'Activity',
  'IT Metrics': 'Activity',
  'Economic Indicators': 'Economic',
  'Investment Strategies': 'Economic',
};

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/**
 * All valid unit abbreviated names in Optimitron's database.
 * Maps to the `Unit.abbreviatedName` column.
 *
 * These are the short forms shown in UI (e.g. "mg", "IU", "1-5").
 *
 * @example
 *   "took 500 mg of Vitamin C" → unitAbbreviation "mg"
 *   "mood 4 out of 5" → unitAbbreviation "1-5"
 *   "5000 IU vitamin D" → unitAbbreviation "IU"
 */
export const UnitAbbreviations = [
  // Weight
  'mg',       // Milligrams
  'g',        // Grams
  'kg',       // Kilograms
  'oz',       // Ounces
  'lb',       // Pounds
  'mcg',      // Micrograms

  // Volume
  'mL',       // Milliliters
  'L',        // Liters
  'fl oz',    // Fluid Ounces
  'cups',     // Cups

  // Count
  'count',    // Count
  'servings', // Servings
  'doses',    // Doses
  'tablets',  // Tablets
  'capsules', // Capsules
  'IU',       // International Units
  'steps',    // Steps

  // Rating
  '1-5',      // 1 to 5 Rating
  '1-10',     // 1 to 10 Rating
  '%',        // Percent
  'yes/no',   // Yes/No (0 or 1)

  // Currency
  'USD',      // US Dollars
  'EUR',      // Euros
  'GBP',      // British Pounds

  // Duration
  's',        // Seconds
  'min',      // Minutes
  'h',        // Hours

  // Energy
  'kcal',     // Calories (kilocalories)

  // Frequency / Vital
  'bpm',      // Beats Per Minute
  'mmHg',     // Millimeters of Mercury
  '°F',       // Degrees Fahrenheit
] as const;

/** Union type of all valid unit abbreviated names */
export type UnitAbbreviation = (typeof UnitAbbreviations)[number];

// ---------------------------------------------------------------------------
// DFDA → Optimitron unit mapping
// ---------------------------------------------------------------------------

/**
 * Maps DFDA's verbose unit names to Optimitron's abbreviated unit names.
 * Used when adapting DFDA-era data and for LLM prompt normalization.
 */
export const DFDA_UNIT_MAP: Record<string, UnitAbbreviation> = {
  'Milligrams': 'mg',
  'Grams': 'g',
  'Kilograms': 'kg',
  'Ounces': 'oz',
  'Pounds': 'lb',
  'Micrograms': 'mcg',
  'Milliliters': 'mL',
  'Liters': 'L',
  'Count': 'count',
  'Serving': 'servings',
  'Doses': 'doses',
  'Tablets': 'tablets',
  'Capsules': 'capsules',
  'International Units': 'IU',
  'Percent': '%',
  'Yes/No': 'yes/no',
  'Dollars': 'USD',
  'Seconds': 's',
  'Minutes': 'min',
  'Hours': 'h',
  'Calories': 'kcal',
  'Kilocalories': 'kcal',
  'Beats per Minute': 'bpm',
  'Millimeters Merc': 'mmHg',
  'Degrees Fahrenheit': '°F',
  'Degrees Celsius': '°F', // We'll need conversion; default to °F
  '1 to 5 Rating': '1-5',
  '1 to 10 Rating': '1-10',
  '1 to 3 Rating': '1-5', // Map to closest
  '0 to 5 Rating': '1-5', // Map to closest
  '0 to 1 Rating': 'yes/no',
  '-4 to 4 Rating': '1-10', // Map to closest
  '% Recommended Daily Allowance': '%',
  'Pills': 'tablets',
  'Puffs': 'doses',
  'Sprays': 'doses',
  'Drops': 'doses',
  'Applications': 'doses',
  'Event': 'count',
  'Units': 'count',
  'Index': 'count',
  'Pieces': 'count',
  'Quarts': 'L',
  'Miles': 'steps', // rough mapping
  'Kilometers': 'steps',
  'Meters': 'steps',
  'Feet': 'steps',
  'Inches': 'count',
  'Centimeters': 'count',
  'Millimeters': 'count',
  'Miles per Hour': 'count',
  'Meters per Second': 'count',
  'Milliseconds': 's',
  'per Minute': 'bpm',
  'Decibels': 'count',
  'Hectopascal': 'mmHg',
  'Millibar': 'mmHg',
  'Pascal': 'mmHg',
  'Torr': 'mmHg',
  'Gigabecquerel': 'count',
  'Parts per Million': 'count',
  'Micrograms per decilitre': 'mcg',
  'Degrees North': 'count',
  'Degrees East': 'count',
};

// ---------------------------------------------------------------------------
// Combination Operation
// ---------------------------------------------------------------------------

/**
 * How to aggregate multiple measurements of the same variable in a time window.
 *
 * - **SUM**: Additive quantities (mg taken, calories eaten, steps walked)
 * - **MEAN**: Rating/state measurements (mood, severity, temperature)
 */
export type CombinationOperation = 'SUM' | 'MEAN';

// ---------------------------------------------------------------------------
// Parsed Measurement (output of NLP pipeline)
// ---------------------------------------------------------------------------

/**
 * A structured measurement parsed from natural language text.
 *
 * This interface represents the output of the text-to-measurements pipeline
 * before it's saved to the database. It uses human-readable names that map
 * to Optimitron's Prisma schema:
 *
 * - `variableName` → `GlobalVariable.name`
 * - `unitAbbreviation` → `Unit.abbreviatedName`
 * - `categoryName` → `VariableCategory.name`
 * - `startAt` → `Measurement.startTime`
 *
 * @example
 * ```ts
 * const measurement: ParsedMeasurement = {
 *   variableName: "Vitamin D",
 *   value: 5000,
 *   unitAbbreviation: "IU",
 *   categoryName: "Supplement",
 *   combinationOperation: "SUM",
 *   startAt: "2026-02-06T08:00:00",
 *   note: "took 5000 IU vitamin D"
 * };
 * ```
 */
export interface ParsedMeasurement {
  /** Name of the variable (treatment, symptom, food, etc.) — maps to GlobalVariable.name */
  variableName: string;

  /** Numeric value of the measurement */
  value: number;

  /** Unit abbreviation — maps to Unit.abbreviatedName (e.g. "mg", "IU", "1-5") */
  unitAbbreviation: UnitAbbreviation;

  /** Variable category — maps to VariableCategory.name */
  categoryName: VariableCategoryName;

  /** How to aggregate: "SUM" for additive quantities, "MEAN" for ratings/states */
  combinationOperation: CombinationOperation;

  /**
   * When the measurement was taken, in local ISO 8601 format.
   * Format: "YYYY-MM-DDThh:mm:ss"
   *
   * If no time is specified by the user, defaults to the current time.
   * Standard meal times: breakfast ~08:00, lunch ~12:00, dinner ~18:00.
   */
  startAt: string;

  /**
   * End of the measurement period (optional), in local ISO 8601 format.
   * Used for duration-based measurements (e.g. "slept 8 hours").
   */
  endAt?: string | null;

  /** The original text fragment that produced this measurement */
  note: string;
}

// ---------------------------------------------------------------------------
// LLM response shape (what we ask the LLM to return)
// ---------------------------------------------------------------------------

/**
 * Shape of a single measurement item in the LLM's JSON response.
 * Mirrors ParsedMeasurement but includes an itemType discriminator
 * so the LLM can flag unparseable text.
 */
export interface LLMMeasurementItem {
  itemType: 'measurement';
  variableName: string;
  value: number;
  unitAbbreviation: string;
  categoryName: string;
  combinationOperation: 'SUM' | 'MEAN';
  startAt: string;
  endAt?: string | null;
  note: string;
}

/**
 * Text the LLM couldn't parse into a measurement.
 */
export interface LLMUnknownItem {
  itemType: 'unknown';
  text: string;
}

/**
 * The complete JSON response shape we expect from the LLM.
 */
export interface LLMParseResponse {
  measurements: (LLMMeasurementItem | LLMUnknownItem)[];
}

// ---------------------------------------------------------------------------
// Default category → unit/operation mapping for quick lookup
// ---------------------------------------------------------------------------

/**
 * Default unit and combination operation for each variable category.
 * Used by the regex parser and as fallback when the LLM doesn't specify.
 */
export const CATEGORY_DEFAULTS: Record<
  VariableCategoryName,
  { unit: UnitAbbreviation; combinationOperation: CombinationOperation }
> = {
  Treatment:    { unit: 'mg',       combinationOperation: 'SUM' },
  Supplement:   { unit: 'mg',       combinationOperation: 'SUM' },
  Food:         { unit: 'servings', combinationOperation: 'SUM' },
  Drink:        { unit: 'servings', combinationOperation: 'SUM' },
  Activity:     { unit: 'min',      combinationOperation: 'SUM' },
  Exercise:     { unit: 'min',      combinationOperation: 'SUM' },
  Sleep:        { unit: 'h',        combinationOperation: 'SUM' },
  Symptom:      { unit: '1-5',      combinationOperation: 'MEAN' },
  Emotion:      { unit: '1-5',      combinationOperation: 'MEAN' },
  'Vital Sign': { unit: 'count',    combinationOperation: 'MEAN' },
  'Lab Result': { unit: 'count',    combinationOperation: 'MEAN' },
  Environment:  { unit: 'count',    combinationOperation: 'MEAN' },
  Economic:     { unit: 'USD',      combinationOperation: 'SUM' },
  Policy:       { unit: 'count',    combinationOperation: 'MEAN' },
  Goal:         { unit: '%',        combinationOperation: 'MEAN' },
};
