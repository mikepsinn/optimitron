"use client";

import { SlideBase } from "../slide-base";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlideRoiComparison() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 3500);
    const t4 = setTimeout(() => setPhase(4), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const coins = ["💰", "💰", "💰", "💰", "💰"];

  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-[1700px] mx-auto">

        {/* Investment windows */}
        <div
          className={`grid grid-cols-2 gap-4 w-full transition-all duration-700 ${
            phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Military card */}
          <div className="flex flex-col items-center gap-4 p-6 bg-black/40 border border-red-500/30 rounded">
            <div className="font-pixel text-xl md:text-2xl text-red-400 tracking-widest">MILITARY</div>
            <div className="text-5xl md:text-6xl">⚔️</div>

            {/* Bar track */}
            <div className="w-full space-y-2">
              <div className="relative h-8 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bar-military rounded"
                  style={{ width: phase >= 2 ? "60%" : "0%" }}
                />
              </div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 text-center">60% of container</div>
            </div>

            <div className="font-pixel text-3xl md:text-4xl text-red-400 text-center">
              $1 IN → $0.60 OUT
            </div>
          </div>

          {/* Healthcare card */}
          <div className="flex flex-col items-center gap-4 p-6 bg-black/40 border border-emerald-500/30 rounded">
            <div className="font-pixel text-xl md:text-2xl text-emerald-400 tracking-widest">HEALTHCARE</div>
            <div className="text-5xl md:text-6xl">💊</div>

            {/* Bar track — 180% represented visually at full width + overflow indicator */}
            <div className="w-full space-y-2">
              <div className="relative h-8 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bar-healthcare rounded"
                  style={{ width: phase >= 2 ? "100%" : "0%" }}
                />
                {phase >= 2 && (
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="font-pixel text-xl md:text-3xl text-emerald-900 font-bold">+80%→</span>
                  </div>
                )}
              </div>
              <div className="font-pixel text-xl md:text-3xl text-zinc-200 text-center">180% — overflows bar</div>
            </div>

            <div className="font-pixel text-3xl md:text-4xl text-emerald-400 text-center">
              $1 IN → $1.80 OUT
            </div>
          </div>
        </div>

        {/* Coin animations */}
        {phase >= 3 && (
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Military: coins falling into pit */}
            <div className="relative h-20 overflow-hidden flex justify-center">
              {coins.map((coin, i) => (
                <span
                  key={i}
                  className="coin-fall absolute text-2xl"
                  style={{ animationDelay: `${i * 0.12}s`, left: `${20 + i * 12}%` }}
                >
                  {coin}
                </span>
              ))}
              <div className="absolute bottom-0 w-full text-center font-pixel text-xl md:text-3xl text-red-400">
                ▼ PIT ▼
              </div>
            </div>

            {/* Healthcare: coins floating up */}
            <div className="relative h-20 overflow-hidden flex justify-center">
              {coins.map((coin, i) => (
                <span
                  key={i}
                  className="coin-rise absolute text-2xl"
                  style={{ animationDelay: `${i * 0.12}s`, left: `${20 + i * 12}%` }}
                >
                  {coin}
                </span>
              ))}
              <div className="absolute top-0 w-full text-center font-pixel text-xl md:text-3xl text-emerald-400">
                ▲ MULTIPLY ▲
              </div>
            </div>
          </div>
        )}

        {/* Punchline */}
        <div
          className={`text-center space-y-2 transition-all duration-700 ${
            phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-terminal text-3xl md:text-4xl text-zinc-300">
            YOUR SPECIES CHOSE THE BOTTOM ONE.
          </div>
          <div className="font-pixel text-5xl md:text-6xl text-red-500 punchline-pulse">
            {Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value)} TIMES.
          </div>
        </div>
      </div>

      <style jsx>{`
        .bar-military {
          background: linear-gradient(to right, #dc2626, #ef4444);
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bar-healthcare {
          background: linear-gradient(to right, #059669, #10b981);
          transition: width 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes coin-fall {
          0%   { transform: translateY(-8px); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(56px); opacity: 0; }
        }
        .coin-fall {
          animation: coin-fall 0.9s ease-in infinite;
          bottom: auto;
          top: 0;
        }

        @keyframes coin-rise {
          0%   { transform: translateY(40px); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-16px); opacity: 0; }
        }
        .coin-rise {
          animation: coin-rise 0.9s ease-out infinite;
          bottom: 0;
        }

        @keyframes punchline-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .punchline-pulse {
          animation: punchline-pulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </SlideBase>
  );
}
