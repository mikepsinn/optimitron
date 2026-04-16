// ============================================================================
// Prisma Seed Script — Optimitron
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
  ReferendumStatus,
  type Prisma,
} from "../src/generated/prisma/client.js";
import {
  TREATY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
} from "../src/constants.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";
import {
  US_WISHOCRATIC_JURISDICTION,
  getUSWishocraticCatalogRecords,
  listGovernmentLeaders,
} from "@optimitron/data";
import {
  DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
  TREATY_ANNUAL_FUNDING,
  earthOptimizationPrizeWinCondition,
  EARTH_OPTIMIZATION_PRIZE_DEADLINE,
  EARTH_OPTIMIZATION_PRIZE_DEADLINE_YEAR,
  EARTH_OPTIMIZATION_PRIZE_INCOME_GROWTH_EFFECT_PP_PER_YEAR,
} from "@optimitron/data/parameters";
import { WORLD_LEADERS } from "@optimitron/data/datasets/world-leaders";
import {
  normalizeSeedScopes,
  parseSeedScopes,
  type SeedScope,
} from "./seed-scopes.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helper: upsert by unique "name" (or "code" for jurisdictions)
// ---------------------------------------------------------------------------

/**
 * Slugify a display name into a URL-safe handle. Strips diacritics, drops
 * non-alphanumeric characters, collapses runs of dashes, and lowercases.
 * Used for Person.handle backfill — combine with a country suffix on shared
 * names (e.g. there are several "Tshering Tobgay"s historically).
 */
function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

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
    { name: "Milligrams", abbreviatedName: "mg", ucumCode: "mg", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Grams", abbreviatedName: "g", ucumCode: "g", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Kilograms", abbreviatedName: "kg", ucumCode: "kg", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Ounces", abbreviatedName: "oz", ucumCode: "[oz_av]", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Pounds", abbreviatedName: "lb", ucumCode: "[lb_av]", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },

    // Volume
    { name: "Milliliters", abbreviatedName: "mL", ucumCode: "mL", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Liters", abbreviatedName: "L", ucumCode: "L", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Fluid Ounces", abbreviatedName: "fl oz", ucumCode: "[foz_us]", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Cups", abbreviatedName: "cups", ucumCode: "[cup_us]", unitCategoryId: "Volume", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Count
    { name: "Count", abbreviatedName: "count", ucumCode: "{count}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Servings", abbreviatedName: "servings", ucumCode: "{serving}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Doses", abbreviatedName: "doses", ucumCode: "{dose}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Tablets", abbreviatedName: "tablets", ucumCode: "{tablet}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Capsules", abbreviatedName: "capsules", ucumCode: "{capsule}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Applications", abbreviatedName: "applications", ucumCode: "{application}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Sprays", abbreviatedName: "sprays", ucumCode: "{spray}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Drops", abbreviatedName: "drops", ucumCode: "[drp]", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Rating
    { name: "1 to 5 Rating", abbreviatedName: "1-5", ucumCode: "{score_5}", unitCategoryId: "Rating", scale: MeasurementScale.ORDINAL, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 1, maximumValue: 5 },
    { name: "1 to 10 Rating", abbreviatedName: "1-10", ucumCode: "{score_10}", unitCategoryId: "Rating", scale: MeasurementScale.ORDINAL, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 1, maximumValue: 10 },
    { name: "Percent", abbreviatedName: "%", ucumCode: "%", unitCategoryId: "Rating", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true, minimumValue: 0, maximumValue: 100 },

    // Currency
    { name: "US Dollars", abbreviatedName: "USD", ucumCode: "[USD]", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Euros", abbreviatedName: "EUR", ucumCode: "[EUR]", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "British Pounds", abbreviatedName: "GBP", ucumCode: "[GBP]", unitCategoryId: "Currency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },

    // Duration
    { name: "Seconds", abbreviatedName: "s", ucumCode: "s", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Minutes", abbreviatedName: "min", ucumCode: "min", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Hours", abbreviatedName: "h", ucumCode: "h", unitCategoryId: "Duration", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },

    // Other
    { name: "International Units", abbreviatedName: "IU", ucumCode: "[iU]", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Micrograms", abbreviatedName: "mcg", ucumCode: "ug", unitCategoryId: "Weight", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Calories", abbreviatedName: "kcal", ucumCode: "kcal", unitCategoryId: "Energy", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Steps", abbreviatedName: "steps", ucumCode: "{step}", unitCategoryId: "Count", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Beats Per Minute", abbreviatedName: "bpm", ucumCode: "{beat}/min", unitCategoryId: "Frequency", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: false },
    { name: "Yes/No", abbreviatedName: "yes/no", ucumCode: "{boolean}", unitCategoryId: "Rating", scale: MeasurementScale.NOMINAL, fillingType: FillingType.ZERO, manualTracking: true, minimumValue: 0, maximumValue: 1 },
    { name: "Millimeters of Mercury", abbreviatedName: "mmHg", ucumCode: "mm[Hg]", unitCategoryId: "Pressure", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Degrees Fahrenheit", abbreviatedName: "°F", ucumCode: "[degF]", unitCategoryId: "Temperature", scale: MeasurementScale.INTERVAL, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Degrees Celsius", abbreviatedName: "°C", ucumCode: "Cel", unitCategoryId: "Temperature", scale: MeasurementScale.INTERVAL, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Index", abbreviatedName: "index", ucumCode: "{index}", unitCategoryId: "Rating", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: false },
    { name: "Milligrams per Deciliter", abbreviatedName: "mg/dL", ucumCode: "mg/dL", unitCategoryId: "Concentration", scale: MeasurementScale.RATIO, fillingType: FillingType.NONE, manualTracking: true },
    { name: "Meters", abbreviatedName: "m", ucumCode: "m", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Kilometers", abbreviatedName: "km", ucumCode: "km", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
    { name: "Miles", abbreviatedName: "mi", ucumCode: "[mi_i]", unitCategoryId: "Distance", scale: MeasurementScale.RATIO, fillingType: FillingType.ZERO, manualTracking: true },
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
      parentJurisdictionId: us.id,
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

async function seedWishocraticItems() {
  console.log("💰 Seeding Optimitron budget categories...");

  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { code: US_WISHOCRATIC_JURISDICTION.code },
    select: { id: true },
  });

  if (!jurisdiction) {
    throw new Error(
      `Cannot seed Wishocratic items before jurisdiction ${US_WISHOCRATIC_JURISDICTION.code} exists.`,
    );
  }

  const catalogRecords = Object.values(getUSWishocraticCatalogRecords());

  for (const record of catalogRecords) {
    await prisma.wishocraticItem.upsert({
      where: { id: record.id },
      update: {
        name: record.name,
        description: record.description,
        sourceUrl: record.sourceUrl,
        currentAllocationUsd: record.currentAllocationUsd,
        currentAllocationPct: record.currentAllocationPct,
        active: true,
        jurisdictionId: jurisdiction.id,
      },
      create: {
        id: record.id,
        name: record.name,
        description: record.description,
        sourceUrl: record.sourceUrl,
        currentAllocationUsd: record.currentAllocationUsd,
        currentAllocationPct: record.currentAllocationPct,
        active: true,
        jurisdictionId: jurisdiction.id,
      },
    });
  }

  console.log(`  ✅ ${catalogRecords.length} Optimitron budget categories`);
}

// ============================================================================
// MAIN
// ============================================================================

export interface SeedDatabaseOptions {
  scopes?: SeedScope[];
}

async function seedReferendums() {
  console.log("🗳️  Seeding referendums...");

  const treatyReferendumData = {
    title: "The 1% Treaty",
    slug: TREATY_REFERENDUM_SLUG,
    description:
      "Should your government redirect 1% of military spending to pragmatic clinical trials? " +
      "The 1% Treaty would fund evidence-based health optimization at a fraction of current costs. " +
      "Every verified vote makes pluralistic ignorance harder to maintain.",
    status: ReferendumStatus.ACTIVE,
  } satisfies Prisma.ReferendumUncheckedCreateInput;

  await prisma.referendum.upsert({
    where: { slug: TREATY_REFERENDUM_SLUG },
    update: treatyReferendumData,
    create: treatyReferendumData,
  });
  console.log("  ✓ 1% Treaty referendum");

  const declarationReferendumData = {
    title: "Declaration of Optimization",
    slug: DECLARATION_REFERENDUM_SLUG,
    description:
      "Sign the Declaration of Optimization to declare your support for evidence-based governance.",
    status: ReferendumStatus.ACTIVE,
  } satisfies Prisma.ReferendumUncheckedCreateInput;

  await prisma.referendum.upsert({
    where: { slug: DECLARATION_REFERENDUM_SLUG },
    update: declarationReferendumData,
    create: declarationReferendumData,
  });
  console.log("  ✓ Declaration of Optimization referendum");
}

export async function seedReferenceData() {
  const unitMap = await seedUnits();
  const catMap = await seedVariableCategories(unitMap);
  await seedGlobalVariables(unitMap, catMap);
  await seedJurisdictions();
  await seedWishocraticItems();
}

export async function seedBootstrapData() {
  await seedReferendums();
}

export async function seedDemoData() {
  await seedDemoUser();
}

export async function seedDatabase(options: SeedDatabaseOptions = {}) {
  const scopes = normalizeSeedScopes(options.scopes);

  console.log(`🌱 Starting Optimitron seed (${scopes.join(", ")})...\n`);

  if (scopes.includes("reference")) {
    await seedReferenceData();
  }

  if (scopes.includes("bootstrap")) {
    await seedBootstrapData();
  }

  if (scopes.includes("demo")) {
    await seedDemoData();
  }

  if (scopes.includes("tasks")) {
    await seedTreatyTasks();
  }

  console.log("\n🎉 Seed complete!");
}

// ---------------------------------------------------------------------------
// Treaty Tasks — parent task + per-country signer subtasks with impact data
// ---------------------------------------------------------------------------

// Due date is an absolute historical anchor — yesterday relative to when the
// dashboard was last reviewed — so the overdue clock keeps ticking up from a
// fixed point instead of resetting to "1 day" on every seed.
const TREATY_DUE_AT = new Date("2026-04-14T00:00:00.000Z");
const TREATY_CAMPAIGN_COST_USD = 1_000_000_000; // $1B lobbying campaign

// Peace-dividend NPV using a growing perpetuity with the standard UK Treasury
// Green Book / IPCC AR6 social discount rate (r=3%) and long-run real GDP
// growth (g=2%). NPV = C₀ / (r − g). Under historical military-spending growth
// (~4% real) the sum diverges — see task description for the rebuttal.
const TREATY_PEACE_DIVIDEND_DISCOUNT_RATE = 0.03;
const TREATY_PEACE_DIVIDEND_GROWTH_RATE = 0.02;
const TREATY_PEACE_DIVIDEND_NPV =
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT.value /
  (TREATY_PEACE_DIVIDEND_DISCOUNT_RATE - TREATY_PEACE_DIVIDEND_GROWTH_RATE);

// Sentinel value representing −∞. Float64 supports Infinity but Postgres
// round-trips can be flaky, so we use a finite-but-absurd magnitude that the
// formatter detects via threshold (anything below −1e17 renders as "−∞").
const TREATY_INFINITE_NEGATIVE_COST = -1e18;
const TREATY_NET_COST_USD = TREATY_INFINITE_NEGATIVE_COST;

// 30 seconds per signature × 193 leaders = 5,790 seconds ≈ 1.61 hours.
const TREATY_SECONDS_PER_SIGNATURE = 30;
const TREATY_TOTAL_EFFORT_HOURS =
  (WORLD_LEADERS.length * TREATY_SECONDS_PER_SIGNATURE) / 3600;
const TREATY_PER_SIGNER_EFFORT_HOURS = TREATY_SECONDS_PER_SIGNATURE / 3600;

async function seedTreatyTasks() {
  console.log("📋 Seeding treaty tasks...");

  // Load the leader photo manifest from public/images/leaders/manifest.json.
  // Generated by `tsx packages/web/scripts/download-leader-photos.ts`.
  // Maps lowercase ISO2 country code → local image path. If a leader has no
  // entry we fall back to the remote Wikimedia URL (OG rendering may break
  // for those tasks, but the detail page will still load the image).
  let leaderPhotoManifest: Record<string, string> = {};
  try {
    const manifestPath = new URL(
      "../../web/public/images/leaders/manifest.json",
      import.meta.url,
    );
    const { readFileSync: readFile } = await import("node:fs");
    const raw = readFile(manifestPath, "utf8");
    leaderPhotoManifest = JSON.parse(raw) as Record<string, string>;
    console.log(
      `  📸 Loaded ${Object.keys(leaderPhotoManifest).length} local leader photos from manifest`,
    );
  } catch (err) {
    console.log(
      `  ⚠️  No leader photo manifest found — using remote Wikimedia URLs (run 'tsx scripts/download-leader-photos.ts' to cache locally). Error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Clean up ghost signer tasks from the legacy parallel pipeline
  // (sync-treaty-signers.ts / treaty-signer-network.ts) that used ISO3 ids and
  // fell back to "Head of government of {country}" for displayName when a real
  // leader name was missing. seed.ts uses ISO2 ids and real WORLD_LEADERS
  // names. Delete the junk set so the list page renders the real leaders.
  const deletedGhostTasks = await prisma.task.deleteMany({
    where: {
      taskKey: { startsWith: "program:one-percent-treaty:signer:" },
    },
  });
  if (deletedGhostTasks.count > 0) {
    console.log(`  🧹 Cleared ${deletedGhostTasks.count} existing signer tasks for clean reseed`);
  }

  // Neutralize any Person records whose displayName is the junk fallback.
  // Can't delete them directly (may be referenced by other tables) — just
  // rename so they stop rendering on list pages as the task's assignee.
  const renamedGhostPersons = await prisma.person.updateMany({
    where: { displayName: { startsWith: "Head of government of " } },
    data: { displayName: "Unknown Head of Government" },
  });
  if (renamedGhostPersons.count > 0) {
    console.log(`  🧹 Neutralized ${renamedGhostPersons.count} ghost leader person records`);
  }

  // Create "Humanity" organization as assignee for top-level tasks
  const humanityOrgData = {
    name: "Humanity",
    slug: "humanity",
    type: "OTHER",
    status: "APPROVED",
    description: "All 8 billion of us.",
  } satisfies Prisma.OrganizationUncheckedCreateInput;

  const humanity = await prisma.organization.upsert({
    where: { slug: "humanity" },
    update: humanityOrgData,
    create: humanityOrgData,
  });

  // Seed Wishonia as a regular User + Person so she can author task comments,
  // claim tasks, show up on /people/wishonia, etc. No special system-user flag.
  await seedWishoniaUser();

  // Lifetime impact from parameters (total civilizational acceleration, not annual)
  const totalDalys = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value; // 565B DALYs
  const totalEconValue = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value; // $84.8Q
  const accelerationYears = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value; // 212 years
  const annualAvoidableDalys = GLOBAL_ANNUAL_DALY_BURDEN.value * EVENTUALLY_AVOIDABLE_DALY_PCT.value; // 2.67B/yr
  const delayDalysPerDay = annualAvoidableDalys / 365;
  const delayEconPerDay = delayDalysPerDay * 150_000; // $150K/QALY standard valuation
  const annualFunding = TREATY_ANNUAL_FUNDING.value; // $27.2B/yr
  const dfdaDirectFundingNpv = DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV.value; // $475.7B

  // Helper to render a parameter value as a markdown link to its calculation source
  const p = (param: { calculationsUrl?: string }, label: string) =>
    param.calculationsUrl ? `[${label}](${param.calculationsUrl})` : label;

  // --- Root: Promote the General Welfare ---
  // The literal constitutional job description of every government on Earth.
  // Walking up the parent chain from any claimable task should land a visitor
  // on the sentence every political charter already promised.
  const { hale, medianIncome } = earthOptimizationPrizeWinCondition;
  const prizeRootTask = await createTaskWithImpact({
    task: {
      // Internal id + taskKey kept stable so nothing else breaks. The label is
      // what the user sees.
      id: "win-earth-optimization-prize",
      taskKey: "program:earth-optimization-prize:win",
      assigneeOrganizationId: humanity.id,
      title: "Promote the General Welfare",
      description: [
        `Every government on Earth has a version of this sentence in its founding charter. The US Constitution says "promote the general Welfare." Every other country says something equivalent. It is the literal job description of the 193 governments you pay **\\$44 trillion a year** to run.`,
        "",
        `Two numbers measure whether they are doing it: **median healthy life years** (currently **${hale.baseline.toFixed(1)}**, target **${hale.target.toFixed(1)}**) and **median real after-tax income** (currently **\\$${Math.round(medianIncome.baseline).toLocaleString()}**, target **\\$${Math.round(medianIncome.target).toLocaleString()}**). Both should be rising. Both are not.`,
        "",
        `The jobs below are the concrete to-do items under this one sentence. They are all overdue.`,
        "",
        "- **Ratify the 1% Treaty** — redirect 1% of military spending into pragmatic clinical trials. Blocked by 193 signatures. Each signature takes 30 seconds.",
        "- **Create the Decentralized FDA** — build trial infrastructure independent of politics.",
        "- **Fund the Bed Nets Gap** — the most cost-effective marginal-life intervention currently on offer.",
        "",
        `Read the measurement methodology in [the manual](${earthOptimizationPrizeWinCondition.manualUrl}) and the [GDP trajectories](${earthOptimizationPrizeWinCondition.gdpTrajectoriesUrl}).`,
      ].join("\n"),
      category: "GOVERNANCE",
      difficulty: "EXPERT",
      status: "ACTIVE",
      isPublic: true,
      dueAt: EARTH_OPTIMIZATION_PRIZE_DEADLINE,
      sortOrder: -1000,
      skillTags: ["strategy", "coordination"],
      interestTags: ["earth-optimization-prize", "hale", "median-income"],
      claimPolicy: "OPEN_MANY",
    },
    impact: {
      // Cost of the root is the sentinel for "whatever the children cost" —
      // the aggregate is computed from children on read. Using 0 here; real
      // accounting lives on the program-level children.
      estimatedCashCostUsdBase: 0,
      expectedEconomicValueUsdBase: totalEconValue,
      expectedDalysAvertedBase: totalDalys,
      delayEconomicValueUsdLostPerDayBase: delayEconPerDay,
      delayDalysLostPerDayBase: delayDalysPerDay,
      successProbabilityBase: 0.05,
      benefitDurationYears: accelerationYears,
      medianHealthyLifeYearsEffectBase: hale.deltaRequired,
      medianIncomeGrowthEffectPpPerYearBase:
        EARTH_OPTIMIZATION_PRIZE_INCOME_GROWTH_EFFECT_PP_PER_YEAR,
    },
    methodologyKey: "earth-optimization-prize-win-condition",
    calculationsUrl: earthOptimizationPrizeWinCondition.manualUrl,
  });
  console.log(`  ✓ Task: "${prizeRootTask.title}" (${prizeRootTask.id})`);

  // --- Task 1: Ratify the 1% Treaty ---
  const treatyTask = await createTaskWithImpact({
    task: {
      id: "1-pct-treaty",
      taskKey: "program:one-percent-treaty:ratify",
      parentTaskId: prizeRootTask.id,
      assigneeOrganizationId: humanity.id,
      title: "Ratify the 1% Treaty",
      description: [
        `Your governments collected **\\$${(annualFunding / 0.01 / 1e12).toFixed(2)} trillion** from you this year and spent it on weapons. Enough weapons to kill every person on Earth several times over. Killing everyone once is sufficient.`,
        "",
        `The 1% Treaty redirects **one cent on the dollar** — \\$${(annualFunding / 1e9).toFixed(1)}B/year — into pragmatic clinical trials. That accelerates the cure for the average disease by **${Math.round(accelerationYears)} years** and saves **${(totalDalys / 1e9).toFixed(0)} billion** healthy life-years.`,
        "",
        `Every day this stays unsigned locks in **~180,000 future preventable deaths**. The cost of the treaty itself, net of the peace dividend, is **\\$−∞**. [See methodology](https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html).`,
        "",
        "## What to do (5 minutes)",
        "",
        "1. **Sign the treaty** at [/treaty](/treaty).",
        "2. **Share your referral link** from your [dashboard](/dashboard).",
        "3. **Pick a leader from the list below** and message them. Use the contact link.",
        "4. *(Optional)* **Fund the campaign** at the [Earth Optimization Prize](/prize) — your principal earns yield if it fails. Zero downside.",
        "",
        "Then come back and mark this task complete.",
      ].join("\n"),
      category: "GOVERNANCE",
      difficulty: "EXPERT",
      status: "ACTIVE",
      isPublic: true,
      dueAt: TREATY_DUE_AT,
      sortOrder: -100,
      skillTags: ["organizing", "diplomacy", "public-pressure"],
      interestTags: ["treaty", "disease-eradication", "peace-dividend"],
      claimPolicy: "OPEN_MANY",
      estimatedEffortHours: TREATY_TOTAL_EFFORT_HOURS,
      contextJson: {
        unlocks: [
          {
            kind: "inline",
            icon: "🔓",
            title: "12× More Clinical Trials",
            summary: "Pragmatic trial infrastructure funded by the redirect. Same patients, same hospitals, same data. 44 times cheaper because nobody optimized the expensive version — because nobody's job depended on it.",
            beforeAfter: [
              { label: "Patients/yr", before: "1,900,000", after: "23,400,000" },
              { label: "Cost/patient", before: "$41,000", after: "$929" },
              { label: "Trial queue", before: "443 years", after: "36 years" },
              { label: "Untested diseases", before: "9,000+", after: "0" },
            ],
            roiRatio: 45,
          },
          {
            kind: "inline",
            icon: "🔓",
            title: "Approve Safe Treatments 8 Years Faster",
            summary: "Treatments currently wait 8.2 years after being proven safe. They sit in a cabinet. Being safe. While 102 million people died waiting.",
          },
          {
            kind: "inline",
            icon: "🌍",
            title: "If All 193 Governments Sign",
            summary: "Lifetime gains per median human if the full treaty passes. Cost: 1% of the explosion budget.",
            beforeAfter: [
              { label: "Healthy lifespan", before: "63.3 yrs", after: "85.0 yrs" },
              { label: "Median income", before: "$18,700", after: "$76,700" },
              { label: "Lives saved by 2040", before: "—", after: "10.7 billion" },
            ],
          },
        ],
        contextComparisons: [
          {
            heading: "Things that take longer than 30 seconds",
            items: [
              { label: "Making toast", value: "120 seconds" },
              { label: "COVID vaccine development", value: "314 days" },
              { label: "Manhattan Project", value: "1,347 days" },
              { label: "This treaty not being signed", value: "and counting", highlight: true },
            ],
          },
          {
            heading: "Things that take 30 seconds",
            items: [
              { label: "Signing the 1% Treaty", value: "30s" },
              { label: "Tying a shoe", value: "30s" },
              { label: "Sending a tweet shaming a world leader", value: "30s" },
            ],
          },
        ],
      } satisfies Prisma.InputJsonValue,
    },
    impact: {
      estimatedCashCostUsdBase: TREATY_NET_COST_USD,
      expectedEconomicValueUsdBase: totalEconValue,
      expectedDalysAvertedBase: totalDalys,
      delayEconomicValueUsdLostPerDayBase: delayEconPerDay,
      delayDalysLostPerDayBase: delayDalysPerDay,
      successProbabilityBase: 0.01,
      benefitDurationYears: accelerationYears,
    },
    methodologyKey: "treaty-lifetime-parameters",
    calculationsUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  });
  console.log(`  ✓ Task: "${treatyTask.title}" (${treatyTask.id})`);

  // --- Task 2: Create the Decentralized FDA ---
  const dfdaTask = await createTaskWithImpact({
    task: {
      id: "dfda",
      taskKey: "program:dfda:create",
      parentTaskId: prizeRootTask.id,
      assigneeOrganizationId: humanity.id,
      title: "12× More Clinical Trials",
      description: [
        `Build and fund a **decentralized FDA platform** that runs pragmatic clinical trials at **12.3× current capacity**, accelerating the cure for the average disease by ${p(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS, `**${Math.round(accelerationYears)} years**`)} — the same impact as the 1% Treaty, but without political dependency.`,
        "",
        `Requires ${p(DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV, `**$${(dfdaDirectFundingNpv / 1e9).toFixed(0)}B NPV**`)} in direct funding (vs $${(TREATY_CAMPAIGN_COST_USD / 1e9).toFixed(0)}B for the treaty lobbying campaign). Higher total cost, but far higher probability of success because it does not require 100+ governments to agree.`,
        "",
        "## How to Complete",
        "",
        "Claim this task if you are actively contributing to the decentralized FDA. Mark it complete when you have done your part.",
        "",
        "**1. Engineers**: read the [dFDA spec](https://dfda-spec.warondisease.org) and contribute to the reference implementation.",
        "",
        "**2. Funders**: back the $475.7B NPV directly, or deposit to the [Earth Optimization Prize](/prize) which doubles as interim funding.",
        "",
        "**3. Clinicians and trial operators**: join the dFDA network as a pragmatic-trial site.",
        "",
        "**4. Everyone else**: share the plan. Grab your referral link from your [dashboard](/dashboard) and spread it. The dFDA is an independent path forward — it does not depend on the 1% Treaty, and the two efforts reinforce each other.",
      ].join("\n"),
      category: "GOVERNANCE",
      difficulty: "EXPERT",
      status: "ACTIVE",
      isPublic: true,
      sortOrder: -90,
      skillTags: ["engineering", "fundraising", "clinical-trials"],
      interestTags: ["dfda", "disease-eradication", "clinical-trials"],
      claimPolicy: "OPEN_MANY",
    },
    impact: {
      estimatedCashCostUsdBase: dfdaDirectFundingNpv,
      expectedEconomicValueUsdBase: totalEconValue,
      expectedDalysAvertedBase: totalDalys,
      delayEconomicValueUsdLostPerDayBase: delayEconPerDay,
      delayDalysLostPerDayBase: delayDalysPerDay,
      successProbabilityBase: 0.10,
      benefitDurationYears: accelerationYears,
    },
    methodologyKey: "dfda-direct-lifetime-parameters",
    calculationsUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  });
  console.log(`  ✓ Task: "${dfdaTask.title}" (${dfdaTask.id})`);

  // --- Task 3: Fund the bed nets funding gap (benchmark/competing task) ---
  // Numbers from GiveWell's published analysis of Against Malaria Foundation:
  // - ~$5,500 per death averted (2024 marginal cost)
  // - ~$1B annual funding gap to reach universal coverage in sub-Saharan Africa
  // - ~200K preventable malaria deaths/year at full coverage
  // - Children under 5 are ~80% of deaths; avg ~40 healthy life-years per death averted
  // Source: https://www.givewell.org/charities/amf
  const AMF_ANNUAL_FUNDING_GAP = 1_000_000_000; // $1B/yr
  const AMF_ANNUAL_LIVES_SAVED = 182_000; // at full funding
  const AMF_QALY_PER_LIFE = 40; // avg remaining life for a child under 5
  const AMF_ANNUAL_HEALTHY_YEARS_SAVED = AMF_ANNUAL_LIVES_SAVED * AMF_QALY_PER_LIFE; // ~7.28M/yr
  const AMF_ECON_VALUE_PER_QALY = 150_000;
  const AMF_ANNUAL_ECON_VALUE = AMF_ANNUAL_HEALTHY_YEARS_SAVED * AMF_ECON_VALUE_PER_QALY;
  const AMF_BENEFIT_DURATION_YEARS = 20; // assume 20yr of continued funding
  const AMF_TOTAL_HEALTHY_YEARS = AMF_ANNUAL_HEALTHY_YEARS_SAVED * AMF_BENEFIT_DURATION_YEARS;
  const AMF_TOTAL_ECON_VALUE = AMF_ANNUAL_ECON_VALUE * AMF_BENEFIT_DURATION_YEARS;
  const AMF_TOTAL_COST = AMF_ANNUAL_FUNDING_GAP * AMF_BENEFIT_DURATION_YEARS;

  const amfOrgData = {
    name: "Against Malaria Foundation",
    slug: "against-malaria-foundation",
    type: "NONPROFIT",
    status: "APPROVED",
    description: "Distributes long-lasting insecticide-treated bed nets in sub-Saharan Africa. GiveWell's top-rated charity for cost-effective disease prevention.",
    website: "https://www.againstmalaria.com",
  } satisfies Prisma.OrganizationUncheckedCreateInput;

  const amfOrg = await prisma.organization.upsert({
    where: { slug: "against-malaria-foundation" },
    update: amfOrgData,
    create: amfOrgData,
  });

  const bedNetsTask = await createTaskWithImpact({
    task: {
      id: "bed-nets-funding-gap",
      taskKey: "program:amf:bed-nets-funding-gap",
      parentTaskId: prizeRootTask.id,
      assigneeOrganizationId: amfOrg.id,
      title: "Fund the Bed Nets Funding Gap",
      description: [
        `Close the **~$1B/year funding gap** for bed net distribution in sub-Saharan Africa. Full funding would save approximately **182,000 lives per year** — overwhelmingly children under 5 — at a marginal cost of roughly **$5,500 per life saved**.`,
        "",
        `Bed nets remain the most thoroughly studied, most-trusted cost-effective health intervention in the world. This task exists on the list so you can see exactly how it ranks against everything else. Sort by **Cost per Healthy Year** and see where it falls.`,
        "",
        "## How to Complete",
        "",
        "**1. Donate directly** at [Against Malaria Foundation](https://www.againstmalaria.com/Donation.aspx).",
        "",
        "**2. Verify via GiveWell** — they publish independent cost-effectiveness analysis and track every funding gap: [GiveWell AMF page](https://www.givewell.org/charities/amf).",
        "",
        "**3. Mark this task complete** with evidence of your contribution.",
        "",
        "## Context",
        "",
        "Approximately 600,000 people die of malaria each year, roughly 80% of them children under 5 in sub-Saharan Africa. Bed nets at current coverage prevent millions of cases annually, but coverage has plateaued around 60-70% because the marginal net requires reaching harder-to-serve populations. The remaining gap is real, absorbable, and well-studied.",
      ].join("\n"),
      category: "GOVERNANCE",
      difficulty: "BEGINNER",
      status: "ACTIVE",
      isPublic: true,
      sortOrder: -80,
      skillTags: ["fundraising", "global-health"],
      interestTags: ["malaria", "bed-nets", "global-health", "givewell"],
      claimPolicy: "OPEN_MANY",
      contactLabel: "Donate to AMF",
      contactUrl: "https://www.againstmalaria.com/Donation.aspx",
    },
    impact: {
      estimatedCashCostUsdBase: AMF_TOTAL_COST,
      expectedEconomicValueUsdBase: AMF_TOTAL_ECON_VALUE,
      expectedDalysAvertedBase: AMF_TOTAL_HEALTHY_YEARS,
      delayEconomicValueUsdLostPerDayBase: AMF_ANNUAL_ECON_VALUE / 365,
      delayDalysLostPerDayBase: AMF_ANNUAL_HEALTHY_YEARS_SAVED / 365,
      successProbabilityBase: 0.95, // very high — well-studied intervention
      benefitDurationYears: AMF_BENEFIT_DURATION_YEARS,
    },
    methodologyKey: "amf-givewell-marginal-analysis",
    calculationsUrl: "https://www.givewell.org/charities/amf/supplementary-information",
  });
  console.log(`  ✓ Task: "${bedNetsTask.title}" (${bedNetsTask.id})`);

  // --- Signer child tasks for the treaty ---
  // Single source of truth: GovernmentLeaderRecord bundles country identity,
  // canonical office/contact metadata, leader personal data, and both
  // military + total-gov budgets (resolved from the coalesced country panel
  // + curated overrides; guaranteed non-null).
  const leaderRecords = listGovernmentLeaders().filter(
    (record) => record.leaderSourceRef != null && record.leaderName != null,
  );
  const skippedLeaderCount = listGovernmentLeaders().length - leaderRecords.length;
  if (skippedLeaderCount > 0) {
    console.log(
      `  ! skipping ${skippedLeaderCount} leader record(s) missing leaderSourceRef/leaderName`,
    );
  }
  const leaderCount = leaderRecords.length;
  const formatUsdCompact = (n: number): string => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${Math.round(n).toLocaleString()}`;
  };
  const googleSearch = (query: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  let created = 0;

  for (const record of leaderRecords) {
    // leaderSourceRef/leaderName are non-null by the filter above.
    const sourceRef = record.leaderSourceRef!;
    const leaderName = record.leaderName!;
    const countryCode = record.countryCode.toUpperCase();
    const share = 1 / leaderCount;
    // Slugified handle from displayName, with country code suffix to guarantee
    // uniqueness across the 193 leaders. Lower-case, hyphen-separated, ASCII.
    const handle = `${slugify(leaderName)}-${countryCode.toLowerCase()}`;
    const leaderImage =
      leaderPhotoManifest[countryCode.toLowerCase()] ?? record.leaderImageUrl;

    const person = await prisma.person.upsert({
      where: { sourceRef },
      update: {
        handle,
        displayName: leaderName,
        image: leaderImage,
        countryCode,
        currentAffiliation: `Government of ${record.countryName}`,
        isPublicFigure: true,
      },
      create: {
        handle,
        displayName: leaderName,
        image: leaderImage,
        countryCode,
        currentAffiliation: `Government of ${record.countryName}`,
        isPublicFigure: true,
        sourceRef,
      },
    });

    const annualRedirectUsd = record.militaryBudgetUsd * 0.01;

    const contactChannels: Array<{ kind: "twitter" | "bluesky" | "form"; label: string; href: string }> = [
      {
        kind: "twitter",
        label: `Remind on X directly`,
        href: googleSearch(`${leaderName} official X Twitter account`),
      },
      {
        kind: "bluesky",
        label: `Remind on Bluesky directly`,
        href: googleSearch(`${leaderName} Bluesky account site:bsky.app`),
      },
    ];
    if (record.contactUrl) {
      contactChannels.push({
        kind: "form",
        label: record.contactLabel ?? "Official contact form",
        href: record.contactUrl,
      });
    }

    const signerContextJson: Prisma.InputJsonValue = {
      assigneeProfile: {
        role: record.roleTitle,
        employerLabel: `Government of ${record.countryName}`,
        employerCountLabel: "citizens",
        budgetUsdPerYear: record.militaryBudgetUsd,
        budgetLabel: "Military spending",
        governmentBudgetUsdPerYear: record.governmentBudgetUsd,
        jobQuote: {
          text: "promote the general welfare",
          source: `${record.countryName} — job description, every citizen, every day`,
        },
        contactChannels,
      },
      difficulty: {
        whatItMeans: `Redirect 1% of ${record.countryName}'s military spending (${formatUsdCompact(annualRedirectUsd)}/yr) from weapons to pragmatic clinical trials.`,
        label: "Sign a piece of paper",
        timeRequiredSeconds: 30,
        skillsRequired: "Holding a pen",
      },
      reminder: {
        intro: `30 seconds. Remind them.`,
        messageTemplate: [
          `${leaderName} is {daysOverdue} days overdue on "Sign the 1% Treaty".`,
          ``,
          `Task: hold pen, sign paper. 30 seconds.`,
          `Cost of the delay so far: {deathsLocked} preventable deaths, {moneyDestroyed} in foregone clinical trials.`,
          `Job description: "promote the general welfare."`,
          ``,
          `{taskUrl}`,
        ].join("\n"),
      },
      contextComparisons: [
        {
          heading: "Things that take longer than 30 seconds",
          items: [
            { label: "Making toast", value: "120 seconds" },
            { label: "Developing the COVID vaccine", value: "314 days" },
            { label: "The Manhattan Project", value: "1,347 days" },
            {
              label: `${leaderName} not signing this`,
              value: "{daysOverdue} days",
              highlight: true,
            },
          ],
        },
        {
          heading: "Things that take 30 seconds",
          items: [
            { label: "Signing the 1% Treaty", value: "30s" },
            { label: "Tying a shoe", value: "30s" },
            { label: "Sending a tweet", value: "30s" },
          ],
        },
      ],
    };

    await createTaskWithImpact({
      task: {
        id: `1-pct-treaty-signer-${countryCode.toLowerCase()}`,
        taskKey: `program:one-percent-treaty:signer:${countryCode.toLowerCase()}`,
        parentTaskId: treatyTask.id,
        assigneePersonId: person.id,
        assigneeAffiliationSnapshot: `Government of ${record.countryName}`,
        roleTitle: record.roleTitle,
        title: "Sign the 1% Treaty",
        description: `**${leaderName}** — ${record.roleTitle} of ${record.countryName}. One job: redirect 1% of ${record.countryName}'s military spending into pragmatic clinical trials. Overdue.`,
        category: "GOVERNANCE",
        difficulty: "EXPERT",
        status: "ACTIVE",
        isPublic: true,
        dueAt: TREATY_DUE_AT,
        claimPolicy: "ASSIGNED_ONLY",
        skillTags: ["diplomacy", "public-pressure"],
        interestTags: ["treaty", "disease-eradication", `country-${countryCode.toLowerCase()}`],
        estimatedEffortHours: TREATY_PER_SIGNER_EFFORT_HOURS,
        contextJson: signerContextJson,
      },
      impact: {
        // Cost stays at the −∞ sentinel for every signer — splitting infinity
        // is still infinity.
        estimatedCashCostUsdBase: TREATY_NET_COST_USD,
        expectedEconomicValueUsdBase: totalEconValue * share,
        expectedDalysAvertedBase: totalDalys * share,
        delayEconomicValueUsdLostPerDayBase: delayEconPerDay * share,
        delayDalysLostPerDayBase: delayDalysPerDay * share,
        successProbabilityBase: 0.01,
        benefitDurationYears: accelerationYears,
      },
      methodologyKey: "treaty-per-country-lifetime",
      parameterSetHashSuffix: countryCode,
    });

    created += 1;
  }

  console.log(`  ✓ ${created} signer tasks with leader photos`);
}

const WISHONIA_EMAIL = "wishonia@gmail.com";
const WISHONIA_USERNAME = "wishonia";
const WISHONIA_DISPLAY_NAME = "Wishonia";
const WISHONIA_AFFILIATION =
  "World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation";
const WISHONIA_IMAGE = "/sprites/wishonia/smirk-smile.png";

/**
 * Seed Wishonia as a regular user with a linked Person record. This lets her:
 * - Author task comments under her own user ID (no fake system-user hack)
 * - Be assigned tasks via `assigneePersonId`
 * - Own tasks via `ownerUserId`
 * - Show up on /people/wishonia exactly like any public figure
 *
 * Idempotent. Safe to re-run.
 */
async function seedWishoniaUser() {
  console.log("🛸 Seeding Wishonia user...");

  // Upsert the Person first so we can link the User to it.
  const sourceRef = "wishonia:system";
  const person = await prisma.person.upsert({
    where: { sourceRef },
    update: {
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublicFigure: true,
    },
    create: {
      sourceRef,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublicFigure: true,
    },
  });

  // Upsert the user by stable email and link to the Person.
  const user = await prisma.user.upsert({
    where: { email: WISHONIA_EMAIL },
    update: {
      name: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      person: { connect: { id: person.id } },
    },
    create: {
      email: WISHONIA_EMAIL,
      name: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      username: WISHONIA_USERNAME,
      emailVerified: new Date(),
      person: { connect: { id: person.id } },
    },
  });

  console.log(`  ✓ Wishonia user (${user.id}) + person (${person.id}) handle=${person.handle}`);
}

/**
 * Helper: upsert a task + impact estimate set + LIFETIME frame.
 * Idempotent — safe to re-run after changing description/impact values without
 * losing existing claims, edges, or other task state.
 * Requires `task.id` to be set for upsert-by-id behavior.
 */
async function createTaskWithImpact(input: {
  task: Parameters<typeof prisma.task.create>[0]["data"] & { id: string };
  impact: {
    estimatedCashCostUsdBase: number;
    expectedEconomicValueUsdBase: number;
    expectedDalysAvertedBase: number;
    delayEconomicValueUsdLostPerDayBase: number;
    delayDalysLostPerDayBase: number;
    successProbabilityBase: number;
    benefitDurationYears: number;
    medianHealthyLifeYearsEffectBase?: number;
    medianIncomeGrowthEffectPpPerYearBase?: number;
  };
  methodologyKey: string;
  parameterSetHashSuffix?: string;
  calculationsUrl?: string;
}) {
  const { id: taskId, ...taskData } = input.task;

  // Prisma 7 requires relation syntax (not scalar FK fields) in both create and update.
  const {
    assigneeOrganizationId,
    assigneePersonId,
    parentTaskId,
    ...taskScalars
  } = taskData as typeof taskData & {
    assigneeOrganizationId?: string | null;
    assigneePersonId?: string | null;
    parentTaskId?: string | null;
  };
  const createRelations: Record<string, unknown> = {};
  const updateRelations: Record<string, unknown> = {};
  if (assigneeOrganizationId) {
    createRelations.assigneeOrganization = { connect: { id: assigneeOrganizationId } };
    updateRelations.assigneeOrganization = { connect: { id: assigneeOrganizationId } };
  } else if (assigneeOrganizationId === null) {
    updateRelations.assigneeOrganization = { disconnect: true };
  }
  if (assigneePersonId) {
    createRelations.assigneePerson = { connect: { id: assigneePersonId } };
    updateRelations.assigneePerson = { connect: { id: assigneePersonId } };
  } else if (assigneePersonId === null) {
    updateRelations.assigneePerson = { disconnect: true };
  }
  if (parentTaskId) {
    createRelations.parentTask = { connect: { id: parentTaskId } };
    updateRelations.parentTask = { connect: { id: parentTaskId } };
  } else if (parentTaskId === null) {
    updateRelations.parentTask = { disconnect: true };
  }

  // Upsert the task itself
  const task = await prisma.task.upsert({
    where: { id: taskId },
    create: { id: taskId, ...taskScalars, ...createRelations },
    update: { ...taskScalars, ...updateRelations },
  });

  // Delete old impact estimate sets for this task (cascade deletes frames/metrics)
  await prisma.taskImpactEstimateSet.deleteMany({
    where: { taskId: task.id },
  });

  // Create fresh estimate set
  const estimateSet = await prisma.taskImpactEstimateSet.create({
    data: {
      taskId: task.id,
      isCurrent: true,
      estimateKind: "FORECAST",
      publicationStatus: "PUBLISHED",
      sourceSystem: "PARAMETER_CATALOG",
      calculationVersion: "seed-v1",
      methodologyKey: input.methodologyKey,
      parameterSetHash: `seed${input.parameterSetHashSuffix ? `-${input.parameterSetHashSuffix}` : ""}`,
      counterfactualKey: "status-quo",
      assumptionsJson: input.calculationsUrl ? { calculationsUrl: input.calculationsUrl } : undefined,
    },
  });

  await prisma.task.update({
    where: { id: task.id },
    data: { currentImpactEstimateSetId: estimateSet.id },
  });

  await prisma.taskImpactFrameEstimate.create({
    data: {
      taskImpactEstimateSetId: estimateSet.id,
      frameKey: "LIFETIME",
      frameSlug: "lifetime",
      evaluationHorizonYears: input.impact.benefitDurationYears,
      timeToImpactStartDays: 365,
      adoptionRampYears: 5,
      benefitDurationYears: input.impact.benefitDurationYears,
      annualDiscountRate: 0,
      successProbabilityBase: input.impact.successProbabilityBase,
      expectedEconomicValueUsdBase: input.impact.expectedEconomicValueUsdBase,
      expectedDalysAvertedBase: input.impact.expectedDalysAvertedBase,
      delayEconomicValueUsdLostPerDayBase: input.impact.delayEconomicValueUsdLostPerDayBase,
      delayDalysLostPerDayBase: input.impact.delayDalysLostPerDayBase,
      estimatedCashCostUsdBase: input.impact.estimatedCashCostUsdBase,
      estimatedEffortHoursBase: 0.5,
      medianHealthyLifeYearsEffectBase: input.impact.medianHealthyLifeYearsEffectBase,
      medianIncomeGrowthEffectPpPerYearBase: input.impact.medianIncomeGrowthEffectPpPerYearBase,
    },
  });

  return task;
}

// ---------------------------------------------------------------------------
// Demo User — for hackathon judges and demo recordings
// ---------------------------------------------------------------------------
// Email: demo@optimitron.org  Password: demo1234

async function seedDemoUser() {
  console.log("👤 Seeding demo user...");

  // Pre-hashed bcrypt(12) of "demo1234"
  const DEMO_PASSWORD_HASH =
    "$2b$12$Hy27qJOTykSezth61xRCJ..sMPVvzWxs9wZEEsEsYn9o3GaUYkGCa";

  try {
    await prisma.user.upsert({
      where: { email: "demo@optimitron.org" },
      update: {
        name: "Demo User",
        password: DEMO_PASSWORD_HASH,
        username: "demo",
        emailVerified: new Date(),
      },
      create: {
        email: "demo@optimitron.org",
        name: "Demo User",
        password: DEMO_PASSWORD_HASH,
        username: "demo",
        emailVerified: new Date(),
        referralCode: "DEMO",
      },
    });
    console.log("  ✓ demo@optimitron.org / demo1234");
  } catch (err) {
    // If schema is out of sync, try raw SQL fallback
    console.log("  ⚠ upsert failed, trying raw SQL...");
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" (id, email, name, password, "referralCode", "emailVerified", "createdAt", "updatedAt")
      VALUES ('demo-user-id', 'demo@optimitron.org', 'Demo User', $1, 'DEMO', NOW(), NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = 'Demo User',
        password = $1,
        "emailVerified" = NOW(),
        "updatedAt" = NOW()
    `, DEMO_PASSWORD_HASH);
    console.log("  ✓ demo@optimitron.org / demo1234 (via raw SQL)");
  }
}

export async function disconnectSeedClient() {
  await prisma.$disconnect();
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  Promise.resolve()
    .then(() => seedDatabase({ scopes: parseSeedScopes(process.argv.slice(2)) }))
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectSeedClient();
    });
}
