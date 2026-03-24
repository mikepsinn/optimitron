import { GameCTA } from "@/components/ui/game-cta";
import { fmtParam } from "@/lib/format-parameter";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
} from "@/lib/parameters-calculations-citations";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";
import { getGlobalVerifiedVoteCount } from "@/lib/verified-votes.server";
import { prisma } from "@/lib/prisma";
import { scoreboardLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

async function getGameStats() {
  try {
    const [deposits, voteMintsCount, globalVoters] = await Promise.all([
      prisma.prizeTreasuryDeposit.findMany({
        where: { deletedAt: null },
        select: { amount: true },
      }),
      prisma.voteTokenMint.count({
        where: { status: "CONFIRMED", deletedAt: null },
      }),
      getGlobalVerifiedVoteCount(),
    ]);

    const totalDeposited = deposits.reduce(
      (sum, d) => sum + BigInt(d.amount),
      0n,
    );
    // USDC has 6 decimals
    const poolUSD = Number(totalDeposited) / 1e6;

    return {
      poolUSD,
      verifiedVoters: globalVoters,
      votePoints: voteMintsCount,
    };
  } catch {
    // No DB connection — return zeros gracefully
    return { poolUSD: 0, verifiedVoters: 0, votePoints: 0 };
  }
}

export const metadata = getRouteMetadata(scoreboardLink);

export default async function ScoreboardPage() {
  const stats = await getGameStats();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-12 space-y-3 text-center">
        <p className="text-sm font-black font-[family-name:var(--font-arcade)] uppercase tracking-[0.2em] text-brutal-pink">
          The Earth Optimization Game
        </p>
        <h1 className="text-3xl md:text-5xl font-black font-[family-name:var(--font-arcade)] uppercase tracking-tight text-foreground">
          HIGH SCORES
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-bold text-muted-foreground">
          The objective: redirect Earth&apos;s resources from the things making
          you poorest and deadest to the things that make you healthiest and
          wealthiest. The only way to lose is to not play.
        </p>
      </section>

      {/* Humanity's Scoreboard — the two metrics that define the game */}
      <section className="mb-12">
        <h2 className="text-xl font-black font-[family-name:var(--font-arcade)] uppercase tracking-tight text-foreground mb-6 text-center">
          The Two Numbers That Matter
        </h2>
        <HumanityScoreboard />
      </section>

      {/* GDP Trajectory Chart */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black font-[family-name:var(--font-arcade)] uppercase tracking-tight text-foreground mb-2 text-center">
            Why There&apos;s a Timer
          </h2>
          <p className="text-sm font-bold text-muted-foreground text-center mb-4 max-w-2xl mx-auto">
            The destructive economy (military + cybercrime) is growing at 15%/yr.
            Productive GDP grows at 3%/yr. At current rates, destruction hits 50%
            of GDP and the game is over. The treaty and optimal governance
            trajectories show what happens when you redirect resources.
          </p>
          <GdpTrajectoryChart />
        </div>
      </section>

      {/* Live Game Stats */}
      <section className="mb-12">
        <h2 className="text-xl font-black font-[family-name:var(--font-arcade)] uppercase tracking-tight text-foreground mb-6 text-center">
          Live Game Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Prize Pool
            </div>
            <div className="mt-2 text-2xl font-black text-brutal-pink">
              ${stats.poolUSD.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground">
              grows at {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} over 15yr
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-muted-foreground">
              Verified Voters
            </div>
            <div className="mt-2 text-2xl font-black text-brutal-cyan">
              {stats.verifiedVoters.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground">
              of {fmtParam({...TREATY_CAMPAIGN_VOTING_BLOC_TARGET, unit: ""})} target
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-muted-foreground">
              VOTE Points Earned
            </div>
            <div className="mt-2 text-2xl font-black text-brutal-yellow">
              {stats.votePoints.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground">
              1 per verified voter recruited
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              Time Remaining
            </div>
            <CollapseCountdownTimer size="sm" showLabel={false} />
          </div>
        </div>
      </section>

      {/* How the Game Works */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black font-[family-name:var(--font-arcade)] uppercase tracking-tight text-foreground mb-6 text-center">
            How to Play
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-4 border-primary bg-brutal-pink p-5">
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black mb-3">
                1
              </div>
              <h3 className="font-black uppercase text-brutal-pink-foreground mb-2">
                Deposit
              </h3>
              <p className="text-sm font-bold text-background">
                Put USDC into the prize pool. Get PRIZE shares. Your money grows
                at {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} over 15 years regardless
                of outcome.
              </p>
            </div>
            <div className="border-4 border-primary bg-brutal-yellow p-5">
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black mb-3">
                2
              </div>
              <h3 className="font-black uppercase text-foreground mb-2">
                Recruit
              </h3>
              <p className="text-sm font-bold text-foreground">
                Share your referral link. Every person who verifies support for
                the 1% Treaty via World ID earns you 1 VOTE point.
              </p>
            </div>
            <div className="border-4 border-primary bg-brutal-cyan p-5">
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black mb-3">
                3
              </div>
              <h3 className="font-black uppercase text-foreground mb-2">
                Score
              </h3>
              <p className="text-sm font-bold text-foreground">
                15 years later: metrics hit targets → VOTE holders split the
                pool. Metrics miss → depositors get ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} back.
                Nobody loses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wishonia comment */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-background leading-relaxed text-center">
            On my planet, we solved this in year 12. You lot have been arguing
            about it for 4,237 years. The scoreboard makes the coalition size
            impossible to pretend does not exist. Updated in real time. Visible
            to everyone. The only question is whether you join before or after
            it becomes embarrassing not to.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <section className="text-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/prize">Play the Game</GameCTA>
          <GameCTA href="/wishocracy" variant="yellow">Make Your Allocation</GameCTA>
          <GameCTA href="/politicians" variant="outline">Politician Leaderboard</GameCTA>
        </div>
      </section>
    </div>
  );
}
