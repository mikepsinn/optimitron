"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import confetti from "canvas-confetti"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"
import { calculateAllocationsFromPairwise, Comparison } from "@/lib/wishocracy-calculations"
import { SocialShareButtons } from "@/components/sharing/social-share-buttons"
import { CopyLinkButton } from "@/components/sharing/copy-link-button"

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
  isAuthenticated,
  userEmail: _userEmail,
  shareUrl,
}: WishocracyCompletionCardProps) {
  useEffect(() => {
    if (show) {
      // Trigger confetti celebration
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

  // Calculate top priorities from allocations
  const allocations = calculateAllocationsFromPairwise(comparisons)
  const topPriorities = Object.entries(allocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, percentage]) => {
      const category = BUDGET_CATEGORIES[categoryId as BudgetCategoryId]
      return {
        categoryId,
        category,
        percentage,
      }
    })

  // Create share text with top 3 priorities
  const top3Names = topPriorities
    .slice(0, 3)
    .map((p) => p.category.name)
    .join(", ")
  const shareText = `I just completed my budget priorities on Wishocracy! My top priorities: ${top3Names}. See how your priorities compare to government spending:`

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
          You've completed all budget comparisons and defined your priorities.
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

      {/* Share Section */}
      <div className="bg-brutal-cyan/20 border-4 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h3 className="font-black text-md uppercase mb-3 text-center">
          Share Your Priorities
        </h3>
        <p className="text-xs text-muted-foreground text-center mb-4">
          Help others discover Wishocracy and see how their priorities compare to yours!
        </p>

        {/* Copy Link */}
        <div className="mb-4">
          <CopyLinkButton
            link={shareUrl}
            variant="landing"
          />
        </div>

        {/* Social Share Buttons */}
        <SocialShareButtons
          url={shareUrl}
          text={shareText}
        />
      </div>

      {/* What's Next Section */}
      <div className="space-y-3">
        <h3 className="font-black text-md uppercase text-center">
          What's Next?
        </h3>
        <div className="space-y-2 text-sm">
          {!isAuthenticated ? (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>Sign in to save your results and compare with others</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>Share your priorities to help others discover Wishocracy</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>Explore the treatments database to see where funding goes</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>Your results are saved to your account</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>Share your priorities to help others discover Wishocracy</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-brutal-pink flex-shrink-0" />
                <span>View your dashboard to see all your activity</span>
              </div>
            </>
          )}
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          {!isAuthenticated ? (
            <Button
              onClick={() => {
                // Scroll to sign-in prompt or trigger auth modal
                const statusBar = document.querySelector('[data-auth-prompt]')
                statusBar?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="w-full font-black uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Sign In to Save Results
            </Button>
          ) : (
            <Button
              onClick={() => {
                window.location.href = '/dashboard'
              }}
              className="w-full font-black uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
