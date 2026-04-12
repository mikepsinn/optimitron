import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { getTasksPageData } from "@/lib/tasks.server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { dashboardLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dashboardLink);

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.dashboard));
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
