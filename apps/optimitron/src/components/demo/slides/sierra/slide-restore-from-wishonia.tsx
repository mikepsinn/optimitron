"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import { useEffect, useState } from "react";
import {
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_AVG_INCOME_2025,
} from "@optimitron/data/parameters";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const haleGain = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const haleTo = Math.round(TREATY_PROJECTED_HALE_YEAR_15.value * 10) / 10;
const incomeNow = formatCurrency(GLOBAL_AVG_INCOME_2025.value);
const incomeTo = formatCurrency(GAME_PARAMS.projectedGDPperCapita);

export function SlideRestoreFromWishonia() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 800);
    setTimeout(() => setPhase(2), 2000);
  }, []);

  return (
    <SierraSlideWrapper act="turn" className="text-cyan-400">
      {phase >= 1 && (
        <ParticleEmitter
          emoji={["✨", "🌟", "💫", "⭐"]}
          burst={30}
          direction="radial"
          speed={100}
          lifetime={2000}
          active={false}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
        {/* Phase 0: Loading */}
        {phase === 0 && (
          <div className="space-y-4 text-center">
            <div className="font-pixel text-2xl text-amber-400">
              RESTORING SAVE FILE...
            </div>
            <div className="w-64 h-4 bg-black/50 border border-amber-500/50 mx-auto">
              <div className="h-full bg-amber-500 animate-pulse" style={{ width: "60%" }} />
            </div>
            <div className="font-pixel text-2xl text-amber-400">
              WISHONIA.SAV
            </div>
          </div>
        )}

        {/* Phase 1+: The pitch — globe + two big stats */}
        {phase >= 1 && (
          <div className="flex flex-col items-center gap-6 animate-fade-scale-in">
            <div className="font-pixel text-2xl md:text-3xl text-cyan-400 tracking-wider">
              WITHIN 15 YEARS
            </div>

            <div className="flex items-center gap-8 md:gap-16">
              {/* HALE stat */}
              <div className="text-center">
                <div className="text-5xl md:text-6xl mb-2">❤️</div>
                <div className="font-pixel text-5xl md:text-7xl text-emerald-400">
                  +{haleGain}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-emerald-400 mt-1">
                  HEALTHY YEARS
                </div>
                <div className="font-terminal text-lg md:text-xl text-zinc-200 mt-1">
                  63.3 → {haleTo} HALE
                </div>
              </div>

              {/* Globe */}
              <div className="text-8xl md:text-[10rem] animate-bounce-slow">
                🌍
              </div>

              {/* Income stat */}
              <div className="text-center">
                <div className="text-5xl md:text-6xl mb-2">💰</div>
                <div className="font-pixel text-5xl md:text-7xl text-amber-400">
                  {incomeTo}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-amber-400 mt-1">
                  INCOME / YEAR
                </div>
                <div className="font-terminal text-lg md:text-xl text-zinc-200 mt-1">
                  up from {incomeNow}
                </div>
              </div>
            </div>

            {/* Tagline (phase 2) */}
            {phase >= 2 && (
              <div className="font-pixel text-2xl md:text-4xl text-cyan-400 mt-4 animate-fade-in">
                REALLOCATE RESOURCES. SAVE THE WORLD.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Radial burst */}
      {phase >= 1 && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute inset-0 animate-burst"
            style={{
              background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fade-scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes burst {
          from { opacity: 1; transform: scale(0); }
          to { opacity: 0; transform: scale(2); }
        }
        .animate-fade-scale-in {
          animation: fade-scale-in 0.5s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-burst {
          animation: burst 1s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideRestoreFromWishonia;
