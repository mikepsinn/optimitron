import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
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

  const [initialData, leaderboard] = await Promise.all([
    getDashboardData(userId),
    getTopReferrers(),
  ]);

  return (
    <DashboardClient
      initialData={initialData}
      leaderboard={leaderboard}
    />
  );
}
