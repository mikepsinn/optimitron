"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  TREATY_PERSONAL_UPSIDE_BLEND,
  TREATY_HALE_GAIN_YEAR_15,
  VOTE_TOKEN_VALUE,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

const personalLifetimeLoss = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value / 100_000) * 100_000;
const haleGain = TREATY_HALE_GAIN_YEAR_15.value;
const votePointValue = Math.round(VOTE_TOKEN_VALUE.value);

export function SlideVoteValueAsymmetry() {
  const [flashVisible, setFlashVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlashVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <SlideBase act={2} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center">
          RETURN ON 15 MINUTES OF YOUR TIME
        </h1>
        <div className="font-terminal text-xl md:text-2xl text-zinc-200 text-center">
          Vote (30 sec) + get 10 friends to vote (15 min) = lifetime ROI
        </div>

        {/* Trade Comparison */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center w-full">
          {/* Left: Your investment */}
          <div className="flex flex-col items-center gap-3 p-5 bg-zinc-900/80 border border-zinc-700 rounded-lg">
            <div className="text-4xl md:text-5xl">⏱️</div>
            <div className="text-center space-y-1">
              <div className="font-pixel text-2xl md:text-4xl text-zinc-300">
                15 minutes
              </div>
              <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                vote + share with 10 friends
              </div>
              <div className="font-pixel text-xl md:text-2xl text-zinc-400 mt-1">
                (cost: ${GAME_PARAMS.costPerVote.toFixed(2)} of your time)
              </div>
            </div>
          </div>

          {/* Trade Arrow */}
          <div className="flex flex-col items-center gap-2">
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">→</div>
          </div>

          {/* Right: What you get */}
          <div className="flex flex-col items-center gap-3 p-5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="text-2xl md:text-3xl">
                  🪙
                </span>
              ))}
            </div>
            <div className="text-center space-y-1">
              <div className="font-pixel text-2xl md:text-4xl text-amber-400">
                {formatCurrency(personalLifetimeLoss)}
              </div>
              <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                lifetime income gain
              </div>
            </div>
          </div>
        </div>

        {/* Additional gains */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="text-3xl md:text-4xl">🏥</div>
            <div className="font-pixel text-2xl md:text-4xl text-emerald-400">
              +{haleGain.toFixed(1)} yrs
            </div>
            <div className="font-pixel text-xl md:text-2xl text-zinc-200">
              extra healthy life
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="text-3xl md:text-4xl">🎫</div>
            <div className="font-pixel text-2xl md:text-4xl text-cyan-400">
              {formatCurrency(votePointValue)}
            </div>
            <div className="font-pixel text-xl md:text-2xl text-zinc-200">
              per VOTE point if treaty passes
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
