"use client";

import { useState } from "react";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import { LatexBlock } from "@optimitron/neobrutalist-ui/ui/latex";
import { ImpactExplainer } from "../shared/ImpactExplainer";
import { TimelineScrolly } from "./timeline-scrolly";
import {
  SAFE_COMPOUNDS_COUNT,
  DRUG_DISEASE_COMBINATIONS_POSSIBLE,
  TESTED_RELATIONSHIPS_ESTIMATE,
  EXPLORATION_RATIO,
  UNEXPLORED_RATIO,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_COST_REDUCTION_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  COMBINATION_THERAPY_DISEASE_SPACE,
  EMERGING_MODALITY_COMBINATIONS,
  VALLEY_OF_DEATH_ATTRITION_PCT,
  DRUG_REPURPOSING_SUCCESS_RATE,
  STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  PHARMA_SUCCESS_RATE_CURRENT_PCT,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
  DFDA_TRIALS_PER_YEAR_CAPACITY,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters";
import {
  formatParameter,
  getParameterValue,
} from "@optimitron/data/parameters/compact-format";
import { ParameterValue } from "../shared/ParameterValue";

interface BottleneckProofSectionProps {
  scenario?: "treaty" | "medical-freedom";
}

export function BottleneckProofSection({
  scenario = "treaty",
}: BottleneckProofSectionProps) {
  // User age state for personalized timeline (default to 30)
  const [userAge, setUserAge] = useState<number | null>(30);

  // Format values for display
  const safeCompounds = formatParameter(SAFE_COMPOUNDS_COUNT);
  const safeCompoundsRaw = getParameterValue(SAFE_COMPOUNDS_COUNT, "round");
  const possibleCombinations = formatParameter(
    DRUG_DISEASE_COMBINATIONS_POSSIBLE,
  );
  const testedRelationships = formatParameter(TESTED_RELATIONSHIPS_ESTIMATE);
  const explorationPct = (EXPLORATION_RATIO.value * 100).toFixed(2);
  const unexploredPct = (UNEXPLORED_RATIO.value * 100).toFixed(1);
  const capacityMultiplier = getParameterValue(
    DFDA_TRIAL_CAPACITY_MULTIPLIER,
    "round",
  );
  const costReductionFactor = getParameterValue(
    DFDA_TRIAL_COST_REDUCTION_FACTOR,
    "round",
  );
  const queueYears = getParameterValue(
    STATUS_QUO_QUEUE_CLEARANCE_YEARS,
    "round",
  );
  const dfdaQueueYears = getParameterValue(DFDA_QUEUE_CLEARANCE_YEARS, "round");
  const diseasesUntreated = getParameterValue(
    DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
    "round",
  );
  const newTreatmentsPerYear = getParameterValue(
    NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
    "round",
  );
  const valleyOfDeathPct = (VALLEY_OF_DEATH_ATTRITION_PCT.value * 100).toFixed(
    0,
  );
  const repurposingSuccessRate = (
    DRUG_REPURPOSING_SUCCESS_RATE.value * 100
  ).toFixed(0);
  const avgYearsToFirstTreatment = getParameterValue(
    STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
    "round",
  );
  const pharmaSuccessRate = formatParameter(PHARMA_SUCCESS_RATE_CURRENT_PCT);
  const combinationSpaceFormatted = formatParameter(
    COMBINATION_THERAPY_DISEASE_SPACE,
  );
  const treatyFundingBillions = TREATY_ANNUAL_FUNDING.value / 1_000_000_000;
  const referenceTrials = getParameterValue(
    DFDA_TRIALS_PER_YEAR_CAPACITY,
    "round",
  );
  const referenceTreatments = getParameterValue(
    DFDA_FIRST_TREATMENTS_PER_YEAR,
    "round",
  );
  const referenceQueueYears = getParameterValue(
    DFDA_QUEUE_CLEARANCE_YEARS,
    "round",
  );

  return (
    <SectionContainer
      id="bottleneck-proof"
      bgColor="background"
      borderPosition="bottom"
      padding="lg"
    >
      <Container>
        <div className="flex flex-col items-center gap-3 mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center">
            Why The Bottleneck Is{" "}
            <span className="text-brutal-pink">Clinical Trials</span>, Not Basic
            Science
          </h2>
          {scenario === "treaty" && (
            <ImpactExplainer
              className="h-9 w-9 border-primary text-primary bg-background"
              label="Show bottleneck math"
            />
          )}
        </div>

        {/* The Unexplored Frontier */}
        <Card className="bg-brutal-cyan border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <h3 className="text-2xl font-black uppercase text-center mb-6">
            The Vast Unexplored Therapeutic Frontier
          </h3>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-background border-4 border-primary p-6 text-center">
              <div className="text-4xl font-black text-brutal-pink mb-2">
                <ParameterValue
                  param={SAFE_COMPOUNDS_COUNT}
                  format={
                    scenario === "medical-freedom"
                      ? { precision: 1 }
                      : undefined
                  }
                />
              </div>
              <div className="text-sm font-black uppercase mb-2">
                Known Safe Compounds
              </div>
              <div className="text-xs text-foreground/70">
                FDA-approved drugs + GRAS substances already proven safe in
                humans
              </div>
            </div>
            <div className="bg-background border-4 border-primary p-6 text-center">
              <div className="text-4xl font-black text-brutal-pink mb-2">
                <ParameterValue
                  param={DRUG_DISEASE_COMBINATIONS_POSSIBLE}
                  format={
                    scenario === "medical-freedom"
                      ? { precision: 1 }
                      : undefined
                  }
                />
              </div>
              <div className="text-sm font-black uppercase mb-2">
                Possible Combinations
              </div>
              <div className="text-xs text-foreground/70">
                {safeCompoundsRaw} compounds × ~1,000 diseases
              </div>
            </div>
            <div className="bg-background border-4 border-primary p-6 text-center">
              <div className="text-4xl font-black text-brutal-pink mb-2">
                <ParameterValue
                  param={TESTED_RELATIONSHIPS_ESTIMATE}
                  format={
                    scenario === "medical-freedom"
                      ? { precision: 1 }
                      : undefined
                  }
                />
              </div>
              <div className="text-sm font-black uppercase mb-2">
                Actually Tested
              </div>
              <div className="text-xs text-foreground/70">
                Approved uses + repurposed + failed trials
              </div>
            </div>
          </div>

          {/* The Math */}
          <div className="bg-brutal-yellow border-4 border-primary p-6 text-center mb-6">
            <div className="text-5xl md:text-6xl font-black mb-2">
              {unexploredPct}%
            </div>
            <div className="text-xl font-black uppercase">
              OF DRUG-DISEASE COMBINATIONS NEVER TESTED
            </div>
            <div className="mt-4 text-sm font-bold">
              Only {explorationPct}% of the therapeutic frontier has been
              explored. The treatments may already exist among known-safe
              compounds - we just haven't tested them.
            </div>
          </div>

          <div className="bg-background border-4 border-primary p-4">
            <LatexBlock className="text-center">
              {`\\text{Exploration Ratio} = \\frac{\\text{${testedRelationships} tested}}{\\text{${possibleCombinations} possible}} = ${explorationPct}\\%`}
            </LatexBlock>
          </div>

          {/* Visual Progress Bar - The Most Impactful Visualization */}
          <div className="bg-background border-4 border-primary p-6 mt-6">
            <div className="text-center mb-4">
              <div className="text-lg font-black uppercase">
                Therapeutic Frontier Explored
              </div>
            </div>

            {/* The bar - 0.34% filled */}
            <div className="relative h-12 bg-background border-4 border-primary overflow-hidden">
              {/* Explored portion - so small it's barely visible */}
              <div
                className="absolute left-0 top-0 h-full bg-brutal-cyan border-r-4 border-primary"
                style={{ width: `${EXPLORATION_RATIO.value * 100}%` }}
              />
              {/* Make the tiny sliver visible with a marker */}
              <div
                className="absolute top-0 h-full w-1 bg-brutal-pink animate-pulse"
                style={{ left: `${EXPLORATION_RATIO.value * 100}%` }}
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs font-bold">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-brutal-cyan border-4 border-primary" />
                <span>TESTED ({explorationPct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-background border-4 border-primary" />
                <span>UNEXPLORED ({unexploredPct}%)</span>
              </div>
            </div>

            {/* Punchline */}
            <div className="mt-4 text-center">
              <p className="text-sm font-black text-brutal-pink">
                That tiny line on the left? That's ALL of modern medicine.
              </p>
              <p className="text-xs text-foreground/70 mt-1">
                You cannot have "diminishing returns" when you haven't even
                started.
              </p>
            </div>
          </div>

          {/* The Full Picture - Expandable */}
          <details className="bg-background border-4 border-primary p-4 mt-6">
            <summary className="font-bold cursor-pointer text-lg">
              Wait, it gets worse: The FULL therapeutic frontier
            </summary>
            <div className="mt-4 space-y-4">
              <p className="font-bold">
                The {possibleCombinations} figure above only counts{" "}
                <em>single drugs</em> against diseases. Modern medicine
                increasingly uses <em>combination therapies</em> (standard in
                oncology, HIV, cardiology).
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-background border-4 border-primary p-4 text-center">
                  <div className="text-2xl font-black text-brutal-pink mb-1">
                    <ParameterValue
                      param={DRUG_DISEASE_COMBINATIONS_POSSIBLE}
                    />
                  </div>
                  <div className="text-xs font-black uppercase">
                    Single Drugs × Diseases
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    What we showed above
                  </div>
                </div>
                <div className="bg-background border-4 border-primary p-4 text-center">
                  <div className="text-2xl font-black text-brutal-pink mb-1">
                    <ParameterValue param={COMBINATION_THERAPY_DISEASE_SPACE} />
                  </div>
                  <div className="text-xs font-black uppercase">
                    Drug Pairs × Diseases
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    Combination therapy space
                  </div>
                </div>
                <div className="bg-background border-4 border-primary p-4 text-center">
                  <div className="text-2xl font-black text-brutal-pink mb-1">
                    <ParameterValue param={EMERGING_MODALITY_COMBINATIONS} />
                  </div>
                  <div className="text-xs font-black uppercase">
                    Emerging Modalities
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    Gene therapy, mRNA, cell therapy
                  </div>
                </div>
              </div>

              <div className="bg-brutal-yellow border-4 border-primary p-4 text-center">
                <div className="text-3xl font-black mb-2">
                  <ParameterValue param={COMBINATION_THERAPY_DISEASE_SPACE} />
                </div>
                <div className="text-sm font-black uppercase">
                  Total Therapeutic Frontier
                </div>
                <div className="text-xs mt-2">
                  That's{" "}
                  <span className="font-black">
                    {combinationSpaceFormatted}
                  </span>{" "}
                  combinations we could test. We've tested about{" "}
                  {testedRelationships}. Do the math on "diminishing returns."
                </div>
              </div>

              <p className="text-sm text-foreground/70 italic">
                Note: We use the conservative {possibleCombinations} figure in
                our main calculations because single-drug trials are more
                straightforward. But the combination therapy space shows the
                true scale of unexplored medicine.
              </p>
            </div>
          </details>
        </Card>

        {/* The Treatment Gap */}
        <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <h3 className="text-2xl font-black uppercase text-center mb-6">
            Years to Universal Treatment Coverage
          </h3>

          {/* Key stat callout */}
          <div className="bg-brutal-yellow border-4 border-primary p-6 mb-8 text-center">
            <div className="text-lg font-black uppercase mb-2">
              The Core Problem
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-3xl font-black text-brutal-pink">
                  {diseasesUntreated.toLocaleString()}
                </div>
                <div className="text-sm font-bold">
                  Diseases Without Effective Treatment
                </div>
              </div>
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-3xl font-black text-brutal-pink">
                  ~{newTreatmentsPerYear}
                </div>
                <div className="text-sm font-bold">
                  First Treatments Discovered Per Year
                </div>
                <div className="text-xs mt-1">
                  At current clinical trial capacity
                </div>
              </div>
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-3xl font-black text-brutal-pink">
                  {queueYears}
                </div>
                <div className="text-sm font-bold">
                  Years to Cover All Diseases
                </div>
                <div className="text-xs mt-1">
                  {diseasesUntreated.toLocaleString()} ÷ {newTreatmentsPerYear}
                  /yr
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-lg font-black uppercase mb-4">
                Status Quo
              </div>
              <p className="font-bold mb-4">
                Clinical trials are how we discover which treatments work for
                which diseases. At current trial capacity, we find first
                effective treatments for only{" "}
                <span className="text-brutal-pink font-black">
                  ~{newTreatmentsPerYear} diseases per year
                </span>
                .
              </p>
              <div className="bg-brutal-pink border-4 border-primary p-4 mb-3">
                <div className="text-3xl font-black mb-2">
                  {queueYears} Years
                </div>
                <div className="text-sm font-bold">
                  To find treatments for all{" "}
                  {diseasesUntreated.toLocaleString()} diseases
                </div>
                <div className="text-xs text-foreground/70 mt-1">
                  That's longer than recorded human history
                </div>
              </div>
              <div className="bg-brutal-yellow border-4 border-primary p-4">
                <div className="text-2xl font-black mb-1">
                  {avgYearsToFirstTreatment} Years
                </div>
                <div className="text-sm font-bold">
                  Average wait for any single disease
                </div>
                <div className="text-xs text-foreground/70 mt-1">
                  If you have an untreated disease, you'll likely wait ~
                  {avgYearsToFirstTreatment} years for a first effective
                  treatment
                </div>
              </div>
            </div>

            {scenario === "medical-freedom" ? (
              <div>
                <div className="text-lg font-black uppercase mb-4">
                  Reference Pragmatic-Trial Capacity
                </div>
                <p className="font-bold mb-4">
                  Reference funding supports{" "}
                  <ParameterValue
                    param={DFDA_TRIALS_PER_YEAR_CAPACITY}
                    format={{ precision: 1 }}
                    className="text-brutal-cyan font-black"
                  />{" "}
                  pragmatic trials per year and{" "}
                  <ParameterValue
                    param={DFDA_FIRST_TREATMENTS_PER_YEAR}
                    className="text-brutal-cyan font-black"
                  />{" "}
                  first treatments per year.
                </p>
                <div className="bg-brutal-cyan border-4 border-primary p-4">
                  <div className="text-3xl font-black mb-2">
                    <ParameterValue
                      param={DFDA_QUEUE_CLEARANCE_YEARS}
                      format={{ precision: 1 }}
                    />{" "}
                    Years
                  </div>
                  <div className="text-sm font-bold">
                    Time to cover the untreated-disease queue
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    {referenceTrials.toLocaleString()} trials produce{" "}
                    {referenceTreatments} first treatments per year and cover
                    the queue in {referenceQueueYears} years.
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-black uppercase mb-4">
                  With ${treatyFundingBillions.toFixed(1)}B/yr Pragmatic Trials
                </div>
                <p className="font-bold mb-4">
                  Pragmatic trials cost{" "}
                  <span className="text-brutal-cyan font-black">
                    ~{costReductionFactor}× less
                  </span>{" "}
                  than traditional trials. This funding enables{" "}
                  <span className="text-brutal-cyan font-black">
                    {capacityMultiplier}× more trials
                  </span>{" "}
                  ={" "}
                  <span className="text-brutal-cyan font-black">
                    ~{newTreatmentsPerYear * capacityMultiplier} first
                    treatments per year
                  </span>
                  .
                </p>
                <div className="bg-brutal-cyan border-4 border-primary p-4">
                  <div className="text-3xl font-black mb-2">
                    {dfdaQueueYears} Years
                  </div>
                  <div className="text-sm font-bold">
                    To cover all {diseasesUntreated.toLocaleString()} diseases
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    {queueYears} years ÷ {capacityMultiplier}× capacity ={" "}
                    {dfdaQueueYears} years
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* The Diminishing Returns Rebuttal */}
          <details className="bg-brutal-yellow border-4 border-primary p-4">
            <summary className="font-bold cursor-pointer text-lg">
              Addressing the "Diminishing Returns" Argument
            </summary>
            <div className="mt-4 space-y-4">
              <p className="font-bold">
                Critics argue: "Just funding more trials won't proportionally
                increase discoveries - we've picked the low-hanging fruit."
              </p>
              <p className="font-bold text-brutal-pink">
                This is wrong for six reasons:
              </p>
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    1.
                  </span>
                  <div>
                    <div className="font-black">
                      We haven't picked the fruit at all.
                    </div>
                    <div className="text-sm text-foreground/70">
                      {unexploredPct}% of drug-disease combinations are
                      unexplored. You can't have diminishing returns when you
                      haven't started.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    2.
                  </span>
                  <div>
                    <div className="font-black">
                      The bottleneck is trials, not candidates.
                    </div>
                    <div className="text-sm text-foreground/70">
                      {safeCompounds} safe compounds sit untested. The limiting
                      factor isn't discovering molecules - it's the capacity to
                      test them.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    3.
                  </span>
                  <div>
                    <div className="font-black">
                      {valleyOfDeathPct}% of promising drugs die from COST, not
                      science.
                    </div>
                    <div className="text-sm text-foreground/70">
                      The "Valley of Death" kills {valleyOfDeathPct}% of
                      promising candidates not because they don't work, but
                      because testing is too expensive. That's not diminishing
                      returns - that's artificial scarcity.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    4.
                  </span>
                  <div>
                    <div className="font-black">
                      When we DO test old drugs, {repurposingSuccessRate}% find
                      new uses.
                    </div>
                    <div className="text-sm text-foreground/70">
                      Drug repurposing has a {repurposingSuccessRate}% success
                      rate - triple the {pharmaSuccessRate} rate of new drug
                      development. The low-hanging fruit is literally
                      everywhere.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    5.
                  </span>
                  <div>
                    <div className="font-black">
                      The treatment gap is real and growing.
                    </div>
                    <div className="text-sm text-foreground/70">
                      {diseasesUntreated.toLocaleString()} diseases have no
                      treatment. At ~{newTreatmentsPerYear} first
                      treatments/year, we'll never catch up. With{" "}
                      {capacityMultiplier}× more trials, we actually have a
                      shot.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brutal-pink font-black text-xl">
                    6.
                  </span>
                  <div>
                    <div className="font-black">
                      More trials = compounding returns, not diminishing.
                    </div>
                    <div className="text-sm text-foreground/70">
                      Every trial teaches us more about biology. More data →
                      better target selection → higher success rates. AI/ML
                      models trained on trial data improve predictions. The more
                      we test, the <em>better</em> we get at testing.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-background border-4 border-primary p-4 mt-4">
                <p className="font-bold text-center">
                  Diminishing returns apply to{" "}
                  <em>repeated attempts at the same problem</em>. We're
                  proposing to <em>attempt problems we've never tried</em>.
                </p>
              </div>
            </div>
          </details>
        </Card>

        {/* Timeline Comparison - Two View Options */}
        <Card className="bg-brutal-pink border-4 border-primary p-4 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black uppercase text-center mb-6 text-brutal-pink-foreground">
            {scenario === "medical-freedom"
              ? "What More Trial Capacity Delivers"
              : "Two Possible Futures"}
          </h3>

          {scenario === "medical-freedom" ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-background border-4 border-primary p-5 text-center text-foreground">
                <div className="text-3xl font-black mb-2">
                  <ParameterValue
                    param={DFDA_TRIALS_PER_YEAR_CAPACITY}
                    format={{ precision: 1 }}
                  />
                </div>
                <div className="font-black uppercase">Trials/year</div>
                <p className="text-sm font-bold mt-2">
                  Pragmatic trials per year under reference funding.
                </p>
              </div>
              <div className="bg-brutal-yellow border-4 border-primary p-5 text-center text-foreground">
                <div className="text-3xl font-black mb-2">
                  <ParameterValue param={DFDA_FIRST_TREATMENTS_PER_YEAR} />
                </div>
                <div className="font-black uppercase">Treatments/year</div>
                <p className="text-sm font-bold mt-2">
                  First treatments found per year.
                </p>
              </div>
              <div className="bg-brutal-cyan border-4 border-primary p-5 text-center text-foreground">
                <div className="text-3xl font-black mb-2">
                  <ParameterValue
                    param={DFDA_QUEUE_CLEARANCE_YEARS}
                    format={{ precision: 1 }}
                  />
                </div>
                <div className="font-black uppercase">Years</div>
                <p className="text-sm font-bold mt-2">
                  Time to cover the untreated-disease queue.
                </p>
              </div>
            </div>
          ) : (
            <TimelineScrolly userAge={userAge} onAgeChange={setUserAge} />
          )}

          {/* Punchline */}
          <div className="mt-8 bg-background border-4 border-primary p-6 text-foreground text-center">
            <p className="text-xl font-black">
              Treatments exist. Safe compounds exist. Patients are waiting.
            </p>
            <p className="font-bold mt-2">
              The missing ingredient is trial capacity. That's a logistics
              problem, not a scientific frontier.
            </p>
          </div>
        </Card>
      </Container>
    </SectionContainer>
  );
}
