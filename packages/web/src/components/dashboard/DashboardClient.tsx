"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/retroui/Button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { buildPrizeReferralUrl } from "@/lib/url"
import { ImpactLedgerCard } from "@/components/dashboard/ImpactLedgerCard"
import { ReferralLinkCard } from "@/components/dashboard/ReferralLinkCard"
import { ProfileCard } from "@/components/dashboard/ProfileCard"
import { ReferralGoalCard } from "@/components/dashboard/ReferralGoalCard"
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferencesCard"
import { GlobalProgressCard } from "@/components/dashboard/GlobalProgressCard"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { BadgesSection } from "@/components/dashboard/BadgesSection"
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard"
import { OrganizationsCard } from "@/components/dashboard/OrganizationsCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { ShareTemplatesCard } from "@/components/dashboard/ShareTemplatesCard"
import { EmailSignatureCard } from "@/components/dashboard/EmailSignatureCard"
import { ConnectedAccountsCard } from "@/components/dashboard/ConnectedAccountsCard"
import { StickyShareFooter } from "@/components/dashboard/StickyShareFooter"
import { PlayerNameBanner } from "@/components/dashboard/PlayerNameBanner"
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard"

export function DashboardClient({
  initialData,
  leaderboard,
}: {
  initialData: DashboardData
  leaderboard: LeaderboardEntry[]
}) {
  const router = useRouter()
  const [user, setUser] = useState(initialData.user)
  const referralLink = buildPrizeReferralUrl(user.username || user.referralCode)

  useEffect(() => {
    setUser(initialData.user)
  }, [initialData.user])

  const refreshDashboard = () => {
    router.refresh()
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-32">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <ArcadeTag>Player Stats</ArcadeTag>
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

          {/* Player Name Banner */}
          <PlayerNameBanner
            user={user}
            referralLink={referralLink}
            onUserChange={setUser}
            onRefresh={refreshDashboard}
          />

          {/* Impact Ledger */}
          <div className="mb-8" id="impact-ledger">
            <ImpactLedgerCard votesLogged={initialData.stats.referrals} />
          </div>

          {/* Referral Link + Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ReferralLinkCard referralLink={referralLink} className="h-full" id="referral" />
            <ProfileCard user={user} onUserChange={setUser} onRefresh={refreshDashboard} />
          </div>

          {/* Referral Goal + Notification Preferences */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ReferralGoalCard stats={initialData.stats} />
            <NotificationPreferencesCard
              preferences={initialData.notificationPreferences}
              onRefresh={refreshDashboard}
            />
          </div>

          {/* Global Progress */}
          <GlobalProgressCard progress={initialData.globalProgress} />

          {/* Stats Overview */}
          <StatsOverview stats={initialData.stats} />

          {/* Badges */}
          <BadgesSection badges={initialData.badges} />

          {/* Leaderboard + Organizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {leaderboard.length > 0 && (
              <LeaderboardCard
                leaderboard={leaderboard}
                user={user}
                stats={initialData.stats}
              />
            )}
            {initialData.organizations?.created && initialData.organizations.created.length > 0 && (
              <OrganizationsCard organizations={initialData.organizations} />
            )}
          </div>

          {/* Activity Feed */}
          <ActivityFeed activities={initialData.activities} />

          {/* Share Templates */}
          <ShareTemplatesCard referralLink={referralLink} />

          {/* Email Signature */}
          <EmailSignatureCard referralLink={referralLink} userName={user.name} />

          {/* Connected Accounts */}
          <ConnectedAccountsCard
            socialAccounts={initialData.socialAccounts}
            onRefresh={refreshDashboard}
          />
        </div>
      </div>
      <StickyShareFooter referrals={initialData.stats.referrals} referralLink={referralLink} />
    </>
  )
}
