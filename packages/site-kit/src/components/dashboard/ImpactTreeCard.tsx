"use client"

import { Card } from "@/components/ui/card"
import { TreePine, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PublicRecruit {
  id: string
  name: string | null
  username: string | null
  image: string | null
  depth: number
}

interface ImpactTreeCardProps {
  directCount: number
  totalDownstreamCount: number
  maxDepth: number
  publicRecruits: PublicRecruit[]
  frameless?: boolean
  className?: string
}

/**
 * Shows the user's full referral tree impact: direct + downstream + generations.
 * Named recruits only shown when they've opted into isPublic = true; others are
 * anonymized in the downstream count. See lib/referral.server.ts:getReferralTreeStats.
 */
export function ImpactTreeCard({
  directCount,
  totalDownstreamCount,
  maxDepth,
  publicRecruits,
  frameless = false,
  className,
}: ImpactTreeCardProps) {
  const indirectCount = Math.max(totalDownstreamCount - directCount, 0)
  const hasAnyRecruits = totalDownstreamCount > 0

  const content = (
    <>
      {/* Three stat blocks — direct, indirect, generations */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
        <div className="border-4 border-primary bg-brutal-yellow p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-3xl sm:text-5xl font-black">{directCount}</div>
          <div className="text-xs sm:text-sm font-black uppercase mt-1">Direct Recruits</div>
        </div>
        <div className="border-4 border-primary bg-brutal-pink p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-3xl sm:text-5xl font-black">{indirectCount}</div>
          <div className="text-xs sm:text-sm font-black uppercase mt-1">Downstream</div>
        </div>
        <div className="border-4 border-primary bg-brutal-cyan p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-3xl sm:text-5xl font-black">{maxDepth}</div>
          <div className="text-xs sm:text-sm font-black uppercase mt-1">Generations</div>
        </div>
      </div>

      {!hasAnyRecruits && (
        <div className="border-4 border-dashed border-primary bg-background p-6 text-center">
          <p className="font-bold text-sm sm:text-base">
            No recruits yet. Share your referral link — the goal is to get just 2 people to vote.
            If everyone gets 2, we reach a majority of humans on Earth.
          </p>
        </div>
      )}

      {hasAnyRecruits && publicRecruits.length === 0 && (
        <div className="border-4 border-primary bg-background p-4 text-center">
          <p className="font-bold text-sm">
            Your {totalDownstreamCount} recruits have private profiles. Names appear here only when
            recruits make their profiles public.
          </p>
        </div>
      )}

      {publicRecruits.length > 0 && (
        <div>
          <div className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] mb-3">
            Your tree ({publicRecruits.length} public{" "}
            {totalDownstreamCount > publicRecruits.length &&
              `of ${totalDownstreamCount} total`}
            )
          </div>
          <div className="flex flex-wrap gap-2">
            {publicRecruits.map((recruit) => {
              const displayName = recruit.name || recruit.username || "Anonymous"
              const profileHref = recruit.username ? `/${recruit.username}` : null
              const badge = (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 border-4 border-primary px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs sm:text-sm",
                    recruit.depth === 1
                      ? "bg-brutal-yellow"
                      : recruit.depth === 2
                      ? "bg-brutal-pink"
                      : "bg-brutal-cyan"
                  )}
                >
                  {recruit.image ? (
                    <img
                      src={recruit.image}
                      alt=""
                      className="w-5 h-5 rounded-none border-2 border-primary"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                  <span className="truncate max-w-[120px]">{displayName}</span>
                  <span className="text-[10px] font-black uppercase opacity-70">
                    Gen {recruit.depth}
                  </span>
                </div>
              )
              return profileHref ? (
                <Link key={recruit.id} href={profileHref}>
                  {badge}
                </Link>
              ) : (
                <div key={recruit.id}>{badge}</div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )

  if (frameless) {
    return <div className={cn("space-y-0", className)}>{content}</div>
  }

  return (
    <Card
      className={cn(
        "bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center">
          <TreePine className="w-6 h-6 stroke-[3px]" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase">Your Impact Tree</h2>
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">
            Every recruit counts — even the ones your recruits recruit.
          </p>
        </div>
      </div>
      {content}
    </Card>
  )
}
