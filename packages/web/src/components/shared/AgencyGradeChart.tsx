"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { AgencyPerformance, AgencyGrade } from "@optimitron/data";

const OUTCOME_COLORS = [
  "var(--brutal-pink)",
  "var(--brutal-yellow)",
  "var(--muted-foreground)",
  "var(--brutal-red)",
];

const gradeColors: Record<AgencyGrade, string> = {
  A: "bg-brutal-cyan text-brutal-cyan-foreground",
  B: "bg-brutal-cyan text-brutal-cyan-foreground",
  C: "bg-brutal-yellow text-brutal-yellow-foreground",
  D: "bg-brutal-yellow text-brutal-yellow-foreground",
  F: "bg-brutal-red text-brutal-red-foreground",
};

const gradeBorderColors: Record<AgencyGrade, string> = {
  A: "border-brutal-cyan",
  B: "border-brutal-cyan",
  C: "border-brutal-yellow",
  D: "border-brutal-yellow",
  F: "border-brutal-red",
};

function formatCompact(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

interface AgencyGradeChartProps {
  agency: AgencyPerformance;
  compact?: boolean;
  /** Show all outcome lines (default: just primary) */
  showAllOutcomes?: boolean;
}

export function AgencyGradeChart({
  agency,
  compact = false,
  showAllOutcomes = false,
}: AgencyGradeChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  const spend = agency.spendingTimeSeries;
  const primaryOutcome = agency.outcomes[0];
  if (!primaryOutcome || spend.length < 2 || primaryOutcome.data.length < 2) return null;

  const outcomesToShow = showAllOutcomes ? agency.outcomes : [primaryOutcome];

  // SVG dimensions
  const W = compact ? 320 : 400;
  const H = compact ? 160 : 240;
  const PAD = { top: 24, right: 50, bottom: 30, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Combine year ranges from all series
  const allYears = [
    ...spend.map((p) => p.year),
    ...outcomesToShow.flatMap((o) => o.data.map((p) => p.year)),
  ];
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const yearRange = maxYear - minYear || 1;

  const xScale = (year: number) =>
    PAD.left + ((year - minYear) / yearRange) * plotW;

  // Spending scale (left axis)
  const spendMin = Math.min(...spend.map((p) => p.value));
  const spendMax = Math.max(...spend.map((p) => p.value));
  const spendRange = (spendMax - spendMin) * 1.2 || 1;
  const spendBase = spendMin - (spendMax - spendMin) * 0.1;
  const spendScale = (v: number) =>
    PAD.top + plotH - ((v - spendBase) / spendRange) * plotH;

  // Primary outcome scale (right axis)
  const outcomeMin = Math.min(...primaryOutcome.data.map((p) => p.value));
  const outcomeMax = Math.max(...primaryOutcome.data.map((p) => p.value));
  const outcomeRange = (outcomeMax - outcomeMin) * 1.2 || 1;
  const outcomeBase = outcomeMin - (outcomeMax - outcomeMin) * 0.1;
  const outcomeScale = (v: number) =>
    PAD.top + plotH - ((v - outcomeBase) / outcomeRange) * plotH;

  const spendPath = spend
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${spendScale(p.value)}`)
    .join(" ");

  // Build paths for all outcome lines (each uses primary scale for simplicity)
  const outcomePaths = outcomesToShow.map((o) =>
    o.data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${outcomeScale(p.value)}`)
      .join(" "),
  );

  // Annotations — filter to visible year range
  const annotations = (agency.annotations ?? []).filter(
    (a) => a.year >= minYear && a.year <= maxYear,
  );

  return (
    <div
      ref={ref}
      className={`border-4 border-primary ${gradeBorderColors[agency.grade]} bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-grow min-w-0">
          <h4 className="text-sm font-black uppercase text-foreground truncate">
            {agency.emoji} {agency.agencyName}
          </h4>
          {!compact && (
            <p className="text-xs font-bold text-muted-foreground truncate">
              {agency.mission}
            </p>
          )}
        </div>
        <div
          className={`shrink-0 ml-2 w-10 h-10 flex items-center justify-center border-4 border-primary ${gradeColors[agency.grade]} font-black text-xl`}
        >
          {agency.grade}
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${agency.agencyName}: Grade ${agency.grade}`}
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

        {/* Annotation markers — vertical dashed lines with labels */}
        {!compact &&
          annotations.map((ann, i) => {
            const x = xScale(ann.year);
            return (
              <g key={`ann-${i}`}>
                <line
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={PAD.top + plotH}
                  stroke="var(--brutal-red)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
                <text
                  x={x}
                  y={PAD.top + 8 + (i % 3) * 8}
                  textAnchor="middle"
                  className="fill-brutal-red text-[6px] font-bold"
                >
                  {ann.year}
                </text>
              </g>
            );
          })}

        {/* Spending line (cyan) */}
        <motion.path
          d={spendPath}
          fill="none"
          stroke="var(--brutal-cyan)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? {} : { pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Outcome lines */}
        {outcomePaths.map((path, idx) => (
          <motion.path
            key={`outcome-${idx}`}
            d={path}
            fill="none"
            stroke={OUTCOME_COLORS[idx % OUTCOME_COLORS.length]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, delay: 0.4 + idx * 0.2 }}
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

        {/* Left axis label (spending) */}
        <text
          x={5}
          y={PAD.top + 4}
          textAnchor="start"
          className="fill-brutal-cyan text-[8px] font-black"
        >
          {formatCompact(spendMax)}
        </text>

        {/* Right axis label (outcome) */}
        <text
          x={W - 5}
          y={PAD.top + 4}
          textAnchor="end"
          className="fill-brutal-pink text-[8px] font-black"
        >
          {formatCompact(outcomeMax)}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-brutal-cyan" />
          <span className="text-[9px] font-bold text-muted-foreground">
            {compact ? "Spending" : agency.spendingLabel}
          </span>
        </div>
        {outcomesToShow.map((o, idx) => (
          <div key={o.label} className="flex items-center gap-1">
            <div
              className="w-3 h-0.5"
              style={{
                backgroundColor:
                  OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
              }}
            />
            <span className="text-[9px] font-bold text-muted-foreground">
              {o.emoji} {compact ? "Outcome" : o.label}
            </span>
          </div>
        ))}
      </div>

      {/* Annotation list (non-compact only) */}
      {!compact && annotations.length > 0 && (
        <div className="mt-2 space-y-1">
          {annotations.map((ann, i) => (
            <p key={i} className="text-[9px] font-bold text-muted-foreground leading-tight">
              <span className="text-brutal-red font-black">{ann.year}</span>{" "}
              {ann.url ? (
                <a
                  href={ann.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brutal-pink transition-colors"
                >
                  {ann.label} ↗
                </a>
              ) : (
                ann.label
              )}
            </p>
          ))}
        </div>
      )}

      {/* Rationale */}
      {!compact && (
        <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
          {agency.gradeRationale}
        </p>
      )}
    </div>
  );
}
