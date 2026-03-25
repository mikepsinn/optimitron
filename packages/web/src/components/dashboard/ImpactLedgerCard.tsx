import { Card } from "@/components/retroui/Card"
import { calculateImpactLedger, getNextLifeMilestoneMessage, HOURS_PER_YEAR, VALUE_PER_HOUR } from "@/lib/impact-ledger"
import { formatCurrencyShort, formatLives, formatNumberShort } from "@/lib/formatters"
import { Sparkles, Clock3, Heart } from "lucide-react"
import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import { LivesEquation, SufferingEquation, ValueEquation } from "@/components/shared/impact-math"

interface ImpactLedgerCardProps {
  votesLogged: number
}

export function ImpactLedgerCard({ votesLogged }: ImpactLedgerCardProps) {
  const metrics = calculateImpactLedger(votesLogged)
  const lifeMilestone = getNextLifeMilestoneMessage(metrics.livesSaved)

  const ledgerStats = [
    {
      label: "Recruited",
      unit: "voters",
      value: metrics.votesLogged.toLocaleString("en-US"),
      icon: "🗳️",
      equation: null,
    },
    {
      label: "Lives saved",
      unit: "future lives",
      value: formatLives(metrics.livesSaved),
      icon: "❤️‍🔥",
      equation: <LivesEquation votes={metrics.votesLogged} className="text-xs text-muted-foreground mt-1" />,
    },
    {
      label: "Suffering prevented",
      unit: "years",
      value: formatNumberShort(metrics.sufferingHoursRemoved / HOURS_PER_YEAR),
      icon: "⏳",
      equation: <SufferingEquation votes={metrics.votesLogged} className="text-xs text-muted-foreground mt-1" />,
    },
    {
      label: "DALY/QALY value",
      unit: "generated",
      value: formatCurrencyShort(metrics.economicValueCreated, { significantDigits: 3 }),
      icon: "💰",
      equation: <ValueEquation votes={metrics.votesLogged} className="text-xs text-muted-foreground mt-1" />,
    },
  ]

  const preciseValuePerHour = metrics.hoursInvested > 0
    ? metrics.economicValueCreated / metrics.hoursInvested
    : VALUE_PER_HOUR

  return (
    <Card className="border-4 border-primary bg-background">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          IMPACT SCOREBOARD
          <ImpactExplainer className="ml-1 h-7 w-7" />
        </Card.Title>
        <Card.Description className="font-bold">
          Every person you recruit adds to your ledger. We price a healthy year at $150K, which is the standard your own economists use and then ignore.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-6">
        <section>
          <p className="font-black uppercase text-sm mb-3">Your Total Impact</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ledgerStats.map((stat) => (
              <div key={stat.label} className="border-4 border-primary p-4 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-3 h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-black mt-1">{stat.value}</p>
                    {stat.unit && <p className="text-xs font-semibold text-muted-foreground">{stat.unit}</p>}
                  </div>
                  <span className="text-3xl" role="img" aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
                {stat.equation}
              </div>
            ))}
          </div>
        </section>

        <section className="border-4 border-primary p-4 bg-brutal-yellow space-y-3">
          <div className="flex items-center gap-2 font-black text-lg uppercase">
            <Clock3 className="h-5 w-5" />
            Time ROI
          </div>
          <p className="font-bold">
            Each hour you spend recruiting (approx 4 voters) is worth{" "}
            <span className="font-black">{formatCurrencyShort(preciseValuePerHour, { significantDigits: 3 })}</span> in healthy-life
            value, using the $150K-per-year DALY/QALY benchmark.
          </p>
          <p className="font-bold">
            <Heart className="h-4 w-4 inline text-brutal-pink fill-brutal-pink" />{" "}
            You&apos;ve saved <span className="font-black">{formatLives(lifeMilestone.current)}</span> lives.
            {lifeMilestone.current < lifeMilestone.next && (
              <> One more recruit takes you to <span className="font-black">{formatLives(lifeMilestone.next)}</span>.</>
            )}
          </p>
        </section>
      </Card.Content>
    </Card>
  )
}
