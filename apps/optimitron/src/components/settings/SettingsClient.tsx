"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferencesCard"
import { EmailPreferencesCard } from "@/components/settings/EmailPreferencesCard"
import { ThemePreferencesCard } from "@/components/settings/ThemePreferencesCard"
import { Card } from "@/components/retroui/Card"
import { ROUTES } from "@/lib/routes"
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
        <Link
          href={ROUTES.profile}
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <Card className="border-2 border-foreground bg-background transition hover:bg-muted">
            <Card.Content className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black uppercase text-foreground">
                  Edit your profile
                </h2>
                <p className="text-sm font-bold text-muted-foreground">
                  Name, avatar, handle, bio.
                </p>
              </div>
              <span className="text-sm font-black uppercase text-foreground underline underline-offset-4">
                Open profile
              </span>
            </Card.Content>
          </Card>
        </Link>

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
