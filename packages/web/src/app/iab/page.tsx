import type { Metadata } from "next";
import { Suspense } from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { fmtParam } from "@/lib/format-parameter";
import {
  TREATY_ANNUAL_FUNDING,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  PRIZE_ESCROW_100_RETURN_MULTIPLE,
} from "@/lib/parameters-calculations-citations";
import {
  incentiveAlignmentBondsPaperLink,
  contractsSourceLink,
  prizeLink,
} from "@/lib/routes";
import { IABCalculator } from "@/components/landing/IABCalculator";

export const metadata: Metadata = {
  title: "Incentive Alignment Bonds | Optimitron",
  description:
    "Phase 2: After the referendum proves demand, raise ~$1B to lobby for the 1% Treaty. 80% funds pragmatic clinical trials, 10% returns to bondholders, 10% funds aligned politicians. Dominant assurance: ~4.2x return if treaty fails.",
};

const escrowMultiplier = PRIZE_ESCROW_100_RETURN_MULTIPLE.value.toFixed(1);
const dysfunctionTaxFormatted = `$${Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value).toLocaleString()}`;

export default function IABPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Phase 2 — After the Referendum
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            Incentive Alignment Bonds
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            After the{" "}
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="font-black text-brutal-pink underline hover:text-black transition-colors"
            >
              Earth Optimization Prize referendum
            </NavItemLink>{" "}
            proves demand, IABs raise ~$1B to lobby for the 1% Treaty. This is
            a dominant assurance contract: plan fails? ~{escrowMultiplier}x your
            money back. Plan succeeds? 10% of {fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD"})}/year
            in treaty revenue flows to bondholders. Everyone else gets higher GDP.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            IABs are Phase 2. Phase 1 is proving demand via the referendum.
            If you haven&apos;t deposited in the Prize yet, start there — it funds
            the awareness campaign that makes IABs possible.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#invest"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Buy IABs
          </a>
          <NavItemLink
            item={incentiveAlignmentBondsPaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Read the Paper
          </NavItemLink>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-cyan px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Phase 1: Prize
          </NavItemLink>
        </div>
      </section>

      {/* The 80/10/10 Split */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Where Treaty Revenue Goes
        </h2>
        <p className="text-sm font-medium text-black/60 mb-6 max-w-3xl">
          The 1% Treaty redirects {fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD"})}/year
          from military spending to pragmatic clinical trials. That revenue is
          split by smart contract. No committees. No discretion. Just arithmetic.
        </p>
        <div className="space-y-4">
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-black shrink-0">
                80%
              </span>
              <h3 className="font-black uppercase text-black text-lg">
                Pragmatic Clinical Trials
              </h3>
            </div>
            <p className="text-sm text-black/70 font-medium leading-relaxed">
              Subsidizes patient participation in large-scale pragmatic trials.
              Real patients, real conditions, real data — not the $41,117/patient
              Phase III process that takes 8.2 years after safety is already
              proven. This is the part that actually cures the diseases.
            </p>
            <div className="mt-3 border-2 border-black/20 bg-white/50 px-3 py-2 inline-block">
              <span className="text-xs font-black uppercase text-black/60">
                ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.8})}/year
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-black shrink-0">
                  10%
                </span>
                <h3 className="font-black uppercase text-black">
                  Bondholder Returns
                </h3>
              </div>
              <p className="text-sm text-black/70 font-medium leading-relaxed">
                Perpetual payments to IAB holders, proportional to their
                investment. This is why people buy the bonds — positive-EV
                financial instrument, not a donation.
              </p>
              <div className="mt-3 border-2 border-black/20 bg-white/50 px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-black/60">
                  ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.1})}/year to investors
                </span>
              </div>
            </div>

            <div className="border-4 border-black bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-black shrink-0">
                  10%
                </span>
                <h3 className="font-black uppercase text-white">
                  SuperPAC for Aligned Politicians
                </h3>
              </div>
              <p className="text-sm text-white/70 font-medium leading-relaxed">
                Campaign funding for politicians who supported the treaty and
                push for expansion. Politicians who vote with citizens get
                funded. Those who don&apos;t, don&apos;t. Alignment scoring
                makes it automatic.
              </p>
              <div className="mt-3 border-2 border-white/30 bg-white/10 px-3 py-2 inline-block">
                <span className="text-xs font-black uppercase text-white/60">
                  ~{fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD", value: TREATY_ANNUAL_FUNDING.value * 0.1})}/year to aligned politicians
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-4 border-black bg-white p-6 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            On my planet, we split revenue by algorithm and nobody argues about
            it. You lot spend most of your revenue on people whose job it is to
            argue about how to split revenue. The 80/10/10 is hardcoded in the
            smart contract. No lobbying required to lobby.
          </p>
        </div>
      </section>

      {/* Dominant Assurance */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Dominant Assurance — You Cannot Lose
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Treaty Fails
            </div>
            <div className="text-2xl font-black text-black">
              ~{escrowMultiplier}x Your Money Back
            </div>
            <p className="text-xs font-medium text-black/60 mt-2">
              Principal + 15 years of Aave yield returned to you. $1,000 → ~$4,200.
              Your &ldquo;worst case&rdquo; is quadrupling your money.
            </p>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Treaty Succeeds
            </div>
            <div className="text-2xl font-black text-black">
              {`${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}`}
            </div>
            <p className="text-xs font-medium text-black/60 mt-2">
              Per-capita lifetime income gain from optimized resource allocation.
              Bondholders also earn 10% of treaty revenue in perpetuity.
              Everyone benefits from higher GDP.
            </p>
          </div>
        </div>
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-black/70 font-medium leading-relaxed">
            You are currently paying {dysfunctionTaxFormatted} per year in
            political dysfunction tax. The break-even on an IAB requires a
            0.0067% chance of that changing. The arithmetic here is not subtle.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Calculate Your Returns
        </h2>
        <div className="border-4 border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Suspense>
            <IABCalculator />
          </Suspense>
        </div>
      </section>

      {/* How IABs Differ from the Prize */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Prize vs IABs — Two Phases, One Goal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-black bg-brutal-cyan/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Phase 1 — Now
            </div>
            <h3 className="text-lg font-black uppercase text-black mb-3">
              Earth Optimization Prize
            </h3>
            <ul className="space-y-2 text-sm text-black/70 font-medium">
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">1.</span>
                <span>Deposit USDC → PRIZE shares (Aave yield)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">2.</span>
                <span>Recruit verified voters → earn VOTE tokens</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">3.</span>
                <span>Prove demand for the 1% Treaty via global referendum</span>
              </li>
            </ul>
            <p className="text-xs text-black/50 font-bold mt-3">
              Purpose: Collapse pluralistic ignorance. Prove everyone wants this.
            </p>
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="inline-flex items-center mt-4 text-sm font-black text-brutal-pink uppercase hover:text-black transition-colors"
            >
              Go to Prize &rarr;
            </NavItemLink>
          </div>

          <div className="border-4 border-black bg-brutal-pink/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-black/50 mb-2">
              Phase 2 — After Demand Is Proven
            </div>
            <h3 className="text-lg font-black uppercase text-black mb-3">
              Incentive Alignment Bonds
            </h3>
            <ul className="space-y-2 text-sm text-black/70 font-medium">
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
            <p className="text-xs text-black/50 font-bold mt-3">
              Purpose: Fund the lobbying campaign. Turn proven demand into policy.
            </p>
            <span className="inline-flex items-center mt-4 text-sm font-black text-black/40 uppercase">
              You are here
            </span>
          </div>
        </div>
      </section>

      {/* The Self-Reinforcing Loop */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Why Everyone Lobbies for Expansion
        </h2>
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            {[
              { label: "IAB deposits", detail: "fund the lobbying campaign", color: "bg-brutal-yellow" },
              { label: "Treaty passes", detail: "1% military → clinical trials", color: "bg-brutal-cyan" },
              { label: "Diseases cured", detail: "80% funds pragmatic trials", color: "bg-brutal-cyan" },
              { label: "GDP rises", detail: "healthier people earn more", color: "bg-brutal-pink text-white" },
              { label: "Everyone lobbies", detail: "for 1% → 2% → 5%", color: "bg-brutal-yellow" },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                <div className={`w-full border-2 border-black ${step.color} p-3`}>
                  <div className="text-xs font-black uppercase">{step.label}</div>
                  <div className="text-[10px] font-medium mt-1 opacity-70">{step.detail}</div>
                </div>
                {i < 4 && (
                  <div className="text-black font-black text-lg my-1 md:hidden">↓</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-black/50 font-medium text-center mt-4">
            The loop is self-reinforcing. As GDP rises from cured diseases,
            the political cost of NOT expanding the treaty exceeds the cost of expanding it.
            Bondholders earn more. Politicians who expand get funded. Everyone&apos;s income rises.
          </p>
        </div>
      </section>

      {/* Buy IABs */}
      <section id="invest" className="mb-16">
        <div className="border-4 border-black bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase text-white mb-4">
            Buy Incentive Alignment Bonds
          </h2>
          <p className="text-sm font-medium text-white/70 mb-4 max-w-2xl">
            IABs are Phase 2 — not yet deployed. The referendum (Phase 1) must
            prove demand first. Once deployed, your deposit goes into Aave yield
            and earns proportional returns from treaty revenue.
          </p>
          <div className="border-4 border-white/20 bg-white/10 p-6">
            <div className="text-center">
              <div className="text-xs font-black uppercase text-white/50 mb-2">
                Contract Status
              </div>
              <div className="text-2xl font-black text-white mb-3">
                Not Yet Deployed
              </div>
              <p className="text-sm text-white/60 font-medium mb-4">
                Phase 1 (Prize referendum) is live on Base Sepolia. IABs deploy
                after the referendum proves demand for the 1% Treaty.
              </p>
              <NavItemLink
                item={prizeLink}
                variant="custom"
                className="inline-flex items-center justify-center border-2 border-white bg-white px-6 py-2.5 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)]"
              >
                Fund the Referendum First &rarr;
              </NavItemLink>
            </div>
          </div>
        </div>
      </section>

      {/* Contract Architecture */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
          Contract Architecture
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "IABVault",
              value: "Bond purchases + Aave yield",
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
              className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-black text-black">
                {item.value}
              </div>
              <div className="mt-2 text-xs font-medium text-black/60">
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
            className="inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-black transition-colors"
          >
            Full source on GitHub &rarr;
          </NavItemLink>
        </div>
      </section>

      {/* Final CTA */}
      <section className="card bg-brutal-yellow border-black text-center">
        <h2 className="text-2xl font-black text-black mb-3 uppercase">
          Phase 1 First
        </h2>
        <p className="text-black/70 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          IABs fund the lobbying campaign. But lobbying is pointless without
          proven demand. The referendum comes first. Deposit in the Prize,
          recruit verified voters, collapse pluralistic ignorance. Then we
          sell the bonds.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Fund the Referendum
          </NavItemLink>
          <NavItemLink
            item={incentiveAlignmentBondsPaperLink}
            variant="custom"
            external
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Read the IAB Paper
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
