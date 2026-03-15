"use client";

import { useState, useRef, useMemo } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const YEARS = 30;
const CURRENT_GROWTH = 0.02; // 2% annual real income growth (status quo)
const OPTIMIZED_GROWTH = 0.047; // 4.7% with dysfunction removed ($2-$4 ROI on health spending)
const DEFAULT_INCOME = 37000; // US median personal income

function formatCurrency(n: number): string {
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
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const current = useMemo(() => computeTrajectory(income, CURRENT_GROWTH, YEARS), [income]);
  const optimized = useMemo(() => computeTrajectory(income, OPTIMIZED_GROWTH, YEARS), [income]);

  const maxVal = optimized[YEARS]!;
  const totalCurrentEarnings = current.reduce((a, b) => a + b, 0);
  const totalOptimizedEarnings = optimized.reduce((a, b) => a + b, 0);
  const lifetimeLost = totalOptimizedEarnings - totalCurrentEarnings;

  // SVG dimensions
  const svgW = 800;
  const svgH = 320;
  const padL = 70;
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

  // Y-axis ticks
  const yTicks: number[] = [];
  const tickStep = Math.pow(10, Math.floor(Math.log10(maxVal))) / 2;
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
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
          How Rich Would You Be?
        </h2>
        <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
          Enter your income. See what 30 years of compounding looks like with
          and without the $101 trillion governance dysfunction tax.
        </p>
      </motion.div>

      <div ref={ref} className="max-w-4xl mx-auto">
        {/* Income input */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <label
            htmlFor="income-input"
            className="text-sm font-black uppercase text-black/60"
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
              className="w-32 px-3 py-2 border-4 border-black font-black text-lg text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />
            <span className="text-sm font-bold text-black/40">/year</span>
          </div>
          <button
            onClick={() => setIncome(DEFAULT_INCOME)}
            className="text-xs font-bold text-black/40 hover:text-black underline transition-colors"
          >
            Reset to median
          </button>
        </motion.div>

        {/* SVG Chart */}
        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-4"
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto"
            role="img"
            aria-label="Income trajectory chart comparing current growth vs optimized growth over 30 years"
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
            {[0, 5, 10, 15, 20, 25, 30].map((yr) => (
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
              d={fillPath}
              fill="rgba(0, 200, 200, 0.12)"
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
              d={optimizedPath}
              fill="none"
              stroke="#00c8c8"
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
                className="fill-[#00c8c8] text-[11px] font-black"
              >
                {formatCurrency(optimized[YEARS]!)}
              </text>
            </motion.g>

            {/* Legend */}
            <rect x={padL + 10} y={padT + 5} width={10} height={10} fill="#ef4444" />
            <text x={padL + 24} y={padT + 14} className="fill-black/60 text-[10px] font-bold">
              Status quo (2%/yr)
            </text>
            <rect x={padL + 10} y={padT + 22} width={10} height={10} fill="#00c8c8" />
            <text x={padL + 24} y={padT + 31} className="fill-black/60 text-[10px] font-bold">
              Optimized (4.7%/yr)
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
          <div className="p-4 border-2 border-black bg-white text-center">
            <div className="text-xs font-black uppercase text-black/50 mb-1">
              30-Year Status Quo Total
            </div>
            <div className="text-xl font-black text-brutal-red">
              {formatCurrency(totalCurrentEarnings)}
            </div>
          </div>
          <div className="p-4 border-2 border-black bg-white text-center">
            <div className="text-xs font-black uppercase text-black/50 mb-1">
              30-Year Optimized Total
            </div>
            <div className="text-xl font-black text-brutal-cyan">
              {formatCurrency(totalOptimizedEarnings)}
            </div>
          </div>
          <div className="p-4 border-4 border-black bg-brutal-yellow shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-xs font-black uppercase text-black/50 mb-1">
              Your Dysfunction Tax
            </div>
            <div className="text-xl font-black text-black">
              {formatCurrency(lifetimeLost)}
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={reduced ? {} : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="text-center text-xs text-black/30 mt-4 font-medium max-w-2xl mx-auto"
        >
          Based on historical real income growth (~2%) vs. projected growth with optimised governance (~4.7%,
          derived from $2–$4 return per $1 in health/education investment). These are illustrative projections,
          not guarantees — but the compounding gap is real regardless of exact rates.
        </motion.p>
      </div>
    </section>
  );
}
