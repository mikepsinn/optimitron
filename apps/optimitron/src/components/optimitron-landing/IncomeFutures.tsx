"use client";

import { useId, useState } from "react";
import {
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  type Parameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { wholeUsd } from "./format";
import {
  INCOME_END_YEAR,
  INCOME_START_YEAR,
  STATUS_QUO_INCOME_PATH,
  TREATY_INCOME_PATH,
  incomeMultipleAt,
  type IncomeAnchor,
} from "./income-futures";
import { LandingSection, accentTextClass } from "./LandingSection";

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const CHART_TOP = 12;
const CHART_BOTTOM = CHART_HEIGHT - 2;
const TOP_MULTIPLE = incomeMultipleAt(TREATY_INCOME_PATH, INCOME_END_YEAR);

// Both lines scale with the reader's income, so the shape never changes:
// the chart is drawn once as multiples and only the numbers update.
function pathPoints(path: readonly IncomeAnchor[]): string {
  const points: string[] = [];
  for (let year = INCOME_START_YEAR; year <= INCOME_END_YEAR; year++) {
    const x =
      ((year - INCOME_START_YEAR) / (INCOME_END_YEAR - INCOME_START_YEAR)) *
      CHART_WIDTH;
    const y =
      CHART_BOTTOM -
      (incomeMultipleAt(path, year) / TOP_MULTIPLE) * (CHART_BOTTOM - CHART_TOP);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

const STATUS_QUO_POINTS = pathPoints(STATUS_QUO_INCOME_PATH);
const CHART_YEAR_TICKS = Array.from(
  { length: (INCOME_END_YEAR - INCOME_START_YEAR) / 5 + 1 },
  (_, index) => INCOME_START_YEAR + index * 5,
);
const WORLD_MEDIAN_INCOME = Math.round(GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value);
const TREATY_POINTS = pathPoints(TREATY_INCOME_PATH);

function IncomeChart() {
  return (
    <div>
      <svg
        aria-hidden="true"
        className="block h-auto w-full overflow-visible"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <line
          className="stroke-foreground/20"
          strokeWidth={1}
          x1={0}
          x2={CHART_WIDTH}
          y1={CHART_HEIGHT - 0.5}
          y2={CHART_HEIGHT - 0.5}
        />
        <polyline
          className="stroke-foreground"
          fill="none"
          points={STATUS_QUO_POINTS}
          strokeWidth={2}
        />
        <polyline
          className="stroke-brutal-cyan"
          fill="none"
          points={TREATY_POINTS}
          strokeWidth={3}
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-sm text-muted-foreground">
        {CHART_YEAR_TICKS.map((year) => (
          <span key={year}>{year}</span>
        ))}
      </div>
    </div>
  );
}

function parseIncome(raw: string): number {
  const value = Number(raw.replace(/[^0-9]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

/**
 * At the default (the world median) each result is the published parameter,
 * so it keeps its source link. A typed income is a scenario, shown plain.
 */
function IncomeResult({ atDefault, param, value }: { atDefault: boolean; param: Parameter; value: number }) {
  return atDefault ? <ParameterValue param={param} valueOverride={wholeUsd(value)} /> : <>{wholeUsd(value)}</>;
}

export function IncomeFuturesSection() {
  const inputId = useId();
  const [income, setIncome] = useState(WORLD_MEDIAN_INCOME);
  const atDefault = income === WORLD_MEDIAN_INCOME;
  const statusQuo = income * incomeMultipleAt(STATUS_QUO_INCOME_PATH, INCOME_END_YEAR);
  const treaty = income * incomeMultipleAt(TREATY_INCOME_PATH, INCOME_END_YEAR);

  return (
    <LandingSection
      id="income"
      note="If your income follows the world median’s path"
      title="Your income, two futures"
    >
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <label
            className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground"
            htmlFor={inputId}
          >
            Your after-tax income per year
          </label>
          <div className="mt-2 flex items-center border-b-2 border-foreground">
            <span aria-hidden="true" className="font-mono text-3xl font-bold">
              $
            </span>
            <input
              className="w-full min-w-0 bg-transparent px-1 py-2 font-mono text-3xl font-bold tabular-nums outline-none"
              id={inputId}
              inputMode="numeric"
              onChange={(event) => setIncome(parseIncome(event.target.value))}
              value={income > 0 ? income.toLocaleString("en-US") : ""}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Starts at the world median,{" "}
            <ParameterValue
              param={GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025}
              valueOverride={wholeUsd(GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value)}
            />
            . Type yours.
          </p>
          <div className="mt-6 flex flex-col gap-3 text-base">
            <p className="flex items-baseline justify-between gap-6">
              <span className="text-muted-foreground">
                <span aria-hidden="true" className="mr-2 inline-block h-0.5 w-5 bg-foreground align-middle" />
                In {INCOME_END_YEAR}, current path
              </span>{" "}
              <span className="font-mono font-bold tabular-nums">
                <IncomeResult
                  atDefault={atDefault}
                  param={CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15}
                  value={statusQuo}
                />
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-6">
              <span className="text-muted-foreground">
                <span aria-hidden="true" className="mr-2 inline-block h-1 w-5 bg-brutal-cyan align-middle" />
                In {INCOME_END_YEAR}, with the 1% Treaty
              </span>{" "}
              <span className={`font-mono text-xl font-bold tabular-nums ${accentTextClass}`}>
                <IncomeResult
                  atDefault={atDefault}
                  param={TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15}
                  value={treaty}
                />
              </span>
            </p>
          </div>
        </div>
        <IncomeChart />
      </div>
    </LandingSection>
  );
}
