"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface Row {
  label: string;
  left: string;
  right: string;
  isPunchline?: boolean;
}

const ROWS: Row[] = [
  { label: "Programs:", left: "83", right: "1" },
  { label: "Agencies:", left: "6", right: "0" },
  { label: "Application forms:", left: "hundreds", right: "0" },
  { label: "Wait time:", left: "months", right: "0" },
  {
    label: "Deciding if you deserve to eat:",
    left: "committee",
    right: "you're human, yes",
    isPunchline: true,
  },
];

export function SlideReplaceWelfare() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase 1 (0.5s): Title
    timers.push(setTimeout(() => setPhase(1), 500));
    // Phase 2 (1.5s): Column headers + cards
    timers.push(setTimeout(() => setPhase(2), 1500));
    // Phase 3 (2s): Rows begin staggering in
    timers.push(setTimeout(() => setPhase(3), 2000));
    // Phase 4 (5.5s): Bottom method panel
    timers.push(setTimeout(() => setPhase(4), 5500));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    const timers: NodeJS.Timeout[] = [];
    ROWS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), i * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes strike-through {
          from {
            text-decoration-color: transparent;
            opacity: 1;
          }
          to {
            text-decoration-color: currentColor;
            opacity: 0.5;
          }
        }
        .fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .struck {
          text-decoration: line-through;
          animation: strike-through 0.3s ease-out forwards;
        }
      `}</style>

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-4">

        {/* Phase 1 — Title */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="font-pixel text-xl md:text-3xl text-emerald-400">
            🏛️ WELFARE REPLACEMENT
          </h1>
        </div>

        {/* Phase 2 — Split comparison */}
        {phase >= 2 && (
          <div className="w-full grid grid-cols-2 gap-4 fade-in">

            {/* LEFT — Current System */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="font-pixel text-sm md:text-base text-red-400 text-center mb-3 tracking-widest">
                CURRENT SYSTEM
              </div>

              {/* Row labels + left values */}
              <div className="space-y-3">
                {ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`${i < visibleRows ? "fade-in" : "opacity-0"}`}
                  >
                    <div className="font-pixel text-sm md:text-base text-zinc-500 mb-1">
                      {row.label}
                    </div>
                    <div
                      className={`font-pixel text-base md:text-lg text-red-400 ${
                        i < visibleRows ? "struck" : ""
                      }`}
                    >
                      {row.left}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Replacement */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="font-pixel text-sm md:text-base text-emerald-400 text-center mb-3 tracking-widest">
                REPLACEMENT
              </div>

              {/* Row labels + right values */}
              <div className="space-y-3">
                {ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`${i < visibleRows ? "fade-in" : "opacity-0"}`}
                  >
                    {/* Mirror the label for alignment */}
                    <div className="font-pixel text-sm md:text-base text-zinc-500 mb-1 invisible">
                      {row.label}
                    </div>
                    <div
                      className={`font-pixel text-emerald-400 ${
                        row.isPunchline
                          ? "text-lg md:text-2xl"
                          : "text-base md:text-lg"
                      } ${
                        row.isPunchline && i < visibleRows
                          ? "border border-emerald-400/40 rounded px-2 py-0.5 inline-block"
                          : ""
                      }`}
                    >
                      {row.right}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Phase 4 — Method panel */}
        <div
          className={`w-full transition-opacity duration-700 ${
            phase >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 space-y-1">
            <div className="font-pixel text-sm md:text-base text-emerald-400">
              METHOD: UBI via World ID (automatic)
            </div>
            <div className="font-pixel text-sm md:text-base text-emerald-400">
              BUREAUCRATS NEEDED:{" "}
              <span className="font-terminal text-emerald-300">null</span>
            </div>
          </div>
        </div>

      </div>
    </SlideBase>
  );
}
