"use client";

import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  RotateCcw,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

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
} from "@/lib/right-to-trial-impact";

const SCENARIO_PRESETS = [
  { label: "Skeptical 2×", multiplier: 2 },
  { label: "Paper central 5.48×", multiplier: 5.48 },
  { label: "Optimistic 10×", multiplier: 10 },
] as const;

const buttonClass =
  "rounded-none border-4 border-primary px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]";

const centralImpact = calculateRightToTrialImpact(
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
);

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

function SourceLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      className="inline-flex items-center gap-1 font-black underline decoration-2 underline-offset-4 hover:text-brutal-pink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children} <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function ImpactCard({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Card
      className={`${color} gap-2 rounded-none border-4 border-primary p-5 shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]`}
    >
      <p className="text-4xl font-black leading-none sm:text-5xl">{value}</p>
      <p className="text-sm font-black uppercase sm:text-base">{label}</p>
    </Card>
  );
}

export function RightToTrialImpactExplorer() {
  const [discoveryMultiplier, setDiscoveryMultiplier] = useState(
    RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
  );
  const [trialBudget, setTrialBudget] = useState(
    RIGHT_TO_TRIAL_DEFAULT_TRIAL_BUDGET,
  );

  const impact = calculateRightToTrialImpact(discoveryMultiplier);
  const trialComparison = calculateTrialBudgetComparison(trialBudget);

  return (
    <>
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        className="overflow-hidden py-20 sm:py-24 lg:py-28"
      >
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-5 inline-block rotate-[-1deg] border-4 border-primary bg-brutal-cyan px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:text-base">
                Right to Trial impact
              </p>
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                We can find treatments {Math.round(centralImpact.yearsEarlier)}
                {" "}years sooner.
              </h1>
              <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
                Today, the average disease without an effective treatment waits{" "}
                {Math.round(
                  RIGHT_TO_TRIAL_SOURCE_PARAMETERS.statusQuoAverageWait.value,
                )}{" "}
                years for its first one. Give patients the right to join
                low-cost clinical trials, and the central estimate falls to{" "}
                {centralImpact.averageWaitYears.toFixed(1)} years.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  className={`${buttonClass} bg-brutal-pink`}
                  size="lg"
                >
                  <a href="#turn-the-222-year-wait-into-a-number-we-can-live-with">
                    Try the numbers <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  asChild
                  className={`${buttonClass} bg-brutal-yellow`}
                  size="lg"
                >
                  <a
                    href={RIGHT_TO_TRIAL_IMPACT_PAPER_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Read the impact paper <ExternalLink className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="rotate-2 border-4 border-primary bg-brutal-yellow p-7 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <Zap className="h-16 w-16" strokeWidth={3} />
                <p className="mt-5 text-lg font-black uppercase">
                  Central estimate
                </p>
                <p className="text-7xl font-black uppercase leading-none">
                  {Math.round(centralImpact.yearsEarlier)}
                </p>
                <p className="text-2xl font-black uppercase">years earlier</p>
                <p className="mt-4 text-lg font-bold">
                  The average wait falls from{" "}
                  {Math.round(
                    RIGHT_TO_TRIAL_SOURCE_PARAMETERS.statusQuoAverageWait.value,
                  )}{" "}
                  years to {centralImpact.averageWaitYears.toFixed(1)} years.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer
        id="turn-the-222-year-wait-into-a-number-we-can-live-with"
        bgColor="pink"
        borderPosition="bottom"
        className="scroll-mt-24"
      >
        <Container>
          <div className="mx-auto max-w-5xl text-center">
            <p className="font-black uppercase text-brutal-pink-foreground">
              Change the discovery rate
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter text-brutal-pink-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              See how much sooner treatments reach patients.
            </h2>
          </div>

          <div className="mt-12 border-4 border-primary bg-background p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <label
                  className="text-lg font-black uppercase"
                  htmlFor="discovery-multiplier"
                >
                  Treatment discovery
                </label>
                <p className="mt-1 text-5xl font-black leading-none sm:text-6xl">
                  {impact.multiplier.toFixed(2)}× faster
                </p>
              </div>
              <button
                className="inline-flex w-fit items-center gap-2 border-4 border-primary bg-brutal-cyan px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                onClick={() =>
                  setDiscoveryMultiplier(
                    RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
                  )
                }
                type="button"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={3} /> Reset
              </button>
            </div>

            <input
              aria-describedby="discovery-multiplier-range"
              className="mt-7 h-5 w-full cursor-pointer accent-black"
              id="discovery-multiplier"
              max={RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX}
              min={RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN}
              onChange={(event) =>
                setDiscoveryMultiplier(Number(event.currentTarget.value))
              }
              step="0.01"
              type="range"
              value={discoveryMultiplier}
            />
            <div
              className="mt-2 flex justify-between text-sm font-black uppercase"
              id="discovery-multiplier-range"
            >
              <span>{RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN}×</span>
              <span>{RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX}×</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {SCENARIO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`border-4 border-primary px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
                    Math.abs(discoveryMultiplier - preset.multiplier) < 0.005
                      ? "bg-brutal-pink"
                      : "bg-background"
                  }`}
                  onClick={() => setDiscoveryMultiplier(preset.multiplier)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div
              aria-live="polite"
              className="mt-10 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]"
            >
              <Card className="gap-2 rounded-none border-4 border-primary bg-brutal-yellow p-5 text-center">
                <p className="text-sm font-black uppercase">Today</p>
                <p className="text-6xl font-black leading-none">
                  {Math.round(
                    RIGHT_TO_TRIAL_SOURCE_PARAMETERS.statusQuoAverageWait.value,
                  )}
                </p>
                <p className="text-lg font-black uppercase">years</p>
              </Card>
              <div className="flex items-center justify-center">
                <ArrowRight
                  className="h-14 w-14 rotate-90 md:rotate-0"
                  strokeWidth={3}
                />
              </div>
              <Card className="gap-2 rounded-none border-4 border-primary bg-brutal-cyan p-5 text-center">
                <p className="text-sm font-black uppercase">
                  With Right to Trial
                </p>
                <p className="text-6xl font-black leading-none">
                  {impact.averageWaitYears.toFixed(1)}
                </p>
                <p className="text-lg font-black uppercase">years</p>
              </Card>
            </div>

            <div className="mt-7 border-4 border-primary bg-primary p-5 text-center text-primary-foreground">
              <p className="text-4xl font-black uppercase leading-none sm:text-5xl">
                {impact.yearsEarlier.toFixed(0)} years sooner
              </p>
            </div>
          </div>

          <div aria-live="polite" className="mt-10 grid gap-6 md:grid-cols-3">
            <ImpactCard
              color="bg-brutal-yellow"
              label="Future deaths prevented by faster treatments"
              value={compactNumber(impact.livesSaved, 2)}
            />
            <ImpactCard
              color="bg-brutal-cyan"
              label="Years of healthy life saved"
              value={compactNumber(impact.dalysAverted, 0)}
            />
            <ImpactCard
              color="bg-background"
              label="Cost to save one healthy year"
              value={`$${impact.costPerDaly.toFixed(6)}`}
            />
          </div>

          <p className="mx-auto mt-6 max-w-4xl text-center font-bold text-brutal-pink-foreground">
            The cards above track your slider setting. At the paper&apos;s
            central {RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT}×, the
            10,000-draw Monte Carlo puts the 90% range at{" "}
            {compactNumber(
              RIGHT_TO_TRIAL_CANONICAL_RESULTS.livesSaved
                .confidenceInterval?.[0] ?? 0,
              1,
            )}
            –
            {compactNumber(
              RIGHT_TO_TRIAL_CANONICAL_RESULTS.livesSaved
                .confidenceInterval?.[1] ?? 0,
              1,
            )}{" "}
            future deaths prevented and $
            {(
              RIGHT_TO_TRIAL_CANONICAL_RESULTS.costPerDaly
                .confidenceInterval?.[0] ?? 0
            ).toFixed(6)}
            –$
            {(
              RIGHT_TO_TRIAL_CANONICAL_RESULTS.costPerDaly
                .confidenceInterval?.[1] ?? 0
            ).toFixed(6)}{" "}
            per healthy year.
          </p>

          <details className="mt-8 border-4 border-primary bg-background p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <summary className="cursor-pointer text-xl font-black uppercase">
              How we calculated it
            </summary>
            <div className="mt-5 space-y-4 font-bold">
              <p>
                Faster discovery moves every future treatment closer. The model
                applies those earlier treatments to the share of disease deaths
                and lost healthy years that medical progress can prevent.
              </p>
              <p>
                The estimated launch cost is{" "}
                {money(RIGHT_TO_TRIAL_SOURCE_PARAMETERS.launchCost.value)}: $15
                million to bring Right to Trial to all 50 states plus $50
                million to operate the shared treatment registry for a decade.
              </p>
              <p>
                The death and healthy-life totals include future generations.
                They measure the lasting benefit of finding treatments sooner,
                not only the people alive today.
              </p>
              <p>
                At this setting, the model moves the discovery rate from{" "}
                {RIGHT_TO_TRIAL_SOURCE_PARAMETERS.firstTreatmentsPerYear.value.toFixed(
                  0,
                )}{" "}
                to {impact.firstTreatmentsPerYear.toFixed(1)} first treatments
                per year and clears today&apos;s untreated-disease queue in{" "}
                {impact.queueYears.toFixed(1)} years.
              </p>
              <p>
                The arithmetic, in one line: 2.88 billion healthy years are
                lost to disease every year, medicine can eventually prevent
                92.6% of that, and the central scenario delivers treatments
                181 years sooner — 2.88B × 92.6% × 181 ≈ 483 billion healthy
                years. Deaths follow the same chain from 150,000 disease
                deaths per day.
              </p>
              <SourceLink href={RIGHT_TO_TRIAL_CALCULATIONS_URL}>
                Open every parameter, formula, and citation
              </SourceLink>
              <p className="text-sm">
                Peer-archived versions:{" "}
                {RIGHT_TO_TRIAL_DOIS.map((doi, index) => (
                  <span key={doi.url}>
                    {index > 0 ? " · " : ""}
                    <a
                      className="underline underline-offset-4"
                      href={doi.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {doi.label}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          </details>

          <details className="mt-5 border-4 border-primary bg-background p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <summary className="cursor-pointer text-xl font-black uppercase">
              Read this before quoting the numbers
            </summary>
            <div className="mt-5 space-y-4 font-bold">
              <p>
                The death total can exceed today&apos;s world population
                because it sums premature deaths prevented across roughly 181
                years of future generations, not people alive right now.
              </p>
              <p>
                The {RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT}× multiplier
                is an assumption calibrated to move discovery from 15 to 82.2
                first treatments per year — not an observed effect. That is
                why the slider exists: set it where your own skepticism
                lands.
              </p>
              <p>
                Every result is conditional on 50-state adoption producing the
                modeled discovery shift. Multiply the headline by your own
                probability that it does. Even the skeptical preset — 2×
                discovery — prevents{" "}
                {compactNumber(calculateRightToTrialImpact(2).livesSaved, 1)}{" "}
                future deaths, so the case does not depend on the central
                estimate being right.
              </p>
              <p>
                At the central estimate, preventing one premature death costs
                about $
                {RIGHT_TO_TRIAL_CANONICAL_RESULTS.costPerLifeSaved.value.toFixed(
                  4,
                )}{" "}
                of launch spending — roughly{" "}
                {compactNumber(
                  RIGHT_TO_TRIAL_CANONICAL_RESULTS.vsGiveWellPerLife.value,
                  0,
                )}
                × less than the ~$4,500 a GiveWell top charity spends per life
                saved. The cost scopes differ: our numerator is only the $65
                million campaign and registry, with patients and payers funding
                the treatments themselves, while GiveWell&apos;s figure covers
                full program costs. Quote it as leverage, not a like-for-like
                charity comparison — and apply the same probability discount as
                everything else here.
              </p>
            </div>
          </details>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom">
        <Container>
          <div className="mx-auto max-w-5xl text-center">
            <Users className="mx-auto h-14 w-14" strokeWidth={3} />
            <h2 className="mt-4 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Give more patients a place in the trial.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
              Traditional trials spend about $41,000 per participant (range
              $20,000–$120,000). Pragmatic trials can collect useful results
              for $929 per participant (range $97–$3,000). Move the budget and
              see how many people those same dollars can include.
            </p>
          </div>

          <div className="mt-12 border-4 border-primary bg-background p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <label
              className="text-lg font-black uppercase"
              htmlFor="trial-budget"
            >
              Trial budget: {money(trialBudget)}
            </label>
            <input
              aria-describedby="trial-budget-range"
              className="mt-5 h-5 w-full cursor-pointer accent-black"
              id="trial-budget"
              max="10000000"
              min="100000"
              onChange={(event) =>
                setTrialBudget(Number(event.currentTarget.value))
              }
              step="100000"
              type="range"
              value={trialBudget}
            />
            <div
              className="mt-2 flex justify-between text-sm font-black uppercase"
              id="trial-budget-range"
            >
              <span>$100K</span>
              <span>$10M</span>
            </div>

            <div aria-live="polite" className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="gap-3 rounded-none border-4 border-primary bg-background p-6">
                <p className="font-black uppercase">Conventional trial</p>
                <p className="text-6xl font-black leading-none">
                  {trialComparison.conventionalParticipants.toLocaleString(
                    "en-US",
                  )}
                </p>
                <p className="text-xl font-black uppercase">participants</p>
                <p className="font-bold">
                  {money(
                    RIGHT_TO_TRIAL_SOURCE_PARAMETERS.traditionalCostPerPatient
                      .value,
                  )}{" "}
                  per participant
                </p>
              </Card>
              <Card className="gap-3 rounded-none border-4 border-primary bg-brutal-cyan p-6 shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black uppercase">Pragmatic trial</p>
                <p className="text-6xl font-black leading-none">
                  {trialComparison.pragmaticParticipants.toLocaleString(
                    "en-US",
                  )}
                </p>
                <p className="text-xl font-black uppercase">participants</p>
                <p className="font-bold">
                  {money(
                    RIGHT_TO_TRIAL_SOURCE_PARAMETERS.pragmaticCostPerPatient
                      .value,
                  )}{" "}
                  per participant
                </p>
              </Card>
            </div>

            <p className="mt-7 text-center text-3xl font-black uppercase sm:text-4xl">
              {trialComparison.costReductionMultiplier.toFixed(1)}× lower cost
              per participant
            </p>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom">
        <Container>
          <div className="mx-auto max-w-5xl border-4 border-primary bg-brutal-pink p-7 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:p-10">
            <BookOpen className="mx-auto h-14 w-14" strokeWidth={3} />
            <h2 className="mt-4 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl">
              Help your state find treatments faster.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
              Tell us where you live and why this matters. We will use every
              response to show patients, clinicians, and state leaders how many
              lives faster trials can change.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                className={`${buttonClass} bg-brutal-yellow`}
                size="lg"
              >
                <Link href="/#state-support">
                  Bring Right to Trial to my state{" "}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                className={`${buttonClass} bg-background`}
                size="lg"
              >
                <a
                  href={RIGHT_TO_TRIAL_IMPACT_PAPER_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Read the impact paper <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </SectionContainer>
    </>
  );
}
