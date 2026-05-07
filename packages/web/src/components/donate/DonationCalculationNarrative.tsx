"use client";

import { useState, type ReactNode } from "react";
import {
  BED_NETS_COST_PER_DALY,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_ANNUAL_TRIAL_FUNDING,
  DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_DISEASE_DEATHS_PER_MINUTE,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_REGISTERED_VOTERS,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  POLITICAL_SUCCESS_PROBABILITY,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_REDUCTION_PCT,
  UNEXPLORED_RATIO,
  WILLING_TRIAL_PARTICIPANTS_GLOBAL,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import type { DonationImpactDerived } from "./donation-impact-calc";

const HOURS_PER_YEAR = 24 * 365;

interface Props {
  costPerVote: number;
  derived: DonationImpactDerived;
  onCostPerVoteChange: (value: number) => void;
  onSuccessProbabilityChange: (value: number) => void;
  onTreatyReductionPctChange: (value: number) => void;
  onVotesNeededChange: (value: number) => void;
  successProbability: number;
  treatyReductionPct: number;
  votesNeeded: number;
}

export function DonationCalculationNarrative({
  costPerVote,
  derived,
  onCostPerVoteChange,
  onSuccessProbabilityChange,
  onTreatyReductionPctChange,
  onVotesNeededChange,
  successProbability,
  treatyReductionPct,
  votesNeeded,
}: Props) {
  const sufferingYears = derived.sufferingHours / HOURS_PER_YEAR;
  const reductionRatio = treatyReductionPct / TREATY_REDUCTION_PCT.value;

  return (
    <section
      id="how-this-is-calculated"
      className="border-t-2 border-foreground p-5 sm:p-6"
    >
      <div className="max-w-3xl space-y-3">
        <h2 className="text-2xl font-black uppercase">
          How this is calculated
        </h2>
        <p className="text-sm font-bold leading-6 text-muted-foreground">
          Click sourced constants for citations. The boxed numbers are the same
          live assumptions as the calculator above. Simple math: addition
          mostly, some multiplication.
        </p>
      </div>

      <ol className="mt-6 space-y-0">
        <NarrativeStep
          n={1}
          headline={
            <>
              Only{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR}
              />{" "}
              diseases get their first effective treatment each year.
            </>
          }
        >
          That is the throughput of every drug regulator on the planet,
          combined. This means your Food and Drug Administration has not
          administered drugs for most food-and-drug-related problems.
        </NarrativeStep>

        <NarrativeStep
          n={2}
          headline={
            <>
              About{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              />{" "}
              diseases are still waiting.
            </>
          }
        >
          That backlog is the treatment queue, and it is longer than any queue
          humans have ever voluntarily stood in, which is saying something
          because you invented Disneyland.
        </NarrativeStep>

        <NarrativeStep
          n={3}
          headline={
            <>
              At the current discovery rate, finding treatments for all of them
              takes{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years.
            </>
          }
        >
          The average untreated disease waits{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT}
          />{" "}
          years for its first treatment. Everyone currently alive will be dead
          before we finish. This is the current timeline. There are{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={SAFE_COMPOUNDS_COUNT}
          />{" "}
          known safe compounds, and{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={UNEXPLORED_RATIO}
            valueOverride="99.7%"
          />{" "}
          of their potential uses have never been tested.
        </NarrativeStep>

        <NarrativeStep
          n={4}
          headline={
            <>
              You&apos;d volunteer for trials faster, but so would{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={WILLING_TRIAL_PARTICIPANTS_GLOBAL}
              />{" "}
              other patients.
            </>
          }
        >
          The current system has{" "}
          <ParameterValue
            className="font-black"
            figures={2}
            param={CURRENT_TRIAL_SLOTS_AVAILABLE}
          />{" "}
          slots. It is like a billion people drowning in line for the two
          available life jackets.
        </NarrativeStep>

        <NarrativeStep
          n={5}
          headline={
            <>
              Current trials cost about{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={{ ...TRADITIONAL_PHASE3_COST_PER_PATIENT, unit: "USD" }}
              />{" "}
              per patient.
            </>
          }
        >
          Most of that cost is on-site monitoring, not science. Your current
          system is somehow worse than panic.
        </NarrativeStep>

        <NarrativeStep
          n={6}
          headline={
            <>
              Pragmatic decentralized trials cost{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={{
                  ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
                  unit: "USD",
                }}
              />{" "}
              per patient.
            </>
          }
        >
          The RECOVERY trial showed this kind of thing works in reality, during
          a pandemic, while panicking. Same statistical power, real-world data,
          no on-site visits.
        </NarrativeStep>

        <NarrativeStep
          n={7}
          headline={
            <>
              The treaty redirects{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={TREATY_ANNUAL_FUNDING}
              />
              .{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={{ ...DFDA_ANNUAL_TRIAL_FUNDING, unit: "USD" }}
              />{" "}
              funds{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={DFDA_PATIENTS_FUNDABLE_ANNUALLY}
              />{" "}
              trial patients.
            </>
          }
        >
          No grant committees deciding which diseases are fashionable this year.
          The patient subsidy follows the patient. That is{" "}
          <ParameterValue
            className="font-black"
            display="withUnit"
            figures={3}
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
          />{" "}
          current global capacity: more trials, more disease coverage, same pool
          of compounds.
        </NarrativeStep>

        <NarrativeStep
          n={8}
          headline={
            <>
              The queue compresses from{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years to{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={DFDA_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years.
            </>
          }
        >
          Remember that billion patients drowning in line? Your decentralized
          FDA will hand out{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={DFDA_PATIENTS_FUNDABLE_ANNUALLY}
          />
          . The physical upper bound is{" "}
          <ParameterValue
            className="font-black"
            display="withUnit"
            figures={3}
            param={DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL}
          />{" "}
          current capacity. The average disease gets its first treatment{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS}
          />{" "}
          years sooner. Add{" "}
          <ParameterValue
            className="font-black"
            figures={2}
            param={EFFICACY_LAG_YEARS}
          />{" "}
          years of removed efficacy lag:{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS}
          />{" "}
          years sooner.
        </NarrativeStep>

        <NarrativeStep
          n={9}
          headline={
            <>
              <ParameterValue
                className="font-black"
                figures={3}
                param={GLOBAL_DISEASE_DEATHS_DAILY}
              />{" "}
              people die from disease every day.
            </>
          }
        >
          That is{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={GLOBAL_DISEASE_DEATHS_PER_MINUTE}
          />{" "}
          every minute. Every minute of delay, 104 humans permanently stop. With
          the current live assumptions, the model estimates{" "}
          <strong>{formatQuantity(derived.livesSaved)}</strong> expected deaths
          prevented and <strong>{formatQuantity(sufferingYears)}</strong> years
          of suffering and disability prevented.
        </NarrativeStep>

        <NarrativeStep
          n={10}
          headline={
            <>
              Humans spend{" "}
              <ParameterValue
                className="font-black"
                display="withUnit"
                figures={3}
                param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
              />{" "}
              every year on stuff designed specifically to make humans stop
              being alive. Move{" "}
              <AdjustableNumber
                ariaLabel="Share of military spending redirected"
                max={0.05}
                min={0.005}
                onChange={onTreatyReductionPctChange}
                scale={100}
                step={0.1}
                suffix="%"
                value={treatyReductionPct}
              />{" "}
              to high-efficiency pragmatic clinical trials.
            </>
          }
        >
          Government spending on clinical trials is{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
          />{" "}
          times less than military spending. Your chance of dying from disease
          is 100%. Your current budget does not reflect this. Earth owns{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={GLOBAL_WARHEAD_COUNT}
          />{" "}
          nuclear warheads.{" "}
          <ParameterValue
            className="font-black"
            figures={2}
            param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
          />{" "}
          is enough for nuclear winter. We have{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={NUCLEAR_WINTER_OVERKILL_FACTOR}
          />{" "}
          apocalypses&apos; worth of weapons. Keep the deterrent. Spend one
          slice curing every disease.
        </NarrativeStep>

        <NarrativeStep
          n={11}
          headline={
            <>
              To pass the treaty: reach{" "}
              <AdjustableNumber
                ariaLabel="Voter-equivalent reach needed"
                max={GLOBAL_REGISTERED_VOTERS.value}
                min={THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value}
                onChange={onVotesNeededChange}
                step={10_000_000}
                value={votesNeeded}
                widthClassName="w-36"
              />{" "}
              humans at{" "}
              <AdjustableNumber
                ariaLabel="Cost to reach one voter"
                max={10}
                min={0.5}
                onChange={onCostPerVoteChange}
                prefix="$"
                step={0.1}
                value={costPerVote}
                widthClassName="w-24"
              />{" "}
              each.
            </>
          }
        >
          That makes the campaign cost{" "}
          <strong>${formatNumber(derived.campaignCostUsd)}</strong>. Everyone
          thinks this is crazy because everyone else thinks this is crazy. Right
          now every human who wants less war and disease assumes they are the
          weird one. The referendum is the moment they find out they are
          everyone.
        </NarrativeStep>

        <NarrativeStep
          n={12}
          headline={
            <>
              At{" "}
              <AdjustableNumber
                ariaLabel="Political success probability"
                max={1}
                min={POLITICAL_SUCCESS_PROBABILITY.value}
                onChange={onSuccessProbabilityChange}
                scale={100}
                step={1}
                suffix="%"
                value={successProbability}
                widthClassName="w-24"
              />{" "}
              success and {formatQuantity(reductionRatio)}x treaty scale, the
              model gives <strong>${formatPrice(derived.costPerDaly)}</strong>{" "}
              per healthy life-year.
            </>
          }
        >
          That is{" "}
          <strong>{formatQuantity(derived.vsBedNetsMultiplier)}x</strong> the
          cost-effectiveness of bed nets at the live assumptions. Your
          calculator will display an error, emit a tiny electronic scream, and
          attempt to leave the desk. This is correct. The published skeptical
          case assumes a 99% chance humanity fumbles this and still comes out{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER}
          />
          x better than bed nets, where bed nets cost{" "}
          <ParameterValue
            className="font-black"
            display="withUnit"
            figures={2}
            param={BED_NETS_COST_PER_DALY}
          />
          . This model suggests the treaty campaign may be the most
          cost-effective way to reduce human suffering per dollar spent. If that
          sounds insane, good. Change the assumptions or attack the citations.
        </NarrativeStep>
      </ol>
    </section>
  );
}

function NarrativeStep({
  children,
  headline,
  n,
}: {
  children: ReactNode;
  headline: ReactNode;
  n: number;
}) {
  return (
    <li className="border-t border-foreground py-5 first:border-t-0">
      <div className="flex gap-4">
        <span className="shrink-0 text-3xl font-black tabular-nums leading-none sm:text-4xl">
          {n}
        </span>
        <div className="max-w-4xl space-y-2">
          <h3 className="text-lg font-black leading-7 sm:text-xl">
            {headline}
          </h3>
          <p className="text-sm font-bold leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {children}
          </p>
        </div>
      </div>
    </li>
  );
}

function AdjustableNumber({
  ariaLabel,
  max,
  min,
  onChange,
  prefix,
  scale = 1,
  step,
  suffix,
  value,
  widthClassName = "w-28",
}: {
  ariaLabel: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  prefix?: string;
  scale?: number;
  step: number;
  suffix?: string;
  value: number;
  widthClassName?: string;
}) {
  const [rawValue, setRawValue] = useState<string | null>(null);
  const scaledValue = value * scale;
  const inputValue =
    rawValue ??
    (Number.isInteger(step)
      ? String(Math.round(scaledValue))
      : String(Number(scaledValue.toFixed(2))));

  function handleChange(raw: string) {
    setRawValue(raw);
    if (!raw.trim()) return;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(clamp(parsed / scale, min, max));
  }

  return (
    <span className="inline-flex items-center border border-foreground bg-background px-1.5 py-0.5 align-baseline text-base font-black tabular-nums">
      {prefix ? <span>{prefix}</span> : null}
      <input
        aria-label={ariaLabel}
        className={`${widthClassName} bg-transparent text-right outline-none`}
        max={max * scale}
        min={min * scale}
        onBlur={() => setRawValue(null)}
        onChange={(event) => handleChange(event.target.value)}
        step={step}
        type="number"
        value={inputValue}
      />
      {suffix ? <span className="pl-1">{suffix}</span> : null}
    </span>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 1) return formatNumber(value, 0);
  return Number(value.toPrecision(2)).toString();
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value >= 1)
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 0.01) return value.toFixed(2);
  return value.toPrecision(2);
}
