import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardProgress } from "@/types/dashboard"
import {
  GLOBAL_POPULATION_2024,
} from "@/lib/parameters-calculations-citations"
import { ParameterInline } from "@/components/shared/ParameterValue"
import {
  MAJORITY_OF_HUMANS_ON_EARTH,
  MAJORITY_OF_HUMANS_SHARE_OF_EARTH,
} from "@/lib/majority-humanity-target"
import { cn } from "@/lib/utils"

interface GlobalProgressCardProps {
  progress: DashboardProgress
  className?: string
}

export function GlobalProgressCard({ progress, className }: GlobalProgressCardProps) {
  const currentProgress = Math.max(0, progress.current)
  const rawProgressPercentage = progress.target > 0 ? (currentProgress / progress.target) * 100 : 0
  const progressPercentage = currentProgress > 0 ? Math.max(rawProgressPercentage, 1) : 0
  const currentProgressDisplay = currentProgress.toLocaleString("en-US", {
    minimumFractionDigits: currentProgress >= 0.1 ? 1 : 3,
    maximumFractionDigits: currentProgress >= 0.1 ? 1 : 4,
  })
  const peopleNeeded = Math.max(0, ((progress.target - currentProgress) / 100) * GLOBAL_POPULATION_2024.value)

  return (
    <Card className={cn("border-4 border-primary mb-8 bg-brutal-yellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Target className="h-6 w-6" />
          PROGRESS TOWARD MAJORITY OF HUMANS
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full border-4 border-primary bg-background hover:bg-primary hover:text-background transition-colors">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-sm">
                  <span className="text-brutal-pink">The majority target:</span>{" "}
                  <ParameterInline param={MAJORITY_OF_HUMANS_ON_EARTH} /> humans, roughly{" "}
                  <ParameterInline param={MAJORITY_OF_HUMANS_SHARE_OF_EARTH} /> of Earth. That is the denominator used for
                  per-vote impact math.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-foreground font-bold">
          We need a majority of humans on Earth to create an unmistakable mandate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>{currentProgressDisplay}% of global population</span>
            <span>majority target</span>
          </div>
          <div className="h-8 bg-background border-4 border-primary rounded-none overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-sm font-bold">
            {Math.round(peopleNeeded).toLocaleString()} more people needed to reach a majority of humans on Earth
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

