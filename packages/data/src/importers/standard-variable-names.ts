/**
 * Standard Variable Names — Canonical Mapping for Cross-Importer Consistency
 *
 * Every importer (Apple Health, Fitbit, Oura, Google Fit, Withings, Cronometer,
 * Strava, MyFitnessPal, etc.) MUST map its native variable names to these
 * canonical names. This ensures that "Heart Rate" from Apple Health and
 * "Heart Rate" from Fitbit produce the same GlobalVariable in the database.
 *
 * ## Adding a new variable
 * 1. Add the canonical definition to STANDARD_VARIABLES below
 * 2. Add native→canonical mappings to IMPORTER_VARIABLE_MAPS for each relevant importer
 * 3. Update the relevant importer to use `resolveVariableName()` if it doesn't already
 *
 * ## Naming conventions
 * - Use Title Case ("Heart Rate", not "heart rate" or "HEART_RATE")
 * - Use the most widely understood name ("Steps" not "Step Count" or "Daily Steps")
 * - Prefer singular nouns where natural ("Weight" not "Weights")
 * - Include organ/type for ambiguous measurements ("Blood Pressure Systolic")
 *
 * ## Planned: @optomitron/db/types unification
 * Currently there are two parallel measurement types:
 * - `ParsedHealthRecord` (packages/data/src/importers) — output of file/API importers
 * - `ParsedMeasurement` (packages/chat-ui/src/nlp) — output of NLP text parsing
 *
 * These have overlapping but slightly different shapes:
 *
 * | Field              | ParsedHealthRecord | ParsedMeasurement | Notes                        |
 * |--------------------|--------------------|--------------------|------------------------------|
 * | variableName       | ✅                  | ✅                  | Same semantics               |
 * | value              | ✅                  | ✅                  | Same semantics               |
 * | unitName           | ✅ (full name)      | ❌                  | PHR has full name            |
 * | unitAbbreviation   | ✅                  | ✅                  | Same semantics               |
 * | categoryName       | ❌ (variableCategoryName) | ✅ (categoryName) | Different field name!        |
 * | combinationOperation | ❌                | ✅                  | Only in ParsedMeasurement    |
 * | startAt            | ✅                  | ✅                  | Same semantics               |
 * | endAt              | ✅                  | ✅ (optional)       | Always present in PHR        |
 * | sourceName         | ✅                  | ❌                  | Only in ParsedHealthRecord   |
 * | note               | ✅ (optional)       | ✅                  | Always present in PM         |
 *
 * **Plan:** Create a unified `@optomitron/db/types` package that exports a single
 * `ParsedMeasurement` type both importers and NLP can target. Migration steps:
 * 1. Define the unified type in packages/db/src/types.ts
 * 2. Both importers and NLP output the unified type
 * 3. Deprecate the separate ParsedHealthRecord and ParsedMeasurement types
 * 4. Single ingestion pipeline in the database layer
 */

// ---------------------------------------------------------------------------
// Canonical variable definition
// ---------------------------------------------------------------------------

export interface StandardVariableDefinition {
  /** Canonical name used in GlobalVariable.name. Title Case. */
  name: string;
  /** Default variable category. Maps to VariableCategory.name */
  category: string;
  /** Default unit full name. Maps to Unit.name */
  unitName: string;
  /** Default unit abbreviation. Maps to Unit.abbreviatedName */
  unitAbbreviation: string;
  /** How to aggregate: "SUM" for additive, "MEAN" for state */
  combinationOperation: 'SUM' | 'MEAN';
}

// ---------------------------------------------------------------------------
// The canonical list
// ---------------------------------------------------------------------------

/**
 * Master list of standard variable names across all importers.
 * Keyed by the canonical name for fast lookup.
 */
export const STANDARD_VARIABLES: Record<string, StandardVariableDefinition> = {
  // ── Vital Signs ────────────────────────────────────────────────────────
  'Heart Rate':                    { name: 'Heart Rate',                    category: 'Vital Sign',       unitName: 'Beats per Minute',      unitAbbreviation: 'bpm',  combinationOperation: 'MEAN' },
  'Resting Heart Rate':            { name: 'Resting Heart Rate',            category: 'Vital Sign',       unitName: 'Beats per Minute',      unitAbbreviation: 'bpm',  combinationOperation: 'MEAN' },
  'Heart Rate Variability':        { name: 'Heart Rate Variability',        category: 'Vital Sign',       unitName: 'Milliseconds',          unitAbbreviation: 'ms',   combinationOperation: 'MEAN' },
  'Blood Pressure Systolic':       { name: 'Blood Pressure Systolic',       category: 'Vital Sign',       unitName: 'Millimetres of Mercury',unitAbbreviation: 'mmHg', combinationOperation: 'MEAN' },
  'Blood Pressure Diastolic':      { name: 'Blood Pressure Diastolic',      category: 'Vital Sign',       unitName: 'Millimetres of Mercury',unitAbbreviation: 'mmHg', combinationOperation: 'MEAN' },
  'Blood Oxygen':                  { name: 'Blood Oxygen',                  category: 'Vital Sign',       unitName: 'Percent',               unitAbbreviation: '%',    combinationOperation: 'MEAN' },
  'Body Temperature':              { name: 'Body Temperature',              category: 'Vital Sign',       unitName: 'Degrees Fahrenheit',    unitAbbreviation: '°F',   combinationOperation: 'MEAN' },
  'Respiratory Rate':              { name: 'Respiratory Rate',              category: 'Vital Sign',       unitName: 'Breaths per Minute',    unitAbbreviation: 'breaths/min', combinationOperation: 'MEAN' },
  'Blood Glucose':                 { name: 'Blood Glucose',                 category: 'Vital Sign',       unitName: 'mg/dL',                 unitAbbreviation: 'mg/dL', combinationOperation: 'MEAN' },

  // ── Body Measurements ──────────────────────────────────────────────────
  'Weight':                        { name: 'Weight',                        category: 'Vital Sign',       unitName: 'Kilograms',             unitAbbreviation: 'kg',   combinationOperation: 'MEAN' },
  'Height':                        { name: 'Height',                        category: 'Vital Sign',       unitName: 'Centimetres',           unitAbbreviation: 'cm',   combinationOperation: 'MEAN' },
  'Body Mass Index':               { name: 'Body Mass Index',               category: 'Vital Sign',       unitName: 'Count',                 unitAbbreviation: 'kg/m²', combinationOperation: 'MEAN' },
  'Body Fat Percentage':           { name: 'Body Fat Percentage',           category: 'Vital Sign',       unitName: 'Percent',               unitAbbreviation: '%',    combinationOperation: 'MEAN' },
  'Lean Body Mass':                { name: 'Lean Body Mass',                category: 'Vital Sign',       unitName: 'Kilograms',             unitAbbreviation: 'kg',   combinationOperation: 'MEAN' },
  'Waist Circumference':           { name: 'Waist Circumference',           category: 'Vital Sign',       unitName: 'Centimetres',           unitAbbreviation: 'cm',   combinationOperation: 'MEAN' },

  // ── Physical Activity ──────────────────────────────────────────────────
  'Steps':                         { name: 'Steps',                         category: 'Physical Activity', unitName: 'Count',                 unitAbbreviation: 'count', combinationOperation: 'SUM' },
  'Active Energy':                 { name: 'Active Energy',                 category: 'Physical Activity', unitName: 'Kilocalories',          unitAbbreviation: 'kcal', combinationOperation: 'SUM' },
  'Basal Energy':                  { name: 'Basal Energy',                  category: 'Physical Activity', unitName: 'Kilocalories',          unitAbbreviation: 'kcal', combinationOperation: 'SUM' },
  'Walking Distance':              { name: 'Walking Distance',              category: 'Physical Activity', unitName: 'Kilometres',            unitAbbreviation: 'km',   combinationOperation: 'SUM' },
  'Cycling Distance':              { name: 'Cycling Distance',              category: 'Physical Activity', unitName: 'Kilometres',            unitAbbreviation: 'km',   combinationOperation: 'SUM' },
  'Swimming Distance':             { name: 'Swimming Distance',             category: 'Physical Activity', unitName: 'Metres',                unitAbbreviation: 'm',    combinationOperation: 'SUM' },
  'Exercise Time':                 { name: 'Exercise Time',                 category: 'Physical Activity', unitName: 'Minutes',               unitAbbreviation: 'min',  combinationOperation: 'SUM' },
  'Active Minutes':                { name: 'Active Minutes',                category: 'Physical Activity', unitName: 'Minutes',               unitAbbreviation: 'min',  combinationOperation: 'SUM' },
  'Flights Climbed':               { name: 'Flights Climbed',               category: 'Physical Activity', unitName: 'Count',                 unitAbbreviation: 'count', combinationOperation: 'SUM' },
  'VO2 Max':                       { name: 'VO2 Max',                       category: 'Physical Activity', unitName: 'mL/kg·min',             unitAbbreviation: 'mL/kg·min', combinationOperation: 'MEAN' },

  // ── Sleep ──────────────────────────────────────────────────────────────
  'Sleep Duration':                { name: 'Sleep Duration',                category: 'Sleep',            unitName: 'Hours',                 unitAbbreviation: 'h',    combinationOperation: 'SUM' },

  // ── Nutrition ──────────────────────────────────────────────────────────
  'Calories':                      { name: 'Calories',                      category: 'Food',             unitName: 'Kilocalories',          unitAbbreviation: 'kcal', combinationOperation: 'SUM' },
  'Water':                         { name: 'Water',                         category: 'Food',             unitName: 'Millilitres',           unitAbbreviation: 'mL',   combinationOperation: 'SUM' },
  'Protein':                       { name: 'Protein',                       category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Total Fat':                     { name: 'Total Fat',                     category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Carbohydrates':                 { name: 'Carbohydrates',                 category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Fiber':                         { name: 'Fiber',                         category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Sugar':                         { name: 'Sugar',                         category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Sodium':                        { name: 'Sodium',                        category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Cholesterol':                   { name: 'Cholesterol',                   category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Caffeine':                      { name: 'Caffeine',                      category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Saturated Fat':                 { name: 'Saturated Fat',                 category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Monounsaturated Fat':           { name: 'Monounsaturated Fat',           category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Polyunsaturated Fat':           { name: 'Polyunsaturated Fat',           category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Trans Fat':                     { name: 'Trans Fat',                     category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Potassium':                     { name: 'Potassium',                     category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Iron':                          { name: 'Iron',                          category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Calcium':                       { name: 'Calcium',                       category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin A':                     { name: 'Vitamin A',                     category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Vitamin C':                     { name: 'Vitamin C',                     category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin D':                     { name: 'Vitamin D',                     category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Vitamin E':                     { name: 'Vitamin E',                     category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin K':                     { name: 'Vitamin K',                     category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Vitamin B1 (Thiamine)':         { name: 'Vitamin B1 (Thiamine)',         category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin B2 (Riboflavin)':       { name: 'Vitamin B2 (Riboflavin)',       category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin B3 (Niacin)':           { name: 'Vitamin B3 (Niacin)',           category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin B5 (Pantothenic Acid)': { name: 'Vitamin B5 (Pantothenic Acid)', category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin B6':                    { name: 'Vitamin B6',                    category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Vitamin B12':                   { name: 'Vitamin B12',                   category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Folate':                        { name: 'Folate',                        category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Magnesium':                     { name: 'Magnesium',                     category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Zinc':                          { name: 'Zinc',                          category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Phosphorus':                    { name: 'Phosphorus',                    category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Manganese':                     { name: 'Manganese',                     category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Copper':                        { name: 'Copper',                        category: 'Food',             unitName: 'Milligrams',            unitAbbreviation: 'mg',   combinationOperation: 'SUM' },
  'Selenium':                      { name: 'Selenium',                      category: 'Food',             unitName: 'Micrograms',            unitAbbreviation: 'µg',   combinationOperation: 'SUM' },
  'Omega-3':                       { name: 'Omega-3',                       category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Omega-6':                       { name: 'Omega-6',                       category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Alcohol':                       { name: 'Alcohol',                       category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },
  'Net Carbohydrates':             { name: 'Net Carbohydrates',             category: 'Food',             unitName: 'Grams',                 unitAbbreviation: 'g',    combinationOperation: 'SUM' },

  // ── Mindfulness ────────────────────────────────────────────────────────
  'Meditation':                    { name: 'Meditation',                    category: 'Activity',         unitName: 'Minutes',               unitAbbreviation: 'min',  combinationOperation: 'SUM' },

  // ── Environment ────────────────────────────────────────────────────────
  'Environmental Sound Level':     { name: 'Environmental Sound Level',     category: 'Environment',      unitName: 'Decibels',              unitAbbreviation: 'dBASPL', combinationOperation: 'MEAN' },

  // ── Strava-specific ────────────────────────────────────────────────────
  'Running Distance':              { name: 'Running Distance',              category: 'Physical Activity', unitName: 'Kilometres',            unitAbbreviation: 'km',   combinationOperation: 'SUM' },
  'Calories Burned':               { name: 'Calories Burned',              category: 'Physical Activity', unitName: 'Kilocalories',          unitAbbreviation: 'kcal', combinationOperation: 'SUM' },
  'Speed':                         { name: 'Speed',                         category: 'Physical Activity', unitName: 'Metres per Second',     unitAbbreviation: 'm/s',  combinationOperation: 'MEAN' },
};

// ---------------------------------------------------------------------------
// Native name → canonical name mappings per importer
// ---------------------------------------------------------------------------

/**
 * Maps each importer's native variable names to our canonical names.
 * Only include names that DIFFER from canonical — identical names are resolved automatically.
 */
export const IMPORTER_VARIABLE_MAPS: Record<string, Record<string, string>> = {
  apple_health: {
    // Apple Health mostly uses our canonical names already via APPLE_HEALTH_TYPE_MAP
    // These are for edge cases or future additions
    'Walking Heart Rate Average': 'Heart Rate',  // Could be kept as-is if we want granularity
  },

  fitbit: {
    // Fitbit API field names → canonical
    'Daily Step Count': 'Steps',        // Fitbit uses "Daily Step Count" in some exports
    'Calories Burned':  'Active Energy', // Fitbit "calories burned" maps to our "Active Energy"
  },

  google_fit: {
    // Google Fit uses slightly different names
    'Daily Step Count': 'Steps',
    'Calories Burned':  'Active Energy',
  },

  oura: {
    // Oura Ring API names → canonical
    'Daily Step Count': 'Steps',
    'Calories Burned':  'Active Energy',
  },

  withings: {
    // Withings Health Mate names → canonical
    'Daily Step Count': 'Steps',
  },

  myfitnesspal: {
    // MFP names → canonical
    'Fat': 'Total Fat',  // MFP says "Fat", we say "Total Fat" for clarity
  },

  cronometer: {
    // Cronometer exports → canonical
    'Fat': 'Total Fat',
  },

  strava: {
    // Strava API names → canonical
  },
};

// ---------------------------------------------------------------------------
// Resolution helper
// ---------------------------------------------------------------------------

/**
 * Resolve a native variable name from a specific importer to the canonical name.
 *
 * 1. If the importer has an explicit mapping, use it
 * 2. If the name exists in STANDARD_VARIABLES, return it as-is
 * 3. Otherwise return the original name (unknown variable — will need manual mapping later)
 *
 * @param nativeName - The variable name as it appears in the source data
 * @param importerKey - Which importer produced this name (e.g. "apple_health", "fitbit")
 * @returns The canonical variable name
 */
export function resolveVariableName(
  nativeName: string,
  importerKey: string,
): string {
  // Check importer-specific mapping first
  const importerMap = IMPORTER_VARIABLE_MAPS[importerKey];
  if (importerMap?.[nativeName]) {
    return importerMap[nativeName];
  }

  // If the name is already canonical, return it
  if (STANDARD_VARIABLES[nativeName]) {
    return nativeName;
  }

  // Return as-is — the caller should handle unknown variables
  return nativeName;
}

/**
 * Get the standard definition for a variable name.
 * Returns undefined if the name is not in the canonical list.
 */
export function getStandardDefinition(
  canonicalName: string,
): StandardVariableDefinition | undefined {
  return STANDARD_VARIABLES[canonicalName];
}

/**
 * Mapping from importer category names to canonical category names.
 * Importers use plural/variant forms; canonical uses singular forms
 * matching STANDARD_VARIABLES and the VariableCategory seed data.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  // Plural → singular
  'Vital Signs': 'Vital Sign',
  'Foods': 'Food',
  'Nutrients': 'Nutrient',
  'Treatments': 'Treatment',
  // Variant names
  'Physique': 'Physical Measurement',
  'Body Measurements': 'Physical Measurement',
  'Exercise': 'Physical Activity',
  'Workout': 'Physical Activity',
  'Workouts': 'Physical Activity',
  'Activities': 'Activity',
  'Symptoms': 'Symptom',
  'Emotions': 'Emotion',
  'Moods': 'Mood',
  'Environments': 'Environment',
  'Physical Measurements': 'Physical Measurement',
  'Sleeps': 'Sleep',
};

/**
 * Resolve an importer category name to its canonical form.
 * If no alias is found, returns the input unchanged.
 *
 * @example
 * resolveCategory('Vital Signs') // → 'Vital Sign'
 * resolveCategory('Foods')       // → 'Food'
 * resolveCategory('Sleep')       // → 'Sleep' (already canonical)
 */
export function resolveCategory(importerCategory: string): string {
  // Fast path: exact match
  if (CATEGORY_ALIASES[importerCategory]) {
    return CATEGORY_ALIASES[importerCategory];
  }
  // Case-insensitive fallback
  const lower = importerCategory.toLowerCase();
  for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
    if (alias.toLowerCase() === lower) {
      return canonical;
    }
  }
  return importerCategory;
}

/**
 * Resolve a native variable name AND normalize its category.
 *
 * Returns an object with both the canonical variable name and the normalized category.
 * If the variable is known in STANDARD_VARIABLES, the category comes from there.
 * If a rawCategory is provided and the variable is unknown, the category is normalized via resolveCategory().
 */
export function resolveVariableWithCategory(
  nativeName: string,
  importerKey: string,
  rawCategory?: string,
): { variableName: string; category: string | undefined } {
  const variableName = resolveVariableName(nativeName, importerKey);
  const def = STANDARD_VARIABLES[variableName];
  if (def) {
    return { variableName, category: def.category };
  }
  return { variableName, category: rawCategory ? resolveCategory(rawCategory) : undefined };
}
