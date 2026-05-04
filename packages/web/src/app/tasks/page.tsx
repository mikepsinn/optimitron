import type { Metadata } from "next";
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

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);
  const topLevelTasks: TopLevelTaskCardTask[] = data.topLevelTasks;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            Earth Optimization Tasks
          </h1>
          <p className="mx-auto max-w-3xl text-base font-bold text-muted-foreground sm:text-lg">
            The full tree. Every task is a bet on moving median healthy life
            years and median income toward their 2040 targets. Pick a node and
            drill in.
          </p>
        </header>

        {topLevelTasks.map((root) => {
          const childTasks = root.childTasks;
          return (
            <section key={root.id} className="space-y-4">
              <SortableTaskList
                tasks={[root]}
                defaultSortKey="cost"
                defaultSortDir="desc"
                pageSize={1}
              />
              {childTasks.length > 0 ? (
                <div className="ml-1 space-y-3 sm:ml-3">
                  <h2 className="text-lg font-black uppercase tracking-tight sm:text-2xl">
                    ↳ Programs ({childTasks.length})
                  </h2>
                  <SortableTaskList
                    tasks={childTasks}
                    defaultSortKey="cost"
                    defaultSortDir="desc"
                    pageSize={20}
                  />
                </div>
              ) : null}
            </section>
          );
        })}

        {data.allTasks.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-tight sm:text-2xl">
              Task Queue ({data.allTasks.length})
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              Leaf tasks and deeper task-tree nodes that need action.
            </p>
            <SortableTaskList
              tasks={data.allTasks as TaskCardTask[]}
              defaultSortKey="cost"
              defaultSortDir="desc"
              pageSize={25}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
