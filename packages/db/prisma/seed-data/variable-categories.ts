import { CombinationOperation } from "../../src/generated/prisma/enums.js";

export type VariableCategorySeedRecord = {
  name: string;
  description: string;
  combinationOperation: CombinationOperation;
  onsetDelay: number;
  durationOfAction: number;
  predictorOnly: boolean;
  outcome: boolean | null;
  defaultUnitAbbr: string;
};

// Defines per-category defaults. fillingType/fillingValue are documented here
// for reference but applied at the GlobalVariable level.
export const VARIABLE_CATEGORY_SEED_DATA: VariableCategorySeedRecord[] = [
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
