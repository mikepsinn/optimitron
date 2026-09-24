import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { backfillUserLocationFromHeaders } from "@/lib/geo/backfill-location.server";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTasksPageData } from "@/lib/tasks.server";
import {
  loadPersonalQueue,
  loadPersonalQueueAudit,
} from "@/lib/tasks/personal-planning.server";
import { toPersonalQueueDisplayData } from "@/components/dashboard/personal-queue-display";
import { EarthOptimizationDashboardClient } from "@/components/dashboard/EarthOptimizationDashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata: Metadata = getRouteMetadata(dashboardLink);

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const hdrs = await headers();
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

  const [initialData, leaderboard, taskData, personalQueue, queueAudit] =
    await Promise.all([
      getDashboardData(userId),
      getTopReferrers(),
      getTasksPageData(userId),
      loadPersonalQueue({ maxResults: 10, userId }),
      loadPersonalQueueAudit({ userId }),
    ]);

  // Top recommended tasks for the player. Use the same TaskCardTask shape
  // the rest of the site uses so we can render them through SortableTaskList.
  const topTasks = taskData.forYou.slice(0, 5);

  return (
    <EarthOptimizationDashboardClient
      initialData={initialData}
      leaderboard={leaderboard}
      personalQueue={toPersonalQueueDisplayData(personalQueue, queueAudit)}
      topTasks={topTasks}
    />
  );
}
