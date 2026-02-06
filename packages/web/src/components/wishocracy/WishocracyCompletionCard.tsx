"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import confetti from "canvas-confetti"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"
import { calculateAllocationsFromPairwise, Comparison } from "@/lib/wishocracy-calculations"

interface WishocracyCompletionCardProps {
  show: boolean
  comparisons: Comparison[]
  isAuthenticated: boolean
  userEmail?: string | null
  shareUrl: string
}

export function WishocracyCompletionCard({
  show,
  comparisons,
}: WishocracyCompletionCardProps) {
  useEffect(() => {
    if (show) {
      const colors = ["#FF6B9D", "#00D9FF", "#FFE66D"]
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        colors: colors,
      }

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }

      fire(0.25, { spread: 26, startVelocity: 55 })
      fire(0.2, { spread: 60 })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      fire(0.1, { spread: 120, startVelocity: 45 })
    }
  }, [show])

  if (!show) return null

  const allocations = calculateAllocationsFromPairwise(comparisons)
  const topPriorities = Object.entries(allocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, percentage]) => {
      const category = BUDGET_CATEGORIES[categoryId as BudgetCategoryId]
      return { categoryId, category, percentage }
    })

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-8">
      {/* Success Icon and Message */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="font-black text-2xl uppercase mb-2">
          Congratulations!
        </h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ve completed all budget comparisons and defined your priorities.
        </p>
      </div>

      {/* Top Priorities Summary */}
      <div className="bg-background border-4 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h3 className="font-black text-lg uppercase mb-4 text-center">
          Your Top Priorities
        </h3>
        <div className="space-y-3">
          {topPriorities.map((priority, index) => (
            <div key={priority.categoryId} className="flex items-center gap-3">
              <span className="font-black text-2xl text-brutal-pink w-8">
                {index + 1}.
              </span>
              <span className="text-2xl">{priority.category.icon}</span>
              <div className="flex-1">
                <div className="font-bold uppercase text-sm">
                  {priority.category.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {priority.percentage.toFixed(1)}% of your ideal budget
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View Complete List Button */}
        <div className="mt-4 pt-4 border-t-2 border-primary">
          <Button
            onClick={() => {
              const completeList = document.querySelector('[data-complete-list]')
              completeList?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            variant="outline"
            className="w-full font-bold uppercase border-2 border-primary hover:bg-brutal-cyan/20"
          >
            View Complete Budget Allocation ↓
          </Button>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="space-y-3">
        <h3 className="font-black text-md uppercase text-center">
          What&apos;s Next?
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
            <span>Share your priorities to help shape collective budget decisions</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
            <span>Explore how government spending compares to citizen priorities</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
            <span>Come back anytime to refine your choices</span>
          </div>
        </div>
      </div>
    </div>
  )
}
