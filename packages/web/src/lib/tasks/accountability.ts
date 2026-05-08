import { TaskStatus } from "@optimitron/db/enums";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  GLOBAL_MILITARY_USD,
  getSignerDelayAttribution,
} from "./delay-attribution";
import { getMetricBaseValue, type TaskImpactFrameSummary, type TaskImpactMetricSummary } from "./impact";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getMilitaryToGovernmentClinicalTrialRatio } from "@optimitron/data/datasets/government-spending-ratios";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_DISEASE_DEATHS_DAILY,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";
import { MILITARY_SPENDING_SYNONYMS } from "@/lib/messaging";
import { getCountryName } from "@/lib/geo";
import type { ShareTokenKey } from "@/lib/tasks/share-templates";

const DAY_MS = 1000 * 60 * 60 * 24;
const HOURS_PER_YEAR = 365.25 * 24;

export interface TaskAccountabilityLike {
  completedAt?: Date | string | null;
  dueAt?: Date | string | null;
  impact?: {
    selectedFrame?: TaskImpactFrameSummary | null;
    selectedMetrics?: Record<string, TaskImpactMetricSummary> | null;
  } | null;
  status?: TaskStatus | null;
  verifiedAt?: Date | string | null;
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

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
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
  const dueAt = normalizeDate(task?.dueAt);
  const resolvedAt = normalizeDate(task?.verifiedAt) ?? normalizeDate(task?.completedAt);
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
    const yearsRounded = Number(
      years.toFixed(years >= 10 ? 0 : 1),
    );
    return `${formatCompactCount(years, { maximumFractionDigits: years >= 10 ? 0 : 1 })} ${yearsRounded === 1 ? "year" : "years"}`;
  }

  const rounded = Math.round(days);
  return `${formatCompactCount(days, { maximumFractionDigits: 0 })} ${rounded === 1 ? "day" : "days"}`;
}

export interface TaskShareTokenInput {
  /** Display name of the assignee — leader or org. */
  targetLabel: string;
  taskTitle: string;
  currentDelayDays: number;
  currentEconomicValueUsdLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost?: number | null;
  /**
   * Assignee's country, ISO 3166-1 alpha-2. Used to look up the full country
   * name for the template. Leave null for non-signer tasks.
   */
  countryCode?: string | null;
  /**
   * Annual military budget in USD. Drives the per-signer attribution share
   * (country's military / global military). Null for non-signer tasks → no
   * attribution, tokens fall back to the treaty-wide numbers.
   */
  militaryBudgetUsdPerYear?: number | null;
  /**
   * Total general-government expenditure in USD/yr. Source of truth for
   * `government_spending_ytd`. Includes transfers, subsidies, debt service —
   * the full size of what the administration is burning through, not just
   * tax revenue. Null → token renders empty and the templates requiring it
   * are filtered out of the picker.
   */
  governmentBudgetUsdPerYear?: number | null;
  /** X/Twitter handle (without the `@`), or the Optimitron handle as fallback. */
  leaderHandle?: string | null;
  /** Viewer-facing name ("Your employer,\n{citizen_name}"). Defaults to "A citizen". */
  citizenName?: string | null;
  /** Now, overridable for tests. Defaults to `new Date()`. */
  now?: Date;
  /** Full treaty URL with referral param. Defaults to warondisease.org/treaty. */
  treatyUrl?: string;
}

/** Zero-based index among the six templates → 1st/2nd reminder suffix. */
function yearToDateFraction(now: Date): number {
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
  const msInYear = Date.UTC(now.getUTCFullYear() + 1, 0, 1) - yearStart;
  const elapsed = now.getTime() - yearStart;
  return Math.max(0, Math.min(1, elapsed / msInYear));
}

/**
 * Build the flat token bag consumed by share-text templates. Missing inputs
 * produce empty strings — templates silently render `""` and the picker
 * filters out variants whose required tokens aren't all set.
 */
export function buildTaskShareTokens(
  input: TaskShareTokenInput,
): Record<ShareTokenKey, string> {
  const now = input.now ?? new Date();
  const delayDays = Math.max(0, input.currentDelayDays);

  const share =
    input.militaryBudgetUsdPerYear != null && input.militaryBudgetUsdPerYear > 0
      ? input.militaryBudgetUsdPerYear / GLOBAL_MILITARY_USD
      : null;

  const attribution =
    input.militaryBudgetUsdPerYear != null
      ? getSignerDelayAttribution(input.militaryBudgetUsdPerYear, delayDays)
      : null;

  const deathsFromDelay =
    attribution?.deathsFromDelay ??
    (input.currentHumanLivesLost != null && input.currentHumanLivesLost > 0
      ? input.currentHumanLivesLost
      : null);

  const moneyWasted =
    attribution?.wastedUsd ??
    (input.currentEconomicValueUsdLost != null && input.currentEconomicValueUsdLost > 0
      ? input.currentEconomicValueUsdLost
      : null);

  const deathsPerDay =
    share != null ? DAILY_DISEASE_DEATHS * share : DAILY_DISEASE_DEATHS;
  const usdPerDay =
    share != null ? DAILY_DISEASE_COST_USD * share : DAILY_DISEASE_COST_USD;

  const governmentSpendingYtd =
    input.governmentBudgetUsdPerYear != null && input.governmentBudgetUsdPerYear > 0
      ? input.governmentBudgetUsdPerYear * yearToDateFraction(now)
      : null;

  const country = getCountryName(input.countryCode);

  const leaderHandle = (input.leaderHandle ?? "").replace(/^@/, "").trim();

  // Per-country military-to-clinical-trials spending ratio (e.g. ~1,093:1 for US)
  const govMetrics = input.countryCode
    ? getGovernmentMetrics(input.countryCode)
    : undefined;
  const milToTrialsRatio = govMetrics
    ? getMilitaryToGovernmentClinicalTrialRatio(govMetrics)
    : null;

  // Random synonym for "military spending" — varies per render so
  // shares from the same task don't all look identical on social feeds.
  const milSynonym =
    MILITARY_SPENDING_SYNONYMS[
      Math.floor(Math.random() * MILITARY_SPENDING_SYNONYMS.length)
    ] ?? "military spending";

  return {
    leader_name: input.targetLabel,
    target_name: input.targetLabel,
    country,
    leader_handle: leaderHandle,
    citizen_name: input.citizenName?.trim() || "A citizen",
    mil_synonym: milSynonym,
    task_title: input.taskTitle,
    treaty_url: input.treatyUrl || "warondisease.org/treaty",
    days_overdue: delayDays > 0 ? delayDays.toLocaleString("en-US") : "",
    deaths_from_delay:
      deathsFromDelay != null ? formatCompactCount(deathsFromDelay) : "",
    mil_to_trials_ratio:
      milToTrialsRatio != null
        ? `${Math.round(milToTrialsRatio).toLocaleString("en-US")}`
        : "",
    mil_budget_pct:
      milToTrialsRatio != null
        ? `${(100 * milToTrialsRatio / (1 + milToTrialsRatio)).toFixed(1)}%`
        : "",
    trials_budget_pct:
      milToTrialsRatio != null
        ? `${(100 / (1 + milToTrialsRatio)).toFixed(1)}%`
        : "",
    money_wasted: moneyWasted != null ? formatCompactCurrency(moneyWasted) : "",
    deaths_per_day: formatCompactCount(deathsPerDay),
    money_wasted_per_day: formatCompactCurrency(usdPerDay),
    government_spending_ytd:
      governmentSpendingYtd != null
        ? formatCompactCurrency(governmentSpendingYtd)
        : "",
    eradication_years_status_quo: Math.round(
      STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
    ).toString(),
    eradication_years_treaty: Math.round(
      DFDA_QUEUE_CLEARANCE_YEARS.value,
    ).toString(),
    trial_capacity_multiplier: DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1),
    daily_disease_deaths: new Intl.NumberFormat("en-US").format(
      Math.round(GLOBAL_DISEASE_DEATHS_DAILY.value),
    ),
    lifetime_income_gain: formatCompactCurrency(
      TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value,
    ),
    treaty_hale_gain: TREATY_HALE_GAIN_YEAR_15.value.toFixed(1),
  };
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
