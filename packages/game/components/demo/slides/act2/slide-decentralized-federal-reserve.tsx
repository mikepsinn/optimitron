"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface Row {
  label: string;
  fed: string;
  contract: string;
  fedBad?: boolean;
  contractGood?: boolean;
}

const ROWS: Row[] = [
  { label: "Who decides", fed: "12 unelected humans", contract: "Algorithm (open source)", fedBad: true, contractGood: true },
  { label: "New money goes to", fed: "Banks & asset holders", contract: "Everyone (UBI)", fedBad: true, contractGood: true },
  { label: "Inflation", fed: "97% of value destroyed", contract: "0% (automatic)", fedBad: true, contractGood: true },
  { label: "Citizens consulted", fed: "0", contract: "8,000,000,000", fedBad: true, contractGood: true },
  { label: "Tax filing", fed: "70,000 pages of code", contract: "0.5% auto-tax, no filing", fedBad: true, contractGood: true },
  { label: "Auditable", fed: "No (never fully audited)", contract: "Yes (view source)", fedBad: true, contractGood: true },
  { label: "Wars funded", fed: "All of them", contract: "0", fedBad: true, contractGood: true },
];

export function SlideDecentralizedFederalReserve() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stagger rows
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
            🏦 A DECENTRALIZED FEDERAL RESERVE
          </h1>
        </div>

        {/* 3-column comparison table */}
        {phase >= 2 && (
          <div className="w-full fade-in">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b-2 border-zinc-600 pb-3 mb-2">
              <div />
              <div className="font-pixel text-xl md:text-2xl text-red-400 text-center tracking-widest">
                FED
                <div className="font-pixel text-sm text-zinc-400">(1913-present)</div>
              </div>
              <div className="font-pixel text-xl md:text-2xl text-emerald-400 text-center tracking-widest">
                SMART CONTRACT
              </div>
            </div>

            {/* Data rows */}
            <div className="space-y-1">
              {ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_1fr_1fr] items-center py-2 border-b border-zinc-800 ${
                    i < visibleRows ? "fade-in" : "opacity-0"
                  }`}
                >
                  {/* Label */}
                  <div className="font-pixel text-base md:text-lg text-zinc-300">
                    {row.label}
                  </div>
                  {/* FED value */}
                  <div
                    className={`font-pixel text-base md:text-lg text-center ${
                      row.fedBad ? "text-red-400" : "text-zinc-200"
                    }`}
                  >
                    {row.fed}
                  </div>
                  {/* Contract value */}
                  <div
                    className={`font-pixel text-base md:text-lg text-center ${
                      row.contractGood ? "text-emerald-400" : "text-zinc-200"
                    }`}
                  >
                    {row.contract}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlideBase>
  );
}
