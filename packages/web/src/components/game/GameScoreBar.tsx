"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Vote, Heart, BarChart3 } from "lucide-react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { calculateImpactLedger } from "@/lib/impact-ledger";
import { formatLives } from "@/lib/formatters";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import { POINTS, POINT_NAME, REFERRAL } from "@/lib/messaging";

interface GameStats {
  wishes: number;
  votePoints: number;
  referrals: number;
  comparisons: number;
}

interface GameStatsResponse extends GameStats {
  authenticated: boolean;
}

/**
 * Global sticky score bar — shown at the bottom of every page when logged in.
 * Shows: Wishes | VOTE Points | Lives Saved | Comparisons
 */
export function GameScoreBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/game-stats")
      .then((res): Promise<GameStatsResponse | null> => (res.ok ? res.json() : Promise.resolve(null)))
      .then((data) => {
        if (data?.authenticated) {
          setStats({
            wishes: data.wishes,
            votePoints: data.votePoints,
            referrals: data.referrals,
            comparisons: data.comparisons,
          });
        }
      })
      .catch(() => {});
  }, [status]);

  if (pathname.startsWith(ROUTES.demo)) return null;

  if (status !== "authenticated" || !stats) return null;

  const impact = calculateImpactLedger(stats.referrals);
  const referralLink = buildUserReferralUrl(session.user);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-primary bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-0 sm:h-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5 text-[11px] sm:text-xs font-black uppercase">
          <Link
            href="/dashboard#referral"
            className="flex items-center gap-1.5 hover:text-brutal-cyan transition-colors"
            title={`${POINTS} (${REFERRAL.earnOneShort})`}
          >
            <Vote className="h-3.5 w-3.5 text-brutal-cyan" />
            <span>{stats.votePoints} {POINT_NAME}</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-brutal-pink transition-colors"
            title="Lives saved through recruitment"
          >
            <Heart className="h-3.5 w-3.5 text-brutal-pink" />
            <span>{formatLives(impact.livesSaved)} INVERSE KILLS</span>
          </Link>

          <Link
            href="/agencies/dcongress/wishocracy"
            className="hidden sm:flex items-center gap-1.5 hover:text-brutal-yellow transition-colors"
            title="Budget comparisons completed"
          >
            <BarChart3 className="h-3.5 w-3.5 text-brutal-yellow" />
            <span>{stats.comparisons}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <CopyLinkButton
            url={referralLink}
            idleLabel="Copy Referral Link"
            copiedLabel="Referral Copied"
            className="h-8 px-3 py-1 text-[11px] sm:text-xs font-black uppercase whitespace-nowrap"
          />

          <Link
            href="/dashboard"
            className="text-[11px] sm:text-xs font-black uppercase hover:text-brutal-yellow transition-colors whitespace-nowrap"
          >
            Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
