"use client";

import { SlideBase } from "../slide-base";

export function SlideIncentiveAlignmentBonds() {
  return (
    <SlideBase act={2} className="text-blue-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-blue-400 text-center">
          🏦 INCENTIVE ALIGNMENT BONDS
        </h1>

        {/* Flow diagram */}
        <div className="w-full space-y-3">
          {/* INPUT */}
          <div className="bg-blue-500/15 border-2 border-blue-500/40 rounded-lg p-4 text-center">
            <div className="font-pixel text-xl text-blue-400 mb-1">💰 INPUT</div>
            <div className="font-pixel text-xl text-blue-400">BONDS: $1 BILLION</div>
            <div className="font-terminal text-2xl text-zinc-200 mt-1">
              📜 Solidity smart contract — trustless, auditable, unstoppable
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-blue-400">⬇️</div>
          </div>

          {/* TREATY PASSES */}
          <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-3 text-center">
            <div className="font-pixel text-xl text-emerald-400">
              🕊️ TREATY PASSES → 💸 $27B/yr inflow
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-blue-400">⬇️</div>
          </div>

          {/* OUTPUT - three allocations */}
          <div className="bg-blue-500/5 border-2 border-blue-500/20 rounded-lg p-4">
            <div className="font-pixel text-xl text-blue-400 mb-3 text-center">
              ⛓️ OUTPUT (ANNUAL, ON-CHAIN)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-center">
                <div className="font-pixel text-xl text-emerald-400">🧬 80% TRIALS</div>
                <div className="font-pixel text-xl text-emerald-300">$21.6B</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-center">
                <div className="font-pixel text-xl text-yellow-400">🤑 10% BOND HOLDERS</div>
                <div className="font-pixel text-xl text-yellow-300">$2.7B</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-center">
                <div className="font-pixel text-xl text-purple-400">🏛️ 10% ALIGNMENT SUPERPAC</div>
                <div className="font-pixel text-xl text-purple-300">$2.7B</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <p className="font-pixel text-2xl text-zinc-200 text-center italic">
          🎰 Campaign cost: $1B. Annual return: $27B. Forever. ♾️
        </p>
      </div>
    </SlideBase>
  );
}
