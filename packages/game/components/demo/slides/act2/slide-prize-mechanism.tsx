"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const vcReturn = `${GAME_PARAMS.prizePoolFallbackMultiple.toFixed(1)}x`;
const depositExample = 100;
const returnOnFail = Math.round(depositExample * GAME_PARAMS.prizePoolFallbackMultiple);

export function SlidePrizeMechanism() {
  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-emerald-400 text-center">
          HOW THE FUND WORKS
        </h1>

        {/* Flow Diagram */}
        <div className="w-full space-y-4">
          {/* Entry */}
          <div className="flex justify-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-300 bg-zinc-900 border border-zinc-600 rounded px-4 py-2">
              YOU (${depositExample})
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center font-pixel text-zinc-200 text-xl">
            ▼
          </div>

          {/* Smart Contract */}
          <div className="flex justify-center">
            <div className="font-pixel text-xl md:text-3xl text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded px-4 py-2">
              VC-DIVERSIFIED FUND ({GAME_PARAMS.prizePoolROI}%/yr)
            </div>
          </div>

          {/* Branching Arrow */}
          <div className="flex justify-center font-pixel text-zinc-200 text-xl">
            ◀──────── ▼ ────────▶
          </div>

          {/* Two Paths */}
          <div className="grid grid-cols-2 gap-4">
            {/* Path 1: Targets Hit */}
            <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-lg p-4 space-y-3 shadow-lg shadow-emerald-500/5">
              <div className="font-pixel text-xl md:text-3xl text-emerald-400 text-center">
                🌍 TREATY PASSES
              </div>
              <div className="space-y-2">
                <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                  Pool unlocks for VOTE holders
                </div>
                <div className="font-pixel text-xl md:text-2xl text-emerald-400">
                  {formatCurrency(GAME_PARAMS.valuePerVotePoint)} per VOTE point
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                  + {vcReturn} fund growth
                </div>
              </div>
            </div>

            {/* Path 2: Targets Missed */}
            <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3 shadow-lg shadow-cyan-500/5">
              <div className="font-pixel text-xl md:text-3xl text-cyan-400 text-center">
                📈 TREATY FAILS
              </div>
              <div className="space-y-2">
                <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                  ${depositExample} →
                </div>
                <div className="font-pixel text-xl md:text-2xl text-cyan-400">
                  {formatCurrency(returnOnFail)} back
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                  ({vcReturn} over 15yr at {GAME_PARAMS.prizePoolROI}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-2xl md:text-4xl text-emerald-300 text-center">
          No path where you lose.
        </p>
      </div>
    </SlideBase>
  );
}
