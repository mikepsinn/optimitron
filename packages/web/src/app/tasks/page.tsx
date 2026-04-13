import Link from "next/link";
import { getServerSession } from "next-auth";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import { authOptions } from "@/lib/auth";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import { getRouteMetadata } from "@/lib/metadata";
import { tasksLink } from "@/lib/routes";
import { getTasksPageData } from "@/lib/tasks.server";

export const metadata = getRouteMetadata(tasksLink);

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

/**
 * One program child of the root task — e.g. Ratify the 1% Treaty. Renders as
 * a BrutalCard with the task title, a 1-line description, and headline stats
 * (deaths from delay, taxpayer money wasted). The card is a link to the
 * task's detail page. Descendants (e.g. signer children) can be rendered
 * underneath by the caller with an indent.
 */
function ProgramCard({ task }: { task: TaskCardTask }) {
  const delayStats = getTaskDelayStats(task);
  const overdueLabel =
    delayStats.isOverdue && delayStats.currentDelayDays > 0
      ? formatDelayDuration(delayStats.currentDelayDays)
      : null;
  // Full treaty-level cost of delay (150K deaths/day × days + $40.8B/day × days).
  // This is the aggregate blocking cost for every parent task on the to-do list.
  const costOfDelay = getTreatyLevelCostOfDelay(delayStats.currentDelayDays);

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <BrutalCard
        bgColor="background"
        padding="lg"
        className="transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
              {task.title}
            </h3>
            {overdueLabel ? (
              <span className="border-2 border-foreground bg-brutal-red px-2 py-0.5 text-xs font-black uppercase tracking-wide text-brutal-red-foreground">
                {overdueLabel} overdue
              </span>
            ) : null}
          </div>
          {costOfDelay ? (
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <span>
                💀{" "}
                <span className="font-black">
                  {formatCompactCount(costOfDelay.deathsFromDelay)}
                </span>{" "}
                deaths from delay
              </span>
              <span>
                🔥{" "}
                <span className="font-black">
                  {formatCompactCurrency(costOfDelay.wastedUsd)}
                </span>{" "}
                wasted by delay
              </span>
            </div>
          ) : null}
        </div>
      </BrutalCard>
    </Link>
  );
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);

  const prizeRoot = data.topLevelTasks.find(
    (t) => t.id === "win-earth-optimization-prize",
  );
  const otherRoots = data.topLevelTasks.filter(
    (t) => t.id !== "win-earth-optimization-prize",
  );
  const signerTasks = data.allTasks.filter((task) =>
    task.taskKey?.startsWith("program:one-percent-treaty:signer:"),
  );
  const programChildren = (prizeRoot?.childTasks ?? []) as unknown as TaskCardTask[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        {/*
          Root task hero — literally the "Promote the General Welfare" root
          task. The 3 programs below are its direct children. Each program
          card may have its own grandchildren (e.g. treaty → 193 signers)
          rendered indented immediately beneath.
        */}
        {prizeRoot ? (
          <Link
            href={`/tasks/${prizeRoot.id}`}
            className="block"
            aria-label="Open the Promote the General Welfare root task"
          >
            <BrutalCard
              bgColor="yellow"
              shadowSize={8}
              className="p-8 text-center transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  ⚡ Your Employees&apos; To-Do List
                </p>
                <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
                  Promote the General Welfare
                </h1>
                <p className="mx-auto max-w-3xl text-base font-bold sm:text-lg">
                  The literal job description of every government on Earth. You pay
                  them $44 trillion a year to do it. They&apos;re behind. Below is the
                  list — under each employee is a polite reminder you can send.
                </p>
              </div>
            </BrutalCard>
          </Link>
        ) : null}

        {/*
          Tree view: each program child renders as a card. If the program is
          the 1% Treaty, the 193 signer grandchildren render directly beneath
          it with a left-indent so the parent-child relationship is visible.
        */}
        {programChildren.map((program) => {
          const isTreaty = program.id === "1-pct-treaty";
          const programSignerCount = isTreaty ? signerTasks.length : 0;
          return (
            <div key={program.id} className="space-y-4">
              <ProgramCard task={program} />
              {isTreaty && programSignerCount > 0 ? (
                <div className="ml-2 space-y-3 border-l-4 border-foreground/20 pl-3 sm:ml-6 sm:pl-5">
                  <h2 className="text-lg font-black tracking-tight sm:text-2xl">
                    ↳ {programSignerCount} of your employees have this on their to-do list
                  </h2>
                  <SortableTaskList
                    tasks={signerTasks}
                    defaultSortKey="assigneeBudget"
                    defaultSortDir="desc"
                    variant="signer"
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Other top-level tasks not under the prize root (rare) */}
        {otherRoots.length > 0 ? (
          <Section title="Other blocking programs">
            <SortableTaskList tasks={otherRoots as unknown as TaskCardTask[]} />
          </Section>
        ) : null}

        {/* Authenticated-only personal sections */}
        {userId && data.ownedPrivateTasks.length > 0 ? (
          <Section title="My private tasks">
            <SortableTaskList tasks={data.ownedPrivateTasks} />
          </Section>
        ) : null}

        {userId && data.forYou.length > 0 ? (
          <Section title="For you">
            <SortableTaskList tasks={data.forYou.slice(0, 12)} />
          </Section>
        ) : null}

        {data.assignedToYou.length > 0 ? (
          <Section title="Assigned to you">
            <SortableTaskList tasks={data.assignedToYou} />
          </Section>
        ) : null}

        {userId && data.myClaims.length > 0 ? (
          <Section title="My claims">
            <SortableTaskList
              tasks={data.myClaims.map((claim) => ({
                ...claim.task,
                activeClaimCount: claim.task.claims.filter((taskClaim) =>
                  ["CLAIMED", "IN_PROGRESS", "COMPLETED"].includes(taskClaim.status),
                ).length,
                viewerHasClaim: true,
              }))}
            />
          </Section>
        ) : null}
      </div>
    </div>
  );
}
