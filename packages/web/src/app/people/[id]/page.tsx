import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { YEARS_PER_AVERTED_DEATH } from "@/components/tasks/task-row";
import { Avatar } from "@/components/retroui/Avatar";
import { isPublicOfficialPerson } from "@/lib/public-officials";
import {
  aggregateTaskDelayStats,
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPersonTaskProfileData(id, null);

  if (!data) {
    return {
      title: "Person | Optimitron",
    };
  }

  const isOfficial = isPublicOfficialPerson(data.person);

  return {
    title: `${data.person.displayName} | Optimitron`,
    description: isOfficial
      ? `${data.person.displayName}'s employee performance review.`
      : `${data.person.displayName}'s public task profile.`,
  };
}

function getFallbackInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getPersonTaskProfileData(id, userId);

  if (!data) {
    notFound();
  }

  const { openTasks, person, verifiedTasks } = data;
  const fallbackInitials = getFallbackInitials(person.displayName);
  const openSummary = aggregateTaskDelayStats(openTasks);

  const openTasksTyped = openTasks as unknown as TaskCardTask[];
  const verifiedTyped = verifiedTasks as unknown as TaskCardTask[];

  const netEconomicImpact = verifiedTyped.reduce((sum, task) => {
    const v = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
    return v != null ? sum + v : sum;
  }, 0);
  const netLivesSaved = verifiedTyped.reduce((sum, task) => {
    const d = task.impact?.selectedFrame?.expectedDalysAvertedBase;
    return d != null ? sum + d / YEARS_PER_AVERTED_DEATH : sum;
  }, 0);

  const signedValueClass = (value: number) =>
    value < 0
      ? "text-brutal-red"
      : value > 0
        ? "text-brutal-green"
        : "";

  const hasAnyTasks = openTasks.length > 0 || verifiedTyped.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
        <header className="space-y-4">
          <nav className="text-sm font-bold">
            <Link className="underline underline-offset-4" href="/tasks">
              Tasks
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{person.displayName}</span>
          </nav>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shrink-0 border-2 border-foreground bg-muted">
              <Avatar.Image alt={person.displayName} src={person.image ?? undefined} />
              <Avatar.Fallback className="bg-brutal-pink font-black text-background">
                {fallbackInitials || "?"}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                {person.displayName}
              </h1>
              {person.currentAffiliation ? (
                <p className="text-sm font-bold text-muted-foreground">
                  {person.currentAffiliation}
                </p>
              ) : null}
              {person.sourceUrl ? (
                <Link
                  className="inline-block text-xs font-bold underline underline-offset-4"
                  href={person.sourceUrl}
                  target="_blank"
                >
                  Source
                </Link>
              ) : null}
            </div>
          </div>
          {person.bio?.trim() ? (
            <p className="max-w-4xl text-sm font-bold text-muted-foreground">{person.bio}</p>
          ) : null}
        </header>

        {/* Stats — overdue clock + net completed impact */}
        {hasAnyTasks ? (
          <div className="grid gap-3 border-2 border-primary bg-background p-4 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Overdue Tasks
              </p>
              <p className="mt-1 text-2xl font-bold">{openTasks.length.toLocaleString("en-US")}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                DALYs Lost From Delay
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatCompactCount(openSummary.currentHumanLivesLost)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Economic Loss From Delay
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatCompactCurrency(openSummary.currentEconomicValueUsdLost)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Net Lives Saved
              </p>
              <p className={`mt-1 text-2xl font-bold ${signedValueClass(netLivesSaved)}`}>
                {formatCompactCount(netLivesSaved)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Net $ Saved
              </p>
              <p className={`mt-1 text-2xl font-bold ${signedValueClass(netEconomicImpact)}`}>
                {formatCompactCurrency(netEconomicImpact)}
              </p>
            </div>
          </div>
        ) : null}

        {openTasksTyped.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">Overdue Tasks</h2>
            <SortableTaskList tasks={openTasksTyped} variant="signer" />
          </section>
        ) : null}

        {verifiedTyped.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">Completed Tasks</h2>
            <SortableTaskList
              tasks={verifiedTyped}
              variant="completed"
              defaultSortKey="verifiedAt"
              defaultSortDir="desc"
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
