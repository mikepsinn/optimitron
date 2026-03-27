"use client";

import { SlideBase } from "../slide-base";
import { TREATY_TRAJECTORY_AVG_INCOME_YEAR_20 } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

// 20yr projection at 2.5% status quo rate: 18700 * 1.025^20 ≈ 30,600
// The spec calls this ~$20,100 so we use that directly as the "do nothing" endpoint
const DO_NOTHING_VALUE = 20_100;

// Wishonia best-case trajectory GDP per capita (game constant, not in @optimitron/data)
const WISHONIA_GDP_PER_CAPITA = 1_160_000;
const treatyGDPperCapita = Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_20.value / 1000) * 1000;

const BARS = [
  {
    label: "BEST CASE (26%)",
    value: WISHONIA_GDP_PER_CAPITA,
    widthPct: 100,
    colorBar: "bg-amber-400",
    colorText: "text-amber-400",
  },
  {
    label: "EXPECTED (17.9%)",
    value: treatyGDPperCapita,
    widthPct: 29,
    colorBar: "bg-emerald-400",
    colorText: "text-emerald-400",
  },
  {
    label: "WORST CASE (11%)",
    // spec value — 18700 * 1.11^20 is higher, but brief uses $81K
    value: 81_000,
    widthPct: 7,
    colorBar: "bg-cyan-400",
    colorText: "text-cyan-400",
  },
  {
    label: "DO NOTHING (2.5%)",
    value: DO_NOTHING_VALUE,
    widthPct: 1.7,
    colorBar: "bg-zinc-500",
    colorText: "text-zinc-500",
  },
] as const;

export function SlideCompoundPunchline() {
  const [phase, setPhase] = useState(0);
  // Track which bars have animated in (0 = none, 1..4 = each bar sequentially)
  const [barsVisible, setBarsVisible] = useState(0);

  useEffect(() => {
    // Phase 1: title
    const t1 = setTimeout(() => setPhase(1), 500);

    // Phase 2: bars staggered at 400ms each, starting at 1500ms
    setTimeout(() => setPhase(2), 1500);
    const b1 = setTimeout(() => setBarsVisible(1), 1500);
    const b2 = setTimeout(() => setBarsVisible(2), 1900);
    const b3 = setTimeout(() => setBarsVisible(3), 2300);
    const b4 = setTimeout(() => setBarsVisible(4), 2700);

    // Phase 3: highlight box
    const t3 = setTimeout(() => setPhase(3), 4500);

    // Phase 4: deadpan footnotes
    const t4 = setTimeout(() => setPhase(4), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(b1);
      clearTimeout(b2);
      clearTimeout(b3);
      clearTimeout(b4);
    };
  }, []);

  return (
    <SlideBase act={2}>
      <div className="flex flex-col gap-5 w-full max-w-[1700px] mx-auto">
        {/* Phase 1: Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-sm md:text-lg text-amber-400 text-center slide-fade-in">
            🧮 WHAT COMPOUND INTEREST THINKS ABOUT YOUR POLITICS
          </h1>
        )}

        {/* Phase 2: Bars */}
        {phase >= 2 && (
          <div className="space-y-3 slide-fade-in">
            {BARS.map((bar, i) => {
              const visible = barsVisible > i;
              return (
                <div
                  key={bar.label}
                  className={`bg-zinc-900 border border-zinc-700 rounded p-2 md:p-3 ${visible ? "slide-fade-in" : "opacity-0"}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-pixel text-xs ${bar.colorText}`}>
                      {bar.label}
                    </span>
                    <span className={`font-pixel text-xs md:text-sm ${bar.colorText}`}>
                      {formatCurrency(bar.value)} / person
                    </span>
                  </div>
                  <div className="h-8 md:h-10 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${bar.colorBar} rounded bar-fill`}
                      style={
                        {
                          "--target-width": `${bar.widthPct}%`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase 3: Punchline highlight */}
        {phase >= 3 && (
          <div className="bg-cyan-500/15 border-2 border-cyan-500/50 rounded-lg p-4 slide-fade-in">
            <p className="font-pixel text-sm md:text-lg text-cyan-400 animate-pulse text-center">
              WORST CASE IS 4× BETTER THAN DOING NOTHING
            </p>
          </div>
        )}

        {/* Phase 4: Deadpan footnotes */}
        {phase >= 4 && (
          <div className="flex justify-between slide-fade-in px-1">
            <span className="font-terminal text-xs text-emerald-400">
              Math consulted: yes
            </span>
            <span className="font-terminal text-xs text-zinc-500">
              Politicians consulted: not required
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slide-fade-in {
          animation: slide-fade-in 0.4s ease-out forwards;
        }

        @keyframes bar-fill {
          from {
            width: 0%;
          }
          to {
            width: var(--target-width);
          }
        }
        .bar-fill {
          animation: bar-fill 1.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
