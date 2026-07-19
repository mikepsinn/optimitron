"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { TREATY_PERSONAL_UPSIDE_INCOME_PLUS_HEALTH } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/demo/formatters";

const amountStolen =
  GAME_PARAMS.wageKeptPaceIncome - GAME_PARAMS.currentMedianIncome;
const purchasingPowerRemaining = 100 - GAME_PARAMS.dollarPurchasingPowerLost;

/* ── Animation timeline ────────────────────────────────────────── */
const PHASE_1_MS = 800; // Crime details appear
const PHASE_2_MS = 2400; // Purchasing power bar drains
const PHASE_3_MS = 4000; // Pay stubs appear
const PHASE_4_MS = 5800; // Amount stolen + lifetime

export function SlideInflationWageTheft() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), PHASE_1_MS),
      setTimeout(() => setPhase(2), PHASE_2_MS),
      setTimeout(() => setPhase(3), PHASE_3_MS),
      setTimeout(() => setPhase(4), PHASE_4_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-amber-500">
      <style jsx>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideInLeft 0.3s ease-out forwards; }

        @keyframes drainBar {
          from { width: 100%; }
          to   { width: ${purchasingPowerRemaining}%; }
        }
        .drain-bar { animation: drainBar 1.5s ease-out forwards; }

        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(-3px); }
          75%      { transform: translateX(3px); }
        }
        .shake { animation: shakeX 0.3s ease-out; }
      `}</style>

      <div className="flex flex-col items-center gap-4 max-w-[1400px] mx-auto w-full">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center">
          🔍 CRIME SCENE REPORT
        </h1>

        {/* Crime details grid */}
        <div className="w-full bg-zinc-900/80 border border-amber-500/30 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {[
              { label: "CRIME", value: "Theft of purchasing power" },
              { label: "DURATION", value: "113 years" },
              { label: "METHOD", value: "Printing money very slowly" },
              { label: "SUSPECTS", value: "Central banks" },
              { label: "ARRESTS", value: "0" },
              { label: "STATUS", value: "Still in progress" },
            ].map((row, i) => (
              <div
                key={row.label}
                className={`flex items-baseline gap-2 transition-opacity duration-300 ${
                  phase >= 1 ? "opacity-100 slide-in" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-pixel text-sm md:text-base text-zinc-500 shrink-0">
                  {row.label}:
                </span>
                <span className={`font-pixel text-sm md:text-base ${
                  row.label === "STATUS" ? "text-red-400 animate-pulse" :
                  row.label === "ARRESTS" ? "text-red-400" :
                  "text-zinc-200"
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchasing power bar */}
        <div className={`w-full space-y-1 transition-opacity duration-500 ${
          phase >= 2 ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex justify-between">
            <span className="font-pixel text-sm text-zinc-400">
              PURCHASING POWER (1913 → 2026)
            </span>
            <span className="font-pixel text-sm text-red-400">
              100% → {purchasingPowerRemaining}%
            </span>
          </div>
          <div className="w-full h-6 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-amber-500 to-red-500 ${
                phase >= 2 ? "drain-bar" : "w-full"
              }`}
            />
          </div>
          <div className="font-pixel text-xs text-zinc-600 text-center italic">
            &ldquo;Nobody noticed because it took a century&rdquo;
          </div>
        </div>

        {/* Pay stub comparison */}
        <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-500 ${
          phase >= 3 ? "opacity-100" : "opacity-0"
        }`}>
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded">
            <div className="font-pixel text-sm md:text-base text-emerald-400">
              IF WAGES KEPT PACE
            </div>
            <div className="font-pixel text-2xl md:text-4xl text-emerald-400">
              ${GAME_PARAMS.wageKeptPaceIncome.toLocaleString()}
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">per year</div>
          </div>
          <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded">
            <div className="font-pixel text-sm md:text-base text-red-400">
              WHAT YOU ACTUALLY GET
            </div>
            <div className={`font-pixel text-2xl md:text-4xl text-red-500 ${
              phase >= 3 ? "shake" : ""
            }`}>
              ${GAME_PARAMS.currentMedianIncome.toLocaleString()}
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">per year</div>
          </div>
        </div>

        {/* Stolen amount + lifetime */}
        {phase >= 4 && (
          <div className="w-full space-y-2 slide-in">
            <div className="border-t-2 border-red-500/50 pt-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-pixel text-lg md:text-xl text-zinc-200">
                  💀 AMOUNT STOLEN
                </span>
                <span className="font-pixel text-xl md:text-2xl text-red-500">
                  −${amountStolen.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex items-center justify-between px-2 mt-1">
                <span className="font-pixel text-lg md:text-xl text-zinc-200">
                  ⚰️ LIFETIME LOSS
                </span>
                <span className="font-pixel text-xl md:text-2xl text-red-500 animate-pulse">
                  −{formatCurrency(Math.round(TREATY_PERSONAL_UPSIDE_INCOME_PLUS_HEALTH.value))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideInflationWageTheft;
