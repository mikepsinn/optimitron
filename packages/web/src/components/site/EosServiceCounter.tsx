import Link from "next/link";
import { FundingTaskCard } from "@/components/task-funding/FundingTaskCard";
import {
  collectFundableTasks,
  getExpectedValueUsd,
  getFundingDenominator,
} from "@/lib/task-funding/fundable-tasks.server";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";
import { getTasksPageData } from "@/lib/tasks.server";
import { ROUTES } from "@/lib/routes";
import {
  COURT_OF_HUMANITY_TASK_KEY,
  DFDA_CREATE_TASK_KEY,
  EARTH_OPTIMIZATION_PRIZE_TASK_KEY,
  LOVING_TAKEOVER_TASK_KEY,
  SHIRT_SEED_TASK_KEY,
  TREATY_PARENT_TASK_KEY,
} from "@/lib/tasks/task-keys";

/**
 * Curated order for the landing-page service counter. Flagship first; every
 * key must exist in the managed optimize-earth task tree.
 */
const SERVICE_TASK_KEYS: readonly string[] = [
  TREATY_PARENT_TASK_KEY,
  COURT_OF_HUMANITY_TASK_KEY,
  DFDA_CREATE_TASK_KEY,
  LOVING_TAKEOVER_TASK_KEY,
  EARTH_OPTIMIZATION_PRIZE_TASK_KEY,
  SHIRT_SEED_TASK_KEY,
];

export async function EosServiceCounter() {
  const data = await getTasksPageData(null);
  const byKey = new Map(
    collectFundableTasks(data).flatMap((task) =>
      task.taskKey ? [[task.taskKey, task] as const] : [],
    ),
  );
  const emptyState = (
    <p className="max-w-3xl text-lg font-bold leading-8">
      The counter is restocking.{" "}
      <Link className="underline underline-offset-4" href={ROUTES.fund}>
        The full price list is here.
      </Link>
    </p>
  );
  const serviceTasks = SERVICE_TASK_KEYS.flatMap((key) => {
    const task = byKey.get(key);
    if (!task) return [];
    return [task];
  });

  if (serviceTasks.length === 0) {
    return emptyState;
  }

  const fundingStatuses = new Map(
    await Promise.all(
      serviceTasks.map(
        async (task) =>
          [
            task.id,
            task.fundingTarget
              ? await getTaskFundingStatus(task.id).catch(() => null)
              : null,
          ] as const,
      ),
    ),
  );
  const services = serviceTasks.flatMap((task) => {
    const denominator = getFundingDenominator(
      task,
      fundingStatuses.get(task.id) ?? null,
    );
    return denominator ? [{ denominator, task }] : [];
  });

  if (services.length === 0) return emptyState;

  return (
    <div className="grid gap-4">
      {services.map(({ denominator, task }) => {
        const expectedValueUsd = getExpectedValueUsd(task);
        const score =
          denominator.denominatorCents > 0n
            ? expectedValueUsd / (Number(denominator.denominatorCents) / 100)
            : 0;

        return (
          <FundingTaskCard
            blurb={task.impactStatement}
            denominatorCents={denominator.denominatorCents}
            expectedValueUsd={expectedValueUsd}
            fundButtonLabel="Get it now"
            funding={fundingStatuses.get(task.id) ?? null}
            fundingSource={denominator.fundingSource}
            key={task.id}
            score={score}
            taskId={task.id}
            title={task.title}
          />
        );
      })}
    </div>
  );
}
