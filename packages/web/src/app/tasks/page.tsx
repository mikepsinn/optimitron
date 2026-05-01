import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata, getRouteMetadata } from "@/lib/metadata";
import { ROUTES, tasksLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { getTasksPageData } from "@/lib/tasks.server";

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

  const prizeRoot = data.topLevelTasks.find(
    (t) => t.id === "win-earth-optimization-prize",
  );
  const signerTasks = data.allTasks.filter((task) =>
    task.taskKey?.startsWith("program:one-percent-treaty:signer:"),
  );
  const programChildren = (prizeRoot?.childTasks ?? []) as unknown as TaskCardTask[];
  const treatyProgram = programChildren.find((p) => p.id === "1-pct-treaty");
  const treatySignerCount = signerTasks.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        {prizeRoot ? (
          <div className="text-center">
            <TasksRootIntro />
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <TreatyReminderComposer />
            </div>
          </div>
        ) : null}

        {treatyProgram ? (
          <ProgramTaskSection
            task={treatyProgram}
            subtasks={signerTasks}
            subtasksTitle={
              treatySignerCount > 0
                ? `↳ ${treatySignerCount} employees have overdue tasks`
                : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}
