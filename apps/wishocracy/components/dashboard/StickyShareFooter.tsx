"use client"

import { calculateImpactLedger, HOURS_PER_YEAR } from "@/lib/impact-ledger"
import { formatLives, formatNumberShort } from "@/lib/formatters"
import { ReferralLinkCard } from "@/components/shared/ReferralLinkCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Clock3 } from "lucide-react"

interface StickyShareFooterProps {
  referrals: number
  referralLink: string
}

export function StickyShareFooter({ referrals, referralLink }: StickyShareFooterProps) {
  const metrics = calculateImpactLedger(referrals)
  const livesSaved = metrics.livesSaved
  const sufferingYearsPrevented = metrics.sufferingHoursRemoved / HOURS_PER_YEAR

  const scrollToImpact = () => {
    const element = document.getElementById("impact-ledger")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-primary bg-brutal-yellow p-4 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <button 
          onClick={scrollToImpact}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity group"
          title="See detailed impact breakdown"
        >
          <div className="bg-background border-2 border-primary p-2 hidden sm:block group-hover:scale-105 transition-transform">
            <Heart className="h-6 w-6 text-brutal-pink fill-brutal-pink" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-widest underline decoration-dotted decoration-primary/50 underline-offset-2">Your Impact</p>
            <div className="flex items-baseline gap-3">
              <p className="text-xl sm:text-2xl font-black uppercase leading-none">
                {formatLives(livesSaved)} <span className="text-sm sm:text-base font-bold">LIVES SAVED</span>
              </p>
              
              <div className="hidden lg:flex items-center gap-1 text-muted-foreground">
                <span className="text-primary font-black mx-1">•</span>
                <Clock3 className="h-4 w-4" />
                <span className="font-black text-lg text-foreground">{formatNumberShort(sufferingYearsPrevented)}</span>
                <span className="text-xs font-bold uppercase text-foreground">YEARS SUFFERING PREVENTED</span>
              </div>
            </div>
          </div>
        </button>
        
        <div className="shrink-0">
           <Dialog>
             <DialogTrigger asChild>
               <Button className="h-12 sm:h-14 px-4 sm:px-6 border-4 border-primary bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground text-sm sm:text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 SHARE TO SAVE LIVES
                </Button>
             </DialogTrigger>
             <DialogContent className="border-4 border-primary bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogTitle className="sr-only">Share referral link</DialogTitle>
               <div className="p-6 sm:p-8">
                 <ReferralLinkCard
                   referralLink={referralLink}
                   frameless
                   className="border-0 p-0 shadow-none"
                 />
               </div>
             </DialogContent>
           </Dialog>
        </div>
      </div>
    </div>
  )
}
