"use client"

import { Button } from "@/components/retroui/Button"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { buildUserReferralUrl } from "@/lib/url"
import { ImpactLedgerCard } from "@/components/dashboard/ImpactLedgerCard"
import { ReferralLinkCard } from "@/components/dashboard/ReferralLinkCard"
import { ReferralGoalCard } from "@/components/dashboard/ReferralGoalCard"
import { GlobalProgressCard } from "@/components/dashboard/GlobalProgressCard"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { BadgesSection } from "@/components/dashboard/BadgesSection"
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard"
import { OrganizationsCard } from "@/components/dashboard/OrganizationsCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { ShareTemplatesCard } from "@/components/dashboard/ShareTemplatesCard"
import { StickyShareFooter } from "@/components/dashboard/StickyShareFooter"
import { QuestChecklistCard } from "@/components/dashboard/QuestChecklistCard"
import { ImpactReceiptsCard } from "@/components/dashboard/ImpactReceiptsCard"
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard"

export function DashboardClient({
  initialData,
  leaderboard,
}: {
  initialData: DashboardData
  leaderboard: LeaderboardEntry[]
}) {
  const referralLink = buildUserReferralUrl(initialData.user)

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

          {/* Referral Link + Referral Goal — most important action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" id="referral">
            <ReferralLinkCard referralLink={referralLink} className="h-full" />
            <ReferralGoalCard stats={initialData.stats} />
          </div>

          {/* Quest Checklist */}
          <QuestChecklistCard quests={initialData.questChecklist} />

          {/* Impact Ledger */}
          <div className="mb-8" id="impact-ledger">
            <ImpactLedgerCard votesLogged={initialData.stats.referrals} />
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
                user={initialData.user}
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
          <div id="share-templates">
            <ShareTemplatesCard referralLink={referralLink} />
          </div>

          <ImpactReceiptsCard receipts={initialData.impactReceipts} />
        </div>
      </div>
      <StickyShareFooter referrals={initialData.stats.referrals} referralLink={referralLink} />
    </>
  )
}
