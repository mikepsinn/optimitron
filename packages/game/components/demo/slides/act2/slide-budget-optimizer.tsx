"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";

interface BudgetRow {
  label: string;
  currentSpend: string;
  currentOutcome: string;
  optimizedSpend: string;
  optimizedOutcome: string;
}

const ROWS: BudgetRow[] = [
  {
    label: "🏥 Healthcare",
    currentSpend: "$4.5T",
    currentOutcome: "ranked 37th",
    optimizedSpend: "$1.1T",
    optimizedOutcome: "ranked 1st",
  },
  {
    label: "⚔️ Military",
    currentSpend: "$886B",
    currentOutcome: "13 wars since 1945",
    optimizedSpend: "$200B",
    optimizedOutcome: "Wars needed: 0",
  },
  {
    label: "📚 Education",
    currentSpend: "$800B",
    currentOutcome: "scores: declining",
    optimizedSpend: "$600B",
    optimizedOutcome: "scores: +40%",
  },
];

const ROW_STAGGER_MS = 500;
const PHASE_1_MS = 500;
const PHASE_2_MS = 1500;
const PHASE_3_MS = PHASE_2_MS + ROWS.length * ROW_STAGGER_MS + 500;
const PHASE_4_MS = PHASE_3_MS + 1500;

export function SlideBudgetOptimizer() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [flashingCurrentRow, setFlashingCurrentRow] = useState<number | null>(null);
  const [flashingOptimizedRow, setFlashingOptimizedRow] = useState<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_MS));

    ROWS.forEach((_, i) => {
      const rowDelay = PHASE_2_MS + i * ROW_STAGGER_MS;

      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 2));
          setVisibleRows(i + 1);
          setFlashingCurrentRow(i);
          // Flash current (red) for 300ms, then flash optimized (green)
          timers.push(
            setTimeout(() => {
              setFlashingCurrentRow(null);
              setFlashingOptimizedRow(i);
              timers.push(setTimeout(() => setFlashingOptimizedRow(null), 300));
            }, 300)
          );
        }, rowDelay)
      );
    });

    timers.push(setTimeout(() => setPhase(3), PHASE_3_MS));
    timers.push(setTimeout(() => setPhase(4), PHASE_4_MS));

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
          animation: fadeSlideUp 0.4s ease-out forwards;
        }

        @keyframes flashRed {
          0%, 100% { background-color: transparent; }
          50%       { background-color: rgba(239, 68, 68, 0.18); }
        }
        .flash-red {
          animation: flashRed 0.3s ease-out;
        }

        @keyframes flashGreen {
          0%, 100% { background-color: transparent; }
          50%       { background-color: rgba(16, 185, 129, 0.18); }
        }
        .flash-green {
          animation: flashGreen 0.3s ease-out;
        }

        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .gentle-pulse {
          animation: gentlePulse 1.8s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto w-full">
        {/* Phase 1: Title */}
        {phase >= 1 && (
          <div className="text-center fade-in">
            <h1 className="font-pixel text-3xl md:text-5xl text-amber-400">
              💰 OPTIMAL BUDGET GENERATOR
            </h1>
          </div>
        )}

        {/* Phase 2: Comparison table */}
        {phase >= 2 && (
          <div className="w-full bg-black/40 border border-zinc-700 rounded fade-in">
            {/* Column headers */}
            <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-2 border-b border-zinc-800">
              <div />
              <div className="font-pixel text-xl md:text-3xl text-red-400 text-center">
                🇺🇸 USA (CURRENT)
              </div>
              <div className="font-pixel text-xl md:text-3xl text-emerald-400 text-center">
                🇺🇸 USA (OPTIMIZED)
              </div>
            </div>

            {/* Data rows */}
            <div className="divide-y divide-zinc-800">
              {ROWS.map((row, i) => {
                if (i >= visibleRows) return null;
                const isFlashingCurrent = flashingCurrentRow === i;
                const isFlashingOptimized = flashingOptimizedRow === i;

                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 gap-2 px-3 py-2 items-center fade-in"
                  >
                    <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                      {row.label}
                    </div>

                    <div
                      className={`text-center rounded px-1 py-1 ${isFlashingCurrent ? "flash-red" : ""}`}
                    >
                      <div className="font-pixel text-xl md:text-3xl text-red-400">
                        {row.currentSpend}
                      </div>
                      <div className="font-pixel text-xl md:text-3xl text-zinc-300">
                        {row.currentOutcome}
                      </div>
                    </div>

                    <div
                      className={`text-center rounded px-1 py-1 ${isFlashingOptimized ? "flash-green" : ""}`}
                    >
                      <div className="font-pixel text-xl md:text-3xl text-emerald-400">
                        {row.optimizedSpend}
                      </div>
                      <div className="font-pixel text-xl md:text-3xl text-emerald-400">
                        {row.optimizedOutcome}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phase 3: Summary row — the punchline */}
            {phase >= 3 && (
              <div className="border-t-2 border-amber-500/50 px-3 pt-3 pb-3 mt-1 fade-in space-y-2">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                    TOTAL SPENT:
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-xl md:text-3xl text-red-400">
                      more
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-xl md:text-3xl text-emerald-400 gentle-pulse">
                      less
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="font-pixel text-xl md:text-3xl text-zinc-200">
                    OUTCOMES:
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-xl md:text-3xl text-red-400">
                      worse
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-pixel text-xl md:text-3xl text-emerald-400 gentle-pulse">
                      better
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 4: Deadpan footer */}
        {phase >= 4 && (
          <p className="font-terminal text-2xl md:text-4xl text-zinc-200 text-center fade-in">
            DIFFICULTY: looking at the data
          </p>
        )}
      </div>
    </SlideBase>
  );
}
