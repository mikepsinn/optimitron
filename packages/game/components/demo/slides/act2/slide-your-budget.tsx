"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";

interface BudgetCategory {
  icon: string;
  label: string;
  pct: number;
  barColor: string;
}

const CATEGORIES: BudgetCategory[] = [
  { icon: "🧪", label: "Clinical Trials", pct: 31, barColor: "bg-emerald-500" },
  { icon: "📚", label: "Education", pct: 22, barColor: "bg-cyan-500" },
  { icon: "🏗️", label: "Infrastructure", pct: 18, barColor: "bg-amber-500" },
  { icon: "🏥", label: "Healthcare", pct: 15, barColor: "bg-blue-500" },
  { icon: "🌿", label: "Environment", pct: 10, barColor: "bg-green-500" },
  { icon: "⚔️", label: "Military", pct: 4, barColor: "bg-red-500" },
];

// Phase timing (ms)
const PHASE_1_DELAY = 500;
const PHASE_2_DELAY = 1500;
const BAR_STAGGER = 250;
const PHASE_3_DELAY = PHASE_2_DELAY + CATEGORIES.length * BAR_STAGGER + 500;
const PHASE_4_DELAY = PHASE_3_DELAY + 1500;

export function SlideYourBudget() {
  const [phase, setPhase] = useState(0);
  const [filledBars, setFilledBars] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_DELAY));

    CATEGORIES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 2));
          setFilledBars(i + 1);
        }, PHASE_2_DELAY + i * BAR_STAGGER)
      );
    });

    timers.push(setTimeout(() => setPhase(3), PHASE_3_DELAY));
    timers.push(setTimeout(() => setPhase(4), PHASE_4_DELAY));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto w-full">
        {/* Phase 1: Title */}
        {phase >= 1 && (
          <div className="text-center fade-in">
            <h1 className="font-pixel text-xl md:text-2xl text-emerald-400">
              📊 YOUR BUDGET
            </h1>
            <div className="font-terminal text-xl text-zinc-200 mt-1">
              10 comparisons, 2 minutes
            </div>
          </div>
        )}

        {/* Phase 2: Animated budget bars */}
        {phase >= 2 && (
          <div className="w-full space-y-2">
            {CATEGORIES.map((cat, i) => {
              const isFilled = i < filledBars;
              return (
                <div key={cat.label} className={isFilled ? "fade-in" : "opacity-0"}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-pixel text-base text-zinc-200 w-28 truncate">
                      {cat.icon} {cat.label}
                    </span>
                    <div className="flex-1 h-6 md:h-8 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                      <div
                        className={`h-full ${cat.barColor} transition-[width] duration-[1500ms] ease-out`}
                        style={{ width: isFilled ? `${cat.pct}%` : "0%" }}
                      />
                    </div>
                    <span className="font-pixel text-xl text-zinc-300 w-8 text-right">
                      {cat.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase 3: Info panel */}
        {phase >= 3 && (
          <div className="w-full bg-black/40 border border-zinc-700 rounded p-4 fade-in space-y-2">
            <div className="flex gap-3 items-baseline">
              <span className="font-pixel text-lg text-zinc-200 w-44 shrink-0">
                METHOD:
              </span>
              <span className="font-pixel text-lg text-foreground">
                Eigenvector decomposition
              </span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="font-pixel text-lg text-zinc-200 w-44 shrink-0">
                INVENTED:
              </span>
              <span className="font-pixel text-lg text-foreground">
                1977
              </span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="font-pixel text-lg text-zinc-200 w-44 shrink-0">
                USED FOR:
              </span>
              <span className="font-pixel text-lg text-foreground">
                ranking football teams
              </span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="font-pixel text-lg text-zinc-200 w-44 shrink-0">
                COULD ALSO BE USED FOR:
              </span>
              <span className="font-pixel text-lg text-emerald-400">
                civilisation
              </span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="font-pixel text-lg text-zinc-200 w-44 shrink-0">
                HAS BEEN:
              </span>
              <span className="font-pixel text-lg text-red-400 animate-pulse">
                no
              </span>
            </div>
          </div>
        )}

        {/* Phase 4: Bottom punchline */}
        {phase >= 4 && (
          <p className="font-terminal text-xl md:text-2xl text-zinc-200 italic text-center fade-in">
            You just did in 2 minutes what your legislature fails to do in 2
            years.
          </p>
        )}
      </div>
    </SlideBase>
  );
}
