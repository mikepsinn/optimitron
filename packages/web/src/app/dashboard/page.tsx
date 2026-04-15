import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTasksPageData, getTreatyBlockerTasks } from "@/lib/tasks.server";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ReferendumSiteDashboardClient } from "@/components/site/ReferendumSiteDashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHost } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.contentKey) {
    const content = getReferendumSiteContent(site.contentKey);
    return getSiteMetadata(site, content.metadata.dashboard);
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

  if (site.contentKey && site.primaryReferendumSlug) {
    const [initialData, blockerTasks] = await Promise.all([
      getDashboardData(userId),
      getTreatyBlockerTasks(userId, 250),
    ]);
    const content = getReferendumSiteContent(site.contentKey);
    const welcome = params.welcome === "1";

    return (
      <ReferendumSiteDashboardClient
        initialUser={initialData.user}
        blockerTasks={blockerTasks}
        content={content.dashboard}
        welcome={welcome}
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
