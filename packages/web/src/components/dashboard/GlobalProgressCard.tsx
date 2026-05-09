import { Card } from "@/components/retroui/Card"
import { Target, HelpCircle } from "lucide-react"
import { Tooltip } from "@/components/retroui/Tooltip"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";

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
    <Card className="border-4 border-primary mb-8 bg-background">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <Target className="h-6 w-6" />
          PROGRESS TOWARD A MAJORITY OF HUMANS ON EARTH
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <button className="inline-flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content className="max-w-sm bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-sm">
                  The treaty target is <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} display="withUnit" />:
                  a majority of humans on Earth publicly agreeing to redirect 1% of military spending to clinical trials.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </Card.Title>
        <Card.Description className="text-foreground font-bold">
          The chain reaction target is a majority of humans on Earth.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>{currentProgress.toFixed(1)}% of global population</span>
            <span>{parseFloat(progress.target.toFixed(2))}% target</span>
          </div>
          <div className="h-8 bg-background border-4 border-primary rounded-none overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-sm font-bold">
            {Math.max(0, (progress.target - currentProgress) * 80000000).toLocaleString()} more people needed
          </p>
        </div>
      </Card.Content>
    </Card>
  )
}
