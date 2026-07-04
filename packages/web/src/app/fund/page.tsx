import Link from "next/link";
import { FundingTaskCard } from "@/components/task-funding/FundingTaskCard";
import { EosInvestmentCalculator } from "@/components/site/EosInvestmentCalculator";
import { getRouteMetadata } from "@/lib/metadata";
import { fundLink, ROUTES } from "@/lib/routes";
import {
  collectFundableTasks,
  getExpectedValueUsd,
  getFundingDenominator,
  type FundingTask,
} from "@/lib/task-funding/fundable-tasks.server";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";
import { getTasksPageData } from "@/lib/tasks.server";

export const metadata = getRouteMetadata(fundLink);

const requestDataRoomSubject = "EOS data room request";
const bookCallSubject = "EOS investor call";
const requestDataRoomHref = `mailto:m@warondisease.org?subject=${encodeURIComponent(
  requestDataRoomSubject,
)}`;
const bookCallHref = `mailto:m@warondisease.org?subject=${encodeURIComponent(
  bookCallSubject,
)}`;
const requestDataRoomLabel = "Request the data room";
const bookCallLabel = "Book a call";

const calculatorHeading = "Your calculator";
const calculatorDeck =
  "Use your own assumptions. If the numbers stop working, good - you just saved yourself the money. Either way you leave knowing.";
const termsHeading = "Terms";
const termsDeck =
  "These minimums are for shares and bonds — the price list above takes any amount. The pitch is public. The paperwork is not. For accredited investors, the securities materials live off-page, where the law wants them.";
const finalHeading = "Talk to us";
const finalDeck =
  "Request the data room or book a call. The math is public. The buy-in is not a one-click checkout - the law makes us talk first.";
const legalGateText =
  "Accredited-only securities discussion. Not an offer. Not investment advice.";

const terms = [
  {
    body: "Friends and family minimum.",
    label: "$25,000",
  },
  {
    body: "Institutional minimum.",
    label: "$100,000",
  },
  {
    body: "Earth Optimization Services shares and Incentive Alignment Bonds.",
    label: "2 products",
  },
  {
    body: "Founder equity.",
    label: "0%",
  },
] as const;

interface RankedFundingTask {
  denominatorCents: bigint;
  expectedValueUsd: number;
  fundingSource: "target" | "compensation";
  score: number;
  task: FundingTask;
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
  const ranked = tasks.flatMap((task): RankedFundingTask[] => {
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
        score: expectedValueUsd / (Number(denominator.denominatorCents) / 100),
        task,
      },
    ];
  });

  return dedupeRankedTasks(ranked).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.task.title.localeCompare(right.task.title);
  });
}

export default async function FundPage() {
  const data = await getTasksPageData(null);
  const rankedTasks = rankFundingTasks(collectFundableTasks(data)).slice(0, 12);
  const fundingStatuses = new Map(
    await Promise.all(
      rankedTasks.map(
        async ({ task }) =>
          [task.id, await getTaskFundingStatus(task.id).catch(() => null)] as const,
      ),
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
            {rankedTasks.map((rankedTask, index) => (
              <FundingTaskCard
                denominatorCents={rankedTask.denominatorCents}
                expectedValueUsd={rankedTask.expectedValueUsd}
                funding={fundingStatuses.get(rankedTask.task.id) ?? null}
                fundingSource={rankedTask.fundingSource}
                index={index + 1}
                key={rankedTask.task.id}
                score={rankedTask.score}
                taskId={rankedTask.task.id}
                title={rankedTask.task.title}
              />
            ))}
          </div>
        ) : (
          <div className="border border-foreground p-6">
            <h2 className="text-xl font-black">No priced bottlenecks yet</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Tasks rank here once they carry a funding target or a fixed
              worker payout. Until then, any public task will still take your
              money on its own page.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-black uppercase leading-none sm:text-5xl"
            id="eos-calculator"
          >
            {calculatorHeading}
          </h2>
          <p className="mt-4 max-w-3xl text-lg font-bold leading-8 sm:text-xl">
            {calculatorDeck}
          </p>
          <div className="mt-10">
            <EosInvestmentCalculator />
          </div>
        </div>
      </section>

      <section className="border-t border-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase leading-none sm:text-5xl">
            {termsHeading}
          </h2>
          <p className="mt-4 max-w-3xl text-lg font-bold leading-8 sm:text-xl">
            {termsDeck}
          </p>
          <div className="mt-10 grid border-t-2 border-foreground sm:grid-cols-2 lg:grid-cols-4">
            {terms.map((term) => (
              <article
                className="border-b-2 border-foreground py-5 sm:border-r-2 sm:px-5 sm:even:border-r-0 lg:even:border-r-2 lg:last:border-r-0 lg:first:pl-0"
                key={term.label}
              >
                <h3 className="text-3xl font-black uppercase">{term.label}</h3>
                <p className="mt-3 text-base font-bold leading-7">
                  {term.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase leading-none sm:text-5xl">
            {finalHeading}
          </h2>
          <p className="mt-4 max-w-3xl text-lg font-bold leading-8 sm:text-xl">
            {finalDeck}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-10 items-center justify-center border-2 border-foreground bg-foreground px-5 py-3 font-black uppercase text-background hover:bg-background hover:text-foreground"
              href={requestDataRoomHref}
            >
              {requestDataRoomLabel}
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center border-2 border-foreground bg-background px-5 py-3 font-black uppercase text-foreground hover:bg-foreground hover:text-background"
              href={bookCallHref}
            >
              {bookCallLabel}
            </a>
          </div>
          <p className="mt-6 border-2 border-foreground p-3 text-xs font-black uppercase">
            {legalGateText}
          </p>
        </div>
      </section>
    </main>
  );
}
