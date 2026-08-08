"use client"

import { Card } from "@/components/ui/card"
import { AllocationBar } from "./AllocationBar"

interface MilitaryVsClinicalTrialsAllocationCardProps {
  userAllocation: number | null
  averageAllocation: number
}

export function MilitaryVsClinicalTrialsAllocationCard({
  userAllocation,
  averageAllocation,
}: MilitaryVsClinicalTrialsAllocationCardProps) {
  // If user hasn't set allocation, don't show the card
  if (userAllocation === null) {
    return null
  }

  const userClinicalTrials = 100 - userAllocation
  const avgClinicalTrials = 100 - averageAllocation
  const difference = userClinicalTrials - avgClinicalTrials

  // Real-world allocation (98% military, 2% clinical trials)
  const realMilitary = 98
  const realClinicalTrials = 2

  return (
    <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-2xl font-black uppercase">
        <span className="text-brutal-pink">YOUR</span> ALLOCATION VS <span className="text-brutal-pink">REALITY</span>
      </h3>

      {/* Main Visualization - Stacked proportional bars */}
      <div className="space-y-4">
        {/* Clinical Trials Comparison */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold uppercase">🏥 Percent Allocated to Clinical Trials</span>
          </div>

          {/* Your allocation */}
          <AllocationBar
            percentage={userClinicalTrials}
            colorClass="bg-brutal-cyan"
            label="🙍YOUR CLINICAL TRIAL ALLOCATION"

          />

          {/* Average allocation */}
          <AllocationBar
            percentage={avgClinicalTrials}
            colorClass="bg-brutal-cyan"
            label="👥 AVG CLINICAL TRIAL ALLOCATION"

          />

          {/* Real-world allocation */}
          <AllocationBar
            percentage={realClinicalTrials}
            colorClass="bg-brutal-cyan"
            label="🏛️ GOVERNMENT CLINICAL TRIAL ALLOCATION"

          />
        </div>

        {/* Military & Weapons Comparison */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold uppercase">💣 Percent to Military & Weapons</span>
          </div>

          {/* Your allocation */}
          <AllocationBar
            percentage={userAllocation}
            colorClass="bg-brutal-pink"
            label="🙍YOUR MILITARY ALLOCATION"

          />

          {/* Average allocation */}
          <AllocationBar
            percentage={averageAllocation}
            colorClass="bg-brutal-pink"
            label="👥 AVG DESIRED MILITARY ALLOCATION"

          />

          {/* Real-world allocation */}
          <AllocationBar
            percentage={realMilitary}
            colorClass="bg-brutal-pink"
            label="🏛️ GOVERNMENT MILITARY ALLOCATION"

          />
        </div>
      </div>

      {/* Comparison Message */}
      <div className="border-primary">
        {difference > 0 ? (
          <div className="text-center p-4 bg-brutal-cyan border-2 border-primary">
            <p className="text-lg font-black">
              You allocated <span className="text-foreground text-2xl">{Math.abs(difference)}%</span> MORE
            </p>
            <p className="text-sm font-bold">to clinical trials than the average person</p>
          </div>
        ) : difference < 0 ? (
          <div className="text-center p-4 bg-brutal-pink border-2 border-primary">
            <p className="text-lg font-black">
              You allocated <span className="text-foreground text-2xl">{Math.abs(difference)}%</span> LESS
            </p>
            <p className="text-sm font-bold">to clinical trials than the average person</p>
          </div>
        ) : (
          <div className="text-center p-4 bg-brutal-yellow border-2 border-primary">
            <p className="text-lg font-black">
              You matched the community average! 🎯
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
