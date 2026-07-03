import Link from "next/link";
import { TaskStatus } from "@optimitron/db";
import { getRouteMetadata } from "@/lib/metadata";
import { fundLink, getTaskPath, ROUTES } from "@/lib/routes";
import { getTasksPageData } from "@/lib/tasks.server";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";

export const metadata = getRouteMetadata(fundLink);

type TasksPageData = Awaited<ReturnType<typeof getTasksPageData>>;
type FundingTask = TasksPageData["allTasks"][number];

interface RankedFundingTask {
  denominatorCents: bigint;
  expectedValueUsd: number;
  fundingSource: "target" | "compensation";
  score: number;
  task: FundingTask;
}

function formatUsdCents(cents: bigint | number) {
  const dollars =
    typeof cents === "bigint" ? Number(cents) / 100 : Number(cents) / 100;
  if (!Number.isFinite(dollars)) return "$0";

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: dollars >= 1000 ? 0 : 2,
    notation: dollars >= 100_000 ? "compact" : "standard",
    style: "currency",
  }).format(dollars);
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    notation: value >= 100_000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function formatRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Unranked";
  return `${formatUsd(value)} expected per $1`;
}

function formatPercent(percent: number) {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent >= 100) return "100%";
  return `${percent < 1 ? "<1" : Math.round(percent)}%`;
}

function getFundingDenominator(task: FundingTask): Pick<
  RankedFundingTask,
  "denominatorCents" | "fundingSource"
> | null {
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

function getExpectedValueUsd(task: FundingTask) {
  const value = task.selectedImpactFrame?.expectedEconomicValueUsdBase;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function collectFundableTasks(data: TasksPageData) {
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

function dedupeRankedTasks(tasks: RankedFundingTask[]) {
  const byTitle = new Map<string, RankedFundingTask>();
  for (const task of tasks) {
    const key = task.task.title.trim().toLowerCase();
    const existing = byTitle.get(key);
    if (
      !existing ||
      task.score > existing.score ||
      (task.score === existing.score &&
        task.task.id.localeCompare(existing.task.id) < 0)
    ) {
      byTitle.set(key, task);
    }
  }
  return Array.from(byTitle.values());
}

function rankFundingTasks(tasks: FundingTask[]) {
  const ranked = tasks
    .flatMap((task): RankedFundingTask[] => {
      const denominator = getFundingDenominator(task);
      const expectedValueUsd = getExpectedValueUsd(task);
      if (
        !denominator ||
        denominator.denominatorCents <= 0n ||
        expectedValueUsd <= 0
      ) {
        return [];
      }
      return [
        {
          denominatorCents: denominator.denominatorCents,
          expectedValueUsd,
          fundingSource: denominator.fundingSource,
          score:
            expectedValueUsd / (Number(denominator.denominatorCents) / 100),
          task,
        },
      ];
    });

  return dedupeRankedTasks(ranked)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.task.title.localeCompare(right.task.title);
    });
}

export default async function FundPage() {
  const data = await getTasksPageData(null);
  const rankedTasks = rankFundingTasks(collectFundableTasks(data)).slice(0, 12);
  const fundingStatuses = new Map(
    await Promise.all(
      rankedTasks.map(async ({ task }) => [
        task.id,
        await getTaskFundingStatus(task.id).catch(() => null),
      ] as const),
    ),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Now accepting contributions
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              Live on a planet without war and disease
            </h1>
            <p className="text-base font-bold leading-relaxed text-muted-foreground sm:text-lg">
              Here is the price list. Every task below is a bottleneck between
              you and that planet, ranked by how much each dollar moves us
              there. Fund one — your money stays pinned to that exact work and
              pays the worker the second a claim is verified. Nothing proven,
              nothing paid.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                href={ROUTES.tasks}
              >
                Browse every task
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center border border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
                href={ROUTES.prize}
              >
                Fund the prize
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {rankedTasks.length > 0 ? (
          <div className="grid gap-4">
            {rankedTasks.map((rankedTask, index) => {
              const {
                denominatorCents,
                expectedValueUsd,
                fundingSource,
                score,
                task,
              } = rankedTask;
              const funding = fundingStatuses.get(task.id);
              const percent =
                funding && funding.targetUsdCents > 0n
                  ? Math.min(100, funding.percentToTarget)
                  : 0;

              return (
                <article
                  className="grid gap-4 border border-foreground p-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
                  key={task.id}
                >
                  <div className="flex size-12 items-center justify-center border border-foreground text-lg font-black">
                    {index + 1}
                  </div>
                  <div className="min-w-0 space-y-4">
                    <div>
                      <h2 className="text-xl font-black leading-tight">
                        <Link
                          className="underline-offset-4 hover:underline"
                          href={`${getTaskPath(task.id)}#funding`}
                        >
                          {task.title}
                        </Link>
                      </h2>
                      <dl className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.12em]">
                            Return per $1
                          </dt>
                          <dd className="text-foreground">
                            {formatRatio(score)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.12em]">
                            Task value
                          </dt>
                          <dd className="text-foreground">
                            {formatUsd(expectedValueUsd)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-black uppercase tracking-[0.12em]">
                            {fundingSource === "target"
                              ? "Funding goal"
                              : "Worker payout"}
                          </dt>
                          <dd className="text-foreground">
                            {formatUsdCents(denominatorCents)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <div className="h-2 border border-foreground">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                        {funding
                          ? `${formatUsdCents(funding.committedUsdCents)} committed - ${formatPercent(percent)}`
                          : "Pays a verified worker after completion"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start sm:col-start-2 lg:col-start-auto lg:justify-end">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                      href={`${getTaskPath(task.id)}#funding`}
                    >
                      Fund task
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-foreground p-6">
            <h2 className="text-xl font-black">No priced bottlenecks yet</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Tasks need a funding target or fixed worker payout before they rank
              here. Any public task can still accept money on its task page.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
