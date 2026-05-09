import { GameCTA } from "@/components/ui/game-cta";
import { StatCardGrid } from "@/components/ui/stat-card";
import { NumberedStepCard } from "@/components/ui/numbered-step-card";
import { POINT, POINTS, REFERRAL } from "@/lib/messaging";
import {
  fmtParam,
  PRIZE_POOL_HORIZON_MULTIPLE,
} from "@optimitron/data/parameters";
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";
import { getGlobalVerifiedVoteCount } from "@/lib/verified-votes.server";
import { prisma } from "@/lib/prisma";
import { ROUTES, scoreboardLink } from "@/lib/routes";
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
        <p className="text-sm font-black font-pixel uppercase tracking-[0.2em] text-foreground">
          The Earth Optimization Game
        </p>
        <h1 className="text-3xl md:text-5xl font-black font-pixel uppercase tracking-tight text-foreground">
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
        <h2 className="text-xl font-black font-pixel uppercase tracking-tight text-foreground mb-6 text-center">
          The Two Numbers That Matter
        </h2>
        <HumanityScoreboard />
      </section>

      {/* GDP Trajectory Chart */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black font-pixel uppercase tracking-tight text-foreground mb-2 text-center">
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
        <h2 className="text-xl font-black font-pixel uppercase tracking-tight text-foreground mb-6 text-center">
          Live Game Status
        </h2>
        <StatCardGrid
          columns={4}
          stats={[
            { label: "Prize Pool", value: `$${stats.poolUSD.toLocaleString()}`, description: `grows at ${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} over 15yr`, size: "sm" },
            { label: "Verified Voters", value: stats.verifiedVoters.toLocaleString(), description: `of ${fmtParam({...MAJORITY_OF_HUMANS_ON_EARTH, unit: ""})} target`, size: "sm" },
            { label: `${POINTS} Earned`, value: stats.votePoints.toLocaleString(), description: REFERRAL.earnOneShort, size: "sm" },
            { label: "Time Remaining", value: <CollapseCountdownTimer size="sm" showLabel={false} />, size: "sm" },
          ]}
        />
      </section>

      {/* How the Game Works */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black font-pixel uppercase tracking-tight text-foreground mb-6 text-center">
            How to Play
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NumberedStepCard
              step={1}
              title="Deposit"
              description={`Put your money in the machine. Get PRIZE shares. Projected growth is ${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} over 15 years if the campaign misses its targets.`}
              color="pink"
            />
            <NumberedStepCard
              step={2}
              title="Recruit"
              description={`Share your link. ${REFERRAL.earnOne} It's a referral chain where the thing at the top is not dying from preventable diseases.`}
              color="yellow"
            />
            <NumberedStepCard
              step={3}
              title="Score"
              description={`15 years later: metrics hit targets → VOTE holders split the pool. Metrics miss → depositors get ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} back. Nobody loses.`}
              color="cyan"
            />
          </div>
        </div>
      </section>

      {/* Wishonia comment */}
      <section className="mb-12">
        <div className="border-4 border-primary bg-foreground text-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold leading-relaxed text-center">
            On Wishonia, we solved this in year 12. You lot have been arguing
            about it for 4,237 years. The scoreboard makes the campaign size
            impossible to ignore. Updated in real time. Visible to everyone.
            The only question is whether you join before or after it becomes
            embarrassing not to.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <section className="text-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/prize">Play the Game</GameCTA>
          <GameCTA href={ROUTES.wishocracy} variant="yellow">Make Your Allocation</GameCTA>
          <GameCTA href="/politicians" variant="outline">Politician Leaderboard</GameCTA>
        </div>
      </section>
    </div>
  );
}
