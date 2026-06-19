import { Suspense } from "react";
import { PrizeCalculator } from "@/components/prize/PrizeCalculator";
import { GameCTA } from "@/components/ui/game-cta";
import { TwoOutcomes } from "@/components/prize/TwoOutcomes";
import { REFERRAL, PRIZE_OUTCOMES } from "@/lib/messaging";
import {
  fmtParam,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  CONVENTIONAL_RETIREMENT_RETURN,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";
/**
 * Landing section 4: "Win Either Way"
 *
 * The emotional climax of the landing page. Presents the prize mechanism
 * as a game that can't be lost, with inline calculator and break-even math.
 * Collapses the selfish/altruistic distinction.
 */
export function LandingPrizeOffer() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-black font-pixel uppercase tracking-tight text-background sm:text-4xl md:text-5xl">
            The Earth Optimization Game
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-bold">
            INSERT COIN TO PLAY. The objective: redirect Earth&apos;s resources
            from the things making you poorest and deadest to the things that
            make you healthiest and wealthiest. The only way to lose is to not
            play.
          </p>
        </div>

        {/* Two outcomes */}
        <div className="mb-12">
          <TwoOutcomes
            fail={{
              title: "If the Plan Fails",
              metric: <>~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} Back</>,
              description: <>Projected principal growth: {fmtParam(PRIZE_POOL_ANNUAL_RETURN)} annually in the Prize fund for 15 years (based on VC-sector diversification). All figures are projections, not guarantees.<div className="mt-4 border-4 border-primary bg-background text-foreground px-3 py-2 inline-block"><span className="text-xs font-black uppercase">vs {fmtParam(CONVENTIONAL_RETIREMENT_RETURN)} in conventional retirement</span></div></>,
            }}
            success={{
              title: "If the Plan Succeeds",
              metric: <>{fmtParam({ ...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD" })}+ Per Capita</>,
              description: <>Everyone gets richer. {PRIZE_OUTCOMES.successShort} Recruiters who brought in verified voters get the biggest share. Everyone else benefits from higher GDP up to {fmtParam({ ...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD" })} per capita lifetime.<div className="mt-4 border-4 border-primary bg-background text-foreground px-3 py-2 inline-block"><span className="text-xs font-black uppercase">Prize share proportional to voters you recruited</span></div></>,
            }}
          />
        </div>

        {/* How it works — condensed */}
        <div className="mb-12">
          <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-6 text-xl font-black uppercase text-foreground">
              Two Ways In
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border-4 border-primary bg-foreground text-background p-5">
                <div className="mb-1 text-xs font-black uppercase">
                  Have Capital?
                </div>
                <p className="text-sm font-bold">
                  Deposit → Get PRIZE shares → Fund earns{" "}
                  {fmtParam(PRIZE_POOL_ANNUAL_RETURN)} → Floor of ~
                  {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} if plan fails. Also get a
                  referral link for success-side upside.
                </p>
              </div>
              <div className="border-4 border-primary bg-background text-foreground p-5">
                <div className="mb-1 text-xs font-black uppercase">
                  Have a Network?
                </div>
                <p className="text-sm font-bold">
                  Share referral link → Recruit verified voters →
                  {REFERRAL.earnOne} Prize share if plan succeeds. {REFERRAL.noDeposit}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="mb-12">
          <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-6 text-xl font-black uppercase text-foreground">
              Calculate Your Returns
            </h3>
            <Suspense>
              <PrizeCalculator />
            </Suspense>
          </div>
        </div>

        {/* Wishonia comment + CTA */}
        <div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold text-foreground leading-relaxed">
              A dominant assurance design where projected returns are
              ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} if thresholds are not met (based
              on VC-sector diversification). All figures are hypothetical
              projections, not guarantees. On my planet, this took about twelve
              seconds to explain.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/prize" variant="secondary" size="lg">Play the Game</GameCTA>
          <GameCTA href="https://prize.warondisease.org" variant="outline" size="lg" external>Read the Full Paper</GameCTA>
        </div>
      </div>
    </section>
  );
}
