import { getDashboardData } from "../actions"
import { DashboardSettingsClient } from "./settings-client"

export default async function DashboardSettingsPage() {
  const data = await getDashboardData()

  return <DashboardSettingsClient initialData={data} />
}
