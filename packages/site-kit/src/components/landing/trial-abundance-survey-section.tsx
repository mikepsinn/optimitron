"use client"

import { TRIAL_ABUNDANCE_REFERENDUM_QUESTION } from "@optimitron/db/constants"
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import confetti from "canvas-confetti"
import { AnimatePresence, motion } from "framer-motion"
import { CheckSquare, Square } from "lucide-react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { trackVoteSubmitted } from "../../lib/analytics"
import type { TrialAbundanceAnswer } from "../../lib/storage"
import { storage } from "../../lib/storage"
import { syncPendingTrialAbundanceResponse } from "../../lib/trial-abundance-survey"
import { buildUserReferralUrl, getBaseUrl } from "../../lib/url"
import { AuthForm } from "../auth/AuthForm"
import { ReferralLinkCard } from "../shared/ReferralLinkCard"
import { ParameterValue } from "../shared/ParameterValue"
import { PragmaticTrialsDialog } from "./PragmaticTrialsDialog"

const ratio = MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value
const formattedRatio = `$${Math.round(ratio)}`

type SurveyStage = "allocation" | "question" | "complete"
export type TrialAbundanceVisualState = "question" | "complete"

interface TrialAbundanceSurveySectionProps {
  disableIntroAnimation?: boolean
  organizationId?: string
  sectionId?: string
  visualState?: TrialAbundanceVisualState
}

const answerOptions: Array<{
  answer: TrialAbundanceAnswer
  label: string
}> = [
  { answer: "YES", label: "Yes" },
  { answer: "ABSTAIN", label: "Not sure" },
  { answer: "NO", label: "No" },
]

function celebrateResponse() {
  const colors = ["#FF6B9D", "#00D9FF", "#FFE66D"]
  const bursts: Array<confetti.Options & { particleCount: number }> = [
    { particleCount: 50, spread: 26, startVelocity: 55 },
    { particleCount: 40, spread: 60 },
    { particleCount: 70, spread: 100, decay: 0.91, scalar: 0.8 },
    { particleCount: 40, spread: 120, startVelocity: 35, decay: 0.92 },
  ]

  for (const burst of bursts) {
    confetti({ ...burst, colors, origin: { y: 0.7 } })
  }
}

export default function TrialAbundanceSurveySection({
  disableIntroAnimation = false,
  organizationId,
  sectionId = "vote",
  visualState,
}: TrialAbundanceSurveySectionProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get("ref") ?? null
  const inviteToken = searchParams?.get("invite") ?? null
  const isVisualCapture = visualState !== undefined
  const [stage, setStage] = useState<SurveyStage>(
    visualState === "complete"
      ? "complete"
      : visualState === "question"
        ? "question"
        : "allocation",
  )
  const [answer, setAnswer] = useState<TrialAbundanceAnswer | null>(
    visualState === "complete" ? "YES" : null,
  )
  const [militaryAllocation, setMilitaryAllocation] = useState(50)
  const [userHasDragged, setUserHasDragged] = useState(
    disableIntroAnimation || isVisualCapture,
  )
  const [syncState, setSyncState] = useState<
    "idle" | "saving" | "saved" | "local"
  >(visualState === "complete" ? "local" : "idle")
  const completionRef = useRef<HTMLDivElement>(null)
  const hasRetriedSync = useRef(false)

  useEffect(() => {
    if (isVisualCapture) return

    const pending = storage.getPendingTrialAbundanceResponse()
    if (!pending) return

    setMilitaryAllocation(pending.militaryAllocationPercent)
    setAnswer(pending.answer)
    setStage("complete")
    setUserHasDragged(true)
    setSyncState("local")
  }, [isVisualCapture])

  useEffect(() => {
    if (
      isVisualCapture ||
      status !== "authenticated" ||
      !session ||
      hasRetriedSync.current ||
      !storage.getPendingTrialAbundanceResponse()
    ) {
      return
    }

    hasRetriedSync.current = true
    setSyncState("saving")
    void syncPendingTrialAbundanceResponse(session).then((saved) => {
      setSyncState(saved ? "saved" : "local")
    })
  }, [isVisualCapture, session, status])

  const clinicalTrialsAllocation = 100 - militaryAllocation
  const shareUrl = session?.user
    ? buildUserReferralUrl(session.user, getBaseUrl())
    : getBaseUrl()
  const shareTemplates = useMemo(
    () => [
      {
        label: "Question",
        text: `${TRIAL_ABUNDANCE_REFERENDUM_QUESTION} I answered the Trial Abundance Survey: ${shareUrl}`,
      },
      {
        label: "Plain",
        text: `I answered a short survey about patient access to pragmatic clinical trials. Add your response: ${shareUrl}`,
      },
    ],
    [shareUrl],
  )

  const handleSliderChange = (clinicalTrialsPercent: number) => {
    setMilitaryAllocation(100 - clinicalTrialsPercent)
    setUserHasDragged(true)
  }

  const handleAnswer = async (selectedAnswer: TrialAbundanceAnswer) => {
    setAnswer(selectedAnswer)
    setStage("complete")
    trackVoteSubmitted({
      answer: selectedAnswer,
      authenticated: status === "authenticated",
      voteType: "trial_abundance_survey",
    })
    celebrateResponse()

    const response = {
      answer: selectedAnswer,
      inviteToken,
      militaryAllocationPercent: militaryAllocation,
      organizationId: organizationId ?? null,
      referredBy: referralCode,
      sourceReferrer: document.referrer || null,
      sourceUrl: `${window.location.origin}${window.location.pathname}`,
      timestamp: new Date().toISOString(),
    }
    storage.setPendingTrialAbundanceResponse(response)
    setSyncState("local")

    window.setTimeout(() => {
      completionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 350)

    if (status === "authenticated" && session) {
      setSyncState("saving")
      const saved = await syncPendingTrialAbundanceResponse(session)
      setSyncState(saved ? "saved" : "local")
    }
  }

  return (
    <SectionContainer
      id={sectionId}
      bgColor="yellow"
      borderPosition="bottom"
      padding="sm"
      className="pb-24"
    >
      <Container>
        <h1 className="mb-3 text-center text-3xl font-black uppercase sm:text-4xl md:text-6xl">
          Trial <span className="text-brutal-pink">Abundance</span> Survey
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-base font-bold sm:text-lg">
          Two questions about how we fund medical evidence and how patients can
          take part in producing it.
        </p>

        <AnimatePresence mode="wait">
          {stage === "allocation" ? (
            <motion.div
              key="allocation"
              initial={disableIntroAnimation ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SurveyCard>
                <p className="mb-8 text-center text-lg font-bold leading-snug sm:text-2xl">
                  How would you split your country&apos;s finite resources between{" "}
                  <span className="text-brutal-pink">weapons and military</span>{" "}
                  and{" "}
                  <PragmaticTrialsDialog triggerClassName="inline text-brutal-pink underline decoration-dotted underline-offset-2">
                    pragmatic clinical trials
                  </PragmaticTrialsDialog>
                  ?
                </p>

                <AllocationDisplay
                  clinicalTrialsAllocation={clinicalTrialsAllocation}
                  militaryAllocation={militaryAllocation}
                />

                <input
                  aria-label="Clinical trials allocation percentage"
                  type="range"
                  min="0"
                  max="100"
                  value={clinicalTrialsAllocation}
                  onChange={(event) =>
                    handleSliderChange(Number(event.target.value))
                  }
                  className="slider-brutal h-4 w-full cursor-pointer appearance-none rounded-none border-4 border-primary bg-background"
                  style={{
                    background:
                      "linear-gradient(to right, #FF6B9D 0%, #FF6B9D 49%, #FFE66D 49%, #FFE66D 51%, #00D9FF 51%, #00D9FF 100%)",
                  }}
                />
                <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
                  Move the slider to continue.
                </p>

                {userHasDragged ? (
                  <Button
                    onClick={() => setStage("question")}
                    className="mt-6 h-16 w-full border-4 border-primary bg-brutal-cyan text-xl font-black uppercase text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Next question
                  </Button>
                ) : null}
              </SurveyCard>
            </motion.div>
          ) : null}

          {stage === "question" ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SurveyCard>
                <p className="text-sm font-black uppercase text-brutal-pink">
                  Question 2 of 2
                </p>
                <h2 className="text-xl font-black leading-snug sm:text-3xl">
                  {TRIAL_ABUNDANCE_REFERENDUM_QUESTION}
                </h2>
                <p className="font-bold text-muted-foreground">
                  Pragmatic trials compare treatments during routine care.
                  Participation remains voluntary.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {answerOptions.map((option) => (
                    <Button
                      key={option.answer}
                      type="button"
                      variant="outline"
                      onClick={() => void handleAnswer(option.answer)}
                      className="h-16 justify-start border-4 border-primary bg-background px-5 text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {answer === option.answer ? (
                        <CheckSquare className="mr-2 h-6 w-6" />
                      ) : (
                        <Square className="mr-2 h-6 w-6" />
                      )}
                      {option.label}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStage("allocation")}
                  className="self-start px-0 font-black uppercase underline"
                >
                  Back to allocation
                </Button>
              </SurveyCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {stage === "complete" ? (
          <div ref={completionRef} className="space-y-8">
            <SurveyCard>
              <p className="text-sm font-black uppercase text-brutal-pink">
                Response complete
              </p>
              <h2 className="text-3xl font-black uppercase sm:text-4xl">
                Thank you
              </h2>
              <p className="text-lg font-bold">
                You allocated {militaryAllocation}% to military and weapons and{" "}
                {clinicalTrialsAllocation}% to pragmatic clinical trials. Your
                patient-access answer was{" "}
                <span className="text-brutal-pink">
                  {answer === "ABSTAIN" ? "NOT SURE" : answer}
                </span>
                .
              </p>
              <p className="font-bold text-muted-foreground">
                {syncState === "saved"
                  ? "Your verified response is saved."
                  : syncState === "saving"
                    ? "Saving your verified response..."
                    : "Your response is saved on this device. Verify below to store it with your account."}
              </p>
            </SurveyCard>

            <RealityCheck />

            {status === "authenticated" && session?.user ? (
              <ReferralLinkCard
                referralLink={shareUrl}
                shareTemplates={shareTemplates}
                hashtags="PragmaticTrials,ClinicalResearch"
                introText="Invite someone else to answer the same two questions. Their response will be attributed to your referral link."
                copyLinkLabel="COPY SURVEY LINK"
                linkContentType="trial_abundance_referral"
              />
            ) : (
              <Card className="mx-auto max-w-3xl border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
                <h2 className="mb-2 text-2xl font-black uppercase">
                  Save your response
                </h2>
                <p className="mb-6 font-bold">
                  Verify once to store this response and get a personal survey
                  link for referrals.
                </p>
                <AuthForm
                  callbackUrl="/#vote"
                  referralCode={referralCode}
                  inviteToken={inviteToken}
                  defaultEmailOpen
                  showSubscribe={false}
                  emailButtonLabel="Email me a verification link"
                  emailLoadingLabel="Sending verification link..."
                  emailSuccessMessage="Open the link to store your response and create your referral link."
                />
              </Card>
            )}
          </div>
        ) : null}
      </Container>
    </SectionContainer>
  )
}

function SurveyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mx-auto flex max-w-3xl flex-col gap-6 border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
      {children}
    </Card>
  )
}

function AllocationDisplay({
  clinicalTrialsAllocation,
  militaryAllocation,
}: {
  clinicalTrialsAllocation: number
  militaryAllocation: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 text-center">
        <div className="mb-2 text-4xl font-black text-brutal-pink sm:text-5xl">
          {militaryAllocation}%
        </div>
        <div className="text-sm font-bold uppercase sm:text-base">
          Military &amp; weapons
        </div>
      </div>
      <div className="shrink-0 border-4 border-primary bg-brutal-yellow px-3 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        vs
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-4xl font-black text-brutal-cyan sm:text-5xl">
          {clinicalTrialsAllocation}%
        </div>
        <div className="text-sm font-bold uppercase sm:text-base">
          Clinical trials
        </div>
      </div>
    </div>
  )
}

function RealityCheck() {
  return (
    <Card className="mx-auto max-w-3xl border-4 border-primary bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
      <h2 className="mb-4 text-2xl font-black uppercase">After you answer</h2>
      <p className="mb-4 text-lg font-bold">
        Governments spend about{" "}
        <span className="text-brutal-pink">{formattedRatio}</span> on military
        systems for every <span className="text-brutal-pink">$1</span> on
        government-funded clinical trials.
      </p>
      <p className="font-bold">
        The current model estimates that a 1% reallocation could increase trial
        capacity by{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
          format={{ precision: 1 }}
          className="font-black text-brutal-pink"
        />
        , reducing the modeled treatment-research queue from{" "}
        <ParameterValue
          param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
          format={{ precision: 0 }}
          className="font-black text-brutal-pink"
        />{" "}
        years to{" "}
        <ParameterValue
          param={DFDA_QUEUE_CLEARANCE_YEARS}
          format={{ precision: 0 }}
          className="font-black text-brutal-pink"
        />{" "}
        years.
      </p>
    </Card>
  )
}
