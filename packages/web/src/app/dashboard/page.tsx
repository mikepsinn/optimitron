import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { backfillUserLocationFromHeaders } from "@/lib/geo/backfill-location.server";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTasksPageData } from "@/lib/tasks.server";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { EarthOptimizationDashboardClient } from "@/components/dashboard/EarthOptimizationDashboardClient";
import { TreatyTaskDashboardClient } from "@/components/site/TreatyTaskDashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHeaders } from "@/lib/site";
import { ensurePersonForUser } from "@/lib/person.server";
import { selectActionableTreatyTasks } from "@/lib/tasks/treaty-dashboard-tasks";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.contentKey) {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.dashboard, ROUTES.dashboard);
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
  const site = getSiteFromHeaders(hdrs);
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
    site.pageVariants.dashboard === "treatyTaskDashboard" &&
    site.contentKey &&
    site.primaryReferendumSlug
  ) {
    const person = await ensurePersonForUser(userId);
    const treatyTask = await ensureUserTreatyTask({
      personId: person.id,
      userId,
    });
    const taskData = await getTasksPageData(userId);
    // Persuasion-optimized order: sign personally → share → phone → assign1
    // → assign2. The :completeTraining gate is hidden from both lists by
    // selectActionableTreatyTasks (it's a meta auto-complete, not a queue
    // entry). See the helper for the full rationale.
    const { nextTasks, completedTasks } = selectActionableTreatyTasks({
      ownedPrivateTasks: taskData.ownedPrivateTasks,
      treatyTaskId: treatyTask.taskId,
    });

    return (
      <TreatyTaskDashboardClient
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
    <EarthOptimizationDashboardClient
      initialData={initialData}
      leaderboard={leaderboard}
      topTasks={topTasks}
    />
  );
}
