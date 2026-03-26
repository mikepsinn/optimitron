"use client";

import { SlideBase } from "../slide-base";
import { PARAMETERS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const FRIENDS_TABLE = [
  { friends: 2, multiplier: 2 },
  { friends: 5, multiplier: 5 },
  { friends: 10, multiplier: 10 },
  { friends: 50, multiplier: 50 },
];

export function SlideVotePointValue() {
  const valuePerPoint = PARAMETERS.game.valuePerVotePoint;

  return (
    <SlideBase act={2} className="text-purple-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-purple-400 text-center">
          ⚔️ VOTE POINT LEDGER
        </h1>

        {/* Character Stats */}
        <div className="w-full bg-zinc-900/80 border border-purple-500/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between font-pixel text-xs">
            <span className="text-zinc-400">POINTS EARNED:</span>
            <span className="text-purple-400">2</span>
          </div>
          <div className="flex justify-between font-pixel text-xs">
            <span className="text-zinc-400">VALUE PER POINT:</span>
            <span className="text-amber-400">
              {formatCurrency(valuePerPoint)}
            </span>
          </div>
          <div className="border-t border-zinc-700 pt-2 flex justify-between font-pixel text-sm">
            <span className="text-zinc-300">TOTAL IF HIT:</span>
            <span className="text-emerald-400">
              {formatCurrency(valuePerPoint * 2)}
            </span>
          </div>
        </div>

        {/* Friends Table */}
        <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-zinc-800/50 px-4 py-2 font-pixel text-sm text-zinc-500 grid grid-cols-2">
            <span>FRIENDS PLAYING</span>
            <span className="text-right">PAYOUT IF TARGETS HIT</span>
          </div>
          {FRIENDS_TABLE.map(({ friends, multiplier }) => (
            <div
              key={friends}
              className="px-4 py-2 border-t border-zinc-800 font-pixel text-xs grid grid-cols-2"
            >
              <span className="text-zinc-400">{friends} friends</span>
              <span className="text-amber-400 text-right">
                {formatCurrency(valuePerPoint * multiplier)}
              </span>
            </div>
          ))}
        </div>

        {/* Warnings */}
        <div className="w-full space-y-2">
          <div className="font-pixel text-sm text-red-400 flex items-center gap-2">
            <span>⚠</span>
            <span>NON-TRADABLE</span>
          </div>
          <div className="font-pixel text-sm text-red-400 flex items-center gap-2">
            <span>⚠</span>
            <span>Cannot be purchased. Ever.</span>
          </div>
          <div className="font-pixel text-sm text-red-400 flex items-center gap-2">
            <span>⚠</span>
            <span>Earned ONLY by getting friends to play</span>
          </div>
        </div>

        {/* Bottom */}
        <p className="font-pixel text-sm md:text-xs text-zinc-500 text-center">
          More players → bigger pool → bigger prize
        </p>
      </div>
    </SlideBase>
  );
}
