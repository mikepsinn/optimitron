import { Suspense } from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  fmtParam,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  TREATY_HALE_GAIN_YEAR_15,
} from "@optimitron/data/parameters";
import {
  contractsSourceLink,
  prizeLink,
  ROUTES,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { VoterPrizeTreasuryDeposit } from "@/components/prize/VoterPrizeTreasuryDeposit";
import { CitizenDashboardWrapper } from "@/components/prize/CitizenDashboardWrapper";
import { Accordion } from "@/components/retroui/Accordion";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { prisma } from "@/lib/prisma";

async function getPoolStats() {
  try {
    const deposits = await prisma.prizeTreasuryDeposit.findMany({
      where: { deletedAt: null },
      select: { amount: true },
    });
    const totalDeposited = deposits.reduce((sum, d) => sum + BigInt(d.amount), 0n);
    return { poolUSD: Number(totalDeposited) / 1e6 };
  } catch {
    return { poolUSD: 0 };
  }
}
import { GameCTA } from "@/components/ui/game-cta";

export const metadata = getRouteMetadata(prizeLink);

const poolMultiple = fmtParam(PRIZE_POOL_HORIZON_MULTIPLE);
const poolReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);
const incomeGain = fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"});
const haleGain = fmtParam(TREATY_HALE_GAIN_YEAR_15);

const levels = [
  {
    level: "LEVEL 1",
    title: "DEPOSIT",
    description: "Insert coins into the prize pool. Get PRIZE shares. Your money grows at " + poolReturn + " annually regardless of outcome.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    level: "LEVEL 2",
    title: "RECRUIT",
    description: "Share your referral link. Every person who verifies support for the 1% Treaty via World ID earns you 1 VOTE point. No deposit required.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
  },
  {
    level: "LEVEL 3",
    title: "ALLOCATE",
    description: "Make your wishocratic budget allocation. Tell the system what you think Earth should spend money on. Ten comparisons. Two minutes.",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
  },
  {
    level: "LEVEL 4",
    title: "VOTE",
    description: "Vote on the 1% Treaty referendum. Redirect 1% of military spending to pragmatic clinical trials. Your vote is verified by World ID.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
  },
  {
    level: "BOSS LEVEL",
    title: "WAIT 15 YEARS",
    description: "Metrics evaluated. If median healthy life years and median income hit targets, VOTE point holders split the pool. If not, depositors get ~" + poolMultiple + " back.",
    color: "bg-foreground",
    textColor: "text-background",
  },
];

const contractDetails = [
  {
    label: "Contract",
    value: "VoterPrizeTreasury.sol",
    detail: "Dominant assurance pool with Wishocratic fund yield and VOTE point rewards",
  },
  {
    label: "Health Metric",
    value: "Median Healthy Life Years",
    detail: "50% weight — verified by peer-reviewed study",
  },
  {
    label: "Income Metric",
    value: "Median Real After-Tax Income",
    detail: "50% weight — verified by quasi-experimental design",
  },
  {
    label: "Sybil Resistance",
    value: "World ID + Referral Links",
    detail: "One verified vote per person. VOTE points go to the referrer.",
  },
  {
    label: "Fail-Safe",
    value: "Dominant Assurance",
    detail: `15yr maturity. Thresholds not met = PRIZE holders claim principal + ~${poolMultiple} growth.`,
  },
];

export default async function PrizePage() {
  const poolStats = await getPoolStats();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* HERO — Arcade Cabinet */}
      <section className="mb-16 text-center">
        <p className="font-[family-name:var(--font-arcade)] text-sm font-bold uppercase tracking-[0.3em] text-brutal-pink mb-4">
          The Earth Optimization Game
        </p>
        <h1 className="font-[family-name:var(--font-arcade)] text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
          Insert Coin to Play
        </h1>
        <p className="text-lg font-bold text-muted-foreground max-w-2xl mx-auto mb-6">
          The only arcade game where you get your coins back {poolMultiple} if you lose.
        </p>
        <p className="text-base font-bold text-foreground max-w-2xl mx-auto">
          Your deposit is a hedge against your own species. Recruit voters too
          and you win in both scenarios. The only losing move is not playing.
        </p>
      </section>

      {/* GAME OVER CARDS — The Two Outcomes */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-yellow p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-[family-name:var(--font-arcade)] text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Game Over — You Lose
            </p>
            <div className="font-mono text-3xl font-black text-foreground mb-3">
              ~{poolMultiple} BACK
            </div>
            <p className="text-sm font-bold text-foreground leading-relaxed">
              Humanity stays stupid. Metrics miss the targets after 15 years.
              Your coins come back multiplied — {poolReturn} annual growth for
              15 years. Better than any retirement fund on your planet.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-[family-name:var(--font-arcade)] text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Game Over — You Win
            </p>
            <div className="font-mono text-3xl font-black text-foreground mb-3">
              {incomeGain}+ INCOME
            </div>
            <p className="text-sm font-bold text-foreground leading-relaxed">
              Humanity gets its act together. You lose the deposit. But your
              income just went up {incomeGain} per capita lifetime
              and you gained {haleGain} extra healthy years. You won&apos;t miss
              the coins.
            </p>
          </div>
        </div>
        <div className="border-4 border-primary border-t-0 bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-foreground text-center">
            Recruit voters too? You earn VOTE points.
            VOTE point holders split the pool if humanity wins.
            <span className="font-black text-brutal-pink"> You win either way.</span>
          </p>
        </div>
      </section>

      {/* INSERT COIN — Deposit Section */}
      <section id="invest" className="mb-16">
        <div className="border-4 border-primary bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-[family-name:var(--font-arcade)] text-2xl font-black uppercase text-brutal-pink-foreground mb-4">
            Insert Coin
          </h2>
          <p className="text-sm font-bold text-background mb-6 max-w-2xl">
            Your deposit goes into the Wishocratic fund ({poolReturn} annually). You get PRIZE shares —
            your claim on the pool. Recruit verified voters to earn
            VOTE points for success-scenario upside too.
          </p>
          <VoterPrizeTreasuryDeposit />
        </div>
        <div className="border-4 border-primary border-t-0 bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            On my planet, arcade games don&apos;t take your money. Yours do.
            This one doesn&apos;t. It&apos;s all on-chain — no admin keys, no
            committees, no fine print.
          </p>
          <NavItemLink
            item={contractsSourceLink}
            variant="custom"
            external
            className="inline-flex items-center mt-3 text-xs font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
          >
            View the smart contracts on GitHub &rarr;
          </NavItemLink>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="mb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Zero Team Allocation", detail: "100% to pool" },
            { label: "No Pre-Sale", detail: "Same price for everyone" },
            { label: "Fully On-Chain", detail: "Every tx auditable" },
            { label: "No Admin Keys", detail: "Contract controls distribution" },
            { label: "You Win Either Way", detail: `Lose: ~${poolMultiple} · Win: ${incomeGain}+` },
          ].map((badge) => (
            <div
              key={badge.label}
              className="border-4 border-primary bg-background px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="font-[family-name:var(--font-arcade)] text-xs font-black uppercase text-foreground">
                {badge.label}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground">
                {badge.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEVELS — How to Play */}
      <section className="mb-16">
        <h2 className="font-[family-name:var(--font-arcade)] text-2xl font-black uppercase tracking-tight text-foreground mb-8 text-center">
          How to Play
        </h2>
        <div className="space-y-4">
          {levels.map((item) => (
            <div
              key={item.level}
              className={`border-4 border-primary ${item.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-6 items-start`}
            >
              <div className="font-[family-name:var(--font-arcade)] text-xs font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap shrink-0 pt-1">
                {item.level}
              </div>
              <div>
                <h3 className={`font-[family-name:var(--font-arcade)] text-lg font-black uppercase ${item.textColor}`}>
                  {item.title}
                </h3>
                <p className={`text-sm font-bold ${item.textColor === "text-background" ? "text-muted" : "text-muted-foreground"} mt-1`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <GameCTA href="/scoreboard" variant="cyan" size="sm">High Scores</GameCTA>
          <GameCTA href={ROUTES.wishocracy} variant="yellow" size="sm">Level 3</GameCTA>
          <GameCTA href={ROUTES.referendum} variant="primary" size="sm">Level 4</GameCTA>
        </div>
      </section>

      {/* THE TWO NUMBERS */}
      <section className="mb-16">
        <h2 className="font-[family-name:var(--font-arcade)] text-xl font-black uppercase tracking-tight text-foreground mb-6 text-center">
          Win Conditions
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl text-center mx-auto">
          Two numbers decide whether VOTE point holders get paid.
          Everything else is an intermediate variable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black text-foreground mb-2 uppercase">
              Median Healthy Life Years
            </h3>
            <p className="text-sm text-foreground leading-relaxed font-bold">
              Not &ldquo;are you alive&rdquo; but &ldquo;are you alive and can you
              open a jar without crying.&rdquo; Median, not mean — one billionaire
              living to 120 doesn&apos;t mean your healthcare works.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black text-foreground mb-2 uppercase">
              Median Real After-Tax Income
            </h3>
            <p className="text-sm text-foreground leading-relaxed font-bold">
              What can a normal person actually buy after the government&apos;s had
              its go at their paycheque? Not GDP — that counts arms dealing and
              divorce lawyers. This counts &ldquo;can you feed your kids.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* CITIZEN DASHBOARD */}
      <section id="dashboard" className="mb-16">
        <Suspense>
          <CitizenDashboardWrapper />
        </Suspense>
      </section>

      {/* TECHNICAL DETAILS */}
      <section className="mb-16">
        <h2 className="font-[family-name:var(--font-arcade)] text-xl font-black uppercase tracking-tight text-foreground mb-6">
          Technical Details
        </h2>
        <Accordion type="multiple" className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Accordion.Item value="trust" className="border-b-4 border-primary last:border-b-0">
            <Accordion.Header className="px-6 py-4 font-[family-name:var(--font-arcade)] text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Trust &amp; Transparency
            </Accordion.Header>
            <Accordion.Content className="px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border-4 border-primary bg-brutal-yellow p-4">
                  <h4 className="font-mono font-black uppercase text-foreground text-xs mb-2">
                    Zero Insider Advantage
                  </h4>
                  <p className="text-xs text-foreground font-bold leading-relaxed">
                    No team allocation. No founder tokens. No pre-sale. No admin
                    keys. Your $100 gets exactly the same terms as $100,000.
                  </p>
                </div>
                <div className="border-4 border-primary bg-brutal-cyan p-4">
                  <h4 className="font-mono font-black uppercase text-foreground text-xs mb-2">
                    Fully On-Chain
                  </h4>
                  <p className="text-xs text-foreground font-bold leading-relaxed">
                    Every deposit, every VOTE mint, every metric update — all
                    on-chain. No committees. No discretion. Just smart contracts
                    doing arithmetic. Code is open source on GitHub.
                  </p>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="contracts" className="border-b-4 border-primary last:border-b-0">
            <Accordion.Header className="px-6 py-4 font-[family-name:var(--font-arcade)] text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Contract Architecture
            </Accordion.Header>
            <Accordion.Content className="px-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {contractDetails.map((item) => (
                  <div
                    key={item.label}
                    className="border-4 border-primary bg-background p-3"
                  >
                    <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-black text-foreground">
                      {item.value}
                    </div>
                    <div className="mt-1 text-xs font-bold text-muted-foreground">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <NavItemLink
                  item={contractsSourceLink}
                  variant="custom"
                  external
                  className="inline-flex items-center text-xs font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
                >
                  VoterPrizeTreasury.sol, VoteToken.sol — full source on GitHub &rarr;
                </NavItemLink>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </section>

      {/* POOL STATUS */}
      <section className="mb-16">
        <h2 className="font-[family-name:var(--font-arcade)] text-xl font-black uppercase tracking-tight text-foreground mb-6 text-center">
          Game Status
        </h2>
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="font-mono text-xs font-black uppercase text-muted-foreground">
              Status
            </div>
            <div className="font-[family-name:var(--font-arcade)] mt-2 text-2xl font-black text-brutal-cyan">
              ACCEPTING COINS
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="font-mono text-xs font-black uppercase text-muted-foreground">
              Prize Pool
            </div>
            <div className="font-mono mt-2 text-2xl font-black text-foreground">${poolStats.poolUSD.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-muted-foreground">
              grows at {poolReturn}/yr
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="font-mono text-xs font-black uppercase text-muted-foreground">
              Health Target
            </div>
            <div className="font-mono mt-2 text-2xl font-black text-foreground">+{haleGain}</div>
            <div className="text-[10px] font-bold text-muted-foreground">
              median healthy life years
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="font-mono text-xs font-black uppercase text-muted-foreground">
              Time
            </div>
            <div className="font-mono mt-2 text-2xl font-black text-brutal-red">
              <CollapseCountdownTimer size="sm" showLabel={false} />
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="border-4 border-primary bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="font-[family-name:var(--font-arcade)] text-2xl font-black text-brutal-pink-foreground mb-3 uppercase">
            Play the Game
          </h2>
          <p className="text-background mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
            The current cost of governance dysfunction is{" "}
            {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} per year.
            The break-even probability is 0.0067%. You don&apos;t need to be
            altruistic. You just need to be numerate.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <GameCTA href="#invest" variant="secondary">Insert Coin</GameCTA>
            <GameCTA href="/scoreboard" variant="outline">High Scores</GameCTA>
            <GameCTA href="https://prize.warondisease.org" variant="outline" external>Read the Manual</GameCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
