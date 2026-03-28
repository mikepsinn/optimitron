"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface Row {
  label: string;
  current: string;
  replacement: string;
  isPunchline?: boolean;
}

const ROWS: Row[] = [
  { label: "Programs", current: "83", replacement: "1" },
  { label: "Agencies", current: "6", replacement: "0" },
  { label: "Application forms", current: "Hundreds", replacement: "0" },
  { label: "Wait time", current: "Months", replacement: "0" },
  { label: "Bureaucrats needed", current: "Thousands", replacement: "0" },
  {
    label: "Deciding if you deserve to eat",
    current: "Committee",
    replacement: "You're human, yes",
    isPunchline: true,
  },
];

export function SlideDecentralizedWelfare() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 2000));
    timers.push(setTimeout(() => setPhase(4), 5500));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    const timers: NodeJS.Timeout[] = [];
    ROWS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), i * 350));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>

      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-6">
        {/* Title */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="font-pixel text-3xl md:text-5xl text-emerald-400">
            🏛️ WELFARE REPLACEMENT
          </h1>
        </div>

        {/* 3-column comparison table */}
        {phase >= 2 && (
          <div className="w-full fade-in">
            {/* Header row */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b-2 border-zinc-600 pb-3 mb-2">
              <div />
              <div className="font-pixel text-2xl md:text-3xl text-red-400 text-center tracking-widest">
                CURRENT
              </div>
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400 text-center tracking-widest">
                REPLACEMENT
              </div>
            </div>

            {/* Data rows */}
            <div className="space-y-1">
              {ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1.2fr_1fr_1fr] items-center py-2 border-b border-zinc-800 ${
                    i < visibleRows ? "fade-in" : "opacity-0"
                  }`}
                >
                  {/* Label */}
                  <div className="font-pixel text-lg md:text-xl text-zinc-300 break-words">
                    {row.label}
                  </div>
                  {/* Current value */}
                  <div className="font-pixel text-lg md:text-xl text-center text-red-400 break-words">
                    {row.current}
                  </div>
                  {/* Replacement value */}
                  <div
                    className={`font-pixel text-center text-emerald-400 break-words ${
                      row.isPunchline
                        ? "text-xl md:text-2xl border border-emerald-400/40 rounded px-2 py-0.5 inline-block"
                        : "text-lg md:text-xl"
                    }`}
                  >
                    {row.replacement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Method panel */}
        <div
          className={`w-full transition-opacity duration-700 ${
            phase >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
            <div className="font-pixel text-xl md:text-2xl text-emerald-400">
              METHOD: UBI via World ID (automatic)
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
