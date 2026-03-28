"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const currentHALE = GLOBAL_HALE_CURRENT.value;
const treatyHALE = Math.round(TREATY_PROJECTED_HALE_YEAR_15.value * 10) / 10;
const optimalHALE = 74.1; // Japan — best achievable HALE globally
const maxHALE = 80; // scale max

const currentIncome = Math.round(CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value / 100) * 100;
const treatyIncome = GAME_PARAMS.projectedGDPperCapita;
const optimalIncome = 528_000; // Switzerland PPP — best achievable
const maxIncome = 600_000; // scale max

function ProgressBar({
  current,
  treaty,
  optimal,
  max,
  currentLabel,
  treatyLabel,
  optimalLabel,
  color,
}: {
  current: number;
  treaty: number;
  optimal: number;
  max: number;
  currentLabel: string;
  treatyLabel: string;
  optimalLabel: string;
  color: string;
}) {
  const currentPct = (current / max) * 100;
  const treatyPct = (treaty / max) * 100;
  const optimalPct = (optimal / max) * 100;

  return (
    <div className="space-y-1">
      <div className="relative h-8 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
        {/* Current level fill */}
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-1000"
          style={{ width: `${currentPct}%`, backgroundColor: color, opacity: 0.6 }}
        />
        {/* Treaty target marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-emerald-400"
          style={{ left: `${treatyPct}%` }}
        />
        {/* Optimal governance marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-amber-400"
          style={{ left: `${optimalPct}%` }}
        />
      </div>
      {/* Legend */}
      <div className="flex justify-between font-pixel text-lg md:text-xl">
        <span className="text-zinc-400">▮ {currentLabel}</span>
        <span className="text-emerald-400">│ {treatyLabel}</span>
        <span className="text-amber-400">│ {optimalLabel}</span>
      </div>
    </div>
  );
}

export function SlideWinConditionsHaleIncome() {
  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto w-full">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-amber-400 text-center">
          📖 QUEST LOG — EARTH OPTIMIZATION
        </h1>

        <div className="w-full space-y-6">
          {/* Objective 1: HALE */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-6 space-y-3">
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">
              ❤️ OBJECTIVE 1: HEALTHY LIFE EXPECTANCY
            </div>
            <div className="flex flex-wrap gap-x-8 font-pixel text-xl md:text-2xl text-zinc-200">
              <span>Current: <span className="text-zinc-300">{currentHALE} yrs</span></span>
              <span>Treaty: <span className="text-emerald-400">{treatyHALE} yrs</span></span>
              <span>Optimal: <span className="text-amber-400">{optimalHALE} yrs</span></span>
            </div>
            <ProgressBar
              current={currentHALE}
              treaty={treatyHALE}
              optimal={optimalHALE}
              max={maxHALE}
              currentLabel={`${currentHALE} yrs`}
              treatyLabel={`${treatyHALE} yrs`}
              optimalLabel={`${optimalHALE} yrs (Japan)`}
              color="#ef4444"
            />
          </div>

          {/* Objective 2: Income */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-6 space-y-3">
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">
              💰 OBJECTIVE 2: GLOBAL MEDIAN INCOME
            </div>
            <div className="flex flex-wrap gap-x-8 font-pixel text-xl md:text-2xl text-zinc-200">
              <span>Current: <span className="text-zinc-300">{formatCurrency(currentIncome)}/yr</span></span>
              <span>Treaty: <span className="text-emerald-400">{formatCurrency(treatyIncome)}/yr</span></span>
              <span>Optimal: <span className="text-amber-400">{formatCurrency(optimalIncome)}/yr</span></span>
            </div>
            <ProgressBar
              current={currentIncome}
              treaty={treatyIncome}
              optimal={optimalIncome}
              max={maxIncome}
              currentLabel={formatCurrency(currentIncome)}
              treatyLabel={formatCurrency(treatyIncome)}
              optimalLabel={`${formatCurrency(optimalIncome)} (CH)`}
              color="#3b82f6"
            />
          </div>

          {/* Deadline & Reward */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="font-pixel text-2xl md:text-3xl text-zinc-200 mb-2">⏰ DEADLINE</div>
              <div className="font-pixel text-4xl md:text-5xl text-red-400">2040</div>
              <div className="font-pixel text-2xl md:text-3xl text-zinc-200 mt-1">(14 years)</div>
            </div>
            <div className="text-center p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="font-pixel text-2xl md:text-3xl text-zinc-200 mb-2">🏆 REWARD</div>
              <div className="font-pixel text-4xl md:text-5xl text-emerald-400">8B</div>
              <div className="font-pixel text-2xl md:text-3xl text-zinc-200 mt-1">lives aligned</div>
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
