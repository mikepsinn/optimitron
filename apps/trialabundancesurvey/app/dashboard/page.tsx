import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "../../components/layout"
import { getSessionUser } from "@/lib/auth-utils"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  getUserTrialAbundanceAllocation,
  getUserTrialAbundanceSelfFundedAccessVote,
  getUserTrialAbundanceVote,
} from "@/lib/trial-abundance-votes.server"
import { TRIAL_ABUNDANCE_REFERENDUM_QUESTION } from "@optimitron/db/constants"
import { buildUserReferralUrl } from "@/lib/url"
import { ReferralLinkCard } from "@/components/shared/ReferralLinkCard"
import { PendingResponseRecovery } from "./pending-response-recovery"

export const dynamic = "force-dynamic"

interface LiteDashboardPageProps {
  searchParams?: Promise<{ visual?: string }>
}

/**
 * Lite participant home — vote status + share survey.
 */
export default async function LiteDashboardPage({
  searchParams,
}: LiteDashboardPageProps) {
  const visualPreview =
    process.env.NODE_ENV === "development" &&
    (await searchParams)?.visual === "1"
  const sessionUser = visualPreview
    ? { id: "visual-preview", handle: null, referralCode: "SURVEY-DEMO" }
    : await getSessionUser()
  if (!sessionUser?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  const [vote, selfFundedAccessVote, allocation] = visualPreview
    ? [
        { answer: "YES" as const },
        { answer: "ABSTAIN" as const },
        { allocationA: 35, allocationB: 65 },
      ]
    : await Promise.all([
        getUserTrialAbundanceVote(sessionUser.id),
        getUserTrialAbundanceSelfFundedAccessVote(sessionUser.id),
        getUserTrialAbundanceAllocation(sessionUser.id),
      ])
  const headersList = await headers()
  const host = headersList.get("host") ?? "trialabundancesurvey.org"
  const proto = host.includes("localhost") ? "http" : "https"
  const surveyUrl = buildUserReferralUrl(sessionUser, `${proto}://${host}`)
  const shareTemplates = [
    {
      label: "Question",
      text: `${TRIAL_ABUNDANCE_REFERENDUM_QUESTION} I answered the Trial Abundance Survey: ${surveyUrl}`,
    },
    {
      label: "Plain",
      text: `I answered three questions about patient access to pragmatic clinical trials and how trials should be funded. Add your response: ${surveyUrl}`,
    },
  ]

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-6">
            Your survey response
          </h1>
          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            {vote ? (
              <div className="space-y-2 text-lg font-bold">
                <p>
                  Patient access:{" "}
                  <span className="text-brutal-cyan">
                    {vote.answer === "ABSTAIN" ? "NOT SURE" : String(vote.answer)}
                  </span>
                </p>
                {selfFundedAccessVote ? (
                  <p>
                    Patient-funded access:{" "}
                    <span className="text-brutal-cyan">
                      {selfFundedAccessVote.answer === "ABSTAIN"
                        ? "NOT SURE"
                        : String(selfFundedAccessVote.answer)}
                    </span>
                  </p>
                ) : null}
                {allocation ? (
                  <p>
                    Allocation: {allocation.allocationA}% military and weapons,
                    {" "}{allocation.allocationB}% pragmatic clinical trials
                  </p>
                ) : null}
              </div>
            ) : (
              <PendingResponseRecovery />
            )}
          </Card>

          <ReferralLinkCard
            referralLink={surveyUrl}
            shareTemplates={shareTemplates}
            hashtags="PragmaticTrials,ClinicalResearch"
            introText="Invite someone else to answer the same three questions with your personal referral link."
            copyLinkLabel="COPY SURVEY LINK"
            linkContentType="trial_abundance_referral"
            className="mb-6"
          />
        </Container>
      </SectionContainer>
    </Layout>
  )
}
