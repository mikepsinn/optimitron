"use client";

import { Suspense } from "react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { PrizeCalculator } from "@/components/prize/PrizeCalculator";
import { prizeLink, earthOptimizationPrizePaperLink } from "@/lib/routes";
import { fmtParam } from "@/lib/format-parameter";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  CONVENTIONAL_RETIREMENT_RETURN,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@/lib/parameters-calculations-citations";

/**
 * Landing section 4: "Win Either Way"
 *
 * The emotional climax of the landing page. Presents the prize mechanism
 * as a game that can't be lost, with inline calculator and break-even math.
 * Collapses the selfish/altruistic distinction.
 */
export function LandingPrizeOffer() {
  return (
    <section className="bg-brutal-pink">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="text-3xl font-black font-mono uppercase tracking-tight text-brutal-pink-foreground sm:text-4xl md:text-5xl">
            The Earth Optimization Game
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-bold text-background">
            INSERT COIN TO PLAY. The objective: redirect Earth&apos;s resources
            from the things making you poorest and deadest to the things that
            make you healthiest and wealthiest. The only way to lose is to not
            play.
          </p>
        </ScrollReveal>

        {/* Two outcomes */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <ScrollReveal direction="left">
            <div className="border-4 border-primary bg-brutal-yellow p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-2 text-xs font-black uppercase text-muted-foreground">
                If the Plan Fails
              </div>
              <div className="text-4xl font-black text-foreground">
                ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} Back
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">
                Your principal grows at{" "}
                {fmtParam(PRIZE_POOL_ANNUAL_RETURN)} annually in the
                Wishocratic fund for 15 years. You get it all back. The
                &ldquo;worst case&rdquo; is multiplying your money.
              </p>
              <div className="mt-4 border-4 border-primary bg-background px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  vs {fmtParam(CONVENTIONAL_RETIREMENT_RETURN)} in conventional
                  retirement
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="border-4 border-primary bg-brutal-cyan p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-2 text-xs font-black uppercase text-muted-foreground">
                If the Plan Succeeds
              </div>
              <div className="text-4xl font-black text-foreground">
                {fmtParam({
                  ...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
                  unit: "USD",
                })}
                + Per Capita
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">
                Everyone gets richer. VOTE point holders claim proportional
                shares of the prize pool. Recruiters who brought in verified
                voters get the biggest share. Everyone else benefits from higher
                GDP up to{" "}
                {fmtParam({
                  ...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
                  unit: "USD",
                })}{" "}
                per capita lifetime.
              </p>
              <div className="mt-4 border-4 border-primary bg-background px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  Prize share proportional to voters you recruited
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* How it works — condensed */}
        <ScrollReveal className="mb-12">
          <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-6 text-xl font-black uppercase text-foreground">
              Two Ways In
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border-4 border-primary bg-brutal-pink p-5">
                <div className="mb-1 text-xs font-black uppercase text-background">
                  Have Capital?
                </div>
                <p className="text-sm font-bold text-background">
                  Deposit USDC → Get PRIZE shares → Fund earns{" "}
                  {fmtParam(PRIZE_POOL_ANNUAL_RETURN)} → Floor of ~
                  {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} if plan fails. Also get a
                  referral link for success-side upside.
                </p>
              </div>
              <div className="border-4 border-primary bg-brutal-cyan p-5">
                <div className="mb-1 text-xs font-black uppercase text-foreground">
                  Have a Network?
                </div>
                <p className="text-sm font-bold text-foreground">
                  Share referral link → Recruit verified voters (World ID) →
                  Earn 1 VOTE point per voter → Prize share if plan succeeds.
                  No deposit required.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Calculator */}
        <ScrollReveal className="mb-12">
          <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-6 text-xl font-black uppercase text-foreground">
              Calculate Your Returns
            </h3>
            <Suspense>
              <PrizeCalculator />
            </Suspense>
          </div>
        </ScrollReveal>

        {/* Wishonia comment + CTA */}
        <ScrollReveal>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold text-foreground leading-relaxed">
              You don&apos;t need to be altruistic. You just need to be
              numerate. The break-even probability shift is 0.0067%. That&apos;s
              1 in 15,000. You need to believe there&apos;s a 1-in-15,000
              chance this works for the expected value to be positive. And if
              it doesn&apos;t work, you still get ~
              {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} back. On my planet, this took
              about twelve seconds to explain.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center border-4 border-primary bg-foreground px-8 py-3.5 text-lg font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            Play the Game
          </NavItemLink>
          <NavItemLink
            item={earthOptimizationPrizePaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-primary bg-background px-8 py-3.5 text-lg font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            Read the Full Paper
          </NavItemLink>
        </div>
      </div>
    </section>
  );
}
