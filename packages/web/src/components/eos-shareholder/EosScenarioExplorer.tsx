"use client";

import {
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
  WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
} from "@optimitron/data/parameters";
import { useId, useMemo, useState } from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";

const scenarios = [
  {
    id: "status-quo",
    label: "Status quo",
    multiplier: 1,
    note: "The year-20 baseline",
  },
  {
    id: "treaty",
    label: "1% Treaty",
    multiplier:
      TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20.value,
    note: "Partial optimization",
  },
  {
    id: "optimal",
    label: "Full optimization",
    multiplier:
      WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20.value,
    note: "The modeled upper path",
  },
] as const;

type ScenarioId = (typeof scenarios)[number]["id"];

export function formatScenarioMoney(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const units = [
    { divisor: 1_000_000_000_000, suffix: "T" },
    { divisor: 1_000_000_000, suffix: "B" },
    { divisor: 1_000_000, suffix: "M" },
    { divisor: 1_000, suffix: "K" },
  ] as const;
  const compact = (unitIndex: number): string => {
    const { divisor, suffix } = units[unitIndex];
    const scaled = absolute / divisor;
    const digits =
      scaled < 100 && Math.abs(scaled - Math.round(scaled)) >= 0.05 ? 1 : 0;
    const rounded = Number(scaled.toFixed(digits));
    if (rounded >= 1_000 && unitIndex > 0) return compact(unitIndex - 1);
    return `${sign}$${rounded.toFixed(digits)}${suffix}`;
  };

  const unitIndex = units.findIndex(({ divisor }) => absolute >= divisor);
  if (unitIndex >= 0) return compact(unitIndex);

  return `${sign}$${Math.round(absolute)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function EosScenarioExplorer() {
  const [amount, setAmount] = useState(100_000);
  const [scenarioId, setScenarioId] = useState<ScenarioId>("treaty");
  const inputId = useId();
  const scenario =
    scenarios.find(({ id }) => id === scenarioId) ?? scenarios[1];
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const outcome = useMemo(
    () => safeAmount * scenario.multiplier,
    [safeAmount, scenario.multiplier],
  );

  return (
    <div
      aria-label="Explore modeled outcomes"
      className="mt-12 border-2 border-foreground"
      id="scenario-explorer"
      role="region"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
        <section className="min-w-0 border-b-2 border-foreground p-5 sm:p-7 lg:border-b-0 lg:border-r-2">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Try your own number
          </p>
          <label
            className="mt-5 block text-sm font-black uppercase"
            htmlFor={inputId}
          >
            Your net worth or annual income
          </label>
          <div className="mt-3 flex border-2 border-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-2">
            <span
              aria-hidden="true"
              className="flex items-center border-r-2 border-foreground px-4 text-2xl font-black"
            >
              $
            </span>
            <input
              className="min-w-0 flex-1 bg-background px-4 py-4 font-mono text-2xl font-black outline-none"
              id={inputId}
              inputMode="numeric"
              min={0}
              onChange={(event) => setAmount(event.target.valueAsNumber)}
              step={1_000}
              type="number"
              value={Number.isFinite(amount) ? amount : ""}
            />
          </div>

          <fieldset className="mt-7 min-w-0">
            <legend className="text-sm font-black uppercase">
              Choose an Earth
            </legend>
            <div className="mt-3 grid">
              {scenarios.map((option, index) => {
                const active = option.id === scenario.id;
                return (
                  <button
                    aria-pressed={active}
                    className={`grid min-h-16 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center border-2 border-foreground px-4 py-3 text-left first:mt-0 ${
                      index > 0 ? "-mt-0.5" : ""
                    } ${
                      active
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                    key={option.id}
                    onClick={() => setScenarioId(option.id)}
                    type="button"
                  >
                    <span>
                      <span className="block font-black">{option.label}</span>
                      <span
                        className={`block text-xs font-bold ${
                          active
                            ? "text-background/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {option.note}
                      </span>
                    </span>
                    <span className="font-mono text-xl font-black">
                      {option.multiplier.toFixed(
                        option.multiplier === 1 ? 0 : 1,
                      )}
                      ×
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section
          aria-live="polite"
          className="flex min-w-0 flex-col justify-between p-5 sm:p-7"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Year 20 / {scenario.label}
            </p>
            <div className="mt-7 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div className="min-w-0 border-y border-foreground py-5">
                <p className="text-xs font-black uppercase text-muted-foreground">
                  Your number now
                </p>
                <p className="mt-2 break-words font-mono text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                  {formatScenarioMoney(safeAmount)}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="text-center text-4xl font-black"
              >
                →
              </span>
              <div className="min-w-0 border-y-2 border-foreground py-5">
                <p className="text-xs font-black uppercase text-muted-foreground">
                  Scaled by the GDP gap
                </p>
                <p className="mt-2 break-words font-mono text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                  {formatScenarioMoney(outcome)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-9 border-t-2 border-foreground pt-5 text-sm font-bold leading-6 text-muted-foreground">
            {scenario.id === "status-quo" ? (
              <p>The status quo is the comparison point: 1× the baseline.</p>
            ) : scenario.id === "treaty" ? (
              <p>
                The current model puts global GDP under the 1% Treaty path at{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20
                  }
                  valueOverride="1.71×"
                />{" "}
                the year-20 baseline.
              </p>
            ) : (
              <p>
                The full-optimization model reaches{" "}
                <ParameterValue
                  param={
                    WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20
                  }
                  valueOverride="56.7×"
                />{" "}
                the year-20 baseline.
              </p>
            )}
            <p className="mt-3 text-foreground">
              This scales your number by the modeled GDP difference so the
              scenario is tangible. It is not a Class B price forecast, an
              expected return, an offering, or investment advice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
