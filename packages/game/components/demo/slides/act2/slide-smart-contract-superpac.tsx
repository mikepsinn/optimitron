"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

const politicians = [
  { name: "SEN. CHEN", score: 94, funded: true },
  { name: "REP. OKAFOR", score: 88, funded: true },
  { name: "SEN. RUIZ", score: 76, funded: true },
  { name: "REP. THOMPSON", score: 12, funded: false },
  { name: "SEN. BLAKE", score: 5, funded: false },
];

export function SlideSmartContractSuperpac() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 2500));
    timers.push(setTimeout(() => setPhase(4), 5500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stagger politician rows
  useEffect(() => {
    if (phase < 3) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    politicians.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), i * 350));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <SlideBase act={2} className="text-yellow-400">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-3xl md:text-5xl text-yellow-400 text-center fade-in">
            THE ALIGNMENT SUPERPAC
          </h1>
        )}

        {/* Algorithm explanation */}
        {phase >= 2 && (
          <div className="w-full fade-in">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded px-3 py-2 text-center">
                <div className="font-pixel text-sm text-cyan-400">STEP 1</div>
                <div className="font-pixel text-base md:text-lg text-zinc-200">Citizens rank priorities</div>
                <div className="font-pixel text-xs text-zinc-400">(pairwise comparisons)</div>
              </div>
              <span className="font-pixel text-2xl text-zinc-500">→</span>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded px-3 py-2 text-center">
                <div className="font-pixel text-sm text-cyan-400">STEP 2</div>
                <div className="font-pixel text-base md:text-lg text-zinc-200">Compare to voting record</div>
                <div className="font-pixel text-xs text-zinc-400">(every bill, every vote)</div>
              </div>
              <span className="font-pixel text-2xl text-zinc-500">→</span>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2 text-center">
                <div className="font-pixel text-sm text-yellow-400">STEP 3</div>
                <div className="font-pixel text-base md:text-lg text-zinc-200">Alignment score</div>
                <div className="font-pixel text-xs text-zinc-400">(automatic, on-chain)</div>
              </div>
              <span className="font-pixel text-2xl text-zinc-500">→</span>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2 text-center">
                <div className="font-pixel text-sm text-emerald-400">STEP 4</div>
                <div className="font-pixel text-base md:text-lg text-zinc-200">Fund or defund</div>
                <div className="font-pixel text-xs text-zinc-400">(10% of treaty revenue)</div>
              </div>
            </div>
          </div>
        )}

        {/* Politicians list */}
        {phase >= 3 && (
          <div className="w-full space-y-2">
            {politicians.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between p-3 rounded border ${
                  i < visibleRows ? "fade-in" : "opacity-0"
                } ${
                  p.funded
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-zinc-800/50 border-zinc-700/30 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-xl md:text-3xl text-zinc-300">{p.name}</span>
                  <span
                    className={`font-pixel text-xl md:text-2xl ${
                      p.funded ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {p.score}% ALIGNED
                  </span>
                </div>
                <div className="font-pixel text-xl md:text-2xl">
                  {p.funded ? (
                    <span className="text-yellow-400">🪙🪙🪙 FUNDED</span>
                  ) : (
                    <span className="text-zinc-500">NOTHING</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Punchline */}
        {phase >= 4 && (
          <div className="font-pixel text-xl md:text-3xl text-zinc-200 italic text-center fade-in">
            No dinners. No lobbyists. No phone calls.
          </div>
        )}
      </div>
    </SlideBase>
  );
}
