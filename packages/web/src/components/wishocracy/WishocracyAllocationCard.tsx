"use client"

import { Card } from "@/components/retroui/Card"
import { WishocraticAllocationBars } from "./WishocraticAllocationBars"
import type { WishocraticAllocationInput } from "@/lib/wishocracy-allocation"

interface WishocracyAllocationCardProps {
  show: boolean
  isLoading: boolean
  allocations: WishocraticAllocationInput[]
}

export function WishocracyAllocationCard({
  show,
  isLoading,
  allocations,
}: WishocracyAllocationCardProps) {
  if (!show || allocations.length < 3) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto mt-8" data-complete-list>
      <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-left">
          <h3 className="font-black text-lg uppercase">Your Budget Allocation</h3>
          <p className="text-xs text-muted-foreground">
            Percentages show how you'd split 100% of the budget among all considered priorities
          </p>
        </div>

        <WishocraticAllocationBars allocations={allocations} />
      </Card>
    </div>
  )
}
