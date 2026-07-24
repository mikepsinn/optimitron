import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { taskTreeLink } from "@/lib/routes";
import { getTaskTreePageData } from "@/lib/tasks/task-tree.server";
import { TaskTreeView } from "@/components/tasks/TaskTreeView";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(taskTreeLink);
}

export default async function TaskTreePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const { root, visibleTaskCount } = await getTaskTreePageData(userId);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-foreground pb-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Task tree
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
            Earth Optimization Task Tree
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-bold text-muted-foreground">
            {visibleTaskCount} tasks nested under Optimize Earth, each with its
            own expected-value math. Click any task to open its page.
          </p>
        </header>

        <div className="mt-6">
          {root ? (
            <TaskTreeView root={root} />
          ) : (
            <p className="py-8 text-sm font-bold text-muted-foreground">
              No tasks are visible yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
