import { getTaskPath } from "@/lib/routes";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
  type TaskAccountabilityLike,
  type TaskDelayStats,
} from "./accountability";

export interface OverdueSignerHighlight {
  taskId: string;
  taskHref: string;
  leaderFirstName: string;
  leaderFullName: string;
  leaderImageUrl: string | null;
  roleTitle: string | null;
  countryLabel: string | null;
  overdueLabel: string;
  deathsFromDelayLabel: string | null;
  wastedUsdLabel: string | null;
}

export interface SignerTaskLike extends TaskAccountabilityLike {
  id: string;
  taskKey: string | null;
  assigneePersonId?: string | null;
  roleTitle?: string | null;
  assigneeAffiliationSnapshot?: string | null;
  assigneePerson?: {
    countryCode?: string | null;
    currentAffiliation?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

function getFirstName(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim() ?? "";
  if (!trimmed) return "them";
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

function compareByDeathsDesc(
  a: { stats: TaskDelayStats },
  b: { stats: TaskDelayStats },
): number {
  const aLives = a.stats.currentHumanLivesLost;
  const bLives = b.stats.currentHumanLivesLost;
  if (aLives != null && bLives != null && aLives !== bLives) {
    return bLives - aLives;
  }
  if (aLives != null && bLives == null) return -1;
  if (aLives == null && bLives != null) return 1;
  return b.stats.currentDelayDays - a.stats.currentDelayDays;
}

function hasAssignedOfficial(task: SignerTaskLike): boolean {
  return Boolean(task.assigneePersonId || task.assigneePerson);
}

function isOverdueAssignedOfficialTask(task: SignerTaskLike, now: Date): boolean {
  if (!hasAssignedOfficial(task)) return false;
  return getTaskDelayStats(task, now).isOverdue;
}

export function countOverdueSigners<T extends SignerTaskLike>(
  decoratedTasks: readonly T[],
  now: Date,
): number {
  let count = 0;
  for (const task of decoratedTasks) {
    if (isOverdueAssignedOfficialTask(task, now)) count += 1;
  }
  return count;
}

export function getOverdueSignerHighlights<T extends SignerTaskLike>(input: {
  decoratedTasks: readonly T[];
  userCountryCode: string | null;
  now: Date;
  limit?: number;
}): OverdueSignerHighlight[] {
  const limit = input.limit ?? 3;
  if (limit <= 0) return [];

  const userCountryLower =
    input.userCountryCode && input.userCountryCode.trim().length > 0
      ? input.userCountryCode.trim().toLowerCase()
      : null;

  const candidates = input.decoratedTasks
    .filter(
      (task): task is T & { assigneePerson: NonNullable<T["assigneePerson"]> } =>
        task.assigneePerson != null && isOverdueAssignedOfficialTask(task, input.now),
    )
    .map((task) => ({ task, stats: getTaskDelayStats(task, input.now) }))
    .filter(({ stats }) => stats.isOverdue);

  const userCountryIndex = userCountryLower
    ? candidates.findIndex(
        ({ task }) => task.assigneePerson?.countryCode?.toLowerCase() === userCountryLower,
      )
    : -1;

  const userCountryEntry = userCountryIndex >= 0 ? candidates[userCountryIndex] : null;
  const rest = userCountryEntry
    ? candidates.filter((_, i) => i !== userCountryIndex)
    : candidates;

  const ordered = [
    ...(userCountryEntry ? [userCountryEntry] : []),
    ...[...rest].sort(compareByDeathsDesc),
  ];

  return ordered.slice(0, limit).map(({ task, stats }) => {
    const assigneePerson = task.assigneePerson!;
    const leaderFullName = assigneePerson.displayName?.trim() || "Unknown leader";
    const countryLabel =
      assigneePerson.currentAffiliation?.trim() ||
      task.assigneeAffiliationSnapshot?.trim() ||
      null;

    return {
      taskId: task.id,
      taskHref: getTaskPath(task.id),
      leaderFirstName: getFirstName(assigneePerson.displayName),
      leaderFullName,
      leaderImageUrl: assigneePerson.image ?? null,
      roleTitle: task.roleTitle?.trim() || null,
      countryLabel,
      overdueLabel: `${formatDelayDuration(stats.currentDelayDays)} overdue`,
      deathsFromDelayLabel:
        stats.currentHumanLivesLost != null && stats.currentHumanLivesLost > 0
          ? formatCompactCount(stats.currentHumanLivesLost)
          : null,
      wastedUsdLabel:
        stats.currentEconomicValueUsdLost != null && stats.currentEconomicValueUsdLost > 0
          ? formatCompactCurrency(stats.currentEconomicValueUsdLost)
          : null,
    };
  });
}
