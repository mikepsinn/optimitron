// ============================================================================
// Prisma Seed Script — Optomitron
// ============================================================================
// Seeds: Units, VariableCategories, GlobalVariables, Jurisdictions, Items
// Run: npx prisma db seed (or: npx tsx prisma/seed.ts)
// ============================================================================
//
// Variable category defaults sourced from:
// https://github.com/mikepsinn/curedao-api/tree/main/app/VariableCategories
//
// Key semantics:
//   combinationOperation: SUM = additive (doses, calories, steps)
//                         MEAN = instantaneous (mood, heart rate, temp)
//   fillingType on GlobalVariable:
//     ZERO  = "no measurement recorded ⇒ value is 0" (treatments, foods, activities)
//     NONE  = "no measurement recorded ⇒ leave gap"  (symptoms, vitals, emotions)
//   onsetDelay: seconds before a measurement's effect begins
//   durationOfAction: seconds the effect persists
//   predictorOnly: can only be a cause (treatments, foods)
//   outcome: something a user wants to optimise (symptoms, mood, vitals)
// ============================================================================

import {
  PrismaClient,
  CombinationOperation,
  FillingType,
  Valence,
  MeasurementScale,
  JurisdictionType,
  type Prisma,
} from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: upsert by unique "name" (or "code" for jurisdictions)
// ---------------------------------------------------------------------------

async function upsertUnit(data: Prisma.UnitUncheckedCreateInput) {
  return prisma.unit.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  });
}

async function upsertVariableCategory(data: Prisma.VariableCategoryUncheckedCreateInput) {
  return prisma.variableCategory.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  });
}

async function upsertGlobalVariable(data: Prisma.GlobalVariableUncheckedCreateInput) {
  return prisma.globalVariable.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  });
}

async function upsertJurisdiction(data: Prisma.JurisdictionUncheckedCreateInput) {
  return prisma.jurisdiction.upsert({
    where: { code: data.code! },
    update: data,
    create: data,
  });
}

// ============================================================================
// A) UNITS (~30)
// ============================================================================

async function seedUnits() {
  console.log("🔧 Seeding units...");

  const units: Prisma.UnitUncheckedCreateInput[] = [
    // Weight
    { name: "Milligrams", abbreviatedName: "mg", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Grams", abbreviatedName: "g", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Kilograms", abbreviatedName: "kg", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Ounces", abbreviatedName: "oz", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Pounds", abbreviatedName: "lb", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },

    // Volume
    { name: "Milliliters", abbreviatedName: "mL", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Liters", abbreviatedName: "L", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Fluid Ounces", abbreviatedName: "fl oz", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Cups", abbreviatedName: "cups", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Count
    { name: "Count", abbreviatedName: "count", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Servings", abbreviatedName: "servings", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Doses", abbreviatedName: "doses", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Tablets", abbreviatedName: "tablets", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Capsules", abbreviatedName: "capsules", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Applications", abbreviatedName: "applications", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Sprays", abbreviatedName: "sprays", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Drops", abbreviatedName: "drops", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Rating
    { name: "1 to 5 Rating", abbreviatedName: "1-5", unitCategoryId: "Rating", scale: MeasurementScale.ORDINAL, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 1, maximumValue: 5 },
    { name: "1 to 10 Rating", abbreviatedName: "1-10", unitCategoryId: "Rating", scale: MeasurementScale.ORDINAL, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 1, maximumValue: 10 },
    { name: "Percent", abbreviatedName: "%", unitCategoryId: "Rating", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 0, maximumValue: 100 },

    // Currency
    { name: "US Dollars", abbreviatedName: "USD", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Euros", abbreviatedName: "EUR", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "British Pounds", abbreviatedName: "GBP", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },

    // Duration
    { name: "Seconds", abbreviatedName: "s", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Minutes", abbreviatedName: "min", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Hours", abbreviatedName: "h", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Other
    { name: "International Units", abbreviatedName: "IU", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Micrograms", abbreviatedName: "mcg", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Calories", abbreviatedName: "kcal", unitCategoryId: "Energy", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Steps", abbreviatedName: "steps", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Beats Per Minute", abbreviatedName: "bpm", unitCategoryId: "Frequency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: false },
    { name: "Yes/No", abbreviatedName: "yes/no", unitCategoryId: "Rating", scale: MeasurementScale.NOMINAL, fillingType: FillingType.ZERO, manualTracking: true, minimumValue: 0, maximumValue: 1 },
    { name: "Millimeters of Mercury", abbreviatedName: "mmHg", unitCategoryId: "Pressure", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Degrees Fahrenheit", abbreviatedName: "°F", unitCategoryId: "Temperature", scale: MeasurementScale.INTERVAL, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Degrees Celsius", abbreviatedName: "°C", unitCategoryId: "Temperature", scale: MeasurementScale.INTERVAL, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Index", abbreviatedName: "index", unitCategoryId: "Rating", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: false },
    { name: "Milligrams per Deciliter", abbreviatedName: "mg/dL", unitCategoryId: "Concentration", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Meters", abbreviatedName: "m", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Kilometers", abbreviatedName: "km", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Miles", abbreviatedName: "mi", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
  ];

  const created: Record<string, string> = {};
  for (const u of units) {
    const row = await upsertUnit(u);
    created[u.abbreviatedName] = row.id;
  }
  console.log(`  ✅ ${Object.keys(created).length} units`);
  return created;
}

// ============================================================================
// B) VARIABLE CATEGORIES
// ============================================================================
// Sourced from legacy curedao-api/app/VariableCategories/*.php
// The schema's VariableCategory model has: name, description, defaultUnitId,
// combinationOperation, onsetDelay, durationOfAction, predictorOnly, outcome
// (fillingType/fillingValue/min/max live on GlobalVariable, not VariableCategory)
// ============================================================================

async function seedVariableCategories(unitMap: Record<string, string>) {
  console.log("📂 Seeding variable categories...");

  // Defines per-category defaults. fillingType/fillingValue are documented here
  // for reference but applied at the GlobalVariable level.
  const categories = [
    // --- Causes / Predictors ---
    // Legacy: TreatmentsVariableCategory — SUM, onset 1800, duration 86400, ZERO fill, predictor, min 0
    { name: "Treatment",          description: "Medications, supplements, and other interventional treatments",          combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: separate from Treatment for clarity; same defaults
    { name: "Supplement",         description: "Dietary supplements, vitamins, and nutraceuticals",                      combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "mg" },
    // Legacy: FoodsVariableCategory — SUM, onset 1800, duration 864000 (10d), ZERO fill, predictor, min 0
    { name: "Food",               description: "Foods and dietary intake",                                                combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "servings" },
    // Legacy: no separate Drink category; modeled as sub-type of Food
    { name: "Drink",              description: "Beverages and fluid intake",                                              combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "servings" },
    // Legacy: NutrientsVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor
    { name: "Nutrient",           description: "Macronutrients, micronutrients, and dietary compounds",                   combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "g" },

    // --- Activities ---
    // Legacy: ActivitiesVariableCategory — SUM, onset 0, duration 86400, ZERO fill, predictor
    { name: "Activity",           description: "General activities and behaviors",                                        combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: null,  defaultUnitAbbr: "min" },
    // Legacy: same pattern as Activity; separated for UI
    { name: "Exercise",           description: "Physical exercise and workouts",                                          combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: null,  defaultUnitAbbr: "min" },
    // Legacy: PhysicalActivityVariableCategory — SUM, onset 0, duration 86400, ZERO fill, predictor+outcome
    { name: "Physical Activity",  description: "Physical activity metrics like steps, distance, and active minutes",      combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "count" },
    // Legacy: SleepVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor+outcome
    { name: "Sleep",              description: "Sleep duration, quality, and related metrics",                             combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "h" },
    // Legacy: SocialInteractionsVariableCategory — MEAN, onset 0, duration 86400, ZERO fill, predictor+outcome
    { name: "Social Interaction", description: "Social activities, communication, and relationship interactions",          combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "count" },

    // --- Outcomes ---
    // Legacy: SymptomsVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor+outcome
    { name: "Symptom",            description: "Physical and mental health symptoms",                                     combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "1-5" },
    // Legacy: EmotionsVariableCategory — MEAN, onset 0, duration 86400, NONE fill, outcome
    { name: "Emotion",            description: "Emotional states, mood, and subjective well-being",                       combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "1-5" },
    // Legacy: VitalSignsVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor+outcome
    { name: "Vital Sign",         description: "Physiological measurements (heart rate, blood pressure, etc.)",           combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "count" },
    // Legacy: BiomarkersVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor+outcome
    { name: "Biomarker",          description: "Lab results, biomarkers, and clinical test values",                        combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "count" },
    // Legacy: ConditionsVariableCategory — MEAN, onset 0, duration 86400, null fill, outcome
    { name: "Condition",          description: "Medical conditions and diagnoses",                                         combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "1-5" },
    // Legacy: CognitivePerformanceVariableCategory — MEAN, onset 0, duration 86400, NONE fill, outcome-only
    { name: "Cognitive Performance", description: "Cognitive function, memory, reaction time, and mental performance",     combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "1-5" },
    // Legacy: PhysiqueVariableCategory — MEAN, onset 0, duration 604800, NONE fill, predictor+outcome
    { name: "Physique",           description: "Body composition and physical measurements (weight, body fat, BMI)",       combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 604800,  predictorOnly: false, outcome: true,  defaultUnitAbbr: "count" },
    // Legacy: GoalsVariableCategory — MEAN, onset 0, duration 86400, NONE fill, outcome
    { name: "Goal",               description: "Personal goals, targets, and progress metrics",                            combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "%" },

    // --- Environment ---
    // Legacy: EnvironmentVariableCategory — MEAN, onset 0, duration 86400, NONE fill, predictor
    { name: "Environment",        description: "Environmental factors (air quality, noise, allergens)",                    combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Weather is a sub-type of Environment in legacy; separated for clarity
    { name: "Weather",            description: "Weather conditions (temperature, humidity, barometric pressure)",           combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: LocationsVariableCategory — MEAN, onset 0, duration 86400, ZERO fill, predictor
    { name: "Location",           description: "Location and place-based data (time at locations)",                        combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "min" },

    // --- Productivity & Work ---
    // Work category — SUM, onset 0, duration 86400, ZERO fill
    { name: "Work",               description: "Work activities, tasks, and time tracking",                                combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: null,  defaultUnitAbbr: "h" },
    // Productivity as an outcome measure
    { name: "Productivity",       description: "Productivity ratings and output metrics",                                  combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "1-5" },
    // Legacy: SoftwareVariableCategory — SUM, onset 0, duration 86400, ZERO fill, predictor
    { name: "Software",           description: "Software and app usage tracking",                                          combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "min" },
    // Legacy: ITMetricsVariableCategory — SUM, onset 0, duration 86400, NONE fill, predictor
    { name: "IT Metric",          description: "IT and technical metrics (commits, deployments, uptime)",                   combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },

    // --- Financial ---
    // Legacy: EconomicIndicatorsVariableCategory — MEAN, onset 0, duration 86400, NONE fill
    { name: "Economic",           description: "Economic indicators and financial metrics",                                combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 2592000, predictorOnly: false, outcome: true,  defaultUnitAbbr: "USD" },
    // Legacy: PaymentsVariableCategory — SUM, onset 0, duration 2592000, ZERO fill, predictor
    { name: "Payment",            description: "Financial transactions and spending",                                      combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 2592000, predictorOnly: true,  outcome: false, defaultUnitAbbr: "USD" },
    // Legacy: InvestmentStrategiesVariableCategory — MEAN, onset 0, duration 86400, NONE fill
    { name: "Investment Strategy", description: "Investment strategies and portfolio performance",                          combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: true,  defaultUnitAbbr: "%" },

    // --- Media & Entertainment ---
    // Legacy: ElectronicsVariableCategory — SUM, onset 1800, duration 604800, ZERO fill, predictor
    { name: "Electronics",        description: "Electronics usage and device interactions",                                combinationOperation: CombinationOperation.SUM,  onsetDelay: 1800,    durationOfAction: 604800,  predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: MoviesAndTVVariableCategory — SUM, onset 0, duration 86400, ZERO fill, predictor
    { name: "Movies and TV",      description: "Movies, TV shows, and video content consumption",                          combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: MusicVariableCategory — SUM, onset 0, duration 86400, ZERO fill, predictor
    { name: "Music",              description: "Music listening and audio content",                                        combinationOperation: CombinationOperation.SUM,  onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: BooksVariableCategory — MEAN, onset 0, duration 86400, ZERO fill, predictor
    { name: "Books",              description: "Books, reading, and literary content",                                     combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },

    // --- Other ---
    // Legacy: CausesOfIllnessVariableCategory — MEAN, onset 0, duration 86400, ZERO fill, predictor
    { name: "Causes of Illness",  description: "Pathogens, allergens, and illness triggers",                               combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Policy: long onset, long duration
    { name: "Policy",             description: "Government policies and regulations",                                      combinationOperation: CombinationOperation.MEAN, onsetDelay: 2592000, durationOfAction: 31536000, predictorOnly: true,  outcome: false, defaultUnitAbbr: "count" },
    // Legacy: MiscellaneousVariableCategory — MEAN, onset 0, duration 86400
    { name: "Miscellaneous",      description: "Uncategorized variables",                                                  combinationOperation: CombinationOperation.MEAN, onsetDelay: 0,       durationOfAction: 86400,   predictorOnly: false, outcome: null,  defaultUnitAbbr: "count" },
  ];

  const created: Record<string, string> = {};
  for (const c of categories) {
    const { defaultUnitAbbr, ...rest } = c;
    const row = await upsertVariableCategory({
      ...rest,
      defaultUnitId: unitMap[defaultUnitAbbr] || undefined,
    });
    created[c.name] = row.id;
  }
  console.log(`  ✅ ${Object.keys(created).length} variable categories`);
  return created;
}

// ============================================================================
// C) GLOBAL VARIABLES
// ============================================================================
// Each variable inherits sensible defaults from its category but can override.
// fillingType + fillingValue are set per-variable (they live on GlobalVariable).
// ============================================================================

async function seedGlobalVariables(
  unitMap: Record<string, string>,
  catMap: Record<string, string>,
) {
  console.log("🌐 Seeding global variables...");

  type VarDef = {
    name: string;
    description?: string;
    category: string;
    unit: string;
    combinationOperation?: CombinationOperation;
    fillingType?: FillingType;
    fillingValue?: number;
    onsetDelay?: number;
    durationOfAction?: number;
    predictorOnly?: boolean;
    outcome?: boolean;
    valence?: Valence;
    minimumAllowedValue?: number;
    maximumAllowedValue?: number;
    synonyms?: string;
  };

  const variables: VarDef[] = [
    // ========================================================================
    // TREATMENTS — SUM, onset 1800, duration 86400, ZERO fill, predictor-only
    // ========================================================================
    { name: "Caffeine",          category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 900,   durationOfAction: 21600,  predictorOnly: true, outcome: false, valence: Valence.NEUTRAL,  minimumAllowedValue: 0, synonyms: "coffee,tea,energy drink" },
    { name: "Ibuprofen",         category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 21600,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "Advil,Motrin" },
    { name: "Aspirin",           category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 14400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Acetaminophen",     category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 21600,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "Tylenol,paracetamol" },
    { name: "Metformin",         category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 43200,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Prednisone",        category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Benadryl",          category: "Treatment",  unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 21600,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "diphenhydramine" },

    // ========================================================================
    // SUPPLEMENTS — SUM, onset 1800, duration 86400, ZERO fill, predictor-only
    // ========================================================================
    { name: "Vitamin D",         category: "Supplement", unit: "IU",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "cholecalciferol,D3" },
    { name: "Omega-3",           category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "fish oil,EPA,DHA" },
    { name: "Magnesium",         category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Melatonin",         category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 28800,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Zinc",              category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Vitamin C",         category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 43200,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "ascorbic acid" },
    { name: "Vitamin B12",       category: "Supplement", unit: "mcg",     combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "cobalamin" },
    { name: "Probiotics",        category: "Supplement", unit: "count",   combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Iron",              category: "Supplement", unit: "mg",      combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Creatine",          category: "Supplement", unit: "g",       combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800,  durationOfAction: 86400,  predictorOnly: true, outcome: false, valence: Valence.POSITIVE, minimumAllowedValue: 0 },

    // ========================================================================
    // SYMPTOMS — MEAN, onset 0, duration 86400, NONE fill, outcome
    // ========================================================================
    { name: "Headache Severity",   category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Fatigue",             category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Anxiety",             category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Depression Severity", category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Pain",                category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Nausea",              category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Insomnia Severity",   category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Brain Fog",           category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Joint Pain",         category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Bloating",           category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Dizziness",          category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Congestion",         category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, synonyms: "stuffy nose,sinus" },
    { name: "Back Pain",          category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Itching",            category: "Symptom", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },

    // ========================================================================
    // EMOTIONS — MEAN, onset 0, duration 86400, NONE fill, outcome
    // ========================================================================
    { name: "Overall Mood",     category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Energy Level",     category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Motivation",       category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Stress Level",     category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Happiness",        category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Irritability",     category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Calmness",         category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Gratitude",        category: "Emotion", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },

    // ========================================================================
    // VITAL SIGNS — MEAN, onset 0, duration 86400, NONE fill
    // ========================================================================
    { name: "Heart Rate",                  category: "Vital Sign", unit: "bpm",   combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  minimumAllowedValue: 30, maximumAllowedValue: 220 },
    { name: "Blood Pressure Systolic",     category: "Vital Sign", unit: "mmHg",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 60, maximumAllowedValue: 300, synonyms: "systolic,SBP" },
    { name: "Blood Pressure Diastolic",    category: "Vital Sign", unit: "mmHg",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 30, maximumAllowedValue: 200, synonyms: "diastolic,DBP" },
    { name: "Body Temperature",            category: "Vital Sign", unit: "°F",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  minimumAllowedValue: 90, maximumAllowedValue: 115 },
    { name: "Blood Oxygen Saturation",     category: "Vital Sign", unit: "%",     combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 50, maximumAllowedValue: 100, synonyms: "SpO2,O2 sat" },
    { name: "Respiratory Rate",            category: "Vital Sign", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  minimumAllowedValue: 5,  maximumAllowedValue: 60, synonyms: "breaths per minute" },
    { name: "Resting Heart Rate",          category: "Vital Sign", unit: "bpm",   combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 30, maximumAllowedValue: 120, synonyms: "RHR" },
    { name: "Heart Rate Variability",      category: "Vital Sign", unit: "s",     combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0,  maximumAllowedValue: 300, synonyms: "HRV,RMSSD" },

    // ========================================================================
    // BIOMARKERS — MEAN, onset 0, duration 86400, NONE fill
    // ========================================================================
    { name: "Blood Glucose",               category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  minimumAllowedValue: 20, maximumAllowedValue: 600, synonyms: "blood sugar,glucose" },
    { name: "HbA1c",                       category: "Biomarker", unit: "%",      combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 3,  maximumAllowedValue: 15, synonyms: "A1c,glycated hemoglobin" },
    { name: "Total Cholesterol",           category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 50, maximumAllowedValue: 500 },
    { name: "LDL Cholesterol",             category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 10, maximumAllowedValue: 400, synonyms: "LDL,bad cholesterol" },
    { name: "HDL Cholesterol",             category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 10, maximumAllowedValue: 150, synonyms: "HDL,good cholesterol" },
    { name: "Triglycerides",               category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 10, maximumAllowedValue: 1000 },
    { name: "TSH",                         category: "Biomarker", unit: "count",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  synonyms: "thyroid stimulating hormone" },
    { name: "Vitamin D Level",             category: "Biomarker", unit: "count",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, synonyms: "25-OH vitamin D,25-hydroxyvitamin D" },
    { name: "C-Reactive Protein",          category: "Biomarker", unit: "mg/dL",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, synonyms: "CRP,hs-CRP" },

    // ========================================================================
    // PHYSIQUE / BODY MEASUREMENTS — MEAN, onset 0, duration 604800, NONE fill
    // ========================================================================
    { name: "Body Weight",        category: "Physique", unit: "lb",   combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL,  minimumAllowedValue: 1, maximumAllowedValue: 1000 },
    { name: "Body Fat Percentage", category: "Physique", unit: "%",   combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 1, maximumAllowedValue: 60 },
    { name: "Waist Circumference", category: "Physique", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "BMI",                 category: "Physique", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEUTRAL, minimumAllowedValue: 10, maximumAllowedValue: 80, synonyms: "body mass index" },

    // ========================================================================
    // SLEEP — MEAN (per legacy), onset 0, duration 86400, NONE fill
    // ========================================================================
    { name: "Sleep Duration",      category: "Sleep",     unit: "h",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, maximumAllowedValue: 24 },
    { name: "Sleep Quality",       category: "Sleep",     unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Deep Sleep Duration", category: "Sleep",     unit: "h",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, maximumAllowedValue: 12 },
    { name: "REM Sleep Duration",  category: "Sleep",     unit: "h",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, maximumAllowedValue: 12 },
    { name: "Sleep Latency",       category: "Sleep",     unit: "min",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 0, synonyms: "time to fall asleep" },
    { name: "Number of Awakenings", category: "Sleep",    unit: "count", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, minimumAllowedValue: 0 },

    // ========================================================================
    // PHYSICAL ACTIVITY — SUM, onset 0, duration 86400, ZERO fill
    // ========================================================================
    { name: "Daily Step Count",    category: "Physical Activity", unit: "steps",  combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, maximumAllowedValue: 100000 },
    { name: "Active Minutes",      category: "Physical Activity", unit: "min",   combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Distance Walked",     category: "Physical Activity", unit: "km",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Calories Burned",     category: "Physical Activity", unit: "kcal",  combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0 },
    { name: "Flights of Stairs",   category: "Physical Activity", unit: "count", combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, synonyms: "floors climbed" },

    // ========================================================================
    // FOODS — SUM, onset 1800, duration 86400, ZERO fill, predictor
    // ========================================================================
    { name: "Coffee",             category: "Drink", unit: "servings",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Alcohol",            category: "Drink", unit: "servings",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE, synonyms: "beer,wine,spirits,drinks" },
    { name: "Sugar Intake",       category: "Food",  unit: "g",         combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE },
    { name: "Processed Food",     category: "Food",  unit: "servings",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE },
    { name: "Vegetable Intake",   category: "Food",  unit: "servings",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.POSITIVE },
    { name: "Water Intake",       category: "Drink", unit: "mL",        combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.POSITIVE },
    { name: "Caloric Intake",     category: "Food",  unit: "kcal",      combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Protein Intake",     category: "Food",  unit: "g",         combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.POSITIVE },
    { name: "Fiber Intake",       category: "Food",  unit: "g",         combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.POSITIVE },
    { name: "Fruit Intake",       category: "Food",  unit: "servings",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.POSITIVE },
    { name: "Fat Intake",         category: "Food",  unit: "g",         combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Carbohydrate Intake", category: "Food", unit: "g",         combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL, synonyms: "carbs" },
    { name: "Sodium Intake",      category: "Nutrient", unit: "mg",     combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, onsetDelay: 1800, durationOfAction: 86400, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE, synonyms: "salt" },

    // ========================================================================
    // ACTIVITIES — SUM, onset 0, duration 86400, ZERO fill, predictor
    // ========================================================================
    { name: "Exercise Duration",  category: "Exercise", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Meditation",         category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Screen Time",        category: "Activity", unit: "h",    combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.NEGATIVE },
    { name: "Time Outdoors",      category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Social Interaction Time", category: "Social Interaction", unit: "min", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Reading Time",       category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Journaling",         category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Cold Shower",        category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Stretching",         category: "Activity", unit: "min",  combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },

    // ========================================================================
    // ENVIRONMENT — MEAN, onset 0, duration 86400, NONE fill, predictor
    // ========================================================================
    { name: "Outdoor Temperature", category: "Weather",     unit: "°F",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Humidity",            category: "Weather",     unit: "%",     combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL, minimumAllowedValue: 0, maximumAllowedValue: 100 },
    { name: "Barometric Pressure", category: "Weather",     unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "UV Index",            category: "Weather",     unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL, minimumAllowedValue: 0, maximumAllowedValue: 15 },
    { name: "Air Quality Index",   category: "Environment", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE, minimumAllowedValue: 0, maximumAllowedValue: 500, synonyms: "AQI" },
    { name: "Pollen Count",        category: "Environment", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE, minimumAllowedValue: 0 },
    { name: "Indoor Temperature",  category: "Environment", unit: "°F",   combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Noise Level",         category: "Environment", unit: "count", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: true, outcome: false, valence: Valence.NEGATIVE, synonyms: "decibels,dB" },

    // ========================================================================
    // COGNITIVE PERFORMANCE — MEAN, onset 0, duration 86400, NONE fill, outcome
    // ========================================================================
    { name: "Focus Rating",        category: "Cognitive Performance", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Memory Rating",       category: "Cognitive Performance", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Reaction Time",       category: "Cognitive Performance", unit: "s",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Mental Clarity",      category: "Cognitive Performance", unit: "1-5",  combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },

    // ========================================================================
    // WORK / PRODUCTIVITY — SUM/MEAN
    // ========================================================================
    { name: "Hours Worked",        category: "Work",        unit: "h",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.NEUTRAL },
    { name: "Tasks Completed",     category: "Work",        unit: "count", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE },
    { name: "Productivity Rating", category: "Productivity", unit: "1-5", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Deep Work Duration",  category: "Work",        unit: "h",    combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.POSITIVE, synonyms: "focused work" },
    { name: "Meetings",            category: "Work",        unit: "count", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: false, valence: Valence.NEUTRAL },

    // ========================================================================
    // GOALS — MEAN, onset 0, duration 86400, NONE fill, outcome
    // ========================================================================
    { name: "Goal Progress",       category: "Goal", unit: "%",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE, minimumAllowedValue: 0, maximumAllowedValue: 100 },
    { name: "Life Satisfaction",   category: "Goal", unit: "1-10", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },

    // ========================================================================
    // ECONOMIC — MEAN/SUM
    // ========================================================================
    { name: "Daily Spending",      category: "Payment",  unit: "USD", combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: true, outcome: false, valence: Valence.NEUTRAL },
    { name: "Income",              category: "Economic", unit: "USD", combinationOperation: CombinationOperation.SUM,  fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },

    // ========================================================================
    // SOCIAL INTERACTIONS — SUM, onset 0, duration 86400, ZERO fill
    // ========================================================================
    { name: "Phone Calls Made",    category: "Social Interaction", unit: "count", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },
    { name: "Messages Sent",      category: "Social Interaction", unit: "count", combinationOperation: CombinationOperation.SUM, fillingType: FillingType.ZERO, fillingValue: 0, predictorOnly: false, outcome: true, valence: Valence.POSITIVE },

    // ========================================================================
    // CONDITIONS — MEAN, onset 0, duration 86400, NONE fill, outcome
    // ========================================================================
    { name: "Migraine",           category: "Condition", unit: "yes/no", combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Allergies",          category: "Condition", unit: "1-5",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE },
    { name: "Cold/Flu",           category: "Condition", unit: "1-5",    combinationOperation: CombinationOperation.MEAN, fillingType: FillingType.NONE, predictorOnly: false, outcome: true, valence: Valence.NEGATIVE, synonyms: "cold,flu,sick" },
  ];

  let count = 0;
  for (const v of variables) {
    const categoryId = catMap[v.category];
    const unitId = unitMap[v.unit];
    if (!categoryId) {
      console.warn(`  ⚠️  Unknown category "${v.category}" for variable "${v.name}" — skipping`);
      continue;
    }
    if (!unitId) {
      console.warn(`  ⚠️  Unknown unit "${v.unit}" for variable "${v.name}" — skipping`);
      continue;
    }
    await upsertGlobalVariable({
      name: v.name,
      description: v.description,
      variableCategoryId: categoryId,
      defaultUnitId: unitId,
      combinationOperation: v.combinationOperation,
      fillingType: v.fillingType,
      fillingValue: v.fillingValue,
      onsetDelay: v.onsetDelay,
      durationOfAction: v.durationOfAction,
      predictorOnly: v.predictorOnly,
      outcome: v.outcome,
      valence: v.valence,
      minimumAllowedValue: v.minimumAllowedValue,
      maximumAllowedValue: v.maximumAllowedValue,
      synonyms: v.synonyms,
    });
    count++;
  }
  console.log(`  ✅ ${count} global variables`);
}

// ============================================================================
// D) JURISDICTIONS — US Federal + 50 States
// ============================================================================

async function seedJurisdictions() {
  console.log("🏛️  Seeding jurisdictions...");

  // Federal
  const us = await upsertJurisdiction({
    name: "United States",
    type: JurisdictionType.COUNTRY,
    code: "US",
    currency: "USD",
    population: 335_000_000,
  });

  // 50 states: [name, FIPS code, approx 2024 population]
  const states: [string, string, number][] = [
    ["Alabama",        "US-AL", 5_108_000],
    ["Alaska",         "US-AK",   733_000],
    ["Arizona",        "US-AZ", 7_431_000],
    ["Arkansas",       "US-AR", 3_067_000],
    ["California",     "US-CA", 38_965_000],
    ["Colorado",       "US-CO", 5_912_000],
    ["Connecticut",    "US-CT", 3_617_000],
    ["Delaware",       "US-DE", 1_018_000],
    ["Florida",        "US-FL", 22_611_000],
    ["Georgia",        "US-GA", 11_029_000],
    ["Hawaii",         "US-HI", 1_435_000],
    ["Idaho",          "US-ID", 2_001_000],
    ["Illinois",       "US-IL", 12_550_000],
    ["Indiana",        "US-IN", 6_862_000],
    ["Iowa",           "US-IA", 3_207_000],
    ["Kansas",         "US-KS", 2_940_000],
    ["Kentucky",       "US-KY", 4_526_000],
    ["Louisiana",      "US-LA", 4_573_000],
    ["Maine",          "US-ME", 1_395_000],
    ["Maryland",       "US-MD", 6_180_000],
    ["Massachusetts",  "US-MA", 7_001_000],
    ["Michigan",       "US-MI", 10_037_000],
    ["Minnesota",      "US-MN", 5_737_000],
    ["Mississippi",    "US-MS", 2_939_000],
    ["Missouri",       "US-MO", 6_196_000],
    ["Montana",        "US-MT", 1_133_000],
    ["Nebraska",       "US-NE", 1_978_000],
    ["Nevada",         "US-NV", 3_194_000],
    ["New Hampshire",  "US-NH", 1_402_000],
    ["New Jersey",     "US-NJ", 9_290_000],
    ["New Mexico",     "US-NM", 2_114_000],
    ["New York",       "US-NY", 19_572_000],
    ["North Carolina", "US-NC", 10_835_000],
    ["North Dakota",   "US-ND",   783_000],
    ["Ohio",           "US-OH", 11_785_000],
    ["Oklahoma",       "US-OK", 4_053_000],
    ["Oregon",         "US-OR", 4_233_000],
    ["Pennsylvania",   "US-PA", 12_962_000],
    ["Rhode Island",   "US-RI", 1_095_000],
    ["South Carolina", "US-SC", 5_373_000],
    ["South Dakota",   "US-SD",   919_000],
    ["Tennessee",      "US-TN", 7_126_000],
    ["Texas",          "US-TX", 30_503_000],
    ["Utah",           "US-UT", 3_418_000],
    ["Vermont",        "US-VT",   647_000],
    ["Virginia",       "US-VA", 8_643_000],
    ["Washington",     "US-WA", 7_812_000],
    ["West Virginia",  "US-WV", 1_770_000],
    ["Wisconsin",      "US-WI", 5_893_000],
    ["Wyoming",        "US-WY",   584_000],
  ];

  for (const [name, code, population] of states) {
    await upsertJurisdiction({
      name,
      type: JurisdictionType.STATE,
      code,
      parentId: us.id,
      currency: "USD",
      population,
    });
  }

  console.log(`  ✅ 1 country + ${states.length} states`);
  return us.id;
}

// ============================================================================
// E) ITEMS — Federal Budget Categories (FY2025 approximate)
// ============================================================================

async function seedBudgetItems(usJurisdictionId: string) {
  console.log("💰 Seeding federal budget items...");

  // FY2025 estimated total spending: ~$6.75 trillion
  const totalBudgetUsd = 6_750_000_000_000;

  // Source: CBO FY2025 projections, OMB Historical Tables, USASpending.gov
  // Percentages are approximate shares of total federal spending
  const budgetItems: {
    name: string;
    description: string;
    category: string;
    pct: number;
  }[] = [
    { name: "Social Security",                description: "Old-Age, Survivors, and Disability Insurance (OASDI)",                                  category: "Mandatory",    pct: 21.0 },
    { name: "Medicare",                       description: "Health insurance for seniors and disabled (Parts A, B, D)",                              category: "Mandatory",    pct: 13.0 },
    { name: "National Defense",               description: "Department of Defense and nuclear weapons activities",                                   category: "Discretionary",pct: 13.0 },
    { name: "Net Interest",                   description: "Interest payments on the national debt",                                                category: "Mandatory",    pct: 13.0 },
    { name: "Medicaid",                       description: "Health coverage for low-income individuals and families",                                category: "Mandatory",    pct: 9.0  },
    { name: "Income Security",                description: "SNAP, SSI, EITC, unemployment, housing assistance, child nutrition",                    category: "Mandatory",    pct: 6.0  },
    { name: "Health (Other)",                 description: "NIH, CDC, FDA, SAMHSA, Indian Health Service, other health programs",                   category: "Discretionary",pct: 3.0  },
    { name: "Veterans Benefits & Services",   description: "VA healthcare, disability compensation, pensions, education benefits",                   category: "Discretionary",pct: 3.5  },
    { name: "Education",                      description: "K-12 grants, Pell grants, student loans, special education",                            category: "Discretionary",pct: 2.5  },
    { name: "Transportation",                 description: "Federal highways, FAA, Amtrak, transit grants",                                         category: "Discretionary",pct: 1.5  },
    { name: "International Affairs",          description: "State Department, USAID, foreign aid, embassies",                                       category: "Discretionary",pct: 1.0  },
    { name: "Science, Space & Technology",    description: "NASA, NSF, DOE Office of Science, NOAA",                                               category: "Discretionary",pct: 1.0  },
    { name: "Administration of Justice",      description: "FBI, DEA, federal courts, Bureau of Prisons, ATF",                                     category: "Discretionary",pct: 1.0  },
    { name: "Natural Resources & Environment",description: "EPA, national parks, Forest Service, water infrastructure, clean energy",               category: "Discretionary",pct: 0.8  },
    { name: "Agriculture",                    description: "Farm subsidies, crop insurance, conservation, rural development",                       category: "Mandatory",    pct: 0.7  },
    { name: "Community & Regional Development",description: "FEMA disaster relief, HUD community grants, EDA",                                     category: "Discretionary",pct: 0.7  },
    { name: "General Government",             description: "White House, Congress, IRS, GSA, OPM, government-wide operations",                     category: "Discretionary",pct: 0.5  },
    { name: "Energy",                         description: "DOE energy programs, Strategic Petroleum Reserve, power marketing",                     category: "Discretionary",pct: 0.3  },
    { name: "Commerce & Housing Credit",      description: "SBA, Census Bureau, FHA/mortgage programs, FDIC",                                      category: "Mandatory",    pct: 0.3  },
    { name: "Other Federal Programs",         description: "Undistributed offsetting receipts, other mandatory and discretionary programs",          category: "Other",        pct: 8.2  },
  ];

  for (const item of budgetItems) {
    const usdAmount = Math.round((item.pct / 100) * totalBudgetUsd);
    await prisma.item.upsert({
      where: {
        id: `budget-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        currentAllocationPct: item.pct,
        currentAllocationUsd: usdAmount,
        active: true,
        jurisdictionId: usJurisdictionId,
      },
      create: {
        id: `budget-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: item.name,
        description: item.description,
        category: item.category,
        currentAllocationPct: item.pct,
        currentAllocationUsd: usdAmount,
        active: true,
        jurisdictionId: usJurisdictionId,
      },
    });
  }

  console.log(`  ✅ ${budgetItems.length} federal budget items`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🌱 Starting Optomitron seed...\n");

  const unitMap = await seedUnits();
  const catMap = await seedVariableCategories(unitMap);
  await seedGlobalVariables(unitMap, catMap);
  const usId = await seedJurisdictions();
  await seedBudgetItems(usId);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
