"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { EmailPreferencesCard } from "@/components/dashboard/EmailPreferencesCard"
import { ConnectedAccountsCard } from "@/components/dashboard/ConnectedAccountsCard"
import type { DashboardData, DashboardUser } from "@/types/dashboard"
import { ROUTES } from "@/lib/routes"

interface DashboardSettingsClientProps {
  initialData: DashboardData
}

export function DashboardSettingsClient({ initialData }: DashboardSettingsClientProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialData.user)

  useEffect(() => {
    setUser(initialData.user)
  }, [initialData.user])

  const refreshSettings = () => {
    router.refresh()
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-2">
                ACCOUNT <span className="text-brutal-pink">SETTINGS</span>
              </h1>
              <p className="text-lg font-bold text-muted-foreground">
                Manage notifications and connected accounts without cluttering the main dashboard.
              </p>
            </div>
            <Button asChild variant="outline" className="border-2 border-primary font-bold uppercase">
              <Link href={ROUTES.dashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className="space-y-8">
            <EmailPreferencesCard
              user={user}
              onUserChange={(nextUser: DashboardUser) => setUser(nextUser)}
              onRefresh={refreshSettings}
              className="mb-0"
            />

            <ConnectedAccountsCard
              socialAccounts={initialData.socialAccounts}
              enabledProviders={initialData.enabledProviders}
              onRefresh={refreshSettings}
            />

            <div className="border-2 border-dashed border-primary bg-muted/30 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5" />
                <p className="font-black uppercase">Profile Editing Lives Elsewhere</p>
              </div>
              <p className="font-bold text-sm text-muted-foreground mb-4">
                Your full public profile editor has its own page now so the dashboard can stay focused on impact and sharing.
              </p>
              <Button asChild className="border-2 border-primary bg-brutal-pink">
                <Link href={ROUTES.profileEdit}>Edit Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
