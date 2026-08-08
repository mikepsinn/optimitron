"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Activity, Award, BarChart3, Building2, Goal, LogOut, Mail, Trophy } from "lucide-react"
import { ReferralLinkCard } from "@/components/shared/ReferralLinkCard"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { getSiteConfig } from "@/lib/site-config"
import { syncPendingVote } from "@/lib/vote-utils"
import { buildUserReferralUrl } from "@/lib/url"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { ReferralGoalCard } from "@/components/dashboard/ReferralGoalCard"
import { GlobalProgressCard } from "@/components/dashboard/GlobalProgressCard"
import { ProfileCard } from "@/components/dashboard/ProfileCard"
import { BadgesSection } from "@/components/dashboard/BadgesSection"
import { ImpactLedgerCard } from "@/components/dashboard/ImpactLedgerCard"
import { ImpactTreeCard } from "@/components/dashboard/ImpactTreeCard"
import { ReferralInvitationsCard } from "@/components/dashboard/ReferralInvitationsCard"
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard"
import { CampaignsCard } from "@/components/dashboard/CampaignsCard"
import { OrganizationsCard } from "@/components/dashboard/OrganizationsCard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { EmailSignatureCard } from "@/components/dashboard/EmailSignatureCard"
import { StickyShareFooter } from "@/components/dashboard/StickyShareFooter"
import { MilitaryVsClinicalTrialsAllocationCard } from "@/components/dashboard/MilitaryVsClinicalTrialsAllocationCard"
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard"

export function DashboardClient({
  initialData,
  leaderboard,
}: {
  initialData: DashboardData
  leaderboard: LeaderboardEntry[]
}) {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent
  const router = useRouter()
  const { data: session, status } = useSession()
  const referralLink = buildUserReferralUrl(initialData.user)
  const [openSections, setOpenSections] = useState<string[]>([])
  const hasCampaigns = initialData.campaigns.created.length > 0 || initialData.campaigns.pledged.length > 0
  const hasOrganizations = initialData.organizations?.created.length > 0
  const hasBadges = initialData.badges.length > 0
  const hasActivity = initialData.activities.length > 0
  const hasLeaderboard = leaderboard.length > 0

  // Sync pending vote from localStorage when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Refresh router after successful sync to update stats
      syncPendingVote(session, () => {
        router.refresh()
      })
    }
  }, [status, session, router])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleMetricClick = (type: "referrals" | "shares" | "reach" | "rank") => {
    switch (type) {
      case "referrals":
        scrollToSection("referral")
        break
      case "shares":
        setOpenSections((current) => (current.includes("activity") ? current : [...current, "activity"]))
        setTimeout(() => scrollToSection("activity"), 50)
        break
      case "reach":
        // Tooltip handles this - no action needed
        break
      case "rank":
        setOpenSections((current) => (current.includes("leaderboard") ? current : [...current, "leaderboard"]))
        setTimeout(() => scrollToSection("leaderboard"), 50)
        break
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-32">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-4">
                  {showPoliticalContent ? (
                    <>ERADICATE DISEASE<span className="text-brutal-pink"> TODAY</span></>
                  ) : (
                    <>YOUR <span className="text-brutal-pink">SURVEY RESULTS</span></>
                  )}
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

          {/* Referral Link + Goal (Action) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ReferralLinkCard referralLink={referralLink} className="h-full" id="referral" />
            <ProfileCard user={initialData.user} />
          </div>

          {/* Impact Ledger — kept below share/profile so the share action stays above the fold */}
          {showPoliticalContent && (
            <div className="mb-8" id="impact-ledger">
              <ImpactLedgerCard votesLogged={initialData.stats.referrals} />
            </div>
          )}

          {/* Impact Tree — full referral-tree view (direct + downstream + generations) */}
          <div className="mb-8" id="impact-tree">
            <ImpactTreeCard
              directCount={initialData.referralTree.directCount}
              totalDownstreamCount={initialData.referralTree.totalDownstreamCount}
              maxDepth={initialData.referralTree.maxDepth}
              publicRecruits={initialData.referralTree.publicRecruits}
            />
          </div>

          {/* Referral invitations - the user's named invitees with nudge actions */}
          {initialData.referralInvitations.length > 0 && (
            <div className="mb-8" id="referral-invitations">
              <ReferralInvitationsCard
                invitations={initialData.referralInvitations}
                referralLink={referralLink}
              />
            </div>
          )}

          {/* Allocation Comparison */}
          <div className="mb-8">
            <MilitaryVsClinicalTrialsAllocationCard
              userAllocation={initialData.allocation.user}
              averageAllocation={initialData.allocation.average}
            />
          </div>

          {(showPoliticalContent || hasCampaigns || hasActivity || hasBadges || hasOrganizations || hasLeaderboard) && (
            <div className="mb-8">
              <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-4">
                <AccordionItem value="goal" className="mb-4 border-2 border-primary last:border-b-2 bg-background px-6">
                  <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                    <span className="inline-flex items-center gap-2">
                      <Goal className="h-5 w-5" />
                      Referral Goal
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <ReferralGoalCard stats={initialData.stats} frameless />
                  </AccordionContent>
                </AccordionItem>

                {hasLeaderboard && (
                  <AccordionItem value="leaderboard" className="my-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Leaderboard
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <LeaderboardCard
                        leaderboard={leaderboard}
                        user={initialData.user}
                        stats={initialData.stats}
                        showPoliticalContent={showPoliticalContent}
                        frameless
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {(showPoliticalContent || hasCampaigns) && (
                  <AccordionItem value="details" className="mb-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        More Stats
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-6">
                      {showPoliticalContent && (
                        <>
                          <StatsOverview stats={initialData.stats} onMetricClick={handleMetricClick} className="mb-0" />
                          <GlobalProgressCard progress={initialData.globalProgress} className="mb-0" />
                        </>
                      )}
                      {hasCampaigns && <CampaignsCard campaigns={initialData.campaigns} className="mb-0" />}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasOrganizations && (
                  <AccordionItem value="organizations" className="my-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Your Organizations
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <OrganizationsCard organizations={initialData.organizations} frameless />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasActivity && (
                  <AccordionItem value="activity" className="my-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <ActivityFeed activities={initialData.activities} frameless />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasBadges && (
                  <AccordionItem value="awards" className="mt-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Awards
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <BadgesSection
                        badges={initialData.badges}
                        showPoliticalContent={showPoliticalContent}
                        frameless
                        className="mb-0"
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {showPoliticalContent && (
                  <AccordionItem value="signature" className="mt-4 border-2 border-primary last:border-b-2 bg-background px-6">
                    <AccordionTrigger className="text-lg sm:text-xl font-black uppercase hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Signature Generator
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <EmailSignatureCard
                        referralLink={referralLink}
                        userName={initialData.user.name}
                        frameless
                        className="mb-0"
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}

        </div>
      </div>
      {/* Sticky footer — hidden for survey variant (speculative "lives saved" claims) */}
      {showPoliticalContent && (
        <StickyShareFooter referrals={initialData.stats.referrals} referralLink={referralLink} />
      )}
    </Layout>
  )
}
