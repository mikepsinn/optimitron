"use client"

import { useState, type ReactNode } from "react"
import { HelpCircle, ArrowUpRight, UsersRound, HeartPulse, Clock3, Zap, X } from "lucide-react"
import Link from "next/link"
import { Dialog } from "@/components/retroui/Dialog"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import {
  EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  HOURS_PER_YEAR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import {
  formatParameterValueText,
  type ParameterValueProps,
} from "@/components/shared/ParameterValue.core"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";
import {
  MINUTES_PER_PERSUASION,
  VOTES_PER_HOUR,
  VOTING_BLOC_TARGET,
  LIVES_PER_HOUR,
  SUFFERING_YEARS_PER_HOUR,
} from "@/lib/impact-ledger"
import { formatNumberShort } from "@/lib/formatters"

interface ImpactExplainerProps {
  className?: string
  iconClassName?: string
  size?: number
  label?: string
  children?: ReactNode
  /** Show the "See the full analysis" link that routes to /impact. Default true. Set false on surfaces where redirecting the user away is costly (e.g. post-vote auth card). */
  showFullAnalysisLink?: boolean
}

export function ImpactExplainer({
  className,
  iconClassName,
  size = 18,
  label = "Impact math explainer",
  children,
  showFullAnalysisLink = true,
}: ImpactExplainerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            children
              ? "inline-flex items-center justify-center rounded-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              : "inline-flex items-center justify-center rounded-full border-4 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
            className,
          )}
        >
          {children ?? (
            <HelpCircle className={cn("stroke-[3px]", iconClassName)} style={{ width: size, height: size }} />
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        size="screen"
        title="Impact Math Explainer"
        className="!w-[95vw] !max-w-[760px] max-h-[90vh] !grid-cols-[minmax(0,1fr)] overflow-hidden border-2 border-foreground bg-background text-foreground shadow-none"
      >
        <Dialog.Description className="sr-only">
          Explains how recruited treaty votes translate into lives saved and
          suffering prevented.
        </Dialog.Description>
        <div className="flex min-w-0 items-start justify-between gap-4 border-b-2 border-primary bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="min-w-0 flex-1 text-lg font-black uppercase leading-tight">
            The Math Behind Your Impact
          </h2>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="shrink-0 border-2 border-primary-foreground p-1 hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
        <div className="min-w-0 max-h-[calc(90vh-56px)] overflow-auto p-5">
          <div className="space-y-5 text-base font-semibold leading-7">
            <p>
              Here&apos;s how the number of votes you recruit actually translates into fewer dead people:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UsersRound className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-base font-black uppercase leading-7">
                    Treaty target:{" "}
                    <ManualParameterValue
                      param={MAJORITY_OF_HUMANS_ON_EARTH}
                      valueOverride={formatNumberShort(VOTING_BLOC_TARGET)}
                    />{" "}
                    people
                  </p>
                  <p className="text-sm leading-7 sm:text-base">
                    <ManualParameterValue
                      display="withUnit"
                      param={MAJORITY_OF_HUMANS_ON_EARTH}
                    />{" "}
                    is a majority of humans on Earth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-base font-black uppercase leading-7">
                    Timeline shift:{" "}
                    <ManualParameterValue
                      display="withUnit"
                      param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
                    />{" "}
                    earlier
                  </p>
                  <p className="text-sm leading-7 sm:text-base">
                    Eliminate the{" "}
                    <ManualParameterValue
                      display="withUnit"
                      figures={2}
                      param={EFFICACY_LAG_YEARS}
                    />{" "}
                    wait after safety testing, plus clear the queue of{" "}
                    <ManualParameterValue
                      param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
                    />{" "}
                    untreated diseases{" "}
                    <ManualParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} />{" "}
                    faster (
                    <ManualParameterValue
                      display="withUnit"
                      param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                    />{" "}
                    →{" "}
                    <ManualParameterValue
                      display="withUnit"
                      figures={2}
                      param={DFDA_QUEUE_CLEARANCE_YEARS}
                    />
                    ).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-base font-black uppercase leading-7">
                    Per vote: ~
                    <ManualParameterValue
                      param={VOTER_LIVES_SAVED}
                      valueOverride={VOTER_LIVES_SAVED.value.toFixed(1)}
                    />{" "}
                    lives, ~
                    <SufferingYearsPerVoteValue /> years of suffering prevented
                  </p>
                  <p className="text-sm leading-7 sm:text-base">
                    Your share of the one-time benefit when we reach the treaty target.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-base font-black uppercase leading-7">
                    Per hour of outreach: ~{LIVES_PER_HOUR.toFixed(0)} lives, ~{SUFFERING_YEARS_PER_HOUR.toFixed(0)} years
                  </p>
                  <p className="text-sm leading-7 sm:text-base">
                    {MINUTES_PER_PERSUASION} min/conversation × {Math.round(VOTES_PER_HOUR)} conversations ={" "}
                    {Math.round(VOTES_PER_HOUR)} votes/hour.
                  </p>
                </div>
              </div>
            </div>

            {showFullAnalysisLink ? (
              <Link
                href={ROUTES.impact}
                className="inline-flex items-center gap-2 text-sm font-black text-foreground underline"
              >
                See the full analysis
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

function ManualParameterValue({
  className,
  display = "auto",
  figures = 3,
  param,
  valueOverride,
}: Pick<
  ParameterValueProps,
  "className" | "display" | "figures" | "param" | "valueOverride"
>) {
  const text = formatParameterValueText({
    display,
    figures,
    param,
    valueOverride,
  })
  const referenceUrl = param.manualPageUrl

  if (!referenceUrl) {
    return <span className={className}>{text}</span>
  }

  return (
    <a
      href={referenceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "font-black underline decoration-dotted underline-offset-4 hover:decoration-solid",
        className,
      )}
    >
      {text}
    </a>
  )
}

function SufferingYearsPerVoteValue() {
  return (
    <ManualParameterValue
      param={VOTER_SUFFERING_HOURS_PREVENTED}
      valueOverride={(
        VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value
      ).toFixed(0)}
    />
  )
}
