import { HelpCircle, ArrowUpRight, UsersRound, HeartPulse, Clock3, Zap } from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@optimitron/neobrutalist-ui/ui/tooltip"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import {
  EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/impact-params/parameters"
import { formatParameter } from "@optimitron/impact-params/format"
import { ParameterInline } from "./ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "../../lib/majority-humanity-target"
import {
  HOURS_PER_YEAR,
  MINUTES_PER_PERSUASION,
  VOTES_PER_HOUR,
  LIVES_PER_HOUR,
  SUFFERING_YEARS_PER_HOUR,
  IMPACT_PER_VOTE,
} from "../../lib/impact-ledger"
import { getImpactAnalysisInfo } from "../../lib/site-config"

interface ImpactExplainerProps {
  className?: string
  iconClassName?: string
  size?: number
  label?: string
}

export function ImpactExplainer({ className, iconClassName, size = 18, label = "Impact math explainer" }: ImpactExplainerProps) {
  const impactAnalysis = getImpactAnalysisInfo()

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex items-center justify-center rounded-full border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              className,
            )}
          >
            <HelpCircle className={cn("stroke-[3px]", iconClassName)} style={{ width: size, height: size }} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[400px] bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-semibold space-y-3">
          <div className="space-y-1">
            <p className="font-black uppercase text-xs">The Math Behind Your Impact</p>
            <p>
              Every number comes from first-principles analysis at{" "}
              <Link href={impactAnalysis.url} target="_blank" rel="noreferrer" className="font-black underline">
                {impactAnalysis.label}
              </Link>
              . Here is what "your vote matters" means when you actually do the math:
            </p>
          </div>
          
          <div className="space-y-3">
            {/* Majority target */}
            <div className="flex items-start gap-2">
              <UsersRound className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-xs uppercase">
                  Majority target: <ParameterInline param={MAJORITY_OF_HUMANS_ON_EARTH} /> humans
                </p>
                <p className="text-xs">
                  Per-vote impact divides the modeled benefit across a majority of humans on Earth.
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
                <p className="font-black text-xs uppercase">Per vote: ~{IMPACT_PER_VOTE.lives.toFixed(1)} lives, ~{(IMPACT_PER_VOTE.sufferingHours / HOURS_PER_YEAR).toFixed(0)} years of suffering prevented</p>
                <p className="text-xs">
                  Your share of the one-time benefit when we reach the majority target.
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
            href={impactAnalysis.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-black text-brutal-pink underline"
          >
            See the full analysis
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
