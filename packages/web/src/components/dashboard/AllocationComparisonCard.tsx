"use client"

import { Card } from "@/components/retroui/Card"
import { AllocationBar } from "./AllocationBar"

interface AllocationCategory {
  label: string
  userLabel: string
  avgLabel: string
  govLabel: string
  colorClass: string
}

interface AllocationComparisonCardProps {
  userAllocation: number | null
  averageAllocation: number
  governmentAllocation?: number
  itemA: AllocationCategory
  itemB: AllocationCategory
  title?: string
}

export function AllocationComparisonCard({
  userAllocation,
  averageAllocation,
  governmentAllocation = 98,
  itemA,
  itemB,
  title = "WISHOCRATIC ALLOCATION",
}: AllocationComparisonCardProps) {
  if (userAllocation === null) {
    return null
  }

  const userB = 100 - userAllocation
  const avgB = 100 - averageAllocation
  const govB = 100 - governmentAllocation
  const difference = userB - avgB

  return (
    <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-2xl font-black uppercase">
        <span className="text-brutal-pink">{title}</span>
      </h3>

      <div className="space-y-4">
        {/* Category B (complement) */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold uppercase">{itemB.label}</span>
          </div>

          <AllocationBar
            percentage={userB}
            colorClass={itemB.colorClass}
            label={itemB.userLabel}
          />
          <AllocationBar
            percentage={avgB}
            colorClass={itemB.colorClass}
            label={itemB.avgLabel}
          />
          <AllocationBar
            percentage={govB}
            colorClass={itemB.colorClass}
            label={itemB.govLabel}
          />
        </div>

        {/* Category A */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold uppercase">{itemA.label}</span>
          </div>

          <AllocationBar
            percentage={userAllocation}
            colorClass={itemA.colorClass}
            label={itemA.userLabel}
          />
          <AllocationBar
            percentage={averageAllocation}
            colorClass={itemA.colorClass}
            label={itemA.avgLabel}
          />
          <AllocationBar
            percentage={governmentAllocation}
            colorClass={itemA.colorClass}
            label={itemA.govLabel}
          />
        </div>
      </div>

      {/* Comparison Message */}
      <div className="border-primary">
        {difference > 0 ? (
          <div className="text-center p-4 bg-brutal-cyan text-brutal-cyan-foreground border-4 border-primary">
            <p className="text-lg font-black">
              You allocated <span className="text-2xl">{Math.abs(difference)}%</span> MORE
            </p>
            <p className="text-sm font-bold">to {itemB.label.toLowerCase()} than the average person</p>
          </div>
        ) : difference < 0 ? (
          <div className="text-center p-4 bg-brutal-pink text-brutal-pink-foreground border-4 border-primary">
            <p className="text-lg font-black">
              You allocated <span className="text-2xl">{Math.abs(difference)}%</span> LESS
            </p>
            <p className="text-sm font-bold">to {itemB.label.toLowerCase()} than the average person</p>
          </div>
        ) : (
          <div className="text-center p-4 bg-brutal-yellow text-brutal-yellow-foreground border-4 border-primary">
            <p className="text-lg font-black">
              You matched the community average!
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
