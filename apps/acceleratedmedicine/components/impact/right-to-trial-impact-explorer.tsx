"use client";

import { ArrowRight, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";

import { SectionHeading } from "@/components/section-heading";
import {
  calculateRightToTrialImpact,
  calculateTrialBudgetComparison,
  RIGHT_TO_TRIAL_CALCULATIONS_URL,
  RIGHT_TO_TRIAL_CANONICAL_RESULTS,
  RIGHT_TO_TRIAL_DEFAULT_TRIAL_BUDGET,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN,
  RIGHT_TO_TRIAL_DOIS,
  RIGHT_TO_TRIAL_IMPACT_PAPER_URL,
  RIGHT_TO_TRIAL_SOURCE_PARAMETERS,
  OFF_PATENT_ECONOMICS_URL,
  PHASE_1_PASSED_COMPOUNDS,
} from "@/lib/right-to-trial-impact";

// The act's own model: the manual's "Universal Right to Try with Evidence: Potential Impact of
// Adoption in All 50 States" (rtt-impact.acceleratedmedicine.org). The deck's backup slide B2 uses
// the same figures.
const SCENARIO_PRESETS = [
  { label: "Skeptical 2×", multiplier: 2 },
  { label: "Paper central 5.48×", multiplier: 5.48 },
  { label: "Optimistic 10×", multiplier: 10 },
] as const;

const card = "rounded-lg border bg-card p-6 shadow-sm";
const bigNumber = "text-4xl font-bold tracking-tight text-primary tabular-nums sm:text-5xl";
const textLink = "font-medium text-primary hover:underline";

const centralImpact = calculateRightToTrialImpact(RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT);
const statusQuoWait = Math.round(RIGHT_TO_TRIAL_SOURCE_PARAMETERS.statusQuoAverageWait.value);

function compactNumber(value: number, maximumFractionDigits = 1): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(maximumFractionDigits)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(maximumFractionDigits)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(maximumFractionDigits)}K`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits });
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="rounded-lg border bg-card p-5 shadow-sm">
      <summary className="cursor-pointer font-semibold">{summary}</summary>
      <div className="mt-4 space-y-4 text-muted-foreground">{children}</div>
    </details>
  );
}

export function RightToTrialImpactExplorer() {
  const [discoveryMultiplier, setDiscoveryMultiplier] = useState(RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT);
  const [trialBudget, setTrialBudget] = useState(RIGHT_TO_TRIAL_DEFAULT_TRIAL_BUDGET);

  const impact = calculateRightToTrialImpact(discoveryMultiplier);
  const trialComparison = calculateTrialBudgetComparison(trialBudget);
  const [livesLow, livesHigh] = RIGHT_TO_TRIAL_CANONICAL_RESULTS.livesSaved.confidenceInterval ?? [0, 0];
  const [costLow, costHigh] = RIGHT_TO_TRIAL_CANONICAL_RESULTS.costPerDaly.confidenceInterval ?? [0, 0];
  const [compoundsLow, compoundsHigh] = PHASE_1_PASSED_COMPOUNDS.confidenceInterval ?? [0, 0];

  return (
    <>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Model estimate</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Treatments could arrive {Math.round(centralImpact.yearsEarlier)} years sooner
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Today, the average disease without an effective treatment waits {statusQuoWait} years for its first one.
          If every state adopted the Care-Integrated Clinical Trials Act, the model&apos;s central estimate falls to{" "}
          {centralImpact.averageWaitYears.toFixed(1)} years.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="#explore">Try the numbers <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={RIGHT_TO_TRIAL_IMPACT_PAPER_URL} rel="noreferrer" target="_blank">
              Read the impact paper <ExternalLink aria-hidden="true" className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <section id="explore" aria-labelledby="explore-heading" className="band-muted scroll-mt-24 py-12 md:py-20">
        <SectionHeading id="explore-heading" title="See how much sooner treatments reach patients">
          The model&apos;s key assumption is how much faster treatments are discovered. Set it where your own
          skepticism lands.
        </SectionHeading>

        <div className={`mx-auto mt-8 max-w-4xl ${card} sm:p-8`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <label className="font-semibold" htmlFor="discovery-multiplier">Treatment discovery</label>
              <p className={`mt-1 ${bigNumber}`}>{impact.multiplier.toFixed(2)}× faster</p>
            </div>
            <Button variant="outline" size="sm" className="w-fit" type="button"
              onClick={() => setDiscoveryMultiplier(RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT)}>
              <RotateCcw aria-hidden="true" className="mr-1 h-4 w-4" /> Reset
            </Button>
          </div>

          <input
            aria-describedby="discovery-multiplier-range"
            className="mt-6 h-2 w-full cursor-pointer accent-primary"
            id="discovery-multiplier"
            max={RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX}
            min={RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN}
            onChange={event => setDiscoveryMultiplier(Number(event.currentTarget.value))}
            step="0.01"
            type="range"
            value={discoveryMultiplier}
          />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground" id="discovery-multiplier-range">
            <span>{RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN}×</span>
            <span>{RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX}×</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {SCENARIO_PRESETS.map(preset => {
              const isActive = Math.abs(discoveryMultiplier - preset.multiplier) < 0.005;
              return (
                <button key={preset.label} aria-pressed={isActive} type="button"
                  onClick={() => setDiscoveryMultiplier(preset.multiplier)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    isActive ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary hover:text-primary"
                  }`}>
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div aria-live="polite" className="mt-8 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-lg border bg-muted/50 p-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <p className="mt-1 text-5xl font-bold tracking-tight tabular-nums">{statusQuoWait}</p>
              <p className="text-muted-foreground">years</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight aria-hidden="true" className="h-8 w-8 rotate-90 text-muted-foreground md:rotate-0" />
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">With the act</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-primary tabular-nums">{impact.averageWaitYears.toFixed(1)}</p>
              <p className="text-muted-foreground">years</p>
            </div>
          </div>

          <p className="mt-6 rounded-lg bg-primary p-4 text-center text-2xl font-bold text-primary-foreground sm:text-3xl">
            {impact.yearsEarlier.toFixed(0)} years sooner
          </p>
        </div>

        <ul aria-live="polite" className="mx-auto mt-6 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { label: "Future deaths prevented by faster treatments", value: compactNumber(impact.livesSaved, 2) },
            { label: "Years of healthy life saved", value: compactNumber(impact.dalysAverted, 0) },
            { label: "Launch cost to save one healthy year", value: `$${impact.costPerDaly.toFixed(6)}` },
          ].map(stat => (
            <li key={stat.label} className={card}>
              <p className="text-3xl font-bold tracking-tight text-primary tabular-nums lg:text-4xl">{stat.value}</p>
              <p className="mt-2 text-muted-foreground">{stat.label}</p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-6 max-w-4xl text-sm text-muted-foreground">
          The cards above track your slider setting. At the paper&apos;s central {RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT}×,
          the 10,000-draw Monte Carlo puts the 90% range at {compactNumber(livesLow, 1)}–{compactNumber(livesHigh, 1)} future
          deaths prevented and ${costLow.toFixed(6)}–${costHigh.toFixed(6)} per healthy year.
        </p>

        <div className="mx-auto mt-8 max-w-4xl space-y-4">
          <Details summary="How we calculated it">
            <p>
              Faster discovery moves every future treatment closer. The model applies those earlier treatments to
              the share of disease deaths and lost healthy years that medical progress can prevent.
            </p>
            <p>
              The estimated launch cost is {money(RIGHT_TO_TRIAL_SOURCE_PARAMETERS.launchCost.value)}: $15 million to
              bring the act to all 50 states plus $50 million to operate the shared treatment registry for a decade.
            </p>
            <p>
              The death and healthy-life totals include future generations. They measure the lasting benefit of
              finding treatments sooner, not only the people alive today.
            </p>
            <p>
              At this setting, the model moves the discovery rate from{" "}
              {RIGHT_TO_TRIAL_SOURCE_PARAMETERS.firstTreatmentsPerYear.value.toFixed(0)} to{" "}
              {impact.firstTreatmentsPerYear.toFixed(1)} first treatments per year and clears today&apos;s
              untreated-disease queue in {impact.queueYears.toFixed(1)} years.
            </p>
            <p>
              The arithmetic, in one line: 2.88 billion healthy years are lost to disease every year, medicine can
              eventually prevent 92.6% of that, and the central scenario delivers treatments 181 years sooner:
              2.88B × 92.6% × 181 ≈ 483 billion healthy years. Deaths follow the same chain from 150,000 disease deaths
              per day.
            </p>
            <p>
              <a className={textLink} href={RIGHT_TO_TRIAL_CALCULATIONS_URL} rel="noreferrer" target="_blank">
                Open every parameter, formula, and citation
              </a>
            </p>
            <p className="text-sm">
              Peer-archived versions:{" "}
              {RIGHT_TO_TRIAL_DOIS.map((doi, index) => (
                <span key={doi.url}>
                  {index > 0 ? " · " : ""}
                  <a className={textLink} href={doi.url} rel="noreferrer" target="_blank">{doi.label}</a>
                </span>
              ))}
            </p>
          </Details>

          <Details summary="Read this before quoting the numbers">
            <p>
              The death total can exceed today&apos;s world population because it sums premature deaths prevented
              across roughly 181 years of future generations, not people alive right now.
            </p>
            <p>
              The {RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT}× multiplier is an assumption calibrated to move discovery
              from 15 to 82.2 first treatments per year, not an observed effect. That is why the slider exists.
            </p>
            <p>
              Every result is conditional on 50-state adoption producing the modeled discovery shift. Multiply the
              headline by your own probability that it does. Even the skeptical preset, 2× discovery, prevents{" "}
              {compactNumber(calculateRightToTrialImpact(2).livesSaved, 1)} future deaths, so the case does not depend
              on the central estimate being right.
            </p>
            <p>
              At the central estimate, preventing one premature death costs about $
              {RIGHT_TO_TRIAL_CANONICAL_RESULTS.costPerLifeSaved.value.toFixed(4)} of launch spending, roughly{" "}
              {compactNumber(RIGHT_TO_TRIAL_CANONICAL_RESULTS.vsGiveWellPerLife.value, 0)}× less than the ~$4,500 a
              GiveWell top charity spends per life saved. The cost scopes differ: our numerator is only the $65
              million campaign and registry, with patients and payers funding the treatments themselves, while
              GiveWell&apos;s figure covers full program costs. Quote it as leverage, not a like-for-like charity
              comparison, and apply the same probability discount as everything else here.
            </p>
          </Details>

          <Details summary="What the model leaves out (all of it upside)">
            <p>
              {compoundsLow.toLocaleString("en-US")}–{compoundsHigh.toLocaleString("en-US")} investigational compounds
              have already passed Phase I safety testing, the same bar Montana&apos;s law uses. Many are off-patent or
              unpatentable, so at $41,000 per trial participant{" "}
              <a className={textLink} href={OFF_PATENT_ECONOMICS_URL} rel="noreferrer" target="_blank">
                no company can ever recoup the cost of testing them
              </a>
              . At $929, testing them becomes viable. The model counts nothing for unlocking this pool.
            </p>
            <p>
              Every cheap off-patent treatment validated against a condition competes with the patented drugs
              treating it. The model counts zero price effects for patients or payers.
            </p>
            <p>
              Compounds that slow aging itself would cut costs across every age-related disease at once. The model
              treats aging research like any other disease and counts none of those offsets.
            </p>
          </Details>
        </div>
      </section>

      <section aria-labelledby="budget-heading" className="py-12 md:py-20">
        <SectionHeading id="budget-heading" title="Give more patients a place in a trial">
          Traditional trials spend about $41,000 per participant (range $20,000–$120,000). Pragmatic trials can
          collect useful results for $929 per participant (range $97–$3,000). Move the budget and see how many people
          those same dollars can include.
        </SectionHeading>

        <div className={`mx-auto mt-8 max-w-4xl ${card} sm:p-8`}>
          <label className="font-semibold" htmlFor="trial-budget">Trial budget: {money(trialBudget)}</label>
          <input
            aria-describedby="trial-budget-range"
            className="mt-5 h-2 w-full cursor-pointer accent-primary"
            id="trial-budget"
            max="10000000"
            min="100000"
            onChange={event => setTrialBudget(Number(event.currentTarget.value))}
            step="100000"
            type="range"
            value={trialBudget}
          />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground" id="trial-budget-range">
            <span>$100K</span>
            <span>$10M</span>
          </div>

          <div aria-live="polite" className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/50 p-6">
              <p className="font-medium text-muted-foreground">Conventional trial</p>
              <p className="mt-1 text-5xl font-bold tracking-tight tabular-nums">
                {trialComparison.conventionalParticipants.toLocaleString("en-US")}
              </p>
              <p className="text-muted-foreground">participants</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {money(RIGHT_TO_TRIAL_SOURCE_PARAMETERS.traditionalCostPerPatient.value)} per participant
              </p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-6">
              <p className="font-medium text-muted-foreground">Pragmatic trial</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-primary tabular-nums">
                {trialComparison.pragmaticParticipants.toLocaleString("en-US")}
              </p>
              <p className="text-muted-foreground">participants</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {money(RIGHT_TO_TRIAL_SOURCE_PARAMETERS.pragmaticCostPerPatient.value)} per participant
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-2xl font-bold sm:text-3xl">
            {trialComparison.costReductionMultiplier.toFixed(1)}× lower cost per participant
          </p>
        </div>
      </section>

      <section aria-labelledby="state-heading" className="border-t py-12 md:py-16">
        <SectionHeading id="state-heading" title="What it would mean in your state">
          See how many people in your state live with conditions that better treatments could help, and what the act
          would change there.
        </SectionHeading>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/states">Find your state <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={RIGHT_TO_TRIAL_IMPACT_PAPER_URL} rel="noreferrer" target="_blank">
              Read the impact paper <ExternalLink aria-hidden="true" className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
