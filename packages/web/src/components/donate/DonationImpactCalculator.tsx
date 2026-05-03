"use client";

import { useMemo, useState } from "react";
import {
  BED_NETS_COST_PER_DALY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  GLOBAL_REGISTERED_VOTERS,
  POLITICAL_SUCCESS_PROBABILITY,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_REDUCTION_PCT,
  fmtRaw,
} from "@optimitron/data/parameters";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Slider } from "@/components/retroui/Slider";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { deriveDonationImpact } from "./donation-impact-calc";

// ── Slider ranges, sourced from parameter properties where possible ─────────
const VOTES_MIN = Math.round(
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.confidenceInterval?.[0] ??
    THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value * 0.3,
);
const VOTES_MAX = Math.round(GLOBAL_REGISTERED_VOTERS.value);
const VOTES_DEFAULT = Math.round(THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value);
const VOTES_STEP = 1_000_000;

const COST_PER_VOTE_MIN = 0.5;
const COST_PER_VOTE_MAX = 10;
const COST_PER_VOTE_DEFAULT = 2;
const COST_PER_VOTE_STEP = 0.1;

const SUCCESS_MIN = POLITICAL_SUCCESS_PROBABILITY.value;
const SUCCESS_MAX = 1;
const SUCCESS_DEFAULT = 1;
const SUCCESS_STEP = 0.01;

const REDUCTION_MIN = 0.005;
const REDUCTION_MAX = 0.05;
const REDUCTION_DEFAULT = TREATY_REDUCTION_PCT.value;
const REDUCTION_STEP = 0.001;

type StoreUnit = "lives" | "dalys" | "sufferingHours" | "economicValue";

const STORE_UNITS: Array<{
  key: StoreUnit;
  label: string;
  shortLabel: string;
  defaultQuantity: number;
}> = [
  { key: "lives", label: "Lives saved", shortLabel: "lives", defaultQuantity: 100 },
  { key: "dalys", label: "Healthy life-years", shortLabel: "DALYs", defaultQuantity: 1_000 },
  {
    key: "sufferingHours",
    label: "Hours of suffering prevented",
    shortLabel: "hours",
    defaultQuantity: 100_000,
  },
  {
    key: "economicValue",
    label: "Dollars of GDP added",
    shortLabel: "USD",
    defaultQuantity: 1_000_000,
  },
];

interface Props {
  onSetAmount: (amount: number) => void;
}

export function DonationImpactCalculator({ onSetAmount }: Props) {
  const [votesNeeded, setVotesNeeded] = useState(VOTES_DEFAULT);
  const [costPerVote, setCostPerVote] = useState(COST_PER_VOTE_DEFAULT);
  const [successProbability, setSuccessProbability] = useState(SUCCESS_DEFAULT);
  const [treatyReductionPct, setTreatyReductionPct] = useState(REDUCTION_DEFAULT);
  const [storeUnit, setStoreUnit] = useState<StoreUnit>("dalys");
  const [storeQuantity, setStoreQuantity] = useState<string>("1000");

  const reset = () => {
    setVotesNeeded(VOTES_DEFAULT);
    setCostPerVote(COST_PER_VOTE_DEFAULT);
    setSuccessProbability(SUCCESS_DEFAULT);
    setTreatyReductionPct(REDUCTION_DEFAULT);
  };

  const derived = useMemo(
    () =>
      deriveDonationImpact({
        votesNeeded,
        costPerVote,
        successProbability,
        treatyReductionPct,
      }),
    [votesNeeded, costPerVote, successProbability, treatyReductionPct],
  );

  const storePerDollar: Record<StoreUnit, number> = {
    lives: derived.livesSaved / derived.campaignCostUsd,
    dalys: derived.dalys / derived.campaignCostUsd,
    sufferingHours: derived.sufferingHours / derived.campaignCostUsd,
    economicValue: derived.economicValue / derived.campaignCostUsd,
  };

  const quantityNum = Number(storeQuantity);
  const isValidQuantity = Number.isFinite(quantityNum) && quantityNum > 0;
  const storePrice =
    isValidQuantity && storePerDollar[storeUnit] > 0
      ? quantityNum / storePerDollar[storeUnit]
      : 0;
  const storePriceRounded = Math.max(1, Math.round(storePrice));

  const successPctText = `${(successProbability * 100).toFixed(successProbability < 0.1 ? 1 : 0)}%`;
  const reductionPctText = `${(treatyReductionPct * 100).toFixed(2)}%`;

  return (
    <section className="border border-black p-5 sm:p-6">
      <div className="space-y-7">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Healthy life-year calculator</h2>
          <p className="text-sm leading-6 text-neutral-700">
            Choose what you want to buy, adjust the assumptions, and add the
            modeled price to checkout.
          </p>
        </div>

        <div className="space-y-5 border-t border-black pt-6">
          <SliderRow
            label="Votes needed for the treaty"
            valueText={fmtRaw(votesNeeded, 3)}
            footnote={
              <>
                Default <ParameterValue param={THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION} figures={2} />{" "}
                (Chenoweth&apos;s{" "}
                <ParameterValue param={GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT} figures={2} />{" "}
                rule). Crank to{" "}
                <ParameterValue param={GLOBAL_REGISTERED_VOTERS} figures={2} /> if you want a
                full majority of humans on Earth.
              </>
            }
            value={votesNeeded}
            min={VOTES_MIN}
            max={VOTES_MAX}
            step={VOTES_STEP}
            onChange={setVotesNeeded}
          />

          <SliderRow
            label="Cost per vote (paid acquisition)"
            valueText={`$${costPerVote.toFixed(2)}`}
            footnote="Meta and Google petition CPC. Cheaper if your message goes viral; more if you target U.S. swing states."
            value={costPerVote}
            min={COST_PER_VOTE_MIN}
            max={COST_PER_VOTE_MAX}
            step={COST_PER_VOTE_STEP}
            onChange={setCostPerVote}
          />

          <SliderRow
            label="Probability the treaty actually passes"
            valueText={successPctText}
            footnote={
              <>
                The skeptical published assumption is{" "}
                <ParameterValue param={POLITICAL_SUCCESS_PROBABILITY} figures={2} />.
                Use 100% for the conditional-success view.
              </>
            }
            value={successProbability}
            min={SUCCESS_MIN}
            max={SUCCESS_MAX}
            step={SUCCESS_STEP}
            onChange={setSuccessProbability}
          />

          <SliderRow
            label="Share of military spending redirected"
            valueText={reductionPctText}
            footnote={
              <>
                Default <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} /> — the
                treaty as written. Linear scaling above 1% is approximate; diminishing returns
                kick in eventually.
              </>
            }
            value={treatyReductionPct}
            min={REDUCTION_MIN}
            max={REDUCTION_MAX}
            step={REDUCTION_STEP}
            onChange={setTreatyReductionPct}
          />

          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="w-full border border-black shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0"
          >
            Reset calculator
          </Button>
        </div>

        <div className="space-y-3 border border-black p-4">
          <p className="text-sm font-semibold">Modeled output</p>
          <OutputRow
            label="Campaign cost"
            valueNode={
              <ParameterValue
                param={{ ...TREATY_CAMPAIGN_TOTAL_COST, value: derived.campaignCostUsd }}
                figures={3}
              />
            }
            note={
              <>
                vs published <ParameterValue param={TREATY_CAMPAIGN_TOTAL_COST} figures={1} />{" "}
                IAB campaign budget
              </>
            }
          />
          <OutputRow
            label="Lives saved (expected)"
            valueNode={
              <ParameterValue
                param={{
                  ...DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
                  value: derived.livesSaved,
                }}
                figures={3}
              />
            }
          />
          <OutputRow
            label="Healthy life-years saved (DALYs)"
            valueNode={
              <ParameterValue
                param={{
                  ...DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
                  value: derived.dalys,
                }}
                figures={3}
              />
            }
          />
          <OutputRow
            label="Hours of suffering prevented"
            valueNode={
              <ParameterValue
                param={{
                  ...DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
                  value: derived.sufferingHours,
                }}
                figures={3}
              />
            }
          />
          <OutputRow
            label="Modeled economic value"
            valueNode={
              <ParameterValue
                param={{
                  ...DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
                  value: derived.economicValue,
                }}
                figures={3}
              />
            }
          />
          <div className="space-y-2 border-t border-black pt-3">
            <OutputRow
              label="Cost per life saved"
              valueNode={`$${fmtRaw(derived.costPerLife, 3)}`}
            />
            <OutputRow
              label="Cost per healthy life-year"
              valueNode={`$${fmtRaw(derived.costPerDaly, 3)}`}
              note={
                <>
                  Bed nets:{" "}
                  <ParameterValue
                    param={{ ...BED_NETS_COST_PER_DALY, unit: "USD" }}
                    figures={2}
                  />
                  /DALY (the standard you&apos;re beating by{" "}
                  <strong>{fmtRaw(derived.vsBedNetsMultiplier, 3)}x</strong>)
                </>
              }
            />
            <OutputRow
              label="Return on every dollar"
              valueNode={`${fmtRaw(derived.roi, 3)}x`}
            />
          </div>
        </div>

        <div className="space-y-4 border border-black bg-black p-4 text-white">
          <div className="space-y-1">
            <p className="text-base font-semibold">Build your donation</p>
            <p className="text-sm leading-6 text-neutral-300">
              Pick a unit, type a quantity, and use the model price as your
              checkout amount.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STORE_UNITS.map((unit) => (
              <button
                key={unit.key}
                type="button"
                onClick={() => {
                  setStoreUnit(unit.key);
                  setStoreQuantity(String(unit.defaultQuantity));
                }}
                className={`border border-white px-3 py-2 text-xs font-semibold ${
                  storeUnit === unit.key
                    ? "bg-white text-black"
                    : "bg-black text-white hover:bg-neutral-900"
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase">
                How many{" "}
                {STORE_UNITS.find((unit) => unit.key === storeUnit)?.shortLabel}?
              </label>
              <Input
                type="number"
                min={1}
                step={1}
                value={storeQuantity}
                onChange={(event) => setStoreQuantity(event.target.value)}
                className="border border-white bg-white text-black shadow-none"
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase opacity-70">Price</p>
              <p className="text-2xl font-black leading-none">
                ${storePriceRounded.toLocaleString()}
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={!isValidQuantity || storePriceRounded < 1}
            onClick={() => onSetAmount(storePriceRounded)}
            className="w-full border border-white bg-white text-black shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0"
          >
            Add ${storePriceRounded.toLocaleString()} to checkout
          </Button>
        </div>
      </div>
    </section>
  );
}

function SliderRow({
  label,
  valueText,
  footnote,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  valueText: string;
  footnote: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-lg font-semibold">{valueText}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => {
          if (values[0] !== undefined) onChange(values[0]);
        }}
      />
      <p className="text-xs leading-5 text-neutral-600">{footnote}</p>
    </div>
  );
}

function OutputRow({
  label,
  valueNode,
  note,
}: {
  label: string;
  valueNode: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-sm text-neutral-700">{label}</span>
      <span className="text-right font-semibold text-black">
        {valueNode}
        {note ? (
          <span className="block text-xs font-normal text-neutral-500 sm:ml-2 sm:inline">
            {note}
          </span>
        ) : null}
      </span>
    </div>
  );
}
