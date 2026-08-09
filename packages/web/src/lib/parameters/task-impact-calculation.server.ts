import {
  ModelRevisionStatus,
  OrganizationMemberRole,
  SourceArtifactType,
  SourceSystem,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
} from "@optimitron/db/enums";
import { Prisma, type PrismaClient } from "@optimitron/db";
import {
  MISSION_VALUE_HORIZON_YEARS,
  sha256CanonicalJson,
} from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma as defaultPrisma } from "../prisma";
import { getSourceArtifactVisibilityWhere } from "../source-artifact-visibility.server";
import {
  CalculationSourcePayloadSchema,
  sourceArtifactFingerprint,
  storeInlineCalculationSourceArtifact,
} from "../source-artifacts";
import type { ParameterActor } from "./parameter-catalog.server";
import {
  canReadParameterRevision,
  getParameterTrace,
  ParameterAuthorizationError,
} from "./parameter-catalog.server";

const NullableFiniteNumber = z.number().finite().nullable().optional();
type ImpactDb = PrismaClient | Prisma.TransactionClient;

const TaskImpactParameterInputSchema = z
  .object({
    parameterKey: z.string().min(1),
    revisionId: z.string().min(1).optional(),
    symbol: z.string().min(1),
  })
  .strict();

export const DirectTaskImpactFrameSchema = z.object({
  adoptionRampYears: z.number().finite().nonnegative().default(0),
  benefitDurationYears: z.number().finite().positive().optional(),
  delayDalysLostPerDayBase: NullableFiniteNumber,
  delayDalysLostPerDayHigh: NullableFiniteNumber,
  delayDalysLostPerDayLow: NullableFiniteNumber,
  delayEconomicValueUsdLostPerDayBase: NullableFiniteNumber,
  delayEconomicValueUsdLostPerDayHigh: NullableFiniteNumber,
  delayEconomicValueUsdLostPerDayLow: NullableFiniteNumber,
  estimatedCashCostUsdBase: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  estimatedCashCostUsdHigh: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  estimatedCashCostUsdLow: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  estimatedEffortHoursBase: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  estimatedEffortHoursHigh: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  estimatedEffortHoursLow: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional(),
  // Mission default: one human lifetime, matching the LIFETIME frame default
  // below. An omitted horizon must never silently become a shorter frame than
  // the value the caller was told to compute.
  evaluationHorizonYears: z
    .number()
    .finite()
    .positive()
    .default(MISSION_VALUE_HORIZON_YEARS),
  expectedDalysAvertedBase: NullableFiniteNumber,
  expectedDalysAvertedHigh: NullableFiniteNumber,
  expectedDalysAvertedLow: NullableFiniteNumber,
  expectedEconomicValueUsdBase: NullableFiniteNumber,
  expectedEconomicValueUsdHigh: NullableFiniteNumber,
  expectedEconomicValueUsdLow: NullableFiniteNumber,
  medianHealthyLifeYearsEffectBase: NullableFiniteNumber,
  medianHealthyLifeYearsEffectHigh: NullableFiniteNumber,
  medianHealthyLifeYearsEffectLow: NullableFiniteNumber,
  medianIncomeGrowthEffectPpPerYearBase: NullableFiniteNumber,
  medianIncomeGrowthEffectPpPerYearHigh: NullableFiniteNumber,
  medianIncomeGrowthEffectPpPerYearLow: NullableFiniteNumber,
  successProbabilityBase: z
    .number()
    .finite()
    .min(0)
    .max(1)
    .nullable()
    .optional(),
  successProbabilityHigh: z
    .number()
    .finite()
    .min(0)
    .max(1)
    .nullable()
    .optional(),
  successProbabilityLow: z
    .number()
    .finite()
    .min(0)
    .max(1)
    .nullable()
    .optional(),
  timeToImpactStartDays: z.number().finite().nonnegative().default(0),
});

export const DirectTaskImpactMetricSchema = z.object({
  baseValue: z.number().finite(),
  displayGroup: z.string().nullable().optional(),
  highValue: NullableFiniteNumber,
  lowValue: NullableFiniteNumber,
  metricKey: z.string().min(1),
  unit: z.string().min(1),
});

export const DirectTaskImpactInputSchema = z
  .object({
    assumptions: z.array(z.string()).default([]),
    calculationCode: z.string().max(1_000_000).nullable().optional(),
    calculationLanguage: z.string().max(100).nullable().optional(),
    calculationSource: CalculationSourcePayloadSchema.nullable().optional(),
    calculationVersion: z.string().min(1).default("task-impact.v1"),
    counterfactualKey: z.string().min(1).default("status-quo"),
    estimateNotes: z.string().nullable().optional(),
    formulaLatex: z.string().nullable().optional(),
    formulaText: z.string().nullable().optional(),
    frame: DirectTaskImpactFrameSchema.default({}),
    frameKey: z
      .nativeEnum(TaskImpactFrameKey)
      .default(TaskImpactFrameKey.LIFETIME),
    metrics: z.array(DirectTaskImpactMetricSchema).max(100).default([]),
    methodologyKey: z.string().min(1).nullable().optional(),
    parameterInputs: z
      .array(TaskImpactParameterInputSchema)
      .max(256)
      .default([])
      .superRefine((inputs, context) => {
        const symbols = new Set<string>();
        for (const [index, input] of inputs.entries()) {
          if (symbols.has(input.symbol)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate input symbol: ${input.symbol}`,
              path: [index, "symbol"],
            });
          }
          symbols.add(input.symbol);
        }
      }),
    sourceUrls: z.array(z.string().url()).max(100).default([]),
    taskId: z.string().min(1),
  })
  .strict();

export type DirectTaskImpactInput = z.infer<typeof DirectTaskImpactInputSchema>;

const FRAME_FIELD_UNITS: Record<string, string> = {
  delayDalysLostPerDayBase: "DALY/day",
  delayDalysLostPerDayHigh: "DALY/day",
  delayDalysLostPerDayLow: "DALY/day",
  delayEconomicValueUsdLostPerDayBase: "USD/day",
  delayEconomicValueUsdLostPerDayHigh: "USD/day",
  delayEconomicValueUsdLostPerDayLow: "USD/day",
  estimatedCashCostUsdBase: "USD",
  estimatedCashCostUsdHigh: "USD",
  estimatedCashCostUsdLow: "USD",
  estimatedEffortHoursBase: "hour",
  estimatedEffortHoursHigh: "hour",
  estimatedEffortHoursLow: "hour",
  expectedDalysAvertedBase: "DALY",
  expectedDalysAvertedHigh: "DALY",
  expectedDalysAvertedLow: "DALY",
  expectedEconomicValueUsdBase: "USD",
  expectedEconomicValueUsdHigh: "USD",
  expectedEconomicValueUsdLow: "USD",
  medianHealthyLifeYearsEffectBase: "year",
  medianHealthyLifeYearsEffectHigh: "year",
  medianHealthyLifeYearsEffectLow: "year",
  medianIncomeGrowthEffectPpPerYearBase: "percentage-point/year",
  medianIncomeGrowthEffectPpPerYearHigh: "percentage-point/year",
  medianIncomeGrowthEffectPpPerYearLow: "percentage-point/year",
  successProbabilityBase: "probability",
  successProbabilityHigh: "probability",
  successProbabilityLow: "probability",
};

function assertRange(
  record: Record<string, number | null | undefined>,
  prefix: string,
) {
  const low = record[`${prefix}Low`];
  const base = record[`${prefix}Base`];
  const high = record[`${prefix}High`];
  if (low != null && high != null && low > high) {
    throw new Error(`${prefix}Low must not exceed ${prefix}High.`);
  }
  if (low != null && base != null && low > base) {
    throw new Error(`${prefix}Low must not exceed ${prefix}Base.`);
  }
  if (base != null && high != null && base > high) {
    throw new Error(`${prefix}Base must not exceed ${prefix}High.`);
  }
}

function validateRanges(input: DirectTaskImpactInput) {
  const frame = input.frame as Record<string, number | null | undefined>;
  for (const prefix of [
    "delayDalysLostPerDay",
    "delayEconomicValueUsdLostPerDay",
    "estimatedCashCostUsd",
    "estimatedEffortHours",
    "expectedDalysAverted",
    "expectedEconomicValueUsd",
    "medianHealthyLifeYearsEffect",
    "medianIncomeGrowthEffectPpPerYear",
    "successProbability",
  ]) {
    assertRange(frame, prefix);
  }
  for (const metric of input.metrics) {
    if (
      metric.lowValue != null &&
      metric.highValue != null &&
      metric.lowValue > metric.highValue
    ) {
      throw new Error(
        `${metric.metricKey} lowValue must not exceed highValue.`,
      );
    }
    if (metric.lowValue != null && metric.lowValue > metric.baseValue) {
      throw new Error(
        `${metric.metricKey} lowValue must not exceed baseValue.`,
      );
    }
    if (metric.highValue != null && metric.baseValue > metric.highValue) {
      throw new Error(
        `${metric.metricKey} baseValue must not exceed highValue.`,
      );
    }
  }
}

export function validateDirectTaskImpactInput(rawInput: unknown) {
  const input = DirectTaskImpactInputSchema.parse(rawInput);
  validateRanges(input);
  return input;
}

async function canEditTask(
  task: {
    assigneePersonId: string | null;
    createdByUserId: string;
    ownerOrganizationId: string | null;
  },
  actor: ParameterActor,
  db: ImpactDb,
) {
  if (actor.isAdmin) return true;
  if (!actor.userId) return false;
  if (task.createdByUserId === actor.userId) return true;
  if (task.ownerOrganizationId) {
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: task.ownerOrganizationId,
          userId: actor.userId,
        },
      },
      select: { role: true },
    });
    if (
      membership?.role === OrganizationMemberRole.OWNER ||
      membership?.role === OrganizationMemberRole.ADMIN
    )
      return true;
  }
  const user = await db.user.findUnique({
    where: { id: actor.userId },
    select: { personId: true },
  });
  return Boolean(user?.personId && user.personId === task.assigneePersonId);
}

interface DirectValue {
  key: string;
  unit: string;
  value: number;
}

function directValues(input: DirectTaskImpactInput): DirectValue[] {
  const values: DirectValue[] = [];
  for (const [key, unit] of Object.entries(FRAME_FIELD_UNITS)) {
    const value = (input.frame as Record<string, unknown>)[key];
    if (typeof value === "number") {
      values.push({ key: `frame.${key}`, unit, value });
    }
  }
  for (const metric of input.metrics) {
    values.push({
      key: `metric.${metric.metricKey}.base`,
      unit: metric.unit,
      value: metric.baseValue,
    });
    if (metric.lowValue != null) {
      values.push({
        key: `metric.${metric.metricKey}.low`,
        unit: metric.unit,
        value: metric.lowValue,
      });
    }
    if (metric.highValue != null) {
      values.push({
        key: `metric.${metric.metricKey}.high`,
        unit: metric.unit,
        value: metric.highValue,
      });
    }
  }
  return values.sort((left, right) => left.key.localeCompare(right.key));
}

async function resolveParameterInputs(
  input: DirectTaskImpactInput,
  actor: ParameterActor,
  db: ImpactDb,
) {
  const resolved = [];
  for (const [position, reference] of input.parameterInputs.entries()) {
    const revision = reference.revisionId
      ? await db.parameterRevision.findUnique({
          where: { id: reference.revisionId },
          include: { parameter: true },
        })
      : await db.parameterDefinition
          .findUnique({
            where: { key: reference.parameterKey },
            include: { currentRevision: { include: { parameter: true } } },
          })
          .then((definition) => definition?.currentRevision ?? null);
    if (!revision || revision.deletedAt || revision.parameter.deletedAt) {
      throw new Error(`Parameter input not found: ${reference.parameterKey}.`);
    }
    if (revision.parameter.key !== reference.parameterKey) {
      throw new Error(
        `Parameter revision ${revision.id} does not belong to ${reference.parameterKey}.`,
      );
    }
    if (!canReadParameterRevision(revision, actor)) {
      throw new ParameterAuthorizationError(
        `You cannot read parameter input ${reference.symbol}.`,
      );
    }
    resolved.push({ position, revision, symbol: reference.symbol });
  }
  return resolved;
}

async function createDirectTaskImpactWithTransaction(
  rawInput: unknown,
  actor: ParameterActor,
  options: { publish: boolean },
  tx: Prisma.TransactionClient,
) {
  if (!actor.userId) {
    throw new ParameterAuthorizationError("Authentication is required.");
  }
  const input = validateDirectTaskImpactInput(rawInput);
  const task = await tx.task.findUnique({
    where: { id: input.taskId },
    select: {
      assigneePersonId: true,
      createdByUserId: true,
      currentImpactEstimateSet: {
        select: {
          id: true,
          frames: {
            where: { deletedAt: null, frameKey: input.frameKey },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      deletedAt: true,
      id: true,
      isPublic: true,
      ownerOrganizationId: true,
      taskKey: true,
      title: true,
    },
  });
  if (!task || task.deletedAt) throw new Error("Task not found.");
  if (!(await canEditTask(task, actor, tx))) {
    throw new ParameterAuthorizationError(
      "You cannot propose an impact for this task.",
    );
  }
  if (task.isPublic && options.publish && !actor.isAdmin) {
    throw new ParameterAuthorizationError(
      "Only an admin may publish a public task impact.",
    );
  }

  const values = directValues(input);
  if (values.length === 0) {
    throw new Error("At least one finite task-impact value is required.");
  }
  const parameterInputs = await resolveParameterInputs(input, actor, tx);
  if (
    options.publish &&
    parameterInputs.some(
      ({ revision }) =>
        revision.status !== ModelRevisionStatus.PUBLISHED &&
        revision.status !== ModelRevisionStatus.SUPERSEDED,
    )
  ) {
    throw new Error(
      "Publish every parameter revision before publishing this task impact.",
    );
  }

  const inlineArtifact = input.calculationSource
    ? await storeInlineCalculationSourceArtifact(input.calculationSource, tx)
    : null;
  const sourceArtifacts = inlineArtifact ? [inlineArtifact] : [];
  const artifactFingerprints = sourceArtifacts
    .map(sourceArtifactFingerprint)
    .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
  const {
    calculationSource: _calculationSource,
    parameterInputs: _parameterInputs,
    ...inputWithoutSources
  } = input;
  const pinnedInputs = parameterInputs
    .map(({ revision, symbol }) => ({
      parameterKey: revision.parameter.key,
      revisionId: revision.id,
      sourceContentHash: revision.sourceContentHash,
      symbol,
    }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
  const parameterSetHash = await sha256CanonicalJson({
    estimate: inputWithoutSources,
    parameterInputs: pinnedInputs,
    sourceArtifacts: artifactFingerprints,
  });
  const calculationCode =
    input.calculationCode ?? input.calculationSource?.source ?? null;
  const calculationLanguage =
    input.calculationLanguage ?? input.calculationSource?.language ?? null;
  const methodologyKey =
    input.methodologyKey ??
    (input.formulaText || calculationCode
      ? "formula-estimate"
      : "direct-estimate");
  const publicationStatus = options.publish
    ? TaskImpactPublicationStatus.PUBLISHED
    : TaskImpactPublicationStatus.DRAFT;
  const shouldBecomeCurrent = options.publish || !task.isPublic;

  const estimateSet = await tx.taskImpactEstimateSet.upsert({
    where: {
      taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey:
        {
          calculationVersion: input.calculationVersion,
          counterfactualKey: input.counterfactualKey,
          estimateKind: TaskImpactEstimateKind.FORECAST,
          methodologyKey,
          parameterSetHash,
          sourceSystem: SourceSystem.PARAMETER_CATALOG,
          taskId: task.id,
        },
    },
    create: {
      assumptionsJson: {
        assumptions: input.assumptions,
        estimateNotes: input.estimateNotes ?? null,
        expectedEconomicValueSemantics:
          "expectedEconomicValueUsd values are already probability-weighted",
        sourceUrls: input.sourceUrls,
      },
      calculationCode,
      calculationLanguage,
      calculationVersion: input.calculationVersion,
      counterfactualKey: input.counterfactualKey,
      estimateKind: TaskImpactEstimateKind.FORECAST,
      formulaLatex: input.formulaLatex ?? null,
      formulaText: input.formulaText ?? null,
      isCurrent: false,
      methodologyKey,
      parameterSetHash,
      publicationStatus,
      sourceSystem: SourceSystem.PARAMETER_CATALOG,
      taskId: task.id,
    },
    update: options.publish ? { publicationStatus } : {},
  });
  if (parameterInputs.length > 0) {
    await tx.taskImpactEstimateInput.createMany({
      data: parameterInputs.map(({ position, revision, symbol }) => ({
        parameterRevisionId: revision.id,
        position,
        symbol,
        taskImpactEstimateSetId: estimateSet.id,
      })),
      skipDuplicates: true,
    });
  }

  const frameSlug = `${input.frameKey.toLowerCase()}-${methodologyKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${parameterSetHash.slice(0, 12)}`;
  const frame = await tx.taskImpactFrameEstimate.upsert({
    where: {
      taskImpactEstimateSetId_frameSlug: {
        frameSlug,
        taskImpactEstimateSetId: estimateSet.id,
      },
    },
    create: {
      ...input.frame,
      // Inert: the column is NOT NULL with no default, so a value is still
      // required here. Nothing reads it. Mission estimates are undiscounted --
      // uncertainty is priced by successProbability, so discounting for risk
      // would charge for it twice (docs/EXPECTED_VALUE_METHODOLOGY.md). The
      // column is dropped in a follow-up migration; delete this line with it.
      annualDiscountRate: 0,
      benefitDurationYears:
        input.frame.benefitDurationYears ?? input.frame.evaluationHorizonYears,
      frameKey: input.frameKey,
      frameSlug,
      taskImpactEstimateSetId: estimateSet.id,
    },
    update: {},
  });
  if (input.metrics.length > 0) {
    await tx.taskImpactMetric.createMany({
      data: input.metrics.map((metric) => ({
        baseValue: metric.baseValue,
        displayGroup: metric.displayGroup ?? null,
        highValue: metric.highValue ?? null,
        lowValue: metric.lowValue ?? null,
        metricKey: metric.metricKey,
        taskImpactFrameEstimateId: frame.id,
        unit: metric.unit,
      })),
      skipDuplicates: true,
    });
  }

  for (const sourceUrl of input.sourceUrls) {
    const sourceHash = await sha256CanonicalJson({ sourceUrl });
    sourceArtifacts.push(
      await tx.sourceArtifact.upsert({
        where: { sourceKey: `task-impact-source:${sourceHash}` },
        create: {
          artifactType: SourceArtifactType.EXTERNAL_SOURCE,
          contentHash: sourceHash,
          sourceKey: `task-impact-source:${sourceHash}`,
          sourceSystem: SourceSystem.EXTERNAL,
          sourceUrl,
          title: sourceUrl,
        },
        update: {},
      }),
    );
  }
  if (sourceArtifacts.length > 0) {
    await tx.taskImpactSourceArtifact.createMany({
      data: sourceArtifacts.map((artifact, index) => ({
        isPrimary: index === 0,
        sourceArtifactId: artifact.id,
        taskImpactEstimateSetId: estimateSet.id,
      })),
      skipDuplicates: true,
    });
  }

  if (shouldBecomeCurrent) {
    await tx.taskImpactEstimateSet.updateMany({
      where: {
        id: { not: estimateSet.id },
        isCurrent: true,
        taskId: task.id,
      },
      data: { isCurrent: false },
    });
    await tx.taskImpactEstimateSet.update({
      where: { id: estimateSet.id },
      data: { isCurrent: true },
    });
    await tx.task.update({
      where: { id: task.id },
      data: { currentImpactEstimateSetId: estimateSet.id },
    });
  }

  return {
    estimateSetId: estimateSet.id,
    frameId: frame.id,
    isCurrent: shouldBecomeCurrent || estimateSet.isCurrent,
    parameterSetHash,
    publicationStatus: estimateSet.publicationStatus,
    requiresReview:
      estimateSet.publicationStatus !== TaskImpactPublicationStatus.PUBLISHED &&
      estimateSet.publicationStatus !== TaskImpactPublicationStatus.REVIEWED,
    review: {
      assumptions: input.assumptions,
      currentEstimateSetId: task.currentImpactEstimateSet?.id ?? null,
      expectedEconomicValueUsdBaseDelta:
        input.frame.expectedEconomicValueUsdBase == null ||
        task.currentImpactEstimateSet?.frames[0]
          ?.expectedEconomicValueUsdBase == null
          ? null
          : input.frame.expectedEconomicValueUsdBase -
            task.currentImpactEstimateSet.frames[0]
              .expectedEconomicValueUsdBase,
      formulaLatex: input.formulaLatex ?? null,
      formulaText: input.formulaText ?? null,
      frame: input.frame,
      metrics: input.metrics,
      parameterInputs: pinnedInputs,
      sourceArtifactIds: sourceArtifacts.map((artifact) => artifact.id),
      sourceUrls: input.sourceUrls,
    },
    taskId: task.id,
  };
}

export async function createDirectTaskImpactInTransaction(
  rawInput: unknown,
  actor: ParameterActor,
  options: { publish: boolean },
  tx: Prisma.TransactionClient,
) {
  return createDirectTaskImpactWithTransaction(rawInput, actor, options, tx);
}

export async function createDirectTaskImpact(
  rawInput: unknown,
  actor: ParameterActor,
  options: { publish: boolean },
  db: PrismaClient = defaultPrisma,
) {
  return db.$transaction(
    (tx) => createDirectTaskImpactWithTransaction(rawInput, actor, options, tx),
    { maxWait: 10_000, timeout: 60_000 },
  );
}

export async function getTaskImpactTrace(
  input: { estimateSetId?: string; taskId?: string },
  actor: ParameterActor,
  db: PrismaClient = defaultPrisma,
) {
  const estimateSetId =
    input.estimateSetId ??
    (input.taskId
      ? (
          await db.task.findFirst({
            where: { deletedAt: null, id: input.taskId },
            select: { currentImpactEstimateSetId: true },
          })
        )?.currentImpactEstimateSetId
      : null);
  if (!estimateSetId) throw new Error("Task impact estimate not found.");

  const estimateSet = await db.taskImpactEstimateSet.findFirst({
    where: { deletedAt: null, id: estimateSetId },
    include: {
      frames: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { metrics: { where: { deletedAt: null } } },
      },
      inputs: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
      },
      sourceArtifacts: {
        where: {
          deletedAt: null,
          sourceArtifact: getSourceArtifactVisibilityWhere(actor.userId),
        },
        select: {
          sourceArtifact: {
            select: {
              artifactType: true,
              contentHash: true,
              id: true,
              sourceKey: true,
              sourceRef: true,
              sourceSystem: true,
              sourceUrl: true,
              title: true,
              versionKey: true,
            },
          },
        },
      },
      task: {
        select: {
          assigneePersonId: true,
          createdByUserId: true,
          id: true,
          isPublic: true,
          ownerOrganizationId: true,
          title: true,
        },
      },
    },
  });
  if (!estimateSet) throw new Error("Task impact estimate not found.");
  if (
    !estimateSet.task.isPublic &&
    !(await canEditTask(estimateSet.task, actor, db))
  ) {
    throw new Error("Task impact estimate not found.");
  }
  if (
    estimateSet.task.isPublic &&
    estimateSet.publicationStatus !== TaskImpactPublicationStatus.PUBLISHED &&
    estimateSet.publicationStatus !== TaskImpactPublicationStatus.REVIEWED &&
    !(await canEditTask(estimateSet.task, actor, db))
  ) {
    throw new Error("Task impact estimate not found.");
  }

  const parameterTraces = await Promise.all(
    estimateSet.inputs.map(async (inputRow) => ({
      revision: await getParameterTrace(
        { revisionId: inputRow.parameterRevisionId },
        actor,
        db,
      ),
      symbol: inputRow.symbol,
    })),
  );
  const staleInputs = parameterTraces
    .filter(({ revision }) => revision.stale)
    .map(({ revision, symbol }) => ({
      currentRevisionId: revision.currentRevisionId,
      parameterKey: revision.key,
      pinnedRevisionId: revision.id,
      symbol,
    }));

  return {
    ...estimateSet,
    parameterTraces,
    stale: staleInputs.length > 0,
    staleInputs,
  };
}
