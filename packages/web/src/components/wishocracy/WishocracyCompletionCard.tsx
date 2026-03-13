"use client";

import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { Button } from "@/components/ui/button";
import { alignmentLink } from "@/lib/routes";
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data";
import { Comparison, calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";

interface WishocracyCompletionCardProps {
  show: boolean;
  comparisons: Comparison[];
  isAuthenticated: boolean;
  userEmail?: string | null;
  shareUrl: string;
}

export function WishocracyCompletionCard({
  show,
  comparisons,
  isAuthenticated,
  userEmail,
  shareUrl,
}: WishocracyCompletionCardProps) {
  useEffect(() => {
    if (!show) {
      return;
    }

    const defaults = {
      colors: ["#FF6B9D", "#00D9FF", "#FFE66D"],
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, options: confetti.Options) {
      void confetti({
        ...defaults,
        ...options,
        particleCount: Math.floor(200 * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [show]);

  if (!show) {
    return null;
  }

  const allocations = calculateAllocationsFromPairwise(comparisons);
  const topPriorities = Object.entries(allocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, percentage]) => ({
      categoryId,
      category: BUDGET_CATEGORIES[categoryId as BudgetCategoryId],
      percentage,
    }));

  const shareText = "I just mapped my budget priorities on Optomitron. Compare yours.";

  return (
    <div className="mx-auto mb-8 mt-12 max-w-3xl">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-black uppercase">Allocations Complete</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve finished this round and defined your budget priorities.
        </p>
        {isAuthenticated && userEmail ? (
          <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
            Saved to {userEmail}
          </p>
        ) : null}
      </div>

      <div className="mb-6 border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="mb-4 text-center text-lg font-black uppercase">Your Top Priorities</h3>
        <div className="space-y-3">
          {topPriorities.map((priority, index) => (
            <div key={priority.categoryId} className="flex items-center gap-3">
              <span className="w-8 text-2xl font-black text-brutal-pink">{index + 1}.</span>
              <span className="text-2xl">{priority.category.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-bold uppercase">{priority.category.name}</div>
                <div className="text-xs text-muted-foreground">
                  {priority.percentage.toFixed(1)}% of your ideal budget
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t-2 border-black pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full font-bold uppercase"
            onClick={() => {
              document
                .querySelector("[data-complete-list]")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            View Full Allocation
          </Button>
        </div>
      </div>

      <div className="mb-6 border-4 border-black bg-brutal-cyan/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="mb-3 text-center text-base font-black uppercase">Share Your Referral Link</h3>
        <p className="mb-4 text-center text-xs text-muted-foreground">
          Invite other people to compare priorities and submit their own allocations.
        </p>
        <div className="mb-4">
          <CopyLinkButton link={shareUrl} variant="landing" />
        </div>
        <SocialShareButtons url={shareUrl} text={shareText} />
      </div>

      <div className="space-y-3">
        <h3 className="text-center text-base font-black uppercase">What&apos;s Next?</h3>
        <div className="space-y-2 text-sm">
          {isAuthenticated ? (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Your allocations are saved to your account.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Share your referral link to bring more people into the comparison set.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Review the saved allocations below and refine any pair you want.</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Sign in to keep these allocations synced across sessions.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Your referral link will become personal once you create an account.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brutal-pink" />
                <span>Share the page now, then finish sign-up whenever you want to save it.</span>
              </div>
            </>
          )}
        </div>

        <div className="pt-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <Button asChild className="w-full font-black uppercase">
                <Link href={alignmentLink.href}>See Alignment Report</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full font-black uppercase"
                onClick={() => {
                  document
                    .querySelector("[data-edit-allocations]")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Review Saved Allocations
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full font-black uppercase"
              onClick={() => {
                document
                  .querySelector("[data-auth-prompt]")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Sign In to Save Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
