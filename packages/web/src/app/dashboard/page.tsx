import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { shareableSnippets } from "@optimitron/data/parameters";
import { authOptions } from "@/lib/auth";
import { backfillUserLocationFromHeaders } from "@/lib/geo/backfill-location.server";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTaskDetailData, getTasksPageData } from "@/lib/tasks.server";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ReferendumSiteDashboardClient } from "@/components/site/ReferendumSiteDashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHost } from "@/lib/site";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.contentKey) {
    const content = getReferendumSiteContent(site.contentKey);
    return getSiteMetadata(site, content.metadata.dashboard, "/dashboard");
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

  if (site.contentKey && site.primaryReferendumSlug) {
    const treatyParent = await getTaskDetailData(TREATY_PARENT_TASK_ID, userId);
    const task = (treatyParent?.task ?? null) as TaskCardTask | null;
    const subtasks = (treatyParent?.task.childTasks ?? []) as unknown as TaskCardTask[];
    const treatyMarkdown =
      site.key === "onePercentTreaty"
        ? shareableSnippets.onePercentTreatyText.markdown
        : "";

    return (
      <ReferendumSiteDashboardClient
        task={task}
        subtasks={subtasks}
        treatyMarkdown={treatyMarkdown}
        referendumSlug={site.primaryReferendumSlug}
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
