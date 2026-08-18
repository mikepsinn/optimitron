"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedLineChart } from "../../animations/sierra/animated-line-chart";
import { formatCurrency } from "@/lib/demo/formatters";
import {
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  GDP_BASELINE_GROWTH_RATE,
  GLOBAL_HALE_CURRENT,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_20,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  WISHONIA_HALE_GAIN_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

/* ── Derived values ──────────────────────────────────────────────── */

const currentGDPperCapita = Math.round(CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value / 100) * 100;
const statusQuoRate = GDP_BASELINE_GROWTH_RATE.value * 100;
const treatyRate = Math.round(TREATY_TRAJECTORY_CAGR_YEAR_20.value * 1000) / 10;
const wishoniaRate = Math.round(WISHONIA_TRAJECTORY_CAGR_YEAR_20.value * 1000) / 10;

const treatyHaleGain = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const wishoniaHaleGain = Math.round(WISHONIA_HALE_GAIN_YEAR_15.value * 10) / 10;

const treatyMultiplier = Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);
const wishoniaMultiplier = Math.round(WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);

interface TrajectoryStats {
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  growth: string;
  gdpPerCapita2045: string;
  lifetimeIncome: string;
  multiplier: string;
  hale: string;
}

const TRAJECTORIES: TrajectoryStats[] = [
  {
    label: "STATUS QUO",
    color: "#ef4444",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    growth: `${statusQuoRate}%`,
    gdpPerCapita2045: formatCurrency(Math.round(currentGDPperCapita * Math.pow(1 + statusQuoRate / 100, 20))),
    lifetimeIncome: formatCurrency(Math.round(CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value)),
    multiplier: "1×",
    hale: `${GLOBAL_HALE_CURRENT.value.toFixed(1)} yrs`,
  },
  {
    label: "1% TREATY",
    color: "#22c55e",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    growth: `${treatyRate}%`,
    gdpPerCapita2045: formatCurrency(Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_20.value)),
    lifetimeIncome: formatCurrency(Math.round(TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value)),
    multiplier: `${treatyMultiplier}×`,
    hale: `+${treatyHaleGain} yrs`,
  },
  {
    label: "WISHONIA",
    color: "#eab308",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    growth: `${wishoniaRate}%`,
    gdpPerCapita2045: formatCurrency(Math.round(WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_20.value)),
    lifetimeIncome: formatCurrency(Math.round(WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value)),
    multiplier: `${wishoniaMultiplier}×`,
    hale: `+${wishoniaHaleGain} yrs`,
  },
];

export function SlideGdp20YearForecast() {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  const baselineData = Array.from({ length: 21 }, (_, i) => ({
    x: 2025 + i,
    y: currentGDPperCapita * Math.pow(1 + statusQuoRate / 100, i),
  }));

  const treatyData = Array.from({ length: 21 }, (_, i) => ({
    x: 2025 + i,
    y: currentGDPperCapita * Math.pow(1 + treatyRate / 100, i),
  }));

  const wishoniaData = Array.from({ length: 21 }, (_, i) => ({
    x: 2025 + i,
    y: currentGDPperCapita * Math.pow(1 + wishoniaRate / 100, i),
  }));

  return (
    <SierraSlideWrapper act={2} className="text-amber-400">
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeSlideUp 0.5s ease-out forwards; }
      `}</style>

      <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center mb-4">
        📈 COMPOUND RETURNS — SAME PLANET, DIFFERENT SLIDER
      </h1>

      <div className="w-full max-w-[1700px] mx-auto space-y-4">
        {/* Chart */}
        <div className="bg-black/30 border border-amber-500/30 rounded p-4">
          <AnimatedLineChart
            lines={[
              { points: baselineData, color: "#ef4444", label: "Status Quo", dashed: true },
              { points: treatyData, color: "#22c55e", label: "1% Treaty" },
              { points: wishoniaData, color: "#eab308", label: "Wishonia" },
            ]}
            width={500}
            height={200}
            animate
            duration={2500}
            showArea
            showGrid
            xAxisLabel="Year"
            yAxisLabel="GDP/Capita"
            formatY={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`}
            formatX={(v) => Math.round(v).toString()}
          />
        </div>

        {/* Stats cards — appear after chart finishes drawing */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-3 transition-all duration-700 ${
            showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {TRAJECTORIES.map((t) => (
            <div
              key={t.label}
              className={`${t.bgColor} border ${t.borderColor} rounded p-3 space-y-2`}
            >
              <div className={`font-pixel text-lg md:text-xl ${t.textColor} text-center`}>
                {t.label}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="font-pixel text-xs text-zinc-500">GROWTH</div>
                <div className={`font-pixel text-sm md:text-base ${t.textColor} text-right`}>{t.growth}</div>

                <div className="font-pixel text-xs text-zinc-500">2045 INCOME</div>
                <div className={`font-pixel text-sm md:text-base ${t.textColor} text-right`}>{t.gdpPerCapita2045}</div>

                <div className="font-pixel text-xs text-zinc-500">LIFETIME</div>
                <div className={`font-pixel text-sm md:text-base ${t.textColor} text-right`}>
                  {t.lifetimeIncome} <span className="text-zinc-400">({t.multiplier})</span>
                </div>

                <div className="font-pixel text-xs text-zinc-500">HALE</div>
                <div className={`font-pixel text-sm md:text-base ${t.textColor} text-right`}>{t.hale}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideGdp20YearForecast;
