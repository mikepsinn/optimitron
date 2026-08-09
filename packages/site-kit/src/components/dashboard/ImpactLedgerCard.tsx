import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { calculateImpactLedger, getNextLifeMilestoneMessage, HOURS_PER_YEAR, VALUE_PER_HOUR } from "@/lib/impact-ledger"
import { formatCurrencyShort, formatLives, formatNumberShort, formatPerVoteLabel } from "@/lib/formatters"
import { Sparkles, Clock3, Heart, Coins, HelpCircle } from "lucide-react"
import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import { LivesEquation, SufferingEquation, ValueEquation } from "@/components/shared/impact-math"
import { STANDARD_ECONOMIC_QALY_VALUE_USD } from "@/lib/parameters-calculations-citations"
import { formatParameter } from "@/lib/format-parameter"

// Format QALY value for display (e.g., "$150K")
const qalyValueFormatted = formatParameter(STANDARD_ECONOMIC_QALY_VALUE_USD)

interface ImpactLedgerCardProps {
  votesLogged: number
  variant?: "dashboard" | "public"
  userName?: string
}

function MetricTooltip({ content }: { content: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-primary transition-colors inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[340px] border-2 border-primary bg-background p-3 font-bold text-xs space-y-2">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ImpactLedgerCard({ votesLogged, variant = "dashboard", userName }: ImpactLedgerCardProps) {
  const metrics = calculateImpactLedger(votesLogged)
  const lifeMilestone = getNextLifeMilestoneMessage(metrics.livesSaved)
  const isPublic = variant === "public"

  const perVoteStats = [
    {
      label: "Inverse Kills",
      unit: "future lives saved per vote",
      value: formatPerVoteLabel(metrics.perVote.lives, "lives"),
      icon: <Heart className="h-5 w-5" />,
      tooltip: <LivesEquation votes={1} />,
    },
    {
      label: "Suffering Prevented",
      unit: "years of suffering per vote",
      value: `~${(metrics.perVote.sufferingHours / HOURS_PER_YEAR).toFixed(1)}`,
      icon: <Clock3 className="h-5 w-5" />,
      tooltip: <SufferingEquation votes={1} />,
    },
    {
      label: "Economic Value",
      unit: "DALY/QALY value per vote",
      value: formatCurrencyShort(metrics.perVote.economicValue, { significantDigits: 3 }),
      icon: <Coins className="h-5 w-5" />,
      tooltip: <ValueEquation votes={1} />,
    },
  ]

  const ledgerStats = [
    {
      label: isPublic ? "Referred" : "You've referred",
      unit: "voters",
      value: metrics.votesLogged.toLocaleString("en-US"),
      icon: "🗳️",
      tooltip: isPublic ? "Vote (1) + confirmed referrals." : "Your vote (1) + confirmed referrals."
    },
    {
      label: "Inverse Kills",
      unit: "future lives saved",
      value: formatLives(metrics.livesSaved),
      icon: "❤️‍🔥",
      tooltip: <LivesEquation votes={metrics.votesLogged} />,
    },
    {
      label: isPublic ? "Prevented" : "You've prevented",
      unit: "years of suffering",
      value: formatNumberShort(metrics.sufferingHoursRemoved / HOURS_PER_YEAR),
      icon: "⏳",
      tooltip: <SufferingEquation votes={metrics.votesLogged} />,
    },
    {
      label: isPublic ? "Generated" : "You've generated",
      unit: "in DALY/QALY value",
      value: formatCurrencyShort(metrics.economicValueCreated, { significantDigits: 3 }),
      icon: "💰",
      tooltip: <ValueEquation votes={metrics.votesLogged} />,
    },
  ]

  const preciseValuePerHour = metrics.hoursInvested > 0 ? metrics.economicValueCreated / metrics.hoursInvested : VALUE_PER_HOUR

  return (
    <Card className="border-2 border-primary bg-background">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            IMPACT SCOREBOARD
          </CardTitle>
          <ImpactExplainer className="h-8 w-8" size={18} />
        </div>
        <CardDescription className="font-bold">
          Every vote updates {isPublic ? "the" : "your"} War on Disease ledger. We price healthy years at {qalyValueFormatted} each (the DALY/QALY
          standard)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="border-2 border-dashed border-primary p-4 bg-muted">
          <div className="flex items-center justify-between mb-2">
            <p className="font-black uppercase text-sm">Per-vote impact</p>
            <ImpactExplainer className="h-7 w-7" size={16} label="Show per-vote impact math" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-bold">
            {perVoteStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between gap-3 border border-primary/50 bg-background px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div>
                  <div className="flex items-center">
                    <span className="text-xs uppercase text-muted-foreground">{stat.label}</span>
                    {stat.tooltip && <MetricTooltip content={stat.tooltip} />}
                  </div>
                  <p className="text-lg font-black">{stat.value}</p>
                  {stat.unit && <p className="text-xs font-semibold text-muted-foreground">{stat.unit}</p>}
                </div>
                <span className="text-primary">{stat.icon}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="font-black uppercase text-sm mb-3">{isPublic ? "Total Impact" : "Your Total Impact"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ledgerStats.map((stat) => (
              <div key={stat.label} className="border-2 border-primary p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-3 h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <p className="text-xs uppercase font-bold text-muted-foreground">{stat.label}</p>
                      {stat.tooltip && <MetricTooltip content={stat.tooltip} />}
                    </div>
                    <p className="text-2xl font-black mt-1">{stat.value}</p>
                    {stat.unit && <p className="text-xs font-semibold text-muted-foreground">{stat.unit}</p>}
                  </div>
                  <span className="text-3xl" role="img" aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-2 border-primary p-4 bg-brutal-yellow space-y-3">
          <div className="flex items-center gap-2 font-black text-lg uppercase">
            <Clock3 className="h-5 w-5" />
            Time ROI
          </div>
          <p className="font-bold">
            Each hour {isPublic ? "spent" : "you spend"} persuading friends (≈4 votes) is currently worth{" "}
            <span className="font-black">{formatCurrencyShort(preciseValuePerHour, { significantDigits: 3 })}</span> in healthy-life
            value, using the {qalyValueFormatted}-per-year DALY/QALY benchmark governments use to fund medicine.
          </p>
          <p className="font-bold">
            {isPublic ? (
              <>
                {userName || "This soldier"} has saved <span className="font-black">{formatLives(lifeMilestone.current)}</span> lives.
                {lifeMilestone.current < lifeMilestone.next && (
                  <> One more referral will reach <span className="font-black">{formatLives(lifeMilestone.next)}</span>.</>
                )}
              </>
            ) : (
              <>
                You've saved <span className="font-black">{formatLives(lifeMilestone.current)}</span> lives. Persuade one more friend and you'll hit <span className="font-black">{formatLives(lifeMilestone.next)}</span>.
              </>
            )}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
