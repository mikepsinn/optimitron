import type { Prisma } from "@optimitron/db";
import {
  AgentExecutorStatus,
  TaskCandidateMatchStatus,
  TaskExecutionAttemptStatus,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db/enums";
import {
  assessTaskCapability,
  type TaskCapabilityAssessment,
  type TaskExecutorCapabilities,
} from "@optimitron/agent/task-capability";
import { isExecutableWorkItem } from "./execution-eligibility";
import {
  buildExecutionPlan,
  compareExecutionTasks,
  type ExecutionPlanningTask,
  type PlanningBlocker,
  type PlanningCommitment,
} from "./execution-planner";
import {
  getRootedTaskIds,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  type ExecutionGraphTask,
} from "./execution-planner-audit";
import {
  getTaskClientAccessWhere,
  type TaskClientAccessBoundary,
} from "./task-visibility.server";
import type {
  RankableTask,
  TaskPriorityInput,
  TaskPriorityResult,
} from "./rank-tasks";

export const DEFAULT_PERSONAL_BUYBACK_RATE = 1000;

const AI_EXECUTOR_TYPE = "AI Agent";
const MS_PER_HOUR = 60 * 60 * 1000;

type DeadlinePolicy = "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";
type DeadlineStatus =
  | "none"
  | "future"
  | "start_now"
  | "overdue"
  | "missed"
  | "expired";

export type SummarizableTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  category?: string | null;
  taskKey?: string | null;
  dueAt?: Date | string | null;
  isPublic?: boolean | null;
  parentTaskId?: string | null;
  impactStatement?: string | null;
  primaryEndpoint?: {
    email?: string | null;
    instructions?: string | null;
    kind?: string | null;
    label?: string | null;
    url?: string | null;
  } | null;
  claimPolicy?: string | null;
  applicationPolicy?: string | null;
  compensationCadence?: string | null;
  compensationCurrency?: string | null;
  compensationKind?: string | null;
  compensationMaxAmountMinorUnits?: bigint | number | string | null;
  compensationMinAmountMinorUnits?: bigint | number | string | null;
  compensationPaymentRails?: string[] | null;
  engagementKind?: string | null;
  estimatedHoursPerWeekMax?: number | null;
  estimatedHoursPerWeekMin?: number | null;
  executionMode?: string | null;
  locationText?: string | null;
  ownerOrganizationId?: string | null;
  preferredSkillTags?: string[] | null;
  remotePolicy?: string | null;
  requiredAccessTags?: string[] | null;
  requiredCredentialTags?: string[] | null;
  requiredLanguageTags?: string[] | null;
  requiredToolTags?: string[] | null;
  skillTags?: string[] | null;
  interestTags?: string[] | null;
  estimatedEffortHours?: number | null;
  workLocationCity?: string | null;
  workLocationCountryCode?: string | null;
  workLocationRegionCode?: string | null;
  assigneePerson?: { displayName?: string | null } | null;
  assigneeOrganization?: { name?: string | null } | null;
  blockerStatuses?: string[] | null;
  childTasks?: unknown[] | null;
  _count?: { childTasks?: number | null } | null;
};

type EffortEstimateSource =
  | "target-actual-history"
  | "candidate-estimate"
  | "task-estimate"
  | "impact-frame"
  | "missing";

export type PersonalQueueTaskRecord = Record<string, unknown> &
  SummarizableTask & {
    assigneeOrganizationId?: string | null;
    assigneePersonId?: string | null;
    createdByUserId?: string | null;
    availableAt?: Date | string | null;
    deadlinePolicy?: DeadlinePolicy | string | null;
    contextJson?: unknown;
    directImpactFrame?: unknown;
    marginalImpactFrame?: unknown;
    selectedImpactFrame?: unknown;
    blockerStatuses?: TaskStatus[] | null;
    activeChildTaskCount?: number | null;
    activeExecutionAttemptCount?: number | null;
    candidateMatches?: Array<{
      agentExecutorId?: string | null;
      candidateOrganizationId?: string | null;
      candidatePersonId?: string | null;
      candidateUserId?: string | null;
      estimatedDurationSeconds?: number | null;
      status?: string | null;
      updatedAt?: Date | string | null;
    }> | null;
    claims?: Array<{
      actualEffortSeconds?: number | null;
      userId?: string | null;
    }> | null;
    executionAttempts?: Array<{
      actualDurationSeconds?: number | null;
      agentExecutorId?: string | null;
      completedAt?: Date | string | null;
      executorOrganizationId?: string | null;
      executorPersonId?: string | null;
      executorUserId?: string | null;
      status?: string | null;
      updatedAt?: Date | string | null;
    }> | null;
    incomingEdges?: Array<{
      fromTask?: {
        id?: string | null;
        status?: TaskStatus | string | null;
      } | null;
    }> | null;
    impact?: {
      currentSet?: {
        parameterInputsStale?: boolean;
        publicationStatus?: string | null;
      } | null;
    } | null;
  };

export type PersonalQueueRow = ReturnType<typeof summarizeTask> & {
  activeChildTaskCount: number;
  activeExecutionAttemptCount: number;
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  blockers: PlanningBlocker[];
  blockersCount: number;
  blockersResolved: number;
  blockersResolvedPercent: number;
  capabilityReasons: string[];
  capabilityStatus: TaskCapabilityAssessment["status"];
  evMath: string;
  availableAt: string | null;
  cashCost: number;
  deadlinePolicy: DeadlinePolicy;
  deadlineRationale: string | null;
  deadlineStatus: DeadlineStatus;
  executionEligible: boolean;
  effortEstimateSource: EffortEstimateSource;
  hours: number | null;
  latestStartAt: string | null;
  createdByUserId?: string | null;
  executorType: string;
  hasMarginalEstimate: boolean;
  estimatePublicationEligible: boolean;
  estimateInputsStale: boolean;
  pSuccess: number | null;
  priority: number;
  realEv: number;
  rooted: boolean;
  buybackRate: number;
  unblockedBlockers: number;
  unresolvedBlockers: number;
  timeUntilDueHours: number | null;
  valid: boolean;
  value: number | null;
  validationNotes: string[];
};

export interface PlanningExecutorProfile extends TaskExecutorCapabilities {
  agentExecutorId?: string | null;
  organizationId?: string | null;
  personId?: string | null;
  userId?: string | null;
}

type AuthorizedPlanningTarget =
  | { kind: "self"; personId: string | null; userId: string }
  | { kind: "person"; personId: string }
  | { kind: "organization"; organizationId: string };

export interface AuthorizedExecutionPlanRequest {
  availableMinutes?: number | null;
  buybackRate?: number | null;
  clientAccessBoundary?: TaskClientAccessBoundary;
  fixedCommitments?: PlanningCommitment[] | null;
  maxResults?: number | null;
  planningWindowEnd?: Date | string | null;
  planningWindowStart?: Date | string | null;
  target?: {
    id?: string | null;
    kind?: "self" | "person" | "organization";
  } | null;
  userId: string;
}

async function getPrisma() {
  const { prisma } = await import("../prisma");
  return prisma;
}

async function getTaskFunctions() {
  const [tasks, ranking] = await Promise.all([
    import("../tasks.server"),
    import("./rank-tasks"),
  ]);
  return { tasks, ranking };
}

function asObject(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        toJsonSafe(entry),
      ]),
    );
  }
  return value;
}

function parseFiniteNumber(value: unknown, fallback?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback ?? null;
  }
  return value;
}

function firstFiniteNumber(values: unknown[], fallback?: number) {
  for (const value of values) {
    const parsed = parseFiniteNumber(value);
    if (parsed != null) return parsed;
  }
  return fallback ?? null;
}

function parsePositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function parseQueueLimit(value: unknown, fallback = 20, max = 100) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(Math.floor(value), max));
}

function parseTaskDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeExecutorType(value: unknown) {
  if (typeof value !== "string") return "Self";
  const normalized = value.trim().toLowerCase();
  if (["ai", "agent", "ai agent"].includes(normalized)) {
    return AI_EXECUTOR_TYPE;
  }
  if (normalized === "self") return "Self";
  return value.trim() || "Self";
}

function normalizeDeadlinePolicy(
  value: unknown,
  fallback: DeadlinePolicy = "NONE",
): DeadlinePolicy {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["required", "hard", "must", "must_do", "must-do"].includes(normalized)) {
    return "REQUIRED";
  }
  if (["expires", "expire", "expiring"].includes(normalized)) return "EXPIRES";
  if (normalized === "soft") return "SOFT";
  if (normalized === "none") return "NONE";
  return fallback;
}

function getTaskContext(task: Record<string, unknown>) {
  return asObject(task.contextJson) ?? {};
}

function getTaskExecutorType(task: Record<string, unknown>) {
  const context = getTaskContext(task);
  return normalizeExecutorType(context.executor_type ?? context.executorType);
}

export function summarizeTask(task: SummarizableTask) {
  const visibility =
    task.isPublic === true
      ? "PUBLIC"
      : task.isPublic === false
        ? "PRIVATE"
        : undefined;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    taskKey: task.taskKey,
    dueAt: task.dueAt,
    isPublic: visibility === undefined ? undefined : visibility === "PUBLIC",
    visibility,
    parentTaskId: task.parentTaskId,
    impactStatement: task.impactStatement,
    primaryEndpoint: task.primaryEndpoint ?? null,
    claimPolicy: task.claimPolicy,
    applicationPolicy: task.applicationPolicy,
    compensationCadence: task.compensationCadence,
    compensationCurrency: task.compensationCurrency,
    compensationKind: task.compensationKind,
    compensationMaxAmountMinorUnits: toJsonSafe(
      task.compensationMaxAmountMinorUnits,
    ),
    compensationMinAmountMinorUnits: toJsonSafe(
      task.compensationMinAmountMinorUnits,
    ),
    compensationPaymentRails: task.compensationPaymentRails,
    engagementKind: task.engagementKind,
    estimatedHoursPerWeekMax: task.estimatedHoursPerWeekMax,
    estimatedHoursPerWeekMin: task.estimatedHoursPerWeekMin,
    executionMode: task.executionMode,
    locationText: task.locationText,
    ownerOrganizationId: task.ownerOrganizationId,
    preferredSkillTags: task.preferredSkillTags,
    remotePolicy: task.remotePolicy,
    requiredAccessTags: task.requiredAccessTags,
    requiredCredentialTags: task.requiredCredentialTags,
    requiredLanguageTags: task.requiredLanguageTags,
    requiredToolTags: task.requiredToolTags,
    skillTags: task.skillTags,
    interestTags: task.interestTags,
    estimatedEffortHours: task.estimatedEffortHours,
    workLocationCity: task.workLocationCity,
    workLocationCountryCode: task.workLocationCountryCode,
    workLocationRegionCode: task.workLocationRegionCode,
    assigneePersonName: task.assigneePerson?.displayName ?? null,
    assigneeOrgName: task.assigneeOrganization?.name ?? null,
    blocked:
      task.blockerStatuses?.some((status) => status !== TaskStatus.VERIFIED) ??
      false,
    blockerCount: task.blockerStatuses?.length ?? 0,
    childTaskCount: task.childTasks?.length ?? task._count?.childTasks ?? 0,
  };
}

function matchesPlanningExecutor(
  record: {
    agentExecutorId?: string | null;
    candidateOrganizationId?: string | null;
    candidatePersonId?: string | null;
    candidateUserId?: string | null;
    executorOrganizationId?: string | null;
    executorPersonId?: string | null;
    executorUserId?: string | null;
  },
  profile: PlanningExecutorProfile,
) {
  return Boolean(
    (profile.agentExecutorId &&
      profile.agentExecutorId === record.agentExecutorId) ||
    (profile.organizationId &&
      profile.organizationId ===
        (record.executorOrganizationId ?? record.candidateOrganizationId)) ||
    (profile.personId &&
      profile.personId ===
        (record.executorPersonId ?? record.candidatePersonId)) ||
    (profile.userId &&
      profile.userId === (record.executorUserId ?? record.candidateUserId)),
  );
}

function assessQueueTaskCapability(
  task: PersonalQueueTaskRecord,
  profiles: PlanningExecutorProfile[],
): TaskCapabilityAssessment {
  const executorKind =
    getTaskExecutorType(task) === AI_EXECUTOR_TYPE ? "agent" : "human";
  const matchingProfiles = profiles.filter(
    (profile) => profile.executorKind === executorKind,
  );
  const assessments = (
    matchingProfiles.length > 0
      ? matchingProfiles
      : [{ executorKind } as PlanningExecutorProfile]
  ).map((executor) => assessTaskCapability({ executor, task }));
  const eligible = assessments.find(
    (assessment) => assessment.status === "eligible",
  );
  if (eligible) return eligible;

  return {
    missingProfileFields: Array.from(
      new Set(
        assessments.flatMap((assessment) => assessment.missingProfileFields),
      ),
    ),
    missingRequiredTags: Array.from(
      new Set(
        assessments.flatMap((assessment) => assessment.missingRequiredTags),
      ),
    ),
    reasons: Array.from(
      new Set(assessments.flatMap((assessment) => assessment.reasons)),
    ),
    status: assessments.some((assessment) => assessment.status === "unknown")
      ? "unknown"
      : "ineligible",
  };
}

function resolveQueueEffortEstimate(
  task: PersonalQueueTaskRecord,
  selectedImpactFrame: Record<string, unknown> | null,
  profiles: PlanningExecutorProfile[],
) {
  const taskExecutorKind =
    getTaskExecutorType(task) === AI_EXECUTOR_TYPE ? "agent" : "human";
  const kindProfiles = profiles.filter(
    (profile) => profile.executorKind === taskExecutorKind,
  );
  const actualSeconds = (task.executionAttempts ?? []).find(
    (attempt) =>
      attempt.status === TaskExecutionAttemptStatus.COMPLETED &&
      typeof attempt.actualDurationSeconds === "number" &&
      attempt.actualDurationSeconds > 0 &&
      kindProfiles.some((profile) => matchesPlanningExecutor(attempt, profile)),
  )?.actualDurationSeconds;
  const claimedActualSeconds = (task.claims ?? []).find(
    (claim) =>
      typeof claim.actualEffortSeconds === "number" &&
      claim.actualEffortSeconds > 0 &&
      kindProfiles.some(
        (profile) => profile.userId && profile.userId === claim.userId,
      ),
  )?.actualEffortSeconds;
  const targetActualSeconds = actualSeconds ?? claimedActualSeconds;
  if (targetActualSeconds != null) {
    return {
      hours: targetActualSeconds / 3600,
      source: "target-actual-history" as const,
    };
  }

  const candidateSeconds = (task.candidateMatches ?? []).find(
    (candidate) =>
      candidate.status !== TaskCandidateMatchStatus.DECLINED &&
      candidate.status !== TaskCandidateMatchStatus.REJECTED &&
      typeof candidate.estimatedDurationSeconds === "number" &&
      candidate.estimatedDurationSeconds > 0 &&
      kindProfiles.some((profile) =>
        matchesPlanningExecutor(candidate, profile),
      ),
  )?.estimatedDurationSeconds;
  if (candidateSeconds != null) {
    return {
      hours: candidateSeconds / 3600,
      source: "candidate-estimate" as const,
    };
  }
  if (
    typeof task.estimatedEffortHours === "number" &&
    Number.isFinite(task.estimatedEffortHours) &&
    task.estimatedEffortHours > 0
  ) {
    return {
      hours: task.estimatedEffortHours,
      source: "task-estimate" as const,
    };
  }
  const impactHours = firstFiniteNumber([
    selectedImpactFrame?.estimatedEffortHoursBase,
  ]);
  if (impactHours != null && impactHours > 0) {
    return { hours: impactHours, source: "impact-frame" as const };
  }
  return { hours: null, source: "missing" as const };
}

export async function attachPlanningEffortEvidence(
  tasks: PersonalQueueTaskRecord[],
  profiles: PlanningExecutorProfile[],
) {
  const taskIds = tasks.map((task) => task.id);
  if (taskIds.length === 0) return tasks;

  const executionTargets = profiles.flatMap(
    (profile): Prisma.TaskExecutionAttemptWhereInput[] => [
      ...(profile.agentExecutorId
        ? [{ agentExecutorId: profile.agentExecutorId }]
        : []),
      ...(profile.organizationId
        ? [{ executorOrganizationId: profile.organizationId }]
        : []),
      ...(profile.personId ? [{ executorPersonId: profile.personId }] : []),
      ...(profile.userId ? [{ executorUserId: profile.userId }] : []),
    ],
  );
  const candidateTargets = profiles.flatMap(
    (profile): Prisma.TaskCandidateMatchWhereInput[] => [
      ...(profile.agentExecutorId
        ? [{ agentExecutorId: profile.agentExecutorId }]
        : []),
      ...(profile.organizationId
        ? [{ candidateOrganizationId: profile.organizationId }]
        : []),
      ...(profile.personId ? [{ candidatePersonId: profile.personId }] : []),
      ...(profile.userId ? [{ candidateUserId: profile.userId }] : []),
    ],
  );
  if (executionTargets.length === 0 && candidateTargets.length === 0) {
    return tasks;
  }

  const prisma = await getPrisma();
  const [executionAttempts, candidateMatches] = await Promise.all([
    executionTargets.length > 0
      ? prisma.taskExecutionAttempt.findMany({
          where: {
            actualDurationSeconds: { gt: 0 },
            deletedAt: null,
            OR: executionTargets,
            status: TaskExecutionAttemptStatus.COMPLETED,
            taskId: { in: taskIds },
          },
          orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
          select: {
            actualDurationSeconds: true,
            agentExecutorId: true,
            completedAt: true,
            executorOrganizationId: true,
            executorPersonId: true,
            executorUserId: true,
            status: true,
            taskId: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
    candidateTargets.length > 0
      ? prisma.taskCandidateMatch.findMany({
          where: {
            deletedAt: null,
            estimatedDurationSeconds: { gt: 0 },
            OR: candidateTargets,
            status: {
              in: [
                TaskCandidateMatchStatus.SUGGESTED,
                TaskCandidateMatchStatus.CONTACTED,
              ],
            },
            taskId: { in: taskIds },
          },
          orderBy: { updatedAt: "desc" },
          select: {
            agentExecutorId: true,
            candidateOrganizationId: true,
            candidatePersonId: true,
            candidateUserId: true,
            estimatedDurationSeconds: true,
            status: true,
            taskId: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);
  const attemptsByTask = new Map<string, typeof executionAttempts>();
  for (const attempt of executionAttempts) {
    const entries = attemptsByTask.get(attempt.taskId) ?? [];
    entries.push(attempt);
    attemptsByTask.set(attempt.taskId, entries);
  }
  const matchesByTask = new Map<string, typeof candidateMatches>();
  for (const match of candidateMatches) {
    const entries = matchesByTask.get(match.taskId) ?? [];
    entries.push(match);
    matchesByTask.set(match.taskId, entries);
  }

  return tasks.map((task) => ({
    ...task,
    candidateMatches: matchesByTask.get(task.id) ?? [],
    executionAttempts: attemptsByTask.get(task.id) ?? [],
  }));
}

export function isSelfExecutableTask(task: PersonalQueueTaskRecord) {
  return getTaskExecutorType(task) !== AI_EXECUTOR_TYPE;
}

export function isAIExecutableTask(task: PersonalQueueTaskRecord) {
  return getTaskExecutorType(task) === AI_EXECUTOR_TYPE;
}

function isCompletionMilestone(task: PersonalQueueTaskRecord) {
  if (task.taskKey?.endsWith(":completeTraining")) return true;
  const plannerContext = asObject(getTaskContext(task).executionPlanner);
  return plannerContext?.completionMilestone === true;
}

function getPlanningBlockers(task: PersonalQueueTaskRecord): PlanningBlocker[] {
  const edgeBlockers = (task.incomingEdges ?? []).flatMap((edge) => {
    const taskId = edge.fromTask?.id;
    const status = edge.fromTask?.status;
    return taskId && status ? [{ taskId, status }] : [];
  });
  if (edgeBlockers.length > 0) return edgeBlockers;
  return (task.blockerStatuses ?? []).map((status, index) => ({
    status,
    taskId: `unresolved-blocker:${task.id}:${index}`,
  }));
}

function getMarginalImpactFrame(task: PersonalQueueTaskRecord) {
  return asObject(task.marginalImpactFrame);
}

function hasRecordedMarginalEstimate(task: PersonalQueueTaskRecord) {
  return (
    parseFiniteNumber(
      getMarginalImpactFrame(task)?.expectedEconomicValueUsdBase,
    ) != null
  );
}

function getTaskImpactEstimateStatus(task: PersonalQueueTaskRecord) {
  const currentSet = task.impact?.currentSet;
  return {
    estimateInputsStale: currentSet?.parameterInputsStale === true,
    estimatePublicationEligible:
      task.isPublic !== true ||
      currentSet?.publicationStatus === TaskImpactPublicationStatus.PUBLISHED ||
      currentSet?.publicationStatus === TaskImpactPublicationStatus.REVIEWED,
  };
}

function getPinnedParameterRevisionIds(task: PersonalQueueTaskRecord) {
  const estimateSet = asObject(task.currentImpactEstimateSet);
  const inputs = Array.isArray(estimateSet?.inputs) ? estimateSet.inputs : [];
  return inputs.flatMap((input) => {
    const revisionId = asObject(input)?.parameterRevisionId;
    return typeof revisionId === "string" ? [revisionId] : [];
  });
}

async function attachTransitiveEstimateStaleness(
  tasks: PersonalQueueTaskRecord[],
) {
  const revisionIds = tasks.flatMap(getPinnedParameterRevisionIds);
  if (revisionIds.length === 0) return tasks;
  const { getTransitiveStaleParameterRevisionIds } =
    await import("../parameters/parameter-staleness.server");
  const staleRevisionIds =
    await getTransitiveStaleParameterRevisionIds(revisionIds);
  if (staleRevisionIds.size === 0) return tasks;

  return tasks.map((task) => {
    if (
      !getPinnedParameterRevisionIds(task).some((id) =>
        staleRevisionIds.has(id),
      )
    ) {
      return task;
    }
    const currentSet = task.impact?.currentSet;
    if (!currentSet) return task;
    return {
      ...task,
      impact: {
        ...task.impact,
        currentSet: { ...currentSet, parameterInputsStale: true },
      },
    };
  });
}

function hasMarginalEstimate(task: PersonalQueueTaskRecord) {
  if (!hasRecordedMarginalEstimate(task)) return false;
  return getTaskImpactEstimateStatus(task).estimatePublicationEligible;
}

export function isAtomicExecutionRecord(task: PersonalQueueTaskRecord) {
  return isExecutableWorkItem(task) && !isCompletionMilestone(task);
}

export async function loadExecutionGraphContext(
  tasks: PersonalQueueTaskRecord[],
  clientAccessBoundary?: TaskClientAccessBoundary,
) {
  const prisma = await getPrisma();
  const graphTaskById = new Map<string, ExecutionGraphTask>();
  for (const task of tasks) {
    graphTaskById.set(task.id, {
      activeChildTaskCount:
        task.activeChildTaskCount ?? task.childTasks?.length ?? 0,
      hasMarginalEstimate: hasRecordedMarginalEstimate(task),
      id: task.id,
      parentTaskId: task.parentTaskId ?? null,
    });
  }

  let pendingParentIds = Array.from(
    new Set(
      tasks
        .map((task) => task.parentTaskId)
        .filter(
          (id): id is string => Boolean(id) && !graphTaskById.has(id as string),
        ),
    ),
  );
  for (let depth = 0; depth < 64 && pendingParentIds.length > 0; depth += 1) {
    const storedParents = await prisma.task.findMany({
      where: clientAccessBoundary
        ? {
            AND: [
              { deletedAt: null, id: { in: pendingParentIds } },
              getTaskClientAccessWhere(clientAccessBoundary),
            ],
          }
        : { deletedAt: null, id: { in: pendingParentIds } },
      select: { id: true, parentTaskId: true },
    });
    for (const parent of storedParents) {
      graphTaskById.set(parent.id, {
        activeChildTaskCount: 0,
        hasMarginalEstimate: false,
        id: parent.id,
        parentTaskId: parent.parentTaskId ?? null,
      });
    }
    pendingParentIds = Array.from(
      new Set(
        storedParents
          .map((parent) => parent.parentTaskId)
          .filter(
            (id): id is string =>
              Boolean(id) && !graphTaskById.has(id as string),
          ),
      ),
    );
  }
  const graphTasks = Array.from(graphTaskById.values());
  return { graphTasks, rootedTaskIds: getRootedTaskIds(graphTasks) };
}

function parseDateToIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function isTaskTimeAvailable(task: PersonalQueueTaskRecord, now: Date) {
  const availableAt = parseTaskDate(task.availableAt);
  return !availableAt || availableAt.getTime() <= now.getTime();
}

function computeDeadlineSummary(
  task: PersonalQueueTaskRecord,
  hours: number | null,
  now: Date,
) {
  const availableAt = parseTaskDate(task.availableAt);
  const dueAt = parseTaskDate(task.dueAt);
  const context = getTaskContext(task);
  const deadlinePolicy = normalizeDeadlinePolicy(
    task.deadlinePolicy ?? context.deadline_policy ?? context.deadlinePolicy,
    dueAt ? "SOFT" : "NONE",
  );
  const deadlineRationale =
    typeof context.deadline_rationale === "string"
      ? context.deadline_rationale
      : typeof context.deadlineRationale === "string"
        ? context.deadlineRationale
        : null;

  if (!dueAt || deadlinePolicy === "NONE") {
    return {
      availableAt: parseDateToIso(availableAt),
      deadlinePolicy,
      deadlineRationale,
      deadlineStatus: "none" as DeadlineStatus,
      dueAt: parseDateToIso(dueAt),
      latestStartAt: null,
      timeUntilDueHours: dueAt
        ? (dueAt.getTime() - now.getTime()) / MS_PER_HOUR
        : null,
    };
  }

  const usableHours =
    typeof hours === "number" && Number.isFinite(hours) && hours > 0
      ? hours
      : null;
  const latestStartAt =
    usableHours == null
      ? null
      : new Date(dueAt.getTime() - usableHours * MS_PER_HOUR);
  const timeUntilDueHours = (dueAt.getTime() - now.getTime()) / MS_PER_HOUR;
  let deadlineStatus: DeadlineStatus = "future";
  if (timeUntilDueHours < 0) {
    deadlineStatus =
      deadlinePolicy === "REQUIRED"
        ? "missed"
        : deadlinePolicy === "EXPIRES"
          ? "expired"
          : "overdue";
  } else if (
    (deadlinePolicy === "REQUIRED" || deadlinePolicy === "EXPIRES") &&
    latestStartAt &&
    now.getTime() >= latestStartAt.getTime()
  ) {
    deadlineStatus = "start_now";
  }
  return {
    availableAt: parseDateToIso(availableAt),
    deadlinePolicy,
    deadlineRationale,
    deadlineStatus,
    dueAt: dueAt.toISOString(),
    latestStartAt: parseDateToIso(latestStartAt),
    timeUntilDueHours,
  };
}

function isRequiredPersonalGuardrail(task: PersonalQueueRow) {
  return (
    task.deadlinePolicy === "REQUIRED" &&
    (task.deadlineStatus === "start_now" || task.deadlineStatus === "missed") &&
    task.hours != null &&
    task.hours > 0
  );
}

export function buildPersonalQueueRows(
  tasks: unknown[],
  ranking: {
    computeTaskPriority: (
      task: TaskPriorityInput,
      options?: { buybackRate?: number },
    ) => TaskPriorityResult;
    isTaskBlocked?: (task: Pick<RankableTask, "blockerStatuses">) => boolean;
  },
  buybackRate?: number,
  options?: {
    executorProfiles?: PlanningExecutorProfile[];
    requireExecutable?: boolean;
    requireUnblocked?: boolean;
    limit?: number;
    now?: Date;
    rootedTaskIds?: ReadonlySet<string>;
  },
) {
  const limit = parseQueueLimit(
    options?.limit,
    50,
    Math.min(5000, tasks.length),
  );
  const parsedBuybackRate = parsePositiveNumber(
    buybackRate,
    DEFAULT_PERSONAL_BUYBACK_RATE,
  );
  const now = options?.now ?? new Date();
  const filtered = options?.requireUnblocked
    ? tasks.filter((task) => {
        const sourceTask = task as PersonalQueueTaskRecord;
        if (!isTaskTimeAvailable(sourceTask, now)) return false;
        if (
          ranking.isTaskBlocked?.({
            blockerStatuses: sourceTask.blockerStatuses ?? undefined,
          }) ??
          false
        ) {
          return false;
        }
        const deadline = computeDeadlineSummary(sourceTask, null, now);
        return !(
          deadline.deadlinePolicy === "EXPIRES" &&
          deadline.deadlineStatus === "expired"
        );
      })
    : tasks;

  const ranked = filtered
    .map((task) => {
      const sourceTask = task as PersonalQueueTaskRecord;
      const marginalImpactFrame = getMarginalImpactFrame(sourceTask);
      const capability = assessQueueTaskCapability(
        sourceTask,
        options?.executorProfiles ?? [],
      );
      const effort = resolveQueueEffortEstimate(
        sourceTask,
        marginalImpactFrame,
        options?.executorProfiles ?? [],
      );
      const score = ranking.computeTaskPriority(
        {
          ...sourceTask,
          estimatedEffortHours: effort.hours,
          selectedImpactFrame: marginalImpactFrame,
        } as TaskPriorityInput,
        { buybackRate: parsedBuybackRate },
      );
      const summary = summarizeTask(sourceTask);
      const context = getTaskContext(sourceTask);
      const hours = effort.hours;
      const value = firstFiniteNumber([context.value, context.grossValue]);
      const pSuccess = firstFiniteNumber([
        context.p_success,
        context.pSuccess,
        marginalImpactFrame?.successProbabilityBase,
      ]);
      const cashCost =
        firstFiniteNumber(
          [
            context.cash_cost,
            context.cashCost,
            marginalImpactFrame?.estimatedCashCostUsdBase,
          ],
          0,
        ) ?? 0;
      const deadline = computeDeadlineSummary(sourceTask, hours, now);
      const impactEstimateStatus = getTaskImpactEstimateStatus(sourceTask);
      return {
        ...summary,
        activeChildTaskCount:
          sourceTask.activeChildTaskCount ?? sourceTask.childTasks?.length ?? 0,
        activeExecutionAttemptCount:
          sourceTask.activeExecutionAttemptCount ?? 0,
        assigneeOrganizationId: sourceTask.assigneeOrganizationId ?? null,
        assigneePersonId: sourceTask.assigneePersonId ?? null,
        blockers: getPlanningBlockers(sourceTask),
        contextJson: sourceTask.contextJson,
        createdByUserId: sourceTask.createdByUserId ?? null,
        blockersCount: score.blockersCount,
        blockersResolved: score.blockersResolved,
        blockersResolvedPercent:
          score.blockersCount > 0
            ? (score.unblockedBlockers / score.blockersCount) * 100
            : 100,
        capabilityReasons: capability.reasons,
        capabilityStatus: capability.status,
        availableAt: deadline.availableAt,
        buybackRate: score.buybackRate,
        cashCost,
        deadlinePolicy: deadline.deadlinePolicy,
        deadlineRationale: deadline.deadlineRationale,
        deadlineStatus: deadline.deadlineStatus,
        dueAt: deadline.dueAt,
        evMath: score.evMath,
        executionEligible: isExecutableWorkItem(sourceTask),
        effortEstimateSource: effort.source,
        hours,
        latestStartAt: deadline.latestStartAt,
        executorType: getTaskExecutorType(sourceTask),
        hasMarginalEstimate: hasMarginalEstimate(sourceTask),
        ...impactEstimateStatus,
        priority: score.priority,
        pSuccess,
        realEv: score.realEv,
        rooted:
          options?.rootedTaskIds?.has(sourceTask.id) ??
          sourceTask.parentTaskId === OPTIMIZE_EARTH_ROOT_TASK_ID,
        timeUntilDueHours: deadline.timeUntilDueHours,
        unblockedBlockers: score.unblockedBlockers,
        unresolvedBlockers: Math.max(
          0,
          score.blockersCount - score.unblockedBlockers,
        ),
        valid: score.valid,
        value,
        validationNotes: score.validationNotes,
      } as PersonalQueueTaskRecord & PersonalQueueRow;
    })
    .filter(
      (row) =>
        !options?.requireExecutable ||
        (isAtomicExecutionRecord(row) &&
          row.capabilityStatus === "eligible" &&
          row.rooted &&
          ((row.hasMarginalEstimate && row.valid && row.priority > 0) ||
            isRequiredPersonalGuardrail(row))),
    )
    .sort((left, right) =>
      compareExecutionTasks(
        toExecutionPlanningTask(left),
        toExecutionPlanningTask(right),
      ),
    );
  return ranked.slice(0, limit);
}

function toExecutionPlanningTask(row: PersonalQueueRow): ExecutionPlanningTask {
  return {
    activeChildTaskCount: row.activeChildTaskCount,
    availableAt: row.availableAt ?? null,
    blockers: row.blockers,
    capabilityReasons: row.capabilityReasons,
    capabilityStatus: row.capabilityStatus,
    completionMilestone: isCompletionMilestone(
      row as unknown as PersonalQueueTaskRecord,
    ),
    deadlinePolicy: row.deadlinePolicy,
    deadlineStatus: row.deadlineStatus,
    dueAt: row.dueAt ?? null,
    executionEligible: row.executionEligible,
    executorType: row.executorType,
    effortEstimateSource: row.effortEstimateSource,
    hasMarginalEstimate: row.hasMarginalEstimate,
    hours: row.hours,
    id: row.id,
    parentTaskId: row.parentTaskId ?? null,
    priority: row.priority,
    realEv: row.realEv,
    rooted: row.rooted,
    title: row.title,
    valid: row.valid,
    validationNotes: row.validationNotes,
  };
}

export function summarizeCapabilityWork(rows: PersonalQueueRow[]) {
  const summarize = (row: PersonalQueueRow) => ({
    id: row.id,
    reasons: row.capabilityReasons,
    title: row.title,
  });
  const atomicRows = rows.filter(
    (row) =>
      row.executionEligible && row.activeChildTaskCount === 0 && row.rooted,
  );
  return {
    capabilityExcludedWork: atomicRows
      .filter((row) => row.capabilityStatus === "ineligible")
      .map(summarize),
    itemsNeedingCapabilityConfirmation: atomicRows
      .filter((row) => row.capabilityStatus === "unknown")
      .map(summarize),
  };
}

export async function loadHumanPlanningProfiles(
  target: AuthorizedPlanningTarget,
): Promise<PlanningExecutorProfile[]> {
  if (target.kind === "organization") {
    return [{ executorKind: "human", organizationId: target.organizationId }];
  }
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where:
      target.kind === "self"
        ? { id: target.userId }
        : { personId: target.personId },
    select: {
      accessTags: true,
      credentialTags: true,
      id: true,
      languageTags: true,
      personId: true,
      skillTags: true,
      toolTags: true,
    },
  });
  if (!user) {
    return [{ executorKind: "human", personId: target.personId }];
  }
  return [
    {
      accessTags: user.accessTags,
      credentialTags: user.credentialTags,
      executorKind: "human",
      languageTags: user.languageTags,
      personId: user.personId,
      skillTags: user.skillTags,
      toolTags: user.toolTags,
      userId: user.id,
    },
  ];
}

export async function loadAgentPlanningProfiles(): Promise<
  PlanningExecutorProfile[]
> {
  const prisma = await getPrisma();
  const agents = await prisma.agentExecutor.findMany({
    where: { deletedAt: null, status: AgentExecutorStatus.ACTIVE },
    orderBy: { agentKey: "asc" },
    select: {
      accessTags: true,
      capabilityTags: true,
      id: true,
      toolTags: true,
    },
  });
  return agents.map((agent) => ({
    accessTags: agent.accessTags,
    agentExecutorId: agent.id,
    executorKind: "agent" as const,
    skillTags: agent.capabilityTags,
    toolTags: agent.toolTags,
  }));
}

async function resolveAuthorizedPlanningTarget(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  target?: AuthorizedExecutionPlanRequest["target"];
  userId: string;
}): Promise<AuthorizedPlanningTarget> {
  const kind = input.target?.kind ?? "self";
  const targetId = input.target?.id?.trim() || null;
  const prisma = await getPrisma();
  const sessionUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { personId: true },
  });
  const sessionPersonId = sessionUser?.personId ?? null;

  if (kind === "self") {
    if (input.clientAccessBoundary?.allowPersonalPrivate === false) {
      throw new Error("Forbidden: this client has no personal-task access.");
    }
    return { kind: "self", personId: sessionPersonId, userId: input.userId };
  }
  if (kind === "person") {
    if (!targetId)
      throw new Error("target.id is required for a person target.");
    if (targetId !== sessionPersonId) {
      throw new Error(
        "Forbidden: you may only plan for your own Person record.",
      );
    }
    if (input.clientAccessBoundary?.allowPersonalPrivate === false) {
      throw new Error("Forbidden: this client has no personal-task access.");
    }
    return { kind: "person", personId: targetId };
  }
  if (!targetId) {
    throw new Error("target.id is required for an organization target.");
  }
  if (
    input.clientAccessBoundary &&
    input.clientAccessBoundary.organizationIds !== null &&
    !input.clientAccessBoundary.organizationIds.includes(targetId)
  ) {
    throw new Error("Forbidden: this client has no access to that organization.");
  }
  const { canManageOrganization } = await import("../organization.server");
  if (!(await canManageOrganization(input.userId, targetId))) {
    throw new Error(
      "Forbidden: organization planning requires an owner or admin membership.",
    );
  }
  return { kind: "organization", organizationId: targetId };
}

export async function getAuthorizedExecutionPlan(
  input: AuthorizedExecutionPlanRequest,
) {
  const target = await resolveAuthorizedPlanningTarget(input);
  const { tasks, ranking } = await getTaskFunctions();
  const buybackRate = parsePositiveNumber(
    input.buybackRate,
    DEFAULT_PERSONAL_BUYBACK_RATE,
  );
  const maxResults = parseQueueLimit(input.maxResults, 20, 100);
  const targetTasks = (await (target.kind === "self"
    ? tasks.listTasks({
        clientAccessBoundary: input.clientAccessBoundary,
        limit: 5000,
        personId: target.personId,
        status: TaskStatus.ACTIVE,
        userId: target.userId,
        visibility: "personal",
      })
    : target.kind === "person"
      ? tasks.listTasks({
          clientAccessBoundary: input.clientAccessBoundary,
          assigneePersonId: target.personId,
          limit: 5000,
          personId: target.personId,
          status: TaskStatus.ACTIVE,
          userId: input.userId,
          visibility: "accessible",
        })
      : tasks.listTasks({
          clientAccessBoundary: input.clientAccessBoundary,
          limit: 5000,
          status: TaskStatus.ACTIVE,
          targetOrganizationId: target.organizationId,
          userId: input.userId,
          visibility: "accessible",
        }))) as PersonalQueueTaskRecord[];
  const planningTasksWithStaleness =
    await attachTransitiveEstimateStaleness(targetTasks);
  const planningWindowStart =
    parseTaskDate(input.planningWindowStart) ?? new Date();
  const planningWindowEnd =
    parseTaskDate(input.planningWindowEnd) ??
    new Date(planningWindowStart.getTime() + 24 * MS_PER_HOUR);
  const graph = await loadExecutionGraphContext(
    planningTasksWithStaleness,
    input.clientAccessBoundary,
  );
  const executorProfiles = [
    ...(await loadHumanPlanningProfiles(target)),
    ...(await loadAgentPlanningProfiles()),
  ];
  const planningTasks = await attachPlanningEffortEvidence(
    planningTasksWithStaleness,
    executorProfiles,
  );
  const rows = buildPersonalQueueRows(planningTasks, ranking, buybackRate, {
    executorProfiles,
    limit: targetTasks.length,
    now: planningWindowStart,
    rootedTaskIds: graph.rootedTaskIds,
  });
  const plan = buildExecutionPlan({
    availableMinutes:
      typeof input.availableMinutes === "number"
        ? input.availableMinutes
        : null,
    commitments: input.fixedCommitments ?? [],
    limit: maxResults,
    now: planningWindowStart,
    planningWindowEnd,
    planningWindowStart,
    tasks: rows.map(toExecutionPlanningTask),
  });

  return { ...plan, buybackRate, target };
}
