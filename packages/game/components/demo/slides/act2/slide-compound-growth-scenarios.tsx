"use client";

import { SlideBase } from "../slide-base";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

// From prize-docs.md — per-person lifetime wealth trajectories (15-year horizon)
// Optimal governance: Switzerland-level outcomes applied globally
// 1% Treaty: treaty objectives met, $27B/yr redirected to clinical trials
// Do nothing: status quo 2.5% growth trajectory

const BARS = [
  {
    label: "🌍 OPTIMAL GOVERNANCE",
    sublabel: "Switzerland-level outcomes for all",
    value: 528_000,
    widthPct: 100,
    colorBar: "bg-amber-400",
    colorText: "text-amber-400",
  },
  {
    label: "🧪 1% TREATY TRAJECTORY",
    sublabel: "$27B/yr → clinical trials",
    value: 149_000,
    widthPct: 28,
    colorBar: "bg-emerald-400",
    colorText: "text-emerald-400",
  },
  {
    label: "😐 DO NOTHING",
    sublabel: "Status quo trajectory",
    value: 20_100,
    widthPct: 3.8,
    colorBar: "bg-zinc-500",
    colorText: "text-zinc-200",
  },
] as const;

export function SlideCompoundGrowthScenarios() {
  const [phase, setPhase] = useState(0);
  const [barsVisible, setBarsVisible] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);

    setTimeout(() => setPhase(2), 1500);
    const b1 = setTimeout(() => setBarsVisible(1), 1500);
    const b2 = setTimeout(() => setBarsVisible(2), 1900);
    const b3 = setTimeout(() => setBarsVisible(3), 2300);

    const t3 = setTimeout(() => setPhase(3), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t3);
      clearTimeout(b1);
      clearTimeout(b2);
      clearTimeout(b3);
    };
  }, []);

  return (
    <SlideBase act={2}>
      <div className="flex flex-col gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-xl md:text-2xl text-amber-400 text-center slide-fade-in">
            PLEASE SELECT AN EARTH
          </h1>
        )}

        {/* Bars */}
        {phase >= 2 && (
          <div className="space-y-3 slide-fade-in">
            {BARS.map((bar, i) => {
              const visible = barsVisible > i;
              return (
                <div
                  key={bar.label}
                  className={`bg-zinc-900 border border-zinc-700 rounded p-2 md:p-3 ${visible ? "slide-fade-in" : "opacity-0"}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className={`font-pixel text-lg md:text-xl ${bar.colorText}`}>
                        {bar.label}
                      </div>
                      <div className="font-terminal text-lg md:text-xl text-zinc-400">
                        {bar.sublabel}
                      </div>
                    </div>
                    <span className={`font-pixel text-xl md:text-2xl ${bar.colorText} shrink-0 ml-2`}>
                      {formatCurrency(bar.value)} / person
                    </span>
                  </div>
                  <div className="h-6 md:h-8 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${bar.colorBar} rounded bar-fill`}
                      style={{ "--target-width": `${bar.widthPct}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Punchline */}
        {phase >= 3 && (
          <div className="bg-emerald-500/15 border-2 border-emerald-500/50 rounded-lg p-4 slide-fade-in">
            <p className="font-pixel text-xl md:text-2xl text-emerald-400 text-center">
              1% REALLOCATION → 7.4x MORE WEALTH PER PERSON
            </p>
            <p className="font-terminal text-xl md:text-2xl text-zinc-200 text-center mt-1">
              $149K vs $20K. Same planet. Same people. Different slider position.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-fade-in {
          animation: slide-fade-in 0.4s ease-out forwards;
        }
        @keyframes bar-fill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        .bar-fill {
          animation: bar-fill 1.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
