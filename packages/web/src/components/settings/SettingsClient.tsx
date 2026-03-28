"use client"

import { useRouter } from "next/navigation"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferencesCard"
import type { DashboardNotificationPreference } from "@/types/dashboard"

interface SettingsClientProps {
  notificationPreferences: DashboardNotificationPreference[]
}

export function SettingsClient({ notificationPreferences }: SettingsClientProps) {
  const router = useRouter()

  const refreshPage = () => {
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <ArcadeTag>Configuration</ArcadeTag>
        <h1 className="text-4xl sm:text-5xl font-black uppercase mb-2">
          <span className="text-brutal-cyan">SETTINGS</span>
        </h1>
        <p className="text-base font-bold text-muted-foreground">
          Notification preferences, account toggles, and other knobs your species inexplicably
          needs labelled.
        </p>
      </div>

      <div className="space-y-8">
        <NotificationPreferencesCard
          preferences={notificationPreferences}
          onRefresh={refreshPage}
        />
      </div>
    </div>
  )
}
