"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { IncentiveFeedbackLoop } from "./IncentiveFeedbackLoop";
import { IABCalculator } from "./IABCalculator";
import {
  incentiveAlignmentBondsPaperLink,
  contractsSourceLink,
  prizeLink,
} from "@/lib/routes";
import { Stat } from "@/components/ui/stat";
import {
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
const bondReturnPct = `${(VICTORY_BOND_ANNUAL_RETURN_PCT.value * 100).toFixed(0)}%`;

export function IncentiveAlignmentBondsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section className="bg-brutal-pink border-t-4 border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            The Bond That Replaces Your Entire Political System
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            Your principal earns yield. Your proceeds fund campaigns for
            politicians who vote to reallocate from low to high net social value
            activities. The side effect is fixing civilisation, but I&apos;ve
            learned not to lead with that.
          </p>
        </ScrollReveal>

        {/* Two outcomes — clear upside/downside */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ScrollReveal direction="left">
            <div className="p-6 border-4 border-primary bg-brutal-yellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full">
              <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block mb-3 uppercase">
                Your Downside (Plan Fails)
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">
                ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} Your Money Back
              </h3>
              <p className="text-sm text-foreground leading-relaxed font-bold mb-3">
                Dominant assurance contract. If outcome thresholds aren&apos;t met,
                you get principal + 15 years of Wishocratic fund yield.
              </p>
              <div className="p-3 bg-muted border border-primary">
                <p className="text-xs font-bold text-muted-foreground">
                  Invest $1,000 → Get back ~$11,060 if the plan fails.
                  Your &ldquo;worst case&rdquo; is 11x-ing your money.
                </p>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.15}>
            <div className="p-6 border-4 border-primary bg-brutal-cyan shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full">
              <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block mb-3 uppercase">
                Your Upside (Plan Succeeds)
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">
                Perpetual Treaty Revenue Share
              </h3>
              <p className="text-sm text-foreground leading-relaxed font-bold mb-3">
                Treaty passes → $27B/yr flows in. 80% funds pragmatic clinical trials.
                10% returns to bondholders. 10% funds politicians ranked by Alignment Score.
                <Stat param={{...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"}} />–<Stat param={{...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"}} /> per-capita income gains across adopting jurisdictions.
              </p>
              <div className="p-3 bg-muted border border-primary">
                <p className="text-xs font-bold text-muted-foreground">
                  Buy bonds → proceeds fund aligned politicians → treaty passes →
                  bondholders earn {bondReturnPct} annual returns from treaty revenue. Perpetually.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Payoff bar visualization */}
        <div ref={ref} className="max-w-3xl mx-auto mb-8">
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-4 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className="text-xs font-black uppercase text-muted-foreground text-center mb-3">
              Return profile — you win either way
            </p>
            <div className="flex items-center h-10 gap-0">
              {/* Fail payoff */}
              <motion.div
                initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                  ease: [0.87, 0, 0.13, 1],
                }}
                style={{ originX: 0 }}
                className="h-full bg-brutal-yellow border-4 border-primary flex items-center justify-center px-3 w-1/4"
              >
                <span className="text-xs font-black text-foreground whitespace-nowrap">
                  Fails → ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)}
                </span>
              </motion.div>

              {/* Break-even marker */}
              <div className="h-full flex flex-col items-center justify-center px-2 shrink-0">
                <div className="w-0.5 h-full bg-foreground" />
              </div>

              {/* Success payoff */}
              <motion.div
                initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.87, 0, 0.13, 1],
                }}
                style={{ originX: 0 }}
                className="h-full bg-brutal-cyan border-4 border-primary flex items-center justify-center px-3 flex-grow"
              >
                <span className="text-xs font-black text-foreground whitespace-nowrap">
                  Succeeds → perpetual treaty revenue share
                </span>
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground font-bold text-center mt-2">
              Break-even: 0.0067% probability shift. Your expected value is positive in virtually all scenarios.
            </p>
          </motion.div>
        </div>

        {/* Interactive calculator */}
        <ScrollReveal>
          <div className="max-w-3xl mx-auto mb-8 p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black text-foreground uppercase text-center mb-2">
              Calculate Your Returns
            </h3>
            <p className="text-sm text-muted-foreground font-bold text-center mb-6">
              Plug in any amount. See what happens in both scenarios.
              Then notice the break-even probability.
            </p>
            <IABCalculator />
          </div>
        </ScrollReveal>

        {/* Feedback loop diagram */}
        <ScrollReveal>
          <div className="max-w-3xl mx-auto mb-8 p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black text-foreground uppercase text-center mb-2">
              Why Everyone Lobbies for Expansion
            </h3>
            <p className="text-sm text-muted-foreground font-bold text-center mb-4">
              80% of treaty inflows fund pragmatic trials. Diseases get cured.
              Everyone&apos;s income rises. Bondholders earn 10% in returns.
              Politicians earn 10% for alignment. But the real payout is
              population-wide: the ${Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value).toLocaleString("en-US")}/year dysfunction tax starts
              disappearing for every human on Earth. As GDP rises, everyone
              lobbies for more treaty funding. 1% → 2% → 5%. The loop is
              self-reinforcing.
            </p>
            <IncentiveFeedbackLoop />
          </div>
        </ScrollReveal>

        {/* Phase relationship */}
        <ScrollReveal delay={0.3}>
          <div className="p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-lg font-black text-foreground mb-2">
              Two Phases. One Goal. Separate Instruments.
            </p>
            <p className="text-muted-foreground font-bold max-w-2xl mx-auto mb-4 text-sm">
              Phase 1 (Prize) proves demand via referendum. Phase 2 (IABs) funds the lobbying campaign after demand is proven. Different contracts, different timelines, same endgame.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {["Zero Team Allocation", "No Pre-Sale", "Auditable On-Chain", "Win Either Way"].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-black uppercase px-2 py-0.5 border border-primary bg-muted text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavItemLink
                item={incentiveAlignmentBondsPaperLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
              >
                Read the paper &rarr;
              </NavItemLink>
              <NavItemLink
                item={contractsSourceLink}
                variant="custom"
                external
                className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                View contracts &rarr;
              </NavItemLink>
              <NavItemLink
                item={prizeLink}
                variant="custom"
                className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                View the Prize &rarr;
              </NavItemLink>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
