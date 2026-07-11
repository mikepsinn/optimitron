import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskImpactEstimateKind,
  TaskImpactPublicationStatus,
  TaskStatus,
  type TaskImpactFrameKey,
} from "@optimitron/db";
import {
  getPolicyModelFrame,
  type NumericEstimate,
  type PolicyExecutionActor,
  type PolicyModelFrame,
  type PolicyModelMetric,
  type PolicyModelRun,
} from "./policy-model-run";
import type {
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
  ImportedTaskBundle,
} from "./opg-obg-adapters";

export interface PolicyModelRunImportAssigneeHint {
  actorKey: string | null;
  claimPolicy: TaskClaimPolicy;
  contactLabel: string | null;
  contactTemplate: string | null;
  contactUrl: string | null;
  currentAffiliation: string | null;
  displayName: string;
  organizationKey: string | null;
  organizationName: string | null;
  organizationType: OrgType | null;
  isPublicFigure: boolean;
  roleTitle: string | null;
  role: PolicyExecutionActor["role"];
}

export interface PolicyModelRunToTaskBundleOptions {
  category?: TaskCategory;
  claimPolicy?: TaskClaimPolicy;
  dueAt?: Date | null;
  impactStatement?: string | null;
  interestTags?: string[];
  publicationStatus?: TaskImpactPublicationStatus;
  skillTags?: string[];
  sourceSystem?: SourceSystem;
  status?: TaskStatus;
  taskKey?: string;
  title?: string;
}

export interface PolicyModelRunImportDraft {
  assigneeHint: PolicyModelRunImportAssigneeHint | null;
  bundle: ImportedTaskBundle;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTags(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => slugify(value))
        .filter((value) => value.length > 0),
    ),
  );
}

function toSourceArtifactType(value: string): SourceArtifactType {
  if ((Object.values(SourceArtifactType) as string[]).includes(value)) {
    return value as SourceArtifactType;
  }

  throw new Error(`Unsupported source artifact type: ${value}`);
}

function toSourceSystem(value: string): SourceSystem {
  if ((Object.values(SourceSystem) as string[]).includes(value)) {
    return value as SourceSystem;
  }

  throw new Error(`Unsupported source system: ${value}`);
}

function deriveEstimateSourceSystem(sourceArtifacts: ImportedSourceArtifactDraft[]) {
  const uniqueSystems = new Set(sourceArtifacts.map((artifact) => artifact.sourceSystem));

  if (uniqueSystems.size <= 1) {
    return sourceArtifacts[0]?.sourceSystem ?? SourceSystem.CURATED;
  }

  return SourceSystem.COMBINED;
}

function mapMetric(metric: PolicyModelMetric): ImportedImpactMetricDraft {
  return {
    baseValue: metric.estimate?.base ?? null,
    displayGroup: metric.displayGroup ?? null,
    highValue: metric.estimate?.high ?? null,
    lowValue: metric.estimate?.low ?? null,
    metadataJson: {
      chapterUrl: metric.chapterUrl ?? null,
      description: metric.description ?? null,
      displayName: metric.displayName,
      sourceArtifactKeys: metric.sourceArtifactKeys,
    },
    metricKey: metric.key,
    summaryStatsJson: metric.summaryStats ?? null,
    unit: metric.unit,
    valueJson: metric.valueKind === "numeric" ? null : (metric.valueJson ?? null),
  };
}

function mapEstimate(estimate: NumericEstimate) {
  return {
    base: estimate.base ?? null,
    high: estimate.high ?? null,
    low: estimate.low ?? null,
  };
}

function mapFrame(frame: PolicyModelFrame): ImportedImpactFrameDraft {
  const successProbability = mapEstimate(frame.canonical.successProbability);
  const medianIncomeGrowthEffectPpPerYear = mapEstimate(
    frame.canonical.medianIncomeGrowthEffectPpPerYear,
  );
  const medianHealthyLifeYearsEffect = mapEstimate(
    frame.canonical.medianHealthyLifeYearsEffect,
  );
  const expectedDalysAverted = mapEstimate(frame.canonical.expectedDalysAverted);
  const expectedEconomicValueUsd = mapEstimate(frame.canonical.expectedEconomicValueUsd);
  const estimatedCashCostUsd = mapEstimate(frame.canonical.estimatedCashCostUsd);
  const estimatedEffortHours = mapEstimate(frame.canonical.estimatedEffortHours);
  const delayDalysLostPerDay = mapEstimate(frame.canonical.delayDalysLostPerDay);
  const delayEconomicValueUsdLostPerDay = mapEstimate(
    frame.canonical.delayEconomicValueUsdLostPerDay,
  );

  return {
    annualDiscountRate: frame.annualDiscountRate,
    adoptionRampYears: frame.adoptionRampYears,
    benefitDurationYears: frame.benefitDurationYears,
    customFrameLabel: frame.customFrameLabel ?? null,
    delayDalysLostPerDayBase: delayDalysLostPerDay.base,
    delayDalysLostPerDayHigh: delayDalysLostPerDay.high,
    delayDalysLostPerDayLow: delayDalysLostPerDay.low,
    delayEconomicValueUsdLostPerDayBase: delayEconomicValueUsdLostPerDay.base,
    delayEconomicValueUsdLostPerDayHigh: delayEconomicValueUsdLostPerDay.high,
    delayEconomicValueUsdLostPerDayLow: delayEconomicValueUsdLostPerDay.low,
    estimatedCashCostUsdBase: estimatedCashCostUsd.base,
    estimatedCashCostUsdHigh: estimatedCashCostUsd.high,
    estimatedCashCostUsdLow: estimatedCashCostUsd.low,
    estimatedEffortHoursBase: estimatedEffortHours.base,
    estimatedEffortHoursHigh: estimatedEffortHours.high,
    estimatedEffortHoursLow: estimatedEffortHours.low,
    evaluationHorizonYears: frame.evaluationHorizonYears,
    expectedDalysAvertedBase: expectedDalysAverted.base,
    expectedDalysAvertedHigh: expectedDalysAverted.high,
    expectedDalysAvertedLow: expectedDalysAverted.low,
    expectedEconomicValueUsdBase: expectedEconomicValueUsd.base,
    expectedEconomicValueUsdHigh: expectedEconomicValueUsd.high,
    expectedEconomicValueUsdLow: expectedEconomicValueUsd.low,
    frameKey: frame.frameKey,
    frameSlug: frame.frameSlug,
    medianHealthyLifeYearsEffectBase: medianHealthyLifeYearsEffect.base,
    medianHealthyLifeYearsEffectHigh: medianHealthyLifeYearsEffect.high,
    medianHealthyLifeYearsEffectLow: medianHealthyLifeYearsEffect.low,
    medianIncomeGrowthEffectPpPerYearBase: medianIncomeGrowthEffectPpPerYear.base,
    medianIncomeGrowthEffectPpPerYearHigh: medianIncomeGrowthEffectPpPerYear.high,
    medianIncomeGrowthEffectPpPerYearLow: medianIncomeGrowthEffectPpPerYear.low,
    metrics: frame.metrics.map(mapMetric),
    successProbabilityBase: successProbability.base,
    successProbabilityHigh: successProbability.high,
    successProbabilityLow: successProbability.low,
    summaryStatsJson: frame.summaryStats ?? null,
    timeToImpactStartDays: frame.timeToImpactStartDays,
  };
}

function mapSourceArtifacts(run: PolicyModelRun): ImportedSourceArtifactDraft[] {
  return run.artifacts.map((artifact) => ({
    artifactType: toSourceArtifactType(artifact.artifactType),
    contentHash: artifact.contentHash ?? null,
    externalKey: artifact.externalKey ?? null,
    payloadJson: {
      artifactType: artifact.artifactType,
      citationKey: artifact.citationKey ?? null,
      publishedAt: artifact.publishedAt ?? null,
      title: artifact.title ?? null,
    },
    sourceKey: artifact.artifactKey,
    sourceRef: artifact.sourceRef ?? null,
    sourceSystem: toSourceSystem(artifact.sourceSystem),
    sourceUrl: artifact.sourceUrl ?? null,
    title: artifact.title ?? null,
    versionKey: artifact.versionKey ?? null,
  }));
}

function pickAssigneeActor(run: PolicyModelRun) {
  const actors = run.executionHints?.targetActors ?? [];

  return (
    actors.find((actor) => actor.claimPolicyHint === TaskClaimPolicy.ASSIGNED_ONLY) ??
    actors[0] ??
    null
  );
}

function toAssigneeHint(actor: PolicyExecutionActor | null): PolicyModelRunImportAssigneeHint | null {
  if (!actor) {
    return null;
  }

  return {
    actorKey: actor.actorKey ?? null,
    claimPolicy: actor.claimPolicyHint ?? TaskClaimPolicy.OPEN_SINGLE,
    contactLabel: actor.contactLabel ?? null,
    contactTemplate: actor.contactTemplate ?? null,
    contactUrl: actor.contactUrl ?? null,
    currentAffiliation: actor.currentAffiliation ?? null,
    displayName: actor.displayName,
    organizationKey: actor.organizationKey ?? null,
    organizationName: actor.organizationName ?? null,
    organizationType: actor.organizationType ?? null,
    isPublicFigure: true,
    roleTitle: actor.roleTitle ?? null,
    role: actor.role,
  };
}

function deriveTaskTitle(run: PolicyModelRun, actor: PolicyExecutionActor | null, override: string | undefined) {
  if (override) {
    return override;
  }

  if (run.executionHints?.parentTaskTitle) {
    return run.executionHints.parentTaskTitle;
  }

  if (actor?.displayName && run.policy.recommendedTarget) {
    return `${actor.displayName} ${run.policy.recommendedTarget}`;
  }

  if (run.policy.recommendedTarget) {
    return `${run.policy.policyName} -> ${run.policy.recommendedTarget}`;
  }

  return run.policy.policyName;
}

function deriveTaskDescription(run: PolicyModelRun) {
  return (
    run.executionHints?.parentTaskDescription ??
    run.policy.summary ??
    run.summary
  );
}

function deriveTaskCategory(override: TaskCategory | undefined) {
  return override ?? TaskCategory.GOVERNANCE;
}

function deriveSkillTags(
  run: PolicyModelRun,
  actor: PolicyExecutionActor | null,
  override: string[] | undefined,
) {
  if (override) {
    return normalizeTags(override);
  }

  return normalizeTags([
    "policy",
    "governance",
    ...(actor?.role === "decision_maker" ? ["executive-action", "diplomacy"] : []),
    ...(run.executionHints?.supporterLevers ?? []),
  ]);
}

function deriveInterestTags(run: PolicyModelRun, override: string[] | undefined) {
  if (override) {
    return normalizeTags(override);
  }

  return normalizeTags([run.policy.policyType, ...run.policy.tags]);
}

function deriveTaskContext(run: PolicyModelRun, frameKey: TaskImpactFrameKey) {
  return {
    blockingFactors: run.policy.blockingFactors,
    counterfactualKey: run.policy.counterfactualKey,
    defaultFrameKey: run.defaultFrameKey,
    executionHints: run.executionHints ?? null,
    frameKey,
    generator: run.generator,
    methodologyKey: run.methodologyKey,
    modelKey: run.modelKey,
    parameterSetHash: run.parameterSetHash,
    policy: run.policy,
    schemaVersion: run.schemaVersion,
  };
}

export function buildImportedTaskBundleFromPolicyModelRun(
  run: PolicyModelRun,
  options?: PolicyModelRunToTaskBundleOptions,
): PolicyModelRunImportDraft {
  const sourceArtifacts = mapSourceArtifacts(run);
  const assigneeActor = pickAssigneeActor(run);
  const assigneeHint = toAssigneeHint(assigneeActor);
  const defaultFrame = getPolicyModelFrame(run, run.defaultFrameKey);

  if (!defaultFrame) {
    throw new Error(`Policy model run ${run.modelKey} does not define any impact frames.`);
  }

  const claimPolicy =
    options?.claimPolicy ??
    assigneeActor?.claimPolicyHint ??
    TaskClaimPolicy.OPEN_SINGLE;

  return {
    assigneeHint,
    bundle: {
      impactEstimate: {
        assumptionsJson: {
          primaryArtifactKeys: sourceArtifacts.slice(0, 3).map((artifact) => artifact.sourceKey),
          summary: run.summary,
          title: run.title,
        },
        calculationVersion: run.calculationVersion,
        counterfactualKey: run.policy.counterfactualKey,
        estimateKind: TaskImpactEstimateKind.FORECAST,
        frames: run.frames.map(mapFrame),
        methodologyKey: run.methodologyKey,
        parameterSetHash: run.parameterSetHash,
        publicationStatus: options?.publicationStatus ?? TaskImpactPublicationStatus.REVIEWED,
        sourceSystem: options?.sourceSystem ?? deriveEstimateSourceSystem(sourceArtifacts),
      },
      sourceArtifacts,
      task: {
        category: deriveTaskCategory(options?.category),
        claimPolicy,
        contextJson: deriveTaskContext(run, defaultFrame.frameKey),
        assigneeAffiliationSnapshot: assigneeActor?.currentAffiliation ?? null,
        assigneeOrganizationName: assigneeActor?.organizationName ?? null,
        assigneeOrganizationSourceRef: assigneeActor?.organizationKey ?? null,
        assigneeOrganizationType: assigneeActor?.organizationType ?? null,
        contactLabel: assigneeActor?.contactLabel ?? null,
        contactTemplate: assigneeActor?.contactTemplate ?? null,
        contactUrl: assigneeActor?.contactUrl ?? null,
        description: deriveTaskDescription(run),
        dueAt: options?.dueAt ?? null,
        estimatedEffortHours: defaultFrame.canonical.estimatedEffortHours.base ?? null,
        impactStatement: options?.impactStatement ?? run.summary,
        interestTags: deriveInterestTags(run, options?.interestTags),
        roleTitle: assigneeActor?.roleTitle ?? null,
        skillTags: deriveSkillTags(run, assigneeActor, options?.skillTags),
        status: options?.status ?? TaskStatus.ACTIVE,
        taskKey: options?.taskKey ?? run.modelKey,
        title: deriveTaskTitle(run, assigneeActor, options?.title),
      },
    },
  };
}
