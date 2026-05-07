"use client";

import { useId, useMemo, useState } from "react";

/**
 * Sensitivity calculator for the Humanity v. Government damages tiers.
 *
 * Lets the reader stress-test the three most-disputed inputs (Value of
 * Statistical Life, war-deaths-since-1900, efficacy-lag deaths total) and
 * watch the floor and FCA treble per-capita numbers update live. Default
 * values match the canonical parameters in
 * `packages/data/src/parameters/parameters-calculations-citations.ts`.
 *
 * The lost-prosperity primary theory headline ($25.2M cohort / $10.6M NPV)
 * is *not* tunable here — its inputs are downstream of multiple manual
 * analyses and would require pulling that math into the client. The body-
 * count tiers below are exactly the kind of "dispute the assumptions"
 * surface a critic targets, so they're what the slider exposes.
 */

const GLOBAL_POPULATION = 8_000_000_000; // GLOBAL_POPULATION_2024
const PROPERTY_ENV_USD = 50_000_000_000_000; // war property ($45T) + env ($5T)
const EXCESS_MILITARY_USD = 135_000_000_000_000; // WAR_TRIAL_REDIRECT_EXCESS_MILITARY_SPENDING_ABOVE_1900_FREEZE
const PENTAGON_FCA_USD = 4_920_000_000_000; // CORPORATE_DAMAGES_PENTAGON_FCA_PENALTY_INCREMENT
const NEVER_DEVELOPED_DEATHS = 300_000_000; // CORPORATE_DAMAGES_DRUGS_NEVER_DEVELOPED_DEATHS
const FCA_TREBLE = 3; // CORPORATE_ANALOG_FALSE_CLAIMS_TREBLE_MULTIPLIER

// Defaults from the manual.
const DEFAULT_VSL = 10_000_000;
const DEFAULT_WAR_DEATHS = 310_000_000;
const DEFAULT_LAG_DEATHS = 102_000_000;

function formatUSDLarge(value: number) {
  if (value >= 1e15) return `$${(value / 1e15).toFixed(2)}Q`;
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatUSDPerson(value: number) {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function parsePositiveNumber(raw: string, fallback: number) {
  const parsed = Number(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

interface SliderProps {
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (value: number) => void;
}

function Slider({
  label,
  help,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: SliderProps) {
  const id = useId();
  return (
    <div className="border-t border-foreground pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground"
        >
          {label}
        </label>
        <span className="text-lg font-black tabular-nums text-foreground">
          {display}
        </span>
      </div>
      <input
        id={id}
        className="mt-2 w-full accent-foreground"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(parsePositiveNumber(event.currentTarget.value, value))
        }
      />
      <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
        {help}
      </p>
    </div>
  );
}

export function DamagesSensitivityCalculator() {
  const [vsl, setVsl] = useState(DEFAULT_VSL);
  const [warDeaths, setWarDeaths] = useState(DEFAULT_WAR_DEATHS);
  const [lagDeaths, setLagDeaths] = useState(DEFAULT_LAG_DEATHS);

  const tiers = useMemo(() => {
    const warVSL = warDeaths * vsl;
    const lagVSL = lagDeaths * vsl;
    const neverDevVSL = NEVER_DEVELOPED_DEATHS * vsl;
    const floorTotal =
      warVSL + lagVSL + PROPERTY_ENV_USD + EXCESS_MILITARY_USD + PENTAGON_FCA_USD;
    const baseAskTotal = floorTotal + neverDevVSL;
    const trebleTotal = baseAskTotal * FCA_TREBLE;
    return {
      floorTotal,
      baseAskTotal,
      trebleTotal,
      floorPerCapita: floorTotal / GLOBAL_POPULATION,
      askPerCapita: baseAskTotal / GLOBAL_POPULATION,
      treblePerCapita: trebleTotal / GLOBAL_POPULATION,
    };
  }, [vsl, warDeaths, lagDeaths]);

  function reset() {
    setVsl(DEFAULT_VSL);
    setWarDeaths(DEFAULT_WAR_DEATHS);
    setLagDeaths(DEFAULT_LAG_DEATHS);
  }

  return (
    <section className="border-2 border-foreground bg-background p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Stress-test the numbers
        </p>
        <button
          className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={reset}
          type="button"
        >
          Reset to manual defaults
        </button>
      </div>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
        Argue with the assumptions. The case still pleads.
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        Tune VSL, body counts, and watch the floor and treble tiers update.
        The point of this slider is rhetorical jiu-jitsu: every "you made up
        the numbers" critique inverts to "tune it however you want — here
        is the case at your numbers."
      </p>

      <div className="mt-5 space-y-4">
        <Slider
          label="Value of Statistical Life"
          help="Default $10M (EPA / FDA standard). DOT uses $13.7M. Critics arguing under-pricing of life argue $5M; critics arguing over-pricing argue $1M."
          min={1_000_000}
          max={15_000_000}
          step={500_000}
          value={vsl}
          display={formatUSDLarge(vsl)}
          onChange={setVsl}
        />
        <Slider
          label="War + conflict deaths since 1900"
          help="Default 310M (Rummel democide 264M + battle 39M + collateral civilian 30M − overlap 25M). White's low estimate is 200M; Rummel-high-plus-military is 340M."
          min={200_000_000}
          max={340_000_000}
          step={5_000_000}
          value={warDeaths}
          display={`${formatNumber(warDeaths / 1_000_000)}M`}
          onChange={setWarDeaths}
        />
        <Slider
          label="Efficacy-lag deaths (1962–today)"
          help="Default 102M (Invisible Graveyard primary estimate). 95% CI 36.9M (low) to 214M (high) reflects uncertainty in the counterfactual treatment-availability assumption."
          min={36_900_000}
          max={214_000_000}
          step={1_000_000}
          value={lagDeaths}
          display={`${formatNumber(lagDeaths / 1_000_000)}M`}
          onChange={setLagDeaths}
        />
      </div>

      <div className="mt-6 border-t-2 border-foreground pt-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Per-plaintiff demanded recovery, at your assumptions
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Floor
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              {formatUSDPerson(tiers.floorPerCapita)}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Total: {formatUSDLarge(tiers.floorTotal)}
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Prosecutor base ask
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              {formatUSDPerson(tiers.askPerCapita)}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Total: {formatUSDLarge(tiers.baseAskTotal)}
            </p>
          </div>
          <div className="border-2 border-foreground bg-foreground p-4 text-background">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-background">
              FCA treble
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              {formatUSDPerson(tiers.treblePerCapita)}
            </p>
            <p className="mt-1 text-xs font-bold text-background">
              Total: {formatUSDLarge(tiers.trebleTotal)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs font-bold leading-5 text-muted-foreground">
          Floor = war-VSL + lag-VSL + property/env ($50T) + excess military
          ($135T) + Pentagon FCA ($4.92T). Base ask adds never-developed-drug
          deaths VSL ($300M deaths × VSL). Treble = base ask × 3 (False Claims
          Act multiplier).
        </p>
      </div>
    </section>
  );
}
