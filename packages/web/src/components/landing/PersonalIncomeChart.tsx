"use client";

import { useState, useRef, useMemo } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
  GDP_BASELINE_GROWTH_RATE,
  US_MEDIAN_HOUSEHOLD_INCOME_2023,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  fmtParam,
} from "@optimitron/data/parameters";
const YEARS = 20;
const DEFAULT_INCOME = US_MEDIAN_HOUSEHOLD_INCOME_2023.value;

const scenarios = [
  {
    id: "treaty",
    label: "1% Treaty",
    rate: TREATY_TRAJECTORY_CAGR_YEAR_20.value,
    color: "#00c8c8",
    description: "Redirect 1% of military spending to health R&D",
    lifetimeGainLabel: `${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})} per capita`,
  },
  {
    id: "wishonia",
    label: "Full Optimization",
    rate: WISHONIA_TRAJECTORY_CAGR_YEAR_20.value,
    color: "#f472b6",
    description: "Full Optimitron governance optimization",
    lifetimeGainLabel: `${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})} per capita`,
  },
];

const CURRENT_RATE = GDP_BASELINE_GROWTH_RATE.value;

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function computeTrajectory(start: number, rate: number, years: number): number[] {
  const pts: number[] = [];
  for (let y = 0; y <= years; y++) {
    pts.push(start * Math.pow(1 + rate, y));
  }
  return pts;
}

export function PersonalIncomeChart() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const scenario = scenarios[scenarioIdx]!;
  const current = useMemo(() => computeTrajectory(income, CURRENT_RATE, YEARS), [income]);
  const optimized = useMemo(
    () => computeTrajectory(income, scenario.rate, YEARS),
    [income, scenario.rate],
  );

  const maxVal = optimized[YEARS]!;
  const totalCurrentEarnings = current.reduce((a, b) => a + b, 0);
  const totalOptimizedEarnings = optimized.reduce((a, b) => a + b, 0);
  const lifetimeLost = totalOptimizedEarnings - totalCurrentEarnings;
  const multiplier = (optimized[YEARS]! / current[YEARS]!).toFixed(0);

  // SVG dimensions
  const svgW = 800;
  const svgH = 320;
  const padL = 80;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  function x(year: number): number {
    return padL + (year / YEARS) * chartW;
  }
  function y(val: number): number {
    return padT + chartH - (val / maxVal) * chartH;
  }

  const currentPath = current
    .map((val, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val).toFixed(1)}`)
    .join(" ");
  const optimizedPath = optimized
    .map((val, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val).toFixed(1)}`)
    .join(" ");

  // Fill area between curves
  const fillPath =
    optimized
      .map((val, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val).toFixed(1)}`)
      .join(" ") +
    " " +
    current
      .slice()
      .reverse()
      .map((val, i) => `L${x(YEARS - i).toFixed(1)},${y(val).toFixed(1)}`)
      .join(" ") +
    " Z";

  // Y-axis ticks (log-friendly)
  const yTicks: number[] = [];
  const rawStep = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  for (let v = 0; v <= maxVal; v += tickStep) {
    yTicks.push(v);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
          How Rich Would You Be?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
          Enter your income. See what {YEARS} years of compounding looks like with
          and without the {fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})} governance dysfunction tax.
        </p>
      </motion.div>

      <div ref={ref} className="max-w-4xl mx-auto">
        {/* Controls row */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-4 mb-8"
        >
          {/* Income input */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <label
              htmlFor="income-input"
              className="text-sm font-black uppercase text-muted-foreground"
            >
              Your Annual Income:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">$</span>
              <input
                id="income-input"
                type="number"
                value={income}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0 && v < 10_000_000) setIncome(v);
                }}
                className="w-32 px-3 py-2 border-4 border-primary font-black text-lg text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
              />
              <span className="text-sm font-bold text-muted-foreground">/year</span>
            </div>
            <button
              onClick={() => setIncome(DEFAULT_INCOME)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Reset to median
            </button>
          </div>

          {/* Scenario toggle */}
          <div className="flex items-center justify-center gap-2">
            {scenarios.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setScenarioIdx(i)}
                className={`px-4 py-2 text-xs font-black uppercase border-4 border-primary transition-all ${
                  scenarioIdx === i
                    ? "bg-foreground text-background shadow-none translate-x-[2px] translate-y-[2px]"
                    : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* SVG Chart */}
        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-4"
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Income trajectory chart: status quo vs ${scenario.label} over ${YEARS} years`}
          >
            {/* Grid lines */}
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={padL}
                  y1={y(v)}
                  x2={svgW - padR}
                  y2={y(v)}
                  stroke="#0001"
                  strokeDasharray="4 4"
                />
                <text
                  x={padL - 8}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="fill-black/30 text-[10px] font-bold"
                >
                  {formatCurrency(v)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {Array.from({ length: YEARS / 5 + 1 }, (_, i) => i * 5).map((yr) => (
              <text
                key={yr}
                x={x(yr)}
                y={svgH - 5}
                textAnchor="middle"
                className="fill-black/30 text-[10px] font-bold"
              >
                {yr === 0 ? "Now" : `+${yr}yr`}
              </text>
            ))}

            {/* Fill between curves */}
            <motion.path
              key={`fill-${scenario.id}`}
              d={fillPath}
              fill={`${scenario.color}18`}
              initial={reduced ? {} : { opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.8 }}
            />

            {/* Current trajectory */}
            <motion.path
              d={currentPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              initial={reduced ? {} : { pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            />

            {/* Optimized trajectory */}
            <motion.path
              key={`line-${scenario.id}`}
              d={optimizedPath}
              fill="none"
              stroke={scenario.color}
              strokeWidth="3"
              strokeLinecap="round"
              initial={reduced ? {} : { pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            />

            {/* End point labels */}
            <motion.g
              initial={reduced ? {} : { opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 1.8 }}
            >
              <text
                x={x(YEARS) - 5}
                y={y(current[YEARS]!) + 16}
                textAnchor="end"
                className="fill-[#ef4444] text-[11px] font-black"
              >
                {formatCurrency(current[YEARS]!)}
              </text>
              <text
                x={x(YEARS) - 5}
                y={y(optimized[YEARS]!) - 8}
                textAnchor="end"
                style={{ fill: scenario.color }}
                className="text-[11px] font-black"
              >
                {formatCurrency(optimized[YEARS]!)} ({multiplier}x)
              </text>
            </motion.g>

            {/* Legend */}
            <rect x={padL + 10} y={padT + 5} width={10} height={10} fill="#ef4444" />
            <text x={padL + 24} y={padT + 14} className="fill-black/60 text-[10px] font-bold">
              Status quo ({(CURRENT_RATE * 100).toFixed(1)}%/yr)
            </text>
            <rect x={padL + 10} y={padT + 22} width={10} height={10} fill={scenario.color} />
            <text x={padL + 24} y={padT + 31} className="fill-black/60 text-[10px] font-bold">
              {scenario.label} ({(scenario.rate * 100).toFixed(1)}%/yr)
            </text>
          </svg>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6"
        >
          <div className="p-4 border-4 border-primary bg-background text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              {YEARS}-Year Status Quo Total
            </div>
            <div className="text-xl font-black text-brutal-red">
              {formatCurrency(totalCurrentEarnings)}
            </div>
          </div>
          <div className="p-4 border-4 border-primary bg-background text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              {YEARS}-Year {scenario.label} Total
            </div>
            <div className="text-xl font-black text-brutal-cyan">
              {formatCurrency(totalOptimizedEarnings)}
            </div>
          </div>
          <div className="p-4 border-4 border-primary bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-brutal-yellow-foreground mb-1">
              Your Dysfunction Tax
            </div>
            <div className="text-xl font-black text-brutal-yellow-foreground">
              {formatCurrency(lifetimeLost)}
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={reduced ? {} : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="text-center text-xs text-muted-foreground mt-4 font-bold max-w-2xl mx-auto"
        >
          Based on current GDP growth (~2.5%) vs. modelled trajectories from the{" "}
          <a
            href="https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground"
          >
            GDP Trajectories analysis
          </a>
          . 1% Treaty: 17.9% CAGR from military reallocation + research spillovers.
          Full Optimization: 25.4% CAGR from complete governance reform.
          Projections are illustrative — the compounding gap is real regardless of exact rates.
        </motion.p>
      </div>
    </section>
  );
}
