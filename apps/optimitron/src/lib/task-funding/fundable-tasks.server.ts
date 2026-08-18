import { TaskFundingTargetStatus, TaskStatus } from "@optimitron/db";
import type { TaskFundingStatus } from "@/lib/task-funding/status.server";
import type { getTasksPageData } from "@/lib/tasks.server";

/**
 * Shared selection helpers for pages that render fundable tasks (the /fund
 * price list and the landing-page service counter). Extracted from
 * `app/fund/page.tsx` verbatim so both surfaces price tasks identically.
 */

export type TasksPageData = Awaited<ReturnType<typeof getTasksPageData>>;
export type FundingTask = TasksPageData["allTasks"][number];

export interface FundingDenominator {
  denominatorCents: bigint;
  fundingSource: "target" | "compensation";
}

export function getFundingDenominator(
  task: FundingTask,
  funding: TaskFundingStatus | null = null,
): FundingDenominator | null {
  if (task.fundingTarget) {
    if (
      !funding ||
      funding.status !== TaskFundingTargetStatus.OPEN ||
      funding.remainingUsdCents <= 0n
    ) {
      return null;
    }
    return {
      denominatorCents: funding.remainingUsdCents,
      fundingSource: "target",
    };
  }
  if (
    task.compensationMaxAmountMinorUnits &&
    task.compensationMaxAmountMinorUnits > 0n
  ) {
    return {
      denominatorCents: task.compensationMaxAmountMinorUnits,
      fundingSource: "compensation",
    };
  }
  return null;
}

export function getExpectedValueUsd(task: FundingTask) {
  const value = task.marginalImpactFrame?.expectedEconomicValueUsdBase;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function collectFundableTasks(data: TasksPageData) {
  const byId = new Map<string, FundingTask>();
  for (const task of data.topLevelTasks) {
    byId.set(task.id, task);
    for (const child of task.childTasks) {
      byId.set(child.id, child);
    }
  }
  for (const task of data.allTasks) {
    byId.set(task.id, task);
  }
  return Array.from(byId.values()).filter(
    (task) => task.status === TaskStatus.ACTIVE && task.isPublic,
  );
}

export interface RankedFundingTask {
  denominatorCents: bigint;
  expectedValueUsd: number;
  fundingSource: "target" | "compensation";
  score: number;
  task: FundingTask;
}

export function rankFundingTasks(
  tasks: FundingTask[],
  fundingStatuses: ReadonlyMap<string, TaskFundingStatus | null>,
) {
  const byTitle = new Map<string, RankedFundingTask>();
  for (const task of tasks) {
    const denominator = getFundingDenominator(
      task,
      fundingStatuses.get(task.id) ?? null,
    );
    const expectedValueUsd = getExpectedValueUsd(task);
    if (!denominator || expectedValueUsd <= 0) continue;

    const ranked = {
      denominatorCents: denominator.denominatorCents,
      expectedValueUsd,
      fundingSource: denominator.fundingSource,
      score: expectedValueUsd / (Number(denominator.denominatorCents) / 100),
      task,
    } satisfies RankedFundingTask;
    const titleKey = task.title.trim().toLowerCase();
    const existing = byTitle.get(titleKey);
    if (
      !existing ||
      ranked.score > existing.score ||
      (ranked.score === existing.score && task.id < existing.task.id)
    ) {
      byTitle.set(titleKey, ranked);
    }
  }

  return Array.from(byTitle.values()).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.task.title.localeCompare(right.task.title);
  });
}
