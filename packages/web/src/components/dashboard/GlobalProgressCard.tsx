import { Card } from "@/components/retroui/Card"
import { Target, HelpCircle } from "lucide-react"
import { Tooltip } from "@/components/retroui/Tooltip"
import {
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  fmtParam,
} from "@optimitron/data/parameters";
const tippingPointPct = fmtParam(GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT)
const votingBlocTarget = fmtParam(TREATY_CAMPAIGN_VOTING_BLOC_TARGET)

interface GlobalProgressCardProps {
  progress: {
    current: number
    target: number
  }
}

export function GlobalProgressCard({ progress }: GlobalProgressCardProps) {
  const currentProgress = Math.max(0.1, progress.current)
  const progressPercentage = (currentProgress / progress.target) * 100

  return (
    <Card className="border-4 border-primary mb-8 bg-brutal-yellow">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <Target className="h-6 w-6" />
          PROGRESS TOWARD {tippingPointPct}% TIPPING POINT
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <button className="inline-flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content className="max-w-sm bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-sm">
                  <span className="text-brutal-pink">The {tippingPointPct}% Rule:</span> Harvard research by Erica Chenoweth found
                  that nonviolent campaigns were twice as likely to succeed as violent ones. Once {tippingPointPct}% of the population
                  actively participates, they have never failed to bring about change. This is our target — {votingBlocTarget} million
                  people globally united to optimize Earth.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </Card.Title>
        <Card.Description className="text-foreground font-bold">
          We need {tippingPointPct}% of the global population to create unstoppable change
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>{currentProgress.toFixed(1)}% of global population</span>
            <span>{progress.target}% target</span>
          </div>
          <div className="h-8 bg-background border-4 border-primary rounded-none overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-sm font-bold">
            {((progress.target - currentProgress) * 80000000).toLocaleString()} more people needed to reach the tipping
            point
          </p>
        </div>
      </Card.Content>
    </Card>
  )
}
