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
  EvidenceGrade,
  FillingType,
  InterventionRankingRunStatus,
  Valence,
  MeasurementScale,
  JurisdictionType,
  PersonConditionStatus,
  PersonLifeStatus,
  ReferendumKind,
  ReferendumStatus,
  ReferendumVoteSource,
  TaskCommunicationEndpointKind,
  TaskCommunicationEndpointVerificationStatus,
  VariableEvidenceMetricKind,
  VariableRelationshipEvidenceSourceType,
  VotePosition,
  type Prisma,
} from "../src/generated/prisma/client.js";
import {
  TREATY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
} from "../src/constants.js";
import {
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
} from "../src/task-keys.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  US_WISHOCRATIC_JURISDICTION,
  getUSWishocraticCatalogRecords,
  listGovernmentLeaders,
} from "@optimitron/data";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import {
  getAllConditions,
  getAllTreatments,
  type TreatmentWithConditions,
} from "@optimitron/data/datasets/medical";
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
  shareableSnippets,
} from "@optimitron/data/parameters";
import { WORLD_LEADERS } from "@optimitron/data/datasets/world-leaders";
import {
  normalizeSeedScopes,
  parseSeedScopes,
  type SeedScope,
} from "./seed-scopes.ts";
import { seedReasoningData } from "./seed-reasoning.ts";
import { loadDatabaseUrl } from "../src/db-cli.ts";
import { GLOBAL_VARIABLE_SEED_DATA } from "./seed-data/global-variables.ts";
import { VARIABLE_CATEGORY_SEED_DATA } from "./seed-data/variable-categories.ts";

const adapter = new PrismaPg({ connectionString: loadDatabaseUrl() });
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

function normalizeReferendumContentText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: normalizeReferendumContentText(input.description),
        bodyMarkdown: normalizeReferendumContentText(input.bodyMarkdown),
      }),
    )
    .digest("hex");
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

function splitExternalCodes(rawCodes: string | null): string[] {
  if (!rawCodes) return [];

  return Array.from(
    new Set(
      rawCodes
        .split(/[;,]/u)
        .map((code) => code.trim())
        .filter(Boolean),
    ),
  );
}

function stableSeedId(prefix: string, ...parts: string[]): string {
  return `${prefix}-${parts
    .join("-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)}`;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function calculateStaticInterventionScore(treatment: TreatmentWithConditions, condition: TreatmentWithConditions["conditions"][number]) {
  const participantScore = Math.min(100, Math.log10(Math.max(1, condition.participants)) * 18);
  const trialScore = Math.min(100, Math.log10(Math.max(1, condition.trials)) * 25);
  return clampScore(
    condition.effectiveness * 0.5 +
      condition.safetyScore * 0.25 +
      participantScore * 0.15 +
      trialScore * 0.1,
  );
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

  const categories = VARIABLE_CATEGORY_SEED_DATA;

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

  const variables = GLOBAL_VARIABLE_SEED_DATA;

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

async function seedMedicalReferenceData(
  unitMap: Record<string, string>,
  catMap: Record<string, string>,
) {
  console.log("🧬 Seeding medical conditions, intervention evidence, and rankings...");

  const conditionCategoryId = catMap["Condition"];
  const treatmentCategoryId = catMap["Treatment"];
  const conditionUnitId = unitMap["1-5"];
  const treatmentUnitId = unitMap["count"];

  if (!conditionCategoryId || !treatmentCategoryId || !conditionUnitId || !treatmentUnitId) {
    console.warn("  ⚠️  Missing medical category/unit seeds — skipping medical reference data");
    return;
  }

  const conditionVariablesBySlug = new Map<string, string>();
  const treatmentVariablesBySlug = new Map<string, string>();
  let codeCount = 0;

  for (const condition of getAllConditions()) {
    const variable = await upsertGlobalVariable({
      name: condition.name,
      description: condition.description,
      variableCategoryId: conditionCategoryId,
      defaultUnitId: conditionUnitId,
      combinationOperation: CombinationOperation.MEAN,
      fillingType: FillingType.NONE,
      predictorOnly: false,
      outcome: true,
      valence: Valence.NEGATIVE,
      synonyms: condition.synonyms.join(",") || undefined,
    });
    conditionVariablesBySlug.set(condition.slug, variable.id);

    for (const code of splitExternalCodes(condition.icd10Codes)) {
      await prisma.globalVariableExternalCode.upsert({
        where: {
          globalVariableId_codeSystem_code: {
            globalVariableId: variable.id,
            codeSystem: "ICD-10",
            code,
          },
        },
        update: {
          deletedAt: null,
          displayName: condition.name,
          metadataJson: {
            conditionCategory: condition.category,
            conditionSlug: condition.slug,
            dataSourceYear: condition.dataSourceYear,
            source: "packages/data medical conditions",
          },
        },
        create: {
          globalVariableId: variable.id,
          codeSystem: "ICD-10",
          code,
          displayName: condition.name,
          metadataJson: {
            conditionCategory: condition.category,
            conditionSlug: condition.slug,
            dataSourceYear: condition.dataSourceYear,
            source: "packages/data medical conditions",
          },
        },
      });
      codeCount++;
    }
  }

  for (const treatment of getAllTreatments()) {
    const variable = await upsertGlobalVariable({
      name: treatment.name,
      variableCategoryId: treatmentCategoryId,
      defaultUnitId: treatmentUnitId,
      combinationOperation: CombinationOperation.SUM,
      fillingType: FillingType.ZERO,
      fillingValue: 0,
      onsetDelay: 1800,
      durationOfAction: 86400,
      predictorOnly: true,
      outcome: false,
      valence: Valence.POSITIVE,
      minimumAllowedValue: 0,
    });
    treatmentVariablesBySlug.set(treatment.slug, variable.id);
  }

  const rankedByConditionSlug = new Map<string, Array<{
    condition: TreatmentWithConditions["conditions"][number];
    evidenceId: string;
    score: number;
    treatment: TreatmentWithConditions;
    interventionGlobalVariableId: string;
  }>>();

  for (const treatment of getAllTreatments()) {
    const interventionGlobalVariableId = treatmentVariablesBySlug.get(treatment.slug);
    if (!interventionGlobalVariableId) continue;

    for (const condition of treatment.conditions) {
      const conditionGlobalVariableId = conditionVariablesBySlug.get(condition.conditionSlug);
      if (!conditionGlobalVariableId) continue;

      const effectivenessEvidenceId = stableSeedId(
        "medical-evidence",
        treatment.slug,
        condition.conditionSlug,
        "effectiveness",
      );
      await prisma.variableRelationshipEvidenceEstimate.upsert({
        where: { id: effectivenessEvidenceId },
        update: {
          confidenceScore: treatment.avgEffectiveness / 100,
          contextGlobalVariableId: conditionGlobalVariableId,
          deletedAt: null,
          metricKind: VariableEvidenceMetricKind.EFFECTIVENESS,
          outcomeGlobalVariableId: conditionGlobalVariableId,
          participants: condition.participants,
          predictorGlobalVariableId: interventionGlobalVariableId,
          sourceType: VariableRelationshipEvidenceSourceType.CURATED_DATASET,
          studies: condition.trials,
          value: condition.effectiveness,
        },
        create: {
          id: effectivenessEvidenceId,
          confidenceScore: treatment.avgEffectiveness / 100,
          contextGlobalVariableId: conditionGlobalVariableId,
          evidenceGrade:
            condition.participants >= 10_000
              ? EvidenceGrade.A
              : condition.participants >= 1_000
                ? EvidenceGrade.B
                : EvidenceGrade.C,
          metricKind: VariableEvidenceMetricKind.EFFECTIVENESS,
          outcomeGlobalVariableId: conditionGlobalVariableId,
          participants: condition.participants,
          predictorGlobalVariableId: interventionGlobalVariableId,
          rationale: `Static dFDA catalog estimate for ${treatment.name} in ${condition.conditionName}.`,
          sourceType: VariableRelationshipEvidenceSourceType.CURATED_DATASET,
          studies: condition.trials,
          value: condition.effectiveness,
        },
      });

      const safetyEvidenceId = stableSeedId(
        "medical-evidence",
        treatment.slug,
        condition.conditionSlug,
        "safety",
      );
      await prisma.variableRelationshipEvidenceEstimate.upsert({
        where: { id: safetyEvidenceId },
        update: {
          confidenceScore: treatment.avgSafetyScore / 100,
          contextGlobalVariableId: conditionGlobalVariableId,
          deletedAt: null,
          metricKind: VariableEvidenceMetricKind.SAFETY,
          outcomeGlobalVariableId: conditionGlobalVariableId,
          participants: condition.participants,
          predictorGlobalVariableId: interventionGlobalVariableId,
          sourceType: VariableRelationshipEvidenceSourceType.CURATED_DATASET,
          studies: condition.trials,
          value: condition.safetyScore,
        },
        create: {
          id: safetyEvidenceId,
          confidenceScore: treatment.avgSafetyScore / 100,
          contextGlobalVariableId: conditionGlobalVariableId,
          metricKind: VariableEvidenceMetricKind.SAFETY,
          outcomeGlobalVariableId: conditionGlobalVariableId,
          participants: condition.participants,
          predictorGlobalVariableId: interventionGlobalVariableId,
          rationale: `Static dFDA catalog safety estimate for ${treatment.name} in ${condition.conditionName}.`,
          sourceType: VariableRelationshipEvidenceSourceType.CURATED_DATASET,
          studies: condition.trials,
          value: condition.safetyScore,
        },
      });

      const ranked = rankedByConditionSlug.get(condition.conditionSlug) ?? [];
      ranked.push({
        condition,
        evidenceId: effectivenessEvidenceId,
        score: calculateStaticInterventionScore(treatment, condition),
        treatment,
        interventionGlobalVariableId,
      });
      rankedByConditionSlug.set(condition.conditionSlug, ranked);
    }
  }

  let rankedCount = 0;
  for (const [conditionSlug, ranked] of rankedByConditionSlug) {
    const conditionGlobalVariableId = conditionVariablesBySlug.get(conditionSlug);
    if (!conditionGlobalVariableId) continue;

    const rankingRunId = stableSeedId("medical-ranking", conditionSlug);
    await prisma.interventionRankingRun.upsert({
      where: { id: rankingRunId },
      update: {
        algorithmKey: "medical-static-v1",
        conditionGlobalVariableId,
        deletedAt: null,
        status: InterventionRankingRunStatus.ACTIVE,
      },
      create: {
        id: rankingRunId,
        algorithmKey: "medical-static-v1",
        algorithmVersion: "packages/data medical snapshot",
        conditionGlobalVariableId,
        status: InterventionRankingRunStatus.ACTIVE,
      },
    });

    await prisma.rankedIntervention.deleteMany({
      where: { rankingRunId },
    });

    const rankedRows = ranked
      .sort((a, b) => b.score - a.score || b.condition.participants - a.condition.participants)
      .map((entry, index) => ({
        id: stableSeedId("ranked-intervention", conditionSlug, entry.treatment.slug),
        rankingRunId,
        interventionGlobalVariableId: entry.interventionGlobalVariableId,
        rank: index + 1,
        score: entry.score,
        effectivenessScore: entry.condition.effectiveness,
        safetyScore: entry.condition.safetyScore,
        evidenceScore: Math.min(100, Math.log10(Math.max(1, entry.condition.participants)) * 18),
        confidenceScore: entry.treatment.avgEffectiveness / 100,
        sourceEvidenceEstimateId: entry.evidenceId,
        rationale: `${entry.treatment.name}: ${entry.condition.effectiveness}% effectiveness, ${entry.condition.safetyScore}% safety in the static dFDA catalog.`,
      }));

    if (rankedRows.length > 0) {
      await prisma.rankedIntervention.createMany({ data: rankedRows });
      rankedCount += rankedRows.length;
    }
  }

  console.log(
    `  ✅ ${conditionVariablesBySlug.size} conditions, ${codeCount} ICD-10 codes, ${treatmentVariablesBySlug.size} interventions, ${rankedCount} ranked rows`,
  );
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

  // Conflict-relevant and globally significant countries for the Invisible
  // Graveyard "Responsible governments" picker. ISO-3166-1 alpha-2 codes.
  // Not exhaustive — add more as memorial submissions surface them.
  const otherCountries: [string, string, number][] = [
    ["Israel",                 "IL", 9_756_000],
    ["Palestine",              "PS", 5_483_000],
    ["Ukraine",                "UA", 33_400_000],
    ["Russia",                 "RU", 144_400_000],
    ["Yemen",                  "YE", 34_450_000],
    ["Syria",                  "SY", 23_230_000],
    ["Sudan",                  "SD", 48_110_000],
    ["South Sudan",            "SS", 11_090_000],
    ["Myanmar",                "MM", 54_500_000],
    ["Ethiopia",               "ET", 126_500_000],
    ["China",                  "CN", 1_410_000_000],
    ["Iran",                   "IR", 89_170_000],
    ["Saudi Arabia",           "SA", 36_950_000],
    ["North Korea",            "KP", 26_160_000],
    ["Egypt",                  "EG", 110_990_000],
    ["Pakistan",               "PK", 240_490_000],
    ["India",                  "IN", 1_428_630_000],
    ["Turkey",                 "TR", 85_330_000],
    ["Mexico",                 "MX", 128_460_000],
    ["Venezuela",              "VE", 28_840_000],
    ["Lebanon",                "LB", 5_490_000],
    ["Belarus",                "BY", 9_500_000],
    ["Afghanistan",            "AF", 42_240_000],
    ["United Kingdom",         "GB", 67_960_000],
    ["France",                 "FR", 68_170_000],
    ["Germany",                "DE", 84_480_000],
    ["Japan",                  "JP", 124_520_000],
    ["South Korea",            "KR", 51_780_000],
    ["Canada",                 "CA", 40_100_000],
    ["Australia",              "AU", 26_640_000],
    ["Singapore",              "SG", 5_920_000],
  ];

  for (const [name, code, population] of otherCountries) {
    await upsertJurisdiction({
      name,
      type: JurisdictionType.COUNTRY,
      code,
      population,
    });
  }

  console.log(`  ✅ ${otherCountries.length} additional countries`);
  return us.id;
}

// ============================================================================
// D2) CONFLICTS — Active and recent armed conflicts for memorial attribution
// ============================================================================

async function seedConflicts() {
  console.log("⚔️  Seeding active/recent conflicts...");

  // Lookup helper
  async function jurisdictionIdForCode(code: string): Promise<string | null> {
    const row = await prisma.jurisdiction.findUnique({
      where: { code },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  const conflicts: Array<{
    slug: string;
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    primaryJurisdictionCode?: string;
    sourceUrl?: string;
  }> = [
    {
      slug: "gaza-2023",
      name: "Gaza war (2023–present)",
      description:
        "Armed conflict in the Gaza Strip following the October 7, 2023 attacks; civilian casualties tracked by UN OCHA, WHO, and Gaza Ministry of Health.",
      startDate: new Date("2023-10-07T00:00:00Z"),
      primaryJurisdictionCode: "IL",
      sourceUrl: "https://www.ochaopt.org/",
    },
    {
      slug: "ukraine-2022",
      name: "Russia–Ukraine war (2022–present)",
      description:
        "Full-scale Russian invasion of Ukraine starting February 24, 2022. Civilian casualty data tracked by UN OHCHR HRMMU.",
      startDate: new Date("2022-02-24T00:00:00Z"),
      primaryJurisdictionCode: "UA",
      sourceUrl: "https://ukraine.un.org/",
    },
    {
      slug: "yemen-civil-war",
      name: "Yemen civil war (2014–present)",
      description:
        "Ongoing armed conflict involving Houthi forces, the Yemeni government, and the Saudi-led coalition.",
      startDate: new Date("2014-09-21T00:00:00Z"),
      primaryJurisdictionCode: "YE",
      sourceUrl: "https://acleddata.com/yemen-conflict-observatory/",
    },
    {
      slug: "syria-civil-war",
      name: "Syrian civil war (2011–present)",
      description:
        "Multi-sided conflict beginning with the 2011 uprising; UN OHCHR has documented hundreds of thousands of deaths.",
      startDate: new Date("2011-03-15T00:00:00Z"),
      primaryJurisdictionCode: "SY",
      sourceUrl: "https://www.ohchr.org/en/countries/syria",
    },
    {
      slug: "sudan-2023",
      name: "Sudan war (2023–present)",
      description:
        "Armed conflict between the Sudanese Armed Forces and the Rapid Support Forces beginning April 15, 2023.",
      startDate: new Date("2023-04-15T00:00:00Z"),
      primaryJurisdictionCode: "SD",
      sourceUrl: "https://acleddata.com/sudan-conflict-observatory/",
    },
    {
      slug: "tigray-war",
      name: "Tigray war (2020–2022)",
      description:
        "Armed conflict in Tigray Region of Ethiopia involving Ethiopian and Eritrean forces and the Tigray People's Liberation Front.",
      startDate: new Date("2020-11-04T00:00:00Z"),
      endDate: new Date("2022-11-03T00:00:00Z"),
      primaryJurisdictionCode: "ET",
      sourceUrl: "https://www.ohchr.org/en/countries/ethiopia",
    },
    {
      slug: "myanmar-civil-war",
      name: "Myanmar civil war (2021–present)",
      description:
        "Armed resistance to the February 2021 military coup, including ethnic armed organizations and the People's Defence Force.",
      startDate: new Date("2021-02-01T00:00:00Z"),
      primaryJurisdictionCode: "MM",
      sourceUrl: "https://acleddata.com/myanmar-conflict-observatory/",
    },
    {
      slug: "afghanistan-2001",
      name: "War in Afghanistan (2001–2021)",
      description:
        "Multi-phase armed conflict beginning with the U.S.-led invasion in October 2001 through the Taliban takeover in August 2021.",
      startDate: new Date("2001-10-07T00:00:00Z"),
      endDate: new Date("2021-08-30T00:00:00Z"),
      primaryJurisdictionCode: "AF",
      sourceUrl: "https://watson.brown.edu/costsofwar/",
    },
    {
      slug: "iraq-2003",
      name: "Iraq war (2003–2011)",
      description:
        "U.S.-led invasion of Iraq and subsequent multi-sided conflict; Iraq Body Count and Lancet studies document civilian death toll.",
      startDate: new Date("2003-03-20T00:00:00Z"),
      endDate: new Date("2011-12-18T00:00:00Z"),
      primaryJurisdictionCode: "US",
      sourceUrl: "https://www.iraqbodycount.org/",
    },
    {
      slug: "other",
      name: "Other / not listed",
      description:
        "Generic placeholder for conflicts not yet seeded. Use 'circumstances' to describe the specific conflict.",
    },
  ];

  for (const c of conflicts) {
    const primaryJurisdictionId = c.primaryJurisdictionCode
      ? await jurisdictionIdForCode(c.primaryJurisdictionCode)
      : null;

    await prisma.conflict.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description ?? null,
        startDate: c.startDate ?? null,
        endDate: c.endDate ?? null,
        primaryJurisdictionId,
        sourceUrl: c.sourceUrl ?? null,
      },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        startDate: c.startDate ?? null,
        endDate: c.endDate ?? null,
        primaryJurisdictionId,
        sourceUrl: c.sourceUrl ?? null,
      },
    });
  }

  console.log(`  ✅ ${conflicts.length} conflicts (${conflicts.length - 1} named + 'other' fallback)`);
}

// ============================================================================
// D3) DRUG/INTERVENTION APPROVAL TIMELINES — for the efficacy-lag matcher
// ============================================================================

async function seedDrugApprovalTimelines() {
  console.log("⏳ Seeding intervention approval timelines (efficacy-lag heavy hitters)...");

  // Lookup helpers
  async function jurisdictionIdForCode(code: string): Promise<string | null> {
    const row = await prisma.jurisdiction.findUnique({
      where: { code },
      select: { id: true },
    });
    return row?.id ?? null;
  }
  async function globalVariableIdByName(name: string): Promise<string | null> {
    const row = await prisma.globalVariable.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { synonyms: { contains: name, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  const usJurisdictionId = await jurisdictionIdForCode("US");
  const ONE_DAY = 1000 * 60 * 60 * 24;

  // PRD TODO.md:1270–1278. Dates are best-known approximations (academic consensus
  // for first efficacy evidence, FDA approval dates). Lives-saved-per-year and
  // deaths-during-lag are order-of-magnitude estimates from the literature cited
  // alongside each entry — meant to anchor the matcher, not to be exact.
  const timelines: Array<{
    interventionName: string;
    brandName?: string;
    conditionName: string;
    regulatorName: string;
    firstEvidenceDate: Date;
    firstEvidenceDescription: string;
    approvalDate: Date;
    approvalDescription: string;
    estimatedLivesSavedPerYear: number;
    sourceUrl: string;
    interventionLookupNames?: string[];
    conditionLookupNames?: string[];
  }> = [
    {
      interventionName: "Beta-blockers (post-MI)",
      conditionName: "Post-myocardial infarction (heart attack survival)",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1972-01-01T00:00:00Z"),
      firstEvidenceDescription:
        "Multicentre randomized trials (Norwegian Multicenter Study, BHAT) showed beta-blockers reduced post-MI mortality.",
      approvalDate: new Date("1981-11-01T00:00:00Z"),
      approvalDescription:
        "FDA approved propranolol for post-MI mortality reduction in November 1981 following BHAT results.",
      estimatedLivesSavedPerYear: 11_000,
      sourceUrl: "https://www.bmj.com/content/318/7200/1730",
      interventionLookupNames: ["propranolol", "beta blocker", "metoprolol"],
      conditionLookupNames: ["myocardial infarction", "heart attack"],
    },
    {
      interventionName: "Dexamethasone (severe COVID-19)",
      conditionName: "COVID-19 (severe, requiring oxygen)",
      regulatorName: "FDA / NIH",
      firstEvidenceDate: new Date("2020-06-16T00:00:00Z"),
      firstEvidenceDescription:
        "RECOVERY trial preprint released June 16, 2020 showed dexamethasone cut deaths in ventilated COVID-19 patients by ~⅓.",
      approvalDate: new Date("2020-09-02T00:00:00Z"),
      approvalDescription:
        "NIH treatment guidelines updated; widespread clinical adoption followed RECOVERY publication. Dexamethasone was already an approved generic.",
      estimatedLivesSavedPerYear: 100_000,
      sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2021436",
      interventionLookupNames: ["dexamethasone"],
      conditionLookupNames: ["covid-19", "covid"],
    },
    {
      interventionName: "Imatinib (Gleevec) for CML",
      brandName: "Gleevec",
      conditionName: "Chronic myeloid leukemia (CML)",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1998-06-01T00:00:00Z"),
      firstEvidenceDescription:
        "Phase I trial (Druker et al.) showed dramatic hematologic remission in chronic-phase CML.",
      approvalDate: new Date("2001-05-10T00:00:00Z"),
      approvalDescription:
        "FDA accelerated approval for chronic-phase CML granted May 10, 2001.",
      estimatedLivesSavedPerYear: 4_000,
      sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJM200104053441401",
      interventionLookupNames: ["imatinib", "gleevec"],
      conditionLookupNames: ["chronic myeloid leukemia", "cml"],
    },
    {
      interventionName: "Interleukin-2 (renal cell carcinoma)",
      conditionName: "Metastatic renal cell carcinoma",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1989-01-01T00:00:00Z"),
      firstEvidenceDescription:
        "Rosenberg et al. and parallel European trials demonstrated durable remissions; available in nine EU countries.",
      approvalDate: new Date("1992-05-05T00:00:00Z"),
      approvalDescription:
        "FDA approved high-dose IL-2 (aldesleukin) for metastatic renal cell carcinoma in May 1992.",
      estimatedLivesSavedPerYear: 800,
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/3309687/",
      interventionLookupNames: ["interleukin-2", "il-2", "aldesleukin"],
      conditionLookupNames: ["renal cell carcinoma", "kidney cancer"],
    },
    {
      interventionName: "ACE inhibitors (heart failure)",
      conditionName: "Congestive heart failure",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1986-06-01T00:00:00Z"),
      firstEvidenceDescription:
        "CONSENSUS trial showed enalapril reduced mortality in severe heart failure.",
      approvalDate: new Date("1991-04-01T00:00:00Z"),
      approvalDescription:
        "FDA expanded indication for enalapril to include all symptomatic heart failure.",
      estimatedLivesSavedPerYear: 30_000,
      sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJM198706043162301",
      interventionLookupNames: ["enalapril", "lisinopril", "ace inhibitor"],
      conditionLookupNames: ["heart failure", "congestive heart failure"],
    },
    {
      interventionName: "Combination antiretroviral therapy (HIV/AIDS)",
      conditionName: "HIV/AIDS",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1987-03-19T00:00:00Z"),
      firstEvidenceDescription:
        "Zidovudine (AZT) approved 1987; protease inhibitors entered trials early 1990s, dramatically extending survival when combined.",
      approvalDate: new Date("1996-03-01T00:00:00Z"),
      approvalDescription:
        "FDA approval of saquinavir (Dec 1995) and ritonavir (Mar 1996) made highly active combination ART available.",
      estimatedLivesSavedPerYear: 200_000,
      sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJM199703273361301",
      interventionLookupNames: ["antiretroviral", "haart", "art", "azt", "zidovudine"],
      conditionLookupNames: ["hiv", "aids", "hiv/aids"],
    },
    {
      interventionName: "Statins (cardiovascular prevention)",
      conditionName: "Cardiovascular disease (atherosclerotic)",
      regulatorName: "FDA",
      firstEvidenceDate: new Date("1987-09-01T00:00:00Z"),
      firstEvidenceDescription:
        "Lovastatin LDL trials demonstrated dramatic cholesterol reduction; later 4S trial (1994) showed mortality benefit.",
      approvalDate: new Date("1994-11-19T00:00:00Z"),
      approvalDescription:
        "Scandinavian Simvastatin Survival Study (4S) published Nov 1994 established statin mortality benefit; broad clinical adoption followed.",
      estimatedLivesSavedPerYear: 50_000,
      sourceUrl: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(94)90566-5/",
      interventionLookupNames: ["statin", "simvastatin", "atorvastatin", "lovastatin"],
      conditionLookupNames: ["cardiovascular disease", "atherosclerosis", "coronary"],
    },
  ];

  let count = 0;
  for (const t of timelines) {
    const efficacyLagDays = Math.round(
      (t.approvalDate.getTime() - t.firstEvidenceDate.getTime()) / ONE_DAY,
    );
    const estimatedDeathsDuringLag =
      (efficacyLagDays / 365) * t.estimatedLivesSavedPerYear;

    let interventionGlobalVariableId: string | null = null;
    for (const name of t.interventionLookupNames ?? [t.interventionName]) {
      interventionGlobalVariableId = await globalVariableIdByName(name);
      if (interventionGlobalVariableId) break;
    }
    let conditionGlobalVariableId: string | null = null;
    for (const name of t.conditionLookupNames ?? [t.conditionName]) {
      conditionGlobalVariableId = await globalVariableIdByName(name);
      if (conditionGlobalVariableId) break;
    }

    // Stable id so re-running the seed updates instead of duplicating.
    const id = `intervention-approval-${t.interventionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)}`;

    await prisma.interventionApprovalTimeline.upsert({
      where: { id },
      update: {
        interventionName: t.interventionName,
        brandName: t.brandName ?? null,
        conditionName: t.conditionName,
        interventionGlobalVariableId,
        conditionGlobalVariableId,
        jurisdictionId: usJurisdictionId,
        regulatorName: t.regulatorName,
        firstEvidenceDate: t.firstEvidenceDate,
        firstEvidenceDescription: t.firstEvidenceDescription,
        approvalDate: t.approvalDate,
        approvalDescription: t.approvalDescription,
        efficacyLagDays,
        estimatedLivesSavedPerYear: t.estimatedLivesSavedPerYear,
        estimatedDeathsDuringLag,
        sourceUrl: t.sourceUrl,
        deletedAt: null,
      },
      create: {
        id,
        interventionName: t.interventionName,
        brandName: t.brandName ?? null,
        conditionName: t.conditionName,
        interventionGlobalVariableId,
        conditionGlobalVariableId,
        jurisdictionId: usJurisdictionId,
        regulatorName: t.regulatorName,
        firstEvidenceDate: t.firstEvidenceDate,
        firstEvidenceDescription: t.firstEvidenceDescription,
        approvalDate: t.approvalDate,
        approvalDescription: t.approvalDescription,
        efficacyLagDays,
        estimatedLivesSavedPerYear: t.estimatedLivesSavedPerYear,
        estimatedDeathsDuringLag,
        sourceUrl: t.sourceUrl,
      },
    });
    count++;
  }

  console.log(`  ✅ ${count} approval timelines seeded`);
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
  const publishedAt = new Date("2026-05-03T00:00:00.000Z");
  const buildReferendumData = (
    data: Omit<Prisma.ReferendumUncheckedCreateInput, "contentHash"> & {
      question: string;
    },
  ): Prisma.ReferendumUncheckedCreateInput => ({
    ...data,
    contentHash: buildReferendumContentHash({
      question: data.question,
      description: data.description ?? null,
      bodyMarkdown: data.bodyMarkdown ?? null,
    }),
  });

  const treatyReferendumData = buildReferendumData({
    title: "The 1% Treaty",
    slug: TREATY_REFERENDUM_SLUG,
    question:
      "Should governments redirect 1% of military spending to pragmatic clinical trials and disease eradication by adopting the 1% Treaty?",
    kind: ReferendumKind.TREATY,
    description:
      "The 1% Treaty redirects one percent of military spending into pragmatic clinical trials so disease gets less time to kill people.",
    bodyMarkdown: shareableSnippets.onePercentTreatyText.markdown,
    publishedAt,
    lockedAt: null,
    status: ReferendumStatus.ACTIVE,
  });

  await prisma.referendum.upsert({
    where: { slug: TREATY_REFERENDUM_SLUG },
    update: treatyReferendumData,
    create: treatyReferendumData,
  });
  console.log("  ✓ 1% Treaty referendum");

  const declarationReferendumData = buildReferendumData({
    title: "Declaration of Optimization",
    slug: DECLARATION_REFERENDUM_SLUG,
    question: "Do you endorse the Declaration of Optimization?",
    kind: ReferendumKind.DECLARATION,
    description:
      "Sign the Declaration of Optimization to declare your support for evidence-based governance.",
    bodyMarkdown: [
      shareableSnippets.whyOptimizationIsNecessary.markdown,
      shareableSnippets.declarationOfOptimization.markdown,
    ].join("\n\n"),
    publishedAt,
    lockedAt: null,
    status: ReferendumStatus.ACTIVE,
  });

  await prisma.referendum.upsert({
    where: { slug: DECLARATION_REFERENDUM_SLUG },
    update: declarationReferendumData,
    create: declarationReferendumData,
  });
  console.log("  ✓ Declaration of Optimization referendum");

  const courtReferendumData = buildReferendumData({
    title: "The Court of Humanity",
    slug: COURT_OF_HUMANITY_REFERENDUM_SLUG,
    question: COURT_OF_HUMANITY_QUESTION,
    kind: ReferendumKind.MEMBERSHIP,
    description:
      "Join the decentralized court where 8 billion humans are the jury and sovereign immunity is abolished.",
    bodyMarkdown: COURT_OF_HUMANITY_TEXT.markdown,
    publishedAt,
    lockedAt: null,
    status: ReferendumStatus.ACTIVE,
  });

  await prisma.referendum.upsert({
    where: { slug: COURT_OF_HUMANITY_REFERENDUM_SLUG },
    update: courtReferendumData,
    create: courtReferendumData,
  });
  console.log("  ✓ Court of Humanity referendum");
}

export async function seedReferenceData() {
  const unitMap = await seedUnits();
  const catMap = await seedVariableCategories(unitMap);
  await seedGlobalVariables(unitMap, catMap);
  await seedMedicalReferenceData(unitMap, catMap);
  await seedJurisdictions();
  await seedConflicts();
  await seedDrugApprovalTimelines();
  await seedWishocraticItems();
}

export async function seedBootstrapData() {
  await seedReferendums();
  await seedReasoningData(prisma);
  await seedGrandmaKayExample();
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
const TREATY_SIGNER_CONTACT_TEMPLATE = [
  "Your employee has not finished {{taskTitle}}. It is a thirty-second task. One signature. A wrist movement.",
  "It has been sitting on a desk for {{delayLabel}}. A desk. Not a war. A desk.",
  "Delay body count so far: {{humanLives}} humans have permanently stopped, {{sufferingHours}} hours of suffering accumulated, {{economicLoss}} evaporated. While the paperwork waited.",
  "The pen is here: {{taskUrl}}",
].join(" ");

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
      // Internal id + taskKey come from the canonical OPTIMIZE_EARTH_ROOT
      // constants in @optimitron/db so seed and web stay in lockstep.
      id: OPTIMIZE_EARTH_ROOT_TASK_ID,
      taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
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
    primaryEndpoint: {
      label: "Open Earth Optimization task tree",
      url: "/tasks",
      instructions:
        "Complete {{taskTitle}} by clearing the overdue child tasks. Start here: {{taskUrl}}",
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
    primaryEndpoint: {
      label: "Sign or share the 1% Treaty",
      url: "/treaty",
      instructions:
        "Please complete {{taskTitle}}. Sign the treaty, then assign one more person an Earth Optimization task. Start here: {{taskUrl}}",
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
      dueAt: EARTH_OPTIMIZATION_PRIZE_DEADLINE,
      sortOrder: -90,
      skillTags: ["engineering", "fundraising", "clinical-trials"],
      interestTags: ["dfda", "disease-eradication", "clinical-trials"],
      claimPolicy: "OPEN_MANY",
    },
    primaryEndpoint: {
      label: "Read the dFDA spec",
      url: "https://dfda-spec.warondisease.org",
      instructions:
        "Please help complete {{taskTitle}}. The dFDA path is the backup route that does not wait for governments. Start here: {{taskUrl}}",
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
      dueAt: EARTH_OPTIMIZATION_PRIZE_DEADLINE,
      sortOrder: -80,
      skillTags: ["fundraising", "global-health"],
      interestTags: ["malaria", "bed-nets", "global-health", "givewell"],
      claimPolicy: "OPEN_MANY",
    },
    primaryEndpoint: {
      label: "Donate to AMF",
      url: "https://www.againstmalaria.com/Donation.aspx",
      instructions:
        "Please help complete {{taskTitle}}. Bed nets are the clean benchmark: cheap, proven, and blocked mostly by funding. Start here: {{taskUrl}}",
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

  // --- Foundation grant accountability tasks ---
  // Same public-accountability pattern as the head-of-state treaty tasks:
  // name the institution, assign the tiny concrete action, mark it overdue.
  const ICEWAD_GRANT_DALYS_PER_USD = 564.972;
  const ICEWAD_GRANT_ECON_VALUE_PER_USD = ICEWAD_GRANT_DALYS_PER_USD * 150_000;
  const foundationGrantOrganizations = [
    {
      name: "Survival and Flourishing Fund",
      website: "https://survivalandflourishing.fund",
    },
    {
      name: "Open Philanthropy",
      website: "https://www.openphilanthropy.org",
    },
    {
      name: "Gates Foundation",
      website: "https://www.gatesfoundation.org",
    },
    {
      name: "Filecoin Foundation",
      website: "https://fil.org",
    },
    {
      name: "Arnold Ventures",
      website: "https://www.arnoldventures.org",
    },
    {
      name: "Wellcome Trust",
      website: "https://wellcome.org",
    },
    {
      name: "Patrick J. McGovern Foundation",
      website: "https://www.mcgovern.org",
    },
    {
      name: "Schmidt Futures",
      website: "https://www.schmidtfutures.com",
    },
    {
      name: "Skoll Foundation",
      website: "https://skoll.org",
    },
    {
      name: "Omidyar Network",
      website: "https://omidyar.com",
    },
  ] as const;

  for (const [index, foundation] of foundationGrantOrganizations.entries()) {
    const slug = slugify(foundation.name);
    const organizationData = {
      name: foundation.name,
      slug,
      type: "FOUNDATION",
      status: "APPROVED",
      website: foundation.website,
      description:
        "Foundation or grantmaker assigned a public $1 grant task for the International Campaign to End War and Disease.",
    } satisfies Prisma.OrganizationUncheckedCreateInput;

    const organization = await prisma.organization.upsert({
      where: { slug },
      update: organizationData,
      create: organizationData,
    });

    await createTaskWithImpact({
      task: {
        id: `icewad-grant-${slug}`,
        taskKey: `icewad:grant:${slug}`,
        parentTaskId: treatyTask.id,
        assigneeOrganizationId: organization.id,
        title: "Fund the International Campaign to End War and Disease",
        description: [
          `${foundation.name} has the opportunity to fund the highest expected-value charitable intervention ever calculated.`,
          "",
          "The International Campaign to End War and Disease prevents one disability-adjusted life year (DALY) for $0.00177. That is 50,300 times more cost-effective than insecticide-treated bednets, the current gold standard in global health philanthropy.",
          "",
          "**Suggested grant: $1.**",
          "",
          "At our cost-effectiveness ratio, $1 prevents approximately 565 DALYs, which is roughly 16 healthy life-years. If you would like to prevent more healthy life-years, you may increase the amount.",
          "",
          "At $100, you prevent 56,497 DALYs (1,614 healthy life-years).",
          "At $1,000, you prevent 564,972 DALYs (16,142 healthy life-years).",
          "At $100,000, you save approximately 3,200 lives.",
          "",
          "These are not projections. They are the output of a cost-benefit model with 670 parameters, Monte Carlo simulation, and complete derivation chains. The model, methodology, and every input parameter are published with 95% confidence intervals at manual.warondisease.org.",
          "",
          "We understand this sounds implausible. We have checked the math. The math does not care whether it sounds implausible.",
          "",
          "[Donate ->](https://warondisease.org/donate)",
          "",
          "[Read the full analysis ->](https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html)",
          "",
          "[Read the treaty ->](https://manual.warondisease.org/knowledge/solution/1-percent-treaty.html)",
        ].join("\n"),
        category: "GOVERNANCE",
        difficulty: "TRIVIAL",
        status: "ACTIVE",
        isPublic: true,
        dueAt: TREATY_DUE_AT,
        sortOrder: -75 + index,
        claimPolicy: "ASSIGNED_ONLY",
        skillTags: ["grantmaking", "global-health", "fundraising"],
        interestTags: ["icewad", "one-percent-treaty", "foundation", "grant"],
        estimatedEffortHours: TREATY_PER_SIGNER_EFFORT_HOURS,
      },
      primaryEndpoint: {
        label: "Donate",
        url: "https://warondisease.org/donate",
        instructions:
          "Please complete {{taskTitle}} with a $1 grant or a larger one if the math survives contact with your grants committee. Start here: {{taskUrl}}",
      },
      impact: {
        estimatedCashCostUsdBase: 1,
        expectedEconomicValueUsdBase: ICEWAD_GRANT_ECON_VALUE_PER_USD,
        expectedDalysAvertedBase: ICEWAD_GRANT_DALYS_PER_USD,
        delayEconomicValueUsdLostPerDayBase: ICEWAD_GRANT_ECON_VALUE_PER_USD / 365,
        delayDalysLostPerDayBase: ICEWAD_GRANT_DALYS_PER_USD / 365,
        successProbabilityBase: 0.25,
        benefitDurationYears: 1,
      },
      methodologyKey: "icewad-one-dollar-grant",
      parameterSetHashSuffix: slug,
      calculationsUrl: "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
    });
  }

  console.log(`  ✓ ${foundationGrantOrganizations.length} foundation grant tasks`);

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
      primaryEndpoint: {
        label: record.contactLabel ?? "Find official contact",
        url:
          record.contactUrl ??
          googleSearch(`${leaderName} ${record.roleTitle} ${record.countryName} official contact`),
        instructions: TREATY_SIGNER_CONTACT_TEMPLATE,
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
const GRANDMA_KAY_SOURCE_REF = "memorial-example:grandma-kay";
let cachedSeedWishoniaUserId: string | null = null;

/**
 * Seed Wishonia as a regular user with a linked Person record. This lets her:
 * - Author task comments under her own user ID (no fake system-user hack)
 * - Be assigned tasks via `assigneePersonId`
 * - Create tasks via `createdByUserId`
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
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
    create: {
      sourceRef,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
  });

  // Upsert the user by stable email and link to the Person. Display fields
  // (name/image/handle) live exclusively on Person — set them in the Person
  // upsert above, not here.
  const user = await prisma.user.upsert({
    where: { email: WISHONIA_EMAIL },
    update: {
      isSystem: true,
      person: { connect: { id: person.id } },
    },
    create: {
      email: WISHONIA_EMAIL,
      isSystem: true,
      emailVerified: new Date(),
      person: { connect: { id: person.id } },
    },
  });

  console.log(`  ✓ Wishonia user (${user.id}) + person (${person.id}) handle=${person.handle}`);
  cachedSeedWishoniaUserId = user.id;
  return { person, user };
}

async function seedGrandmaKayExample() {
  console.log("🧾 Seeding Grandma Kay represented-person example...");

  const { user } = await seedWishoniaUser();
  const referendum = await prisma.referendum.findUniqueOrThrow({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  });

  const person = await prisma.person.upsert({
    where: { sourceRef: GRANDMA_KAY_SOURCE_REF },
    update: {
      displayName: "Grandma Kay",
      handle: "grandma-kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
    create: {
      createdByUserId: user.id,
      displayName: "Grandma Kay",
      handle: "grandma-kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: GRANDMA_KAY_SOURCE_REF,
    },
  });

  await prisma.personCondition.upsert({
    where: { id: "person-condition-grandma-kay-dementia" },
    update: {
      conditionName: "Dementia",
      deletedAt: null,
      isPublic: true,
      personId: person.id,
      reportedByUserId: user.id,
      status: PersonConditionStatus.ACTIVE,
    },
    create: {
      id: "person-condition-grandma-kay-dementia",
      conditionName: "Dementia",
      isPublic: true,
      personId: person.id,
      reportedByUserId: user.id,
      status: PersonConditionStatus.ACTIVE,
    },
  });

  await prisma.referendumVote.upsert({
    where: {
      referendumId_personId: {
        referendumId: referendum.id,
        personId: person.id,
      },
    },
    update: {
      answer: VotePosition.YES,
      deletedAt: null,
      isPublic: true,
      publicComment: "She would trade one apocalypse for dementia research.",
      userId: user.id,
      voteSource: ReferendumVoteSource.REPRESENTED,
    },
    create: {
      answer: VotePosition.YES,
      isPublic: true,
      personId: person.id,
      publicComment: "She would trade one apocalypse for dementia research.",
      referendumId: referendum.id,
      userId: user.id,
      voteSource: ReferendumVoteSource.REPRESENTED,
    },
  });

  console.log("  ✓ Grandma Kay represented YES vote");
}

/**
 * Helper: upsert a task + impact estimate set + LIFETIME frame.
 * Idempotent — safe to re-run after changing description/impact values without
 * losing existing claims, edges, or other task state.
 * Requires `task.id` to be set for upsert-by-id behavior.
 */
async function createTaskWithImpact(input: {
  task: Omit<Parameters<typeof prisma.task.create>[0]["data"], "createdByUserId"> & {
    createdByUserId?: string | null;
    id: string;
  };
  primaryEndpoint?: {
    email?: string | null;
    instructions?: string | null;
    label?: string | null;
    sourceUrl?: string | null;
    url?: string | null;
  } | null;
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
  const {
    id: taskId,
    ...taskData
  } = input.task;

  // Prisma 7 requires relation syntax (not scalar FK fields) in both create and update.
  const {
    assigneeOrganizationId,
    assigneePersonId,
    createdByUserId,
    parentTaskId,
    ...taskScalars
  } = taskData as typeof taskData & {
    assigneeOrganizationId?: string | null;
    assigneePersonId?: string | null;
    createdByUserId?: string | null;
    parentTaskId?: string | null;
  };
  const explicitCreatedByUserId = createdByUserId?.trim() || null;
  const resolvedCreatedByUserId =
    explicitCreatedByUserId ||
    cachedSeedWishoniaUserId ||
    (await seedWishoniaUser()).user.id;
  const createRelations: Record<string, unknown> = {};
  const updateRelations: Record<string, unknown> = {};
  createRelations.createdByUser = { connect: { id: resolvedCreatedByUserId } };
  if (explicitCreatedByUserId) {
    updateRelations.createdByUser = { connect: { id: explicitCreatedByUserId } };
  }
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

  if (input.primaryEndpoint) {
    await upsertSeedTaskCommunicationEndpoint(task.id, input.primaryEndpoint);
  }

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

function inferSeedEndpointKind(input: { email: string | null; url: string | null }) {
  if (input.url?.toLowerCase().startsWith("mailto:")) {
    return TaskCommunicationEndpointKind.MAILTO;
  }

  if (input.email) {
    return TaskCommunicationEndpointKind.EMAIL;
  }

  if (input.url) {
    return TaskCommunicationEndpointKind.EXTERNAL_URL;
  }

  return TaskCommunicationEndpointKind.MANUAL;
}

async function upsertSeedTaskCommunicationEndpoint(
  taskId: string,
  input: {
    instructions?: string | null;
    label?: string | null;
    url?: string | null;
  },
) {
  const url = input.url?.trim() || null;
  const label = input.label?.trim() || null;
  const instructions = input.instructions?.trim() || null;
  const email =
    url?.toLowerCase().startsWith("mailto:")
      ? url.slice("mailto:".length).split("?")[0]?.trim() || null
      : null;

  if (!url && !label && !instructions) {
    await prisma.taskCommunicationEndpoint.updateMany({
      where: {
        deletedAt: null,
        isPrimary: true,
        taskId,
      },
      data: {
        deletedAt: new Date(),
        isPrimary: false,
      },
    });
    return null;
  }

  const existing = await prisma.taskCommunicationEndpoint.findFirst({
    where: {
      deletedAt: null,
      isPrimary: true,
      taskId,
    },
    select: { id: true },
  });

  const data = {
    email,
    instructions,
    isPrimary: true,
    kind: inferSeedEndpointKind({ email, url }),
    label,
    priority: 0,
    url,
    verificationStatus: TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
  };

  if (existing) {
    return prisma.taskCommunicationEndpoint.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.taskCommunicationEndpoint.create({
    data: {
      ...data,
      taskId,
    },
  });
}

// ---------------------------------------------------------------------------
// Demo User — for hackathon judges and demo recordings
// ---------------------------------------------------------------------------
// Email: demo@thinkbynumbers.org  Password: demo1234

async function seedDemoUser() {
  console.log("👤 Seeding demo user...");

  const DEMO_EMAIL = "demo@thinkbynumbers.org";
  const LEGACY_DEMO_EMAIL = "demo@optimitron.org";

  // Pre-hashed bcrypt(12) of "demo1234"
  const DEMO_PASSWORD_HASH =
    "$2b$12$Hy27qJOTykSezth61xRCJ..sMPVvzWxs9wZEEsEsYn9o3GaUYkGCa";

  try {
    const existingDemoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (!existingDemoUser) {
      await prisma.user.updateMany({
        where: { email: LEGACY_DEMO_EMAIL },
        data: { email: DEMO_EMAIL },
      });
    }

    const existingDemoPerson = await prisma.person.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (!existingDemoPerson) {
      await prisma.person.updateMany({
        where: { email: LEGACY_DEMO_EMAIL },
        data: { email: DEMO_EMAIL },
      });
    }

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        password: DEMO_PASSWORD_HASH,
        emailVerified: new Date(),
      },
      create: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD_HASH,
        emailVerified: new Date(),
        referralCode: "DEMO",
      },
    });

    // Person owns the public-display fields (handle / displayName / image).
    const person = await prisma.person.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        displayName: "Demo User",
        handle: "demo",
      },
      create: {
        email: DEMO_EMAIL,
        displayName: "Demo User",
        handle: "demo",
      },
    });

    if (user.personId !== person.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { personId: person.id },
      });
    }
    console.log("  ✓ demo@thinkbynumbers.org / demo1234");
  } catch (err) {
    // If schema is out of sync, try raw SQL fallback. Display fields live
    // on Person now, so the User row carries only auth-level columns.
    console.log("  ⚠ upsert failed, trying raw SQL...");
    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET email = 'demo@thinkbynumbers.org'
      WHERE email = 'demo@optimitron.org'
        AND NOT EXISTS (
          SELECT 1 FROM "User" WHERE email = 'demo@thinkbynumbers.org'
        )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" (id, email, password, "referralCode", "emailVerified", "createdAt", "updatedAt")
      VALUES ('demo-user-id', 'demo@thinkbynumbers.org', $1, 'DEMO', NOW(), NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = $1,
        "emailVerified" = NOW(),
        "updatedAt" = NOW()
    `, DEMO_PASSWORD_HASH);
    console.log("  ✓ demo@thinkbynumbers.org / demo1234 (via raw SQL)");
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
