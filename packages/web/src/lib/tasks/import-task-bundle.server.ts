import { Prisma } from "@optimitron/db";
import { upsertTrustedOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { upsertPrimaryTaskCommunicationEndpoint } from "@/lib/tasks/task-communication-endpoints.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";
import type {
  ImportedImpactEstimateDraft,
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
  ImportedTaskBundle,
} from "@/lib/tasks/opg-obg-adapters";

interface UpsertImportedTaskBundleOptions {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  createdByUserId?: string | null;
  isPublic?: boolean;
  jurisdictionId?: string | null;
  parentTaskId?: string | null;
  taskId?: string | null;
  verifiedByUserId?: string | null;
}

function toJsonValue(
  value: Record<string, unknown> | unknown[] | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value == null) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

async function upsertSourceArtifact(
  tx: Prisma.TransactionClient,
  draft: ImportedSourceArtifactDraft,
) {
  return tx.sourceArtifact.upsert({
    where: {
      sourceKey: draft.sourceKey,
    },
    create: {
      artifactType: draft.artifactType,
      contentHash: draft.contentHash,
      deletedAt: null,
      externalKey: draft.externalKey,
      payloadJson: toJsonValue(draft.payloadJson),
      sourceKey: draft.sourceKey,
      sourceRef: draft.sourceRef,
      sourceSystem: draft.sourceSystem,
      sourceUrl: draft.sourceUrl,
      title: draft.title,
      versionKey: draft.versionKey,
    },
    update: {
      artifactType: draft.artifactType,
      contentHash: draft.contentHash,
      deletedAt: null,
      externalKey: draft.externalKey,
      payloadJson: toJsonValue(draft.payloadJson),
      sourceRef: draft.sourceRef,
      sourceSystem: draft.sourceSystem,
      sourceUrl: draft.sourceUrl,
      title: draft.title,
      versionKey: draft.versionKey,
    },
  });
}

async function syncTaskSourceArtifacts(
  tx: Prisma.TransactionClient,
  taskId: string,
  sourceArtifacts: ImportedSourceArtifactDraft[],
) {
  const artifactRecords = await Promise.all(
    sourceArtifacts.map((artifact) => upsertSourceArtifact(tx, artifact)),
  );
  const primaryArtifactId = artifactRecords[0]?.id ?? null;
  const artifactIds = artifactRecords.map((artifact) => artifact.id);

  await tx.taskSourceArtifact.updateMany({
    where: {
      deletedAt: null,
      taskId,
    },
    data: {
      isPrimary: false,
    },
  });

  for (const artifact of artifactRecords) {
    await tx.taskSourceArtifact.upsert({
      where: {
        taskId_sourceArtifactId: {
          sourceArtifactId: artifact.id,
          taskId,
        },
      },
      create: {
        isPrimary: artifact.id === primaryArtifactId,
        sourceArtifactId: artifact.id,
        taskId,
      },
      update: {
        deletedAt: null,
        isPrimary: artifact.id === primaryArtifactId,
      },
    });
  }

  await tx.taskSourceArtifact.updateMany({
    where: {
      deletedAt: null,
      taskId,
      ...(artifactIds.length > 0
        ? {
            sourceArtifactId: {
              notIn: artifactIds,
            },
          }
        : {}),
    },
    data: {
      deletedAt: new Date(),
      isPrimary: false,
    },
  });

  return artifactRecords;
}

async function upsertImpactEstimateSet(
  tx: Prisma.TransactionClient,
  taskId: string,
  draft: ImportedImpactEstimateDraft,
) {
  const existing = await tx.taskImpactEstimateSet.findFirst({
    where: {
      calculationVersion: draft.calculationVersion,
      counterfactualKey: draft.counterfactualKey,
      deletedAt: null,
      estimateKind: draft.estimateKind,
      methodologyKey: draft.methodologyKey,
      parameterSetHash: draft.parameterSetHash,
      sourceSystem: draft.sourceSystem,
      taskId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return tx.taskImpactEstimateSet.update({
      where: { id: existing.id },
      data: {
        assumptionsJson: toJsonValue(draft.assumptionsJson),
        calculationCode: draft.calculationCode ?? null,
        calculationLanguage: draft.calculationLanguage ?? null,
        deletedAt: null,
        formulaLatex: draft.formulaLatex ?? null,
        formulaText: draft.formulaText ?? null,
        publicationStatus: draft.publicationStatus,
      },
    });
  }

  return tx.taskImpactEstimateSet.create({
    data: {
      assumptionsJson: toJsonValue(draft.assumptionsJson),
      calculationCode: draft.calculationCode ?? null,
      calculationLanguage: draft.calculationLanguage ?? null,
      calculationVersion: draft.calculationVersion,
      counterfactualKey: draft.counterfactualKey,
      estimateKind: draft.estimateKind,
      formulaLatex: draft.formulaLatex ?? null,
      formulaText: draft.formulaText ?? null,
      methodologyKey: draft.methodologyKey,
      parameterSetHash: draft.parameterSetHash,
      publicationStatus: draft.publicationStatus,
      sourceSystem: draft.sourceSystem,
      taskId,
    },
  });
}

export async function syncImpactParameterInputs(
  tx: Prisma.TransactionClient,
  taskImpactEstimateSetId: string,
  parameterKeys: readonly string[] | undefined,
) {
  if (parameterKeys == null) return { linked: 0, missingKeys: [] };
  const keys = [
    ...new Set(parameterKeys.map((key) => key.trim()).filter(Boolean)),
  ].sort();
  const definitions = await tx.parameterDefinition.findMany({
    where: {
      currentRevisionId: { not: null },
      deletedAt: null,
      key: { in: keys },
    },
    select: { currentRevisionId: true, key: true },
  });
  const byKey = new Map(
    definitions.flatMap((definition) =>
      definition.currentRevisionId
        ? [[definition.key, definition.currentRevisionId] as const]
        : [],
    ),
  );
  const linked = keys.flatMap((key) => {
    const revisionId = byKey.get(key);
    return revisionId ? [{ key, revisionId }] : [];
  });

  await tx.taskImpactEstimateInput.deleteMany({
    where: { taskImpactEstimateSetId },
  });
  if (linked.length > 0) {
    await tx.taskImpactEstimateInput.createMany({
      data: linked.map((input, position) => ({
        parameterRevisionId: input.revisionId,
        position,
        symbol: input.key,
        taskImpactEstimateSetId,
      })),
    });
  }
  return {
    linked: linked.length,
    missingKeys: keys.filter((key) => !byKey.has(key)),
  };
}

async function upsertImpactFrame(
  tx: Prisma.TransactionClient,
  taskImpactEstimateSetId: string,
  frame: ImportedImpactFrameDraft,
) {
  return tx.taskImpactFrameEstimate.upsert({
    where: {
      taskImpactEstimateSetId_frameSlug: {
        frameSlug: frame.frameSlug,
        taskImpactEstimateSetId,
      },
    },
    create: {
      adoptionRampYears: frame.adoptionRampYears,
      annualDiscountRate: frame.annualDiscountRate,
      benefitDurationYears: frame.benefitDurationYears,
      customFrameLabel: frame.customFrameLabel,
      delayDalysLostPerDayBase: frame.delayDalysLostPerDayBase,
      delayDalysLostPerDayHigh: frame.delayDalysLostPerDayHigh,
      delayDalysLostPerDayLow: frame.delayDalysLostPerDayLow,
      delayEconomicValueUsdLostPerDayBase:
        frame.delayEconomicValueUsdLostPerDayBase,
      delayEconomicValueUsdLostPerDayHigh:
        frame.delayEconomicValueUsdLostPerDayHigh,
      delayEconomicValueUsdLostPerDayLow:
        frame.delayEconomicValueUsdLostPerDayLow,
      estimatedCashCostUsdBase: frame.estimatedCashCostUsdBase,
      estimatedCashCostUsdHigh: frame.estimatedCashCostUsdHigh,
      estimatedCashCostUsdLow: frame.estimatedCashCostUsdLow,
      estimatedEffortHoursBase: frame.estimatedEffortHoursBase,
      estimatedEffortHoursHigh: frame.estimatedEffortHoursHigh,
      estimatedEffortHoursLow: frame.estimatedEffortHoursLow,
      evaluationHorizonYears: frame.evaluationHorizonYears,
      expectedDalysAvertedBase: frame.expectedDalysAvertedBase,
      expectedDalysAvertedHigh: frame.expectedDalysAvertedHigh,
      expectedDalysAvertedLow: frame.expectedDalysAvertedLow,
      expectedEconomicValueUsdBase: frame.expectedEconomicValueUsdBase,
      expectedEconomicValueUsdHigh: frame.expectedEconomicValueUsdHigh,
      expectedEconomicValueUsdLow: frame.expectedEconomicValueUsdLow,
      frameKey: frame.frameKey,
      frameSlug: frame.frameSlug,
      medianHealthyLifeYearsEffectBase: frame.medianHealthyLifeYearsEffectBase,
      medianHealthyLifeYearsEffectHigh: frame.medianHealthyLifeYearsEffectHigh,
      medianHealthyLifeYearsEffectLow: frame.medianHealthyLifeYearsEffectLow,
      medianIncomeGrowthEffectPpPerYearBase:
        frame.medianIncomeGrowthEffectPpPerYearBase,
      medianIncomeGrowthEffectPpPerYearHigh:
        frame.medianIncomeGrowthEffectPpPerYearHigh,
      medianIncomeGrowthEffectPpPerYearLow:
        frame.medianIncomeGrowthEffectPpPerYearLow,
      successProbabilityBase: frame.successProbabilityBase,
      successProbabilityHigh: frame.successProbabilityHigh,
      successProbabilityLow: frame.successProbabilityLow,
      summaryStatsJson: toJsonValue(frame.summaryStatsJson ?? null),
      taskImpactEstimateSetId,
      timeToImpactStartDays: frame.timeToImpactStartDays,
    },
    update: {
      adoptionRampYears: frame.adoptionRampYears,
      annualDiscountRate: frame.annualDiscountRate,
      benefitDurationYears: frame.benefitDurationYears,
      customFrameLabel: frame.customFrameLabel,
      delayDalysLostPerDayBase: frame.delayDalysLostPerDayBase,
      delayDalysLostPerDayHigh: frame.delayDalysLostPerDayHigh,
      delayDalysLostPerDayLow: frame.delayDalysLostPerDayLow,
      delayEconomicValueUsdLostPerDayBase:
        frame.delayEconomicValueUsdLostPerDayBase,
      delayEconomicValueUsdLostPerDayHigh:
        frame.delayEconomicValueUsdLostPerDayHigh,
      delayEconomicValueUsdLostPerDayLow:
        frame.delayEconomicValueUsdLostPerDayLow,
      deletedAt: null,
      estimatedCashCostUsdBase: frame.estimatedCashCostUsdBase,
      estimatedCashCostUsdHigh: frame.estimatedCashCostUsdHigh,
      estimatedCashCostUsdLow: frame.estimatedCashCostUsdLow,
      estimatedEffortHoursBase: frame.estimatedEffortHoursBase,
      estimatedEffortHoursHigh: frame.estimatedEffortHoursHigh,
      estimatedEffortHoursLow: frame.estimatedEffortHoursLow,
      evaluationHorizonYears: frame.evaluationHorizonYears,
      expectedDalysAvertedBase: frame.expectedDalysAvertedBase,
      expectedDalysAvertedHigh: frame.expectedDalysAvertedHigh,
      expectedDalysAvertedLow: frame.expectedDalysAvertedLow,
      expectedEconomicValueUsdBase: frame.expectedEconomicValueUsdBase,
      expectedEconomicValueUsdHigh: frame.expectedEconomicValueUsdHigh,
      expectedEconomicValueUsdLow: frame.expectedEconomicValueUsdLow,
      frameKey: frame.frameKey,
      medianHealthyLifeYearsEffectBase: frame.medianHealthyLifeYearsEffectBase,
      medianHealthyLifeYearsEffectHigh: frame.medianHealthyLifeYearsEffectHigh,
      medianHealthyLifeYearsEffectLow: frame.medianHealthyLifeYearsEffectLow,
      medianIncomeGrowthEffectPpPerYearBase:
        frame.medianIncomeGrowthEffectPpPerYearBase,
      medianIncomeGrowthEffectPpPerYearHigh:
        frame.medianIncomeGrowthEffectPpPerYearHigh,
      medianIncomeGrowthEffectPpPerYearLow:
        frame.medianIncomeGrowthEffectPpPerYearLow,
      successProbabilityBase: frame.successProbabilityBase,
      successProbabilityHigh: frame.successProbabilityHigh,
      successProbabilityLow: frame.successProbabilityLow,
      summaryStatsJson: toJsonValue(frame.summaryStatsJson ?? null),
      timeToImpactStartDays: frame.timeToImpactStartDays,
    },
  });
}

async function syncImpactMetrics(
  tx: Prisma.TransactionClient,
  taskImpactFrameEstimateId: string,
  metrics: ImportedImpactMetricDraft[],
) {
  const metricKeys = metrics.map((metric) => metric.metricKey);

  for (const metric of metrics) {
    await tx.taskImpactMetric.upsert({
      where: {
        taskImpactFrameEstimateId_metricKey: {
          metricKey: metric.metricKey,
          taskImpactFrameEstimateId,
        },
      },
      create: {
        baseValue: metric.baseValue,
        displayGroup: metric.displayGroup,
        highValue: metric.highValue,
        lowValue: metric.lowValue,
        metadataJson: toJsonValue(metric.metadataJson ?? null),
        metricKey: metric.metricKey,
        summaryStatsJson: toJsonValue(metric.summaryStatsJson ?? null),
        taskImpactFrameEstimateId,
        unit: metric.unit,
        valueJson:
          metric.valueJson == null
            ? Prisma.JsonNull
            : (metric.valueJson as Prisma.InputJsonValue),
      },
      update: {
        baseValue: metric.baseValue,
        deletedAt: null,
        displayGroup: metric.displayGroup,
        highValue: metric.highValue,
        lowValue: metric.lowValue,
        metadataJson: toJsonValue(metric.metadataJson ?? null),
        summaryStatsJson: toJsonValue(metric.summaryStatsJson ?? null),
        unit: metric.unit,
        valueJson:
          metric.valueJson == null
            ? Prisma.JsonNull
            : (metric.valueJson as Prisma.InputJsonValue),
      },
    });
  }

  await tx.taskImpactMetric.updateMany({
    where: {
      deletedAt: null,
      taskImpactFrameEstimateId,
      ...(metricKeys.length > 0
        ? {
            metricKey: {
              notIn: metricKeys,
            },
          }
        : {}),
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

async function syncImpactSourceArtifacts(
  tx: Prisma.TransactionClient,
  taskImpactEstimateSetId: string,
  sourceArtifacts: ImportedSourceArtifactDraft[],
) {
  const artifactRecords = await Promise.all(
    sourceArtifacts.map((artifact) => upsertSourceArtifact(tx, artifact)),
  );
  const primaryArtifactId = artifactRecords[0]?.id ?? null;
  const artifactIds = artifactRecords.map((artifact) => artifact.id);

  await tx.taskImpactSourceArtifact.updateMany({
    where: {
      deletedAt: null,
      taskImpactEstimateSetId,
    },
    data: {
      isPrimary: false,
    },
  });

  for (const artifact of artifactRecords) {
    await tx.taskImpactSourceArtifact.upsert({
      where: {
        taskImpactEstimateSetId_sourceArtifactId: {
          sourceArtifactId: artifact.id,
          taskImpactEstimateSetId,
        },
      },
      create: {
        isPrimary: artifact.id === primaryArtifactId,
        sourceArtifactId: artifact.id,
        taskImpactEstimateSetId,
      },
      update: {
        deletedAt: null,
        isPrimary: artifact.id === primaryArtifactId,
      },
    });
  }

  await tx.taskImpactSourceArtifact.updateMany({
    where: {
      deletedAt: null,
      taskImpactEstimateSetId,
      ...(artifactIds.length > 0
        ? {
            sourceArtifactId: {
              notIn: artifactIds,
            },
          }
        : {}),
    },
    data: {
      deletedAt: new Date(),
      isPrimary: false,
    },
  });
}

export async function upsertImportedTaskBundle(
  bundle: ImportedTaskBundle,
  options?: UpsertImportedTaskBundleOptions,
) {
  const createdByUserId =
    options?.createdByUserId?.trim() ||
    options?.verifiedByUserId?.trim() ||
    (await getWishoniaUserId());

  return prisma.$transaction(
    async (tx) => {
      const assigneeOrganization = options?.assigneeOrganizationId?.trim()
        ? await tx.organization.findUniqueOrThrow({
            where: { id: options.assigneeOrganizationId.trim() },
          })
        : bundle.task.assigneeOrganizationName
          ? await upsertTrustedOrganization(
              {
                name: bundle.task.assigneeOrganizationName,
                sourceRef: bundle.task.assigneeOrganizationSourceRef,
                type: bundle.task.assigneeOrganizationType,
              },
              tx,
            )
          : null;

      const task = await tx.task.upsert({
        where: {
          taskKey: bundle.task.taskKey,
        },
        create: {
          id: options?.taskId?.trim() || undefined,
          assigneeOrganizationId: assigneeOrganization?.id ?? null,
          assigneePersonId: options?.assigneePersonId ?? null,
          assigneeAffiliationSnapshot: bundle.task.assigneeAffiliationSnapshot,
          category: bundle.task.category,
          claimPolicy: bundle.task.claimPolicy,
          contextJson: toJsonValue(bundle.task.contextJson),
          createdByUserId,
          deletedAt: null,
          description: bundle.task.description,
          dueAt: bundle.task.dueAt,
          estimatedEffortHours: bundle.task.estimatedEffortHours,
          impactStatement: bundle.task.impactStatement,
          interestTags: bundle.task.interestTags,
          isPublic: options?.isPublic ?? true,
          jurisdictionId: options?.jurisdictionId ?? null,
          roleTitle: bundle.task.roleTitle,
          parentTaskId: options?.parentTaskId ?? null,
          skillTags: bundle.task.skillTags,
          status: bundle.task.status,
          taskKey: bundle.task.taskKey,
          title: bundle.task.title,
          verifiedByUserId: options?.verifiedByUserId ?? null,
        },
        update: {
          assigneeOrganizationId: assigneeOrganization?.id ?? null,
          assigneePersonId: options?.assigneePersonId ?? null,
          assigneeAffiliationSnapshot: bundle.task.assigneeAffiliationSnapshot,
          category: bundle.task.category,
          claimPolicy: bundle.task.claimPolicy,
          contextJson: toJsonValue(bundle.task.contextJson),
          deletedAt: null,
          description: bundle.task.description,
          dueAt: bundle.task.dueAt,
          estimatedEffortHours: bundle.task.estimatedEffortHours,
          impactStatement: bundle.task.impactStatement,
          interestTags: bundle.task.interestTags,
          isPublic: options?.isPublic ?? true,
          jurisdictionId: options?.jurisdictionId ?? null,
          roleTitle: bundle.task.roleTitle,
          parentTaskId: options?.parentTaskId ?? null,
          skillTags: bundle.task.skillTags,
          status: bundle.task.status,
          title: bundle.task.title,
          verifiedByUserId: options?.verifiedByUserId ?? null,
        },
        select: {
          id: true,
          taskKey: true,
        },
      });

      await upsertPrimaryTaskCommunicationEndpoint(tx, task.id, {
        instructions: bundle.task.contactTemplate,
        label: bundle.task.contactLabel,
        url: bundle.task.contactUrl,
      });

      const sourceArtifacts = await syncTaskSourceArtifacts(
        tx,
        task.id,
        bundle.sourceArtifacts,
      );
      const estimateSet = await upsertImpactEstimateSet(
        tx,
        task.id,
        bundle.impactEstimate,
      );
      const parameterLinks = await syncImpactParameterInputs(
        tx,
        estimateSet.id,
        bundle.impactEstimate.parameterKeys,
      );
      if (parameterLinks.missingKeys.length > 0) {
        throw new Error(
          `Impact estimate references missing or unpublished parameters: ${parameterLinks.missingKeys.join(", ")}.`,
        );
      }

      for (const frame of bundle.impactEstimate.frames) {
        const frameRecord = await upsertImpactFrame(tx, estimateSet.id, frame);
        await syncImpactMetrics(tx, frameRecord.id, frame.metrics);
      }

      await syncImpactSourceArtifacts(
        tx,
        estimateSet.id,
        bundle.sourceArtifacts,
      );

      await tx.taskImpactEstimateSet.updateMany({
        where: {
          deletedAt: null,
          isCurrent: true,
          taskId: task.id,
          NOT: {
            id: estimateSet.id,
          },
        },
        data: {
          isCurrent: false,
        },
      });

      const currentEstimateSet = await tx.taskImpactEstimateSet.update({
        where: {
          id: estimateSet.id,
        },
        data: {
          isCurrent: true,
          publicationStatus: bundle.impactEstimate.publicationStatus,
        },
        select: {
          id: true,
        },
      });

      await tx.task.update({
        where: {
          id: task.id,
        },
        data: {
          currentImpactEstimateSetId: currentEstimateSet.id,
        },
      });

      return {
        estimateSetId: currentEstimateSet.id,
        sourceArtifactIds: sourceArtifacts.map((artifact) => artifact.id),
        taskId: task.id,
        taskKey: task.taskKey,
      };
    },
    {
      maxWait: 30_000,
      timeout: 120_000,
    },
  );
}
