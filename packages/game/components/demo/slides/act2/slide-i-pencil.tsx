"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

export function SlideIPencil() {
  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-amber-400 text-center">
          BILLIONS OF BRAINS
        </h1>

        {/* Central pencil → test tube icon */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-4xl">✏️</span>
          <span className="font-pixel text-xl text-amber-500/50">→</span>
          <span className="text-4xl">🧪</span>
        </div>

        {/* Supply chain text */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
          <p className="font-terminal text-xs text-zinc-300 leading-relaxed">
            Nobody knows how to make a pencil. Millions of people each doing one
            tiny step.
          </p>
        </div>

        {/* Counter displays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xs text-zinc-500 mb-2">
              BRAINS INCENTIVIZED
            </div>
            <div className="font-pixel text-xl md:text-2xl text-amber-400">
              4,000,000,000
            </div>
          </div>

          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xs text-zinc-500 mb-2">
              VOTE POINT VALUE
            </div>
            <div className="font-pixel text-xl md:text-2xl text-emerald-400">
              {formatCurrency(GAME_PARAMS.valuePerVotePoint)}
            </div>
          </div>

          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xs text-zinc-500 mb-2">
              PRIZE POOL
            </div>
            <div className="font-pixel text-xl md:text-2xl text-yellow-400">
              {formatCurrency(GAME_PARAMS.prizePoolTotal)}
            </div>
          </div>
        </div>

        {/* Key text */}
        <p className="font-pixel text-sm md:text-xs text-zinc-400 text-center italic">
          You do not need a plan. You need an incentive.
        </p>
      </div>
    </SlideBase>
  );
}
