"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  DESTRUCTIVE_BASE_T,
  DESTRUCTIVE_CAGR,
  GLOBAL_GDP_T,
  PRODUCTIVE_CAGR,
  PROJECTION_YEARS,
  TREATY_CAGR,
  WISHONIA_CAGR,
  COLLAPSE_RATIO,
  computeCollapseYears,
} from "@/data/collapse-constants";

const WIDTH = 800;
const HEIGHT = 440;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

const START_YEAR = 2024;
const END_YEAR = START_YEAR + PROJECTION_YEARS;

function xScale(year: number): number {
  return (
    PADDING.left +
    ((year - START_YEAR) / (END_YEAR - START_YEAR)) *
      (WIDTH - PADDING.left - PADDING.right)
  );
}

function yScale(value: number, maxY: number): number {
  return (
    HEIGHT -
    PADDING.bottom -
    (value / maxY) * (HEIGHT - PADDING.top - PADDING.bottom)
  );
}

function buildPath(
  points: { year: number; value: number }[],
  maxY: number,
): string {
  return points
    .map((d, i) => {
      const x = xScale(d.year);
      const y = yScale(d.value, maxY);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

interface Trajectory {
  label: string;
  color: string;
  points: { year: number; value: number }[];
}

function generateAllTrajectories(): { trajectories: Trajectory[]; maxY: number } {
  const statusQuo: { year: number; value: number }[] = [];
  const treaty: { year: number; value: number }[] = [];
  const wishonia: { year: number; value: number }[] = [];
  const productive: { year: number; value: number }[] = [];

  const treatyCagr = DESTRUCTIVE_CAGR * TREATY_CAGR;
  const wishoniaCagr = DESTRUCTIVE_CAGR * WISHONIA_CAGR;

  for (let t = 0; t <= PROJECTION_YEARS; t++) {
    const year = START_YEAR + t;
    const gdp = GLOBAL_GDP_T * Math.pow(1 + PRODUCTIVE_CAGR, t);
    productive.push({ year, value: gdp });
    statusQuo.push({ year, value: DESTRUCTIVE_BASE_T * Math.pow(1 + DESTRUCTIVE_CAGR, t) });
    treaty.push({ year, value: DESTRUCTIVE_BASE_T * Math.pow(1 + treatyCagr, t) });
    wishonia.push({ year, value: DESTRUCTIVE_BASE_T * Math.pow(1 + wishoniaCagr, t) });
  }

  const maxVal = Math.max(
    statusQuo[statusQuo.length - 1]!.value,
    productive[productive.length - 1]!.value,
  );
  const maxY = Math.ceil(maxVal / 50) * 50;

  return {
    trajectories: [
      { label: "Productive GDP (3%/yr)", color: "#059669", points: productive },
      { label: "Status Quo — Destructive (15%/yr)", color: "#dc2626", points: statusQuo },
      { label: "1% Treaty Trajectory", color: "#f59e0b", points: treaty },
      { label: "Optimal Governance", color: "#7bddea", points: wishonia },
    ],
    maxY,
  };
}

export function GdpTrajectoryChart({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const { trajectories, maxY } = generateAllTrajectories();
  const collapseYears = computeCollapseYears();
  const collapseYear = START_YEAR + collapseYears;
  const collapseX = xScale(collapseYear);

  // 50% threshold line
  const fiftyPctYear = START_YEAR + 15; // from DESTRUCTIVE_ECONOMY_YEARS_TO_50PCT_GDP
  const fiftyPctX = xScale(fiftyPctYear);

  // Grid
  const yTicks: number[] = [];
  for (let v = 0; v <= maxY; v += 50) yTicks.push(v);
  const xTicks: number[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y += 5) xTicks.push(y);

  const shouldAnimate = isInView && !prefersReducedMotion;

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="GDP trajectory chart showing four scenarios: status quo collapse, productive GDP, 1% Treaty, and optimal governance"
      >
        {/* Grid */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={PADDING.left} y1={yScale(v, maxY)}
              x2={WIDTH - PADDING.right} y2={yScale(v, maxY)}
              stroke="#e5e7eb" strokeWidth={1}
            />
            <text
              x={PADDING.left - 8} y={yScale(v, maxY) + 4}
              textAnchor="end" className="text-[11px]" fill="#6b7280"
            >
              ${v}T
            </text>
          </g>
        ))}
        {xTicks.map((year) => (
          <g key={`x-${year}`}>
            <line
              x1={xScale(year)} y1={PADDING.top}
              x2={xScale(year)} y2={HEIGHT - PADDING.bottom}
              stroke="#e5e7eb" strokeWidth={1}
            />
            <text
              x={xScale(year)} y={HEIGHT - PADDING.bottom + 20}
              textAnchor="middle" className="text-[11px]" fill="#6b7280"
            >
              {year}
            </text>
          </g>
        ))}

        {/* Danger zone (25% to edge) */}
        <motion.rect
          x={Math.ceil(collapseX)} y={PADDING.top}
          width={WIDTH - PADDING.right - Math.ceil(collapseX)}
          height={HEIGHT - PADDING.top - PADDING.bottom}
          fill="rgba(220, 38, 38, 0.06)"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        />

        {/* 25% threshold line */}
        <motion.line
          x1={collapseX} y1={PADDING.top}
          x2={collapseX} y2={HEIGHT - PADDING.bottom}
          stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        />
        <motion.text
          x={collapseX} y={PADDING.top - 8}
          textAnchor="middle" className="text-[10px] font-bold" fill="#dc2626"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          25% GDP — UNSTABLE
        </motion.text>

        {/* 50% threshold line */}
        <motion.line
          x1={fiftyPctX} y1={PADDING.top}
          x2={fiftyPctX} y2={HEIGHT - PADDING.bottom}
          stroke="#991b1b" strokeWidth={2} strokeDasharray="3 3"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.8, duration: 0.5 }}
        />
        <motion.text
          x={fiftyPctX + 4} y={PADDING.top + 15}
          textAnchor="start" className="text-[10px] font-bold" fill="#991b1b"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 3, duration: 0.5 }}
        >
          50% — GAME OVER
        </motion.text>

        {/* Trajectory lines */}
        {trajectories.map((traj, i) => (
          <motion.path
            key={traj.label}
            d={buildPath(traj.points, maxY)}
            fill="none"
            stroke={traj.color}
            strokeWidth={i === 0 ? 2 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={i === 0 ? "4 4" : undefined}
            initial={{ pathLength: 0 }}
            animate={
              shouldAnimate
                ? { pathLength: 1 }
                : { pathLength: prefersReducedMotion ? 1 : 0 }
            }
            transition={{ duration: 2, ease: "easeInOut", delay: i * 0.2 }}
          />
        ))}

        {/* Legend */}
        <g transform={`translate(${PADDING.left + 10}, ${PADDING.top + 10})`}>
          {trajectories.map((traj, i) => (
            <g key={traj.label} transform={`translate(0, ${i * 18})`}>
              <line
                x1={0} y1={0} x2={14} y2={0}
                stroke={traj.color} strokeWidth={3}
                strokeDasharray={i === 0 ? "4 4" : undefined}
              />
              <text x={20} y={4} className="text-[11px] font-bold" fill={traj.color}>
                {traj.label}
              </text>
            </g>
          ))}
        </g>

        {/* Axis labels */}
        <text
          x={WIDTH / 2} y={HEIGHT - 5}
          textAnchor="middle" className="text-[12px] font-bold" fill="#374151"
        >
          Year
        </text>
        <text
          x={15} y={HEIGHT / 2}
          textAnchor="middle" className="text-[12px] font-bold" fill="#374151"
          transform={`rotate(-90, 15, ${HEIGHT / 2})`}
        >
          Trillions (USD)
        </text>
      </svg>
    </div>
  );
}
