import {
  CombinationOperation,
  FillingType,
  Valence,
} from "../../src/generated/prisma/enums.js";

export type GlobalVariableSeedRecord = {
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

export const GLOBAL_VARIABLE_SEED_DATA: GlobalVariableSeedRecord[] = [
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
