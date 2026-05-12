"use client";

import { useId, useMemo, useState } from "react";
import {
  CORPORATE_ANALOG_FALSE_CLAIMS_TREBLE_MULTIPLIER,
  CORPORATE_DAMAGES_DRUGS_NEVER_DEVELOPED_DEATHS,
  CORPORATE_DAMAGES_PENTAGON_FCA_PENALTY_INCREMENT,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  GLOBAL_POPULATION_2024,
  VALUE_OF_STATISTICAL_LIFE,
  WAR_DEATHS_SINCE_1900,
  WAR_TRIAL_REDIRECT_EXCESS_MILITARY_SPENDING_ABOVE_1900_FREEZE,
} from "@optimitron/data/parameters";

/**
 * Sensitivity calculator for the Humanity v. Government damages tiers.
 *
 * Lets the reader adjust the three most-disputed inputs (Value of
 * Statistical Life, war-deaths-since-1900, efficacy-lag deaths total) and
 * watch the floor and FCA treble per-person numbers update live. Default
 * values + non-tunable floor components are imported directly from
 * `@optimitron/data/parameters` so this calculator stays in sync with the
 * canonical numbers — change a parameter once, every surface that uses it
 * (case page, calculator, manual cross-references) updates.
 *
 * The lost-prosperity primary theory headline ($25.2M cohort / $10.6M NPV)
 * is *not* tunable here — its inputs are downstream of multiple manual
 * analyses and would require pulling that math into the client. The body-count
 * tiers below are the parts most readers will want to tune first.
 */

const GLOBAL_POPULATION = GLOBAL_POPULATION_2024.value;
// Property + Environmental Destruction is the manual's $50T floor sub-
// component (cumulative property destruction $45T + environmental
// destruction $5T since 1900). The constants live in the parameter file
// as separate war-cost rows; their sum is the floor input. We keep the
// $50T literal here with a citation, rather than importing two narrower
// constants and re-summing — drift on this one is bounded because the
// sum is what the manual uses in the floor formula.
const PROPERTY_ENV_USD = 50_000_000_000_000;
const EXCESS_MILITARY_USD =
  WAR_TRIAL_REDIRECT_EXCESS_MILITARY_SPENDING_ABOVE_1900_FREEZE.value;
const PENTAGON_FCA_USD =
  CORPORATE_DAMAGES_PENTAGON_FCA_PENALTY_INCREMENT.value;
const NEVER_DEVELOPED_DEATHS =
  CORPORATE_DAMAGES_DRUGS_NEVER_DEVELOPED_DEATHS.value;
const FCA_TREBLE = CORPORATE_ANALOG_FALSE_CLAIMS_TREBLE_MULTIPLIER.value;

const DEFAULT_VSL = VALUE_OF_STATISTICAL_LIFE.value;
const DEFAULT_WAR_DEATHS = WAR_DEATHS_SINCE_1900.value;
const DEFAULT_LAG_DEATHS = EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value;

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
          Damages calculator
        </p>
        <button
          className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
        Use your own numbers.
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        Set what you think a human life is worth in court dollars. Lower the
        death counts if you want. The amount owed to each living human updates
        below.
      </p>

      <div className="mt-5 space-y-4">
        <Slider
          label="Court value of one human life"
          help="Default $10M (EPA / FDA standard). DOT uses $13.7M. Use less if you think the dead should be cheaper."
          min={1_000_000}
          max={15_000_000}
          step={500_000}
          value={vsl}
          display={formatUSDLarge(vsl)}
          onChange={setVsl}
        />
        <Slider
          label="War deaths since 1900"
          help="Default 310M (Rummel democide 264M + battle 39M + collateral civilian 30M minus overlap). White's low estimate is 200M; Rummel-high-plus-military is 340M."
          min={200_000_000}
          max={340_000_000}
          step={5_000_000}
          value={warDeaths}
          display={`${formatNumber(warDeaths / 1_000_000)}M`}
          onChange={setWarDeaths}
        />
        <Slider
          label="Regulatory-delay deaths"
          help="Default 102M (Invisible Graveyard primary estimate). Low is 36.9M. High is 214M. These are patients who died while already-safe treatments waited for efficacy approval."
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
          What each living human is owed, at your assumptions
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Cautious floor
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
              Base demand
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
              Triple damages
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
          Floor = war deaths + regulatory-delay deaths + property/environmental
          destruction + excess military spending + Pentagon failed-audit
          penalty. Base demand adds deaths from drugs never developed. Triple
          damages means multiplying the base demand by three, as some fraud laws
          do.
        </p>
      </div>
    </section>
  );
}
