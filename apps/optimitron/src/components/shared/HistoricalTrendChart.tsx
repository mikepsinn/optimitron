"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { AgencyHistoricalTrend } from "@optimitron/data/datasets/agency-historical-trends";

const SERIES_COLORS = [
  "var(--foreground)",
  "var(--background)",
  "var(--background)",
  "#888",
];

interface HistoricalTrendChartProps {
  trend: AgencyHistoricalTrend;
  /** Which series indices to show (default: all) */
  seriesIndices?: number[];
  compact?: boolean;
}

export function HistoricalTrendChart({
  trend,
  seriesIndices,
  compact = false,
}: HistoricalTrendChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  const visibleSeries = seriesIndices
    ? seriesIndices.map((i) => trend.series[i]).filter(Boolean)
    : trend.series;

  if (visibleSeries.length === 0) return null;

  // Use the first series for scaling (primary)
  const primary = visibleSeries[0]!;
  if (primary.data.length < 2) return null;

  // SVG dimensions
  const W = 400;
  const H = compact ? 180 : 240;
  const PAD = { top: 20, right: 15, bottom: 35, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // X scale from all series combined
  const allYears = visibleSeries.flatMap((s) => s.data.map((p) => p.year));
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const yearRange = maxYear - minYear || 1;

  const xScale = (year: number) =>
    PAD.left + ((year - minYear) / yearRange) * plotW;

  // Build per-series scales and paths
  const seriesData = visibleSeries.map((s, idx) => {
    const values = s.data.map((p) => p.value);
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const vRange = (vMax - vMin) * 1.1 || 1;
    const vBase = vMin - (vMax - vMin) * 0.05;

    const yScale = (v: number) =>
      PAD.top + plotH - ((v - vBase) / vRange) * plotH;

    const path = s.data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${yScale(p.value)}`)
      .join(" ");

    return {
      series: s,
      color: SERIES_COLORS[idx % SERIES_COLORS.length]!,
      path,
      vMin,
      vMax,
      yScale,
    };
  });

  const creationX = xScale(trend.creationYear);
  const creationInRange =
    trend.creationYear >= minYear && trend.creationYear <= maxYear;

  return (
    <div
      ref={ref}
      className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
    >
      {/* Header */}
      <div className="mb-2">
        <h4 className="text-sm font-black uppercase text-foreground">
          {trend.agencyName}
        </h4>
        {!compact && (
          <p className="text-xs font-bold text-muted-foreground">
            {trend.question}
          </p>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${trend.agencyName} historical trend since ${minYear}`}
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

        {/* BEFORE zone (lighter background) */}
        {creationInRange && (
          <rect
            x={PAD.left}
            y={PAD.top}
            width={creationX - PAD.left}
            height={plotH}
            fill="currentColor"
            fillOpacity={0.03}
          />
        )}

        {/* Creation year marker */}
        {creationInRange && (
          <>
            <motion.line
              x1={creationX}
              y1={PAD.top}
              x2={creationX}
              y2={PAD.top + plotH}
              stroke="var(--brutal-red)"
              strokeWidth={2}
              strokeDasharray="6 4"
              initial={reduced ? {} : { pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
            <text
              x={creationX}
              y={PAD.top - 5}
              textAnchor="middle"
              className="fill-brutal-red text-[8px] font-black"
            >
              {trend.creationYear} — Created
            </text>
          </>
        )}

        {/* Data lines */}
        {seriesData.map((sd, idx) => (
          <motion.path
            key={sd.series.label}
            d={sd.path}
            fill="none"
            stroke={sd.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3 + idx * 0.3 }}
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
        {creationInRange && (
          <text
            x={creationX}
            y={H - 5}
            textAnchor="middle"
            className="fill-brutal-red text-[9px] font-black"
          >
            {trend.creationYear}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-1">
        {seriesData.map((sd) => (
          <div key={sd.series.label} className="flex items-center gap-1">
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: sd.color }}
            />
            <span className="text-[9px] font-bold text-muted-foreground">
              {sd.series.label}
            </span>
          </div>
        ))}
        {creationInRange && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-brutal-red" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--brutal-red) 0 3px, transparent 3px 6px)" }} />
            <span className="text-[9px] font-black text-brutal-red">
              Agency Created
            </span>
          </div>
        )}
      </div>

      {/* Finding */}
      {!compact && (
        <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
          {trend.finding}
        </p>
      )}
    </div>
  );
}
