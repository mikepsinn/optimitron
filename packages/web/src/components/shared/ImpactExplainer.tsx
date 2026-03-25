import { HelpCircle, ArrowUpRight, UsersRound, HeartPulse, Clock3, Zap } from "lucide-react"
import Link from "next/link"
import { Tooltip } from "@/components/retroui/Tooltip"
import { cn } from "@/lib/utils"
import {
  EFFICACY_LAG_YEARS,
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"
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
}

export function ImpactExplainer({ className, iconClassName, size = 18, label = "Impact math explainer" }: ImpactExplainerProps) {
  return (
    <Tooltip.Provider delayDuration={50}>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex items-center justify-center rounded-full border-4 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              className,
            )}
          >
            <HelpCircle className={cn("stroke-[3px]", iconClassName)} style={{ width: size, height: size }} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content className="max-w-[400px] bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-semibold space-y-3">
          <div className="space-y-1">
            <p className="font-black uppercase text-xs">The Math Behind Your Impact</p>
            <p>
              I showed my working. Your species finds this unusual. Here&apos;s how your vote actually translates into fewer dead people:
            </p>
          </div>

          <div className="space-y-3">
            {/* Political tipping point */}
            <div className="flex items-start gap-2">
              <UsersRound className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase">Tipping point: {formatNumberShort(VOTING_BLOC_TARGET)} votes</p>
                <p className="text-xs">
                  {formatParameter(GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT)} active support triggers political change (Chenoweth research).
                </p>
              </div>
            </div>

            {/* Timeline shift */}
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase">Timeline shift: {formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS)} earlier</p>
                <p className="text-xs">
                  Eliminate the {formatParameter(EFFICACY_LAG_YEARS)} wait after safety testing, plus clear the queue of {formatParameter(DISEASES_WITHOUT_EFFECTIVE_TREATMENT, { compact: false })} untreated diseases {formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)} faster ({formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} → {formatParameter(DFDA_QUEUE_CLEARANCE_YEARS)}).
                </p>
              </div>
            </div>

            {/* Per-vote impact */}
            <div className="flex items-start gap-2">
              <HeartPulse className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase">Per vote: ~{IMPACT_PER_VOTE.lives.toFixed(1)} lives, ~{(IMPACT_PER_VOTE.sufferingHours / 8760).toFixed(0)} years of suffering prevented</p>
                <p className="text-xs">
                  Your share of the one-time benefit when we reach the tipping point.
                </p>
              </div>
            </div>

            {/* Per-hour impact */}
            <div className="flex items-start gap-2">
              <Clock3 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase">Per hour of outreach: ~{LIVES_PER_HOUR.toFixed(0)} lives, ~{SUFFERING_YEARS_PER_HOUR.toFixed(0)} years</p>
                <p className="text-xs">
                  {MINUTES_PER_PERSUASION} min/conversation × {Math.round(VOTES_PER_HOUR)} conversations = {Math.round(VOTES_PER_HOUR)} votes/hour.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/impact"
            className="inline-flex items-center gap-2 text-xs font-black text-brutal-pink underline"
          >
            See the full analysis
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  )
}
