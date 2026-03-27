"use client";

import { SlideBase } from "../slide-base";
import {
  GAME_PARAMS,
  TREATY_PERSONAL_UPSIDE_BLEND,
} from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

const personalLifetimeLoss = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value / 100_000) * 100_000;

export function SlideAsymmetry() {
  const [flashVisible, setFlashVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlashVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1700px] mx-auto">
        {/* Trade Comparison */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center w-full">
          {/* Left: Tiny copper coin */}
          <div className="flex flex-col items-center gap-3 p-4 bg-zinc-900/80 border border-zinc-700 rounded-lg">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-800 to-amber-950 rounded-full flex items-center justify-center border-2 border-amber-700/50">
              <span className="font-pixel text-xl text-amber-600">¢</span>
            </div>
            <div className="text-center space-y-1">
              <div className="font-pixel text-xl md:text-3xl text-zinc-300">
                ${GAME_PARAMS.costPerVote.toFixed(2)}
              </div>
              <div className="font-pixel text-xl text-zinc-200">
                30 seconds of your time
              </div>
            </div>
          </div>

          {/* Trade Arrow */}
          <div className="flex flex-col items-center gap-2">
            <div className="font-pixel text-xl text-zinc-200">TRADE</div>
            <div className="text-2xl text-amber-400">⇄</div>
          </div>

          {/* Right: Comically large gold pile */}
          <div className="flex flex-col items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="text-xl md:text-3xl">
                  🪙
                </span>
              ))}
            </div>
            <div className="text-center space-y-1">
              <div className="font-pixel text-xl md:text-3xl text-amber-400">
                {formatCurrency(personalLifetimeLoss)}
              </div>
              <div className="font-pixel text-xl text-zinc-200">
                lifetime income gain
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate - Flashing */}
        <div
          className="font-pixel text-xl md:text-3xl text-center px-6 py-3 bg-amber-500/10 border border-amber-500/40 rounded"
          style={{ opacity: flashVisible ? 1 : 0.4 }}
        >
          <span className="text-amber-400">EXCHANGE RATE: </span>
          <span className="text-amber-300">
            {GAME_PARAMS.exchangeRatio.toLocaleString()} : 1
          </span>
        </div>
      </div>
    </SlideBase>
  );
}
