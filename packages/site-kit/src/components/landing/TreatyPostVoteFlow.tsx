"use client"

import { useMemo, useState } from "react"
import type React from "react"
import Link from "next/link"
import type { Session } from "next-auth"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { AuthForm } from "../auth/AuthForm"
import { ReferralLinkCard } from "../shared/ReferralLinkCard"
import { ParameterInline, ParameterValue } from "../shared/ParameterValue"
import { ReferralSendLoop } from "./ReferralSendLoop"
import { trackEvent } from "../../lib/analytics"
import { formatParameter } from "@optimitron/impact-params/format"
import {
  type Parameter,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DFDA_TRIAL_SUBSIDIES_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  EVENTUALLY_AVOIDABLE_DEATH_PCT,
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_WARHEAD_COUNT,
  HOURS_PER_YEAR,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT,
  RARE_DISEASES_COUNT_GLOBAL,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
  UNEXPLORED_RATIO,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/impact-params/parameters"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "../../lib/majority-humanity-target"
import { cn } from "@optimitron/neobrutalist-ui/cn"

export type TreatyPostVoteMode = "full" | "lite" | "off"

interface TreatyPostVoteFlowProps {
  answer: "yes" | "no"
  mode: TreatyPostVoteMode
  status: "authenticated" | "unauthenticated" | "loading"
  session: Session | null
  shareUrl: string
  referralCode: string | null
  inviteToken: string | null
}

const TOTAL_FULL_STEPS = 10

export function TreatyPostVoteFlow({
  answer,
  mode,
  status,
  session,
  shareUrl,
  referralCode,
  inviteToken,
}: TreatyPostVoteFlowProps) {
  const [step, setStep] = useState(0)
  const [dismissiveCount, setDismissiveCount] = useState(0)
  const [arrivedFromDismissive, setArrivedFromDismissive] = useState(false)
  const [expandedDetailIds, setExpandedDetailIds] = useState<Set<string>>(() => new Set())
  const [flowSentCount, setFlowSentCount] = useState(0)
  const isAuthenticated = status === "authenticated" && !!session?.user

  const perVoteSufferingYears = useMemo(
    () => VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value,
    []
  )

  if (mode === "off") {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="mb-4 text-center text-base font-bold sm:text-lg">Please verify to see the results!</p>
        <AuthForm
          callbackUrl="/dashboard"
          referralCode={referralCode}
          inviteToken={inviteToken}
          compact={true}
          emailOnly
          showNameField={false}
          showSubscribe={false}
          subscribeDefault={false}
          emailLabel="Email — takes 15 seconds"
          emailButtonLabel="Verify (magic link)"
          emailLoadingLabel="Sending verification link..."
          emailSuccessTitle="Check your email"
          emailSuccessMessage="We've sent you a verification link."
          emailSuccessFooter="Your vote will be saved once you verify your email."
          preSubmitContent={
            <div className="space-y-1 text-center text-xs text-muted-foreground">
              <p>This prevents duplicate submissions and keeps results legitimate.</p>
              <p>We will never post or contact you without permission.</p>
            </div>
          }
        />
      </Card>
    )
  }

  if (mode === "lite") {
    return (
      <LitePostVoteSummary
        isAuthenticated={isAuthenticated}
        shareUrl={shareUrl}
        answer={answer}
        session={session}
        onSentCountChange={setFlowSentCount}
      />
    )
  }

  const advance = (dismissive: boolean) => {
    if (dismissive) {
      setDismissiveCount((count) => count + 1)
    }
    setArrivedFromDismissive(dismissive)
    setStep((idx) => Math.min(idx + 1, TOTAL_FULL_STEPS - 1))
  }

  const trackDetailOpen = (detailId: string, stepNumber: number) => {
    if (expandedDetailIds.has(detailId)) return

    const nextCount = expandedDetailIds.size + 1
    setExpandedDetailIds((current) => {
      if (current.has(detailId)) return current
      const next = new Set(current)
      next.add(detailId)
      return next
    })
    trackEvent("post_vote_details_expanded", {
      detail_id: detailId,
      step: stepNumber,
      expanded_count: nextCount,
      engaged_skeptic: nextCount >= 3,
    })
    if (nextCount === 3) {
      trackEvent("post_vote_engaged_skeptic", { expanded_count: nextCount })
    }
  }

  if (step === 7) {
    return (
      <ReferralSendLoop
        referralUrl={shareUrl}
        isAuthenticated={isAuthenticated}
        user={session?.user ?? null}
        alt={arrivedFromDismissive}
        onSentCountChange={setFlowSentCount}
        onDone={(dismissive) => {
          if (dismissive) {
            setDismissiveCount((count) => count + 1)
          }
          setArrivedFromDismissive(dismissive)
          setStep(8)
        }}
      />
    )
  }

  return (
    <Card className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {renderFullStep({
        answer,
        step,
        arrivedFromDismissive,
        dismissiveCount,
        flowSentCount,
        perVoteSufferingYears,
        onDetailsOpen: trackDetailOpen,
        advance,
        goToStep: (nextStep, dismissive = false) => {
          if (dismissive) {
            setDismissiveCount((count) => count + 1)
          }
          setArrivedFromDismissive(dismissive)
          setStep(nextStep)
        },
      })}
    </Card>
  )
}

function renderFullStep({
  answer,
  step,
  arrivedFromDismissive,
  dismissiveCount,
  flowSentCount,
  perVoteSufferingYears,
  onDetailsOpen,
  advance,
  goToStep,
}: {
  answer: "yes" | "no"
  step: number
  arrivedFromDismissive: boolean
  dismissiveCount: number
  flowSentCount: number
  perVoteSufferingYears: number
  onDetailsOpen: (detailId: string, stepNumber: number) => void
  advance: (dismissive: boolean) => void
  goToStep: (step: number, dismissive?: boolean) => void
}) {
  switch (step) {
    case 0:
      return (
        <FlowScreen
          stepNumber={1}
          dismissLabel="Go to hell"
          advanceLabel="Fine"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          <p className="text-xl font-black leading-snug">
            {answer === "no"
              ? "You voted no. Totally fine. But I'm going to keep talking anyway because this is kind of the most important thing in the universe and it will only take a few moments of your time."
              : "I'm very sorry to bother you, but this is kind of the most important thing in the universe and it will only take a few moments of your time."}
          </p>
        </FlowScreen>
      )
    case 1:
      return (
        <FlowScreen
          stepNumber={2}
          dismissLabel="I have chosen disease"
          advanceLabel="Okay, go on"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          {arrivedFromDismissive && <AltOpener>I'm sorry but I still have to tell you this anyway.</AltOpener>}
          <p className="text-xl font-black leading-snug">
            Statistically, you and/or someone you love will get a horrible disease. 95% of diseases have zero FDA-approved
            treatments.{" "}
            <ParameterValue
              param={SAFE_COMPOUNDS_COUNT}
              format={{ precision: 0, compact: false }}
              className="font-black text-brutal-pink"
            />{" "}
            known-safe compounds sit on shelves, and{" "}
            <ParameterValue param={UNEXPLORED_RATIO} format={{ precision: 1 }} className="font-black text-brutal-pink" />{" "}
            of their potential uses have never been tested — because the money was busy turning into missiles.
          </p>
        </FlowScreen>
      )
    case 2:
      return (
        <FlowScreen
          stepNumber={3}
          dismissLabel="Seriously, stop"
          advanceLabel="Go on"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          {arrivedFromDismissive && <AltOpener>Fair. One more math thing though.</AltOpener>}
          <div className="space-y-4 text-xl font-black leading-snug">
            <p>
              <ParameterValue
                param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
                format={{ precision: 0, compact: false }}
                className="font-black text-brutal-pink"
              />{" "}
              nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Call
              that one apocalypse.
            </p>
            <p>
              Humanity has about{" "}
              <ParameterValue
                param={GLOBAL_WARHEAD_COUNT}
                format={{ precision: 0, compact: false }}
                className="font-black text-brutal-pink"
              />{" "}
              nuclear weapons. That's{" "}
              <ParameterValue
                param={NUCLEAR_WINTER_OVERKILL_FACTOR}
                format={{ precision: 0 }}
                className="font-black text-brutal-pink"
              />{" "}
              apocalypses of mass murder capacity.
            </p>
            <p>You can only ruin Earth once. The other 121 are just wasteful.</p>
            <p>
              The <ParameterInline param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} className="font-black" /> Treaty
              asks you to trade one apocalypse for something slightly nicer.
            </p>
          </div>
        </FlowScreen>
      )
    case 3:
      return (
        <FlowScreen
          stepNumber={4}
          dismissLabel="I want to check that"
          advanceLabel="Okay, I buy it"
          manualHref="https://manual.warondisease.org"
          onAdvance={() => advance(false)}
        >
          <HowWeGetToBillions alt={arrivedFromDismissive} onDetailsOpen={onDetailsOpen} />
        </FlowScreen>
      )
    case 4:
      return (
        <FlowScreen
          stepNumber={5}
          dismissLabel="Not neat"
          advanceLabel="Neat"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          <WouldntThatBeNeat alt={arrivedFromDismissive} />
        </FlowScreen>
      )
    case 5:
      return (
        <FlowScreen
          stepNumber={6}
          dismissLabel="Still too much"
          advanceLabel="Okay, two humans"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          <OnlyTwoHumans alt={arrivedFromDismissive} onDetailsOpen={onDetailsOpen} />
        </FlowScreen>
      )
    case 6:
      return (
        <FlowScreen
          stepNumber={7}
          dismissLabel="I reject mathematics"
          advanceLabel="Show me mine"
          onDismiss={() => advance(true)}
          onAdvance={() => advance(false)}
        >
          <PerVoteMath
            alt={arrivedFromDismissive}
            perVoteSufferingYears={perVoteSufferingYears}
            onDetailsOpen={onDetailsOpen}
          />
        </FlowScreen>
      )
    case 8:
      return (
        <DepthHook
          sentCount={flowSentCount}
          alt={arrivedFromDismissive}
          onDone={(dismissive) => goToStep(9, dismissive)}
        />
      )
    case 9:
    default:
      return <CloseCard dismissiveCount={dismissiveCount} />
  }
}

function FlowScreen({
  stepNumber,
  children,
  dismissLabel,
  advanceLabel,
  manualHref,
  onDismiss,
  onAdvance,
}: {
  stepNumber: number
  children: React.ReactNode
  dismissLabel: string
  advanceLabel: string
  manualHref?: string
  onDismiss?: () => void
  onAdvance: () => void
}) {
  return (
    <>
      <div className="mb-4 border-4 border-primary bg-brutal-yellow p-3 text-xs font-black uppercase">
        {stepNumber} / {TOTAL_FULL_STEPS}
      </div>
      <div className="mb-5 space-y-4">{children}</div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {manualHref ? (
          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 border-4 border-primary bg-background font-black"
          >
            <a href={manualHref} target="_blank" rel="noopener noreferrer">
              {dismissLabel}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onDismiss}
            variant="outline"
            className="h-12 flex-1 border-4 border-primary bg-background font-black"
          >
            {dismissLabel}
          </Button>
        )}
        <Button
          type="button"
          onClick={onAdvance}
          className="h-12 flex-1 border-4 border-primary bg-brutal-cyan font-black"
        >
          {advanceLabel}
        </Button>
      </div>
    </>
  )
}

function AltOpener({ children }: { children: React.ReactNode }) {
  return <p className="text-xl font-black leading-snug">{children}</p>
}

function LitePostVoteSummary({
  isAuthenticated,
  shareUrl,
  answer,
  session,
  onSentCountChange,
}: {
  isAuthenticated: boolean
  shareUrl: string
  answer: "yes" | "no"
  session: Session | null
  onSentCountChange: (count: number) => void
}) {
  return (
    <div className="space-y-5">
      <Card className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="mb-2 text-2xl font-black uppercase">{answer === "yes" ? "Vote Counted" : "Vote Counted Anyway"}</h3>
        <p className="text-sm font-bold leading-relaxed">
          One verified vote adds{" "}
          <ParameterValue param={VOTER_LIVES_SAVED} format={{ precision: 1 }} className="font-black text-brutal-pink" /> lives
          and roughly{" "}
          <ParameterInline
            param={{
              ...VOTER_SUFFERING_HOURS_PREVENTED,
              value: VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value,
              unit: "years",
            }}
            format={{ precision: 0 }}
            className="font-black text-brutal-pink"
          />{" "}
          of suffering prevented to your Inverse Kills Score.
        </p>
      </Card>
      <ReferralSendLoop
        referralUrl={shareUrl}
        isAuthenticated={isAuthenticated}
        user={session?.user ?? null}
        compact
        onSentCountChange={onSentCountChange}
      />
      <ReferralLinkCard referralLink={shareUrl} />
    </div>
  )
}

function HowWeGetToBillions({
  alt,
  onDetailsOpen,
}: {
  alt: boolean
  onDetailsOpen: (detailId: string, stepNumber: number) => void
}) {
  if (alt) {
    return (
      <div className="space-y-4 text-xl font-black leading-snug">
        <p>Fine, show your work:</p>
        <p>
          <ParameterInline param={TREATY_ANNUAL_FUNDING} format={{ compact: true, precision: 1 }} className="text-brutal-pink" />
          /year (
          <ParameterInline param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} className="text-brutal-pink" /> of{" "}
          <ParameterInline
            param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
            format={{ compact: true, precision: 2 }}
            className="text-brutal-pink"
          />{" "}
          military) →{" "}
          <ParameterInline
            param={DFDA_PATIENTS_FUNDABLE_ANNUALLY}
            format={{ compact: true, precision: 0 }}
            className="text-brutal-pink"
          />{" "}
          patients tested (at{" "}
          <ParameterInline
            param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
            format={{ precision: 0 }}
            className="text-brutal-pink"
          />{" "}
          each, not{" "}
          <ParameterInline
            param={TRADITIONAL_PHASE3_COST_PER_PATIENT}
            format={{ compact: true, precision: 0 }}
            className="text-brutal-pink"
          />
          ) →{" "}
          <ParameterInline
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            format={{ precision: 0 }}
            className="text-brutal-pink"
          />{" "}
          research capacity →{" "}
          <ParameterInline
            param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
            format={{ precision: 0 }}
            className="text-brutal-pink"
          />{" "}
          years eradication becomes{" "}
          <ParameterInline param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} className="text-brutal-pink" /> →{" "}
          <ParameterInline
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
            format={{ compact: true, precision: 1 }}
            className="text-brutal-pink"
          />{" "}
          avoidable deaths averted +{" "}
          <ParameterInline
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
            format={{ compact: true, precision: 2 }}
            className="text-brutal-pink"
          />{" "}
          hours of suffering.
        </p>
        <p>Expand any number for the derivation. Everything has a citation at manual.warondisease.org.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MathBeat
        detailId="treaty-funding"
        stepNumber={4}
        onDetailsOpen={onDetailsOpen}
        title={
          <>
            <ParameterInline param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} className="font-black text-brutal-pink" /> of
            global military spending ={" "}
            <ParameterInline
              param={TREATY_ANNUAL_FUNDING}
              format={{ compact: true, precision: 1 }}
              className="font-black text-brutal-pink"
            />{" "}
            per year.
          </>
        }
      >
        Global military spending 2024 ={" "}
        <ParameterValue
          param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
          format={{ compact: true, precision: 2 }}
          className="font-black"
        />{" "}
        (SIPRI).{" "}
        <ParameterValue param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} className="font-black" /> of that ={" "}
        <ParameterValue param={TREATY_ANNUAL_FUNDING} format={{ compact: true, precision: 1 }} className="font-black" />.
      </MathBeat>
      <MathBeat
        detailId="trial-cost-and-patient-capacity"
        stepNumber={4}
        onDetailsOpen={onDetailsOpen}
        title={
          <>
            Pragmatic clinical trials cost{" "}
            <ParameterInline
              param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
              format={{ precision: 0 }}
              className="font-black text-brutal-pink"
            />
            /patient, not{" "}
            <ParameterInline
              param={TRADITIONAL_PHASE3_COST_PER_PATIENT}
              format={{ compact: true, precision: 0 }}
              className="font-black text-brutal-pink"
            />
            . So{" "}
            <ParameterInline
              param={TREATY_ANNUAL_FUNDING}
              format={{ compact: true, precision: 1 }}
              className="font-black text-brutal-pink"
            />{" "}
            funds{" "}
            <span className="font-black text-brutal-pink">
              {scaledParameterText(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 1e6, "million", 0)}
            </span>{" "}
            patients per year — instead of today's{" "}
            <span className="font-black text-brutal-pink">
              {scaledParameterText(CURRENT_TRIAL_SLOTS_AVAILABLE, 1e6, "million", 1)}
            </span>
            .
          </>
        }
      >
        Traditional Phase 3 trials: median{" "}
        <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} format={{ compact: true, precision: 0 }} className="font-black" />
        /patient (FDA data). Pragmatic trials:{" "}
        <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} format={{ precision: 0 }} className="font-black" />
        /patient (ADAPTABLE trial real-world cost).{" "}
        Meta-analysis of 64 pragmatic trials finds median{" "}
        <ParameterValue
          param={PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT}
          format={{ precision: 0 }}
          className="font-black"
        />
        /patient (Ramsberg & Platt 2018). Using conservative{" "}
        <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} format={{ precision: 0 }} className="font-black" />
        .{" "}
        <ParameterValue param={TREATY_ANNUAL_FUNDING} format={{ compact: true, precision: 1 }} className="font-black" /> ×{" "}
        <ParameterValue param={DIH_TREASURY_TRIAL_SUBSIDIES_PCT} format={{ precision: 0 }} className="font-black" /> allocated to
        patient subsidies ={" "}
        <ParameterValue param={DFDA_TRIAL_SUBSIDIES_ANNUAL} format={{ compact: true, precision: 1 }} className="font-black" /> ÷{" "}
        <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} format={{ precision: 0 }} className="font-black" /> ={" "}
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} format={{ compact: true, precision: 1 }} className="font-black" />{" "}
        patients tested per year. Current global trial participation:{" "}
        <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} format={{ compact: true, precision: 1 }} className="font-black" />{" "}
        patients/year (IQVIA 2022).
      </MathBeat>
      <MathBeat
        detailId="trial-capacity-and-disease-queue"
        stepNumber={4}
        onDetailsOpen={onDetailsOpen}
        title={
          <>
            That's{" "}
            <ParameterInline
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
              format={{ precision: 0 }}
              className="font-black text-brutal-pink"
            />{" "}
            more clinical trial capacity. Disease eradication compresses from{" "}
            <ParameterInline
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              format={{ precision: 0 }}
              className="font-black text-brutal-pink"
            />{" "}
            years to{" "}
            <ParameterInline param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} className="font-black text-brutal-pink" />
            .
          </>
        }
      >
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} format={{ compact: true, precision: 1 }} className="font-black" />{" "}
        funded patients ÷{" "}
        <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} format={{ compact: true, precision: 1 }} className="font-black" />{" "}
        current ={" "}
        <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} className="font-black" /> multiplier.{" "}
        <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} format={{ compact: false, precision: 0 }} className="font-black" />{" "}
        diseases currently have no effective treatment (95% of{" "}
        <ParameterValue param={RARE_DISEASES_COUNT_GLOBAL} format={{ compact: false, precision: 0 }} className="font-black" /> rare
        diseases per Orphanet 2024). At today's rate, first-ever treatments emerge for{" "}
        <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} format={{ precision: 0 }} className="font-black" /> new
        diseases/year.{" "}
        <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} format={{ compact: false, precision: 0 }} className="font-black" />{" "}
        ÷{" "}
        <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} format={{ precision: 0 }} className="font-black" /> ={" "}
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} className="font-black" /> years to
        clear the queue. With{" "}
        <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} className="font-black" /> capacity:{" "}
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} className="font-black" /> ÷{" "}
        <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} format={{ precision: 1 }} className="font-black" /> ={" "}
        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} format={{ precision: 0 }} className="font-black" /> years.
      </MathBeat>
      <MathBeat
        detailId="deaths-and-suffering"
        stepNumber={4}
        onDetailsOpen={onDetailsOpen}
        title={
          <>
            <span className="font-black text-brutal-pink">
              {scaledParameterText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, 1e9, "billion", 1)}
            </span>{" "}
            people don't die of a curable disease while waiting. Plus{" "}
            <span className="font-black text-brutal-pink">
              {scaledParameterText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, 1e15, "quadrillion", 2)}
            </span>{" "}
            hours of suffering doesn't happen.
          </>
        }
      >
        Average treatment arrival accelerates by{" "}
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
          format={{ precision: 0 }}
          className="font-black"
        />{" "}
        years (
        <ParameterValue
          param={DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS}
          format={{ precision: 0 }}
          className="font-black"
        />{" "}
        from more trials +{" "}
        <ParameterValue param={EFFICACY_LAG_YEARS} format={{ precision: 1 }} className="font-black" /> from eliminating FDA's
        efficacy-testing lag). Over that window: global disease deaths (~
        <ParameterValue
          param={GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES}
          format={{ compact: true, precision: 0 }}
          className="font-black"
        />
        /year) × avoidable fraction (
        <ParameterValue param={EVENTUALLY_AVOIDABLE_DEATH_PCT} format={{ precision: 0 }} className="font-black" />) × years ={" "}
        <span className="font-black">
          {scaledParameterText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, 1e9, "billion", 1)}
        </span>{" "}
        deaths prevented (95% CI:{" "}
        {scaledConfidenceIntervalText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, 1e9, "B", 1)}). Suffering:{" "}
        <span className="font-black">
          {scaledParameterText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, 1e15, "quadrillion", 2)}
        </span>{" "}
        hours (95% CI:{" "}
        {scaledConfidenceIntervalText(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, 1e15, "Q", 2)}) from DALY YLD
        component × hours per year. Full calculation at manual.warondisease.org.
      </MathBeat>
      <p className="text-xl font-black leading-snug">Every number above has a citation. This math is not my opinion.</p>
    </div>
  )
}

function MathBeat({
  detailId,
  stepNumber,
  onDetailsOpen,
  title,
  children,
}: {
  detailId: string
  stepNumber: number
  onDetailsOpen: (detailId: string, stepNumber: number) => void
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-xl font-black leading-snug">{title}</p>
      <TrackedDetails
        detailId={detailId}
        stepNumber={stepNumber}
        onDetailsOpen={onDetailsOpen}
        className="border-4 border-primary bg-background p-4"
      >
        <summary className="cursor-pointer text-base font-black leading-snug">Show the math</summary>
        <p className="mt-3 text-sm font-bold leading-relaxed">{children}</p>
      </TrackedDetails>
    </div>
  )
}

function TrackedDetails({
  detailId,
  stepNumber,
  onDetailsOpen,
  className,
  children,
}: {
  detailId: string
  stepNumber: number
  onDetailsOpen: (detailId: string, stepNumber: number) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <details
      className={className}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          onDetailsOpen(detailId, stepNumber)
        }
      }}
    >
      {children}
    </details>
  )
}

function scaledParameterText(param: Parameter, divisor: number, suffix: string, precision: number) {
  const text = formatParameter(
    { ...param, value: param.value / divisor, unit: undefined },
    { compact: false, precision }
  )
  return `${text} ${suffix}`
}

function scaledConfidenceIntervalText(param: Parameter, divisor: number, suffix: string, precision: number) {
  if (!param.confidenceInterval) return "not estimated"

  const [low, high] = param.confidenceInterval
  const lowText = formatParameter(
    { ...param, value: low / divisor, unit: undefined },
    { compact: false, precision }
  )
  const highText = formatParameter(
    { ...param, value: high / divisor, unit: undefined },
    { compact: false, precision }
  )
  return `${lowText}${suffix}–${highText}${suffix}`
}

function WouldntThatBeNeat({ alt }: { alt: boolean }) {
  if (alt) {
    return (
      <div className="space-y-4 text-xl font-black leading-snug">
        <p>Respect. Still, imagine:</p>
        <p>
          You trigger a chain reaction that gets a majority of humanity — 4 billion humans — to collectively agree: "Yes,
          we are willing to sacrifice one apocalypse of our{" "}
          <ParameterInline param={NUCLEAR_WINTER_OVERKILL_FACTOR} format={{ precision: 0 }} /> apocalypse capacity in exchange
          for eradicating disease within our lifetimes."
        </p>
        <p>Wouldn't that be neat?</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-xl font-black leading-snug">
      <p>Imagine you triggered a chain reaction that got a majority of humanity — 4 billion humans — to collectively agree:</p>
      <p>
        "Yes, we are willing to sacrifice one apocalypse of our{" "}
        <ParameterInline param={NUCLEAR_WINTER_OVERKILL_FACTOR} format={{ precision: 0 }} /> apocalypse capacity in exchange for
        eradicating disease within our lifetimes."
      </p>
      <p>Wouldn't that be neat?</p>
    </div>
  )
}

function OnlyTwoHumans({
  alt,
  onDetailsOpen,
}: {
  alt: boolean
  onDetailsOpen: (detailId: string, stepNumber: number) => void
}) {
  if (alt) {
    return (
      <div className="space-y-4 text-xl font-black leading-snug">
        <p>Fair. But here's why it's easier than you think:</p>
        <p>Only 2 of your contacts need to keep going. Two humans. Not 2 percent. Everyone else can ignore you.</p>
        <p>2 → 4 → 8 → 16... 32 rounds reaches 4 billion. One per week = 8 months.</p>
        <p>
          Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this
          chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-xl font-black leading-snug">
      <p>For that chain reaction to reach 4 billion, only 2 of your contacts need to keep going. Two humans. Not 2 percent. Everyone else can ignore you.</p>
      <p>
        Why only 2? If 2 people each tell 2 more, and each of those tells 2 more: 32 rounds reaches 4 billion. At one per day,
        32 days. At one per week, 8 months.
      </p>
      <p>
        Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this
        chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.
      </p>
      <TrackedDetails
        detailId="chain-letter-proof"
        stepNumber={6}
        onDetailsOpen={onDetailsOpen}
        className="border-4 border-primary bg-brutal-yellow p-4 text-sm"
      >
        <summary className="cursor-pointer font-black uppercase">Has a chain letter ever actually worked?</summary>
        <div className="mt-3 space-y-3 font-bold leading-relaxed">
          <p>
            In 1935, a billion people handwrote letters, bought stamps, and mailed actual money to strangers because a piece of
            paper promised them $1,562.50 that didn't exist. The promise was a lie. The threat was fake. Some of them probably
            died driving to the post office.
          </p>
          <p>
            This one requires touching a glowing rectangle a few times. It costs nothing. There are no stamps. And the threat —
            that you and everyone you love will suffer and die of curable diseases if nobody funds the research — is not a
            superstition. It is an epidemiological fact.
          </p>
          <p>So it should probably do fine.</p>
        </div>
      </TrackedDetails>
    </div>
  )
}

function PerVoteMath({
  alt,
  perVoteSufferingYears,
  onDetailsOpen,
}: {
  alt: boolean
  perVoteSufferingYears: number
  onDetailsOpen: (detailId: string, stepNumber: number) => void
}) {
  const sufferingYearsParam = {
    ...VOTER_SUFFERING_HOURS_PREVENTED,
    value: perVoteSufferingYears,
    unit: "years",
    displayName: "Suffering years prevented per vote",
    description: "Voter suffering hours prevented divided by hours per year.",
  }

  if (alt) {
    return (
      <div className="space-y-4 text-xl font-black leading-snug">
        <p>I know. Math again. Last one that matters:</p>
        <p>A majority of humans on Earth agreeing the 1% Treaty is a good idea makes it politically unstoppable.</p>
        <p>
          One vote = 1 lifetime of suffering prevented. One vote ={" "}
          <ParameterValue param={VOTER_LIVES_SAVED} format={{ precision: 1 }} className="font-black text-brutal-pink" /> lives
          saved.
        </p>
        <p>Every person you get to vote adds another lifetime to your Inverse Kills Score.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-xl font-black leading-snug">
      <p>
        One vote = 1 full human lifetime of suffering prevented. (
        <ParameterValue param={sufferingYearsParam} format={{ precision: 0 }} className="font-black text-brutal-pink" /> years
        of it.)
      </p>
      <p>
        One vote ={" "}
        <ParameterValue param={VOTER_LIVES_SAVED} format={{ precision: 1 }} className="font-black text-brutal-pink" /> lives
        saved.
      </p>
      <TrackedDetails
        detailId="per-vote-math"
        stepNumber={7}
        onDetailsOpen={onDetailsOpen}
        className="border-4 border-primary bg-brutal-yellow p-4 text-sm"
      >
        <summary className="cursor-pointer font-black uppercase">Show the math</summary>
        <p className="mt-3 font-bold leading-relaxed">
          Getting a majority of humans on Earth to agree the treaty is a good idea makes it politically unstoppable.{" "}
          <ParameterValue
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
            format={{ compact: true, precision: 1 }}
            className="font-black"
          />{" "}
          deaths prevented ÷ the majority-of-humanity denominator (
          <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} format={{ compact: true, precision: 1 }} className="font-black" />) ={" "}
          <ParameterValue param={VOTER_LIVES_SAVED} format={{ precision: 1 }} className="font-black" /> lives per vote.{" "}
          <ParameterValue
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
            format={{ compact: true, precision: 2 }}
            className="font-black"
          />{" "}
          hours of suffering prevented ÷ the same denominator ={" "}
          <ParameterValue param={VOTER_SUFFERING_HOURS_PREVENTED} format={{ compact: false, precision: 0 }} className="font-black" />{" "}
          hours per vote. At{" "}
          <ParameterValue param={HOURS_PER_YEAR} format={{ compact: false, precision: 0 }} className="font-black" /> hours/year
          = ~
          <ParameterValue param={sufferingYearsParam} format={{ precision: 0 }} className="font-black" /> person-years = roughly
          one full human lifetime.
        </p>
      </TrackedDetails>
      <p>Your vote already did this. Every person you get to vote adds another lifetime to your Inverse Kills Score.</p>
    </div>
  )
}

function DepthHook({
  sentCount,
  alt,
  onDone,
}: {
  sentCount: number
  alt: boolean
  onDone: (dismissive: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  const optIn = async () => {
    setIsWorking(true)
    setError(null)
    try {
      const response = await fetch("/api/referral-invitations/nudge-opt-in", { method: "POST" })
      if (!response.ok) {
        throw new Error("Could not save the nudge.")
      }
      onDone(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the nudge.")
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4 text-xl font-black leading-snug">
        {alt ? (
          <>
            <p>Fine. One optional thing:</p>
            <p>The chain continues past round 2 only if someone keeps going. Want us to email you in a few days to send to one more?</p>
          </>
        ) : (
          <>
            <p>You just messaged {sentCount} people.</p>
            <p>The chain continues past round 2 only if someone keeps going. Want us to email you in a few days to send to one more?</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => onDone(true)}
          variant="outline"
          className="h-12 flex-1 border-4 border-primary bg-background font-black"
        >
          No thanks
        </Button>
        <Button
          type="button"
          onClick={optIn}
          disabled={isWorking}
          className="h-12 flex-1 border-4 border-primary bg-brutal-cyan font-black"
        >
          Yes, nudge me
        </Button>
      </div>
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  )
}

function CloseCard({ dismissiveCount }: { dismissiveCount: number }) {
  const showAlt = dismissiveCount >= 3

  return (
    <div className={cn("space-y-4 border-4 border-primary p-5", showAlt ? "bg-brutal-pink" : "bg-brutal-cyan")}>
      <div className="space-y-4 text-xl font-black leading-snug">
        {showAlt && <p>You clicked "go to hell" {dismissiveCount} times and you're still reading. That is data.</p>}
        <p>The chain only breaks if one human says "later." Is that human you?</p>
        <p>In 32 rounds we run out of humans to ask. That's months, not decades.</p>
        <p>Then you get to go back to whatever you were doing before the most important thing in the universe rudely interrupted.</p>
      </div>
      <Button asChild className="h-12 border-4 border-primary bg-foreground font-black text-background">
        <Link href="/dashboard">Done</Link>
      </Button>
    </div>
  )
}
