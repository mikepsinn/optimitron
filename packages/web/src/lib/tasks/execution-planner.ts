import { TaskStatus } from "@optimitron/db";

export const EXECUTION_PLANNER_VERSION = "frontier-replanning-v1" as const;

const RESOLVED_STATUSES = new Set<string>([TaskStatus.VERIFIED]);
const HUMAN_EXECUTOR = "Self";
const AI_EXECUTOR = "AI Agent";

export interface PlanningCommitment {
  endAt: Date | string;
  startAt: Date | string;
  title?: string | null;
}

export interface PlanningBlocker {
  status: TaskStatus | string;
  taskId: string;
}

export interface ExecutionPlanningTask {
  activeChildTaskCount: number;
  availableAt: Date | string | null;
  blockers: PlanningBlocker[];
  capabilityReasons: string[];
  capabilityStatus: "eligible" | "unknown" | "ineligible";
  completionMilestone?: boolean;
  deadlinePolicy: "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";
  deadlineStatus:
    | "none"
    | "future"
    | "start_now"
    | "overdue"
    | "missed"
    | "expired";
  dueAt: Date | string | null;
  executionEligible: boolean;
  executorType: string;
  effortEstimateSource:
    | "target-actual-history"
    | "candidate-estimate"
    | "task-estimate"
    | "impact-frame"
    | "missing";
  hasMarginalEstimate: boolean;
  hours: number | null;
  id: string;
  parentTaskId: string | null;
  priority: number;
  realEv: number;
  rooted: boolean;
  title: string;
  valid: boolean;
  validationNotes: string[];
}

export interface ExecutionPlanInput {
  availableMinutes?: number | null;
  commitments?: PlanningCommitment[];
  limit?: number;
  now?: Date;
  planningWindowEnd: Date | string;
  planningWindowStart: Date | string;
  tasks: ExecutionPlanningTask[];
}

export interface PlannedAction extends ExecutionPlanningTask {
  estimatedMinutes: number;
  reason: string;
}

export interface ExecutionPlan {
  assumptions: string[];
  availableMinutes: number;
  blockedWork: Array<{
    blockerTaskIds: string[];
    id: string;
    title: string;
  }>;
  capabilityExcludedWork: Array<{
    id: string;
    reasons: string[];
    title: string;
  }>;
  checklist: PlannedAction[];
  fixedCommitmentMinutes: number;
  itemsNeedingEstimates: Array<{
    id: string;
    reasons: string[];
    title: string;
  }>;
  itemsNeedingCapabilityConfirmation: Array<{
    id: string;
    reasons: string[];
    title: string;
  }>;
  nextAction: PlannedAction | null;
  plannerVersion: typeof EXECUTION_PLANNER_VERSION;
  proposedAiAssistedWork: PlannedAction[];
  unusedMinutes: number;
}

function asDate(value: Date | string | null | undefined) {
  if (value == null) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function clampLimit(value: number | undefined) {
  if (!Number.isFinite(value)) return 20;
  return Math.max(1, Math.min(100, Math.floor(value!)));
}

function overlapInterval(
  commitment: PlanningCommitment,
  windowStart: Date,
  windowEnd: Date,
) {
  const start = asDate(commitment.startAt);
  const end = asDate(commitment.endAt);
  if (!start || !end || end <= start) return null;
  const overlapStart = Math.max(start.getTime(), windowStart.getTime());
  const overlapEnd = Math.min(end.getTime(), windowEnd.getTime());
  return overlapEnd > overlapStart
    ? ([overlapStart, overlapEnd] as const)
    : null;
}

function totalCommitmentMinutes(
  commitments: PlanningCommitment[],
  windowStart: Date,
  windowEnd: Date,
) {
  const intervals = commitments
    .map((commitment) => overlapInterval(commitment, windowStart, windowEnd))
    .filter(
      (interval): interval is readonly [number, number] => interval != null,
    )
    .sort((left, right) => left[0] - right[0]);
  let totalMilliseconds = 0;
  let currentStart: number | null = null;
  let currentEnd: number | null = null;

  for (const [start, end] of intervals) {
    if (currentStart == null || currentEnd == null) {
      currentStart = start;
      currentEnd = end;
      continue;
    }
    if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end);
      continue;
    }
    totalMilliseconds += currentEnd - currentStart;
    currentStart = start;
    currentEnd = end;
  }
  if (currentStart != null && currentEnd != null) {
    totalMilliseconds += currentEnd - currentStart;
  }
  return totalMilliseconds / 60_000;
}

function taskMinutes(task: ExecutionPlanningTask) {
  return task.hours == null || task.hours <= 0
    ? null
    : Math.ceil(task.hours * 60);
}

function isAtomicTask(task: ExecutionPlanningTask) {
  return (
    task.executionEligible &&
    task.activeChildTaskCount === 0 &&
    task.completionMilestone !== true
  );
}

function hasConfirmedCapability(task: ExecutionPlanningTask) {
  return task.capabilityStatus === "eligible";
}

function isTimeAvailable(task: ExecutionPlanningTask, now: Date) {
  const availableAt = asDate(task.availableAt);
  return availableAt == null || availableAt <= now;
}

function hasUsableEstimate(task: ExecutionPlanningTask) {
  return (
    task.hasMarginalEstimate &&
    task.valid &&
    Number.isFinite(task.priority) &&
    Number.isFinite(task.realEv) &&
    task.realEv !== 0 &&
    taskMinutes(task) != null
  );
}

function unresolvedBlockers(
  task: ExecutionPlanningTask,
  simulatedCompletedIds: ReadonlySet<string>,
) {
  return task.blockers
    .filter(
      (blocker) =>
        !simulatedCompletedIds.has(blocker.taskId) &&
        !RESOLVED_STATUSES.has(blocker.status),
    )
    .map((blocker) => blocker.taskId);
}

function deadlineRank(task: ExecutionPlanningTask) {
  if (task.deadlinePolicy === "REQUIRED") {
    if (task.deadlineStatus === "missed") return 0;
    if (task.deadlineStatus === "start_now") return 1;
  }
  if (
    task.deadlinePolicy === "EXPIRES" &&
    task.deadlineStatus === "start_now"
  ) {
    return 2;
  }
  return 3;
}

export function compareExecutionTasks(
  left: ExecutionPlanningTask,
  right: ExecutionPlanningTask,
) {
  const leftDeadlineRank = deadlineRank(left);
  const rightDeadlineRank = deadlineRank(right);
  if (leftDeadlineRank !== rightDeadlineRank) {
    return leftDeadlineRank - rightDeadlineRank;
  }
  if (left.priority !== right.priority) {
    return right.priority - left.priority;
  }
  const leftDueAt = asDate(left.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightDueAt = asDate(right.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (leftDueAt !== rightDueAt) return leftDueAt - rightDueAt;
  return left.id.localeCompare(right.id);
}

function actionReason(task: ExecutionPlanningTask, unlocked: boolean) {
  if (deadlineRank(task) < 3) {
    return "Required or expiring work has reached its latest safe start.";
  }
  if (unlocked) {
    return "The preceding planned action unlocks this task, which is then the highest-priority feasible frontier item.";
  }
  return "Highest-priority feasible atomic task on the current frontier.";
}

function planHumanChecklist(input: {
  availableMinutes: number;
  limit: number;
  now: Date;
  tasks: ExecutionPlanningTask[];
}) {
  const checklist: PlannedAction[] = [];
  const completedIds = new Set<string>();
  let remainingMinutes = input.availableMinutes;

  while (checklist.length < input.limit && remainingMinutes > 0) {
    const candidates = input.tasks
      .filter((task) => task.executorType !== AI_EXECUTOR)
      .filter((task) => !completedIds.has(task.id))
      .filter((task) => isAtomicTask(task) && task.rooted)
      .filter(hasConfirmedCapability)
      .filter((task) => isTimeAvailable(task, input.now))
      .filter((task) => task.deadlineStatus !== "expired")
      .filter(hasUsableEstimate)
      .filter((task) => unresolvedBlockers(task, completedIds).length === 0)
      .filter(
        (task) =>
          (taskMinutes(task) ?? Number.POSITIVE_INFINITY) <= remainingMinutes,
      )
      .sort(compareExecutionTasks);

    const next = candidates[0];
    if (!next) break;
    const estimatedMinutes = taskMinutes(next)!;
    const unlocked = next.blockers.some((blocker) =>
      completedIds.has(blocker.taskId),
    );
    checklist.push({
      ...next,
      estimatedMinutes,
      reason: actionReason(next, unlocked),
    });
    completedIds.add(next.id);
    remainingMinutes -= estimatedMinutes;
  }

  return { checklist, completedIds, remainingMinutes };
}

export function buildExecutionPlan(input: ExecutionPlanInput): ExecutionPlan {
  const now = input.now ?? new Date();
  const windowStart = asDate(input.planningWindowStart);
  const windowEnd = asDate(input.planningWindowEnd);
  if (!windowStart || !windowEnd || windowEnd <= windowStart) {
    throw new Error("planningWindowEnd must be after planningWindowStart.");
  }

  const windowMinutes = Math.floor(
    (windowEnd.getTime() - windowStart.getTime()) / 60_000,
  );
  const fixedCommitmentMinutes = Math.ceil(
    totalCommitmentMinutes(input.commitments ?? [], windowStart, windowEnd),
  );
  const freeWindowMinutes = Math.max(0, windowMinutes - fixedCommitmentMinutes);
  const requestedMinutes =
    input.availableMinutes == null
      ? freeWindowMinutes
      : Math.max(0, Math.floor(input.availableMinutes));
  const availableMinutes = Math.min(freeWindowMinutes, requestedMinutes);
  const limit = clampLimit(input.limit);
  const { checklist, completedIds, remainingMinutes } = planHumanChecklist({
    availableMinutes,
    limit,
    now,
    tasks: input.tasks,
  });

  const proposedAiAssistedWork = input.tasks
    .filter((task) => task.executorType === AI_EXECUTOR)
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter(hasConfirmedCapability)
    .filter((task) => isTimeAvailable(task, now))
    .filter((task) => task.deadlineStatus !== "expired")
    .filter(hasUsableEstimate)
    .filter((task) => unresolvedBlockers(task, completedIds).length === 0)
    .sort(compareExecutionTasks)
    .slice(0, limit)
    .map((task) => ({
      ...task,
      estimatedMinutes: taskMinutes(task)!,
      reason:
        "Feasible AI-routed work for review; this planner does not start it automatically.",
    }));

  const blockedWork = input.tasks
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter(hasConfirmedCapability)
    .map((task) => ({
      blockerTaskIds: unresolvedBlockers(task, completedIds),
      id: task.id,
      title: task.title,
    }))
    .filter((task) => task.blockerTaskIds.length > 0)
    .sort((left, right) => left.id.localeCompare(right.id));

  const itemsNeedingEstimates = input.tasks
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter(hasConfirmedCapability)
    .filter((task) => !hasUsableEstimate(task))
    .map((task) => {
      const reasons = [...task.validationNotes];
      if (!task.hasMarginalEstimate || task.realEv === 0) {
        reasons.push(
          "Missing non-zero direct or explicitly edge-derived marginal value.",
        );
      }
      if (taskMinutes(task) == null) {
        reasons.push("Missing positive effort estimate.");
      }
      return {
        id: task.id,
        reasons: Array.from(new Set(reasons)),
        title: task.title,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const itemsNeedingCapabilityConfirmation = input.tasks
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter((task) => task.capabilityStatus === "unknown")
    .map((task) => ({
      id: task.id,
      reasons: task.capabilityReasons,
      title: task.title,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  const capabilityExcludedWork = input.tasks
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter((task) => task.capabilityStatus === "ineligible")
    .map((task) => ({
      id: task.id,
      reasons: task.capabilityReasons,
      title: task.title,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    assumptions: [
      "This is repeated feasible-frontier selection, not a globally optimal finite schedule.",
      "Only rooted tasks without incomplete subtasks and with non-zero marginal estimates can enter the checklist.",
      "Completing a checklist item is simulated only to test which dependency becomes feasible next.",
      "Calendar commitments reduce capacity but are not imported as tasks.",
      "AI-routed work is proposed for approval and is never started by this planner.",
      "Tasks with unknown or mismatched required capabilities are reported separately and cannot enter an execution queue.",
    ],
    availableMinutes,
    blockedWork,
    capabilityExcludedWork,
    checklist,
    fixedCommitmentMinutes,
    itemsNeedingEstimates,
    itemsNeedingCapabilityConfirmation,
    nextAction: checklist[0] ?? null,
    plannerVersion: EXECUTION_PLANNER_VERSION,
    proposedAiAssistedWork,
    unusedMinutes: remainingMinutes,
  };
}

export { AI_EXECUTOR, HUMAN_EXECUTOR };
