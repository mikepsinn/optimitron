import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  fmtParam,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  TREATY_HALE_GAIN_YEAR_15,
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_AVG_INCOME_2025,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
} from "@optimitron/data/parameters";
import {
  contractsSourceLink,
  prizeLink,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { VoterPrizeTreasuryDeposit } from "@/components/prize/VoterPrizeTreasuryDeposit";
import { CitizenDashboardWrapper } from "@/components/prize/CitizenDashboardWrapper";
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from "@/components/retroui/Accordion";
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
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { TwoOutcomes } from "@/components/prize/TwoOutcomes";
import { POINT, POINTS, REFERRAL, PRIZE_OUTCOMES } from "@/lib/messaging";

export const metadata = getRouteMetadata(prizeLink);

const poolMultiple = fmtParam(PRIZE_POOL_HORIZON_MULTIPLE);
const poolReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);
const incomeGain = fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"});
const haleGain = fmtParam(TREATY_HALE_GAIN_YEAR_15);

const levels = [
  {
    level: "STEP 1",
    title: "DEPOSIT",
    description: `Deposit USDC. You get PRIZE shares. Projected growth: ${poolReturn} annually if the thresholds miss.`,
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    level: "STEP 2",
    title: "RECRUIT",
    description: `Share your referral link. ${REFERRAL.earnOne} ${REFERRAL.noDeposit}`,
    color: "bg-brutal-yellow",
    textColor: "text-brutal-yellow-foreground",
  },
];

const contractDetails = [
  {
    label: "Contract",
    value: "VoterPrizeTreasury.sol",
    detail: `Dominant assurance pool with Earth Optimization Prize fund yield and ${POINT} rewards`,
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
    detail: `One verified vote per person. ${POINTS} go to the referrer.`,
  },
  {
    label: "Fail-Safe",
    value: "Dominant Assurance",
    detail: `15yr maturity. Thresholds not met = PRIZE holders claim principal + ~${poolMultiple} projected growth.`,
  },
];

export default async function PrizePage() {
  const poolStats = await getPoolStats();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* DISCLAIMER — Top */}
      <section className="mb-8">
        <DisclaimerBanner />
      </section>

      {/* HERO — Arcade Cabinet */}
      <section className="mb-16 text-center">
        <p className="font-pixel text-sm font-bold uppercase tracking-[0.3em] text-brutal-pink mb-4">
          The Earth Optimization Game
        </p>
        <h1 className="font-pixel text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
          Insert Coin to Play
        </h1>
        <p className="text-lg font-bold text-muted-foreground max-w-2xl mx-auto mb-6">
          A dominant assurance game with a projected {poolMultiple} return if thresholds are missed.
        </p>
        <p className="text-base font-bold text-foreground max-w-2xl mx-auto">
          All figures are projections based on VC-sector diversification — not promises.
        </p>
      </section>

      {/* GAME OVER CARDS — The Two Outcomes */}
      <section className="mb-16">
        <TwoOutcomes
          fail={{
            title: "Game Over: You Lose",
            metric: <>~{poolMultiple} BACK</>,
            description: <>Humanity stays stupid. Metrics miss the targets after 15 years. Projected outcome: ~{poolReturn} annual growth for 15 years (based on VC-sector diversification).</>,
          }}
          success={{
            title: "Game Over: You Win",
            metric: <>{incomeGain}+ INCOME</>,
            description: <>Humanity gets its act together. Your deposit stays in the prize pool. Your expected upside is {incomeGain} more per capita lifetime income and {haleGain} extra healthy years.</>,
          }}
          footer={<>Recruit voters too? You earn {POINTS}. {PRIZE_OUTCOMES.successShort}<span className="font-black text-brutal-pink"> Dominant assurance design.</span></>}
        />
      </section>

      {/* THE TWO NUMBERS */}
      <section className="mb-16">
        <h2 className="font-pixel text-xl font-black uppercase tracking-tight text-foreground mb-6 text-center">
          Win Conditions
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl text-center mx-auto">
          Two numbers. If both rise by 2040, the pool splits to {POINT} holders. If not, depositors claim principal + projected growth.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black mb-2 uppercase">
              Median Healthy Life Years
            </h3>
            <div className="flex items-center justify-between font-mono text-xs font-black uppercase mb-1">
              <span>Now: {fmtParam(GLOBAL_HALE_CURRENT)}</span>
              <span>Target: {fmtParam(TREATY_PROJECTED_HALE_YEAR_15)}</span>
            </div>
            <div className="h-4 bg-brutal-cyan-foreground/20 border-2 border-primary rounded-sm overflow-hidden">
              <div
                className="h-full bg-brutal-cyan-foreground"
                style={{ width: `${(GLOBAL_HALE_CURRENT.value / TREATY_PROJECTED_HALE_YEAR_15.value * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="font-mono text-xs font-black mt-1 text-center">
              +{fmtParam(TREATY_HALE_GAIN_YEAR_15)} by 2040
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black mb-2 uppercase">
              Median Real After-Tax Income
            </h3>
            <div className="flex items-center justify-between font-mono text-xs font-black uppercase mb-1">
              <span>Now: {fmtParam(GLOBAL_AVG_INCOME_2025)}</span>
              <span>Target: {fmtParam(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15)}</span>
            </div>
            <div className="h-4 bg-brutal-yellow-foreground/20 border-2 border-primary rounded-sm overflow-hidden">
              <div
                className="h-full bg-brutal-yellow-foreground"
                style={{ width: `${(GLOBAL_AVG_INCOME_2025.value / TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="font-mono text-xs font-black mt-1 text-center">
              {fmtParam(GLOBAL_AVG_INCOME_2025)} → {fmtParam(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15)} by 2040
            </p>
          </div>
        </div>
      </section>

      {/* Insert Coin - Deposit Section */}
      <section id="invest" className="mb-16">
        <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-pixel text-2xl font-black uppercase mb-4">
            Insert Coin
          </h2>
          <p className="text-sm font-bold mb-6 max-w-2xl">
            Your deposit goes into the Earth Optimization Prize fund (projected {poolReturn} annually, based on VC-sector diversification). You get PRIZE shares.
            Recruit verified voters and you also earn {POINTS}, which would pay out if humanity
            wins. This is the first arcade game in history where the house loses on purpose.
          </p>
          <VoterPrizeTreasuryDeposit />
        </div>
      </section>

      {/* LEVELS — How to Play */}
      <section className="mb-16">
        <h2 className="font-pixel text-2xl font-black uppercase tracking-tight text-foreground mb-8 text-center">
          How to Play
        </h2>
        <div className="space-y-4">
          {levels.map((item) => (
            <div
              key={item.level}
              className={`border-4 border-primary ${item.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-6 items-start`}
            >
              <div
                className={`font-pixel text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap shrink-0 pt-1 ${
                  item.textColor === "text-background"
                    ? "text-background/80"
                    : "text-muted-foreground"
                }`}
              >
                {item.level}
              </div>
              <div>
                <h3 className={`font-pixel text-lg font-black uppercase ${item.textColor}`}>
                  {item.title}
                </h3>
                <p className={`text-sm font-bold ${item.textColor === "text-background" ? "text-muted" : "text-muted-foreground"} mt-1`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CITIZEN DASHBOARD */}
      <section id="dashboard" className="mb-16">
        <CitizenDashboardWrapper />
      </section>

      {/* TECHNICAL DETAILS */}
      <section className="mb-16">
        <h2 className="font-pixel text-xl font-black uppercase tracking-tight text-foreground mb-6">
          Technical Details
        </h2>
        <Accordion type="multiple" className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AccordionItem value="trust" className="border-b-4 border-primary last:border-b-0">
            <AccordionHeader className="px-6 py-4 font-pixel text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Trust &amp; Transparency
            </AccordionHeader>
            <AccordionContent className="px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4">
                  <h4 className="font-mono font-black uppercase text-xs mb-2">
                    Zero Insider Advantage
                  </h4>
                  <p className="text-xs font-bold leading-relaxed">
                    No team allocation. No founder tokens. No pre-sale. No admin
                    keys. Your $100 gets exactly the same terms as $100,000.
                  </p>
                </div>
                <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4">
                  <h4 className="font-mono font-black uppercase text-xs mb-2">
                    Fully On-Chain
                  </h4>
                  <p className="text-xs font-bold leading-relaxed">
                    Every deposit, every VOTE mint, every metric update — all
                    on-chain. No committees. No discretion. Just smart contracts
                    doing arithmetic. Code is open source on GitHub.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contracts" className="border-b-4 border-primary last:border-b-0">
            <AccordionHeader className="px-6 py-4 font-pixel text-sm font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
              Contract Architecture
            </AccordionHeader>
            <AccordionContent className="px-6">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* POOL STATUS */}
      <section className="mb-16">
        <h2 className="font-pixel text-xl font-black uppercase tracking-tight text-foreground mb-6 text-center">
          Game Status
        </h2>
        <CollapseCountdownTimer size="md" className="mb-8" />
        <div className="grid gap-4 md:grid-cols-2 mb-8">
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
        </div>

        {/* Final CTA */}
        <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="font-pixel text-2xl font-black mb-3 uppercase">
            Play the Game
          </h2>
          <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
            The current cost of governance dysfunction is{" "}
            {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} per year.
            The break-even probability is 0.0067%. You don&apos;t need to be
            altruistic. You just need to be numerate.
          </p>
          <div className="flex justify-center">
            <GameCTA href="#invest" variant="secondary">Insert Coin</GameCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
