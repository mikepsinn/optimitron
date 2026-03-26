"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { LeaderboardEntry } from "@/lib/verified-votes.server";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { ShareTemplatesCard } from "@/components/prize/ShareTemplatesCard";
import { Progress } from "@/components/retroui/Progress";
import { Tooltip } from "@/components/retroui/Tooltip";
import { WorldIdVerificationCard } from "@/components/personhood/WorldIdVerificationCard";
import { buildPrizeReferralUrl } from "@/lib/url";
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  GLOBAL_POPULATION_2024,
} from "@optimitron/data/parameters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  stats: {
    totalReferrals: number;
    verifiedVotes: number;
    pendingVerification: number;
    rank: number | null;
  } | null;
  leaderboard: LeaderboardEntry[];
  globalProgress: { verifiedVotes: number };
}

// ---------------------------------------------------------------------------
// Constants — Impact math
// ---------------------------------------------------------------------------

const LIVES_SAVED_PER_VOTE = VOTER_LIVES_SAVED.value; // ~38.4
const SUFFERING_HOURS_PER_VOTE = VOTER_SUFFERING_HOURS_PREVENTED.value; // ~6.9M hours
const HOURS_PER_YEAR = 8_760;
const SUFFERING_YEARS_PER_VOTE = Math.round(
  SUFFERING_HOURS_PER_VOTE / HOURS_PER_YEAR,
);
const TIPPING_POINT_PCT =
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT.value * 100; // 3.5
const VOTING_BLOC_TARGET = TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value; // 280M
const GLOBAL_POP = GLOBAL_POPULATION_2024.value; // 8B
const AVG_IMPRESSIONS_PER_SHARE = 265;

// ---------------------------------------------------------------------------
// Badge milestones
// ---------------------------------------------------------------------------

const BADGES = [
  { threshold: 1, label: "FIRST RECRUIT", icon: "🎯" },
  { threshold: 3, label: "CATALYST", icon: "⚡" },
  { threshold: 10, label: "POWER RECRUITER", icon: "💪" },
  { threshold: 50, label: "MOVEMENT BUILDER", icon: "🚀" },
  { threshold: 100, label: "LEGEND", icon: "🏆" },
];

function getNextMilestone(current: number): number {
  for (const b of BADGES) {
    if (current < b.threshold) return b.threshold;
  }
  return current;
}

function getTierMessage(count: number): string {
  if (count === 0) return "Share your referral link to start recruiting.";
  if (count < 3)
    return `${3 - count} more verified votes to Catalyst status.`;
  if (count < 10)
    return "You're a Catalyst. Can you hit 10 for Power Recruiter?";
  if (count < 50)
    return "You're a Power Recruiter. 50 verified votes = Movement Builder.";
  if (count < 100)
    return "You're building a movement. 100 verified votes = LEGEND status.";
  return "You're a LEGEND. Every additional vote compounds the signal.";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CitizenDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/referrals/stats")
      .then((res) =>
        res.ok ? (res.json() as Promise<DashboardData>) : null,
      )
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [status]);

  const user = session?.user as
    | { username?: string; referralCode?: string }
    | undefined;
  const username = user?.username ?? user?.referralCode ?? null;
  const referralUrl = buildPrizeReferralUrl(username);

  // Loading
  if (status === "loading" || loading) {
    return (
      <div className="border-4 border-primary bg-background p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated
  if (!data?.stats) {
    return (
      <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-foreground mb-2">
          Your Citizen Dashboard
        </h3>
        <p className="text-sm font-bold text-foreground mb-4">
          Sign in to track your impact, see your leaderboard rank,
          and get your referral link. Each verified vote you bring in
          = {LIVES_SAVED_PER_VOTE.toFixed(1)} lives saved + {SUFFERING_YEARS_PER_VOTE.toLocaleString()} years of
          suffering prevented.
        </p>
        <a
          href="/api/auth/signin"
          className="inline-flex items-center justify-center border-4 border-primary bg-foreground px-6 py-2 text-sm font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          Sign In
        </a>
      </div>
    );
  }

  const { stats, leaderboard, globalProgress } = data;
  const totalGlobal = globalProgress.verifiedVotes;
  const sharePercent =
    totalGlobal > 0
      ? ((stats.verifiedVotes / totalGlobal) * 100).toFixed(2)
      : "0.00";
  const nextMilestone = getNextMilestone(stats.verifiedVotes);
  const milestoneProgress = Math.min(
    (stats.verifiedVotes / nextMilestone) * 100,
    100,
  );

  // Impact calculations
  const livesSaved = stats.verifiedVotes * LIVES_SAVED_PER_VOTE;
  const sufferingYearsPrevented =
    stats.verifiedVotes * SUFFERING_YEARS_PER_VOTE;
  const estimatedReach =
    stats.totalReferrals * AVG_IMPRESSIONS_PER_SHARE;

  // Global tipping point
  const globalPctOfPopulation = (totalGlobal / GLOBAL_POP) * 100;
  const globalPctOfTarget = (totalGlobal / VOTING_BLOC_TARGET) * 100;
  const votesRemaining = Math.max(0, VOTING_BLOC_TARGET - totalGlobal);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
        Your Citizen Dashboard
      </h2>

      {/* ── Impact Banner ── */}
      <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-black uppercase text-muted-foreground mb-2">
          Your Verified Votes Have Contributed To
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="cursor-help">
                  <div className="text-3xl font-black text-brutal-pink-foreground">
                    {Math.round(livesSaved).toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground">
                    lives saved (attributed)
                  </div>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
                <p className="font-bold text-sm text-foreground">
                  Each verified vote = {LIVES_SAVED_PER_VOTE.toFixed(1)} lives
                  saved (total lives saved by the treaty ÷ 280M target voting
                  bloc). Your {stats.verifiedVotes} verified votes ={" "}
                  {Math.round(livesSaved).toLocaleString()} lives.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="cursor-help">
                  <div className="text-3xl font-black text-brutal-pink-foreground">
                    {sufferingYearsPrevented.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground">
                    years of suffering prevented
                  </div>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
                <p className="font-bold text-sm text-foreground">
                  Each verified vote prevents ~{SUFFERING_YEARS_PER_VOTE.toLocaleString()} years
                  of suffering ({(SUFFERING_HOURS_PER_VOTE / 1e6).toFixed(1)}M
                  hours ÷ 8,760 hours/year). Based on DALYs averted by
                  accelerating treatment timelines.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="cursor-help">
                  <div className="text-3xl font-black text-brutal-pink-foreground">
                    {estimatedReach.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground">
                    hearts &amp; minds reached
                  </div>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
                <p className="font-bold text-sm text-foreground">
                  Estimated reach based on your referrals. Each referral
                  generates an average of {AVG_IMPRESSIONS_PER_SHARE} social
                  media impressions.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </div>
      </div>

      {/* ── Proof of Personhood ── */}
      <WorldIdVerificationCard show />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Verified Votes"
          value={stats.verifiedVotes.toString()}
          detail={`${stats.pendingVerification} pending verification`}
          color="bg-brutal-cyan"
        />
        <StatCard
          label="Total Referrals"
          value={stats.totalReferrals.toString()}
          detail="Votes from your link"
          color="bg-brutal-yellow"
        />
        <StatCard
          label="Est. Share"
          value={`${sharePercent}%`}
          detail="Of success pool"
          color="bg-brutal-pink"
          textWhite
        />
        <StatCard
          label="Global Rank"
          value={stats.rank ? `#${stats.rank}` : "—"}
          detail="By verified votes"
          color="bg-background"
        />
      </div>

      {/* ── Referral Goal + Badges ── */}
      <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-foreground mb-1">
          Your Referral Goal
        </h3>
        <p className="text-sm font-bold text-muted-foreground mb-4">
          Each verified vote = {LIVES_SAVED_PER_VOTE.toFixed(1)} lives saved +{" "}
          {SUFFERING_YEARS_PER_VOTE.toLocaleString()} years of suffering
          prevented
        </p>

        {/* Progress bar to next milestone */}
        <div className="flex items-center justify-between text-sm font-bold mb-2">
          <span>
            {stats.verifiedVotes} verified votes
          </span>
          <span>
            {stats.verifiedVotes >= nextMilestone
              ? "Goal met!"
              : `${nextMilestone - stats.verifiedVotes} more to next badge`}
          </span>
        </div>
        <Progress
          value={milestoneProgress}
          className="h-6 border-4 border-primary"
        />

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
          {BADGES.map((badge) => {
            const unlocked = stats.verifiedVotes >= badge.threshold;
            return (
              <div
                key={badge.threshold}
                className={`p-3 border-4 border-primary text-center transition-all ${
                  unlocked
                    ? "bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-background opacity-40"
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="font-black text-xs">
                  {badge.threshold === 100 ? "100+" : badge.threshold}
                </div>
                <div className="text-[10px] font-bold">{badge.label}</div>
              </div>
            );
          })}
        </div>

        {/* Contextual message */}
        <p className="text-sm font-bold text-foreground text-center mt-4">
          {getTierMessage(stats.verifiedVotes)}
        </p>
      </div>

      {/* ── Referral link ── */}
      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-foreground mb-3">
          Your Referral Link
        </h3>
        <CopyLinkButton url={referralUrl} variant="landing" />
        <div className="mt-4 flex justify-center">
          <SocialShareButtons
            url={referralUrl}
            text={`Your vote = ${LIVES_SAVED_PER_VOTE.toFixed(1)} lives saved + ${SUFFERING_YEARS_PER_VOTE.toLocaleString()} years of suffering prevented. Prove you want it.`}
          />
        </div>
      </div>

      {/* ── Leaderboard ── */}
      {leaderboard.length > 0 && (
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-4">
            Top Referrers
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 border-b border-primary pb-2 last:border-0 ${
                  entry.userId ===
                  (session?.user as { id?: string } | undefined)?.id
                    ? "bg-brutal-cyan -mx-2 px-2 rounded"
                    : ""
                }`}
              >
                <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                  {entry.rank}
                </span>
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt=""
                    className="w-8 h-8 border-4 border-primary object-cover shrink-0"
                  />
                ) : (
                  <span className="w-8 h-8 bg-brutal-yellow border-4 border-primary flex items-center justify-center text-xs font-black shrink-0">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="flex-1 text-sm font-bold text-foreground truncate">
                  {entry.name}
                </span>
                <span className="text-sm font-black text-brutal-pink">
                  {entry.verifiedVotes}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Global Tipping Point ── */}
      <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black uppercase text-foreground">
            Progress Toward {TIPPING_POINT_PCT}% Tipping Point
          </h3>
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <button className="w-6 h-6 border-4 border-primary bg-background flex items-center justify-center text-xs font-black hover:bg-brutal-pink hover:text-background transition-colors">
                  ?
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
                <p className="font-bold text-sm text-foreground">
                  <span className="text-brutal-pink">
                    The {TIPPING_POINT_PCT}% Rule:
                  </span>{" "}
                  Harvard research by Erica Chenoweth found that nonviolent
                  campaigns that engaged {TIPPING_POINT_PCT}% of the population
                  never failed to bring about change. Our target is{" "}
                  {(VOTING_BLOC_TARGET / 1e6).toFixed(0)}M people globally.
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </div>
        <p className="text-sm font-bold text-muted-foreground mb-3">
          We need {TIPPING_POINT_PCT}% of the global population to create
          unstoppable change
        </p>
        <div className="flex justify-between text-sm font-bold mb-2">
          <span>
            {globalPctOfPopulation.toFixed(
              globalPctOfPopulation < 0.01 ? 6 : 4,
            )}
            % of global population
          </span>
          <span>{TIPPING_POINT_PCT}% target</span>
        </div>
        <div className="h-6 bg-background border-4 border-primary overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-500"
            style={{ width: `${Math.min(globalPctOfTarget, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-bold">
            {totalGlobal.toLocaleString()} verified votes
          </span>
          <span className="text-sm font-bold">
            {votesRemaining.toLocaleString()} more needed
          </span>
        </div>
      </div>

      {/* ── Share templates ── */}
      <ShareTemplatesCard referralUrl={referralUrl} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  detail,
  color,
  textWhite = false,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
  textWhite?: boolean;
}) {
  return (
    <div
      className={`border-4 border-primary ${color} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
    >
      <div
        className={`text-xs font-black uppercase ${textWhite ? "text-muted-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </div>
      <div
        className={`text-2xl font-black mt-1 ${textWhite ? "text-brutal-pink-foreground" : "text-foreground"}`}
      >
        {value}
      </div>
      <div
        className={`text-[10px] font-bold mt-1 ${textWhite ? "text-muted-foreground" : "text-muted-foreground"}`}
      >
        {detail}
      </div>
    </div>
  );
}
