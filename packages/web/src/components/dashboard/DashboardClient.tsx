"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { ProfileCard } from "@/components/dashboard/ProfileCard"
import { BadgesSection } from "@/components/dashboard/BadgesSection"
import { OrganizationsCard } from "@/components/dashboard/OrganizationsCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { ConnectedAccountsCard } from "@/components/dashboard/ConnectedAccountsCard"
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferencesCard"
import type { DashboardData } from "@/types/dashboard"

export function DashboardClient({
  initialData,
}: {
  initialData: DashboardData
}) {
  const router = useRouter()
  const [user, setUser] = useState(initialData.user)

  useEffect(() => {
    setUser(initialData.user)
  }, [initialData.user])

  const refreshDashboard = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-4">
                EARTH <span className="text-brutal-pink">OPTIMIZATION</span>
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-background border-4 border-primary hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-2"
            >
              <LogOut className="h-5 w-5 stroke-[3px]" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </Button>
          </div>
        </div>

        {/* Profile + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProfileCard user={user} onUserChange={setUser} onRefresh={refreshDashboard} />
          <StatsOverview stats={initialData.stats} />
        </div>

        {/* Badges */}
        <BadgesSection badges={initialData.badges} />

        {/* Activity + Connected Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ActivityFeed activities={initialData.activities} />
          <ConnectedAccountsCard
            socialAccounts={initialData.socialAccounts}
            onRefresh={refreshDashboard}
          />
        </div>

        {/* Notification Preferences */}
        <NotificationPreferencesCard
          preferences={initialData.notificationPreferences}
          onRefresh={refreshDashboard}
        />

        {/* Organizations */}
        {initialData.organizations?.created && initialData.organizations.created.length > 0 && (
          <OrganizationsCard organizations={initialData.organizations} />
        )}
      </div>
    </div>
  )
}
