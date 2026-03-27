"use client";

import { SlideBase } from "../slide-base";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  GAME_PARAMS,
} from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const currentHALE = GLOBAL_HALE_CURRENT.value;
const projectedHALE = Math.round(TREATY_PROJECTED_HALE_YEAR_15.value * 10) / 10;
const haleGain = Math.round((TREATY_PROJECTED_HALE_YEAR_15.value - GLOBAL_HALE_CURRENT.value) * 10) / 10;
const currentGDPperCapita = Math.round(CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value / 100) * 100;
const projectedGDPperCapita = GAME_PARAMS.projectedGDPperCapita;

export function SlideScoreboard() {
  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-3xl text-amber-400 text-center">
          📖 QUEST LOG — EARTH OPTIMIZATION
        </h1>

        <div className="w-full space-y-5">
          {/* Objective 1 */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-3xl text-amber-400">
              OBJECTIVE 1: HEALTHY LIFE EXPECTANCY
            </div>
            <div className="flex justify-between font-pixel text-xl md:text-2xl text-zinc-200">
              <span>
                Current:{" "}
                <span className="text-zinc-300">
                  {currentHALE} years
                </span>
              </span>
              <span>
                Target:{" "}
                <span className="text-emerald-400">
                  {projectedHALE} years
                </span>
                <span className="text-emerald-500 ml-1">
                  (+{haleGain})
                </span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-4 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-zinc-700 w-0 rounded" />
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-xl text-zinc-200">
                0%
              </div>
            </div>
          </div>

          {/* Objective 2 */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-3xl text-amber-400">
              OBJECTIVE 2: GLOBAL MEDIAN INCOME
            </div>
            <div className="flex justify-between font-pixel text-xl md:text-2xl text-zinc-200">
              <span>
                Current:{" "}
                <span className="text-zinc-300">
                  {formatCurrency(currentGDPperCapita)}/year
                </span>
              </span>
              <span>
                Target:{" "}
                <span className="text-emerald-400">
                  {formatCurrency(projectedGDPperCapita)}
                  /year
                </span>
                <span className="text-emerald-500 ml-1">(8×)</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-4 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-zinc-700 w-0 rounded" />
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-xl text-zinc-200">
                0%
              </div>
            </div>
          </div>

          {/* Deadline & Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 mb-1">
                DEADLINE
              </div>
              <div className="font-pixel text-2xl md:text-3xl text-red-400">2040</div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                (14 years)
              </div>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 mb-1">
                REWARD
              </div>
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400">8B</div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                lives aligned
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <p className="font-pixel text-xl md:text-2xl text-zinc-200 text-center italic max-w-4xl">
          &ldquo;Move these two numbers. Everything else follows.&rdquo;
          <span className="text-zinc-300 ml-1">— Wishonia</span>
        </p>
      </div>
    </SlideBase>
  );
}
