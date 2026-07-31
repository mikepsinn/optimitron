"use client";

import { Suspense } from "react";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
  WAR_CHILDREN_KILLED_SINCE_1900,
  WAR_DEATHS_SINCE_1900,
  WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
} from "@optimitron/data/parameters";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StepReveal } from "@/components/animations/StepReveal";
import { GiantNumber } from "@/components/invest/GiantNumber";
import { OptimitronLoop } from "@/components/invest/OptimitronLoop";
import { ProgressSpine } from "@/components/invest/ProgressSpine";
import { ShareClassCards } from "@/components/invest/ShareClassCards";
import { StickyRiskSteps, type RiskStep } from "@/components/invest/StickyRiskSteps";
import { WarheadGrid } from "@/components/invest/WarheadGrid";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

const CHAPTERS = [
  { id: "status-quo", label: "The problem" },
  { id: "bad-investment", label: "The mispricing" },
  { id: "president", label: "Your shares" },
  { id: "optimitron", label: "The engine" },
  { id: "claim", label: "Vote" },
];

const RISK_STEPS: RiskStep[] = [
  {
    id: "universal-owners",
    holdingsVariant: "owned",
    kicker: "The universal owners",
    title: "They already own basically everything",
    portfolioCaption: "A slice of every major company",
    portfolioValue: "100%",
    body: (
      <>
        <p>
          The people who quietly own the world&apos;s balance sheet are not
          governments. They&apos;re the giant asset managers and index funds
          that sit behind your retirement account and every major corporate
          board.
        </p>
        <p>
          Fidelity, Vanguard and their peers hold a slice of almost every
          major company. Their fiduciary duty is simple: maximize long-term
          returns for their investors.
        </p>
        <p>
          But in a world where governments overspend on weapons and underspend
          on survival, those portfolios carry three massive, unpriced risks.
        </p>
      </>
    ),
  },
  {
    id: "risk-nuclear",
    holdingsVariant: "zeroed",
    kicker: "Unpriced risk no. 1",
    title: "Nuclear apocalypse",
    portfolioCaption: "No diversification against a dead planet",
    portfolioValue: "$0",
    body: (
      <>
        <p>
          It takes roughly{" "}
          <ParameterValue
            param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
            className="font-black"
          />{" "}
          nuclear weapons to trigger a nuclear winter severe enough to
          collapse civilization. There are{" "}
          <ParameterValue
            param={GLOBAL_WARHEAD_COUNT}
            figures={5}
            className="font-black"
          />
          .
        </p>
        <p>
          In that scenario, every stock, bond and real-estate holding on Earth
          is worth the same amount: zero.
        </p>
        <p>
          Preventing nuclear war is the most basic hedge any rational
          shareholder can buy.
        </p>
      </>
    ),
  },
  {
    id: "risk-disease",
    holdingsVariant: "dragged",
    kicker: "Unpriced risk no. 2",
    title: "Systemic drag from preventable disease",
    portfolioCaption: "Preventable disease taxes every holding",
    portfolioValue: "−GDP",
    body: (
      <>
        <p>
          Disease imposes enormous direct healthcare costs on companies and
          governments, and massive indirect costs through lost productivity.
          For owners of the whole market, every worker pushed out of the labor
          force and every cure that never gets developed is a hit to long-run
          GDP growth — and therefore to their own long-run returns.
        </p>
        <p>
          Radically accelerating cures reduces healthcare burdens, expands the
          effective workforce, and compounds global output for decades. That
          is good business for anyone who owns everything.
        </p>
      </>
    ),
  },
  {
    id: "risk-misallocation",
    holdingsVariant: "shorted",
    kicker: "Unpriced risk no. 3",
    title: "Misallocated trillions",
    portfolioCaption: "Shorting their own future cash flows",
    portfolioValue: "SHORT",
    body: (
      <>
        <p>
          When governments sink tens of trillions into preparing for and waging war
          instead of resilience, research, and human capital, they are
          effectively shorting the future cash flows of the very companies
          whose shares these funds own.
        </p>
        <p className="font-black uppercase">That is a bad investment.</p>
      </>
    ),
  },
];

function SectionHeading({
  id,
  kicker,
  title,
}: {
  id?: string;
  kicker: string;
  title: string;
}) {
  return (
    <ScrollReveal>
      <div id={id} className="scroll-mt-24 space-y-3 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
          {kicker}
        </p>
        <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-foreground sm:text-5xl">
          {title}
        </h2>
      </div>
    </ScrollReveal>
  );
}

export function EosInvestLandingPage() {
  return (
    <div className="bg-background text-foreground">
      <ProgressSpine chapters={CHAPTERS} voteHref="#claim" />

      {/* Chapter 1 — the status quo is insane */}
      <section id="status-quo" className="scroll-mt-24">
        <GiantNumber
          eyebrow="Is your government paying for"
          value={GLOBAL_WARHEAD_COUNT.value}
          format={(n) => Math.round(n).toLocaleString("en-US")}
          caption={
            <>
              nuclear weapons — when it takes about{" "}
              <ParameterValue
                param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
                className="font-black"
              />{" "}
              to trigger a nuclear winter that could collapse civilization?
            </>
          }
          source={GLOBAL_WARHEAD_COUNT}
        />

        <WarheadGrid />

        <GiantNumber
          eyebrow="Meanwhile, your governments spend"
          value={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value}
          format={(n) => `${Math.round(n)}×`}
          caption="more preparing for and waging war than testing medicines for diseases that will actually kill you and everyone you've ever loved."
          source={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
        />

        <GiantNumber
          eyebrow="Over the last century they spent"
          value={CUMULATIVE_MILITARY_SPENDING_FED_ERA.value}
          format={(n) => `$${Math.round(n / 1e12)}T`}
          caption="preparing for and waging war — weapons, armies, and the machinery for burning human beings."
          source={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
        />

        <GiantNumber
          eyebrow="Then they used it to kill"
          value={WAR_DEATHS_SINCE_1900.value}
          format={(n) => Math.round(n).toLocaleString("en-US")}
          caption={
            <>
              of their own employers — the citizens — including{" "}
              <ParameterValue
                param={WAR_CHILDREN_KILLED_SINCE_1900}
                figures={3}
                className="font-black"
              />{" "}
              children who almost certainly didn&apos;t deserve it.
            </>
          }
          source={WAR_DEATHS_SINCE_1900}
        />

        <section className="mx-auto flex min-h-[90svh] max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
          <ScrollReveal>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl md:text-7xl">
              Your planet may be eligible for optimization.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="text-lg font-bold leading-8 sm:text-2xl sm:leading-10">
              We&apos;re Earth Optimization Services. We buy controlling shares
              of the companies that control your government, and we use the
              scientific method and real evidence to calculate optimal public
              policies and budgets that maximize the general welfare.
            </p>
          </ScrollReveal>
          <StepReveal className="w-full space-y-3" staggerDelay={0.2}>
            <p className="border-2 border-foreground px-4 py-3 text-sm font-black uppercase tracking-[0.12em] sm:text-base">
              Maximize median health-adjusted life expectancy
            </p>
            <p className="border-2 border-foreground px-4 py-3 text-sm font-black uppercase tracking-[0.12em] sm:text-base">
              Maximize median after-tax, inflation-adjusted income — for you,
              the citizen
            </p>
          </StepReveal>
        </section>
      </section>

      {/* Chapter 2 — a bad investment for universal shareholders */}
      <section className="border-t-2 border-foreground pt-16 sm:pt-24">
        <SectionHeading
          id="bad-investment"
          kicker="The logical bridge"
          title="A bad investment"
        />
        <StickyRiskSteps steps={RISK_STEPS} />

        <div className="mx-auto max-w-3xl space-y-8 px-4 pb-24 pt-8">
          <ScrollReveal>
            <h3 className="text-2xl font-black uppercase leading-none tracking-tight sm:text-4xl">
              Earth Optimization Services exists to correct that mispricing.
            </h3>
          </ScrollReveal>
          <StepReveal className="space-y-4" staggerDelay={0.2}>
            <p className="border-l-2 border-foreground pl-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
              We create a coordinated fund structure that buys small but
              strategically significant stakes — as little as 0.02% — across
              key companies.
            </p>
            <p className="border-l-2 border-foreground pl-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
              We organize shareholders around a simple thesis: maximizing
              long-term GDP, human health, and civilizational stability
              maximizes long-term returns.
            </p>
            <p className="border-l-2 border-foreground pl-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
              We make the fiduciary case to boards and executives that
              shifting lobbying, capital expenditure, and R&amp;D away from
              civilization-scale risks and toward cures, resilience, and
              safety is in the financial best interest of their largest
              investors.
            </p>
            <p className="border-l-2 border-foreground pl-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
              And we run the Optimitron: a transparent, evidence-based policy
              engine that quantifies which public policies and budgets
              maximize median healthy lifespan and median income — the
              foundations of long-run growth.
            </p>
          </StepReveal>
          <ScrollReveal>
            <p className="text-xl font-black uppercase leading-tight sm:text-3xl">
              This is not charity. It is portfolio optimization at the level
              of the planet.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Chapter 3 — governance and shares */}
      <section className="border-t-2 border-foreground pt-16 sm:pt-24">
        <section
          id="president"
          className="mx-auto flex min-h-[80svh] max-w-3xl scroll-mt-24 flex-col items-center justify-center gap-6 px-4 py-16 text-center"
        >
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
            Leadership
          </p>
          <ScrollReveal>
            <h2 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl md:text-7xl">
              You are the President.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="text-lg font-bold leading-8 sm:text-2xl sm:leading-10">
              Because you are probably very busy, you also have approximately
              eight billion Assistant Presidents — every participating citizen
              on Earth. Everyone who joins steps into governance, not just
              &quot;uses a product.&quot; This is designed to be the largest,
              most participatory company in the history of the human race.
            </p>
          </ScrollReveal>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-4">
          <SectionHeading kicker="Share structure" title="Two classes of shares" />
          <ShareClassCards />
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-24">
          <ScrollReveal>
            <div className="border-2 border-foreground p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
                The downside
              </p>
              <p className="mt-4 text-lg font-bold leading-8 sm:text-xl sm:leading-9">
                If we fail completely — no board seats, no laws changed, not
                one dollar of government spending redirected — Class B
                shareholders simply own a broad basket of major companies,
                similar to an S&amp;P 500 fund. Your worst case is essentially
                market-level returns.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <GiantNumber
          eyebrow="The upside if we pass something like the 1% Treaty"
          value={TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20.value}
          format={(n) => `×${n.toFixed(2)}`}
          caption="Modeled global GDP after 20 years, as a multiple of the current trajectory — from redirecting about 1% of military spending into pragmatic clinical trials and life-extending technologies. Broad market assets, including your Class B shares, ride the same curve."
          source={TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20}
        />

        <GiantNumber
          eyebrow="The upside if governance is fully optimized"
          value={WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20.value}
          format={(n) => `×${Math.round(n)}`}
          caption="Modeled global GDP after 20 years under the most efficient evidence-based policies and budgets our engine can find. Small shifts in how trillions are governed compound into civilization-scale increases in output, stability, and well-being."
          source={WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20}
        />
      </section>

      {/* Chapter 4 — the Optimitron engine */}
      <section className="border-t-2 border-foreground pt-16 sm:pt-24">
        <div className="mx-auto max-w-5xl space-y-10 px-4 pb-24">
          <SectionHeading
            id="optimitron"
            kicker="Outcome-based governance"
            title="The Optimitron"
          />
          <ScrollReveal>
            <p className="mx-auto max-w-3xl text-center text-lg font-bold leading-8 sm:text-2xl sm:leading-10">
              The decision engine at the core of Earth Optimization Services
              does not start from ideology. It starts from results: a century
              of policy and budget experiments, scored by what actually made
              the median citizen live longer and keep more of what they earn.
            </p>
          </ScrollReveal>
          <OptimitronLoop />
        </div>
      </section>

      {/* Finale — claim your Class A share */}
      <section className="border-t-2 border-foreground pt-16 sm:pt-24">
        <div
          id="claim"
          className="mx-auto max-w-3xl scroll-mt-24 space-y-6 px-4 text-center"
        >
          <SectionHeading kicker="Your move" title="Claim your Class A share" />
          <ScrollReveal>
            <p className="text-lg font-bold leading-8 sm:text-xl sm:leading-9">
              Class A shares are not just handed out. They&apos;re earned.
              Your first wish-o-cratic allocation is your proof of intent: a
              concrete choice about how resources should be allocated, made
              before you hold voting power. Set the split, cast your vote, and
              sign up to activate your share.
            </p>
          </ScrollReveal>
        </div>
        <Suspense fallback={null}>
          <TreatyVoteFlow
            authCallbackUrl={ROUTES.dashboard}
            defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
            postVoteBehavior="redirect"
            postVoteRedirectUrl={ROUTES.dashboard}
            respectStoredFlowVariant={false}
            sliderHeadline="YOUR FIRST ACT AS PRESIDENT"
            surface="invest_landing"
          />
        </Suspense>
      </section>
    </div>
  );
}
