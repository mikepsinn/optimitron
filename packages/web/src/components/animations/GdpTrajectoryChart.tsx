"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  generateTrajectoryData,
  computeCollapseYears,
  PROJECTION_YEARS,
} from "@/data/collapse-constants";

const WIDTH = 800;
const HEIGHT = 400;
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
  data: { year: number; value: number }[],
  maxY: number,
): string {
  return data
    .map((d, i) => {
      const x = xScale(d.year);
      const y = yScale(d.value, maxY);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function GdpTrajectoryChart({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const data = generateTrajectoryData();
  const collapseYears = computeCollapseYears();
  const collapseYear = START_YEAR + collapseYears;

  const maxDestructive = data[data.length - 1]!.destructive;
  const maxProductive = data[data.length - 1]!.productive;
  const maxY = Math.ceil(Math.max(maxDestructive, maxProductive) / 50) * 50;

  const productivePath = buildPath(
    data.map((d) => ({ year: d.year, value: d.productive })),
    maxY,
  );
  const destructivePath = buildPath(
    data.map((d) => ({ year: d.year, value: d.destructive })),
    maxY,
  );

  // Grid lines
  const yTicks: number[] = [];
  for (let v = 0; v <= maxY; v += 50) {
    yTicks.push(v);
  }
  const xTicks: number[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y += 5) {
    xTicks.push(y);
  }

  const collapseX = xScale(collapseYear);
  const dangerStartX = xScale(Math.ceil(collapseYear));

  const shouldAnimate = isInView && !prefersReducedMotion;

  return (
    <div ref={ref} className={className}>
      <p className="text-sm text-black/50 font-bold uppercase tracking-wider text-center mb-3">
        Here. I drew you a picture since numbers apparently aren&apos;t enough.
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="GDP trajectory chart showing productive GDP growing slowly at 3% while the destructive economy grows at 15%, crossing the collapse threshold around 2031"
      >
        <desc>
          Two lines diverge from 2024. The productive GDP line (green) grows
          steadily from $115T at 3% per year. The destructive economy line (red)
          starts at $13.2T but grows at 15% per year, creating a hockey-stick
          curve. They approach a danger zone around 2031 when the destructive
          economy reaches 25% of GDP.
        </desc>

        {/* Grid lines */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={PADDING.left}
              y1={yScale(v, maxY)}
              x2={WIDTH - PADDING.right}
              y2={yScale(v, maxY)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={yScale(v, maxY) + 4}
              textAnchor="end"
              className="text-[11px]"
              fill="#6b7280"
            >
              ${v}T
            </text>
          </g>
        ))}
        {xTicks.map((year) => (
          <g key={`x-${year}`}>
            <line
              x1={xScale(year)}
              y1={PADDING.top}
              x2={xScale(year)}
              y2={HEIGHT - PADDING.bottom}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={xScale(year)}
              y={HEIGHT - PADDING.bottom + 20}
              textAnchor="middle"
              className="text-[11px]"
              fill="#6b7280"
            >
              {year}
            </text>
          </g>
        ))}

        {/* Danger zone */}
        <motion.rect
          x={dangerStartX}
          y={PADDING.top}
          width={WIDTH - PADDING.right - dangerStartX}
          height={HEIGHT - PADDING.top - PADDING.bottom}
          fill="rgba(220, 38, 38, 0.08)"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        />

        {/* Collapse line */}
        <motion.line
          x1={collapseX}
          y1={PADDING.top}
          x2={collapseX}
          y2={HEIGHT - PADDING.bottom}
          stroke="#dc2626"
          strokeWidth={2}
          strokeDasharray="6 4"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        />
        <motion.text
          x={collapseX}
          y={PADDING.top - 8}
          textAnchor="middle"
          className="text-[11px] font-bold"
          fill="#dc2626"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          25% THRESHOLD
        </motion.text>

        {/* Productive GDP line */}
        <motion.path
          d={productivePath}
          fill="none"
          stroke="#059669"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={
            shouldAnimate
              ? { pathLength: 1 }
              : { pathLength: prefersReducedMotion ? 1 : 0 }
          }
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Destructive economy line */}
        <motion.path
          d={destructivePath}
          fill="none"
          stroke="#dc2626"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={
            shouldAnimate
              ? { pathLength: 1 }
              : { pathLength: prefersReducedMotion ? 1 : 0 }
          }
          transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Legend */}
        <g transform={`translate(${PADDING.left + 10}, ${PADDING.top + 10})`}>
          <rect x={0} y={0} width={12} height={3} fill="#059669" />
          <text x={16} y={5} className="text-[11px]" fill="#059669">
            Productive GDP (3%/yr)
          </text>
          <rect x={0} y={16} width={12} height={3} fill="#dc2626" />
          <text x={16} y={21} className="text-[11px]" fill="#dc2626">
            Destructive Economy (15%/yr)
          </text>
        </g>

        {/* Axis labels */}
        <text
          x={WIDTH / 2}
          y={HEIGHT - 5}
          textAnchor="middle"
          className="text-[12px] font-bold"
          fill="#374151"
        >
          Year
        </text>
        <text
          x={15}
          y={HEIGHT / 2}
          textAnchor="middle"
          className="text-[12px] font-bold"
          fill="#374151"
          transform={`rotate(-90, 15, ${HEIGHT / 2})`}
        >
          Trillions (USD)
        </text>
      </svg>
    </div>
  );
}
