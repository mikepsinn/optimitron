"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Vote, Heart, BarChart3 } from "lucide-react";
import { calculateImpactLedger } from "@/lib/impact-ledger";
import { formatLives } from "@/lib/formatters";

interface GameStats {
  wishes: number;
  votePoints: number;
  referrals: number;
  comparisons: number;
}

/**
 * Global sticky score bar — shown at the bottom of every page when logged in.
 * Shows: Wishes | VOTE points | Lives Saved | Comparisons
 */
export function GameScoreBar() {
  const { status } = useSession();
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/game-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setStats(data);
      })
      .catch(() => {});
  }, [status]);

  if (status !== "authenticated" || !stats) return null;

  const impact = calculateImpactLedger(stats.referrals);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-primary bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12">
        <div className="flex items-center gap-5 text-xs font-black uppercase">
          <Link
            href="/dashboard#referral"
            className="flex items-center gap-1.5 hover:text-brutal-cyan transition-colors"
            title="VOTE points (1 per voter recruited)"
          >
            <Vote className="h-3.5 w-3.5 text-brutal-cyan" />
            <span>{stats.votePoints} VOTE</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-brutal-pink transition-colors"
            title="Lives saved through recruitment"
          >
            <Heart className="h-3.5 w-3.5 text-brutal-pink" />
            <span>{formatLives(impact.livesSaved)} LIVES</span>
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

        <Link
          href="/dashboard"
          className="text-xs font-black uppercase hover:text-brutal-yellow transition-colors"
        >
          Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
