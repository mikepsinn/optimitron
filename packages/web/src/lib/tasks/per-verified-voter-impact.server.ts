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
    "updateMany" | "upsert"
  >;
  taskImpactFrameEstimate: Pick<PrismaClient["taskImpactFrameEstimate"], "upsert">;
  taskImpactMetric: Pick<PrismaClient["taskImpactMetric"], "updateMany" | "upsert">;
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

  const estimateSetKey = {
    taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey:
      {
        calculationVersion: "seed-v1",
        counterfactualKey: "status-quo",
        estimateKind: "FORECAST" as const,
        methodologyKey: TREATY_PER_VERIFIED_VOTER_METHODOLOGY_KEY,
        parameterSetHash: TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH,
        sourceSystem: "PARAMETER_CATALOG" as const,
        taskId,
      },
  } satisfies Prisma.TaskImpactEstimateSetWhereUniqueInput;
  const estimateSetData = {
    assumptionsJson: {
      calculationsUrl: TREATY_IMPACT_CALCULATIONS_URL,
      parameterNames: [
        DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.parameterName,
        DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.parameterName,
        GLOBAL_REGISTERED_VOTERS.parameterName,
      ].filter((name): name is string => Boolean(name)),
    },
    calculationVersion: "seed-v1",
    counterfactualKey: "status-quo",
    estimateKind: "FORECAST" as const,
    methodologyKey: TREATY_PER_VERIFIED_VOTER_METHODOLOGY_KEY,
    parameterSetHash: TREATY_PER_VERIFIED_VOTER_PARAMETER_SET_HASH,
    publicationStatus: "PUBLISHED" as const,
    sourceSystem: "PARAMETER_CATALOG" as const,
  };

  const estimateSet = await db.taskImpactEstimateSet.upsert({
    where: estimateSetKey,
    create: {
      ...estimateSetData,
      isCurrent: true,
      taskId,
    },
    update: {
      ...estimateSetData,
      deletedAt: null,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  await db.taskImpactEstimateSet.updateMany({
    where: {
      deletedAt: null,
      isCurrent: true,
      taskId,
      NOT: {
        id: estimateSet.id,
      },
    },
    data: { isCurrent: false },
  });

  await db.task.update({
    where: { id: taskId },
    data: { currentImpactEstimateSetId: estimateSet.id },
  });

  const frameData = {
    adoptionRampYears: 5,
    annualDiscountRate: 0,
    benefitDurationYears: impact.benefitDurationYears,
    delayDalysLostPerDayBase: impact.delayDalysLostPerDayBase,
    delayEconomicValueUsdLostPerDayBase:
      impact.delayEconomicValueUsdLostPerDayBase,
    estimatedCashCostUsdBase: impact.estimatedCashCostUsdBase,
    estimatedEffortHoursBase: 0.01,
    evaluationHorizonYears: impact.benefitDurationYears,
    expectedDalysAvertedBase: impact.expectedDalysAvertedBase,
    expectedEconomicValueUsdBase: impact.expectedEconomicValueUsdBase,
    frameKey: "LIFETIME" as const,
    successProbabilityBase: impact.successProbabilityBase,
    timeToImpactStartDays: 365,
  };
  const frame = await db.taskImpactFrameEstimate.upsert({
    where: {
      taskImpactEstimateSetId_frameSlug: {
        frameSlug: "lifetime",
        taskImpactEstimateSetId: estimateSet.id,
      },
    },
    create: {
      ...frameData,
      frameSlug: "lifetime",
      taskImpactEstimateSetId: estimateSet.id,
    },
    update: {
      ...frameData,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  const metricKeys = impact.metrics.map((metric) => metric.metricKey);
  for (const metric of impact.metrics) {
    await db.taskImpactMetric.upsert({
      where: {
        taskImpactFrameEstimateId_metricKey: {
          metricKey: metric.metricKey,
          taskImpactFrameEstimateId: frame.id,
        },
      },
      create: {
        taskImpactFrameEstimateId: frame.id,
        metricKey: metric.metricKey,
        unit: metric.unit ?? "",
        baseValue: metric.baseValue,
        displayGroup: metric.displayGroup,
        metadataJson: metric.metadataJson,
      },
      update: {
        unit: metric.unit ?? "",
        baseValue: metric.baseValue,
        deletedAt: null,
        displayGroup: metric.displayGroup,
        metadataJson: metric.metadataJson,
      },
    });
  }

  await db.taskImpactMetric.updateMany({
    where: {
      deletedAt: null,
      metricKey: {
        notIn: metricKeys,
      },
      taskImpactFrameEstimateId: frame.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}
