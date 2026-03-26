"use client";

import { SlideBase } from "../slide-base";
import { PARAMETERS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

export function SlideScoreboard() {
  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-amber-400 text-center">
          📖 QUEST LOG — EARTH OPTIMIZATION
        </h1>

        <div className="w-full space-y-5">
          {/* Objective 1 */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xs text-amber-400">
              OBJECTIVE 1: HEALTHY LIFE EXPECTANCY
            </div>
            <div className="flex justify-between font-pixel text-sm text-zinc-400">
              <span>
                Current:{" "}
                <span className="text-zinc-300">
                  {PARAMETERS.health.currentHALE} years
                </span>
              </span>
              <span>
                Target:{" "}
                <span className="text-emerald-400">
                  {PARAMETERS.health.projectedHALE} years
                </span>
                <span className="text-emerald-500 ml-1">
                  (+{PARAMETERS.health.haleGain})
                </span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-4 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-zinc-700 w-0 rounded" />
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-zinc-500">
                0%
              </div>
            </div>
          </div>

          {/* Objective 2 */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xs text-amber-400">
              OBJECTIVE 2: GLOBAL MEDIAN INCOME
            </div>
            <div className="flex justify-between font-pixel text-sm text-zinc-400">
              <span>
                Current:{" "}
                <span className="text-zinc-300">
                  {formatCurrency(PARAMETERS.economic.currentGDPperCapita)}/year
                </span>
              </span>
              <span>
                Target:{" "}
                <span className="text-emerald-400">
                  {formatCurrency(PARAMETERS.economic.projectedGDPperCapita)}
                  /year
                </span>
                <span className="text-emerald-500 ml-1">(8×)</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-4 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-zinc-700 w-0 rounded" />
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-zinc-500">
                0%
              </div>
            </div>
          </div>

          {/* Deadline & Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
              <div className="font-pixel text-xs text-zinc-500 mb-1">
                DEADLINE
              </div>
              <div className="font-pixel text-lg text-red-400">2040</div>
              <div className="font-pixel text-xs text-zinc-500">
                (14 years)
              </div>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <div className="font-pixel text-xs text-zinc-500 mb-1">
                REWARD
              </div>
              <div className="font-pixel text-lg text-emerald-400">8B</div>
              <div className="font-pixel text-xs text-zinc-500">
                lives aligned
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <p className="font-pixel text-sm md:text-xs text-zinc-500 text-center italic max-w-md">
          &ldquo;Move these two numbers. Everything else follows.&rdquo;
          <span className="text-zinc-600 ml-1">— Wishonia</span>
        </p>
      </div>
    </SlideBase>
  );
}
