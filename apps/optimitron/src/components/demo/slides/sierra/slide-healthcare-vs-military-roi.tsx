"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

/**
 * Left side: money burns away (shrinking stack).
 * Right side: money compounds (growing stack that multiplies).
 */

// Generate positions for coin stacks
const BURN_COINS = 12;
const MULTIPLY_ROUNDS = 5; // 1 → 2 → 4 → 8 → 16

export function SlideHealthcareVsMilitaryRoi() {
  const [phase, setPhase] = useState(0);
  const [burnCount, setBurnCount] = useState(BURN_COINS);
  const [multiplyPower, setMultiplyPower] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));

    // Burn animation: coins disappear one by one
    timers.push(setTimeout(() => setPhase(3), 2500));
    for (let i = 0; i < BURN_COINS; i++) {
      timers.push(
        setTimeout(() => setBurnCount((prev) => Math.max(0, prev - 1)), 2500 + i * 200)
      );
    }

    // Multiply animation: coins double each round
    for (let i = 0; i <= MULTIPLY_ROUNDS; i++) {
      timers.push(setTimeout(() => setMultiplyPower(i), 2500 + i * 600));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  const multiplyCount = Math.pow(2, multiplyPower);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }

        @keyframes burn {
          0%   { opacity: 1; transform: scale(1); filter: brightness(1); }
          40%  { opacity: 1; transform: scale(1.1); filter: brightness(1.5) hue-rotate(-20deg); }
          100% { opacity: 0; transform: scale(0.3) translateY(10px); filter: brightness(2) hue-rotate(-40deg); }
        }
        .burn-out {
          animation: burn 0.4s ease-out forwards;
        }

        @keyframes coin-pop {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
        .coin-pop {
          animation: coin-pop 0.3s ease-out forwards;
        }

        @keyframes fire-flicker {
          0%, 100% { opacity: 0.7; transform: translateY(0) scale(1); }
          25% { opacity: 1; transform: translateY(-2px) scale(1.1); }
          50% { opacity: 0.8; transform: translateY(-1px) scale(0.95); }
          75% { opacity: 1; transform: translateY(-3px) scale(1.05); }
        }
        .fire-flicker { animation: fire-flicker 0.6s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-6 w-full max-w-[1700px] mx-auto">
        {/* Cards side by side */}
        {phase >= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full fade-up">
            {/* MILITARY — money burns */}
            <div className="flex flex-col items-center gap-4 p-6 bg-black/40 border border-red-500/30 rounded">
              <div className="font-pixel text-2xl md:text-3xl text-red-400 tracking-widest">MILITARY</div>
              <div className="text-5xl">⚔️</div>

              <div className="font-pixel text-4xl md:text-5xl text-red-400 text-center">
                $1 IN → $0.60 OUT
              </div>

              {/* Coin grid with burn effect */}
              {phase >= 2 && (
                <div className="relative w-full flex flex-col items-center gap-2">
                  {/* Fire underneath */}
                  {phase >= 3 && burnCount < BURN_COINS && (
                    <div className="flex justify-center gap-1 fire-flicker">
                      <span className="text-2xl">🔥</span>
                      <span className="text-3xl">🔥</span>
                      <span className="text-2xl">🔥</span>
                    </div>
                  )}

                  {/* Coin stack */}
                  <div className="flex flex-wrap justify-center gap-2 min-h-[80px]">
                    {Array.from({ length: BURN_COINS }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-3xl transition-all ${
                          i >= burnCount ? "burn-out" : ""
                        }`}
                      >
                        💰
                      </span>
                    ))}
                  </div>

                  {/* Remaining count */}
                  {phase >= 3 && (
                    <div className="font-pixel text-xl md:text-2xl text-red-400">
                      {burnCount} OF {BURN_COINS} REMAINING
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* HEALTHCARE — money multiplies */}
            <div className="flex flex-col items-center gap-4 p-6 bg-black/40 border border-emerald-500/30 rounded">
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400 tracking-widest">CLINICAL TRIALS</div>
              <div className="text-5xl">🧪</div>

              <div className="font-pixel text-4xl md:text-5xl text-emerald-400 text-center">
                $1 IN → $1.80 OUT
              </div>

              {/* Multiplying coins */}
              {phase >= 2 && (
                <div className="relative w-full flex flex-col items-center gap-2">
                  {/* Multiplier badge */}
                  {multiplyPower > 0 && (
                    <div className="font-pixel text-2xl md:text-3xl text-emerald-300">
                      ×{multiplyCount}
                    </div>
                  )}

                  {/* Growing coin grid */}
                  <div className="flex flex-wrap justify-center gap-1 min-h-[80px]">
                    {Array.from({ length: Math.min(multiplyCount, 32) }).map((_, i) => (
                      <span
                        key={i}
                        className="text-2xl coin-pop"
                        style={{ animationDelay: `${(i % 8) * 50}ms` }}
                      >
                        💰
                      </span>
                    ))}
                    {multiplyCount > 32 && (
                      <span className="font-pixel text-lg text-emerald-400 self-center">
                        +{multiplyCount - 32} more
                      </span>
                    )}
                  </div>

                  {/* Compound label */}
                  {multiplyPower >= MULTIPLY_ROUNDS && (
                    <div className="font-pixel text-xl md:text-2xl text-emerald-400">
                      COMPOUND GROWTH
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideHealthcareVsMilitaryRoi;
