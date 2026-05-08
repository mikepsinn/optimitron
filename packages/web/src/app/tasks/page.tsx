import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata, getRouteMetadata } from "@/lib/metadata";
import { ROUTES, tasksLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { getTasksPageData } from "@/lib/tasks.server";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "@/lib/tasks/task-keys";

type TopLevelTaskCardTask = TaskCardTask & {
  childTasks: TaskCardTask[];
};

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.primaryReferendumSlug) {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.tasks, ROUTES.tasks);
    }
  }

  return getRouteMetadata(tasksLink);
}

function TreatyVoteCta() {
  return (
    <Link
      href={ROUTES.vote}
      className="block border-2 border-foreground bg-background p-6 transition hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase leading-tight">
            Vote on the 1% Treaty
          </h3>
          <p className="text-sm font-bold leading-6 text-muted-foreground">
            Redirect 1% of military spending to clinical trials. 30 seconds.
            One vote. The only task that matters until you cast it.
          </p>
        </div>
        <span aria-hidden className="text-3xl font-black">→</span>
      </div>
    </Link>
  );
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);
  const topLevelTasks: TopLevelTaskCardTask[] = data.topLevelTasks;
  const root = topLevelTasks.find((t) => t.id === OPTIMIZE_EARTH_ROOT_TASK_ID);
  const yourTasks = data.assignedToMe as TaskCardTask[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-8">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            Earth Optimization Tasks
          </h1>
          <p className="mx-auto max-w-3xl text-base font-bold text-muted-foreground sm:text-lg">
            Two sections. Humanity's job, then yours. Pick one and move
            healthy life years or income toward their 2040 targets.
          </p>
        </header>

        {root ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-tight sm:text-2xl">
              Humanity's Tasks
            </h2>
            <SortableTaskList
              tasks={[root]}
              defaultSortKey="cost"
              defaultSortDir="desc"
              pageSize={1}
            />
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight sm:text-2xl">
            Your Tasks
          </h2>
          {yourTasks.length > 0 ? (
            <SortableTaskList
              tasks={yourTasks}
              defaultSortKey="cost"
              defaultSortDir="desc"
              pageSize={25}
            />
          ) : (
            <TreatyVoteCta />
          )}
        </section>
      </div>
    </div>
  );
}
