"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface DataPoint {
  year: number;
  value: number;
}

interface Outcome {
  metric: string;
  unit: string;
  direction: "higher" | "lower";
  data: DataPoint[];
}

interface ExperimentTimeSeriesChartProps {
  outcomes: Outcome[];
  interventionYear: number;
  jurisdiction: string;
}

const SERIES_COLORS = [
  "var(--brutal-pink)",
  "var(--brutal-cyan)",
  "var(--brutal-yellow)",
];

export function ExperimentTimeSeriesChart({
  outcomes,
  interventionYear,
  jurisdiction,
}: ExperimentTimeSeriesChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  if (outcomes.length === 0) return null;

  return (
    <div ref={ref} className="space-y-4">
      {outcomes.map((outcome, idx) => (
        <OutcomeChart
          key={outcome.metric}
          outcome={outcome}
          interventionYear={interventionYear}
          jurisdiction={jurisdiction}
          color={SERIES_COLORS[idx % SERIES_COLORS.length]!}
          isInView={isInView}
          reduced={reduced}
        />
      ))}
    </div>
  );
}

function OutcomeChart({
  outcome,
  interventionYear,
  jurisdiction,
  color,
  isInView,
  reduced,
}: {
  outcome: Outcome;
  interventionYear: number;
  jurisdiction: string;
  color: string;
  isInView: boolean;
  reduced: boolean | null;
}) {
  const data = outcome.data;
  if (data.length < 2) return null;

  const W = 400;
  const H = 200;
  const PAD = { top: 20, right: 15, bottom: 35, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const years = data.map((d) => d.year);
  const values = data.map((d) => d.value);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearRange = maxYear - minYear || 1;

  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const vPad = (vMax - vMin) * 0.1 || 1;
  const vLow = vMin - vPad;
  const vHigh = vMax + vPad;
  const vRange = vHigh - vLow;

  const xScale = (year: number) =>
    PAD.left + ((year - minYear) / yearRange) * plotW;
  const yScale = (v: number) =>
    PAD.top + plotH - ((v - vLow) / vRange) * plotH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.year)} ${yScale(d.value)}`)
    .join(" ");

  const interventionX = xScale(interventionYear);
  const interventionInRange =
    interventionYear >= minYear && interventionYear <= maxYear;

  // Format axis value labels
  const fmt = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toFixed(0);
  };

  return (
    <div className="border-4 border-primary bg-background p-3">
      <div className="mb-1">
        <span className="text-xs font-black uppercase text-foreground">
          {outcome.metric}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground ml-2">
          ({outcome.unit})
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${outcome.metric} in ${jurisdiction} — ${minYear} to ${maxYear}`}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={PAD.left}
            y1={PAD.top + plotH * (1 - pct)}
            x2={PAD.left + plotW}
            y2={PAD.top + plotH * (1 - pct)}
            stroke="currentColor"
            strokeOpacity={0.07}
            strokeDasharray="4 4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((pct) => {
          const val = vLow + pct * vRange;
          return (
            <text
              key={pct}
              x={PAD.left - 5}
              y={PAD.top + plotH * (1 - pct) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[8px] font-bold"
            >
              {fmt(val)}
            </text>
          );
        })}

        {/* Pre-intervention zone */}
        {interventionInRange && (
          <rect
            x={PAD.left}
            y={PAD.top}
            width={interventionX - PAD.left}
            height={plotH}
            fill="currentColor"
            fillOpacity={0.03}
          />
        )}

        {/* Intervention year marker */}
        {interventionInRange && (
          <>
            <motion.line
              x1={interventionX}
              y1={PAD.top}
              x2={interventionX}
              y2={PAD.top + plotH}
              stroke="var(--brutal-red)"
              strokeWidth={2}
              strokeDasharray="6 4"
              initial={reduced ? {} : { pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
            <text
              x={interventionX}
              y={PAD.top - 5}
              textAnchor="middle"
              className="fill-brutal-red text-[8px] font-black"
            >
              {interventionYear} — Policy enacted
            </text>
          </>
        )}

        {/* Data line */}
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? {} : { pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        {/* Data points */}
        {data.map((d) => (
          <circle
            key={d.year}
            cx={xScale(d.year)}
            cy={yScale(d.value)}
            r={2}
            fill={color}
            opacity={isInView ? 1 : 0}
          />
        ))}

        {/* Year labels */}
        <text
          x={xScale(minYear)}
          y={H - 5}
          textAnchor="start"
          className="fill-muted-foreground text-[9px] font-bold"
        >
          {minYear}
        </text>
        <text
          x={xScale(maxYear)}
          y={H - 5}
          textAnchor="end"
          className="fill-muted-foreground text-[9px] font-bold"
        >
          {maxYear}
        </text>
        {interventionInRange && (
          <text
            x={interventionX}
            y={H - 5}
            textAnchor="middle"
            className="fill-brutal-red text-[9px] font-black"
          >
            {interventionYear}
          </text>
        )}
      </svg>
    </div>
  );
}
