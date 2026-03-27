"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { AnimatedLineChart } from "../../animations/animated-line-chart";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlidePrizePool() {
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowComparison(true), 2000);
  }, []);

  // Investment growth comparison (10 years)
  const traditionalData = Array.from({ length: 11 }, (_, i) => ({
    x: i,
    y: 10000 * Math.pow(1.07, i), // 7% annual return
  }));

  const prizePoolData = Array.from({ length: 11 }, (_, i) => ({
    x: i,
    y: 10000 * Math.pow(1.10, i) * (1 + i * 0.05), // 10%+ with impact bonuses
  }));

  return (
    <SlideBase act={2} className="text-amber-400">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="font-pixel text-xl text-amber-400 mb-1">PART 3: THE MONEY</div>
        <h1 className="font-pixel text-3xl md:text-4xl text-amber-400">
          PRIZE POOL INVESTMENT
        </h1>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Investment comparison chart */}
        <div className="bg-black/30 border border-amber-500/30 rounded p-4">
          <div className="font-pixel text-xl text-amber-400 mb-3">
            10-YEAR INVESTMENT COMPARISON ($10K initial)
          </div>
          <AnimatedLineChart
            lines={[
              { points: traditionalData, color: "#6b7280", label: "Traditional", dashed: true },
              { points: prizePoolData, color: "#f59e0b", label: "Prize Pool" },
            ]}
            width={600}
            height={220}
            animate
            duration={2500}
            showArea
            xAxisLabel="Years"
            yAxisLabel="Portfolio Value ($)"
            formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
        </div>

        {/* Comparison cards */}
        {showComparison && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded">
              <div className="font-pixel text-xl text-zinc-200 mb-2">📊 INDEX FUNDS</div>
              <div className="font-pixel text-xl text-zinc-200">7% / year</div>
              <div className="font-terminal text-xl text-zinc-300 mt-2">
                2.76x over 15 years
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded">
              <div className="font-pixel text-xl text-amber-400 mb-2">🚀 VC-DIVERSIFIED FUND</div>
              <div className="font-pixel text-xl text-amber-400">{GAME_PARAMS.prizePoolROI}% / year</div>
              <div className="font-terminal text-xl text-amber-400 mt-2">
                {GAME_PARAMS.prizePoolFallbackMultiple}x over horizon
              </div>
            </div>
          </div>
        )}

        {/* Value per vote point */}
        <div className="text-center bg-black/40 border border-amber-500/30 p-4 rounded">
          <div className="font-pixel text-xl text-zinc-200 mb-2">VALUE PER VOTE POINT</div>
          <div className="font-pixel text-3xl text-amber-400">
            ${GAME_PARAMS.valuePerVotePoint.toLocaleString()}
          </div>
          <div className="font-terminal text-xl text-zinc-200 mt-2">
            $12.65T pool (1% of global AUM at 17%) ÷ 4B votes
          </div>
        </div>

        {/* Three outcomes */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded">
            <div className="text-xl mb-1">✅</div>
            <div className="font-pixel text-xl text-emerald-400">Treaty Passes</div>
            <div className="font-pixel text-xl text-zinc-200">VOTE point + 10.5x</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded">
            <div className="text-xl mb-1">📈</div>
            <div className="font-pixel text-xl text-cyan-400">Treaty Fails</div>
            <div className="font-pixel text-xl text-zinc-200">10.5x VC return</div>
          </div>
          <div className="bg-zinc-500/10 border border-zinc-500/30 p-3 rounded">
            <div className="text-xl mb-1">📊</div>
            <div className="font-pixel text-xl text-zinc-300">Index Funds</div>
            <div className="font-pixel text-xl text-zinc-400">2.76x (7%/yr)</div>
          </div>
        </div>

        <div className="text-center font-pixel text-xl text-emerald-400">
          THE FUND OUTPERFORMS INDEX FUNDS IN EVERY SCENARIO
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
