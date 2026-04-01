import { Suspense } from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  fmtParam,
  TREATY_ANNUAL_FUNDING,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
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

const poolMultiple = fmtParam(PRIZE_POOL_HORIZON_MULTIPLE);
const poolReturn = fmtParam(PRIZE_POOL_ANNUAL_RETURN);
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
            proves demand, IABs raise ~$1B to lobby for the 1% Treaty. This is
            a dominant assurance contract: plan fails? ~{poolMultiple} your
            money back. Plan succeeds? 10% of {fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD"})}/year
            in treaty revenue flows to bondholders. Everyone else gets higher GDP.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            IABs are Phase 2. Phase 1 is proving demand via the referendum.
            If you haven&apos;t deposited in the Prize yet, start there — it funds
            the awareness campaign that makes IABs possible.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <GameCTA href="#invest" variant="primary">Buy IABs</GameCTA>
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
                  Bondholder Returns
                </h3>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                Your grandma bought war bonds that paid 4% and got dead Nazis.
                You buy these and get 272% returns and dead diseases. Grandma
                would be furious if she hadn&apos;t died of cancer.
              </p>
              <div className="mt-3 border-4 border-primary bg-background px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.1})}/year to investors
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
            On my planet, we split revenue by algorithm and nobody argues about
            it. You lot spend most of your revenue on people whose job it is to
            argue about how to split revenue. The 80/10/10 is hardcoded in the
            smart contract. No lobbying required to lobby.
          </p>
        </div>
      </section>

      {/* Dominant Assurance */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Dominant Assurance — You Cannot Lose
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Treaty Fails
            </div>
            <div className="text-2xl font-black">
              ~{poolMultiple} Your Money Back
            </div>
            <p className="text-xs font-bold mt-2">
              Principal + 15 years of Prize fund returns ({poolReturn} annually) returned to you.
              Your &ldquo;worst case&rdquo; is multiplying your money.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-2">
              Treaty Succeeds
            </div>
            <div className="text-2xl font-black">
              {`${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}`}
            </div>
            <p className="text-xs font-bold mt-2">
              Per-capita lifetime income gain. Turns out when you stop spending
              papers on destruction and start spending them on production,
              things get produced. Bondholders also collect 10% of treaty
              revenue. Forever. Which is a long time. Unless you die of
              preventable disease. Which you&apos;re fixing. So it works out.
            </p>
          </div>
        </div>
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-foreground font-bold leading-relaxed">
            You are currently paying {dysfunctionTaxFormatted} per year in
            political dysfunction tax. The break-even on an IAB requires a
            0.0067% chance of that changing. The arithmetic here is not subtle.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          Calculate Your Returns
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
                <span className="text-brutal-cyan font-black shrink-0">1.</span>
                <span>Deposit USDC → PRIZE shares (Prize fund yield)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">2.</span>
                <span>Recruit verified voters → earn VOTE points</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">3.</span>
                <span>Prove demand for the 1% Treaty via global referendum</span>
              </li>
            </ul>
            <p className="text-xs font-bold mt-3 opacity-80">
              Purpose: Prove that 8 billion humans who prefer not dying aren&apos;t the weird ones.
            </p>
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="inline-flex items-center mt-4 text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
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
                <span className="text-brutal-pink font-black shrink-0">1.</span>
                <span>Raise ~$1B to lobby for treaty passage</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-pink font-black shrink-0">2.</span>
                <span>Treaty revenue splits 80/10/10 by smart contract</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-pink font-black shrink-0">3.</span>
                <span>Bondholders earn perpetual 10% returns</span>
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
              { label: "IAB deposits", detail: "fund the lobbying campaign", color: "bg-brutal-yellow text-brutal-yellow-foreground" },
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

      {/* Buy IABs */}
      <section id="invest" className="mb-16">
        <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase mb-4">
            Buy Incentive Alignment Bonds
          </h2>
          <p className="text-sm font-bold mb-4 max-w-2xl">
            IABs are Phase 2 — not yet deployed. The referendum (Phase 1) must
            prove demand first. Once deployed, your deposit goes into the Prize fund
            and earns proportional returns from treaty revenue.
          </p>
          <div className="border-4 border-border bg-background p-6">
            <div className="text-center">
              <div className="text-xs font-black uppercase text-muted-foreground mb-2">
                Contract Status
              </div>
              <div className="text-2xl font-black text-foreground mb-3">
                Not Yet Deployed
              </div>
              <p className="text-sm text-muted-foreground font-bold mb-4">
                Phase 1 (Prize referendum) is live on Base Sepolia. IABs deploy
                after the referendum proves demand for the 1% Treaty.
              </p>
              <NavItemLink
                item={prizeLink}
                variant="custom"
                className="inline-flex items-center justify-center border-2 border-border bg-background px-6 py-2.5 text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              >
                Play the Game First &rarr;
              </NavItemLink>
            </div>
          </div>
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
              value: "Bond purchases + Prize fund yield",
              detail: "Depositors get IAB tokens. Principal earns yield. Distributes refunds on failure or revenue share on success.",
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
