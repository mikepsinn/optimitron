"use client";

import { SlideBase } from "../slide-base";

const politicians = [
  { name: "SEN. CHEN", score: 94, voted: true },
  { name: "REP. OKAFOR", score: 88, voted: true },
  { name: "SEN. RUIZ", score: 76, voted: true },
  { name: "REP. THOMPSON", score: 12, voted: false },
  { name: "SEN. BLAKE", score: 5, voted: false },
];

export function SlideSuperpac() {
  return (
    <SlideBase act={2} className="text-yellow-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-3xl text-yellow-400 text-center">
          THE ALIGNMENT SUPERPAC
        </h1>

        {/* Concept */}
        <div className="font-terminal text-base md:text-lg text-zinc-400 text-center">
          Smart contract replaces lobbyists
        </div>

        {/* Crossed-out lobbyist */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <div className="font-pixel text-2xl line-through decoration-red-500 decoration-2 opacity-60">
            🤵 LOBBYIST
          </div>
          <div className="font-pixel text-sm md:text-base text-emerald-400 mt-1">
            REPLACED BY SMART CONTRACT
          </div>
        </div>

        {/* Politicians list */}
        <div className="w-full space-y-2">
          {politicians.map((p) => (
            <div
              key={p.name}
              className={`flex items-center justify-between p-3 rounded border ${
                p.voted
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-zinc-800/50 border-zinc-700/30 opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-pixel text-sm md:text-base text-zinc-300">{p.name}</span>
                <span
                  className={`font-pixel text-base md:text-lg ${
                    p.voted ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {p.score}% ALIGNED
                </span>
              </div>
              <div className="flex items-center gap-2">
                {p.voted ? (
                  <>
                    <span className="font-pixel text-base">🪙🪙🪙</span>
                    <span className="font-pixel text-base md:text-lg text-yellow-400">FUNDED</span>
                  </>
                ) : (
                  <span className="font-pixel text-base md:text-lg text-zinc-600">NOTHING</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Key points */}
        <div className="space-y-1 text-center">
          <div className="font-pixel text-base md:text-lg text-emerald-400">
            Vote for treaty → automatic funding
          </div>
          <div className="font-pixel text-base md:text-lg text-red-400/60">
            Vote against → nothing
          </div>
          <div className="font-pixel text-sm md:text-base text-zinc-500 italic mt-2">
            No dinners. No lobbyists. No phone calls.
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
