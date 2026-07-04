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

/** The treaty vote lives on the campaign domain, not optimitron.com. */
const WAR_ON_DISEASE_URL = "https://warondisease.org";

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
  const services = SERVICE_TASK_KEYS.flatMap((key) => {
    const task = byKey.get(key);
    if (!task) return [];
    const denominator = getFundingDenominator(task);
    if (!denominator) return [];
    return [{ denominator, task }];
  });

  if (services.length === 0) {
    return (
      <p className="max-w-3xl text-lg font-bold leading-8">
        The counter is restocking.{" "}
        <Link className="underline underline-offset-4" href={ROUTES.fund}>
          The full price list is here.
        </Link>
      </p>
    );
  }

  const fundingStatuses = new Map(
    await Promise.all(
      services.map(
        async ({ task }) =>
          [task.id, await getTaskFundingStatus(task.id).catch(() => null)] as const,
      ),
    ),
  );

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
            extraAction={
              task.taskKey === TREATY_PARENT_TASK_KEY ? (
                <a
                  className="inline-flex min-h-10 items-center justify-center border border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
                  href={WAR_ON_DISEASE_URL}
                >
                  Vote yes
                </a>
              ) : undefined
            }
            fundButtonLabel="Fund it"
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
