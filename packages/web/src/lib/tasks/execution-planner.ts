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

export interface EstimatedAction extends ExecutionPlanningTask {
  estimatedMinutes: number;
  reason: string;
}

export interface PlannedAction extends EstimatedAction {
  scheduledEndAt: string;
  scheduledStartAt: string;
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
  proposedAiAssistedWork: EstimatedAction[];
  unusedMinutes: number;
}

interface FreeInterval {
  end: number;
  start: number;
}

interface PlanningSlot {
  end: number;
  intervalIndex: number;
  start: number;
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

function mergedCommitmentIntervals(
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
  const merged: FreeInterval[] = [];
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
    merged.push({ end: currentEnd, start: currentStart });
    currentStart = start;
    currentEnd = end;
  }
  if (currentStart != null && currentEnd != null) {
    merged.push({ end: currentEnd, start: currentStart });
  }
  return merged;
}

function totalCommitmentMinutes(
  commitments: PlanningCommitment[],
  windowStart: Date,
  windowEnd: Date,
) {
  return (
    mergedCommitmentIntervals(commitments, windowStart, windowEnd).reduce(
      (total, interval) => total + interval.end - interval.start,
      0,
    ) / 60_000
  );
}

function freePlanningIntervals(
  commitments: PlanningCommitment[],
  windowStart: Date,
  windowEnd: Date,
) {
  const free: FreeInterval[] = [];
  let cursor = windowStart.getTime();
  for (const commitment of mergedCommitmentIntervals(
    commitments,
    windowStart,
    windowEnd,
  )) {
    if (commitment.start > cursor) {
      free.push({ end: commitment.start, start: cursor });
    }
    cursor = Math.max(cursor, commitment.end);
  }
  if (cursor < windowEnd.getTime()) {
    free.push({ end: windowEnd.getTime(), start: cursor });
  }
  return free;
}

function findPlanningSlot(
  intervals: FreeInterval[],
  durationMinutes: number,
  notBefore: number,
  notAfter?: number | null,
): PlanningSlot | null {
  const durationMs = durationMinutes * 60_000;
  for (
    let intervalIndex = 0;
    intervalIndex < intervals.length;
    intervalIndex += 1
  ) {
    const interval = intervals[intervalIndex]!;
    const start = Math.max(interval.start, notBefore);
    const end = start + durationMs;
    const latestEnd =
      notAfter == null ? interval.end : Math.min(interval.end, notAfter);
    if (end <= latestEnd) return { end, intervalIndex, start };
  }
  return null;
}

function findLatestPlanningSlot(
  intervals: FreeInterval[],
  durationMinutes: number,
  notBefore: number,
  notAfter: number,
): PlanningSlot | null {
  const durationMs = durationMinutes * 60_000;
  for (
    let intervalIndex = intervals.length - 1;
    intervalIndex >= 0;
    intervalIndex -= 1
  ) {
    const interval = intervals[intervalIndex]!;
    const end = Math.min(interval.end, notAfter);
    const start = end - durationMs;
    if (start >= Math.max(interval.start, notBefore)) {
      return { end, intervalIndex, start };
    }
  }
  return null;
}

function reservePlanningSlot(intervals: FreeInterval[], slot: PlanningSlot) {
  const interval = intervals[slot.intervalIndex]!;
  const replacements: FreeInterval[] = [];
  if (interval.start < slot.start) {
    replacements.push({ end: slot.start, start: interval.start });
  }
  if (slot.end < interval.end) {
    replacements.push({ end: interval.end, start: slot.end });
  }
  intervals.splice(slot.intervalIndex, 1, ...replacements);
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

function isRequiredGuardrail(task: ExecutionPlanningTask) {
  return (
    task.deadlinePolicy === "REQUIRED" &&
    (task.deadlineStatus === "start_now" || task.deadlineStatus === "missed") &&
    taskMinutes(task) != null
  );
}

function isRequiredInWindow(
  task: ExecutionPlanningTask,
  windowStart: Date,
  windowEnd: Date,
) {
  if (task.deadlinePolicy !== "REQUIRED" || taskMinutes(task) == null) {
    return false;
  }
  if (task.deadlineStatus === "start_now" || task.deadlineStatus === "missed") {
    return true;
  }
  const dueAt = asDate(task.dueAt);
  return dueAt != null && dueAt > windowStart && dueAt <= windowEnd;
}

function isSchedulable(task: ExecutionPlanningTask) {
  return hasUsableEstimate(task) || isRequiredGuardrail(task);
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

function scheduledAction(
  task: ExecutionPlanningTask,
  slot: PlanningSlot,
  reason: string,
): PlannedAction {
  return {
    ...task,
    estimatedMinutes: taskMinutes(task)!,
    reason,
    scheduledEndAt: new Date(slot.end).toISOString(),
    scheduledStartAt: new Date(slot.start).toISOString(),
  };
}

function plannedBlockerCompletion(
  task: ExecutionPlanningTask,
  completionTimes: ReadonlyMap<string, number>,
) {
  return task.blockers.reduce(
    (latest, blocker) =>
      Math.max(latest, completionTimes.get(blocker.taskId) ?? 0),
    0,
  );
}

function taskSchedulingBounds(
  task: ExecutionPlanningTask,
  now: Date,
  completionTimes: ReadonlyMap<string, number>,
) {
  const availableAt = asDate(task.availableAt)?.getTime() ?? 0;
  const blockerCompletion = plannedBlockerCompletion(task, completionTimes);
  const dueAt = asDate(task.dueAt);
  const hasHardDeadline =
    task.deadlinePolicy === "REQUIRED" || task.deadlinePolicy === "EXPIRES";
  return {
    notAfter:
      hasHardDeadline && dueAt != null && dueAt > now ? dueAt.getTime() : null,
    notBefore: Math.max(now.getTime(), availableAt, blockerCompletion),
  };
}

function compareRequiredReservations(
  left: ExecutionPlanningTask,
  right: ExecutionPlanningTask,
) {
  const leftIsImmediate = isRequiredGuardrail(left);
  const rightIsImmediate = isRequiredGuardrail(right);
  if (leftIsImmediate !== rightIsImmediate) return leftIsImmediate ? -1 : 1;

  const leftDueAt = asDate(left.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightDueAt = asDate(right.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (leftDueAt !== rightDueAt) return leftDueAt - rightDueAt;

  return compareExecutionTasks(left, right);
}

function planHumanChecklist(input: {
  availableMinutes: number;
  commitments: PlanningCommitment[];
  limit: number;
  now: Date;
  planningWindowEnd: Date;
  planningWindowStart: Date;
  tasks: ExecutionPlanningTask[];
}) {
  const checklist: PlannedAction[] = [];
  const completedIds = new Set<string>();
  const completionTimes = new Map<string, number>();
  const freeIntervals = freePlanningIntervals(
    input.commitments,
    input.planningWindowStart,
    input.planningWindowEnd,
  );
  let remainingMinutes = input.availableMinutes;

  const requiredTasks = input.tasks
    .filter((task) => task.executorType !== AI_EXECUTOR)
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter(hasConfirmedCapability)
    .filter((task) =>
      isRequiredInWindow(
        task,
        input.planningWindowStart,
        input.planningWindowEnd,
      ),
    )
    .filter((task) => unresolvedBlockers(task, completedIds).length === 0)
    .sort(compareRequiredReservations);

  for (const task of requiredTasks) {
    const estimatedMinutes = taskMinutes(task)!;
    if (checklist.length >= input.limit || estimatedMinutes > remainingMinutes)
      break;
    const bounds = taskSchedulingBounds(task, input.now, completionTimes);
    const slot =
      bounds.notAfter == null || isRequiredGuardrail(task)
        ? findPlanningSlot(
            freeIntervals,
            estimatedMinutes,
            bounds.notBefore,
            bounds.notAfter,
          )
        : findLatestPlanningSlot(
            freeIntervals,
            estimatedMinutes,
            bounds.notBefore,
            bounds.notAfter,
          );
    if (!slot) continue;
    reservePlanningSlot(freeIntervals, slot);
    checklist.push(
      scheduledAction(
        task,
        slot,
        "Required work is reserved inside its due window.",
      ),
    );
    completedIds.add(task.id);
    completionTimes.set(task.id, slot.end);
    remainingMinutes -= estimatedMinutes;
  }

  while (checklist.length < input.limit && remainingMinutes > 0) {
    const candidates = input.tasks
      .filter((task) => task.executorType !== AI_EXECUTOR)
      .filter((task) => !completedIds.has(task.id))
      .filter((task) => isAtomicTask(task) && task.rooted)
      .filter(hasConfirmedCapability)
      .filter((task) => task.deadlineStatus !== "expired")
      .filter(isSchedulable)
      .filter((task) => unresolvedBlockers(task, completedIds).length === 0)
      .filter(
        (task) =>
          (taskMinutes(task) ?? Number.POSITIVE_INFINITY) <= remainingMinutes,
      )
      .map((task) => {
        const bounds = taskSchedulingBounds(task, input.now, completionTimes);
        return {
          slot: findPlanningSlot(
            freeIntervals,
            taskMinutes(task)!,
            bounds.notBefore,
            bounds.notAfter,
          ),
          task,
        };
      })
      .filter(
        (
          candidate,
        ): candidate is { slot: PlanningSlot; task: ExecutionPlanningTask } =>
          candidate.slot != null,
      )
      .sort((left, right) => compareExecutionTasks(left.task, right.task));

    const next = candidates[0];
    if (!next) break;
    const estimatedMinutes = taskMinutes(next.task)!;
    const unlocked = next.task.blockers.some((blocker) =>
      completedIds.has(blocker.taskId),
    );
    reservePlanningSlot(freeIntervals, next.slot);
    checklist.push(
      scheduledAction(next.task, next.slot, actionReason(next.task, unlocked)),
    );
    completedIds.add(next.task.id);
    completionTimes.set(next.task.id, next.slot.end);
    remainingMinutes -= estimatedMinutes;
  }

  checklist.sort((left, right) => {
    const byStart = left.scheduledStartAt.localeCompare(right.scheduledStartAt);
    return byStart !== 0 ? byStart : left.id.localeCompare(right.id);
  });

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
    commitments: input.commitments ?? [],
    limit,
    now,
    planningWindowEnd: windowEnd,
    planningWindowStart: windowStart,
    tasks: input.tasks,
  });

  const proposedAiAssistedWork = input.tasks
    .filter((task) => task.executorType === AI_EXECUTOR)
    .filter((task) => isAtomicTask(task) && task.rooted)
    .filter(hasConfirmedCapability)
    .filter((task) => isTimeAvailable(task, now))
    .filter((task) => task.deadlineStatus !== "expired")
    .filter(isSchedulable)
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
      "Calendar commitments reserve time but are not imported as tasks.",
      "Required work due inside the planning window reserves a slot even when its expected-value estimate needs review.",
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
