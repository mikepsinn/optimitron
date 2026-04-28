import {
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import {
  deriveImpactRatios,
  getNormalizedImpactComponents,
  type TaskImpactFrameSummary,
} from "@/lib/tasks/impact";

export interface RankableTask {
  activeClaimCount?: number;
  activeChildTaskCount?: number;
  blockerStatuses?: TaskStatus[];
  claimPolicy: TaskClaimPolicy;
  difficulty: TaskDifficulty;
  estimatedEffortHours: number | null;
  interestTags: string[];
  maxClaims?: number | null;
  selectedImpactFrame?: TaskImpactFrameSummary | null;
  skillTags: string[];
  status: TaskStatus;
}

export interface RankableUser {
  availableHoursPerWeek: number | null;
  interestTags: string[];
  maxTaskDifficulty: TaskDifficulty | null;
  skillTags: string[];
}

export interface RankTasksOptions {
  preferLeafExecution?: boolean;
}

export interface SprintPriorityInput {
  blockerStatuses?: TaskStatus[] | null;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  selectedImpactFrame?: TaskImpactFrameSummary | null;
}

export interface SprintPriorityResult {
  sprintPriority: number;
  realEv: number;
  timeDiscount: number;
  deadlineUrgency: number;
  buybackRate: number;
  blockersCount: number;
  unblockedBlockers: number;
  blockersResolved: number;
  evMath: string;
  valid: boolean;
  validationNotes: string[];
}

const DEFAULT_BUYBACK_RATE = 1000;
const ZERO_DIVISION_GUARD = 0.0001;

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp01(value: number | null) {
  if (value == null) return null;
  if (Number.isNaN(value)) return null;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function resolveDaysToValue(input: SprintPriorityInput) {
  if (input.selectedImpactFrame?.timeToImpactStartDays != null) {
    const days = finiteNumber(input.selectedImpactFrame.timeToImpactStartDays);
    if (days != null) {
      return Math.max(0, days);
    }
  }

  if (!input.dueAt) {
    return null;
  }

  if (input.dueAt instanceof Date) {
    const ms = input.dueAt.getTime() - Date.now();
    return ms / (1000 * 60 * 60 * 24);
  }

  if (typeof input.dueAt === "string" && input.dueAt.length > 0) {
    const parsed = Date.parse(input.dueAt);
    if (Number.isFinite(parsed)) {
      return (parsed - Date.now()) / (1000 * 60 * 60 * 24);
    }
  }

  return null;
}

function computeTimeDiscount(daysToValue: number | null) {
  if (daysToValue == null) return 1;
  if (daysToValue <= 90) return 1;
  if (daysToValue <= 180) return 0.75;
  if (daysToValue <= 365) return 0.5;
  return 0.25;
}

function computeDeadlineUrgency(dueAt: Date | string | null | undefined) {
  if (!dueAt) return 1;

  let dueMs = null;
  if (dueAt instanceof Date) {
    dueMs = dueAt.getTime();
  } else if (typeof dueAt === "string" && dueAt.trim().length > 0) {
    dueMs = Date.parse(dueAt);
  }

  if (!dueMs || !Number.isFinite(dueMs)) return 1;

  const daysToDeadline = (dueMs - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysToDeadline <= 7) return 3;
  if (daysToDeadline <= 14) return 2;
  return 1;
}

function resolveEstimatedEffortHours(input: SprintPriorityInput) {
  return finiteNumber(
    input.estimatedEffortHours ?? input.selectedImpactFrame?.estimatedEffortHoursBase,
  );
}

function computeRealEv(input: SprintPriorityInput, notes: string[]) {
  const frame = input.selectedImpactFrame;
  const frameEv = finiteNumber(frame?.expectedEconomicValueUsdBase);
  if (frameEv != null && frameEv > 0) {
    return frameEv;
  }

  const frameSuccess = clamp01(finiteNumber(frame?.successProbabilityBase));
  const grossEv = finiteNumber(input.selectedImpactFrame?.expectedEconomicValueUsdBase) ?? 0;
  if (grossEv > 0) {
    if (frameSuccess == null) {
      notes.push("Missing success probability; using conservative success default 0.6.");
      return grossEv * 0.6;
    }
    return grossEv * (frameSuccess ?? 0.6);
  }

  notes.push("Missing expected economic value estimate.");
  return 0;
}

/**
 * Compute the minimal-change sprint-priority score:
 *  Net EV per hour × Time Discount × Deadline Urgency
 *  where Net EV = (Real EV - cash cost) and
 *  denominator = hours + cash / buybackRate.
 */
export function computeSprintPriority(
  task: SprintPriorityInput,
  options?: {
    buybackRate?: number;
  },
): SprintPriorityResult {
  const parsedBuyback = finiteNumber(options?.buybackRate);
  const buybackRate = parsedBuyback == null || parsedBuyback <= 0 ? DEFAULT_BUYBACK_RATE : parsedBuyback;
  const blockerStatuses = task.blockerStatuses ?? [];
  const totalBlockers = blockerStatuses.length;
  const resolvedStatuses: Set<TaskStatus> = new Set([TaskStatus.VERIFIED]);
  const resolvedBlockers = blockerStatuses.filter((status) =>
    resolvedStatuses.has(status),
  ).length;
  const daysToValue = resolveDaysToValue(task);
  const timeDiscount = computeTimeDiscount(daysToValue);
  const deadlineUrgency = computeDeadlineUrgency(task.dueAt);
  const estimatedEffortHours = resolveEstimatedEffortHours(task);
  const validationNotes: string[] = [];
  const frame = task.selectedImpactFrame;
  const cashCost = Math.max(0, finiteNumber(frame?.estimatedCashCostUsdBase) ?? 0);
  const realEv = computeRealEv(task, validationNotes);

  if (estimatedEffortHours == null || estimatedEffortHours <= 0) {
    validationNotes.push("Missing or non-positive estimated effort hours.");
  }

  const effortHours = Math.max(estimatedEffortHours ?? 0, 0);
  const denominator = effortHours + cashCost / buybackRate;
  let valid = true;
  if (denominator <= ZERO_DIVISION_GUARD) {
    valid = false;
    validationNotes.push("Invalid denominator for priority (hours + cash/buyback too small).");
  }

  const sprintPriority = valid ? (realEv - cashCost) / denominator * timeDiscount * deadlineUrgency : 0;
  const unblockedBlockers = resolvedBlockers;

  const notePieces = [
    `realEv=${realEv.toFixed(2)}`,
    `cashCost=${cashCost.toFixed(2)}`,
    `hours=${effortHours.toFixed(2)}`,
    `buyback=${buybackRate.toFixed(2)}`,
    `timeDiscount=${timeDiscount.toFixed(2)}`,
    `deadlineUrgency=${deadlineUrgency.toFixed(2)}`,
  ];

  const evMath = `${notePieces.join(", ")} | score=${sprintPriority.toFixed(4)}`;

  return {
    blockersCount: totalBlockers,
    blockersResolved: resolvedBlockers,
    buybackRate,
    deadlineUrgency,
    evMath,
    realEv,
    sprintPriority,
    timeDiscount,
    unblockedBlockers,
    validationNotes,
    valid,
  };
}

const DIFFICULTY_ORDER: TaskDifficulty[] = [
  TaskDifficulty.TRIVIAL,
  TaskDifficulty.BEGINNER,
  TaskDifficulty.INTERMEDIATE,
  TaskDifficulty.ADVANCED,
  TaskDifficulty.EXPERT,
];

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function jaccardScore(left: string[], right: string[]) {
  const leftSet = new Set(normalizeTags(left));
  const rightSet = new Set(normalizeTags(right));

  if (!leftSet.size && !rightSet.size) {
    return 0.5;
  }

  const union = new Set([...leftSet, ...rightSet]);
  let intersectionCount = 0;

  for (const value of leftSet) {
    if (rightSet.has(value)) {
      intersectionCount += 1;
    }
  }

  return union.size === 0 ? 0 : intersectionCount / union.size;
}

export function difficultyFitScore(
  taskDifficulty: TaskDifficulty,
  maxTaskDifficulty: TaskDifficulty | null,
) {
  if (!maxTaskDifficulty) {
    return 0.5;
  }

  const taskIndex = DIFFICULTY_ORDER.indexOf(taskDifficulty);
  const userIndex = DIFFICULTY_ORDER.indexOf(maxTaskDifficulty);

  if (taskIndex <= userIndex) {
    return 1 - Math.max(0, userIndex - taskIndex) * 0.1;
  }

  const overshoot = taskIndex - userIndex;
  return Math.max(0, 0.4 - overshoot * 0.2);
}

export function hoursFitScore(
  estimatedEffortHours: number | null,
  availableHoursPerWeek: number | null,
) {
  if (estimatedEffortHours == null || availableHoursPerWeek == null) {
    return 0.5;
  }

  if (estimatedEffortHours <= availableHoursPerWeek) {
    return 1;
  }

  return Math.max(0, 1 - (estimatedEffortHours - availableHoursPerWeek) / Math.max(availableHoursPerWeek, 1));
}

export function isTaskClaimable(task: Pick<RankableTask, "claimPolicy" | "status">) {
  return (
    task.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY &&
    task.status === TaskStatus.ACTIVE
  );
}

export function canTaskAcceptMoreClaims(task: RankableTask) {
  if (!isTaskClaimable(task)) {
    return false;
  }

  const activeClaimCount = task.activeClaimCount ?? 0;

  if (task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE) {
    return activeClaimCount === 0;
  }

  if (task.claimPolicy === TaskClaimPolicy.OPEN_MANY && task.maxClaims != null) {
    return activeClaimCount < task.maxClaims;
  }

  return true;
}

const RESOLVED_STATUSES = new Set<TaskStatus>([
  TaskStatus.VERIFIED,
]);

/**
 * A task is blocked if any of its blocker/dependency tasks are not yet
 * completed or verified.
 */
export function isTaskBlocked(task: Pick<RankableTask, "blockerStatuses">) {
  const statuses = task.blockerStatuses;
  if (!statuses || statuses.length === 0) {
    return false;
  }
  return statuses.some((s) => !RESOLVED_STATUSES.has(s));
}

/**
 * Fraction of blockers that are resolved (0 = fully blocked, 1 = unblocked).
 * Tasks with no blockers return 1.
 */
export function blockerProgress(task: Pick<RankableTask, "blockerStatuses">) {
  const statuses = task.blockerStatuses;
  if (!statuses || statuses.length === 0) {
    return 1;
  }
  const resolved = statuses.filter((s) => RESOLVED_STATUSES.has(s)).length;
  return resolved / statuses.length;
}

export function hasActiveChildTasks(task: Pick<RankableTask, "activeChildTaskCount">) {
  return (task.activeChildTaskCount ?? 0) > 0;
}

export function scoreTaskForUser(task: RankableTask, user: RankableUser) {
  const skillScore = jaccardScore(task.skillTags, user.skillTags);
  const interestScore = jaccardScore(task.interestTags, user.interestTags);
  const difficultyScore = difficultyFitScore(task.difficulty, user.maxTaskDifficulty);
  const effortScore = hoursFitScore(task.estimatedEffortHours, user.availableHoursPerWeek);
  const fitScore =
    0.5 * skillScore +
    0.3 * interestScore +
    0.15 * difficultyScore +
    0.05 * effortScore;
  const impactScore = scoreTaskForAccountability(task);
  const capabilityMultiplier = 0.65 + 0.35 * fitScore;

  return impactScore * capabilityMultiplier;
}

export function scoreTaskForAccountability(task: RankableTask) {
  const frame = task.selectedImpactFrame;
  if (!frame) {
    return 0;
  }

  const ratios = deriveImpactRatios(frame);
  const { actorHourComponent, delayComponent } = getNormalizedImpactComponents(frame);
  const valuePerDollarComponent =
    ratios.expectedValuePerDollar == null
      ? 0
      : Math.min(1, Math.log10(ratios.expectedValuePerDollar + 1) / 8);

  return actorHourComponent * 0.45 + delayComponent * 0.45 + valuePerDollarComponent * 0.1;
}

export function rankTasksForUser<T extends RankableTask>(
  tasks: T[],
  user: RankableUser,
  limit = 20,
  options?: RankTasksOptions,
) {
  const actionableTasks = tasks.filter(
    (task) => canTaskAcceptMoreClaims(task) && !isTaskBlocked(task),
  );
  const executionPool =
    options?.preferLeafExecution === true
      ? actionableTasks.filter((task) => !hasActiveChildTasks(task))
      : actionableTasks;
  const selectionPool =
    options?.preferLeafExecution === true && executionPool.length > 0
      ? executionPool
      : actionableTasks;

  return selectionPool
    .map((task) => ({
      score: scoreTaskForUser(task, user),
      task,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightAccountability = scoreTaskForAccountability(right.task);
      const leftAccountability = scoreTaskForAccountability(left.task);
      if (rightAccountability !== leftAccountability) {
        return rightAccountability - leftAccountability;
      }

      const rightValuePerHour =
        deriveImpactRatios(right.task.selectedImpactFrame).expectedValuePerHourUsd ?? 0;
      const leftValuePerHour =
        deriveImpactRatios(left.task.selectedImpactFrame).expectedValuePerHourUsd ?? 0;
      return rightValuePerHour - leftValuePerHour;
    })
    .slice(0, limit);
}
