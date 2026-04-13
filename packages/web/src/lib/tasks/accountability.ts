import { TaskStatus } from "@optimitron/db/enums";
import { getMetricBaseValue, type TaskImpactFrameSummary, type TaskImpactMetricSummary } from "./impact";

const DAY_MS = 1000 * 60 * 60 * 24;
const HOURS_PER_YEAR = 365.25 * 24;

export interface TaskAccountabilityLike {
  completedAt?: Date | null;
  dueAt?: Date | null;
  impact?: {
    selectedFrame?: TaskImpactFrameSummary | null;
    selectedMetrics?: Record<string, TaskImpactMetricSummary> | null;
  } | null;
  status?: TaskStatus | null;
  verifiedAt?: Date | null;
}

export interface TaskDelayStats {
  currentDelayDays: number;
  currentDelayMs: number;
  currentEconomicValueUsdLost: number | null;
  currentHealthyLifeHoursLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
  delayDalysLostPerDay: number | null;
  delayEconomicValueUsdLostPerDay: number | null;
  delayHealthyLifeHoursLostPerDay: number | null;
  delayHumanLivesLostPerDay: number | null;
  delaySufferingHoursLostPerDay: number | null;
  dueAt: Date | null;
  isOverdue: boolean;
  overdueSince: Date | null;
}

export interface TaskAggregateDelayStats {
  currentEconomicValueUsdLost: number | null;
  currentHealthyLifeHoursLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
  overdueTaskCount: number;
  totalTaskCount: number;
  verifiedTaskCount: number;
}

function roundToDay(ms: number) {
  return Math.floor(ms / DAY_MS);
}

function sumNullable(values: Array<number | null | undefined>) {
  const numericValues = values.filter((value): value is number => typeof value === "number");
  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0);
}

function derivePerDayMetric(
  frame: TaskImpactFrameSummary | null | undefined,
  metrics: Record<string, TaskImpactMetricSummary>,
  options: {
    conditionalMetricKey?: string;
    delayMetricKey?: string;
    riskAdjustedMetricKey?: string;
  },
) {
  const explicitDelayMetric = options.delayMetricKey
    ? metrics[options.delayMetricKey]?.baseValue ?? null
    : null;

  if (explicitDelayMetric != null) {
    return explicitDelayMetric;
  }

  const evaluationDays = (frame?.evaluationHorizonYears ?? 0) * 365.25;
  if (evaluationDays <= 0) {
    return null;
  }

  const riskAdjustedValue = options.riskAdjustedMetricKey
    ? metrics[options.riskAdjustedMetricKey]?.baseValue ?? null
    : null;

  if (riskAdjustedValue != null) {
    return riskAdjustedValue / evaluationDays;
  }

  const conditionalValue = options.conditionalMetricKey
    ? metrics[options.conditionalMetricKey]?.baseValue ?? null
    : null;

  if (conditionalValue == null) {
    return null;
  }

  const successProbability = frame?.successProbabilityBase ?? null;
  return (conditionalValue * (successProbability ?? 1)) / evaluationDays;
}

export function getTaskDelayStats(
  task: TaskAccountabilityLike | null | undefined,
  now: Date = new Date(),
): TaskDelayStats {
  const dueAt = task?.dueAt ?? null;
  const resolvedAt = task?.verifiedAt ?? task?.completedAt ?? null;
  const activeUntil = resolvedAt ?? now;
  const currentDelayMs =
    dueAt == null || activeUntil.getTime() <= dueAt.getTime()
      ? 0
      : activeUntil.getTime() - dueAt.getTime();
  const currentDelayDays = roundToDay(currentDelayMs);
  const isOverdue =
    dueAt != null &&
    (task?.status == null || task.status !== TaskStatus.VERIFIED) &&
    currentDelayMs > 0;
  const frame = task?.impact?.selectedFrame ?? null;
  const selectedMetrics = task?.impact?.selectedMetrics ?? {};

  const delayDalysLostPerDay = frame?.delayDalysLostPerDayBase ?? null;
  const delayEconomicValueUsdLostPerDay = frame?.delayEconomicValueUsdLostPerDayBase ?? null;
  const delayHumanLivesLostPerDay = derivePerDayMetric(frame, selectedMetrics, {
    conditionalMetricKey: "lives_saved_if_success",
    riskAdjustedMetricKey: "contribution_lives_saved_per_pct_point",
  });
  const delaySufferingHoursLostPerDay = derivePerDayMetric(frame, selectedMetrics, {
    conditionalMetricKey: "suffering_hours_if_success",
    riskAdjustedMetricKey: "contribution_suffering_hours_per_pct_point",
  });
  const delayHealthyLifeHoursLostPerDay =
    delayDalysLostPerDay == null ? null : delayDalysLostPerDay * HOURS_PER_YEAR;

  return {
    currentDelayDays,
    currentDelayMs,
    currentEconomicValueUsdLost:
      delayEconomicValueUsdLostPerDay == null ? null : delayEconomicValueUsdLostPerDay * currentDelayDays,
    currentHealthyLifeHoursLost:
      delayHealthyLifeHoursLostPerDay == null ? null : delayHealthyLifeHoursLostPerDay * currentDelayDays,
    currentHumanLivesLost:
      delayHumanLivesLostPerDay == null ? null : delayHumanLivesLostPerDay * currentDelayDays,
    currentSufferingHoursLost:
      delaySufferingHoursLostPerDay == null ? null : delaySufferingHoursLostPerDay * currentDelayDays,
    delayDalysLostPerDay,
    delayEconomicValueUsdLostPerDay,
    delayHealthyLifeHoursLostPerDay,
    delayHumanLivesLostPerDay,
    delaySufferingHoursLostPerDay,
    dueAt,
    isOverdue,
    overdueSince: isOverdue ? dueAt : null,
  };
}

export function aggregateTaskDelayStats(
  tasks: TaskAccountabilityLike[],
  now: Date = new Date(),
): TaskAggregateDelayStats {
  const delayStats = tasks.map((task) => getTaskDelayStats(task, now));

  return {
    currentEconomicValueUsdLost: sumNullable(delayStats.map((entry) => entry.currentEconomicValueUsdLost)),
    currentHealthyLifeHoursLost: sumNullable(delayStats.map((entry) => entry.currentHealthyLifeHoursLost)),
    currentHumanLivesLost: sumNullable(delayStats.map((entry) => entry.currentHumanLivesLost)),
    currentSufferingHoursLost: sumNullable(delayStats.map((entry) => entry.currentSufferingHoursLost)),
    overdueTaskCount: delayStats.filter((entry) => entry.isOverdue).length,
    totalTaskCount: tasks.length,
    verifiedTaskCount: tasks.filter((task) => task.status === TaskStatus.VERIFIED).length,
  };
}

export function formatCompactCount(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }

  const absoluteValue = Math.abs(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: absoluteValue >= 1000 ? 1 : 2,
    notation: absoluteValue >= 1000 ? "compact" : "standard",
    ...options,
  }).format(value);
}

export function formatCompactCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumSignificantDigits: 3,
    minimumSignificantDigits: Math.abs(value) >= 1 ? 3 : 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

export function formatDelayDuration(days: number) {
  if (days <= 0) {
    return "on time";
  }

  if (days >= 365) {
    const years = days / 365.25;
    return `${formatCompactCount(years, { maximumFractionDigits: years >= 10 ? 0 : 1 })} years`;
  }

  return `${formatCompactCount(days, { maximumFractionDigits: 0 })} days`;
}

export function buildTaskShareText(input: {
  currentEconomicValueUsdLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
  currentDelayDays: number;
  taskTitle: string;
  targetLabel: string;
}) {
  const delayLabel =
    input.currentDelayDays > 0
      ? `${formatDelayDuration(input.currentDelayDays)} overdue`
      : "still unresolved";
  const parts: string[] = [
    `${input.targetLabel} is ${delayLabel} on "${input.taskTitle}".`,
  ];
  const costParts: string[] = [];
  if (input.currentHumanLivesLost != null && input.currentHumanLivesLost > 0) {
    costParts.push(`${formatCompactCount(input.currentHumanLivesLost)} lives`);
  }
  if (
    input.currentSufferingHoursLost != null &&
    input.currentSufferingHoursLost > 0
  ) {
    costParts.push(`${formatCompactCount(input.currentSufferingHoursLost)} suffering hours`);
  }
  if (
    input.currentEconomicValueUsdLost != null &&
    input.currentEconomicValueUsdLost > 0
  ) {
    costParts.push(formatCompactCurrency(input.currentEconomicValueUsdLost));
  }
  if (costParts.length > 0) {
    parts.push(`Estimated delay cost so far: ${costParts.join(", ")}.`);
  }
  return parts.join(" ");
}

export function getMetricSummary(
  metrics: Record<string, TaskImpactMetricSummary> | null | undefined,
  metricKey: string,
) {
  if (!metrics) {
    return null;
  }

  return metrics[metricKey] ?? null;
}

export function getMetricBase(
  metrics: Record<string, TaskImpactMetricSummary> | null | undefined,
  metricKey: string,
) {
  return getMetricSummary(metrics, metricKey)?.baseValue ?? null;
}

export function getTaskLivesSavedMetric(
  metrics: Record<string, TaskImpactMetricSummary> | null | undefined,
) {
  if (!metrics) {
    return null;
  }

  return (
    getMetricBaseValue(Object.values(metrics), "contribution_lives_saved_per_pct_point") ??
    getMetricBaseValue(Object.values(metrics), "lives_saved_if_success")
  );
}

export function getTaskSufferingHoursMetric(
  metrics: Record<string, TaskImpactMetricSummary> | null | undefined,
) {
  if (!metrics) {
    return null;
  }

  return (
    getMetricBaseValue(Object.values(metrics), "contribution_suffering_hours_per_pct_point") ??
    getMetricBaseValue(Object.values(metrics), "suffering_hours_if_success")
  );
}
