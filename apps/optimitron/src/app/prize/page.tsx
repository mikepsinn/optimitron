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
  },
  {
    level: "STEP 2",
    title: "RECRUIT",
    description: `Share your referral link. ${REFERRAL.earnOne} ${REFERRAL.noDeposit}`,
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
    value: "Personhood + Referral Links",
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="mb-8 border-b border-foreground pb-8 text-left sm:text-center">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          The Earth Optimization Game
        </p>
        <h1 className="font-pixel text-4xl font-black uppercase text-foreground md:text-5xl">
          Insert Coin to Play
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold text-muted-foreground md:text-lg">
          A dominant assurance game with a projected {poolMultiple} return if thresholds are missed.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-bold text-foreground">
          All figures are projections based on VC-sector diversification — not promises.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <GameCTA href="#invest" size="lg" className="w-full sm:w-auto">
            Insert Coin
          </GameCTA>
          <NavItemLink
            item={contractsSourceLink}
            variant="custom"
            external
            className="inline-flex min-h-12 items-center justify-center border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground hover:bg-foreground hover:text-background"
          >
            Read Contracts
          </NavItemLink>
        </div>
      </section>

      <section className="mb-10">
        <DisclaimerBanner compact />
      </section>

      {/* GAME OVER CARDS — The Two Outcomes */}
      <section className="mb-12">
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
          footer={<>Recruit voters too? You earn {POINTS}. {PRIZE_OUTCOMES.successShort}<span className="font-black text-foreground"> Dominant assurance design.</span></>}
        />
      </section>

      {/* THE TWO NUMBERS */}
      <section className="mb-12 border-t border-foreground pt-8">
        <div className="mb-6 max-w-3xl">
          <h2 className="font-pixel text-xl font-black uppercase text-foreground">
            Win Conditions
          </h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Two numbers. If both rise by 2040, the pool splits to {POINT} holders. If not, depositors claim principal + projected growth.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border border-foreground bg-background p-5 text-foreground">
            <h3 className="mb-3 text-sm font-black uppercase">
              Median Healthy Life Years
            </h3>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase">
              <span>Now: {fmtParam(GLOBAL_HALE_CURRENT)}</span>
              <span>Target: {fmtParam(TREATY_PROJECTED_HALE_YEAR_15)}</span>
            </div>
            <div className="h-2 overflow-hidden border border-foreground bg-background">
              <div
                className="h-full bg-foreground"
                style={{ width: `${(GLOBAL_HALE_CURRENT.value / TREATY_PROJECTED_HALE_YEAR_15.value * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-black text-muted-foreground">
              +{fmtParam(TREATY_HALE_GAIN_YEAR_15)} by 2040
            </p>
          </div>
          <div className="border border-foreground bg-background p-5 text-foreground">
            <h3 className="mb-3 text-sm font-black uppercase">
              Median Real After-Tax Income
            </h3>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase">
              <span>Now: {fmtParam(GLOBAL_AVG_INCOME_2025)}</span>
              <span>Target: {fmtParam(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15)}</span>
            </div>
            <div className="h-2 overflow-hidden border border-foreground bg-background">
              <div
                className="h-full bg-foreground"
                style={{ width: `${(GLOBAL_AVG_INCOME_2025.value / TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value * 100).toFixed(0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-black text-muted-foreground">
              {fmtParam(GLOBAL_AVG_INCOME_2025)} → {fmtParam(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15)} by 2040
            </p>
          </div>
        </div>
      </section>

      {/* Insert Coin - Deposit Section */}
      <section id="invest" className="mb-12 border-t border-foreground pt-8">
        <div className="mb-6 max-w-3xl">
          <h2 className="font-pixel text-2xl font-black uppercase text-foreground">
            Insert Coin
          </h2>
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            Your deposit goes into the Earth Optimization Prize fund (projected {poolReturn} annually, based on VC-sector diversification). You get PRIZE shares.
            Recruit verified voters and you also earn {POINTS}, which would pay out if humanity
            wins. This is the first arcade game in history where the house loses on purpose.
          </p>
        </div>
        <VoterPrizeTreasuryDeposit />
      </section>

      {/* LEVELS — How to Play */}
      <section className="mb-12 border-t border-foreground pt-8">
        <h2 className="mb-5 font-pixel text-xl font-black uppercase text-foreground">
          How to Play
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {levels.map((item) => (
            <div
              key={item.level}
              className="border border-foreground bg-background p-5 text-foreground"
            >
              <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                {item.level}
              </div>
              <h3 className="font-pixel text-base font-black uppercase text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CITIZEN DASHBOARD */}
      <section id="dashboard" className="mb-12 border-t border-foreground pt-8">
        <CitizenDashboardWrapper />
      </section>

      {/* TECHNICAL DETAILS */}
      <section className="mb-12 border-t border-foreground pt-8">
        <h2 className="mb-5 font-pixel text-xl font-black uppercase text-foreground">
          Technical Details
        </h2>
        <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="trust" className="rounded-none border border-foreground shadow-none hover:shadow-none data-[state=open]:shadow-none">
            <AccordionHeader className="px-5 py-4 text-sm font-black uppercase text-foreground hover:bg-muted hover:no-underline">
              Trust &amp; Transparency
            </AccordionHeader>
            <AccordionContent className="px-5">
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="border border-foreground bg-background p-4 text-foreground">
                  <h4 className="mb-2 text-xs font-black uppercase">
                    Zero Insider Advantage
                  </h4>
                  <p className="text-xs font-bold leading-relaxed">
                    No team allocation. No founder tokens. No pre-sale. No admin
                    keys. Your $100 gets exactly the same terms as $100,000.
                  </p>
                </div>
                <div className="border border-foreground bg-background p-4 text-foreground">
                  <h4 className="mb-2 text-xs font-black uppercase">
                    Fully On-Chain
                  </h4>
                  <p className="text-xs font-bold leading-relaxed">
                    Every deposit, every EOP mint, every metric update — all
                    publicly recorded. No committees. No discretion. Just protocol rules
                    doing arithmetic. Code is open source on GitHub.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contracts" className="rounded-none border border-foreground shadow-none hover:shadow-none data-[state=open]:shadow-none">
            <AccordionHeader className="px-5 py-4 text-sm font-black uppercase text-foreground hover:bg-muted hover:no-underline">
              Contract Architecture
            </AccordionHeader>
            <AccordionContent className="px-5">
              <div className="grid gap-3 md:grid-cols-2">
                {contractDetails.map((item) => (
                  <div
                    key={item.label}
                    className="border border-foreground bg-background p-3"
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
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
              <div className="mt-4">
                <NavItemLink
                  item={contractsSourceLink}
                  variant="custom"
                  external
                  className="inline-flex items-center text-xs font-black uppercase text-foreground underline transition-colors hover:text-foreground"
                >
                  VoterPrizeTreasury.sol, EarthOptimizationPoint.sol — full source on GitHub &rarr;
                </NavItemLink>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* POOL STATUS */}
      <section className="mb-12 border-t border-foreground pt-8">
        <h2 className="mb-5 font-pixel text-xl font-black uppercase text-foreground">
          Game Status
        </h2>
        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-foreground p-5 text-background">
            <CollapseCountdownTimer size="sm" />
          </div>
          <div className="grid gap-3">
            <div className="border border-foreground bg-background p-4">
              <div className="text-xs font-black uppercase text-muted-foreground">
                Prize Pool
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">${poolStats.poolUSD.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-muted-foreground">
                grows at {poolReturn}/yr
              </div>
            </div>
            <div className="border border-foreground bg-background p-4">
              <div className="text-xs font-black uppercase text-muted-foreground">
                Health Target
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">+{haleGain}</div>
              <div className="text-[10px] font-bold text-muted-foreground">
                median healthy life years
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-8 border border-foreground bg-background p-6 text-left sm:text-center">
          <h2 className="mb-3 font-pixel text-2xl font-black uppercase text-foreground">
            Play the Game
          </h2>
          <p className="mx-auto mb-6 max-w-2xl font-bold leading-relaxed text-muted-foreground">
            The current cost of governance dysfunction is{" "}
            {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} per year.
            The break-even probability is 0.0067%. You don&apos;t need to be
            altruistic. You just need to be numerate.
          </p>
          <div className="flex sm:justify-center">
            <GameCTA href="#invest" variant="secondary" className="w-full sm:w-auto">
              Insert Coin
            </GameCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
