"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import efficientFrontierData from "@/data/efficient-frontier.json";

const WIDTH = 800;
const HEIGHT = 400;
const PADDING = { top: 30, right: 30, bottom: 55, left: 75 };

const COLORS: Record<string, string> = {
  health: "#7bddea",
  education: "#ffdd57",
  military: "#ec4699",
  social: "#059669",
  rd: "#a855f7",
};

const LABELS: Record<string, string> = {
  health: "Health",
  education: "Education",
  military: "Military",
  social: "Social Protection",
  rd: "R&D",
};

// Two outcome options: life expectancy (proxy for HALE) and median income (from PIP)
const OUTCOME_CONFIGS = {
  lifeExpectancy: {
    field: "avgLifeExpectancy",
    label: "Life Expectancy (yrs)",
    format: (v: number) => v.toFixed(1),
  },
  medianIncome: {
    field: "avgMedianIncome",
    label: "Median Income ($/yr PPP)",
    format: (v: number) => `$${(v / 1000).toFixed(0)}K`,
  },
} as const;

interface DecilePoint {
  decile: number;
  count: number;
  avgSpending: number;
  [key: string]: number;
}

interface CategoryData {
  label: string;
  spendingField: string;
  deciles: DecilePoint[];
}

type CategoriesMap = Record<string, CategoryData>;

/**
 * Efficient Frontier Chart — shows spending vs outcomes across deciles.
 * Each category shows diminishing returns: more spending ≠ better outcomes past the optimal point.
 */
export function EfficientFrontierChart({
  category = "health",
  outcome = "lifeExpectancy",
  className = "",
}: {
  category?: string;
  outcome?: "lifeExpectancy" | "medianIncome";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const categories = (efficientFrontierData as unknown as { categories: CategoriesMap }).categories;
  const cat = categories[category];
  if (!cat) return null;

  const outcomeConfig = OUTCOME_CONFIGS[outcome];
  const outcomeField = outcomeConfig.field;
  const points = cat.deciles
    .map((d) => ({
      x: d.avgSpending,
      y: d[outcomeField] as number,
      decile: d.decile,
    }))
    .filter((p) => p.y > 0);

  const xMin = 0;
  const xMax = Math.max(...points.map((p) => p.x)) * 1.1;
  const yMin = Math.min(...points.map((p) => p.y)) * 0.98;
  const yMax = Math.max(...points.map((p) => p.y)) * 1.02;

  const xScale = (v: number) =>
    PADDING.left + ((v - xMin) / (xMax - xMin)) * (WIDTH - PADDING.left - PADDING.right);
  const yScale = (v: number) =>
    HEIGHT - PADDING.bottom - ((v - yMin) / (yMax - yMin)) * (HEIGHT - PADDING.top - PADDING.bottom);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x)},${yScale(p.y)}`)
    .join(" ");

  const color = COLORS[category] ?? "#ec4699";
  const shouldAnimate = isInView && !reduced;

  // X-axis ticks
  const xTicks: number[] = [];
  const xStep = xMax > 10000 ? 2000 : xMax > 5000 ? 1000 : 500;
  for (let v = 0; v <= xMax; v += xStep) xTicks.push(v);

  // Y-axis ticks
  const yRange = yMax - yMin;
  const yStep = yRange > 20 ? 5 : yRange > 10 ? 2 : 1;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) yTicks.push(v);

  return (
    <div ref={ref} className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img">
        {/* Grid */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line x1={PADDING.left} y1={yScale(v)} x2={WIDTH - PADDING.right} y2={yScale(v)} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PADDING.left - 8} y={yScale(v) + 4} textAnchor="end" className="text-[11px]" fill="#6b7280">
              {outcomeConfig.format(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <g key={`x-${v}`}>
            <line x1={xScale(v)} y1={PADDING.top} x2={xScale(v)} y2={HEIGHT - PADDING.bottom} stroke="#e5e7eb" strokeWidth={1} />
            <text x={xScale(v)} y={HEIGHT - PADDING.bottom + 18} textAnchor="middle" className="text-[11px]" fill="#6b7280">
              ${(v / 1000).toFixed(0)}K
            </text>
          </g>
        ))}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={shouldAnimate ? { pathLength: 1 } : { pathLength: reduced ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Points */}
        {points.map((p) => (
          <motion.circle
            key={p.decile}
            cx={xScale(p.x)}
            cy={yScale(p.y)}
            r={5}
            fill={color}
            stroke="#000"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0 }}
            transition={{ delay: 0.1 * p.decile, duration: 0.3 }}
          />
        ))}

        {/* Labels */}
        <text x={WIDTH / 2} y={HEIGHT - 5} textAnchor="middle" className="text-[12px] font-bold" fill="#374151">
          Spending per Capita (USD PPP)
        </text>
        <text x={15} y={HEIGHT / 2} textAnchor="middle" className="text-[12px] font-bold" fill="#374151" transform={`rotate(-90, 15, ${HEIGHT / 2})`}>
          {outcomeConfig.label}
        </text>
      </svg>
    </div>
  );
}

/**
 * Summary stats from the efficient frontier analysis.
 */
export function EfficientFrontierSummary({ className = "" }: { className?: string }) {
  const totals = (efficientFrontierData as { totals: { usCurrentTotalPerCapita: number; efficientFrontierTotalPerCapita: number; ratio: number } }).totals;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div className="border-4 border-primary bg-brutal-red p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="text-2xl font-black text-brutal-red-foreground">
          ${Math.round(totals.usCurrentTotalPerCapita).toLocaleString()}
        </div>
        <div className="text-xs font-black uppercase text-brutal-red-foreground">
          US Current Spend/Capita
        </div>
      </div>
      <div className="border-4 border-primary bg-brutal-cyan p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="text-2xl font-black text-brutal-cyan-foreground">
          ${Math.round(totals.efficientFrontierTotalPerCapita).toLocaleString()}
        </div>
        <div className="text-xs font-black uppercase text-brutal-cyan-foreground">
          Efficient Frontier/Capita
        </div>
      </div>
      <div className="border-4 border-primary bg-brutal-yellow p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="text-2xl font-black text-brutal-yellow-foreground">
          {totals.ratio.toFixed(1)}x
        </div>
        <div className="text-xs font-black uppercase text-brutal-yellow-foreground">
          Overspend Ratio
        </div>
      </div>
    </div>
  );
}
