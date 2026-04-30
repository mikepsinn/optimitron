import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { backfillUserLocationFromHeaders } from "@/lib/geo/backfill-location.server";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTasksPageData } from "@/lib/tasks.server";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { HumanityManagementDashboardClient } from "@/components/site/HumanityManagementDashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHost } from "@/lib/site";
import { ensurePersonForUser } from "@/lib/person.server";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.contentKey) {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.dashboard, "/dashboard");
    }
  }

  return getRouteMetadata(dashboardLink);
}

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    const callbackParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        callbackParams.set(key, value);
      } else if (Array.isArray(value) && typeof value[0] === "string") {
        callbackParams.set(key, value[0]);
      }
    }
    const callbackUrl = callbackParams.size
      ? `${ROUTES.dashboard}?${callbackParams.toString()}`
      : ROUTES.dashboard;
    redirect(getSignInPath(callbackUrl));
  }

  void backfillUserLocationFromHeaders(userId, hdrs);

  if (
    site.pageVariants.dashboard === "humanityManagementDashboard" &&
    site.contentKey &&
    site.primaryReferendumSlug
  ) {
    const person = await ensurePersonForUser(userId);
    const treatyTask = await ensureUserTreatyTask({
      personId: person.id,
      userId,
    });
    const taskData = await getTasksPageData(userId);
    /// Order children by the sortOrder set in the user-onboarding:treaty
    /// blueprint (sign 0 → share 10 → phone 20 → assign1 30 → assign2 40 →
    /// completeTraining 50). Persuasion-optimized order: do the personal
    /// commitment before asking anyone else.
    const sortBySortOrder = (a: TaskCardTask, b: TaskCardTask) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    const userTreatySubtasks = taskData.ownedPrivateTasks.filter(
      (task) =>
        task.id !== treatyTask.taskId &&
        task.parentTaskId === treatyTask.taskId &&
        task.status !== "STALE",
    ) as TaskCardTask[];
    const nextTasks = userTreatySubtasks
      .filter((task) => task.status !== "VERIFIED")
      .sort(sortBySortOrder);
    const completedTasks = userTreatySubtasks
      .filter((task) => task.status === "VERIFIED")
      .sort(sortBySortOrder);

    return (
      <HumanityManagementDashboardClient
        nextTasks={nextTasks}
        completedTasks={completedTasks}
      />
    );
  }

  const [initialData, leaderboard, taskData] = await Promise.all([
    getDashboardData(userId),
    getTopReferrers(),
    getTasksPageData(userId),
  ]);

  // Top recommended tasks for the player. Use the same TaskCardTask shape
  // the rest of the site uses so we can render them through SortableTaskList.
  const topTasks = taskData.forYou.slice(0, 5);

  return (
    <DashboardClient
      initialData={initialData}
      leaderboard={leaderboard}
      topTasks={topTasks}
    />
  );
}
