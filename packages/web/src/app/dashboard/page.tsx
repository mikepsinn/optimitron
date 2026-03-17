import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboardData, getTopReferrers } from "@/lib/dashboard.server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getSignInPath, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Dashboard | Optomitron",
  description:
    "Your Earth optimization dashboard — track impact, manage preferences, and coordinate with organisations.",
};

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
    <DashboardClient initialData={initialData} leaderboard={leaderboard} />
  );
}
