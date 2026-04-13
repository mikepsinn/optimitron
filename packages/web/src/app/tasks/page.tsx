import Link from "next/link";
import { getServerSession } from "next-auth";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { Button } from "@/components/retroui/Button";
import { BrutalCard } from "@/components/ui/brutal-card";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { getSignInPath, tasksLink, ROUTES } from "@/lib/routes";
import { getTasksPageData } from "@/lib/tasks.server";
import { earthOptimizationPrizeWinCondition } from "@optimitron/data/parameters";

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
      <h2 className="text-lg font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);
  const signInHref = getSignInPath(ROUTES.tasks);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
        <section className="space-y-6 text-center">
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl md:text-6xl">
            Your Employees&apos; To-Do List
          </h1>
          <p className="mx-auto max-w-3xl text-base font-bold sm:text-lg">
            You pay world governments $44 trillion per year. Their job description is four words:
          </p>
          <BrutalCard bgColor="yellow" shadowSize={8} className="mx-auto max-w-xl p-6">
            <p className="text-2xl font-black uppercase sm:text-3xl">
              &ldquo;Promote the general welfare&rdquo;
            </p>
          </BrutalCard>
          <p className="mx-auto max-w-3xl text-base font-bold text-muted-foreground sm:text-lg">
            Here is their to-do list. Here is how late they are.
          </p>
          {!userId ? (
            <div className="mx-auto flex max-w-xl items-center gap-3 border-2 border-primary bg-muted/30 px-4 py-3 text-left">
              <p className="flex-1 text-sm font-bold">
                Sign in for your personalized task feed.
              </p>
              <Button asChild size="sm" className="font-bold uppercase">
                <Link href={signInHref}>Sign In</Link>
              </Button>
            </div>
          ) : null}
        </section>

        {(() => {
          const prizeRoot = data.topLevelTasks.find(
            (t) => t.id === "win-earth-optimization-prize",
          );
          const otherRoots = data.topLevelTasks.filter(
            (t) => t.id !== "win-earth-optimization-prize",
          );
          const { hale, medianIncome, deadlineYear } =
            earthOptimizationPrizeWinCondition;
          return (
            <>
              {prizeRoot ? (
                <section className="space-y-4">
                  <Link href={`/tasks/${prizeRoot.id}`} className="block">
                    <BrutalCard bgColor="yellow" shadowSize={8} className="p-6">
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-black uppercase">
                          The Goal
                        </span>
                        <h2 className="text-3xl font-black uppercase leading-tight sm:text-4xl">
                          {prizeRoot.title}
                        </h2>
                        <p className="text-sm font-bold">
                          By {deadlineYear}: hit{" "}
                          <span className="font-black">
                            {hale.target.toFixed(1)} healthy life-years
                          </span>{" "}
                          (now {hale.baseline.toFixed(1)}) and median income of{" "}
                          <span className="font-black">
                            ${Math.round(medianIncome.target).toLocaleString()}
                          </span>{" "}
                          (now ${Math.round(medianIncome.baseline).toLocaleString()}).
                          Every task below is a bet on moving these two numbers.
                        </p>
                      </div>
                    </BrutalCard>
                  </Link>
                  {prizeRoot.childTasks && prizeRoot.childTasks.length > 0 ? (
                    <Section title="Highest-Value Blocking Programs">
                      <SortableTaskList tasks={prizeRoot.childTasks} />
                    </Section>
                  ) : null}
                </section>
              ) : null}

              {otherRoots.length > 0 ? (
                <Section title="Other Blocking Programs">
                  <SortableTaskList tasks={otherRoots} />
                </Section>
              ) : null}
            </>
          );
        })()}

        {userId && data.ownedPrivateTasks.length > 0 ? (
          <Section title="My Private Tasks">
            <SortableTaskList tasks={data.ownedPrivateTasks} />
          </Section>
        ) : null}

        {userId && data.forYou.length > 0 ? (
          <Section title="For You">
            <SortableTaskList tasks={data.forYou.slice(0, 12)} />
          </Section>
        ) : null}

        {data.assignedToYou.length > 0 ? (
          <Section title="Assigned To You">
            <SortableTaskList tasks={data.assignedToYou} />
          </Section>
        ) : null}

        {userId && data.myClaims.length > 0 ? (
          <Section title="My Claims">
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

        {data.allTasks.length > 0 ? (
          <Section title="All Tasks">
            <SortableTaskList tasks={data.allTasks.slice(0, 50)} />
          </Section>
        ) : null}
      </div>
    </div>
  );
}
