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
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";
import type { TaskCardTask } from "@/components/tasks/task-card";

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
    // Still ensure the per-user HMT root task exists — it's the parent the
    // referral-invitation tasks attach to. The 5-subtask checklist that used
    // to live underneath it was removed; both action levers live as direct
    // composers on the dashboard now.
    await ensureUserTreatyTask({ personId: person.id, userId });

    const taskData = await getTasksPageData(userId);
    const now = Date.now();
    const overdueLeaders = (taskData.allTasks as TaskCardTask[])
      .filter((task) => task.taskKey?.startsWith("program:one-percent-treaty:signer:"))
      .filter((task) => task.dueAt != null && task.dueAt.getTime() < now)
      .sort((a, b) => (a.dueAt!.getTime()) - (b.dueAt!.getTime()))
      .slice(0, 10);

    return <TreatyTaskDashboardClient overdueLeaders={overdueLeaders} />;
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
