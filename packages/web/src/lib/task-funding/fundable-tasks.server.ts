import { TaskStatus } from "@optimitron/db";
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
): FundingDenominator | null {
  if (
    task.fundingTarget?.targetAmountCents &&
    task.fundingTarget.targetAmountCents > 0n
  ) {
    return {
      denominatorCents: task.fundingTarget.targetAmountCents,
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
  const value = task.selectedImpactFrame?.expectedEconomicValueUsdBase;
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
