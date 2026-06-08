"use client";

import {
  AVERAGE_MARKET_RETURN_PCT,
  DEFENSE_TAKEOVER_COST_TOTAL,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
} from "@optimitron/data/parameters";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";

const calculatorControlsHeading = "Your assumptions"; // TODO(copy): Mike copy gate. Source: Pivot 2 calculator own-numbers framing.
const calculatorResultsHeading = "What the share becomes"; // TODO(copy): Mike copy gate. Source: Pivot 2 calculator result framing.
const amountLabel = "How much you invest"; // TODO(copy): Mike copy gate. Source: Pivot 3 calculator fix.
const yearsLabel = "Years you hold"; // TODO(copy): Mike copy gate. Source: Pivot 3 calculator fix.
const probabilityLabel = "Your odds it works (%)"; // TODO(copy): Mike copy gate. Source: Pivot 3 calculator fix.
const entryProbabilityLabel = "Market-implied entry probability"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd eosEntryProb.
const marketReturnLabel = "Defense stock return if it fails"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd fail-card meta.
const netWorthLabel = "Economy-exposed net worth"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd systemic-upside section.
const multiplierLabel = "Treaty/current GDP multiplier"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd multiplier control.
const multiplierCiLabel = "95% CI"; // TODO(copy): Mike copy gate. Source: parameter confidence interval.
const valueIfCampaignSucceedsTitle = "Value if Campaign Succeeds"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:296.
const valueIfCampaignFailsTitle = "Value if Campaign Fails"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:301.
const expectedValueTitle = "Expected Value (probability-weighted)"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:306.
const asleepTitle = "If the Market Is Asleep (the thesis)"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:345.
const efficientTitle = "If the Market Is Efficient (textbook)"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:350.
const edgeTitle = "Your Edge Over the Market"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:355.
const systemicTitle = "Protected Upside"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:370-396.
const asleepEvTitle = "Asleep Expected Value"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:273-275.
const multiplierBaseCaseLabel = "Base case"; // TODO(copy): Mike copy gate. Source: investment-terms.qmd:241.
const advancedLabel = "Advanced"; // TODO(copy): Mike copy gate. Source: Pivot 3 calculator fix.
const securitiesDisclaimer =
  "Illustrative. YOUR assumptions, not a promise or offer. Not investment advice."; // TODO(copy): Mike copy gate. Source: Pivot 2 required securities disclaimer.

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
});
const compactMoneyFormatter = new Intl.NumberFormat("en-US", {
  compactDisplay: "short",
  currency: "USD",
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  notation: "compact",
  style: "currency",
});

function money(value: number) {
  return moneyFormatter.format(value);
}

function moneyCompact(value: number) {
  return Math.abs(value) >= 1_000_000
    ? compactMoneyFormatter.format(value)
    : money(value);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function pctInput(value: number) {
  return `${value.toFixed(1)}%`;
}

function multiple(value: number) {
  return `${value.toFixed(1)}x`;
}

function largeMultiple(value: number) {
  return value >= 1
    ? `${Math.round(value).toLocaleString("en-US")}x`
    : `${value.toFixed(1)}x`;
}

function SliderControl({
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <label className="block border-b-2 border-foreground py-5" htmlFor={id}>
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-black uppercase">{label}</span>
        <span className="text-lg font-black tabular-nums">{valueLabel}</span>
      </span>
      <input
        className="mt-4 h-2 w-full cursor-pointer appearance-none bg-foreground accent-foreground [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:bg-background"
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function ResultCard({
  meta,
  title,
  value,
}: {
  meta: ReactNode;
  title: string;
  value: ReactNode;
}) {
  return (
    <article className="min-w-0 border-2 border-foreground p-4">
      <h3 className="text-xs font-black uppercase">{title}</h3>
      <p className="mt-3 break-words text-2xl font-black leading-none sm:text-3xl">
        {value}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
        {meta}
      </p>
    </article>
  );
}

export function EosInvestmentCalculator() {
  const multiplierCi =
    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
      .confidenceInterval;
  const [amount, setAmount] = useState(25_000);
  const [years, setYears] = useState(10);
  const [probPct, setProbPct] = useState(10);
  const [entryProbPct, setEntryProbPct] = useState(5);
  const [spReturn, setSpReturn] = useState(AVERAGE_MARKET_RETURN_PCT.value);
  const [netWorth, setNetWorth] = useState(250_000);
  const [mult, setMult] = useState(
    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15.value,
  );

  const eosCalc = useMemo(() => {
    const prob = probPct / 100;
    const p0 = entryProbPct / 100;
    const takeover = DEFENSE_TAKEOVER_COST_TOTAL.value;
    const success = amount * mult;
    const fail = amount * Math.pow(1 + spReturn, years);
    const ev = prob * success + (1 - prob) * fail;
    const evVsSp = ev - fail;
    const systemicUpside = netWorth * (mult - 1);
    const systemicEv = prob * systemicUpside;
    const asleepSuccessMult = mult / p0;
    const asleepSuccess = amount * asleepSuccessMult;
    const asleepEv = prob * asleepSuccess + (1 - prob) * fail;
    const edge = prob / p0;
    const efficientEv = amount * mult;
    const share = amount / takeover;

    return {
      amount,
      asleepEv,
      asleepSuccess,
      asleepSuccessMult,
      edge,
      efficientEv,
      ev,
      evVsSp,
      fail,
      mult,
      netWorth,
      p0,
      prob,
      share,
      sp: spReturn,
      success,
      systemicEv,
      systemicUpside,
      takeover,
      years,
    };
  }, [amount, entryProbPct, mult, netWorth, probPct, spReturn, years]);

  return (
    <div className="border-2 border-foreground">
      <div className="grid lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <section
          aria-labelledby="eos-calculator-controls"
          className="border-b-2 border-foreground p-5 lg:border-b-0 lg:border-r-2"
        >
          <h3
            className="text-xl font-black uppercase"
            id="eos-calculator-controls"
          >
            {calculatorControlsHeading}
          </h3>
          <div className="mt-4">
            <SliderControl
              id="eos-amount"
              label={amountLabel}
              max={5_000_000}
              min={1_000}
              onChange={setAmount}
              step={1_000}
              value={amount}
              valueLabel={moneyCompact(amount)}
            />
            <SliderControl
              id="eos-probability"
              label={probabilityLabel}
              max={100}
              min={0.1}
              onChange={setProbPct}
              step={0.1}
              value={probPct}
              valueLabel={pctInput(probPct)}
            />
            <SliderControl
              id="eos-years"
              label={yearsLabel}
              max={30}
              min={1}
              onChange={setYears}
              step={1}
              value={years}
              valueLabel={String(years)}
            />
          </div>
          <details className="mt-5 border-2 border-foreground p-3">
            <summary className="cursor-pointer text-sm font-black uppercase">
              {advancedLabel}
            </summary>
            <div className="mt-2">
              <SliderControl
                id="eos-entry-probability"
                label={entryProbabilityLabel}
                max={100}
                min={0.5}
                onChange={setEntryProbPct}
                step={0.1}
                value={entryProbPct}
                valueLabel={pctInput(entryProbPct)}
              />
              <SliderControl
                id="eos-market-return"
                label={marketReturnLabel}
                max={0.2}
                min={0}
                onChange={setSpReturn}
                step={0.001}
                value={spReturn}
                valueLabel={percent(spReturn)}
              />
              <SliderControl
                id="eos-net-worth"
                label={netWorthLabel}
                max={100_000_000}
                min={0}
                onChange={setNetWorth}
                step={100_000}
                value={netWorth}
                valueLabel={moneyCompact(netWorth)}
              />
              <SliderControl
                id="eos-multiplier"
                label={multiplierLabel}
                max={multiplierCi?.[1] ?? 10}
                min={multiplierCi?.[0] ?? 1}
                onChange={setMult}
                step={0.01}
                value={mult}
                valueLabel={multiple(mult)}
              />
            </div>
            {multiplierCi ? (
              <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">
                {multiplierCiLabel}: {multiple(multiplierCi[0])} -{" "}
                {multiple(multiplierCi[1])}. {multiplierBaseCaseLabel}:{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                  }
                />
                .
              </p>
            ) : null}
          </details>
          <p className="mt-5 border-2 border-foreground p-3 text-xs font-black uppercase">
            {securitiesDisclaimer}
          </p>
        </section>

        <section
          aria-labelledby="eos-calculator-results"
          className="p-5"
        >
          <h3
            className="text-xl font-black uppercase"
            id="eos-calculator-results"
          >
            {calculatorResultsHeading}
          </h3>
          {/* Default view: the 3 clearest cards for a first-timer. */}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ResultCard
              meta={`${eosCalc.mult.toFixed(1)}x your investment`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:298.
              title={valueIfCampaignSucceedsTitle}
              value={moneyCompact(eosCalc.success)}
            />
            <ResultCard
              meta={`Defense stocks at ${(eosCalc.sp * 100).toFixed(1)}%/yr for ${eosCalc.years} years`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:303.
              title={valueIfCampaignFailsTitle}
              value={moneyCompact(eosCalc.fail)}
            />
            <ResultCard
              meta={`${(eosCalc.prob * 100).toFixed(1)}% chance of ${moneyCompact(eosCalc.success)} + ${((1 - eosCalc.prob) * 100).toFixed(1)}% chance of ${moneyCompact(eosCalc.fail)}`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:308.
              title={expectedValueTitle}
              value={moneyCompact(eosCalc.ev)}
            />
          </div>

          {/* TODO(copy): Mike copy gate. Source: investment-terms.qmd:330. */}
          <p className="mt-5 border-2 border-foreground p-4 text-base font-bold leading-7">
            You invest {moneyCompact(eosCalc.amount)}. If the campaign succeeds (
            {(eosCalc.prob * 100).toFixed(1)}% estimated), your shares
            appreciate to {moneyCompact(eosCalc.success)} (
            {`${eosCalc.mult.toFixed(1)}x`}). If it fails, you hold defense
            stocks worth{" "}
            {moneyCompact(eosCalc.fail)} at market return. The
            probability-weighted expected value is {moneyCompact(eosCalc.ev)},
            which is {moneyCompact(Math.abs(eosCalc.evVsSp))}{" "}
            {eosCalc.evVsSp >= 0 ? "more" : "less"} than the S&amp;P would
            have returned. You also do not die of a curable disease, which is
            not reflected above but is arguably the better return.
          </p>

          {/* Advanced: the repricing / edge cards for the finance-minded. */}
          <details className="mt-5 border-2 border-foreground p-3">
            <summary className="cursor-pointer text-sm font-black uppercase">
              Advanced (for the finance-minded)
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ResultCard
                meta={`success multiple buying at ${(eosCalc.p0 * 100).toFixed(1)}% implied (${eosCalc.mult.toFixed(1)}x assets times the repricing from ${(eosCalc.p0 * 100).toFixed(1)}% to certainty) = ${moneyCompact(eosCalc.asleepSuccess)} on ${moneyCompact(eosCalc.amount)}`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:347.
                title={asleepTitle}
                value={largeMultiple(eosCalc.asleepSuccessMult)}
              />
              <ResultCard
                meta="then the price already reflects the odds, entry timing is fair, and you are paid in variance, not extra expected value. Early just means cheaper and riskier." // TODO(copy): Mike copy gate. Source: investment-terms.qmd:352.
                title={efficientTitle}
                value={moneyCompact(eosCalc.efficientEv)}
              />
              <ResultCard
                meta={`your ${(eosCalc.prob * 100).toFixed(1)}% belief divided by the ${(eosCalc.p0 * 100).toFixed(1)}% the market prices in. Above 1x, the market is underpaying you for the risk.`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:357.
                title={edgeTitle}
                value={eosCalc.edge >= 1 ? `${eosCalc.edge.toFixed(1)}x` : `${eosCalc.edge.toFixed(2)}x`}
              />
              <ResultCard
                meta={`${moneyCompact(eosCalc.netWorth)} riding the ${eosCalc.mult.toFixed(1)}x trajectory gap; probability-weighted ${moneyCompact(eosCalc.systemicEv)}.`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:378-384.
                title={systemicTitle}
                value={moneyCompact(eosCalc.systemicUpside)}
              />
              <ResultCard
                meta={`market-asleep expected value at your assumptions, using the same fail path above.`} // TODO(copy): Mike copy gate. Source: investment-terms.qmd:273-275.
                title={asleepEvTitle}
                value={moneyCompact(eosCalc.asleepEv)}
              />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
