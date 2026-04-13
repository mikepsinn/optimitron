import {
  OrgType,
  TaskCategory,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskDifficulty,
  TaskImpactFrameKey,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { findOrCreateOrganization } from "@/lib/organization.server";
import { findOrCreatePerson } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { getSearchTerms, scoreSearchRecord } from "@/lib/site-search";
import { canonicalizeSiteUrl } from "@/lib/site";
import { countTaskContactActions } from "@/lib/tasks/contact.server";
import {
  DEFAULT_TASK_IMPACT_FRAME,
  deriveImpactRatios,
  scaleImpactFrameSummary,
  selectImpactFrame,
  sumImpactFrameSummaries,
  type TaskImpactSelection,
} from "@/lib/tasks/impact";
import {
  rankTasksForUser,
  scoreTaskForAccountability,
} from "@/lib/tasks/rank-tasks";
import { TREATY_PARENT_TASK_KEY } from "@/lib/tasks/task-keys";
import { grantWishes } from "@/lib/wishes.server";

const ACTIVE_CLAIM_STATUSES = [
  TaskClaimStatus.CLAIMED,
  TaskClaimStatus.IN_PROGRESS,
  TaskClaimStatus.COMPLETED,
] as const;

const CLAIM_STATUSES_THAT_BLOCK_RECLAIM = [
  TaskClaimStatus.CLAIMED,
  TaskClaimStatus.IN_PROGRESS,
  TaskClaimStatus.COMPLETED,
  TaskClaimStatus.VERIFIED,
] as const;

const sourceArtifactSelect = {
  artifactType: true,
  contentHash: true,
  externalKey: true,
  id: true,
  sourceKey: true,
  sourceRef: true,
  sourceSystem: true,
  sourceUrl: true,
  title: true,
  versionKey: true,
} satisfies Prisma.SourceArtifactSelect;

const taskSourceArtifactSelect = {
  isPrimary: true,
  sourceArtifact: {
    select: sourceArtifactSelect,
  },
} satisfies Prisma.TaskSourceArtifactSelect;

const impactMetricSelect = {
  baseValue: true,
  displayGroup: true,
  highValue: true,
  lowValue: true,
  metadataJson: true,
  metricKey: true,
  summaryStatsJson: true,
  unit: true,
  valueJson: true,
} satisfies Prisma.TaskImpactMetricSelect;

const impactFrameSelect = {
  annualDiscountRate: true,
  adoptionRampYears: true,
  benefitDurationYears: true,
  customFrameLabel: true,
  delayDalysLostPerDayBase: true,
  delayDalysLostPerDayHigh: true,
  delayDalysLostPerDayLow: true,
  delayEconomicValueUsdLostPerDayBase: true,
  delayEconomicValueUsdLostPerDayHigh: true,
  delayEconomicValueUsdLostPerDayLow: true,
  estimatedCashCostUsdBase: true,
  estimatedCashCostUsdHigh: true,
  estimatedCashCostUsdLow: true,
  estimatedEffortHoursBase: true,
  estimatedEffortHoursHigh: true,
  estimatedEffortHoursLow: true,
  evaluationHorizonYears: true,
  expectedDalysAvertedBase: true,
  expectedDalysAvertedHigh: true,
  expectedDalysAvertedLow: true,
  expectedEconomicValueUsdBase: true,
  expectedEconomicValueUsdHigh: true,
  expectedEconomicValueUsdLow: true,
  frameKey: true,
  frameSlug: true,
  medianHealthyLifeYearsEffectBase: true,
  medianHealthyLifeYearsEffectHigh: true,
  medianHealthyLifeYearsEffectLow: true,
  medianIncomeGrowthEffectPpPerYearBase: true,
  medianIncomeGrowthEffectPpPerYearHigh: true,
  medianIncomeGrowthEffectPpPerYearLow: true,
  metrics: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ metricKey: "asc" }],
    select: impactMetricSelect,
  },
  successProbabilityBase: true,
  successProbabilityHigh: true,
  successProbabilityLow: true,
  summaryStatsJson: true,
  timeToImpactStartDays: true,
} satisfies Prisma.TaskImpactFrameEstimateSelect;

const impactEstimateSetSelect = {
  assumptionsJson: true,
  calculationVersion: true,
  counterfactualKey: true,
  createdAt: true,
  estimateKind: true,
  frames: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ createdAt: "asc" }],
    select: impactFrameSelect,
  },
  id: true,
  isCurrent: true,
  methodologyKey: true,
  parameterSetHash: true,
  publicationStatus: true,
  sourceArtifacts: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      isPrimary: true,
      sourceArtifact: {
        select: sourceArtifactSelect,
      },
    },
  },
  sourceSystem: true,
} satisfies Prisma.TaskImpactEstimateSetSelect;

const taskListSelect = {
  actualCashCostUsd: true,
  actualEffortSeconds: true,
  _count: {
    select: {
      childTasks: true,
    },
  },
  assigneeOrganization: {
    select: {
      contactEmail: true,
      id: true,
      logo: true,
      name: true,
      slug: true,
      type: true,
      website: true,
    },
  },
  assigneePerson: {
    select: {
      countryCode: true,
      currentAffiliation: true,
      displayName: true,
      handle: true,
      id: true,
      image: true,
      isPublicFigure: true,
      sourceRef: true,
    },
  },
  category: true,
  claimPolicy: true,
  claims: {
    where: {
      deletedAt: null,
    },
    select: {
      actualCashCostUsd: true,
      actualEffortSeconds: true,
      claimedAt: true,
      completedAt: true,
      completionEvidence: true,
      id: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          email: true,
          person: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              image: true,
            },
          },
        },
      },
      userId: true,
      verificationNote: true,
      verifiedAt: true,
    },
  },
  completedAt: true,
  completionEvidence: true,
  contactLabel: true,
  contactTemplate: true,
  contactUrl: true,
  assigneeAffiliationSnapshot: true,
  currentImpactEstimateSet: {
    select: impactEstimateSetSelect,
  },
  contextJson: true,
  description: true,
  difficulty: true,
  dueAt: true,
  estimatedEffortHours: true,
  id: true,
  interestTags: true,
  isPublic: true,
  maxClaims: true,
  ownerUserId: true,
  outgoingEdges: {
    where: {
      deletedAt: null,
      edgeType: { in: ["BLOCKS", "DEPENDS_ON"] },
    },
    select: {
      edgeType: true,
      probabilityDeltaBase: true,
      timeDeltaDaysBase: true,
      toTask: {
        select: {
          currentImpactEstimateSet: {
            select: impactEstimateSetSelect,
          },
          estimatedEffortHours: true,
          id: true,
          status: true,
          taskKey: true,
          title: true,
        },
      },
    },
  },
  roleTitle: true,
  parentTask: {
    select: {
      childTasks: {
        where: {
          deletedAt: null,
          isPublic: true,
        },
        select: {
          id: true,
        },
      },
      currentImpactEstimateSet: {
        select: impactEstimateSetSelect,
      },
      id: true,
      taskKey: true,
      title: true,
    },
  },
  parentTaskId: true,
  skillTags: true,
  sourceArtifacts: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: taskSourceArtifactSelect,
  },
  status: true,
  taskKey: true,
  title: true,
  incomingEdges: {
    where: {
      deletedAt: null,
      edgeType: { in: ["BLOCKS", "DEPENDS_ON"] },
    },
    select: {
      edgeType: true,
      fromTask: {
        select: {
          id: true,
          status: true,
          title: true,
        },
      },
    },
  },
  verifiedAt: true,
} satisfies Prisma.TaskSelect;

const taskMilestoneSelect = {
  completedAt: true,
  description: true,
  evidenceNote: true,
  evidenceUrl: true,
  id: true,
  key: true,
  metadataJson: true,
  sortOrder: true,
  status: true,
  title: true,
  verifiedAt: true,
  verifiedByUser: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
} satisfies Prisma.TaskMilestoneSelect;

const taskSearchSelect = {
  assigneeOrganization: {
    select: {
      name: true,
    },
  },
  assigneePerson: {
    select: {
      currentAffiliation: true,
      displayName: true,
    },
  },
  category: true,
  description: true,
  difficulty: true,
  id: true,
  interestTags: true,
  roleTitle: true,
  skillTags: true,
  status: true,
  taskKey: true,
  title: true,
  verifiedAt: true,
} satisfies Prisma.TaskSelect;

const taskDetailSelect = {
  ...taskListSelect,
  childTasks: {
    where: {
      deletedAt: null,
      isPublic: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: taskListSelect,
  },
  contextJson: true,
  milestones: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: taskMilestoneSelect,
  },
  verifiedByUser: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
} satisfies Prisma.TaskSelect;

type TaskListItem = Prisma.TaskGetPayload<{ select: typeof taskListSelect }>;
type TaskDetailItem = Prisma.TaskGetPayload<{ select: typeof taskDetailSelect }>;
type TaskSearchItem = Prisma.TaskGetPayload<{ select: typeof taskSearchSelect }>;
type TaskViewer = Awaited<ReturnType<typeof getTaskViewer>>;

export interface TaskSearchResult {
  assigneeLabel: string | null;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  href: string;
  id: string;
  score: number;
  snippet: string | null;
  status: TaskStatus;
  taskKey: string | null;
  title: string;
}

function countActiveClaims(task: TaskListItem | TaskDetailItem) {
  return task.claims.filter((claim) =>
    ACTIVE_CLAIM_STATUSES.includes(claim.status as (typeof ACTIVE_CLAIM_STATUSES)[number]),
  ).length;
}

function hasViewerClaim(task: TaskListItem | TaskDetailItem, userId: string | null) {
  if (!userId) {
    return false;
  }

  return task.claims.some(
    (claim) =>
      claim.userId === userId &&
      CLAIM_STATUSES_THAT_BLOCK_RECLAIM.includes(
        claim.status as (typeof CLAIM_STATUSES_THAT_BLOCK_RECLAIM)[number],
      ),
  );
}

function getPrimaryTaskSourceArtifact(task: TaskListItem | TaskDetailItem) {
  return (
    task.sourceArtifacts.find((entry) => entry.isPrimary)?.sourceArtifact ??
    task.sourceArtifacts[0]?.sourceArtifact ??
    null
  );
}

function normalizeTaskContextJson(contextJson: Prisma.JsonValue) {
  if (contextJson == null || typeof contextJson !== "object" || Array.isArray(contextJson)) {
    return contextJson;
  }

  const record = { ...(contextJson as Record<string, unknown>) };
  if (Array.isArray(record.sourceUrls)) {
    record.sourceUrls = record.sourceUrls.map((value) =>
      typeof value === "string" ? canonicalizeSiteUrl(value) : value,
    );
  }

  return record;
}

function normalizeSourceArtifact<T extends { sourceRef: string | null; sourceUrl: string | null }>(artifact: T) {
  return {
    ...artifact,
    sourceRef:
      typeof artifact.sourceRef === "string" && /^https?:\/\//i.test(artifact.sourceRef)
        ? canonicalizeSiteUrl(artifact.sourceRef)
        : artifact.sourceRef,
    sourceUrl: canonicalizeSiteUrl(artifact.sourceUrl),
  };
}

function mapTaskSearchResult(
  task: TaskSearchItem,
  searchTerms: ReturnType<typeof getSearchTerms>,
): TaskSearchResult {
  const assigneeParts = [
    task.assigneePerson?.displayName,
    task.assigneePerson?.currentAffiliation,
    task.assigneeOrganization?.name,
  ].filter((value): value is string => Boolean(value?.trim()));
  const href = `/tasks/${task.id}`;
  const snippet = [
    task.description,
    task.roleTitle,
    assigneeParts.length > 0 ? `Assigned to ${assigneeParts.join(" / ")}` : null,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return {
    assigneeLabel: assigneeParts[0] ?? null,
    category: task.category,
    difficulty: task.difficulty,
    href,
    id: task.id,
    score: scoreSearchRecord(searchTerms, {
      title: task.title,
      description: snippet,
      href,
      keywords: [
        task.category,
        task.difficulty,
        task.status,
        task.taskKey ?? "",
        ...task.interestTags,
        ...task.skillTags,
        ...assigneeParts,
      ],
      section: "Tasks",
    }),
    snippet: snippet || null,
    status: task.status,
    taskKey: task.taskKey,
    title: task.title,
  };
}

function buildParentInheritedImpactFrame(
  task: TaskListItem | TaskDetailItem,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const parentTask = task.parentTask;
  if (!parentTask?.currentImpactEstimateSet) {
    return null;
  }

  const parentFrame = selectImpactFrame(
    parentTask.currentImpactEstimateSet,
    options?.frameKey ?? DEFAULT_TASK_IMPACT_FRAME,
  ).selectedFrame;

  if (!parentFrame) {
    return null;
  }

  const siblingCount = Math.max(parentTask.childTasks.length, 1);
  const inheritedShare = 1 / siblingCount;

  return scaleImpactFrameSummary(parentFrame, inheritedShare, {
    customFrameLabel: `Inherited from parent task ${parentTask.title}`,
    estimatedCashCostUsdBase: null,
    estimatedCashCostUsdHigh: null,
    estimatedCashCostUsdLow: null,
    estimatedEffortHoursBase: task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursBase,
    estimatedEffortHoursHigh: task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursHigh,
    estimatedEffortHoursLow: task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursLow,
    frameSlug: `${parentFrame.frameSlug}-parent-share`,
    metrics: [],
  });
}

function buildDownstreamUnlockedImpactFrame(
  task: TaskListItem | TaskDetailItem,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const downstreamFrames = task.outgoingEdges.flatMap((edge) => {
    const frame = selectImpactFrame(
      edge.toTask.currentImpactEstimateSet,
      options?.frameKey ?? DEFAULT_TASK_IMPACT_FRAME,
    ).selectedFrame;

    if (!frame) {
      return [];
    }

    const weightedFrames: NonNullable<TaskImpactSelection["selectedFrame"]>[] = [];
    const probabilityDelta =
      edge.probabilityDeltaBase != null && edge.probabilityDeltaBase > 0
        ? edge.probabilityDeltaBase
        : null;
    const timeDeltaDays =
      edge.timeDeltaDaysBase != null && edge.timeDeltaDaysBase > 0
        ? edge.timeDeltaDaysBase
        : null;

    if (probabilityDelta != null) {
      weightedFrames.push(
        scaleImpactFrameSummary(frame, probabilityDelta, {
          customFrameLabel: `Probability-weighted downstream value unlocked by ${task.title}`,
          frameSlug: `${frame.frameSlug}-probability-delta-${task.id}`,
          metrics: [],
        }),
      );
    }

    if (timeDeltaDays != null) {
      weightedFrames.push({
        ...frame,
        customFrameLabel: `Time-accelerated downstream value unlocked by ${task.title}`,
        delayDalysLostPerDayBase: frame.delayDalysLostPerDayBase,
        delayDalysLostPerDayHigh: frame.delayDalysLostPerDayHigh,
        delayDalysLostPerDayLow: frame.delayDalysLostPerDayLow,
        delayEconomicValueUsdLostPerDayBase: frame.delayEconomicValueUsdLostPerDayBase,
        delayEconomicValueUsdLostPerDayHigh: frame.delayEconomicValueUsdLostPerDayHigh,
        delayEconomicValueUsdLostPerDayLow: frame.delayEconomicValueUsdLostPerDayLow,
        estimatedCashCostUsdBase: null,
        estimatedCashCostUsdHigh: null,
        estimatedCashCostUsdLow: null,
        estimatedEffortHoursBase:
          task.estimatedEffortHours ?? frame.estimatedEffortHoursBase ?? null,
        estimatedEffortHoursHigh:
          task.estimatedEffortHours ?? frame.estimatedEffortHoursHigh ?? null,
        estimatedEffortHoursLow:
          task.estimatedEffortHours ?? frame.estimatedEffortHoursLow ?? null,
        expectedDalysAvertedBase:
          (frame.delayDalysLostPerDayBase ?? 0) * timeDeltaDays,
        expectedDalysAvertedHigh:
          frame.delayDalysLostPerDayHigh == null ? null : frame.delayDalysLostPerDayHigh * timeDeltaDays,
        expectedDalysAvertedLow:
          frame.delayDalysLostPerDayLow == null ? null : frame.delayDalysLostPerDayLow * timeDeltaDays,
        expectedEconomicValueUsdBase:
          (frame.delayEconomicValueUsdLostPerDayBase ?? 0) * timeDeltaDays,
        expectedEconomicValueUsdHigh:
          frame.delayEconomicValueUsdLostPerDayHigh == null
            ? null
            : frame.delayEconomicValueUsdLostPerDayHigh * timeDeltaDays,
        expectedEconomicValueUsdLow:
          frame.delayEconomicValueUsdLostPerDayLow == null
            ? null
            : frame.delayEconomicValueUsdLostPerDayLow * timeDeltaDays,
        frameSlug: `${frame.frameSlug}-time-delta-${task.id}`,
        metrics: [],
      });
    }

    if (weightedFrames.length === 0) {
      weightedFrames.push(frame);
    }

    return weightedFrames;
  });

  if (downstreamFrames.length === 0) {
    return null;
  }

  return sumImpactFrameSummaries(downstreamFrames, {
    customFrameLabel: `Downstream value unlocked by ${task.title}`,
    estimatedCashCostUsdBase: null,
    estimatedCashCostUsdHigh: null,
    estimatedCashCostUsdLow: null,
    estimatedEffortHoursBase:
      task.estimatedEffortHours ?? downstreamFrames[0]?.estimatedEffortHoursBase ?? null,
    estimatedEffortHoursHigh:
      task.estimatedEffortHours ?? downstreamFrames[0]?.estimatedEffortHoursHigh ?? null,
    estimatedEffortHoursLow:
      task.estimatedEffortHours ?? downstreamFrames[0]?.estimatedEffortHoursLow ?? null,
    frameSlug: `downstream-unlocked-${task.id}`,
    metrics: [],
  });
}

function decorateTask<T extends TaskListItem | TaskDetailItem>(
  task: T,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
    userId?: string | null;
  },
): T & {
  activeClaimCount: number;
  activeChildTaskCount: number;
  blockerStatuses: TaskStatus[];
  impact: {
    availableFrames: TaskImpactSelection["availableFrames"];
    confidenceSummary: unknown;
    costPerDalyUsd: number | null;
    currentSet: TaskImpactSelection["currentSet"];
    expectedValuePerDollar: number | null;
    expectedValuePerHourDalys: number | null;
    expectedValuePerHourUsd: number | null;
    selectedFrame: TaskImpactSelection["selectedFrame"];
    selectedMetrics: TaskImpactSelection["metricsByKey"];
  };
  primarySourceArtifact: ReturnType<typeof getPrimaryTaskSourceArtifact>;
  selectedImpactFrame: TaskImpactSelection["selectedFrame"];
  sourceUrl: string | null;
  viewerHasClaim: boolean;
} {
  const directImpactSelection = selectImpactFrame(
    task.currentImpactEstimateSet,
    options?.frameKey ?? DEFAULT_TASK_IMPACT_FRAME,
  );
  const inheritedParentFrame =
    directImpactSelection.selectedFrame == null ? buildParentInheritedImpactFrame(task, options) : null;
  const downstreamUnlockedFrame = buildDownstreamUnlockedImpactFrame(task, options);
  const selectedImpactFrame = sumImpactFrameSummaries(
    [
      directImpactSelection.selectedFrame,
      inheritedParentFrame,
      downstreamUnlockedFrame,
    ].filter((frame): frame is NonNullable<typeof frame> => frame != null),
    directImpactSelection.selectedFrame
      ? {
          customFrameLabel: directImpactSelection.selectedFrame.customFrameLabel,
          estimatedCashCostUsdBase: task.actualCashCostUsd ?? directImpactSelection.selectedFrame.estimatedCashCostUsdBase,
          estimatedEffortHoursBase: task.estimatedEffortHours ?? directImpactSelection.selectedFrame.estimatedEffortHoursBase,
          frameKey: directImpactSelection.selectedFrame.frameKey,
          frameSlug: directImpactSelection.selectedFrame.frameSlug,
          metrics: directImpactSelection.selectedFrame.metrics,
        }
      : {
          customFrameLabel: inheritedParentFrame?.customFrameLabel ?? downstreamUnlockedFrame?.customFrameLabel ?? null,
          estimatedCashCostUsdBase: task.actualCashCostUsd ?? null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursBase ??
            downstreamUnlockedFrame?.estimatedEffortHoursBase ??
            null,
          estimatedEffortHoursHigh:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursHigh ??
            downstreamUnlockedFrame?.estimatedEffortHoursHigh ??
            null,
          estimatedEffortHoursLow:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursLow ??
            downstreamUnlockedFrame?.estimatedEffortHoursLow ??
            null,
          frameKey:
            inheritedParentFrame?.frameKey ??
            downstreamUnlockedFrame?.frameKey ??
            DEFAULT_TASK_IMPACT_FRAME,
          frameSlug:
            inheritedParentFrame?.frameSlug ??
            downstreamUnlockedFrame?.frameSlug ??
            "effective-impact",
          metrics: [],
        },
  );
  const derivedImpact = deriveImpactRatios(selectedImpactFrame);
  const decoratedChildTasks: unknown[] | undefined =
    "childTasks" in task
      ? task.childTasks.map((childTask) => decorateTask(childTask, options))
      : undefined;

  const blockerStatuses = task.incomingEdges.map((edge) => edge.fromTask.status as TaskStatus);
  const normalizedSourceArtifacts = task.sourceArtifacts.map((entry) => ({
    ...entry,
    sourceArtifact: normalizeSourceArtifact(entry.sourceArtifact),
  }));
  const normalizedPrimarySourceArtifact =
    normalizedSourceArtifacts.find((entry) => entry.isPrimary)?.sourceArtifact ??
    normalizedSourceArtifacts[0]?.sourceArtifact ??
    null;

  return {
    ...task,
    activeClaimCount: countActiveClaims(task),
    activeChildTaskCount: task._count.childTasks,
    blockerStatuses,
    ...(decoratedChildTasks ? { childTasks: decoratedChildTasks } : {}),
    contactUrl: canonicalizeSiteUrl(task.contactUrl),
    contextJson: normalizeTaskContextJson(task.contextJson),
    impact: {
      availableFrames: directImpactSelection.availableFrames,
      confidenceSummary: selectedImpactFrame?.summaryStatsJson ?? null,
      currentSet: directImpactSelection.currentSet,
      selectedFrame: selectedImpactFrame,
      selectedMetrics:
        selectedImpactFrame?.metrics != null
          ? Object.fromEntries(selectedImpactFrame.metrics.map((metric) => [metric.metricKey, metric]))
          : directImpactSelection.metricsByKey,
      ...derivedImpact,
    },
    primarySourceArtifact: normalizedPrimarySourceArtifact,
    selectedImpactFrame,
    sourceArtifacts: normalizedSourceArtifacts,
    sourceUrl: normalizedPrimarySourceArtifact?.sourceUrl ?? null,
    viewerHasClaim: hasViewerClaim(task, options?.userId ?? null),
  } as unknown as T & {
    activeClaimCount: number;
    activeChildTaskCount: number;
    blockerStatuses: TaskStatus[];
    impact: {
      availableFrames: TaskImpactSelection["availableFrames"];
      confidenceSummary: unknown;
      costPerDalyUsd: number | null;
      currentSet: TaskImpactSelection["currentSet"];
      expectedValuePerDollar: number | null;
      expectedValuePerHourDalys: number | null;
      expectedValuePerHourUsd: number | null;
      selectedFrame: TaskImpactSelection["selectedFrame"];
      selectedMetrics: TaskImpactSelection["metricsByKey"];
    };
    primarySourceArtifact: ReturnType<typeof getPrimaryTaskSourceArtifact>;
    selectedImpactFrame: TaskImpactSelection["selectedFrame"];
    sourceUrl: string | null;
    viewerHasClaim: boolean;
  };
}

async function getTaskViewer(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      availableHoursPerWeek: true,
      id: true,
      isAdmin: true,
      interestTags: true,
      maxTaskDifficulty: true,
      personId: true,
      skillTags: true,
    },
  });
}

async function requireTaskReviewer(userId: string) {
  const reviewer = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      isAdmin: true,
    },
  });

  if (!reviewer.isAdmin) {
    throw new Error("Forbidden");
  }

  return reviewer;
}

function getTaskVisibilityWhere(input?: {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  status?: TaskStatus | null;
  taskId?: string | null;
  userId?: string | null;
  visibility?: "public" | "owned" | "accessible";
}): Prisma.TaskWhereInput {
  const baseWhere: Prisma.TaskWhereInput = {
    assigneeOrganizationId: input?.assigneeOrganizationId ?? undefined,
    assigneePersonId: input?.assigneePersonId ?? undefined,
    deletedAt: null,
    id: input?.taskId ?? undefined,
    status: input?.status ?? undefined,
  };

  const visibility = input?.visibility ?? "public";
  if (visibility === "owned") {
    if (!input?.userId) {
      return {
        ...baseWhere,
        ownerUserId: "__unreachable__",
      };
    }

    return {
      ...baseWhere,
      ownerUserId: input.userId,
    };
  }

  if (visibility === "accessible" && input?.userId) {
    return {
      ...baseWhere,
      OR: [{ isPublic: true }, { ownerUserId: input.userId }],
    };
  }

  return {
    ...baseWhere,
    isPublic: true,
  };
}

function sortTasksForAccountability<T extends ReturnType<typeof decorateTask>>(tasks: T[]) {
  return [...tasks].sort((left, right) => {
    const rightScore = scoreTaskForAccountability(right);
    const leftScore = scoreTaskForAccountability(left);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const rightVerifiedAt = right.verifiedAt?.getTime() ?? 0;
    const leftVerifiedAt = left.verifiedAt?.getTime() ?? 0;
    if (rightVerifiedAt !== leftVerifiedAt) {
      return rightVerifiedAt - leftVerifiedAt;
    }

    return (right.completedAt?.getTime() ?? 0) - (left.completedAt?.getTime() ?? 0);
  });
}

export async function getTasksPageData(
  userId?: string | null,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const [viewer, topLevelTasks, allTasks, myClaims, ownedTasks] = await Promise.all([
    userId ? getTaskViewer(userId) : Promise.resolve(null),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        isPublic: true,
        parentTaskId: null,
        childTasks: { some: { deletedAt: null } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        ...taskListSelect,
        childTasks: {
          where: { deletedAt: null, isPublic: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: taskListSelect,
        },
      },
      take: 10,
    }),
    prisma.task.findMany({
      where: getTaskVisibilityWhere(),
      orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: taskListSelect,
    }),
    userId
      ? prisma.taskClaim.findMany({
          where: {
            deletedAt: null,
            userId,
          },
          orderBy: [{ claimedAt: "desc" }],
          select: {
            actualCashCostUsd: true,
            actualEffortSeconds: true,
            claimedAt: true,
            completedAt: true,
            id: true,
            status: true,
            task: {
              select: taskListSelect,
            },
            verificationNote: true,
            verifiedAt: true,
          },
          take: 40,
        })
      : Promise.resolve([]),
    userId
      ? prisma.task.findMany({
          where: getTaskVisibilityWhere({
            userId,
            visibility: "owned",
          }),
          orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
          select: taskListSelect,
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  const decoratedTasks = allTasks.map((task) =>
    decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
  );
  const allTasksSorted = sortTasksForAccountability(decoratedTasks);

  const assignedToYou =
    viewer?.personId != null
      ? sortTasksForAccountability(
          decoratedTasks.filter((task) => task.assigneePerson?.id === viewer.personId),
        )
      : [];

  const forYou =
    viewer == null
      ? []
      : rankTasksForUser(
          decoratedTasks.filter((task) => !task.viewerHasClaim),
          viewer,
          24,
          {
            preferLeafExecution: true,
          },
        ).map((entry) => ({
          ...entry.task,
          recommendationScore: entry.score,
        }));
  const decoratedOwnedTasks = ownedTasks.map((task) =>
    decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
  );
  const ownedPrivateTasks = decoratedOwnedTasks.filter((task) => !task.isPublic);

  const topLevelTaskIds = new Set(topLevelTasks.map((t) => t.id));
  const topLevelChildIds = new Set(
    topLevelTasks.flatMap((t) => t.childTasks.map((c) => c.id)),
  );

  const decoratedTopLevel = topLevelTasks.map((task) => ({
    ...decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
    childTasks: task.childTasks.map((child) =>
      decorateTask(child, {
        frameKey: options?.frameKey,
        userId: viewer?.id ?? null,
      }),
    ),
  }));

  // Filter top-level and their children out of "all tasks" to avoid duplication
  const filteredAllTasks = allTasksSorted.filter(
    (t) => !topLevelTaskIds.has(t.id) && !topLevelChildIds.has(t.id),
  );

  return {
    allTasks: filteredAllTasks,
    assignedToYou,
    forYou,
    myClaims: myClaims.map((claim) => ({
      ...claim,
      task: decorateTask(claim.task, {
        frameKey: options?.frameKey,
        userId,
      }),
    })),
    ownedPrivateTasks,
    topLevelTasks: decoratedTopLevel,
    viewer,
  };
}

export async function getTreatyBlockerTasks(
  userId?: string | null,
  limit = 12,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      isPublic: true,
      parentTask: {
        deletedAt: null,
        taskKey: TREATY_PARENT_TASK_KEY,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: taskListSelect,
    take: Math.max(limit * 3, 24),
  });

  return sortTasksForAccountability(
    tasks.map((task) =>
      decorateTask(task, {
        frameKey: options?.frameKey,
        userId: userId ?? null,
      }),
    ),
  ).slice(0, limit);
}

export async function getTaskDetailData(
  taskId: string,
  userId?: string | null,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const [task, viewer, contactActionCount] = await Promise.all([
    prisma.task.findFirst({
      where: getTaskVisibilityWhere({
        taskId,
        userId,
        visibility: "accessible",
      }),
      select: taskDetailSelect,
    }),
    userId ? getTaskViewer(userId) : Promise.resolve(null),
    countTaskContactActions(taskId),
  ]);

  if (!task) {
    return null;
  }

  const viewerClaim =
    userId == null
      ? null
      : await prisma.taskClaim.findUnique({
          where: {
            taskId_userId: {
              taskId,
              userId,
            },
          },
          select: {
            actualCashCostUsd: true,
            actualEffortSeconds: true,
            claimedAt: true,
            completedAt: true,
            completionEvidence: true,
            id: true,
            status: true,
            verificationNote: true,
            verifiedAt: true,
          },
        });

  return {
    contactActionCount,
    task: decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
    viewer,
    viewerClaim,
  };
}

/**
 * Walk up parentTaskId from the given task to the root, returning ancestors
 * ordered root → immediate parent. Excludes the task itself. Cycle-safe with
 * a seen-set. Depth capped at 16 so a pathological tree can't spin forever.
 */
export async function getTaskAncestors(
  taskId: string,
): Promise<Array<{ id: string; title: string }>> {
  const seen = new Set<string>([taskId]);
  const ancestors: Array<{ id: string; title: string }> = [];
  let currentId: string | null = taskId;

  for (let depth = 0; depth < 16; depth += 1) {
    const current: { parentTaskId: string | null } | null =
      await prisma.task.findUnique({
        where: { id: currentId },
        select: { parentTaskId: true },
      });
    if (!current?.parentTaskId || seen.has(current.parentTaskId)) {
      break;
    }
    const parent: { id: string; title: string } | null =
      await prisma.task.findUnique({
        where: { id: current.parentTaskId },
        select: { id: true, title: true },
      });
    if (!parent) {
      break;
    }
    ancestors.unshift(parent);
    seen.add(parent.id);
    currentId = parent.id;
  }

  return ancestors;
}

export async function listTasks(options?: {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  frameKey?: TaskImpactFrameKey | string | null;
  limit?: number | null;
  status?: TaskStatus | null;
  userId?: string | null;
  visibility?: "public" | "owned" | "accessible";
}) {
  const tasks = await prisma.task.findMany({
    where: getTaskVisibilityWhere({
      assigneeOrganizationId: options?.assigneeOrganizationId,
      assigneePersonId: options?.assigneePersonId,
      status: options?.status,
      userId: options?.userId,
      visibility: options?.visibility,
    }),
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    select: taskListSelect,
    ...(options?.limit == null ? {} : { take: options.limit }),
  });

  return sortTasksForAccountability(
    tasks.map((task) =>
      decorateTask(task, {
        frameKey: options?.frameKey,
        userId: options?.userId ?? null,
      }),
    ),
  );
}

export async function searchTasks(
  query: string,
  options?: {
    limit?: number | null;
    userId?: string | null;
  },
): Promise<TaskSearchResult[]> {
  const searchTerms = getSearchTerms(query);
  const limit = Math.max(options?.limit ?? 12, 1);

  if (!searchTerms.normalizedQuery) {
    return [];
  }

  const searchPhrases = Array.from(
    new Set([searchTerms.normalizedQuery, ...searchTerms.terms]),
  );

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        getTaskVisibilityWhere({
          userId: options?.userId,
          visibility: options?.userId ? "accessible" : "public",
        }),
        {
          OR: searchPhrases.flatMap((term) => [
            {
              title: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              taskKey: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              roleTitle: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              assigneeOrganization: {
                is: {
                  name: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              assigneePerson: {
                is: {
                  displayName: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              assigneePerson: {
                is: {
                  currentAffiliation: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]),
        },
      ],
    },
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    select: taskSearchSelect,
    take: Math.max(limit * 4, 24),
  });

  return tasks
    .map((task) => mapTaskSearchResult(task, searchTerms))
    .filter((task) => task.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export async function getPersonTaskProfileData(
  // Accepts either a Person.handle or a Person.id (cuid). Handle is preferred
  // because it's stable + readable; cuid lookups are kept as a fallback so
  // historical links never break.
  handleOrId: string,
  userId?: string | null,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  // Look up by handle first (the readable URL), then by cuid as a fallback.
  // We try them sequentially because Prisma's `OR` clause would scan both
  // indexes; this is one indexed point-lookup followed by another only if
  // the first misses.
  let person = await prisma.person.findFirst({
    where: { deletedAt: null, handle: handleOrId },
    select: {
      bio: true,
      countryCode: true,
      currentAffiliation: true,
      displayName: true,
      handle: true,
      id: true,
      image: true,
      isPublicFigure: true,
      sourceRef: true,
      sourceUrl: true,
    },
  });
  if (!person) {
    person = await prisma.person.findFirst({
      where: { deletedAt: null, id: handleOrId },
      select: {
        bio: true,
        countryCode: true,
        currentAffiliation: true,
        displayName: true,
        handle: true,
        id: true,
        image: true,
        isPublicFigure: true,
        sourceRef: true,
        sourceUrl: true,
      },
    });
  }
  if (!person) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: {
      assigneePersonId: person.id,
      deletedAt: null,
      isPublic: true,
    },
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    select: taskListSelect,
    take: 100,
  });

  const decoratedTasks = sortTasksForAccountability(
    tasks.map((task) =>
      decorateTask(task, {
        frameKey: options?.frameKey,
        userId,
      }),
    ),
  );

  return {
    openTasks: decoratedTasks.filter((task) => task.status !== TaskStatus.VERIFIED),
    person,
    tasks: decoratedTasks,
    verifiedTasks: decoratedTasks.filter((task) => task.status === TaskStatus.VERIFIED),
  };
}

export async function createOwnedTask(
  ownerUserId: string,
  input: {
    category?: TaskCategory | null;
    claimPolicy?: TaskClaimPolicy | null;
    contactLabel?: string | null;
    contactTemplate?: string | null;
    contactUrl?: string | null;
    description?: string | null;
    difficulty?: TaskDifficulty | null;
    dueAt?: Date | null;
    estimatedEffortHours?: number | null;
    interestTags?: string[] | null;
    isPublic?: boolean | null;
    maxClaims?: number | null;
    roleTitle?: string | null;
    skillTags?: string[] | null;
    status?: TaskStatus | null;
    title: string;
  },
) {
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (
    input.claimPolicy === TaskClaimPolicy.OPEN_MANY &&
    input.maxClaims != null &&
    input.maxClaims < 1
  ) {
    throw new Error("maxClaims must be at least 1 for OPEN_MANY tasks.");
  }

  return prisma.task.create({
    data: {
      category: input.category ?? TaskCategory.OTHER,
      claimPolicy: input.claimPolicy ?? TaskClaimPolicy.ASSIGNED_ONLY,
      contactLabel: input.contactLabel?.trim() || null,
      contactTemplate: input.contactTemplate?.trim() || null,
      contactUrl: input.contactUrl?.trim() || null,
      description,
      difficulty: input.difficulty ?? TaskDifficulty.INTERMEDIATE,
      dueAt: input.dueAt ?? null,
      estimatedEffortHours: input.estimatedEffortHours ?? null,
      interestTags: input.interestTags?.filter(Boolean) ?? [],
      isPublic: input.isPublic ?? false,
      maxClaims:
        (input.claimPolicy ?? TaskClaimPolicy.ASSIGNED_ONLY) === TaskClaimPolicy.OPEN_MANY
          ? input.maxClaims ?? null
          : null,
      ownerUserId,
      roleTitle: input.roleTitle?.trim() || null,
      skillTags: input.skillTags?.filter(Boolean) ?? [],
      status: input.status ?? TaskStatus.ACTIVE,
      title,
    },
    select: taskDetailSelect,
  });
}

export async function updateOwnedTask(
  taskId: string,
  ownerUserId: string,
  input: {
    category?: TaskCategory | null;
    claimPolicy?: TaskClaimPolicy | null;
    contactLabel?: string | null;
    contactTemplate?: string | null;
    contactUrl?: string | null;
    description?: string | null;
    difficulty?: TaskDifficulty | null;
    dueAt?: Date | null;
    estimatedEffortHours?: number | null;
    interestTags?: string[] | null;
    isPublic?: boolean | null;
    maxClaims?: number | null;
    roleTitle?: string | null;
    skillTags?: string[] | null;
    status?: TaskStatus | null;
    title?: string | null;
  },
) {
  const existingTask = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: taskId,
      ownerUserId,
    },
    select: {
      claimPolicy: true,
      id: true,
    },
  });

  if (!existingTask) {
    throw new Error("Task not found.");
  }

  const nextClaimPolicy = input.claimPolicy ?? existingTask.claimPolicy;
  if (
    nextClaimPolicy === TaskClaimPolicy.OPEN_MANY &&
    input.maxClaims != null &&
    input.maxClaims < 1
  ) {
    throw new Error("maxClaims must be at least 1 for OPEN_MANY tasks.");
  }

  const title = input.title == null ? undefined : input.title.trim();
  if (title !== undefined && !title) {
    throw new Error("Title is required.");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      category: input.category ?? undefined,
      claimPolicy: input.claimPolicy ?? undefined,
      contactLabel: input.contactLabel == null ? undefined : input.contactLabel.trim() || null,
      contactTemplate:
        input.contactTemplate == null ? undefined : input.contactTemplate.trim() || null,
      contactUrl: input.contactUrl == null ? undefined : input.contactUrl.trim() || null,
      description: input.description == null ? undefined : input.description.trim(),
      difficulty: input.difficulty ?? undefined,
      dueAt: input.dueAt ?? undefined,
      estimatedEffortHours: input.estimatedEffortHours ?? undefined,
      interestTags: input.interestTags?.filter(Boolean) ?? undefined,
      isPublic: input.isPublic ?? undefined,
      maxClaims:
        nextClaimPolicy === TaskClaimPolicy.OPEN_MANY
          ? input.maxClaims ?? undefined
          : input.claimPolicy
            ? null
            : undefined,
      roleTitle: input.roleTitle == null ? undefined : input.roleTitle.trim() || null,
      skillTags: input.skillTags?.filter(Boolean) ?? undefined,
      status: input.status ?? undefined,
      title,
    },
    select: taskDetailSelect,
  });
}

export async function claimTask(taskId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: {
        claimPolicy: true,
        id: true,
        maxClaims: true,
        status: true,
      },
    });

    if (task.status !== TaskStatus.ACTIVE) {
      throw new Error("Task is not active.");
    }

    if (task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY) {
      throw new Error("This task is assigned directly and cannot be claimed.");
    }

    const existingClaim = await tx.taskClaim.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (
      existingClaim &&
      CLAIM_STATUSES_THAT_BLOCK_RECLAIM.includes(
        existingClaim.status as (typeof CLAIM_STATUSES_THAT_BLOCK_RECLAIM)[number],
      )
    ) {
      return existingClaim;
    }

    const activeClaimCount = await tx.taskClaim.count({
      where: {
        deletedAt: null,
        status: {
          in: [...ACTIVE_CLAIM_STATUSES],
        },
        taskId,
      },
    });

    if (task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE && activeClaimCount > 0) {
      throw new Error("This task already has an active claimant.");
    }

    if (
      task.claimPolicy === TaskClaimPolicy.OPEN_MANY &&
      task.maxClaims != null &&
      activeClaimCount >= task.maxClaims
    ) {
      throw new Error("This task has reached its claim limit.");
    }

    if (existingClaim) {
      return tx.taskClaim.update({
        where: { id: existingClaim.id },
        data: {
          abandonedAt: null,
          actualCashCostUsd: null,
          actualEffortSeconds: null,
          claimedAt: new Date(),
          completedAt: null,
          completionEvidence: null,
          deletedAt: null,
          startedAt: null,
          status: TaskClaimStatus.CLAIMED,
          verificationNote: null,
          verifiedAt: null,
          verifiedByUserId: null,
        },
      });
    }

    return tx.taskClaim.create({
      data: {
        status: TaskClaimStatus.CLAIMED,
        taskId,
        userId,
      },
    });
  });
}

export async function completeTaskClaim(
  taskId: string,
  userId: string,
  completionEvidence: string,
  actuals?: {
    actualCashCostUsd?: number | null;
    actualEffortSeconds?: number | null;
  },
) {
  const evidence = completionEvidence.trim();

  if (!evidence) {
    throw new Error("Completion evidence is required.");
  }

  const claim = await prisma.taskClaim.findUniqueOrThrow({
    where: {
      taskId_userId: {
        taskId,
        userId,
      },
    },
    select: {
      claimedAt: true,
      id: true,
      startedAt: true,
      status: true,
    },
  });

  if (
    claim.status !== TaskClaimStatus.CLAIMED &&
    claim.status !== TaskClaimStatus.IN_PROGRESS
  ) {
    throw new Error("Only active claims can be completed.");
  }

  return prisma.taskClaim.update({
    where: { id: claim.id },
    data: {
      actualCashCostUsd: actuals?.actualCashCostUsd ?? null,
      actualEffortSeconds: actuals?.actualEffortSeconds ?? null,
      completedAt: new Date(),
      completionEvidence: evidence,
      startedAt: claim.startedAt ?? claim.claimedAt,
      status: TaskClaimStatus.COMPLETED,
    },
  });
}

export async function verifyTask(
  taskId: string,
  reviewerUserId: string,
  input: {
    actualCashCostUsd?: number | null;
    actualEffortSeconds?: number | null;
    claimId?: string | null;
    completionEvidence?: string | null;
    verificationNote?: string | null;
  },
) {
  await requireTaskReviewer(reviewerUserId);

  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: {
        claimPolicy: true,
        id: true,
        status: true,
      },
    });

    if (input.claimId) {
      const claim = await tx.taskClaim.findUniqueOrThrow({
        where: { id: input.claimId },
        select: {
          completionEvidence: true,
          id: true,
          status: true,
          taskId: true,
          userId: true,
        },
      });

      if (claim.taskId !== task.id) {
        throw new Error("Claim does not belong to this task.");
      }

      if (claim.status !== TaskClaimStatus.COMPLETED) {
        throw new Error("Claim must be completed before it can be verified.");
      }

      if (!claim.completionEvidence?.trim()) {
        throw new Error("Claim completion evidence is required before verification.");
      }

      const verifiedClaim = await tx.taskClaim.update({
        where: { id: claim.id },
        data: {
          actualCashCostUsd: input.actualCashCostUsd ?? undefined,
          actualEffortSeconds: input.actualEffortSeconds ?? undefined,
          status: TaskClaimStatus.VERIFIED,
          verificationNote: input.verificationNote?.trim() || null,
          verifiedAt: new Date(),
          verifiedByUserId: reviewerUserId,
        },
      });

      if (task.claimPolicy !== TaskClaimPolicy.OPEN_MANY) {
        await tx.task.update({
          where: { id: task.id },
          data: {
            completedAt: new Date(),
            status: TaskStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedByUserId: reviewerUserId,
          },
        });
      }

      return {
        rewardUserId: claim.userId,
        rewardKey: `task:${task.id}:claim:${claim.id}:verified`,
        value: verifiedClaim,
      };
    }

    const evidence = input.completionEvidence?.trim();

    if (!evidence) {
      throw new Error("Completion evidence is required.");
    }

    return {
      rewardKey: null,
      rewardUserId: null,
      value: await tx.task.update({
        where: { id: task.id },
        data: {
          actualCashCostUsd: input.actualCashCostUsd ?? null,
          actualEffortSeconds: input.actualEffortSeconds ?? null,
          completedAt: new Date(),
          completionEvidence: evidence,
          status: TaskStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedByUserId: reviewerUserId,
        },
      }),
    };
  });

  if (result.rewardUserId && result.rewardKey) {
    await grantWishes({
      dedupeKey: result.rewardKey,
      reason: "TASK_COMPLETED",
      userId: result.rewardUserId,
    });
  }

  return result.value;
}

export async function reassignTask(
  taskId: string,
  reviewerUserId: string,
  input: {
    currentAffiliation?: string | null;
    displayName?: string | null;
    email?: string | null;
    organizationId?: string | null;
    organizationName?: string | null;
    organizationType?: OrgType | null;
    personId?: string | null;
    roleTitle?: string | null;
  },
) {
  await requireTaskReviewer(reviewerUserId);

  const assigneeOrganization =
    input.organizationId?.trim()
      ? await prisma.organization.findUniqueOrThrow({
          where: { id: input.organizationId.trim() },
        })
      : input.organizationName?.trim()
        ? await findOrCreateOrganization({
            name: input.organizationName.trim(),
            type: input.organizationType ?? undefined,
          })
        : null;

  const shouldResolvePerson =
    Boolean(input.personId?.trim()) ||
    Boolean(input.displayName?.trim()) ||
    Boolean(input.email?.trim());

  const assigneePerson =
    !shouldResolvePerson
      ? null
      : input.personId?.trim()
        ? await prisma.person.findUniqueOrThrow({
            where: { id: input.personId.trim() },
          })
        : await findOrCreatePerson({
            currentAffiliation: input.currentAffiliation ?? assigneeOrganization?.name ?? null,
            displayName: input.displayName?.trim() || "",
            email: input.email ?? null,
            isPublicFigure: true,
            roleTitle: input.roleTitle ?? null,
          });

  return prisma.task.update({
    where: { id: taskId },
    data: {
      assigneeOrganizationId: assigneeOrganization?.id ?? null,
      assigneePersonId: assigneePerson?.id ?? null,
      assigneeAffiliationSnapshot:
        input.currentAffiliation ??
        assigneeOrganization?.name ??
        assigneePerson?.currentAffiliation ??
        null,
      roleTitle: input.roleTitle ?? null,
    },
  });
}
