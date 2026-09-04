"use client"

import {
  TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
} from "@optimitron/db/constants"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import confetti from "canvas-confetti"
import { AnimatePresence, motion } from "framer-motion"
import { CheckSquare, Square } from "lucide-react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { trackVoteSubmitted } from "../../lib/analytics"
import type { TrialAbundanceAnswer } from "../../lib/storage"
import { storage } from "../../lib/storage"
import { syncPendingTrialAbundanceResponse } from "../../lib/trial-abundance-survey"
import { buildUserReferralUrl, getBaseUrl } from "../../lib/url"
import { AuthForm } from "../auth/AuthForm"
import { ReferralLinkCard } from "../shared/ReferralLinkCard"
import { PragmaticTrialsDialog } from "./PragmaticTrialsDialog"
import { SurveyParticipantFields } from "./survey-participant-fields"
import type { ParticipantDraft } from "./survey-participant-fields"
import { surveyParticipantSchema } from "../../lib/survey-participant"
import { AlertCard } from "@optimitron/neobrutalist-ui/ui/alert-card"

type SurveyStage =
  | "patient-access"
  | "self-funded-access"
  | "allocation"
  | "details"
  | "complete"
export type { TrialAbundanceVisualState } from "../../lib/trial-abundance-visual"
import type { TrialAbundanceVisualState } from "../../lib/trial-abundance-visual"

interface TrialAbundanceSurveySectionProps {
  disableIntroAnimation?: boolean
  organizationId?: string
  sectionId?: string
  visualState?: TrialAbundanceVisualState
  initialParticipant?: Partial<ParticipantDraft>
  headingAs?: "h1" | "h2"
  title?: string
  description?: string
}

const answerOptions: Array<{
  answer: TrialAbundanceAnswer
  label: string
}> = [
  { answer: "YES", label: "Yes" },
  { answer: "ABSTAIN", label: "Not sure" },
  { answer: "NO", label: "No" },
]

const pragmaticTrialPattern = /pragmatic clinical trials?/i
const pragmaticTrialTriggerClassName =
  "inline text-brutal-pink underline decoration-dotted underline-offset-2"

function PragmaticTrialQuestion({ question }: { question: string }) {
  const match = pragmaticTrialPattern.exec(question)
  if (!match || match.index === undefined) return question

  return (
    <>
      {question.slice(0, match.index)}
      <PragmaticTrialsDialog triggerClassName={pragmaticTrialTriggerClassName}>
        {match[0]}
      </PragmaticTrialsDialog>
      {question.slice(match.index + match[0].length)}
    </>
  )
}

function getInitialStage(
  visualState: TrialAbundanceVisualState | undefined,
): SurveyStage {
  if (visualState === "self-funded") return "self-funded-access"
  if (visualState === "allocation") return "allocation"
  if (visualState === "details") return "details"
  if (visualState === "save-error") return "complete"
  if (visualState === "complete") return "complete"
  return "patient-access"
}

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
  initialParticipant,
  headingAs: Heading = "h1",
  title,
  description,
}: TrialAbundanceSurveySectionProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get("ref") ?? null
  const inviteToken = searchParams?.get("invite") ?? null
  const isVisualCapture = visualState !== undefined
  const [stage, setStage] = useState<SurveyStage>(getInitialStage(visualState))
  const StepHeading = stage === "patient-access" && title ? "h2" : Heading
  const [patientAccessAnswer, setPatientAccessAnswer] =
    useState<TrialAbundanceAnswer | null>(
      visualState === "complete" ? "YES" : null,
    )
  const [selfFundedAccessAnswer, setSelfFundedAccessAnswer] =
    useState<TrialAbundanceAnswer | null>(
      visualState === "complete" ? "YES" : null,
    )
  const [militaryAllocation, setMilitaryAllocation] = useState(50)
  const [userHasDragged, setUserHasDragged] = useState(
    disableIntroAnimation || isVisualCapture,
  )
  const completionRef = useRef<HTMLDivElement>(null)
  const hasRetriedSync = useRef(false)
  const [participant, setParticipant] = useState<ParticipantDraft>({
    countryCode: "", regionCode: "", role: "", story: "", updates: false,
    ...initialParticipant,
  })
  const participantEdited = useRef(false)
  const saveInFlight = useRef(false)
  const [participantError, setParticipantError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    visualState === "save-error" ? "error" : "idle",
  )

  const saveResponse = useCallback(async () => {
    if (saveInFlight.current) return
    saveInFlight.current = true
    setSaveStatus("saving")
    const pending = storage.getPendingTrialAbundanceResponse()
    const saved = await syncPendingTrialAbundanceResponse()
    saveInFlight.current = false
    setSaveStatus(saved ? "saved" : "error")
    if (saved && pending) {
      trackVoteSubmitted({ answer: pending.patientAccessAnswer, authenticated: true, voteType: "trial_abundance_survey" })
      celebrateResponse()
    }
  }, [])

  useEffect(() => {
    if (isVisualCapture || status !== "authenticated") return
    const controller = new AbortController()
    void fetch("/api/survey/profile", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((profile: Partial<ParticipantDraft> | null) => {
        if (!profile || participantEdited.current) return
        setParticipant((current) => ({ ...current,
          countryCode: profile.countryCode || current.countryCode,
          regionCode: profile.regionCode || current.regionCode,
          role: profile.role || current.role,
        }))
      }).catch(() => { /* The user can enter details if profile loading fails. */ })
    return () => controller.abort()
  }, [isVisualCapture, status])

  useEffect(() => {
    if (isVisualCapture) return

    const pending = storage.getPendingTrialAbundanceResponse()
    if (!pending) return

    if (!pending.patientAccessAnswer || !pending.selfFundedAccessAnswer) {
      storage.removePendingTrialAbundanceResponse()
      return
    }

    setMilitaryAllocation(pending.militaryAllocationPercent)
    setPatientAccessAnswer(pending.patientAccessAnswer)
    setSelfFundedAccessAnswer(pending.selfFundedAccessAnswer)
    if (pending.participant) {
      participantEdited.current = true
      setParticipant(pending.participant)
    }
    setStage("complete")
    setUserHasDragged(true)
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
    void saveResponse()
  }, [isVisualCapture, session, status, saveResponse])

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
        text: `I answered three questions about patient access to pragmatic clinical trials and how trials should be funded. Add your response: ${shareUrl}`,
      },
    ],
    [shareUrl],
  )

  const handleSliderChange = (clinicalTrialsPercent: number) => {
    setMilitaryAllocation(100 - clinicalTrialsPercent)
    setUserHasDragged(true)
  }

  const handlePatientAccessAnswer = (selectedAnswer: TrialAbundanceAnswer) => {
    setPatientAccessAnswer(selectedAnswer)
    setStage("self-funded-access")
  }

  const handleSelfFundedAccessAnswer = (
    selectedAnswer: TrialAbundanceAnswer,
  ) => {
    setSelfFundedAccessAnswer(selectedAnswer)
    setStage("allocation")
  }

  const handleComplete = async () => {
    if (!patientAccessAnswer || !selfFundedAccessAnswer) return
    const parsed = surveyParticipantSchema.safeParse(participant)
    if (!parsed.success) {
      setParticipantError(parsed.error.issues[0]?.message ?? "Please check your details.")
      return
    }
    setParticipantError(null)

    setStage("complete")

    const response = {
      submissionKey: crypto.randomUUID(),
      participant: parsed.data,
      inviteToken,
      militaryAllocationPercent: militaryAllocation,
      organizationId: organizationId ?? null,
      patientAccessAnswer,
      referredBy: referralCode,
      selfFundedAccessAnswer,
      sourceReferrer: document.referrer || null,
      sourceUrl: `${window.location.origin}${window.location.pathname}`,
      timestamp: new Date().toISOString(),
    }
    storage.setPendingTrialAbundanceResponse(response)

    window.setTimeout(() => {
      completionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 350)

    if (status === "authenticated" && session) {
      await saveResponse()
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
        {stage === "patient-access" && (title || description) ? (
          <div className="mb-10 text-center">
            {title ? (
              <Heading className="mb-3 text-3xl font-black uppercase sm:text-4xl md:text-6xl">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="mx-auto max-w-2xl text-base font-bold sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {stage === "patient-access" ? (
            <motion.div
              key="patient-access"
              initial={disableIntroAnimation ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SurveyCard>
                <p className="text-sm font-black uppercase text-brutal-pink">
                  Question 1 of 3
                </p>
                <StepHeading className="text-xl font-black leading-snug sm:text-3xl">
                  <PragmaticTrialQuestion
                    question={TRIAL_ABUNDANCE_REFERENDUM_QUESTION}
                  />
                </StepHeading>
                <p className="font-bold text-muted-foreground">
                  Pragmatic trials compare treatments during routine care.
                  Participation remains voluntary and requires informed consent
                  and appropriate safety oversight.
                </p>
                <AnswerButtons
                  selectedAnswer={patientAccessAnswer}
                  onSelect={handlePatientAccessAnswer}
                />
              </SurveyCard>
            </motion.div>
          ) : null}

          {stage === "self-funded-access" ? (
            <motion.div
              key="self-funded-access"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SurveyCard>
                <p className="text-sm font-black uppercase text-brutal-pink">
                  Question 2 of 3
                </p>
                <StepHeading className="text-xl font-black leading-snug sm:text-3xl">
                  <PragmaticTrialQuestion
                    question={TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION}
                  />
                </StepHeading>
                <p className="font-bold text-muted-foreground">
                  This asks whether the patient may cover trial costs. It does
                  not waive informed consent or safety oversight.
                </p>
                <AnswerButtons
                  selectedAnswer={selfFundedAccessAnswer}
                  onSelect={handleSelfFundedAccessAnswer}
                />
                <BackButton onClick={() => setStage("patient-access")}>
                  Back to patient access
                </BackButton>
              </SurveyCard>
            </motion.div>
          ) : null}

          {stage === "allocation" ? (
            <motion.div
              key="allocation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SurveyCard>
                <p className="text-sm font-black uppercase text-brutal-pink">
                  Question 3 of 3
                </p>
                <StepHeading className="text-center text-lg font-bold leading-snug sm:text-2xl">
                  Considering only these two priorities, how would you split
                  public spending between military and weapons and{" "}
                  <PragmaticTrialsDialog triggerClassName={pragmaticTrialTriggerClassName}>
                    pragmatic clinical trials
                  </PragmaticTrialsDialog>
                  ?
                </StepHeading>

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
                <p className="text-center text-sm font-bold text-muted-foreground">
                  Move the slider to record your allocation.
                </p>

                {userHasDragged ? (
                  <Button
                    onClick={() => setStage("details")}
                    className="h-16 w-full border-4 border-primary bg-brutal-cyan text-xl font-black uppercase text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Continue
                  </Button>
                ) : null}
                <BackButton onClick={() => setStage("self-funded-access")}>
                  Back to patient-funded access
                </BackButton>
              </SurveyCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {stage === "details" ? (
          <SurveyCard>
            <StepHeading className="text-2xl font-black uppercase">About you</StepHeading>
            <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); void handleComplete() }}>
              <SurveyParticipantFields value={participant} onChange={(value) => {
                participantEdited.current = true
                setParticipant(value)
              }} />
              {participantError ? <AlertCard type="error" message={participantError} /> : null}
              <Button type="submit" className="h-14 text-lg font-black uppercase">
                {status === "authenticated" ? "Save my response" : "Continue to verification"}
              </Button>
            </form>
            <BackButton onClick={() => setStage("allocation")}>Back to allocation</BackButton>
          </SurveyCard>
        ) : null}

        {stage === "complete" ? (
          <div ref={completionRef} className="space-y-8">
            {saveStatus === "saved" && session?.user ? (
              <>
                <StepHeading className="sr-only">Survey complete</StepHeading>
                <ReferralLinkCard
                  referralLink={shareUrl}
                  shareTemplates={shareTemplates}
                  hashtags="PragmaticTrials,ClinicalResearch"
                  introText="Invite someone else to answer the same three questions. Their response will be attributed to your referral link."
                  copyLinkLabel="COPY SURVEY LINK"
                  linkContentType="trial_abundance_referral"
                />
              </>
            ) : status === "authenticated" || visualState === "save-error" ? (
              <SurveyCard>
                <StepHeading className="sr-only">Save your response</StepHeading>
                {saveStatus === "error" ? <>
                  <AlertCard type="error" message="We could not save your response. Your answers are still in this browser." />
                  <Button onClick={() => void saveResponse()}>Retry save</Button>
                </> : <p role="status" className="font-bold">Saving your response…</p>}
              </SurveyCard>
            ) : (
              <Card className="mx-auto max-w-3xl border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
                <StepHeading className="mb-2 text-2xl font-black uppercase">
                  Save your response
                </StepHeading>
                <p className="mb-6 font-bold">
                  Verify once to store this response and get a personal survey
                  link for referrals.
                </p>
                <AuthForm
                  callbackUrl="/dashboard"
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

      <style jsx>{`
        .slider-brutal::-webkit-slider-thumb {
          appearance: none;
          width: 32px;
          height: 32px;
          background: black;
          border: 4px solid black;
          border-radius: 0;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
        }

        .slider-brutal::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: black;
          border: 4px solid black;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
          border-radius: 0;
        }
      `}</style>
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

function AnswerButtons({
  onSelect,
  selectedAnswer,
}: {
  onSelect: (answer: TrialAbundanceAnswer) => void
  selectedAnswer: TrialAbundanceAnswer | null
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {answerOptions.map((option) => (
        <Button
          key={option.answer}
          type="button"
          variant="outline"
          onClick={() => onSelect(option.answer)}
          className="h-16 justify-start border-4 border-primary bg-background px-5 text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {selectedAnswer === option.answer ? (
            <CheckSquare className="mr-2 h-6 w-6" />
          ) : (
            <Square className="mr-2 h-6 w-6" />
          )}
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function BackButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="self-start px-0 font-black uppercase underline"
    >
      {children}
    </Button>
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
