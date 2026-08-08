import { getDashboardData, getTopReferrers } from "./actions"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const data = await getDashboardData()
  const leaderboard = await getTopReferrers()

  return <DashboardClient initialData={data} leaderboard={leaderboard} />
}
