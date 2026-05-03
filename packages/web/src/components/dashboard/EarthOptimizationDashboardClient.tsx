"use client"

import { useState } from "react"
import { Button } from "@/components/retroui/Button"
import { LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { ReferralInvitationStatusCard } from "@/components/dashboard/ReferralInvitationStatusCard"
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer"
import { SortableTaskList } from "@/components/tasks/task-list-controls"
import type { TaskCardTask } from "@/components/tasks/task-card"
import { QuestChecklistCard } from "@/components/dashboard/QuestChecklistCard"
import { ImpactReceiptsCard } from "@/components/dashboard/ImpactReceiptsCard"
import { useRequestSiteOrigin } from "@/lib/request-site-origin"
import {
  DASHBOARD_INVITE_SECTION_ID,
  DASHBOARD_REFERRAL_SECTION_ID,
  ROUTES,
} from "@/lib/routes"
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard"

export function EarthOptimizationDashboardClient({
  initialData,
  leaderboard,
  topTasks,
}: {
  initialData: DashboardData
  leaderboard: LeaderboardEntry[]
  topTasks: TaskCardTask[]
}) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [user, setUser] = useState(initialData.user)
  const baseUrl = useRequestSiteOrigin()
  const referralLink = buildUserReferralUrl(user, baseUrl)

  const refreshPage = () => {
    void updateSession()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] pb-20 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-10 border-b border-[var(--treaty-ink)]/30 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight sm:text-4xl">
                EARTH OPTIMIZATION
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void signOut({ callbackUrl: ROUTES.home })
              }}
              className="min-h-11 border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf] sm:px-4"
            >
              <LogOut className="h-4 w-4 stroke-[2.5px]" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </Button>
          </div>
        </header>

        <section className="mx-auto mb-10 max-w-2xl space-y-4" id={DASHBOARD_INVITE_SECTION_ID}>
          <TreatyReminderComposer defaultRecipientMode="one_human" />
          <ReferralInvitationStatusCard />
        </section>

        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2" id={DASHBOARD_REFERRAL_SECTION_ID}>
          <ReferralLinkCard
            user={user}
            baseUrl={baseUrl}
            onUserChange={setUser}
            onRefresh={refreshPage}
            className="h-full"
          />
          <ReferralGoalCard stats={initialData.stats} />
        </section>

        {topTasks.length > 0 ? (
          <section className="mb-10 space-y-3">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Top Tasks <span>For You</span>
            </h2>
            <SortableTaskList tasks={topTasks} />
          </section>
        ) : null}

        <details className="border-t border-[var(--treaty-ink)]/30 pt-5">
          <summary className="cursor-pointer list-none text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)]">
            More dashboard
          </summary>
          <div className="mt-8 space-y-8">
            {/* Quest Checklist */}
            <QuestChecklistCard quests={initialData.questChecklist} />

            {/* Impact Ledger */}
            <div id="impact-ledger">
              <ImpactLedgerCard votesLogged={initialData.stats.referrals} />
            </div>

            {/* Global Progress */}
            <GlobalProgressCard progress={initialData.globalProgress} />

            {/* Stats Overview */}
            <StatsOverview stats={initialData.stats} />

            {/* Badges */}
            <BadgesSection badges={initialData.badges} />

            {/* Leaderboard + Organizations */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {leaderboard.length > 0 && (
                <LeaderboardCard
                  leaderboard={leaderboard}
                  user={user}
                  stats={initialData.stats}
                />
              )}
              {initialData.organizations.created.length > 0 && (
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
        </details>
      </div>
    </div>
  )
}
