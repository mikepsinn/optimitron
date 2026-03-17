"use client"

import { calculateImpactLedger, HOURS_PER_YEAR } from "@/lib/impact-ledger"
import { formatLives, formatNumberShort } from "@/lib/formatters"
import { CopyLinkButton } from "@/components/sharing/copy-link-button"
import { SocialShareButtons } from "@/components/sharing/social-share-buttons"
import { Button } from "@/components/ui/button"
import { Heart, Clock3, Share2 } from "lucide-react"
import { useState } from "react"

interface StickyShareFooterProps {
  referrals: number
  referralLink: string
}

export function StickyShareFooter({ referrals, referralLink }: StickyShareFooterProps) {
  const metrics = calculateImpactLedger(referrals)
  const livesSaved = metrics.livesSaved
  const sufferingYearsPrevented = metrics.sufferingHoursRemoved / HOURS_PER_YEAR
  const [showShare, setShowShare] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-primary bg-brutal-yellow p-4 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-left">
          <div className="bg-background border-2 border-primary p-2 hidden sm:block">
            <Heart className="h-6 w-6 text-brutal-pink fill-brutal-pink" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-widest">Your Impact</p>
            <div className="flex items-baseline gap-3">
              <p className="text-xl sm:text-2xl font-black uppercase leading-none">
                {formatLives(livesSaved)} <span className="text-sm sm:text-base font-bold">LIVES SAVED</span>
              </p>

              <div className="hidden lg:flex items-center gap-1 text-muted-foreground">
                <span className="text-primary font-black mx-1">&bull;</span>
                <Clock3 className="h-4 w-4" />
                <span className="font-black text-lg text-foreground">{formatNumberShort(sufferingYearsPrevented)}</span>
                <span className="text-xs font-bold uppercase text-foreground">YEARS SUFFERING PREVENTED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-1 max-w-md">
          <CopyLinkButton
            url={referralLink}
            variant="landing"
            className="h-12 sm:h-14 text-sm sm:text-lg flex-1"
          />

          <Button
            onClick={() => setShowShare(!showShare)}
            className="h-12 sm:h-14 w-12 sm:w-14 shrink-0 border-4 border-primary bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0"
          >
            <Share2 className="h-6 w-6" />
            <span className="sr-only">Share Options</span>
          </Button>
        </div>
      </div>

      {showShare && (
        <div className="mx-auto max-w-7xl mt-4 pb-2">
          <SocialShareButtons url={referralLink} />
        </div>
      )}
    </div>
  )
}
