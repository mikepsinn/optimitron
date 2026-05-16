import type { Prisma, PrismaClient } from "@optimitron/db";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT,
  GLOBAL_REGISTERED_VOTERS,
  STANDARD_ECONOMIC_QALY_VALUE_USD,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";

const TREATY_IMPACT_CALCULATIONS_URL =
  "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html";
const TREATY_PER_VERIFIED_VOTER_METHODOLOGY_KEY =
  "treaty-per-verified-voter-lifetime";
const TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH_SUFFIX =
  "global-registered-voters";
const TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH =
  `seed-${TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH_SUFFIX}`;

export type PerVerifiedVoterTaskImpactClient = {
  task: Pick<PrismaClient["task"], "update">;
  taskImpactEstimateSet: Pick<
    PrismaClient["taskImpactEstimateSet"],
    "create" | "deleteMany" | "updateMany"
  >;
  taskImpactFrameEstimate: Pick<PrismaClient["taskImpactFrameEstimate"], "create">;
  taskImpactMetric: Pick<PrismaClient["taskImpactMetric"], "createMany">;
};

function buildPerVerifiedVoterImpact() {
  const totalDalys = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value;
  const totalEconValue =
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value;
  const accelerationYears = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value;
  const targetVoterCount = GLOBAL_REGISTERED_VOTERS.value;
  const annualAvoidableDalys =
    GLOBAL_ANNUAL_DALY_BURDEN.value * EVENTUALLY_AVOIDABLE_DALY_PCT.value;
  const delayDalysPerDay = annualAvoidableDalys / 365;
  const delayEconPerDay =
    delayDalysPerDay * STANDARD_ECONOMIC_QALY_VALUE_USD.value;

  return {
    estimatedCashCostUsdBase:
      GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT.value,
    expectedEconomicValueUsdBase: totalEconValue / targetVoterCount,
    expectedDalysAvertedBase: totalDalys / targetVoterCount,
    delayEconomicValueUsdLostPerDayBase:
      delayEconPerDay / targetVoterCount,
    delayDalysLostPerDayBase: delayDalysPerDay / targetVoterCount,
    successProbabilityBase: 1,
    benefitDurationYears: accelerationYears,
    metrics: [
      {
        metricKey: "lives_saved_if_success",
        unit: VOTER_LIVES_SAVED.unit,
        baseValue: VOTER_LIVES_SAVED.value,
        displayGroup: "human-impact",
        metadataJson: {
          calculationsUrl: VOTER_LIVES_SAVED.calculationsUrl,
          parameterName: VOTER_LIVES_SAVED.parameterName,
        } satisfies Prisma.InputJsonObject,
      },
      {
        metricKey: "suffering_hours_if_success",
        unit: VOTER_SUFFERING_HOURS_PREVENTED.unit,
        baseValue: VOTER_SUFFERING_HOURS_PREVENTED.value,
        displayGroup: "human-impact",
        metadataJson: {
          calculationsUrl: VOTER_SUFFERING_HOURS_PREVENTED.calculationsUrl,
          parameterName: VOTER_SUFFERING_HOURS_PREVENTED.parameterName,
        } satisfies Prisma.InputJsonObject,
      },
    ],
  };
}

export async function syncPerVerifiedVoterTaskImpactEstimate(
  db: PerVerifiedVoterTaskImpactClient,
  taskId: string,
) {
  const impact = buildPerVerifiedVoterImpact();

  await db.taskImpactEstimateSet.updateMany({
    where: {
      deletedAt: null,
      taskId,
    },
    data: { isCurrent: false },
  });

  await db.taskImpactEstimateSet.deleteMany({
    where: {
      calculationVersion: "seed-v1",
      counterfactualKey: "status-quo",
      estimateKind: "FORECAST",
      methodologyKey: TREATY_PER_VERIFIED_VOTER_METHODOLOGY_KEY,
      parameterSetHash: TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH,
      sourceSystem: "PARAMETER_CATALOG",
      taskId,
    },
  });

  const estimateSet = await db.taskImpactEstimateSet.create({
    data: {
      taskId,
      isCurrent: true,
      estimateKind: "FORECAST",
      publicationStatus: "PUBLISHED",
      sourceSystem: "PARAMETER_CATALOG",
      calculationVersion: "seed-v1",
      methodologyKey: TREATY_PER_VERIFIED_VOTER_METHODOLOGY_KEY,
      parameterSetHash: TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH,
      counterfactualKey: "status-quo",
      assumptionsJson: {
        calculationsUrl: TREATY_IMPACT_CALCULATIONS_URL,
        parameterNames: [
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.parameterName,
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.parameterName,
          GLOBAL_REGISTERED_VOTERS.parameterName,
        ].filter((name): name is string => Boolean(name)),
      },
    },
  });

  await db.task.update({
    where: { id: taskId },
    data: { currentImpactEstimateSetId: estimateSet.id },
  });

  const frame = await db.taskImpactFrameEstimate.create({
    data: {
      taskImpactEstimateSetId: estimateSet.id,
      frameKey: "LIFETIME",
      frameSlug: "lifetime",
      evaluationHorizonYears: impact.benefitDurationYears,
      timeToImpactStartDays: 365,
      adoptionRampYears: 5,
      benefitDurationYears: impact.benefitDurationYears,
      annualDiscountRate: 0,
      successProbabilityBase: impact.successProbabilityBase,
      expectedEconomicValueUsdBase: impact.expectedEconomicValueUsdBase,
      expectedDalysAvertedBase: impact.expectedDalysAvertedBase,
      delayEconomicValueUsdLostPerDayBase:
        impact.delayEconomicValueUsdLostPerDayBase,
      delayDalysLostPerDayBase: impact.delayDalysLostPerDayBase,
      estimatedCashCostUsdBase: impact.estimatedCashCostUsdBase,
      estimatedEffortHoursBase: 0.01,
    },
  });

  await db.taskImpactMetric.createMany({
    data: impact.metrics.map((metric) => ({
      taskImpactFrameEstimateId: frame.id,
      metricKey: metric.metricKey,
      unit: metric.unit ?? "",
      baseValue: metric.baseValue,
      displayGroup: metric.displayGroup,
      metadataJson: metric.metadataJson,
    })),
  });
}
