import { TaskClaimPolicy, TaskStatus } from "@optimitron/db";
import {
  assessTaskCapability,
  type TaskCapabilityAssessment,
} from "@optimitron/agent/task-capability";
import {
  deriveImpactRatios,
  getNormalizedImpactComponents,
  type TaskImpactFrameSummary,
} from "@/lib/tasks/impact";
import { isExecutableWorkItem } from "@/lib/tasks/execution-eligibility";

export interface RankableTask {
  id: string;
  activeClaimCount?: number;
  activeChildTaskCount?: number;
  activeExecutionAttemptCount?: number;
  blockerStatuses?: TaskStatus[];
  claimPolicy: TaskClaimPolicy;
  estimatedEffortHours: number | null;
  estimatedHoursPerWeekMax?: number | null;
  estimatedHoursPerWeekMin?: number | null;
  interestTags: string[];
  executionMode?: string | null;
  maxClaims?: number | null;
  marginalImpactFrame?: TaskImpactFrameSummary | null;
  compensationPaymentRails?: string[] | null;
  preferredAccessTags?: string[] | null;
  preferredCredentialTags?: string[] | null;
  preferredLanguageTags?: string[] | null;
  preferredSkillTags?: string[] | null;
  preferredToolTags?: string[] | null;
  remotePolicy?: string | null;
  requiredAccessTags?: string[] | null;
  requiredCredentialTags?: string[] | null;
  requiredLanguageTags?: string[] | null;
  requiredToolTags?: string[] | null;
  selectedImpactFrame?: TaskImpactFrameSummary | null;
  skillTags: string[];
  status: TaskStatus;
  taskKey?: string | null;
  workLocationCity?: string | null;
  workLocationCountryCode?: string | null;
  workLocationRegionCode?: string | null;
}

export interface RankableUser {
  accessTags?: string[] | null;
  availableHoursPerWeek: number | null;
  city?: string | null;
  countryCode?: string | null;
  credentialTags?: string[] | null;
  interestTags: string[];
  languageTags?: string[] | null;
  preferredPaymentRails?: string[] | null;
  regionCode?: string | null;
  skillTags: string[];
  toolTags?: string[] | null;
  workPreferenceTags?: string[] | null;
}

export interface RankTasksOptions {
  /** When true, return only atomic executable work; parent/listing fallback is forbidden. */
  preferLeafExecution?: boolean;
}

export interface TaskPriorityInput {
  blockerStatuses?: TaskStatus[] | null;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  selectedImpactFrame?: TaskImpactFrameSummary | null;
}

export interface TaskPriorityResult {
  priority: number;
  realEv: number;
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

function resolveEstimatedEffortHours(input: TaskPriorityInput) {
  return finiteNumber(
    input.estimatedEffortHours ??
      input.selectedImpactFrame?.estimatedEffortHoursBase,
  );
}

/**
 * Compute task priority:
 *  Priority = (expected value - cash cost) / (hours + cash cost / buyback rate)
 *
 * expectedEconomicValueUsdBase is already probability-weighted. For personal
 * task inputs that provide gross value + P(success), the MCP layer converts
 * them to expectedEconomicValueUsdBase before this function runs.
 *  denominator = hours + cash / buybackRate.
 */
export function computeTaskPriority(
  task: TaskPriorityInput,
  options?: {
    buybackRate?: number;
  },
): TaskPriorityResult {
  const parsedBuyback = finiteNumber(options?.buybackRate);
  const buybackRate =
    parsedBuyback == null || parsedBuyback <= 0
      ? DEFAULT_BUYBACK_RATE
      : parsedBuyback;
  const blockerStatuses = task.blockerStatuses ?? [];
  const totalBlockers = blockerStatuses.length;
  const resolvedStatuses: Set<TaskStatus> = new Set([TaskStatus.VERIFIED]);
  const resolvedBlockers = blockerStatuses.filter((status) =>
    resolvedStatuses.has(status),
  ).length;
  const estimatedEffortHours = resolveEstimatedEffortHours(task);
  const validationNotes: string[] = [];
  const frame = task.selectedImpactFrame;
  const cashCost = Math.max(
    0,
    finiteNumber(frame?.estimatedCashCostUsdBase) ?? 0,
  );
  const realEv = finiteNumber(frame?.expectedEconomicValueUsdBase) ?? 0;

  if (frame?.expectedEconomicValueUsdBase == null) {
    validationNotes.push("Missing expected economic value estimate.");
  }

  if (estimatedEffortHours == null || estimatedEffortHours <= 0) {
    validationNotes.push("Missing or non-positive estimated effort hours.");
  }

  const effortHours = Math.max(estimatedEffortHours ?? 0, 0);
  const denominator = effortHours + cashCost / buybackRate;
  let valid = true;
  if (denominator <= ZERO_DIVISION_GUARD) {
    valid = false;
    validationNotes.push(
      "Invalid denominator for task priority (hours + cash/buyback too small).",
    );
  }

  const priority = valid ? (realEv - cashCost) / denominator : 0;
  const unblockedBlockers = resolvedBlockers;

  const notePieces = [
    `realEv=${realEv.toFixed(2)}`,
    `cashCost=${cashCost.toFixed(2)}`,
    `hours=${effortHours.toFixed(2)}`,
    `buyback=${buybackRate.toFixed(2)}`,
    `formula=(expectedValue-cashCost)/(hours+cashCost/buybackRate)`,
  ];

  const evMath = `${notePieces.join(", ")} | priority=${priority.toFixed(4)}`;

  return {
    blockersCount: totalBlockers,
    blockersResolved: resolvedBlockers,
    buybackRate,
    evMath,
    priority,
    realEv,
    unblockedBlockers,
    validationNotes,
    valid,
  };
}

function normalizeTags(tags: readonly string[] | null | undefined) {
  return Array.from(
    new Set(
      (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    ),
  );
}

function jaccardScore(
  left: readonly string[] | null | undefined,
  right: readonly string[] | null | undefined,
) {
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

function coverageScore(
  required: readonly string[] | null | undefined,
  available: readonly string[] | null | undefined,
) {
  const requiredTags = normalizeTags(required);
  if (requiredTags.length === 0) {
    return null;
  }

  const availableSet = new Set(normalizeTags(available));
  const matched = requiredTags.filter((tag) => availableSet.has(tag)).length;
  return matched / requiredTags.length;
}

function preferredTagScore(
  preferred: readonly string[] | null | undefined,
  available: readonly string[] | null | undefined,
) {
  const preferredTags = normalizeTags(preferred);
  if (preferredTags.length === 0) {
    return null;
  }

  return coverageScore(preferredTags, available) ?? 0;
}

function requiredPreferredFit(
  required: readonly string[] | null | undefined,
  preferred: readonly string[] | null | undefined,
  available: readonly string[] | null | undefined,
) {
  const requiredScore = coverageScore(required, available);
  const preferredScore = preferredTagScore(preferred, available);

  if (requiredScore != null && preferredScore != null) {
    return requiredScore * 0.75 + preferredScore * 0.25;
  }

  return requiredScore ?? preferredScore;
}

function addWeightedScore(
  scores: Array<{ score: number | null; weight: number }>,
  score: number | null,
  weight: number,
) {
  if (score == null) {
    return;
  }

  scores.push({ score: Math.max(0, Math.min(1, score)), weight });
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

  return Math.max(
    0,
    1 -
      (estimatedEffortHours - availableHoursPerWeek) /
        Math.max(availableHoursPerWeek, 1),
  );
}

function weeklyHoursFitScore(
  minHours: number | null | undefined,
  maxHours: number | null | undefined,
  availableHoursPerWeek: number | null,
) {
  if (minHours == null && maxHours == null) {
    return null;
  }

  if (availableHoursPerWeek == null) {
    return 0.5;
  }

  if (minHours != null && availableHoursPerWeek < minHours) {
    return Math.max(0, availableHoursPerWeek / Math.max(minHours, 1));
  }

  if (maxHours != null && availableHoursPerWeek > maxHours) {
    return Math.max(
      0.5,
      1 - (availableHoursPerWeek - maxHours) / Math.max(maxHours, 1),
    );
  }

  return 1;
}

function locationFitScore(task: RankableTask, user: RankableUser) {
  if (task.remotePolicy === "REMOTE") {
    return 1;
  }

  const hasLocation =
    Boolean(task.workLocationCountryCode) ||
    Boolean(task.workLocationRegionCode) ||
    Boolean(task.workLocationCity);
  if (!hasLocation) {
    return null;
  }

  let score = 0;
  let weight = 0;

  if (task.workLocationCountryCode) {
    weight += 0.3;
    score +=
      task.workLocationCountryCode.toLowerCase() ===
      user.countryCode?.toLowerCase()
        ? 0.3
        : 0;
  }

  if (task.workLocationRegionCode) {
    weight += 0.3;
    score +=
      task.workLocationRegionCode.toLowerCase() ===
      user.regionCode?.toLowerCase()
        ? 0.3
        : 0;
  }

  if (task.workLocationCity) {
    weight += 0.4;
    score +=
      task.workLocationCity.toLowerCase() === user.city?.toLowerCase()
        ? 0.4
        : 0;
  }

  if (weight === 0) {
    return null;
  }

  const normalized = score / weight;
  return task.remotePolicy === "HYBRID"
    ? Math.max(0.25, normalized)
    : normalized;
}

function paymentRailFitScore(task: RankableTask, user: RankableUser) {
  const rails = normalizeTags(task.compensationPaymentRails);
  if (rails.length === 0) {
    return null;
  }

  return coverageScore(rails, user.preferredPaymentRails) ?? 0;
}

function scoreWeightedComponents(
  scores: Array<{ score: number; weight: number }>,
) {
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return 0.5;
  }

  return (
    scores.reduce((sum, item) => sum + item.score * item.weight, 0) /
    totalWeight
  );
}

export function isTaskClaimable(
  task: Pick<RankableTask, "claimPolicy" | "status">,
) {
  return (
    task.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY &&
    task.status === TaskStatus.ACTIVE
  );
}

export function canTaskAcceptMoreClaims(task: Omit<RankableTask, "id">) {
  if (!isTaskClaimable(task)) {
    return false;
  }

  const activeClaimCount = task.activeClaimCount ?? 0;

  if (task.claimPolicy === TaskClaimPolicy.OPEN_SINGLE) {
    return activeClaimCount === 0;
  }

  if (
    task.claimPolicy === TaskClaimPolicy.OPEN_MANY &&
    task.maxClaims != null
  ) {
    return activeClaimCount < task.maxClaims;
  }

  return true;
}

const RESOLVED_STATUSES = new Set<TaskStatus>([TaskStatus.VERIFIED]);

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

export function hasActiveChildTasks(
  task: Pick<RankableTask, "activeChildTaskCount">,
) {
  return (task.activeChildTaskCount ?? 0) > 0;
}

export function isAtomicExecutionTask(
  task: Pick<
    RankableTask,
    "activeChildTaskCount" | "activeExecutionAttemptCount" | "id" | "taskKey"
  >,
) {
  return isExecutableWorkItem(task);
}

function getExecutionImpactFrame(task: RankableTask) {
  return task.marginalImpactFrame ?? task.selectedImpactFrame ?? null;
}

export function scoreTaskForUser(task: RankableTask, user: RankableUser) {
  if (assessTaskForUserCapability(task, user).status !== "eligible") {
    return 0;
  }

  const skillScore =
    requiredPreferredFit(
      task.skillTags,
      task.preferredSkillTags,
      user.skillTags,
    ) ?? 1;
  const interestScore =
    task.interestTags.length === 0
      ? 1
      : jaccardScore(task.interestTags, user.interestTags);
  const effortScore = hoursFitScore(
    task.estimatedEffortHours,
    user.availableHoursPerWeek,
  );
  const baseFitScore =
    0.6 * skillScore + 0.3 * interestScore + 0.1 * effortScore;
  const fitComponents: Array<{ score: number; weight: number }> = [];
  addWeightedScore(fitComponents, baseFitScore, 0.45);
  addWeightedScore(
    fitComponents,
    requiredPreferredFit(
      task.requiredCredentialTags,
      task.preferredCredentialTags,
      user.credentialTags,
    ),
    0.15,
  );
  addWeightedScore(
    fitComponents,
    requiredPreferredFit(
      task.requiredLanguageTags,
      task.preferredLanguageTags,
      user.languageTags,
    ),
    0.1,
  );
  addWeightedScore(
    fitComponents,
    requiredPreferredFit(
      task.requiredToolTags,
      task.preferredToolTags,
      user.toolTags,
    ),
    0.1,
  );
  addWeightedScore(
    fitComponents,
    requiredPreferredFit(
      task.requiredAccessTags,
      task.preferredAccessTags,
      user.accessTags,
    ),
    0.08,
  );
  addWeightedScore(fitComponents, locationFitScore(task, user), 0.06);
  addWeightedScore(fitComponents, paymentRailFitScore(task, user), 0.04);
  addWeightedScore(
    fitComponents,
    weeklyHoursFitScore(
      task.estimatedHoursPerWeekMin,
      task.estimatedHoursPerWeekMax,
      user.availableHoursPerWeek,
    ),
    0.02,
  );
  const fitScore = scoreWeightedComponents(fitComponents);
  const impactScore = scoreImpactFrame(getExecutionImpactFrame(task));
  const capabilityMultiplier = 0.65 + 0.35 * fitScore;

  return impactScore * capabilityMultiplier;
}

export function assessTaskForUserCapability(
  task: RankableTask,
  user: RankableUser,
): TaskCapabilityAssessment {
  return assessTaskCapability({
    executor: {
      accessTags: user.accessTags,
      credentialTags: user.credentialTags,
      executorKind: "human",
      languageTags: user.languageTags,
      skillTags: user.skillTags,
      toolTags: user.toolTags,
    },
    task,
  });
}

export function scoreTaskForAccountability(task: RankableTask) {
  return scoreImpactFrame(task.selectedImpactFrame ?? null);
}

function scoreImpactFrame(frame: TaskImpactFrameSummary | null) {
  if (!frame) {
    return 0;
  }

  const ratios = deriveImpactRatios(frame);
  const { actorHourComponent, delayComponent } =
    getNormalizedImpactComponents(frame);
  const valuePerDollarComponent =
    ratios.expectedValuePerDollar == null
      ? 0
      : Math.min(1, Math.log10(ratios.expectedValuePerDollar + 1) / 8);

  return (
    actorHourComponent * 0.45 +
    delayComponent * 0.45 +
    valuePerDollarComponent * 0.1
  );
}

export function rankTasksForUser<T extends RankableTask>(
  tasks: T[],
  user: RankableUser,
  limit = 20,
  options?: RankTasksOptions,
) {
  const actionableTasks = tasks.filter(
    (task) =>
      canTaskAcceptMoreClaims(task) &&
      !isTaskBlocked(task) &&
      assessTaskForUserCapability(task, user).status === "eligible",
  );
  const executionPool =
    options?.preferLeafExecution === true
      ? actionableTasks.filter(isAtomicExecutionTask)
      : actionableTasks;
  const selectionPool = executionPool;

  return selectionPool
    .map((task) => {
      const priority = computeTaskPriority({
        blockerStatuses: task.blockerStatuses,
        estimatedEffortHours: task.estimatedEffortHours,
        selectedImpactFrame: getExecutionImpactFrame(task),
      });
      return {
        fitScore: scoreTaskForUser(task, user),
        score: priority.priority,
        task,
        valid: priority.valid,
      };
    })
    .filter(({ score, valid }) => valid && score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.fitScore !== left.fitScore) {
        return right.fitScore - left.fitScore;
      }

      const rightValuePerHour =
        deriveImpactRatios(getExecutionImpactFrame(right.task))
          .expectedValuePerHourUsd ?? 0;
      const leftValuePerHour =
        deriveImpactRatios(getExecutionImpactFrame(left.task))
          .expectedValuePerHourUsd ?? 0;
      if (rightValuePerHour !== leftValuePerHour) {
        return rightValuePerHour - leftValuePerHour;
      }

      return left.task.id.localeCompare(right.task.id);
    })
    .slice(0, limit);
}
