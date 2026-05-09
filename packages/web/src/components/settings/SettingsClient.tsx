"use client"

import { useRouter } from "next/navigation"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferencesCard"
import { EmailPreferencesCard } from "@/components/settings/EmailPreferencesCard"
import { ThemePreferencesCard } from "@/components/settings/ThemePreferencesCard"
import type { DashboardNotificationPreference } from "@/types/dashboard"
import type { EmailPreferencesState } from "@/types/settings"

interface SettingsClientProps {
  emailPreferences: EmailPreferencesState
  notificationPreferences: DashboardNotificationPreference[]
}

export function SettingsClient({ emailPreferences, notificationPreferences }: SettingsClientProps) {
  const router = useRouter()

  const refreshPage = () => {
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <ArcadeTag>Configuration</ArcadeTag>
        <h1 className="text-4xl sm:text-5xl font-black uppercase mb-2">
          <span className="text-background">SETTINGS</span>
        </h1>
        <p className="text-base font-bold text-muted-foreground">
          Notification preferences, account toggles, and profile controls.
        </p>
      </div>

      <div className="space-y-8">
        <ThemePreferencesCard />
        <EmailPreferencesCard
          initialPreferences={emailPreferences}
          onRefresh={refreshPage}
        />
        <NotificationPreferencesCard
          preferences={notificationPreferences}
          onRefresh={refreshPage}
        />
      </div>
    </div>
  )
}
