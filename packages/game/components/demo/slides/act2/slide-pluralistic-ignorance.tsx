"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { GLOBAL_HOUSEHOLD_WEALTH_USD } from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const GRID_ROWS = 5;
const GRID_COLS = 6;
const CENTER_ROW = 2;
const CENTER_COL = 3; // 0-indexed: row 2, col 3

export function SlidePluristicIgnorance() {
  const villagers: { row: number; col: number; isPlayer: boolean }[] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      villagers.push({
        row: r,
        col: c,
        isPlayer: r === CENTER_ROW && c === CENTER_COL,
      });
    }
  }

  const publicWealth = GLOBAL_HOUSEHOLD_WEALTH_USD.value;
  const defenceWealth = GAME_PARAMS.defenceWealth;
  const ratio = Math.round(publicWealth / defenceWealth);

  return (
    <SlideBase act={2} className="text-cyan-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400 text-center">
          PLURALISTIC IGNORANCE
        </h1>

        {/* Villager Grid */}
        <div className="grid grid-cols-6 gap-3 md:gap-4">
          {villagers.map((v, i) => (
            <div key={i} className="relative flex flex-col items-center">
              {/* Thought bubble / quest marker */}
              <div className="h-6 flex items-end justify-center mb-1">
                {v.isPlayer ? (
                  <span className="text-xl animate-bounce">❗</span>
                ) : (
                  <span className="text-xl bg-zinc-800/80 border border-zinc-700 rounded-full px-1.5 py-0.5">
                    <span className="text-emerald-400">✓</span>
                  </span>
                )}
              </div>
              {/* Villager */}
              <span
                className={`text-xl md:text-2xl ${
                  v.isPlayer ? "text-yellow-400" : "text-zinc-200"
                }`}
              >
                👤
              </span>
            </div>
          ))}
        </div>

        {/* Core Text */}
        <p className="font-pixel text-xl md:text-2xl text-zinc-300 text-center max-w-3xl italic">
          &ldquo;Everyone wants this. Nobody knows everyone wants this.&rdquo;
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl">
          <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
            <div className="font-pixel text-xl text-zinc-200 mb-1">
              PUBLIC WEALTH
            </div>
            <div className="font-pixel text-xl md:text-2xl text-cyan-400">
              {formatCurrency(publicWealth)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
            <div className="font-pixel text-xl text-zinc-200 mb-1">
              DEFENCE INDUSTRY
            </div>
            <div className="font-pixel text-xl md:text-2xl text-red-400">
              {formatCurrency(defenceWealth)}
            </div>
          </div>
        </div>

        <div className="font-pixel text-2xl md:text-3xl text-amber-400 text-center">
          {ratio}:1 ratio
        </div>
      </div>
    </SlideBase>
  );
}
