import { Suspense } from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { POINTS, REFERRAL } from "@/lib/messaging";
import {
  fmtParam,
  TREATY_ANNUAL_FUNDING,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
  VICTORY_BOND_ANNUAL_PAYOUT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  EFFICACY_LAG_YEARS,
} from "@optimitron/data/parameters";
import {
  contractsSourceLink,
  iabLink,
  prizeLink,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { IABCalculator } from "@/components/landing/IABCalculator";
import { GameCTA } from "@/components/ui/game-cta";

export const metadata = getRouteMetadata(iabLink);

const bondReturnPct = fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT);
const bondAnnualPayout = fmtParam({...VICTORY_BOND_ANNUAL_PAYOUT, unit: "USD"});
const dysfunctionTaxFormatted = fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL);

export default function IABPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Phase 2 — After the Referendum
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            Incentive Alignment Bonds
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            After the{" "}
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="font-black text-brutal-pink underline hover:text-foreground transition-colors"
            >
              Earth Optimization Prize referendum
            </NavItemLink>{" "}
            proves demand, IABs raise ~$1B to lobby for the 1% Treaty.
            Your money funds the campaign. Treaty succeeds? {bondReturnPct} projected
            annual returns as {bondAnnualPayout}/year in treaty revenue flows
            to bondholders. Treaty fails? The money was spent trying.
            That&apos;s how investments work.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            IABs are Phase 2. Phase 1 is proving demand via the referendum.
            If you haven&apos;t deposited in the Prize yet, start there — it funds
            the awareness campaign that makes IABs possible.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <GameCTA href="#how-it-works" variant="primary">Learn About IABs</GameCTA>
          <GameCTA href="https://iab.warondisease.org" variant="outline" external>Read the Paper</GameCTA>
          <GameCTA href="/prize" variant="cyan">Phase 1: Prize</GameCTA>
        </div>
      </section>

      {/* The 80/10/10 Split */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Where Treaty Revenue Goes
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          The 1% Treaty redirects {fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD"})}/year
          from military spending to pragmatic clinical trials. That revenue is
          split by smart contract. No committees. No discretion. Just arithmetic.
        </p>
        <div className="space-y-4">
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 bg-foreground text-background flex items-center justify-center text-lg font-black shrink-0">
                80%
              </span>
              <h3 className="font-black uppercase text-lg">
                Pragmatic Clinical Trials
              </h3>
            </div>
            <p className="text-sm font-bold leading-relaxed">
              Subsidizes patient participation in large-scale pragmatic trials.
              Real patients, real conditions, real data — not the {fmtParam(TRADITIONAL_PHASE3_COST_PER_PATIENT)}/patient
              Phase III process that takes {fmtParam(EFFICACY_LAG_YEARS)} after safety is already
              proven. This is the part that actually cures the diseases.
            </p>
            <div className="mt-3 border-4 border-primary bg-background px-3 py-2 inline-block">
              <span className="text-xs font-black uppercase text-muted-foreground">
                ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.8})}/year
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-foreground text-background flex items-center justify-center text-lg font-black shrink-0">
                  10%
                </span>
                <h3 className="font-black uppercase">
                  Projected Bondholder Returns
                </h3>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                Your grandma bought war bonds that paid 4% and got dead Nazis.
                These project {bondReturnPct} returns and dead diseases. Grandma
                would be furious if she hadn&apos;t died of cancer.
              </p>
              <div className="mt-3 border-4 border-primary bg-background px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  ~{bondAnnualPayout}/year to investors
                </span>
              </div>
            </div>

            <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-foreground text-background flex items-center justify-center text-lg font-black shrink-0">
                  10%
                </span>
                <h3 className="font-black uppercase">
                  SuperPAC for Aligned Politicians
                </h3>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                The NRA gives politicians a letter grade and your senators
                are more afraid of a bad mark than a mass shooting. Same
                system, except &ldquo;guns&rdquo; is replaced with &ldquo;not
                dying from diseases.&rdquo; Vote yes, get funded. Vote no,
                watch your opponent get funded.
              </p>
              <div className="mt-3 border-2 border-border bg-background px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.1})}/year to aligned politicians
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-4 border-primary bg-background p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            The 80/10/10 split is hardcoded in the smart contract. No committee
            gets to argue it into mush later. No lobbying required to lobby.
          </p>
        </div>
      </section>

      {/* Risk & Reward */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Risk &amp; Reward
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Treaty Fails
            </div>
            <div className="text-2xl font-black">
              Money Was Spent
            </div>
            <p className="text-xs font-bold mt-2">
              Your investment funded the lobbying campaign — lobbyists, Super PACs,
              awareness. If the treaty doesn&apos;t pass, the money was spent trying.
              This is a real investment, not a savings account. The risk is the price
              of playing for {bondReturnPct} annual returns.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Treaty Succeeds
            </div>
            <div className="text-2xl font-black">
              {bondReturnPct} Annual Returns
            </div>
            <p className="text-xs font-bold mt-2">
              {bondAnnualPayout}/year flows to bondholders who funded a $1B
              campaign. Plus per-capita lifetime income gains of{" "}
              {`${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}`}.
              Turns out when you stop spending papers on destruction and start
              spending them on production, things get produced.
            </p>
          </div>
        </div>
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            You are currently paying {dysfunctionTaxFormatted} per year in
            political dysfunction tax. The break-even probability on an IAB is
            0.0067%. If you believe there&apos;s even a 1-in-15,000 chance of the
            treaty passing, the expected value is positive. The arithmetic is
            not subtle.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section id="how-it-works" className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Projected Return Scenarios
        </h2>
        <div className="border-4 border-primary bg-background p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Suspense>
            <IABCalculator />
          </Suspense>
        </div>
      </section>

      {/* How IABs Differ from the Prize */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Prize vs IABs — Two Phases, One Goal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Phase 1 — Now
            </div>
            <h3 className="text-lg font-black uppercase mb-3">
              Earth Optimization Prize
            </h3>
            <ul className="space-y-2 text-sm font-bold">
              <li className="flex gap-2">
                <span className="text-brutal-cyan-foreground font-black shrink-0">1.</span>
                <span>Deposit → PRIZE shares (Prize fund yield)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan-foreground font-black shrink-0">2.</span>
                <span>Recruit verified voters → earn {POINTS}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan-foreground font-black shrink-0">3.</span>
                <span>Prove demand for the 1% Treaty via global referendum</span>
              </li>
            </ul>
            <p className="text-xs font-bold mt-3 opacity-80">
              Purpose: Prove that 8 billion humans who prefer not dying aren&apos;t the weird ones.
            </p>
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="inline-flex items-center mt-4 text-sm font-black text-brutal-cyan-foreground uppercase underline decoration-current underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Go to Prize &rarr;
            </NavItemLink>
          </div>

          <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Phase 2 — After Demand Is Proven
            </div>
            <h3 className="text-lg font-black uppercase mb-3">
              Incentive Alignment Bonds
            </h3>
            <ul className="space-y-2 text-sm font-bold">
              <li className="flex gap-2">
                <span className="text-brutal-pink-foreground font-black shrink-0">1.</span>
                <span>Raise ~$1B to lobby for treaty passage</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-pink-foreground font-black shrink-0">2.</span>
                <span>Treaty revenue splits 80/10/10 by smart contract</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-pink-foreground font-black shrink-0">3.</span>
                <span>Bondholders earn projected {bondReturnPct} annual returns</span>
              </li>
            </ul>
            <p className="text-xs font-bold mt-3 opacity-80">
              Purpose: Give papers to loud humans until politicians do useful things. (This is called &ldquo;lobbying.&rdquo;)
            </p>
            <span className="inline-flex items-center mt-4 text-sm font-black uppercase">
              You are here
            </span>
          </div>
        </div>
      </section>

      {/* The Self-Reinforcing Loop */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Why Everyone Lobbies for Expansion
        </h2>
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            {[
              { label: "IAB investment", detail: "funds the lobbying campaign", color: "bg-brutal-yellow text-brutal-yellow-foreground" },
              { label: "Treaty passes", detail: "1% military → clinical trials", color: "bg-brutal-cyan text-brutal-cyan-foreground" },
              { label: "Diseases cured", detail: "80% funds pragmatic trials", color: "bg-brutal-cyan text-brutal-cyan-foreground" },
              { label: "GDP rises", detail: "healthier people earn more", color: "bg-brutal-pink text-brutal-pink-foreground" },
              { label: "Everyone lobbies", detail: "for 1% → 2% → 5%", color: "bg-brutal-yellow text-brutal-yellow-foreground" },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                <div className={`w-full border-4 border-primary ${step.color} p-3`}>
                  <div className="text-xs font-black uppercase">{step.label}</div>
                  <div className="text-[10px] font-bold mt-1 opacity-70">{step.detail}</div>
                </div>
                {i < 4 && (
                  <div className="text-foreground font-black text-lg my-1 md:hidden">↓</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-bold text-center mt-4">
            It&apos;s a dog chasing its tail, except the dog is capitalism and the
            tail is made of cured diseases instead of corpses. Bondholders get richer.
            Politicians who expand get funded. Healthy people earn more and spend more.
            Nobody has to become a better person. The greed handles it.
          </p>
        </div>
      </section>

      {/* Contract Architecture */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Contract Architecture
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "IABVault",
              value: "Bond purchases → campaign funding",
              detail: "Investors get IAB tokens. Capital funds the lobbying campaign. Revenue share distributed to bondholders on treaty success.",
            },
            {
              label: "IABSplitter",
              value: "80/10/10 revenue split",
              detail: "Receives treaty revenue. Routes 80% to PublicGoodsPool, 10% to bondholders, 10% to PoliticalIncentiveAllocator.",
            },
            {
              label: "PublicGoodsPool",
              value: "Clinical trial funding",
              detail: "Receives 80%. Wishocratic allocation determines which implementers get funded. Outcome-gated distribution.",
            },
            {
              label: "AlignmentScoreOracle",
              value: "Politician scoring",
              detail: "On-chain alignment scores comparing politician votes against citizen preferences.",
            },
            {
              label: "PoliticalIncentiveAllocator",
              value: "SuperPAC distribution",
              detail: "Receives 10%. Routes funds to politicians proportional to their alignment scores.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-black text-foreground">
                {item.value}
              </div>
              <div className="mt-2 text-xs font-bold text-muted-foreground">
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
            className="inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
          >
            Full source on GitHub &rarr;
          </NavItemLink>
        </div>
      </section>

      {/* Final CTA */}
      <section className="card bg-brutal-yellow text-brutal-yellow-foreground border-primary text-center">
        <h2 className="text-2xl font-black mb-3 uppercase">
          Phase 1 First
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          IABs fund the lobbying campaign. But lobbying is pointless without
          proven demand. The referendum comes first. Deposit in the Prize,
          recruit verified voters, collapse pluralistic ignorance. Then we
          sell the bonds.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/prize" variant="secondary">Play the Game</GameCTA>
          <GameCTA href="https://iab.warondisease.org" variant="outline" external>Read the IAB Paper</GameCTA>
        </div>
      </section>
    </div>
  );
}
