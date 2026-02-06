// ============================================================================
// Regex Parser — Fallback NLP parser (no LLM required)
// ============================================================================
//
// Parses common health tracking patterns from natural language text using
// regular expressions. Returns ParsedMeasurement[] for anything it can
// confidently parse, empty array for text it can't handle.
//
// Patterns supported:
//   - "took X mg/IU/mcg/g of Y" (treatments/supplements)
//   - "X mg/IU/mcg/g of Y" or "X mg/IU/mcg/g Y" (treatments/supplements)
//   - "mood/energy/pain X/5" or "mood X out of 5" (ratings)
//   - "had [food] for breakfast/lunch/dinner" (common foods)
//   - "headache severity 3" or "anxiety 4/10" (symptom ratings)
//   - "slept X hours" (sleep)
//   - "walked X steps" or "ran X miles" (exercise)
//   - "weight X lbs" or "weigh X kg" (vital signs)
// ============================================================================

import {
  type ParsedMeasurement,
  type VariableCategoryName,
  type UnitAbbreviation,
  type CombinationOperation,
  CATEGORY_DEFAULTS,
} from './measurement-schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowLocalISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function todayDateStr(): string {
  return nowLocalISO().slice(0, 10);
}

function makeMeasurement(
  variableName: string,
  value: number,
  unitAbbreviation: UnitAbbreviation,
  categoryName: VariableCategoryName,
  combinationOperation: CombinationOperation,
  note: string,
  startAt?: string,
): ParsedMeasurement {
  return {
    variableName,
    value,
    unitAbbreviation,
    categoryName,
    combinationOperation,
    startAt: startAt ?? nowLocalISO(),
    note,
  };
}

// ---------------------------------------------------------------------------
// Unit string → UnitAbbreviation normalization
// ---------------------------------------------------------------------------

const UNIT_ALIASES: Record<string, UnitAbbreviation> = {
  'mg': 'mg',
  'milligram': 'mg',
  'milligrams': 'mg',
  'g': 'g',
  'gram': 'g',
  'grams': 'g',
  'kg': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'oz': 'oz',
  'ounce': 'oz',
  'ounces': 'oz',
  'lb': 'lb',
  'lbs': 'lb',
  'pound': 'lb',
  'pounds': 'lb',
  'mcg': 'mcg',
  'microgram': 'mcg',
  'micrograms': 'mcg',
  'ug': 'mcg',
  'µg': 'mcg',
  'ml': 'mL',
  'milliliter': 'mL',
  'milliliters': 'mL',
  'l': 'L',
  'liter': 'L',
  'liters': 'L',
  'iu': 'IU',
  'tablet': 'tablets',
  'tablets': 'tablets',
  'tab': 'tablets',
  'tabs': 'tablets',
  'capsule': 'capsules',
  'capsules': 'capsules',
  'cap': 'capsules',
  'caps': 'capsules',
  'dose': 'doses',
  'doses': 'doses',
  'serving': 'servings',
  'servings': 'servings',
  'cup': 'cups',
  'cups': 'cups',
  'calorie': 'kcal',
  'calories': 'kcal',
  'kcal': 'kcal',
  'cal': 'kcal',
  'step': 'steps',
  'steps': 'steps',
  'hour': 'h',
  'hours': 'h',
  'hr': 'h',
  'hrs': 'h',
  'h': 'h',
  'minute': 'min',
  'minutes': 'min',
  'min': 'min',
  'mins': 'min',
  'second': 's',
  'seconds': 's',
  'sec': 's',
  'bpm': 'bpm',
  'mmhg': 'mmHg',
  'percent': '%',
  '%': '%',
  'fl oz': 'fl oz',
};

function normalizeUnit(raw: string): UnitAbbreviation | null {
  const key = raw.trim().toLowerCase();
  return UNIT_ALIASES[key] ?? null;
}

// ---------------------------------------------------------------------------
// Meal time inference
// ---------------------------------------------------------------------------

const MEAL_TIMES: Record<string, string> = {
  'breakfast': '08:00:00',
  'lunch': '12:00:00',
  'dinner': '18:00:00',
  'supper': '18:00:00',
  'snack': '15:00:00',
  'brunch': '10:30:00',
};

function mealTimeStartAt(meal: string): string {
  const time = MEAL_TIMES[meal.toLowerCase()];
  return time ? `${todayDateStr()}T${time}` : nowLocalISO();
}

// ---------------------------------------------------------------------------
// Common food names
// ---------------------------------------------------------------------------

const COMMON_FOODS: Record<string, { name: string; category: VariableCategoryName }> = {
  'coffee': { name: 'Coffee', category: 'Drink' },
  'tea': { name: 'Tea', category: 'Drink' },
  'green tea': { name: 'Green Tea', category: 'Drink' },
  'water': { name: 'Water Intake', category: 'Drink' },
  'juice': { name: 'Juice', category: 'Drink' },
  'orange juice': { name: 'Orange Juice', category: 'Drink' },
  'milk': { name: 'Milk', category: 'Drink' },
  'beer': { name: 'Alcohol', category: 'Drink' },
  'wine': { name: 'Alcohol', category: 'Drink' },
  'soda': { name: 'Soda', category: 'Drink' },
  'smoothie': { name: 'Smoothie', category: 'Drink' },
  'eggs': { name: 'Eggs', category: 'Food' },
  'egg': { name: 'Eggs', category: 'Food' },
  'oatmeal': { name: 'Oatmeal', category: 'Food' },
  'toast': { name: 'Toast', category: 'Food' },
  'bread': { name: 'Bread', category: 'Food' },
  'rice': { name: 'Rice', category: 'Food' },
  'pasta': { name: 'Pasta', category: 'Food' },
  'chicken': { name: 'Chicken', category: 'Food' },
  'beef': { name: 'Beef', category: 'Food' },
  'fish': { name: 'Fish', category: 'Food' },
  'salmon': { name: 'Salmon', category: 'Food' },
  'salad': { name: 'Salad', category: 'Food' },
  'banana': { name: 'Banana', category: 'Food' },
  'apple': { name: 'Apple', category: 'Food' },
  'yogurt': { name: 'Yogurt', category: 'Food' },
  'cereal': { name: 'Cereal', category: 'Food' },
  'sandwich': { name: 'Sandwich', category: 'Food' },
  'burger': { name: 'Burger', category: 'Food' },
  'pizza': { name: 'Pizza', category: 'Food' },
  'soup': { name: 'Soup', category: 'Food' },
  'steak': { name: 'Steak', category: 'Food' },
  'avocado': { name: 'Avocado', category: 'Food' },
  'nuts': { name: 'Nuts', category: 'Food' },
  'almonds': { name: 'Almonds', category: 'Food' },
  'fruit': { name: 'Fruit', category: 'Food' },
  'vegetables': { name: 'Vegetable Intake', category: 'Food' },
  'veggies': { name: 'Vegetable Intake', category: 'Food' },
  'chocolate': { name: 'Chocolate', category: 'Food' },
  'cheese': { name: 'Cheese', category: 'Food' },
  'protein shake': { name: 'Protein Shake', category: 'Drink' },
};

// ---------------------------------------------------------------------------
// Rating-type variables (symptom/emotion names → variable names)
// ---------------------------------------------------------------------------

const RATING_VARIABLES: Record<string, { name: string; category: VariableCategoryName }> = {
  'mood': { name: 'Overall Mood', category: 'Emotion' },
  'overall mood': { name: 'Overall Mood', category: 'Emotion' },
  'energy': { name: 'Energy Level', category: 'Emotion' },
  'energy level': { name: 'Energy Level', category: 'Emotion' },
  'motivation': { name: 'Motivation', category: 'Emotion' },
  'happiness': { name: 'Happiness', category: 'Emotion' },
  'stress': { name: 'Stress Level', category: 'Emotion' },
  'stress level': { name: 'Stress Level', category: 'Emotion' },
  'anxiety': { name: 'Anxiety', category: 'Symptom' },
  'depression': { name: 'Depression Severity', category: 'Symptom' },
  'headache': { name: 'Headache Severity', category: 'Symptom' },
  'pain': { name: 'Pain', category: 'Symptom' },
  'nausea': { name: 'Nausea', category: 'Symptom' },
  'fatigue': { name: 'Fatigue', category: 'Symptom' },
  'insomnia': { name: 'Insomnia Severity', category: 'Symptom' },
  'brain fog': { name: 'Brain Fog', category: 'Symptom' },
  'focus': { name: 'Focus', category: 'Symptom' },
  'concentration': { name: 'Focus', category: 'Symptom' },
  'sleep quality': { name: 'Sleep Quality', category: 'Sleep' },
};

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse natural language text into structured measurements using regex patterns.
 *
 * This is the **fallback parser** that works without any LLM API key.
 * It handles common patterns but is not as flexible as LLM-based parsing.
 *
 * @param text - User input text (e.g. "took 5000 IU vitamin D")
 * @returns Array of parsed measurements, or empty array if nothing recognized
 *
 * @example
 * ```ts
 * parseWithRegex("took 5000 IU vitamin D");
 * // → [{ variableName: "Vitamin D", value: 5000, unitAbbreviation: "IU", ... }]
 *
 * parseWithRegex("mood 4/5, headache severity 3");
 * // → [{ variableName: "Overall Mood", value: 4, ... }, { variableName: "Headache Severity", value: 3, ... }]
 * ```
 */
export function parseWithRegex(text: string): ParsedMeasurement[] {
  const results: ParsedMeasurement[] = [];
  const normalizedText = text.trim();

  if (!normalizedText) return results;

  // Split on common separators (and, comma, period-then-space, semicolon)
  // but be careful not to split inside "4.5 mg" etc.
  const segments = normalizedText
    .split(/(?:,\s*|\s+and\s+|;\s*|\.\s+(?=[A-Z]))/i)
    .map(s => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const parsed = parseSegment(segment);
    results.push(...parsed);
  }

  return results;
}

function parseSegment(text: string): ParsedMeasurement[] {
  const results: ParsedMeasurement[] = [];

  // --- Pattern 1: "took X <unit> (of) Y" ---
  const tookPattern = /\btook\s+(\d+(?:\.\d+)?)\s*(mg|g|kg|mcg|ug|µg|iu|ml|tablets?|tabs?|capsules?|caps?|doses?|pills?)\s+(?:of\s+)?(.+)/i;
  const tookMatch = text.match(tookPattern);
  if (tookMatch) {
    const value = parseFloat(tookMatch[1]!);
    const unit = normalizeUnit(tookMatch[2]!);
    const name = cleanVariableName(tookMatch[3]!);
    if (unit && name) {
      results.push(makeMeasurement(
        name, value, unit,
        guessCategory(name, unit),
        'SUM',
        text,
      ));
      return results;
    }
  }

  // --- Pattern 2: "X <unit> (of) Y" (without "took") ---
  const dosePattern = /^(\d+(?:\.\d+)?)\s*(mg|g|kg|mcg|ug|µg|iu|ml|tablets?|tabs?|capsules?|caps?|doses?|pills?)\s+(?:of\s+)?(.+)/i;
  const doseMatch = text.match(dosePattern);
  if (doseMatch) {
    const value = parseFloat(doseMatch[1]!);
    const unit = normalizeUnit(doseMatch[2]!);
    const name = cleanVariableName(doseMatch[3]!);
    if (unit && name) {
      results.push(makeMeasurement(
        name, value, unit,
        guessCategory(name, unit),
        'SUM',
        text,
      ));
      return results;
    }
  }

  // --- Pattern 3: "weight X lbs/kg" (must come before name-first dose pattern) ---
  const weightPatternEarly = /\b(?:weight|weigh|weighed)\s+(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?|kilograms?)\b/i;
  const weightMatchEarly = text.match(weightPatternEarly);
  if (weightMatchEarly) {
    const value = parseFloat(weightMatchEarly[1]!);
    const unit = normalizeUnit(weightMatchEarly[2]!) ?? 'lb';
    results.push(makeMeasurement(
      'Body Weight', value, unit,
      'Vital Sign', 'MEAN', text,
    ));
    return results;
  }

  // --- Pattern 3b: "Y X <unit>" (e.g. "vitamin D 5000 IU") ---
  const nameFirstPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(mg|g|kg|mcg|ug|µg|iu|ml|tablets?|tabs?|capsules?|caps?|doses?|pills?)$/i;
  const nameFirstMatch = text.match(nameFirstPattern);
  if (nameFirstMatch) {
    const name = cleanVariableName(nameFirstMatch[1]!);
    const value = parseFloat(nameFirstMatch[2]!);
    const unit = normalizeUnit(nameFirstMatch[3]!);
    if (unit && name && !RATING_VARIABLES[name.toLowerCase()]) {
      results.push(makeMeasurement(
        name, value, unit,
        guessCategory(name, unit),
        'SUM',
        text,
      ));
      return results;
    }
  }

  // --- Pattern 4: Rating "X/N" or "X out of N" ---
  // e.g. "mood 4/5", "headache severity 3/10", "energy 3 out of 5"
  const ratingPattern = /^(.+?)\s+(?:severity\s+)?(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+)|out\s+of\s+(\d+))/i;
  const ratingMatch = text.match(ratingPattern);
  if (ratingMatch) {
    const rawName = ratingMatch[1]!.trim().toLowerCase();
    const value = parseFloat(ratingMatch[2]!);
    const maxVal = parseInt(ratingMatch[3]! ?? ratingMatch[4], 10);
    const ratingVar = RATING_VARIABLES[rawName];
    const unitAbbr: UnitAbbreviation = maxVal <= 5 ? '1-5' : '1-10';

    if (ratingVar) {
      results.push(makeMeasurement(
        ratingVar.name, value, unitAbbr,
        ratingVar.category, 'MEAN', text,
      ));
    } else {
      // Unknown rating variable — capitalize and guess
      results.push(makeMeasurement(
        capitalizeWords(rawName), value, unitAbbr,
        'Symptom', 'MEAN', text,
      ));
    }
    return results;
  }

  // --- Pattern 5: Rating without denominator: "headache severity 3" ---
  const severityPattern = /^(.+?)\s+severity\s+(\d+(?:\.\d+)?)\s*$/i;
  const severityMatch = text.match(severityPattern);
  if (severityMatch) {
    const rawName = severityMatch[1]!.trim().toLowerCase();
    const value = parseFloat(severityMatch[2]!);
    const ratingVar = RATING_VARIABLES[rawName];
    const unitAbbr: UnitAbbreviation = value > 5 ? '1-10' : '1-5';

    if (ratingVar) {
      results.push(makeMeasurement(
        ratingVar.name, value, unitAbbr,
        ratingVar.category, 'MEAN', text,
      ));
    } else {
      results.push(makeMeasurement(
        capitalizeWords(rawName) + ' Severity', value, unitAbbr,
        'Symptom', 'MEAN', text,
      ));
    }
    return results;
  }

  // --- Pattern 6: Simple rating "mood 4", "energy 3" (no denominator) ---
  const simpleRatingPattern = /^(mood|energy|motivation|happiness|stress|anxiety|depression|pain|nausea|fatigue|headache|insomnia|brain fog|focus|concentration|sleep quality)\s+(\d+(?:\.\d+)?)\s*$/i;
  const simpleRatingMatch = text.match(simpleRatingPattern);
  if (simpleRatingMatch) {
    const rawName = simpleRatingMatch[1]!.trim().toLowerCase();
    const value = parseFloat(simpleRatingMatch[2]!);
    const ratingVar = RATING_VARIABLES[rawName];
    const unitAbbr: UnitAbbreviation = value > 5 ? '1-10' : '1-5';

    if (ratingVar) {
      results.push(makeMeasurement(
        ratingVar.name, value, unitAbbr,
        ratingVar.category, 'MEAN', text,
      ));
    }
    return results;
  }

  // --- Pattern 7: "had [food] for [meal]" or "ate [food]" or just "[food] for [meal]" ---
  const mealPattern = /^(?:had|ate|eaten|eat|drinking|drank|had a|ate a|had an|ate an)\s+(.+?)(?:\s+for\s+(breakfast|lunch|dinner|supper|snack|brunch))?\s*$/i;
  const mealMatch = text.match(mealPattern);
  if (mealMatch) {
    const foodText = mealMatch[1]!.trim().toLowerCase();
    const meal = mealMatch[2]?.toLowerCase();
    const startAt = meal ? mealTimeStartAt(meal) : undefined;

    const foodInfo = COMMON_FOODS[foodText];
    if (foodInfo) {
      const defaults = CATEGORY_DEFAULTS[foodInfo.category];
      results.push(makeMeasurement(
        foodInfo.name, 1, defaults.unit,
        foodInfo.category, 'SUM', text, startAt,
      ));
    } else {
      // Unknown food — log as generic food
      results.push(makeMeasurement(
        capitalizeWords(foodText), 1, 'servings',
        'Food', 'SUM', text, startAt,
      ));
    }
    return results;
  }

  // --- Pattern 8: "[food] for [meal]" without verb ---
  const foodForMealPattern = /^(.+?)\s+for\s+(breakfast|lunch|dinner|supper|snack|brunch)\s*$/i;
  const foodForMealMatch = text.match(foodForMealPattern);
  if (foodForMealMatch) {
    const foodText = foodForMealMatch[1]!.trim().toLowerCase();
    const meal = foodForMealMatch[2]!.toLowerCase();
    const startAt = mealTimeStartAt(meal);

    const foodInfo = COMMON_FOODS[foodText];
    if (foodInfo) {
      const defaults = CATEGORY_DEFAULTS[foodInfo.category];
      results.push(makeMeasurement(
        foodInfo.name, 1, defaults.unit,
        foodInfo.category, 'SUM', text, startAt,
      ));
    } else {
      results.push(makeMeasurement(
        capitalizeWords(foodText), 1, 'servings',
        'Food', 'SUM', text, startAt,
      ));
    }
    return results;
  }

  // --- Pattern 9: "slept X hours" ---
  const sleepPattern = /\bslept\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i;
  const sleepMatch = text.match(sleepPattern);
  if (sleepMatch) {
    const value = parseFloat(sleepMatch[1]!);
    results.push(makeMeasurement(
      'Sleep Duration', value, 'h',
      'Sleep', 'SUM', text,
    ));
    return results;
  }

  // --- Pattern 10: "walked X steps" or "ran X miles" ---
  const exercisePattern = /\b(?:walked|ran|jogged|hiked|biked|cycled)\s+(\d+(?:\.\d+)?)\s*(steps?|miles?|km|kilometers?|minutes?|min|hours?|hrs?|h)\b/i;
  const exerciseMatch = text.match(exercisePattern);
  if (exerciseMatch) {
    const value = parseFloat(exerciseMatch[1]!);
    const rawUnit = exerciseMatch[2]!.toLowerCase();
    const unit = normalizeUnit(rawUnit) ?? 'min';
    results.push(makeMeasurement(
      'Exercise Duration', value, unit,
      'Exercise', 'SUM', text,
    ));
    return results;
  }

  // (Pattern 11 — weight — moved to Pattern 3 above nameFirstPattern)

  // --- Pattern 12: Standalone common food/drink name ---
  const lowerText = text.toLowerCase().trim();
  const foodInfo = COMMON_FOODS[lowerText];
  if (foodInfo) {
    const defaults = CATEGORY_DEFAULTS[foodInfo.category];
    results.push(makeMeasurement(
      foodInfo.name, 1, defaults.unit,
      foodInfo.category, 'SUM', text,
    ));
    return results;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function cleanVariableName(raw: string): string {
  // Remove trailing punctuation and whitespace
  let name = raw.trim().replace(/[.,;!?]+$/, '').trim();
  // Capitalize each word
  return capitalizeWords(name);
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Guess the variable category based on the variable name and unit.
 * Simple heuristic — the LLM parser does this much better.
 */
function guessCategory(name: string, unit: UnitAbbreviation): VariableCategoryName {
  const lower = name.toLowerCase();

  // Check known supplements/vitamins
  const supplementKeywords = [
    'vitamin', 'omega', 'magnesium', 'zinc', 'iron', 'calcium',
    'probiotic', 'melatonin', 'creatine', 'collagen', 'biotin',
    'turmeric', 'ashwagandha', 'coq10', 'nmn', 'nad', 'resveratrol',
    'fish oil', 'folic acid', 'b12', 'b6', 'd3',
  ];
  if (supplementKeywords.some(kw => lower.includes(kw))) return 'Supplement';

  // Check known medications
  const treatmentKeywords = [
    'ibuprofen', 'aspirin', 'acetaminophen', 'tylenol', 'advil',
    'paracetamol', 'metformin', 'adderall', 'ritalin', 'prozac',
    'zoloft', 'lexapro', 'lisinopril', 'atorvastatin', 'metoprolol',
    'prednisone', 'amoxicillin', 'azithromycin', 'omeprazole',
  ];
  if (treatmentKeywords.some(kw => lower.includes(kw))) return 'Treatment';

  // Unit-based heuristics
  if (['mg', 'mcg', 'IU', 'tablets', 'capsules', 'doses'].includes(unit)) {
    return 'Treatment';
  }
  if (['servings', 'cups'].includes(unit)) return 'Food';
  if (['1-5', '1-10'].includes(unit)) return 'Symptom';

  return 'Treatment'; // Default for "took X of Y" patterns
}
