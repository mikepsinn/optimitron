"use client";

import { SlideBase } from "../slide-base";

export function SlidePrizeMechanism() {
  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-3xl text-emerald-400 text-center">
          HOW THE PRIZE WORKS
        </h1>

        {/* Flow Diagram */}
        <div className="w-full space-y-4">
          {/* Entry */}
          <div className="flex justify-center">
            <div className="font-pixel text-base md:text-lg text-zinc-300 bg-zinc-900 border border-zinc-600 rounded px-4 py-2">
              YOU ($100)
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center font-pixel text-zinc-500 text-lg">
            ▼
          </div>

          {/* Smart Contract */}
          <div className="flex justify-center">
            <div className="font-pixel text-sm md:text-base text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded px-4 py-2">
              PRIZE POOL SMART CONTRACT
            </div>
          </div>

          {/* Branching Arrow */}
          <div className="flex justify-center font-pixel text-zinc-500 text-sm">
            ◀──────── ▼ ────────▶
          </div>

          {/* Two Paths */}
          <div className="grid grid-cols-2 gap-4">
            {/* Path 1: Targets Hit */}
            <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-lg p-4 space-y-3 shadow-lg shadow-emerald-500/5">
              <div className="font-pixel text-sm md:text-base text-emerald-400 text-center">
                🌍 TARGETS HIT
              </div>
              <div className="space-y-2">
                <div className="font-pixel text-sm md:text-base text-zinc-400">
                  Pool unlocks
                </div>
                <div className="font-pixel text-sm md:text-base text-zinc-400">
                  VOTE holders split it
                </div>
                <div className="font-pixel text-base md:text-lg text-emerald-400">
                  $194K per friend
                </div>
              </div>
            </div>

            {/* Path 2: Targets Missed */}
            <div className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-lg p-4 space-y-3 shadow-lg shadow-emerald-500/5">
              <div className="font-pixel text-sm md:text-base text-emerald-300 text-center">
                ❌ TARGETS MISSED
              </div>
              <div className="space-y-2">
                <div className="font-pixel text-sm md:text-base text-zinc-400">
                  Your $100 →
                </div>
                <div className="font-pixel text-base md:text-lg text-emerald-400">
                  $1,110 back
                </div>
                <div className="font-pixel text-sm md:text-base text-zinc-500">
                  (11× over 15 years at 17%)
                </div>
              </div>
            </div>
          </div>

          {/* Both glow */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400/60 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/60 animate-pulse" />
          </div>
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-lg md:text-2xl text-emerald-300 text-center">
          No path where you lose.
        </p>
      </div>
    </SlideBase>
  );
}
