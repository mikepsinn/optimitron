import {
  CourtCasePartyRole,
  OrgType,
  ReferendumVoteSource,
  TaskApplicationPolicy,
  TaskCategory,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskCompensationKind,
  TaskEdgeType,
  TaskExecutionAttemptStatus,
  TaskExecutionMode,
  TaskImpactFrameKey,
  TaskStatus,
  TaskVerificationResult,
  VotePosition,
  type Prisma,
} from "@optimitron/db";
import { isReservedPlanningRootTask } from "@optimitron/db/task-keys";
import {
  assertOrganizationCanBePubliclyReferenced,
  upsertTrustedOrganization,
} from "@/lib/organization.server";
import { findOrCreatePerson } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { getSearchTerms, scoreSearchRecord } from "@/lib/site-search";
import { canonicalizeSiteUrl } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { userDisplaySelect } from "@/lib/user-display";
import { getTaskPath } from "@/lib/routes";
import type { OwnerSendAuthorization } from "@/lib/email/outbound-authorization.server";
import { countTaskCommunications } from "@/lib/tasks/task-communications.server";
import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "@/lib/tasks/execution-planner-audit";
import {
  ensureExecutionPlanningBranch,
  OrganizationPlanningAccessError,
} from "@/lib/tasks/planning-branch.server";
import {
  resolveTaskClaimSettings,
  verifiedClaimClosesTask,
} from "@/lib/tasks/task-claim-policy";
import { getSourceArtifactVisibilityWhere } from "@/lib/source-artifact-visibility.server";
import {
  assertUserCanClaimPaidTask,
  queueTaskPayoutForVerifiedClaim,
} from "@/lib/task-payouts.server";
import {
  buildPrimaryTaskCommunicationEndpointCreateData,
  type PrimaryTaskCommunicationEndpointInput,
  upsertPrimaryTaskCommunicationEndpoint,
} from "@/lib/tasks/task-communication-endpoints.server";
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
import { getExplicitEdgeMarginalFrames } from "@/lib/tasks/marginal-impact";
import {
  canUserViewInternalTaskContent,
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  getTaskVisibilityWhere,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import { grantWishes } from "@/lib/wishes.server";

const log = createLogger("tasks-server");

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

const personTaskProfilePersonSelect = {
  bio: true,
  countryCode: true,
  currentAffiliation: true,
  displayName: true,
  handle: true,
  id: true,
  image: true,
  isPublic: true,
  isPublicFigure: true,
  referendumVotes: {
    where: {
      answer: VotePosition.YES,
      deletedAt: null,
      isPublic: true,
      referendum: { deletedAt: null },
      voteSource: ReferendumVoteSource.SELF,
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      id: true,
      publicComment: true,
      referendum: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  },
  sourceRef: true,
  sourceUrl: true,
  user: {
    select: {
      _count: {
        select: {
          createdCourtCaseParties: {
            where: {
              deletedAt: null,
              isPublic: true,
              role: CourtCasePartyRole.NAMED_PLAINTIFF,
            },
          },
          referendumReferrals: {
            where: {
              answer: VotePosition.YES,
              deletedAt: null,
              isPublic: true,
              referendum: {
                deletedAt: null,
                slug: TREATY_REFERENDUM_SLUG,
              },
              voteSource: ReferendumVoteSource.SELF,
            },
          },
        },
      },
      id: true,
      referralCode: true,
    },
  },
} satisfies Prisma.PersonSelect;

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

export const impactEstimateSetSelect = {
  assumptionsJson: true,
  inputs: {
    where: { deletedAt: null },
    select: {
      parameterRevisionId: true,
      parameterRevision: {
        select: {
          parameter: {
            select: { currentRevisionId: true },
          },
        },
      },
    },
  },
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
      childTasks: {
        where: {
          deletedAt: null,
          status: {
            in: [TaskStatus.DRAFT, TaskStatus.ACTIVE],
          },
        },
      },
      executionAttempts: {
        where: {
          deletedAt: null,
          OR: [
            {
              status: {
                in: [
                  TaskExecutionAttemptStatus.QUEUED,
                  TaskExecutionAttemptStatus.RUNNING,
                ],
              },
            },
            {
              status: TaskExecutionAttemptStatus.COMPLETED,
              verifications: {
                some: {
                  deletedAt: null,
                  result: TaskVerificationResult.PENDING,
                },
              },
            },
          ],
        },
      },
      incomingEdges: {
        where: {
          deletedAt: null,
          edgeType: {
            in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON],
          },
          fromTask: {
            deletedAt: null,
            status: { not: TaskStatus.VERIFIED },
          },
        },
      },
    },
  },
  assigneeOrganization: {
    select: {
      contactEmail: true,
      id: true,
      name: true,
      slug: true,
      squareLogoUrl: true,
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
        select: userDisplaySelect,
      },
      userId: true,
      verificationNote: true,
      verifiedAt: true,
    },
  },
  completedAt: true,
  completionEvidence: true,
  communicationEndpoints: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ isPrimary: "desc" }, { priority: "asc" }, { createdAt: "asc" }],
    select: {
      email: true,
      id: true,
      instructions: true,
      isPrimary: true,
      kind: true,
      label: true,
      priority: true,
      url: true,
    },
  },
  assigneeAffiliationSnapshot: true,
  applicationPolicy: true,
  applicationQuestionsJson: true,
  availableAt: true,
  compensationCadence: true,
  compensationCurrency: true,
  compensationKind: true,
  compensationMaxAmountMinorUnits: true,
  compensationMinAmountMinorUnits: true,
  compensationPaymentRails: true,
  currentImpactEstimateSet: {
    select: impactEstimateSetSelect,
  },
  contextJson: true,
  description: true,
  deadlinePolicy: true,
  dueAt: true,
  engagementKind: true,
  estimatedHoursPerWeekMax: true,
  estimatedHoursPerWeekMin: true,
  estimatedEffortHours: true,
  executionMode: true,
  fundingTarget: {
    select: {
      id: true,
      status: true,
      targetAmountCents: true,
    },
  },
  id: true,
  impactStatement: true,
  interestTags: true,
  isPublic: true,
  locationText: true,
  maxClaims: true,
  createdByUserId: true,
  ownerOrganizationId: true,
  sortOrder: true,
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
          assigneePersonId: true,
          claims: {
            where: {
              deletedAt: null,
            },
            select: {
              status: true,
              userId: true,
            },
          },
          createdByUserId: true,
          currentImpactEstimateSet: {
            select: impactEstimateSetSelect,
          },
          deletedAt: true,
          dueAt: true,
          estimatedEffortHours: true,
          id: true,
          isPublic: true,
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
  preferredAccessTags: true,
  preferredCredentialTags: true,
  preferredLanguageTags: true,
  preferredSkillTags: true,
  preferredToolTags: true,
  remotePolicy: true,
  requiredAccessTags: true,
  requiredCredentialTags: true,
  requiredLanguageTags: true,
  requiredToolTags: true,
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
  workLocationCity: true,
  workLocationCountryCode: true,
  workLocationLatitude: true,
  workLocationLongitude: true,
  workLocationPostalCode: true,
  workLocationRadiusKm: true,
  workLocationRegionCode: true,
  workTimeZone: true,
  incomingEdges: {
    where: {
      deletedAt: null,
      edgeType: { in: ["BLOCKS", "DEPENDS_ON"] },
    },
    select: {
      edgeType: true,
      probabilityDeltaBase: true,
      timeDeltaDaysBase: true,
      fromTask: {
        select: {
          assigneePersonId: true,
          claims: {
            where: {
              deletedAt: null,
            },
            select: {
              status: true,
              userId: true,
            },
          },
          createdByUserId: true,
          deletedAt: true,
          dueAt: true,
          estimatedEffortHours: true,
          id: true,
          isPublic: true,
          status: true,
          taskKey: true,
          title: true,
        },
      },
    },
  },
  verifiedAt: true,
} satisfies Prisma.TaskSelect;

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
  id: true,
  impactStatement: true,
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
  referralInvitations: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      convertedAt: true,
      copiedAt: true,
      id: true,
      messageFormat: true,
      recipientEmail: true,
      recipientName: true,
      sentAt: true,
      status: true,
    },
  },
  verifiedByUser: {
    select: {
      id: true,
      person: { select: { handle: true, displayName: true } },
    },
  },
} satisfies Prisma.TaskSelect;

function impactEstimateSetSelectForViewer(
  userId?: string | null,
  clientAccessBoundary?: TaskClientAccessBoundary,
) {
  return {
    ...impactEstimateSetSelect,
    sourceArtifacts: {
      ...impactEstimateSetSelect.sourceArtifacts,
      where: {
        AND: [
          impactEstimateSetSelect.sourceArtifacts.where,
          {
            sourceArtifact: getSourceArtifactVisibilityWhere(
              userId,
              clientAccessBoundary,
            ),
          },
        ],
      },
    },
  } satisfies Prisma.TaskImpactEstimateSetSelect;
}

function taskListSelectForViewer(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  personId?: string | null;
  userId?: string | null;
}) {
  const viewerAccess = getTaskAccessWhere({
    action: "READ",
    personId: input.personId,
    userId: input.userId,
  });
  const taskAccess = input.clientAccessBoundary
    ? {
        AND: [
          viewerAccess,
          getTaskClientAccessWhere(input.clientAccessBoundary),
        ],
      }
    : viewerAccess;
  const impactSelect = impactEstimateSetSelectForViewer(
    input.userId,
    input.clientAccessBoundary,
  );

  return {
    ...taskListSelect,
    _count: {
      select: {
        ...taskListSelect._count.select,
        childTasks: {
          where: {
            AND: [taskListSelect._count.select.childTasks.where, taskAccess],
          },
        },
      },
    },
    currentImpactEstimateSet: { select: impactSelect },
    incomingEdges: {
      ...taskListSelect.incomingEdges,
      where: {
        AND: [taskListSelect.incomingEdges.where, { fromTask: taskAccess }],
      },
    },
    outgoingEdges: {
      ...taskListSelect.outgoingEdges,
      where: {
        AND: [taskListSelect.outgoingEdges.where, { toTask: taskAccess }],
      },
      select: {
        ...taskListSelect.outgoingEdges.select,
        toTask: {
          select: {
            ...taskListSelect.outgoingEdges.select.toTask.select,
            currentImpactEstimateSet: { select: impactSelect },
          },
        },
      },
    },
    parentTask: {
      select: {
        ...taskListSelect.parentTask.select,
        childTasks: {
          ...taskListSelect.parentTask.select.childTasks,
          where: {
            AND: [
              taskListSelect.parentTask.select.childTasks.where,
              taskAccess,
            ],
          },
        },
        currentImpactEstimateSet: { select: impactSelect },
      },
    },
    sourceArtifacts: {
      ...taskListSelect.sourceArtifacts,
      where: {
        AND: [
          taskListSelect.sourceArtifacts.where,
          {
            sourceArtifact: getSourceArtifactVisibilityWhere(
              input.userId,
              input.clientAccessBoundary,
            ),
          },
        ],
      },
    },
  } satisfies Prisma.TaskSelect;
}

function taskDetailSelectForViewer(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  personId?: string | null;
  userId?: string | null;
}) {
  const listSelect = taskListSelectForViewer(input);
  const viewerAccess = getTaskAccessWhere({
    action: "READ",
    personId: input.personId,
    userId: input.userId,
  });
  const taskAccess = input.clientAccessBoundary
    ? {
        AND: [
          viewerAccess,
          getTaskClientAccessWhere(input.clientAccessBoundary),
        ],
      }
    : viewerAccess;

  return {
    ...taskDetailSelect,
    ...listSelect,
    childTasks: {
      ...taskDetailSelect.childTasks,
      where: {
        AND: [taskDetailSelect.childTasks.where, taskAccess],
      },
      select: listSelect,
    },
  } satisfies Prisma.TaskSelect;
}

type TaskListItem = Prisma.TaskGetPayload<{ select: typeof taskListSelect }>;
type TaskDetailItem = Prisma.TaskGetPayload<{
  select: typeof taskDetailSelect;
}>;
type TaskSearchItem = Prisma.TaskGetPayload<{
  select: typeof taskSearchSelect;
}>;
type TaskViewer = Awaited<ReturnType<typeof getTaskViewer>>;

export interface TaskSearchResult {
  assigneeLabel: string | null;
  category: TaskCategory;
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
    ACTIVE_CLAIM_STATUSES.includes(
      claim.status as (typeof ACTIVE_CLAIM_STATUSES)[number],
    ),
  ).length;
}

function hasViewerClaim(
  task: TaskListItem | TaskDetailItem,
  userId: string | null,
) {
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
  if (
    contextJson == null ||
    typeof contextJson !== "object" ||
    Array.isArray(contextJson)
  ) {
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

function normalizeSourceArtifact<
  T extends { sourceRef: string | null; sourceUrl: string | null },
>(artifact: T) {
  return {
    ...artifact,
    sourceRef:
      typeof artifact.sourceRef === "string" &&
      /^https?:\/\//i.test(artifact.sourceRef)
        ? canonicalizeSiteUrl(artifact.sourceRef)
        : artifact.sourceRef,
    sourceUrl: canonicalizeSiteUrl(artifact.sourceUrl),
  };
}

function getPrimaryTaskCommunicationEndpoint(
  task: Pick<TaskListItem | TaskDetailItem, "communicationEndpoints">,
) {
  return (
    task.communicationEndpoints.find((endpoint) => endpoint.isPrimary) ??
    task.communicationEndpoints[0] ??
    null
  );
}

function getEndpointUrl(
  endpoint: ReturnType<typeof getPrimaryTaskCommunicationEndpoint>,
) {
  if (!endpoint) {
    return null;
  }

  if (endpoint.url) {
    return endpoint.url;
  }

  if (endpoint.email) {
    return `mailto:${endpoint.email}`;
  }

  return null;
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
  const href = getTaskPath(task.id);
  const snippet = [
    task.description,
    task.impactStatement,
    task.roleTitle,
    assigneeParts.length > 0
      ? `Assigned to ${assigneeParts.join(" / ")}`
      : null,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return {
    assigneeLabel: assigneeParts[0] ?? null,
    category: task.category,
    href,
    id: task.id,
    score:
      (task.taskKey?.toLowerCase() === searchTerms.normalizedQuery ? 100 : 0) +
      scoreSearchRecord(searchTerms, {
        title: task.title,
        description: snippet,
        href,
        keywords: [
          task.category,
          task.status,
          task.taskKey ?? "",
          ...task.interestTags,
          ...task.skillTags,
          ...assigneeParts,
        ],
        section: "Tasks",
      }) +
      fuzzyTaskSearchScore(task, searchTerms),
    snippet: snippet || null,
    status: task.status,
    taskKey: task.taskKey,
    title: task.title,
  };
}

function editDistance(left: string, right: string) {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Math.max(left.length, right.length);
}

function fuzzyTokenSimilarity(queryTerm: string, candidate: string) {
  if (queryTerm === candidate) return 1;
  if (
    queryTerm.length >= 3 &&
    (candidate.includes(queryTerm) || queryTerm.includes(candidate))
  ) {
    return (
      Math.min(queryTerm.length, candidate.length) /
      Math.max(queryTerm.length, candidate.length)
    );
  }

  const maximumDistance =
    Math.max(queryTerm.length, candidate.length) >= 7 ? 2 : 1;
  const distance = editDistance(queryTerm, candidate);
  return distance <= maximumDistance
    ? 1 - distance / Math.max(queryTerm.length, candidate.length)
    : 0;
}

function searchTokens(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9%]+/i)
    .filter((token) => token.length >= 2);
}

function fuzzyTaskSearchScore(
  task: TaskSearchItem,
  searchTerms: ReturnType<typeof getSearchTerms>,
) {
  const assigneeParts = [
    task.assigneePerson?.displayName,
    task.assigneePerson?.currentAffiliation,
    task.assigneeOrganization?.name,
  ];
  const weightedFields = [
    { tokens: searchTokens(task.title), weight: 5 },
    {
      tokens: searchTokens(
        [task.taskKey, task.roleTitle, ...task.interestTags, ...task.skillTags]
          .filter(Boolean)
          .join(" "),
      ),
      weight: 3,
    },
    {
      tokens: searchTokens(
        [task.description, task.impactStatement, ...assigneeParts]
          .filter(Boolean)
          .join(" "),
      ),
      weight: 2,
    },
  ];

  let score = 0;
  for (const queryTerm of searchTerms.terms) {
    let bestWeightedSimilarity = 0;
    for (const field of weightedFields) {
      for (const token of field.tokens) {
        const similarity = fuzzyTokenSimilarity(queryTerm, token);
        if (similarity >= 0.7) {
          bestWeightedSimilarity = Math.max(
            bestWeightedSimilarity,
            similarity * field.weight,
          );
        }
      }
    }
    score += bestWeightedSimilarity;
  }

  return Number(score.toFixed(3));
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
    estimatedEffortHoursBase:
      task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursBase,
    estimatedEffortHoursHigh:
      task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursHigh,
    estimatedEffortHoursLow:
      task.estimatedEffortHours ?? parentFrame.estimatedEffortHoursLow,
    frameSlug: `${parentFrame.frameSlug}-parent-share`,
    metrics: [],
  });
}

function buildAnnotatedDownstreamMarginalImpactFrame(
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

    return getExplicitEdgeMarginalFrames({
      downstreamFrame: frame,
      edge,
      estimatedEffortHours: task.estimatedEffortHours,
      sourceTaskId: task.id,
      sourceTaskTitle: task.title,
    });
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
      task.estimatedEffortHours ??
      downstreamFrames[0]?.estimatedEffortHoursBase ??
      null,
    estimatedEffortHoursHigh:
      task.estimatedEffortHours ??
      downstreamFrames[0]?.estimatedEffortHoursHigh ??
      null,
    estimatedEffortHoursLow:
      task.estimatedEffortHours ??
      downstreamFrames[0]?.estimatedEffortHoursLow ??
      null,
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
  activeExecutionAttemptCount: number;
  blockerStatuses: TaskStatus[];
  hiddenUnresolvedBlockerCount: number;
  directImpactFrame: TaskImpactSelection["selectedFrame"];
  marginalImpactFrame: TaskImpactSelection["selectedFrame"];
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
    directImpactSelection.selectedFrame == null
      ? buildParentInheritedImpactFrame(task, options)
      : null;
  const downstreamMarginalFrame = buildAnnotatedDownstreamMarginalImpactFrame(
    task,
    options,
  );
  const marginalImpactFrame = sumImpactFrameSummaries(
    [directImpactSelection.selectedFrame, downstreamMarginalFrame].filter(
      (frame): frame is NonNullable<typeof frame> => frame != null,
    ),
    directImpactSelection.selectedFrame
      ? {
          customFrameLabel:
            directImpactSelection.selectedFrame.customFrameLabel,
          estimatedCashCostUsdBase:
            task.actualCashCostUsd ??
            directImpactSelection.selectedFrame.estimatedCashCostUsdBase,
          estimatedEffortHoursBase:
            task.estimatedEffortHours ??
            directImpactSelection.selectedFrame.estimatedEffortHoursBase,
          frameKey: directImpactSelection.selectedFrame.frameKey,
          frameSlug: directImpactSelection.selectedFrame.frameSlug,
          metrics: directImpactSelection.selectedFrame.metrics,
        }
      : {
          customFrameLabel: downstreamMarginalFrame?.customFrameLabel ?? null,
          estimatedCashCostUsdBase: task.actualCashCostUsd ?? null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase:
            task.estimatedEffortHours ??
            downstreamMarginalFrame?.estimatedEffortHoursBase ??
            null,
          estimatedEffortHoursHigh:
            task.estimatedEffortHours ??
            downstreamMarginalFrame?.estimatedEffortHoursHigh ??
            null,
          estimatedEffortHoursLow:
            task.estimatedEffortHours ??
            downstreamMarginalFrame?.estimatedEffortHoursLow ??
            null,
          frameKey:
            downstreamMarginalFrame?.frameKey ?? DEFAULT_TASK_IMPACT_FRAME,
          frameSlug:
            downstreamMarginalFrame?.frameSlug ?? "explicit-marginal-impact",
          metrics: [],
        },
  );
  const selectedImpactFrame = sumImpactFrameSummaries(
    [
      directImpactSelection.selectedFrame,
      inheritedParentFrame,
      downstreamMarginalFrame,
    ].filter((frame): frame is NonNullable<typeof frame> => frame != null),
    directImpactSelection.selectedFrame
      ? {
          customFrameLabel:
            directImpactSelection.selectedFrame.customFrameLabel,
          estimatedCashCostUsdBase:
            task.actualCashCostUsd ??
            directImpactSelection.selectedFrame.estimatedCashCostUsdBase,
          estimatedEffortHoursBase:
            task.estimatedEffortHours ??
            directImpactSelection.selectedFrame.estimatedEffortHoursBase,
          frameKey: directImpactSelection.selectedFrame.frameKey,
          frameSlug: directImpactSelection.selectedFrame.frameSlug,
          metrics: directImpactSelection.selectedFrame.metrics,
        }
      : {
          customFrameLabel:
            inheritedParentFrame?.customFrameLabel ??
            downstreamMarginalFrame?.customFrameLabel ??
            null,
          estimatedCashCostUsdBase: task.actualCashCostUsd ?? null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursBase ??
            downstreamMarginalFrame?.estimatedEffortHoursBase ??
            null,
          estimatedEffortHoursHigh:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursHigh ??
            downstreamMarginalFrame?.estimatedEffortHoursHigh ??
            null,
          estimatedEffortHoursLow:
            task.estimatedEffortHours ??
            inheritedParentFrame?.estimatedEffortHoursLow ??
            downstreamMarginalFrame?.estimatedEffortHoursLow ??
            null,
          frameKey:
            inheritedParentFrame?.frameKey ??
            downstreamMarginalFrame?.frameKey ??
            DEFAULT_TASK_IMPACT_FRAME,
          frameSlug:
            inheritedParentFrame?.frameSlug ??
            downstreamMarginalFrame?.frameSlug ??
            "effective-impact",
          metrics: [],
        },
  );
  const derivedImpact = deriveImpactRatios(selectedImpactFrame);
  const decoratedChildTasks: unknown[] | undefined =
    "childTasks" in task
      ? task.childTasks.map((childTask) => decorateTask(childTask, options))
      : undefined;

  const visibleBlockerStatuses = task.incomingEdges.map(
    (edge) => edge.fromTask.status as TaskStatus,
  );
  const visibleUnresolvedBlockerCount = visibleBlockerStatuses.filter(
    (status) => status !== TaskStatus.VERIFIED,
  ).length;
  const hiddenUnresolvedBlockerCount = Math.max(
    0,
    task._count.incomingEdges - visibleUnresolvedBlockerCount,
  );
  const blockerStatuses = [
    ...visibleBlockerStatuses,
    ...Array<TaskStatus>(hiddenUnresolvedBlockerCount).fill(TaskStatus.ACTIVE),
  ];
  const normalizedSourceArtifacts = task.sourceArtifacts.map((entry) => ({
    ...entry,
    sourceArtifact: normalizeSourceArtifact(entry.sourceArtifact),
  }));
  const normalizedPrimarySourceArtifact =
    normalizedSourceArtifacts.find((entry) => entry.isPrimary)
      ?.sourceArtifact ??
    normalizedSourceArtifacts[0]?.sourceArtifact ??
    null;
  const primaryCommunicationEndpoint =
    getPrimaryTaskCommunicationEndpoint(task);
  const primaryEndpointUrl = getEndpointUrl(primaryCommunicationEndpoint);
  const primaryEndpoint = primaryCommunicationEndpoint
    ? {
        email: primaryCommunicationEndpoint.email ?? null,
        instructions: primaryCommunicationEndpoint.instructions ?? null,
        kind: primaryCommunicationEndpoint.kind,
        label: primaryCommunicationEndpoint.label ?? null,
        url: canonicalizeSiteUrl(primaryEndpointUrl),
      }
    : null;

  return {
    ...task,
    activeClaimCount: countActiveClaims(task),
    activeChildTaskCount: task._count.childTasks,
    activeExecutionAttemptCount: task._count.executionAttempts,
    blockerStatuses,
    hiddenUnresolvedBlockerCount,
    ...(decoratedChildTasks ? { childTasks: decoratedChildTasks } : {}),
    contextJson: normalizeTaskContextJson(task.contextJson),
    directImpactFrame: directImpactSelection.selectedFrame,
    marginalImpactFrame,
    primaryEndpoint,
    impact: {
      availableFrames: directImpactSelection.availableFrames,
      confidenceSummary: selectedImpactFrame?.summaryStatsJson ?? null,
      currentSet: directImpactSelection.currentSet,
      selectedFrame: selectedImpactFrame,
      selectedMetrics:
        selectedImpactFrame?.metrics != null
          ? Object.fromEntries(
              selectedImpactFrame.metrics.map((metric) => [
                metric.metricKey,
                metric,
              ]),
            )
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
    activeExecutionAttemptCount: number;
    blockerStatuses: TaskStatus[];
    hiddenUnresolvedBlockerCount: number;
    directImpactFrame: TaskImpactSelection["selectedFrame"];
    marginalImpactFrame: TaskImpactSelection["selectedFrame"];
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
      personId: true,
      skillTags: true,
    },
  });
}

// getTaskVisibilityWhere moved to @/lib/tasks/task-visibility.server so the
// comment/vote/application surfaces can reuse the exact /tasks/[id] predicate.

function sortTasksForAccountability<T extends ReturnType<typeof decorateTask>>(
  tasks: T[],
) {
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

    return (
      (right.completedAt?.getTime() ?? 0) - (left.completedAt?.getTime() ?? 0)
    );
  });
}

/**
 * Prisma can't filter a to-one relation, so list selects always return the
 * parent row even when the viewer has no access to it. Null out inaccessible
 * parents before decoration so inherited impact frames can't leak a private
 * parent's title or estimate numbers into list/planning surfaces. The detail
 * path (getTaskDetailData) does the same check inline.
 */
async function nullInaccessibleParentTasks<
  T extends { parentTask: { id: string } | null },
>(
  tasks: T[],
  viewer: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    personId?: string | null;
    userId?: string | null;
  },
): Promise<T[]> {
  const parentIds = [
    ...new Set(
      tasks.flatMap((task) => (task.parentTask ? [task.parentTask.id] : [])),
    ),
  ];
  if (parentIds.length === 0) return tasks;

  const accessibleParents = await prisma.task.findMany({
    where: {
      deletedAt: null,
      id: { in: parentIds },
      AND: [
        getTaskAccessWhere({
          action: "READ",
          personId: viewer.personId,
          userId: viewer.userId,
        }),
        ...(viewer.clientAccessBoundary
          ? [getTaskClientAccessWhere(viewer.clientAccessBoundary)]
          : []),
      ],
    },
    select: { id: true },
  });
  const accessibleParentIds = new Set(
    accessibleParents.map((parent) => parent.id),
  );
  return tasks.map((task) =>
    task.parentTask && !accessibleParentIds.has(task.parentTask.id)
      ? { ...task, parentTask: null }
      : task,
  );
}

export async function getTasksPageData(
  userId?: string | null,
  options?: {
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const publicTaskSelect = taskListSelectForViewer({});
  const [viewer, topLevelTasks, allTasks] = await Promise.all([
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
        ...publicTaskSelect,
        childTasks: {
          where: { deletedAt: null, isPublic: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: publicTaskSelect,
        },
      },
      take: 10,
    }),
    prisma.task.findMany({
      where: getTaskVisibilityWhere(),
      orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: publicTaskSelect,
    }),
  ]);

  const assignedToMeUnscoped = viewer?.personId
    ? await prisma.task.findMany({
        where: {
          deletedAt: null,
          assigneePersonId: viewer.personId,
          status: { not: TaskStatus.VERIFIED },
        },
        orderBy: [
          { dueAt: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        take: 25,
        select: taskListSelectForViewer({
          personId: viewer.personId,
          userId: viewer.id,
        }),
      })
    : [];
  const viewerScope = {
    personId: viewer?.personId ?? null,
    userId: viewer?.id ?? null,
  };
  const [allTasksScoped, topLevelTasksScoped, assignedToMeRaw] =
    await Promise.all([
      nullInaccessibleParentTasks(allTasks, viewerScope),
      nullInaccessibleParentTasks(topLevelTasks, viewerScope),
      nullInaccessibleParentTasks(assignedToMeUnscoped, viewerScope),
    ]);

  const decoratedTasks = allTasksScoped.map((task) =>
    decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
  );
  const allTasksSorted = sortTasksForAccountability(decoratedTasks);

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

  const topLevelTaskIds = new Set(topLevelTasksScoped.map((t) => t.id));
  const topLevelChildIds = new Set(
    topLevelTasksScoped.flatMap((t) => t.childTasks.map((c) => c.id)),
  );

  const decoratedTopLevel = topLevelTasksScoped.map((task) => ({
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

  const assignedToMe = assignedToMeRaw.map((task) =>
    decorateTask(task, {
      frameKey: options?.frameKey,
      userId: viewer?.id ?? null,
    }),
  );

  return {
    allTasks: filteredAllTasks,
    assignedToMe,
    forYou,
    topLevelTasks: decoratedTopLevel,
    viewer,
  };
}

export async function getTaskDetailData(
  taskId: string | null | undefined,
  userId?: string | null,
  options?: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    frameKey?: TaskImpactFrameKey | string | null;
  },
) {
  const normalizedTaskId = typeof taskId === "string" ? taskId.trim() : "";
  if (!normalizedTaskId) {
    return null;
  }

  // Sequence the viewer fetch before the task fetch so we can include the
  // viewer's personId in the visibility filter — otherwise a private task
  // assigned to the viewer (but created by a different user / by the
  // system) is invisible on /tasks/[id].
  const viewer = userId ? await getTaskViewer(userId) : null;

  const viewerTaskAccess = getTaskAccessWhere({
    action: "READ",
    personId: viewer?.personId ?? null,
    userId,
  });
  const taskAccess = options?.clientAccessBoundary
    ? {
        AND: [
          viewerTaskAccess,
          getTaskClientAccessWhere(options.clientAccessBoundary),
        ],
      }
    : viewerTaskAccess;
  const task = await prisma.task.findFirst({
    where: options?.clientAccessBoundary
      ? {
          AND: [
            getTaskVisibilityWhere({
              taskId: normalizedTaskId,
              userId,
              personId: viewer?.personId ?? null,
              visibility: "accessible",
            }),
            getTaskClientAccessWhere(options.clientAccessBoundary),
          ],
        }
      : getTaskVisibilityWhere({
          taskId: normalizedTaskId,
          userId,
          personId: viewer?.personId ?? null,
          visibility: "accessible",
        }),
    select: taskDetailSelectForViewer({
      clientAccessBoundary: options?.clientAccessBoundary,
      personId: viewer?.personId ?? null,
      userId,
    }),
  });

  if (!task) {
    return null;
  }

  const [taskCommunicationCount, canSeeInternal, visibleParent] =
    await Promise.all([
      countTaskCommunications(normalizedTaskId),
      canUserViewInternalTaskContent(normalizedTaskId, userId),
      task.parentTask
        ? prisma.task.findFirst({
            where: {
              deletedAt: null,
              id: task.parentTask.id,
              ...taskAccess,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

  const viewerClaim =
    userId == null
      ? null
      : await prisma.taskClaim.findUnique({
          where: {
            taskId_userId: {
              taskId: normalizedTaskId,
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
    taskCommunicationCount,
    task: decorateTask(
      {
        ...task,
        parentTask: visibleParent ? task.parentTask : null,
        referralInvitations: canSeeInternal ? task.referralInvitations : [],
      },
      {
        frameKey: options?.frameKey,
        userId: viewer?.id ?? null,
      },
    ),
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
  userId?: string | null,
): Promise<Array<{ id: string; title: string }>> {
  const viewer = userId ? await getTaskViewer(userId) : null;
  const taskAccess = getTaskAccessWhere({
    action: "READ",
    personId: viewer?.personId ?? null,
    userId,
  });
  const seen = new Set<string>([taskId]);
  const ancestors: Array<{ id: string; title: string }> = [];
  let currentId: string | null = taskId;

  for (let depth = 0; depth < 16; depth += 1) {
    const current: { parentTaskId: string | null } | null =
      await prisma.task.findFirst({
        where: { deletedAt: null, id: currentId, ...taskAccess },
        select: { parentTaskId: true },
      });
    if (!current?.parentTaskId || seen.has(current.parentTaskId)) {
      break;
    }
    const parent: { id: string; title: string } | null =
      await prisma.task.findFirst({
        where: {
          deletedAt: null,
          id: current.parentTaskId,
          ...taskAccess,
        },
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
  category?: TaskCategory | null;
  clientAccessBoundary?: TaskClientAccessBoundary;
  frameKey?: TaskImpactFrameKey | string | null;
  limit?: number | null;
  parentTaskId?: string | null;
  personId?: string | null;
  status?: TaskStatus | null;
  targetOrganizationId?: string | null;
  userId?: string | null;
  visibility?:
    | "public"
    | "created"
    | "accessible"
    | "personal"
    | "target"
    | "private";
}) {
  const visibilityWhere = getTaskVisibilityWhere({
    assigneeOrganizationId: options?.assigneeOrganizationId,
    assigneePersonId: options?.assigneePersonId,
    personId: options?.personId,
    status: options?.status,
    targetOrganizationId: options?.targetOrganizationId,
    userId: options?.userId,
    visibility: options?.visibility,
  });
  // parentTaskId must filter in the query itself — post-filtering a limited
  // page silently returns [] for parents whose children fall outside it.
  const where: Prisma.TaskWhereInput = options?.clientAccessBoundary
    ? {
        AND: [
          visibilityWhere,
          getTaskClientAccessWhere(options.clientAccessBoundary),
        ],
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.parentTaskId
          ? { parentTaskId: options.parentTaskId }
          : {}),
      }
    : {
        ...visibilityWhere,
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.parentTaskId
          ? { parentTaskId: options.parentTaskId }
          : {}),
      };
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    select: taskListSelectForViewer({
      clientAccessBoundary: options?.clientAccessBoundary,
      personId: options?.personId,
      userId: options?.userId,
    }),
    ...(options?.limit == null ? {} : { take: options.limit }),
  });
  const scopedTasks = await nullInaccessibleParentTasks(tasks, {
    clientAccessBoundary: options?.clientAccessBoundary,
    personId: options?.personId,
    userId: options?.userId,
  });

  return sortTasksForAccountability(
    scopedTasks.map((task) =>
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
    clientAccessBoundary?: TaskClientAccessBoundary;
    limit?: number | null;
    userId?: string | null;
    status?: "DRAFT" | "ACTIVE" | "VERIFIED" | "STALE" | null;
    visibility?: "public" | "accessible" | "private";
  },
): Promise<TaskSearchResult[]> {
  const searchTerms = getSearchTerms(query);
  const limit = Math.max(options?.limit ?? 12, 1);

  if (!searchTerms.normalizedQuery) {
    return [];
  }

  const queryTerms =
    searchTerms.terms.length > 0
      ? searchTerms.terms
      : [searchTerms.normalizedQuery];
  const taskSearchIntentTerms = new Set([
    "create",
    "find",
    "parent",
    "search",
    "task",
    "tasks",
  ]);
  const distinctiveTerms = queryTerms.filter(
    (term) => !taskSearchIntentTerms.has(term),
  );
  const candidateTerms = (
    distinctiveTerms.length > 0 ? distinctiveTerms : queryTerms
  ).slice(0, 8);

  // Prisma cannot order substring matches by relevance. Pull any literal
  // match into a bounded candidate set, then rank it in memory. Requiring
  // every word here made natural-language agent queries fail whenever they
  // included one reasonable synonym that was not copied into the task.
  const candidateLimit = Math.min(Math.max(limit * 4, 64), 500);
  const perTermLimit = Math.max(
    limit,
    Math.floor(candidateLimit / candidateTerms.length),
  );
  const matchesTerm = (term: string): Prisma.TaskWhereInput => ({
    OR: [
      { title: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
      { impactStatement: { contains: term, mode: "insensitive" as const } },
      { taskKey: { contains: term, mode: "insensitive" as const } },
      { roleTitle: { contains: term, mode: "insensitive" as const } },
      {
        assigneeOrganization: {
          is: {
            name: { contains: term, mode: "insensitive" as const },
          },
        },
      },
      {
        assigneePerson: {
          is: {
            displayName: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        assigneePerson: {
          is: {
            currentAffiliation: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
        },
      },
    ],
  });

  const viewer = options?.userId
    ? await prisma.user.findUnique({
        where: { id: options.userId },
        select: { personId: true },
      })
    : null;

  const accessFilters: Prisma.TaskWhereInput[] = [
    getTaskVisibilityWhere({
      personId: viewer?.personId,
      userId: options?.userId,
      visibility:
        options?.visibility ?? (options?.userId ? "accessible" : "public"),
    }),
    ...(options?.clientAccessBoundary
      ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
      : []),
    ...(options?.status ? [{ status: options.status }] : []),
  ];
  const exactTaskKeyPromise = searchTerms.normalizedQuery.includes(":")
    ? prisma.task.findFirst({
        where: {
          AND: [...accessFilters, { taskKey: searchTerms.normalizedQuery }],
        },
        select: taskSearchSelect,
      })
    : Promise.resolve(null);
  const [exactTaskKeyMatch, candidateGroups] = await Promise.all([
    exactTaskKeyPromise,
    Promise.all(
      candidateTerms.map((term) =>
        prisma.task.findMany({
          where: {
            AND: [...accessFilters, matchesTerm(term)],
          },
          orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
          select: taskSearchSelect,
          take: perTermLimit,
        }),
      ),
    ),
  ]);
  const candidates = Array.from(
    new Map(candidateGroups.flat().map((task) => [task.id, task])).values(),
  );
  let tasks = exactTaskKeyMatch
    ? [
        exactTaskKeyMatch,
        ...candidates.filter((task) => task.id !== exactTaskKeyMatch.id),
      ]
    : candidates;

  // A bounded accessible fallback makes misspellings discoverable even when
  // no token can pass Prisma's literal `contains` filter. It is only used
  // when literal matching did not fill the requested result window.
  if (tasks.length < limit) {
    const fuzzyCandidates = await prisma.task.findMany({
      where: { AND: accessFilters },
      orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
      select: taskSearchSelect,
      take: 500,
    });
    const taskIds = new Set(tasks.map((task) => task.id));
    tasks = [
      ...tasks,
      ...fuzzyCandidates.filter((task) => !taskIds.has(task.id)),
    ];
  }

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
    select: personTaskProfilePersonSelect,
  });
  if (!person) {
    person = await prisma.person.findFirst({
      where: { deletedAt: null, id: handleOrId },
      select: personTaskProfilePersonSelect,
    });
  }
  if (!person) {
    return null;
  }

  const isViewerOwner = Boolean(userId && person.user?.id === userId);
  if (!person.isPublic && !isViewerOwner) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: person.user
      ? {
          OR: [
            { assigneePersonId: person.id },
            { createdByUserId: person.user.id },
          ],
          deletedAt: null,
          isPublic: true,
        }
      : {
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
  const assignedToPersonTasks = decoratedTasks.filter(
    (task) => task.assigneePerson?.id === person.id,
  );
  const createdByPersonTasks = person.user
    ? decoratedTasks.filter((task) => task.createdByUserId === person.user?.id)
    : [];
  const requestedTasks = createdByPersonTasks.filter(
    (task) => !task.assigneePerson && !task.assigneeOrganization,
  );
  const assignedByPersonTasks = createdByPersonTasks.filter(
    (task) =>
      (task.assigneePerson && task.assigneePerson.id !== person.id) ||
      task.assigneeOrganization,
  );

  return {
    assignedByOpenTasks: assignedByPersonTasks.filter(
      (task) => task.status !== TaskStatus.VERIFIED,
    ),
    assignedByVerifiedTasks: assignedByPersonTasks.filter(
      (task) => task.status === TaskStatus.VERIFIED,
    ),
    completedTasks: decoratedTasks.filter(
      (task) => task.status === TaskStatus.VERIFIED,
    ),
    openTasks: assignedToPersonTasks.filter(
      (task) => task.status !== TaskStatus.VERIFIED,
    ),
    person,
    requestedOpenTasks: requestedTasks.filter(
      (task) => task.status !== TaskStatus.VERIFIED,
    ),
    requestedVerifiedTasks: requestedTasks.filter(
      (task) => task.status === TaskStatus.VERIFIED,
    ),
    tasks: decoratedTasks,
    verifiedTasks: assignedToPersonTasks.filter(
      (task) => task.status === TaskStatus.VERIFIED,
    ),
  };
}

// Resolve the private planning branch a parentless private task belongs under.
// Prefers the assigned org's branch, but only when the creator may plan for it
// (ensureExecutionPlanningBranch enforces membership); a non-member creator, or
// an unseeded Optimize Earth root, falls back to the creator's personal branch.
async function resolveDefaultPrivateParent(
  creatorUserId: string,
  assigneeOrganizationId: string | null,
): Promise<{ id: string }> {
  if (assigneeOrganizationId) {
    try {
      return await ensureExecutionPlanningBranch({
        organizationId: assigneeOrganizationId,
        prisma,
        userId: creatorUserId,
      });
    } catch (error) {
      // Only a genuine access denial falls back to the personal branch — a
      // creator assigning to an org they cannot plan for. Everything else
      // (missing seed root, Prisma/infra errors) propagates so a transient
      // failure never silently mis-parents the task.
      if (!(error instanceof OrganizationPlanningAccessError)) throw error;
      log.warn(
        "Falling back to personal planning branch for org-assigned task",
        { assigneeOrganizationId, creatorUserId },
      );
    }
  }
  return ensureExecutionPlanningBranch({ prisma, userId: creatorUserId });
}

export async function createTask(
  creatorUserId: string,
  input: {
    assigneeOrganizationId?: string | null;
    assigneePersonId?: string | null;
    category?: TaskCategory | null;
    claimPolicy?: TaskClaimPolicy | null;
    description?: string | null;
    dueAt?: Date | null;
    estimatedEffortHours?: number | null;
    interestTags?: string[] | null;
    isPublic?: boolean | null;
    maxClaims?: number | null;
    parentTaskId?: string | null;
    primaryEndpoint?: PrimaryTaskCommunicationEndpointInput | null;
    roleTitle?: string | null;
    skillTags?: string[] | null;
    status?: TaskStatus | null;
    title: string;
  },
  options?: {
    ownerAuthorization?: OwnerSendAuthorization | null;
  },
) {
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";
  const assigneeOrganizationId = input.assigneeOrganizationId?.trim() || null;
  const assigneePersonId = input.assigneePersonId?.trim() || null;
  const isAssignedTask = Boolean(assigneeOrganizationId || assigneePersonId);
  const claimSettings = resolveTaskClaimSettings({
    assigneeOrganizationId,
    assigneePersonId,
    requestedClaimPolicy: input.claimPolicy,
    requestedMaxClaims: input.maxClaims,
  });
  const resolvedClaimPolicy = claimSettings.claimPolicy;
  const requestedIsPublic =
    input.isPublic ??
    (resolvedClaimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY || isAssignedTask);
  // An explicit parent makes this a subtask (always private); otherwise honor
  // the requested visibility — public "ask for help" and invited-assignee
  // tasks must stay publicly visible and claimable.
  const isPublic = input.parentTaskId ? false : requestedIsPublic;
  const endpointData = input.primaryEndpoint
    ? buildPrimaryTaskCommunicationEndpointCreateData(input.primaryEndpoint)
    : null;

  if (!title) {
    throw new Error("Title is required.");
  }
  if (input.status === TaskStatus.VERIFIED) {
    throw new Error("Task verification must use the verification flow.");
  }
  if (isPublic && assigneeOrganizationId) {
    await assertOrganizationCanBePubliclyReferenced(assigneeOrganizationId);
  }

  // Parent resolution (OPT-TASK-06): an explicit parent wins. A private
  // parentless task lands in the owner's private planning branch — the org's
  // when it's org-assigned and the creator can plan for that org, otherwise
  // the creator's personal branch — so private work never pollutes the public
  // Optimize Earth root. Public parentless tasks still root there until the
  // ranked parent-suggestion matcher ships (the deferred half of OPT-TASK-06);
  // there is no public per-person branch to hold them yet.
  const parentTaskId =
    input.parentTaskId ??
    (isPublic
      ? OPTIMIZE_EARTH_ROOT_TASK_ID
      : (
          await resolveDefaultPrivateParent(
            creatorUserId,
            assigneeOrganizationId,
          )
        ).id);

  const task = await prisma.task.create({
    data: {
      assigneeOrganizationId,
      assigneePersonId,
      category: input.category ?? TaskCategory.OTHER,
      claimPolicy: resolvedClaimPolicy,
      ...(endpointData
        ? {
            communicationEndpoints: {
              create: endpointData,
            },
          }
        : {}),
      description,
      dueAt: input.dueAt ?? null,
      estimatedEffortHours: input.estimatedEffortHours ?? null,
      interestTags: input.interestTags?.filter(Boolean) ?? [],
      isPublic,
      maxClaims: claimSettings.maxClaims,
      parentTaskId,
      createdByUserId: creatorUserId,
      roleTitle: input.roleTitle?.trim() || null,
      skillTags: input.skillTags?.filter(Boolean) ?? [],
      status: input.status ?? TaskStatus.ACTIVE,
      title,
    },
    select: taskDetailSelect,
  });

  if (isAssignedTask) {
    try {
      await notifyTaskAssigneeOfAssignment({
        ...(options?.ownerAuthorization
          ? { ownerAuthorization: options.ownerAuthorization }
          : {}),
        senderUserId: creatorUserId,
        taskId: task.id,
      });
    } catch (error) {
      log.error("Failed to notify task assignee after task creation", {
        error,
        taskId: task.id,
      });
    }
  }

  return task;
}

export async function updateTaskCreatedByUser(
  taskId: string,
  creatorUserId: string,
  input: {
    category?: TaskCategory | null;
    claimPolicy?: TaskClaimPolicy | null;
    description?: string | null;
    dueAt?: Date | null;
    estimatedEffortHours?: number | null;
    interestTags?: string[] | null;
    isPublic?: boolean | null;
    maxClaims?: number | null;
    primaryEndpoint?: PrimaryTaskCommunicationEndpointInput | null;
    roleTitle?: string | null;
    skillTags?: string[] | null;
    status?: TaskStatus | null;
    title?: string | null;
  },
  options?: { clientAccessBoundary?: TaskClientAccessBoundary },
) {
  if (input.status === TaskStatus.VERIFIED) {
    throw new Error("Task verification must use the verification flow.");
  }
  const actor = await prisma.user.findUnique({
    where: { id: creatorUserId },
    select: { personId: true },
  });
  if (!actor) throw new Error("Task not found.");
  const existingTask = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: taskId,
      AND: [
        getTaskAccessWhere({
          action: "MANAGE",
          personId: actor.personId,
          userId: creatorUserId,
        }),
        // Delegated clients only reach tasks inside their grant boundary,
        // matching the MCP updateTask handler.
        ...(options?.clientAccessBoundary
          ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
          : []),
      ],
    },
    select: {
      assigneeOrganizationId: true,
      assigneePersonId: true,
      claimPolicy: true,
      id: true,
      isPublic: true,
      maxClaims: true,
    },
  });

  if (!existingTask) {
    throw new Error("Task not found.");
  }

  if (existingTask.isPublic && input.isPublic === false) {
    throw new Error("Public tasks can't be unpublished. Ask an admin.");
  }

  const shouldUpdateClaimSettings =
    input.claimPolicy !== undefined || input.maxClaims !== undefined;
  const claimSettings = resolveTaskClaimSettings({
    assigneeOrganizationId: existingTask.assigneeOrganizationId,
    assigneePersonId: existingTask.assigneePersonId,
    currentClaimPolicy: existingTask.claimPolicy,
    currentMaxClaims: existingTask.maxClaims,
    requestedClaimPolicy: input.claimPolicy,
    requestedMaxClaims: input.maxClaims,
  });

  const title = input.title == null ? undefined : input.title.trim();
  if (title !== undefined && !title) {
    throw new Error("Title is required.");
  }

  const shouldUpdateEndpoint = input.primaryEndpoint !== undefined;

  return prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        category: input.category ?? undefined,
        claimPolicy: shouldUpdateClaimSettings
          ? claimSettings.claimPolicy
          : undefined,
        description:
          input.description == null ? undefined : input.description.trim(),
        dueAt: input.dueAt ?? undefined,
        estimatedEffortHours: input.estimatedEffortHours ?? undefined,
        interestTags: input.interestTags?.filter(Boolean) ?? undefined,
        isPublic: input.isPublic ?? undefined,
        maxClaims: shouldUpdateClaimSettings
          ? claimSettings.maxClaims
          : undefined,
        roleTitle:
          input.roleTitle == null ? undefined : input.roleTitle.trim() || null,
        skillTags: input.skillTags?.filter(Boolean) ?? undefined,
        status: input.status ?? undefined,
        title,
      },
    });

    if (shouldUpdateEndpoint) {
      await upsertPrimaryTaskCommunicationEndpoint(
        tx,
        taskId,
        input.primaryEndpoint ?? {},
      );
    }

    return tx.task.findUniqueOrThrow({
      where: { id: taskId },
      select: taskDetailSelectForViewer({
        personId: actor.personId,
        userId: creatorUserId,
      }),
    });
  });
}

// Soft-delete a task the user created. Mirrors the MCP deleteTask handler:
// creator-scoped, refuses public tasks (those need admin), sets deletedAt.
export async function deleteTaskCreatedByUser(
  taskId: string,
  creatorUserId: string,
  options?: { clientAccessBoundary?: TaskClientAccessBoundary },
) {
  const actor = await prisma.user.findUnique({
    where: { id: creatorUserId },
    select: { personId: true },
  });
  if (!actor) throw new Error("Task not found.");
  const existing = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: taskId,
      AND: [
        getTaskAccessWhere({
          action: "MANAGE",
          personId: actor.personId,
          userId: creatorUserId,
        }),
        ...(options?.clientAccessBoundary
          ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
          : []),
      ],
    },
    select: { id: true, isPublic: true },
  });

  if (!existing) {
    throw new Error("Task not found.");
  }

  if (existing.isPublic) {
    throw new Error("Public tasks can't be self-deleted. Ask an admin.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });

  return { id: taskId, deleted: true };
}

const SIMPLE_SELF_COMPLETION_ERROR =
  "completeTask only works for a private, owner-created, uncompensated Self task that is unassigned or assigned only to you. If a one-person task was incorrectly stored as OPEN_MANY and has no formal history, update its claimPolicy to OPEN_SINGLE first. Use startTaskExecution, submitTaskArtifact, and submitTaskForVerification for genuine OPEN_MANY, delegated, shared, paid, public, organization, or agent work.";

function isSelfExecutorContext(contextJson: unknown) {
  if (contextJson == null) return true;
  if (typeof contextJson !== "object" || Array.isArray(contextJson)) {
    return false;
  }
  const context = contextJson as Record<string, unknown>;
  const executorType = context.executor_type ?? context.executorType;
  if (executorType == null) return true;
  return (
    typeof executorType === "string" &&
    ["", "self"].includes(executorType.trim().toLowerCase())
  );
}

async function lockTaskForUpdate(tx: Prisma.TransactionClient, taskId: string) {
  await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Task"
    WHERE "id" = ${taskId}
    FOR UPDATE
  `;
}

/**
 * Self-attest one small personal task in a single call. This deliberately does
 * not replace the artifact + independent-verification path for consequential
 * work. The narrow eligibility checks keep this equivalent to the owner
 * clicking "done" on a private personal reminder.
 */
export async function completeSelfTask(
  taskId: string,
  userId: string,
  completionEvidence: string,
) {
  const evidence = completionEvidence.trim();
  if (!evidence) throw new Error("Completion evidence is required.");

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { personId: true },
  });
  if (!actor) throw new Error("Task not found");

  return prisma.$transaction(async (tx) => {
    const taskAccess = getTaskAccessWhere({
      action: "VERIFY",
      personId: actor.personId,
      userId,
    });
    const accessibleTask = await tx.task.findFirst({
      where: { deletedAt: null, id: taskId, ...taskAccess },
      select: { id: true },
    });
    if (!accessibleTask) throw new Error("Task not found");

    await lockTaskForUpdate(tx, taskId);
    const checkedAt = new Date();

    const task = await tx.task.findFirst({
      where: {
        deletedAt: null,
        id: taskId,
        ...taskAccess,
      },
      select: {
        agentLeases: {
          where: { expiresAt: { gte: checkedAt }, released: false },
          select: { id: true },
          take: 1,
        },
        applicationPolicy: true,
        applications: {
          select: { id: true },
          take: 1,
        },
        assigneeOrganizationId: true,
        assigneePersonId: true,
        childTasks: {
          select: { id: true },
          take: 1,
        },
        claimPolicy: true,
        claims: {
          select: { id: true },
          take: 1,
        },
        compensationCadence: true,
        compensationCurrency: true,
        compensationKind: true,
        compensationMaxAmountMinorUnits: true,
        compensationMinAmountMinorUnits: true,
        compensationPaymentRails: true,
        completedAt: true,
        completionEvidence: true,
        contextJson: true,
        createdByUserId: true,
        executionAttempts: {
          select: { id: true },
          take: 1,
        },
        executionMode: true,
        id: true,
        incomingEdges: {
          where: {
            deletedAt: null,
            edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
            fromTask: {
              deletedAt: null,
              status: { not: TaskStatus.VERIFIED },
            },
          },
          select: { id: true },
          take: 1,
        },
        isPublic: true,
        managers: {
          select: { id: true },
          take: 1,
        },
        ownerOrganizationId: true,
        payouts: {
          select: { id: true },
          take: 1,
        },
        status: true,
        taskKey: true,
        verifiedAt: true,
        verifiedByUserId: true,
      },
    });
    if (!task) throw new Error("Task not found");

    const eligible =
      !task.isPublic &&
      task.ownerOrganizationId === null &&
      task.createdByUserId === userId &&
      task.assigneeOrganizationId === null &&
      (task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE ||
        task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY) &&
      (task.assigneePersonId === null ||
        (actor.personId !== null &&
          task.assigneePersonId === actor.personId)) &&
      task.applicationPolicy === TaskApplicationPolicy.CLOSED &&
      (task.compensationKind === TaskCompensationKind.UNSPECIFIED ||
        task.compensationKind === TaskCompensationKind.VOLUNTEER) &&
      task.compensationCadence === null &&
      task.compensationCurrency === null &&
      task.compensationMinAmountMinorUnits === null &&
      task.compensationMaxAmountMinorUnits === null &&
      task.compensationPaymentRails.length === 0 &&
      task.executionMode !== TaskExecutionMode.AGENT_ONLY &&
      isSelfExecutorContext(task.contextJson);
    if (!eligible) throw new Error(SIMPLE_SELF_COMPLETION_ERROR);

    if (task.status === TaskStatus.VERIFIED) {
      return {
        alreadyCompleted: true,
        task: {
          completedAt: task.completedAt,
          completionEvidence: task.completionEvidence,
          id: task.id,
          status: task.status,
          verifiedAt: task.verifiedAt,
          verifiedByUserId: task.verifiedByUserId,
        },
      };
    }
    if (task.status !== TaskStatus.ACTIVE) {
      throw new Error("Only active Self tasks can be completed.");
    }
    if (isReservedPlanningRootTask(task) || task.childTasks.length > 0) {
      throw new Error(
        "Task is a container. Use the formal execution and verification workflow.",
      );
    }
    if (task.incomingEdges.length > 0) {
      throw new Error("Task is blocked by an unverified dependency.");
    }
    if (
      task.agentLeases.length > 0 ||
      task.applications.length > 0 ||
      task.claims.length > 0 ||
      task.executionAttempts.length > 0 ||
      task.managers.length > 0 ||
      task.payouts.length > 0
    ) {
      throw new Error(
        "Task already has shared or formal work state or history. Finish that workflow instead.",
      );
    }

    const completedAt = checkedAt;
    const updated = await tx.task.updateMany({
      where: {
        childTasks: { none: {} },
        id: task.id,
        status: TaskStatus.ACTIVE,
      },
      data: {
        completedAt,
        completionEvidence: evidence,
        status: TaskStatus.VERIFIED,
        verifiedAt: completedAt,
        verifiedByUserId: userId,
      },
    });
    if (updated.count !== 1) {
      throw new Error("Task is no longer active.");
    }

    const completedTask = await tx.task.findUniqueOrThrow({
      where: { id: task.id },
      select: {
        completedAt: true,
        completionEvidence: true,
        id: true,
        status: true,
        verifiedAt: true,
        verifiedByUserId: true,
      },
    });

    return {
      alreadyCompleted: false,
      task: completedTask,
    };
  });
}

export async function claimTask(taskId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: userId },
      select: { personId: true },
    });
    if (!actor) throw new Error("Task not found");
    const taskAccess = getTaskAccessWhere({
      action: "COMMENT",
      personId: actor.personId,
      userId,
    });
    const accessibleTask = await tx.task.findFirst({
      where: { deletedAt: null, id: taskId, ...taskAccess },
      select: { id: true },
    });
    if (!accessibleTask) throw new Error("Task not found");

    await lockTaskForUpdate(tx, taskId);
    const task = await tx.task.findFirst({
      where: {
        deletedAt: null,
        id: taskId,
        ...taskAccess,
      },
      select: {
        claimPolicy: true,
        compensationCadence: true,
        compensationCurrency: true,
        compensationKind: true,
        compensationMaxAmountMinorUnits: true,
        compensationPaymentRails: true,
        id: true,
        maxClaims: true,
        status: true,
      },
    });
    if (!task) throw new Error("Task not found");

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

    if (task.status !== TaskStatus.ACTIVE) {
      throw new Error("Task is not active.");
    }

    if (task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY) {
      throw new Error("This task is assigned directly and cannot be claimed.");
    }

    await assertUserCanClaimPaidTask(task, userId, tx);

    const activeClaimCount = await tx.taskClaim.count({
      where: {
        deletedAt: null,
        status: {
          in: [...ACTIVE_CLAIM_STATUSES],
        },
        taskId,
      },
    });

    if (
      task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE &&
      activeClaimCount > 0
    ) {
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

  const claim = await prisma.taskClaim.findUnique({
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

  if (!claim) {
    throw new Error("No claim exists for this task and user.");
  }

  if (
    claim.status === TaskClaimStatus.COMPLETED ||
    claim.status === TaskClaimStatus.VERIFIED
  ) {
    return claim;
  }

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
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { id: true, isAdmin: true, personId: true },
  });
  if (!reviewer) throw new Error("Task not found");

  const result = await prisma.$transaction(async (tx) => {
    const privateTaskAccess = getTaskAccessWhere({
      action: "VERIFY",
      personId: reviewer.personId,
      userId: reviewerUserId,
    });
    const task = await tx.task.findFirst({
      where: {
        deletedAt: null,
        id: taskId,
        OR: [
          { isPublic: false, ...privateTaskAccess },
          ...(reviewer.isAdmin ? [{ isPublic: true }] : []),
        ],
      },
      select: {
        claimPolicy: true,
        id: true,
        status: true,
      },
    });
    if (!task) throw new Error("Task not found");

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
        throw new Error(
          "Claim completion evidence is required before verification.",
        );
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

      if (verifiedClaimClosesTask(task.claimPolicy)) {
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
        claimId: claim.id,
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
      claimId: null,
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

  if (result.claimId) {
    try {
      await queueTaskPayoutForVerifiedClaim({
        approvedByUserId: reviewerUserId,
        claimId: result.claimId,
        taskId,
      });
    } catch (error) {
      log.error("Failed to queue task payout after claim verification", {
        claimId: result.claimId,
        error,
        taskId,
      });
    }
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
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { id: true, isAdmin: true, personId: true },
  });
  if (!reviewer) throw new Error("Task not found");
  const privateTaskAccess = getTaskAccessWhere({
    action: "MANAGE",
    personId: reviewer.personId,
    userId: reviewerUserId,
  });
  const task = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: taskId,
      OR: [
        { isPublic: false, ...privateTaskAccess },
        ...(reviewer.isAdmin ? [{ isPublic: true }] : []),
      ],
    },
    select: { id: true, isPublic: true },
  });
  if (!task) throw new Error("Task not found");

  const assigneeOrganization = input.organizationId?.trim()
    ? await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId.trim() },
      })
    : input.organizationName?.trim()
      ? await upsertTrustedOrganization({
          name: input.organizationName.trim(),
          type: input.organizationType ?? undefined,
        })
      : null;

  if (task.isPublic && assigneeOrganization) {
    await assertOrganizationCanBePubliclyReferenced(assigneeOrganization.id);
  }

  const shouldResolvePerson =
    Boolean(input.personId?.trim()) ||
    Boolean(input.displayName?.trim()) ||
    Boolean(input.email?.trim());

  const assigneePerson = !shouldResolvePerson
    ? null
    : input.personId?.trim()
      ? await prisma.person.findUniqueOrThrow({
          where: { id: input.personId.trim() },
        })
      : await findOrCreatePerson({
          currentAffiliation:
            input.currentAffiliation ?? assigneeOrganization?.name ?? null,
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
