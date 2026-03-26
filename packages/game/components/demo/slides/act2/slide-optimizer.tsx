"use client";

import { SlideBase } from "../slide-base";

export function SlideOptimizer() {
  return (
    <SlideBase act={2} className="text-cyan-400">
      <div className="flex flex-col items-center justify-center gap-4 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-cyan-400 text-center">
          THE OPTIMIZER
        </h1>
        <div className="font-terminal text-sm text-zinc-400 text-center">
          Policies and Budgets
        </div>

        {/* Two machines side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* LEFT: Policy Generator */}
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-sm text-cyan-400 text-center border-b border-cyan-500/20 pb-2">
              POLICY GENERATOR
            </div>
            <div className="font-pixel text-sm text-zinc-500 text-center">
              Ranked by causal impact
            </div>
            <div className="space-y-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="font-pixel text-xs text-zinc-300">🇵🇹 Portugal</span>
                  <span className="font-pixel text-xs text-emerald-400">-80%</span>
                </div>
                <div className="font-terminal text-sm text-zinc-500">overdose deaths</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="font-pixel text-xs text-zinc-300">🇺🇸 USA</span>
                  <span className="font-pixel text-xs text-red-400">+1,700%</span>
                </div>
                <div className="font-terminal text-sm text-zinc-500">overdose deaths</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Budget Optimizer */}
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-sm text-cyan-400 text-center border-b border-cyan-500/20 pb-2">
              BUDGET OPTIMIZER
            </div>

            {/* Header row */}
            <div className="grid grid-cols-3 gap-2 font-pixel text-xs text-zinc-500">
              <div></div>
              <div className="text-center text-red-400/70">USA CURRENT</div>
              <div className="text-center text-emerald-400/70">USA OPTIMIZED</div>
            </div>

            {/* Healthcare */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xs text-zinc-400">Healthcare</div>
              <div className="text-center">
                <div className="font-pixel text-sm text-red-400">$4.5T</div>
                <div className="font-terminal text-xs text-zinc-600">ranked 37th</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-sm text-emerald-400">$1.1T</div>
                <div className="font-terminal text-xs text-emerald-500/60">ranked 1st</div>
              </div>
            </div>

            {/* Defense */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xs text-zinc-400">Defense</div>
              <div className="text-center">
                <div className="font-pixel text-sm text-red-400">$886B</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-sm text-emerald-400">$200B</div>
              </div>
            </div>

            {/* Education */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xs text-zinc-400">Education</div>
              <div className="text-center">
                <div className="font-pixel text-sm text-red-400">$800B</div>
                <div className="font-terminal text-xs text-zinc-600">declining</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-sm text-emerald-400">$600B</div>
                <div className="font-terminal text-xs text-emerald-500/60">+40%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <p className="font-pixel text-sm md:text-xs text-zinc-400 text-center italic">
          Less money, better outcomes. On every line item.
        </p>
      </div>
    </SlideBase>
  );
}
