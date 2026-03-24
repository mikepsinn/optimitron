"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface MilitaryVsTrialsPieProps {
  militaryPct: number;
  trialsPct: number;
  militaryDollars: number;
  trialsDollars: number;
  /** Size in px */
  size?: number;
  /** Label for military spending slice */
  militaryLabel?: string;
}

function formatDollars(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

/**
 * SVG pie chart showing military (red) vs clinical trials (cyan).
 * The tiny cyan sliver makes the absurdity visceral.
 */
export function MilitaryVsTrialsPie({
  militaryPct,
  trialsPct,
  militaryDollars,
  trialsDollars,
  size = 240,
  militaryLabel = "organized suffering",
}: MilitaryVsTrialsPieProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  const total = militaryPct + trialsPct;
  if (total === 0) {
    return (
      <div ref={ref} className="text-center">
        <div className="text-lg font-black text-muted-foreground">No votes recorded</div>
      </div>
    );
  }

  const milFraction = militaryPct / total;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4; // padding for border

  // SVG arc path for the military slice
  const milAngle = milFraction * 2 * Math.PI;
  const milEndX = cx + r * Math.sin(milAngle);
  const milEndY = cy - r * Math.cos(milAngle);
  const largeArc = milFraction > 0.5 ? 1 : 0;

  // Military slice path (starts at top, goes clockwise)
  const milPath = milFraction >= 1
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
    : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${milEndX} ${milEndY} Z`;

  // Trials slice is the remainder
  const trialsPath = milFraction >= 1
    ? "" // No trials slice if 100% military
    : milFraction <= 0
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${cx} ${cy} L ${milEndX} ${milEndY} A ${r} ${r} 0 ${1 - largeArc} 1 ${cx} ${cy - r} Z`;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        role="img"
        aria-label={`${militaryPct}% military, ${trialsPct}% clinical trials`}
      >
        {/* Military slice (red) */}
        <motion.path
          d={milPath}
          fill="var(--brutal-red)"
          initial={reduced ? {} : { scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* Trials slice (cyan) — often barely visible */}
        {trialsPath && (
          <motion.path
            d={trialsPath}
            fill="var(--brutal-cyan)"
            initial={reduced ? {} : { scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-brutal-red-foreground text-[11px] font-black"
        >
          {militaryPct.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          className="fill-brutal-red-foreground text-[9px] font-bold"
        >
          {militaryLabel}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-brutal-red border-2 border-primary" />
          <span className="text-xs font-black text-foreground">
            {militaryLabel} {formatDollars(militaryDollars)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-brutal-cyan border-2 border-primary" />
          <span className="text-xs font-black text-foreground">
            Testing Medicines {formatDollars(trialsDollars)}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-muted-foreground mt-1">
        {trialsPct > 0 ? `${trialsPct.toFixed(trialsPct < 1 ? 2 : 1)}% goes to testing which medicines work` : "0% goes to testing which medicines work"}
      </p>
    </div>
  );
}
