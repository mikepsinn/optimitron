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
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
  formatParameter,
} from "@optimitron/data/parameters";
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";
import {
  MINUTES_PER_PERSUASION,
  VOTES_PER_HOUR,
  VOTING_BLOC_TARGET,
  LIVES_PER_HOUR,
  SUFFERING_YEARS_PER_HOUR,
  IMPACT_PER_VOTE,
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
        className="!w-[95vw] !max-w-[760px] max-h-[90vh] !grid-cols-[minmax(0,1fr)] overflow-hidden"
      >
        <div className="flex min-w-0 items-start justify-between gap-4 border-b-2 border-primary bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="min-w-0 flex-1 text-base font-black uppercase leading-tight">
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
        <div className="min-w-0 max-h-[calc(90vh-56px)] overflow-auto p-4">
          <div className="space-y-4 text-sm font-semibold">
            <p>
              Here&apos;s how the number of votes you recruit actually translates into fewer dead people:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <UsersRound className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase">
                    Treaty target: {formatNumberShort(VOTING_BLOC_TARGET)} people
                  </p>
                  <p className="text-xs">
                    {formatParameter(MAJORITY_OF_HUMANS_ON_EARTH, { compact: false })} is a majority of humans on Earth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase">
                    Timeline shift: {formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS)} earlier
                  </p>
                  <p className="text-xs">
                    Eliminate the {formatParameter(EFFICACY_LAG_YEARS)} wait after safety testing, plus clear the queue of{" "}
                    {formatParameter(DISEASES_WITHOUT_EFFECTIVE_TREATMENT, { compact: false })} untreated diseases{" "}
                    {formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)} faster ({formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} →{" "}
                    {formatParameter(DFDA_QUEUE_CLEARANCE_YEARS)}).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <HeartPulse className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase">
                    Per vote: ~{IMPACT_PER_VOTE.lives.toFixed(1)} lives, ~{(IMPACT_PER_VOTE.sufferingHours / 8760).toFixed(0)} years of suffering prevented
                  </p>
                  <p className="text-xs">
                    Your share of the one-time benefit when we reach the treaty target.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase">
                    Per hour of outreach: ~{LIVES_PER_HOUR.toFixed(0)} lives, ~{SUFFERING_YEARS_PER_HOUR.toFixed(0)} years
                  </p>
                  <p className="text-xs">
                    {MINUTES_PER_PERSUASION} min/conversation × {Math.round(VOTES_PER_HOUR)} conversations ={" "}
                    {Math.round(VOTES_PER_HOUR)} votes/hour.
                  </p>
                </div>
              </div>
            </div>

            {showFullAnalysisLink ? (
              <Link
                href={ROUTES.impact}
                className="inline-flex items-center gap-2 text-xs font-black text-foreground underline"
              >
                See the full analysis
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
