"use client";

import { SlideBase } from "../slide-base";

export function SlideStoracha() {
  return (
    <SlideBase act={2} className="text-orange-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-orange-400 text-center">
          STORACHA: IMMUTABLE EVIDENCE
        </h1>

        {/* Vault visual */}
        <div className="w-full bg-black/50 border-2 border-orange-500/40 rounded-lg p-6 space-y-4">
          {/* Vault header */}
          <div className="flex items-center justify-center gap-3 border-b border-orange-500/20 pb-3">
            <span className="font-pixel text-2xl">🔒</span>
            <span className="font-pixel text-xl md:text-2xl text-orange-300">IPFS VAULT</span>
            <span className="font-pixel text-2xl">🔒</span>
          </div>

          {/* IPFS blocks */}
          <div className="grid grid-cols-3 gap-2">
            {["Qm8f3k...a2d", "Qm9x1p...f7c", "QmB4nz...e1a"].map((hash) => (
              <div
                key={hash}
                className="bg-orange-500/10 border border-orange-500/20 rounded p-3 text-center"
              >
                <div className="font-pixel text-2xl text-orange-400/60">BLOCK</div>
                <div className="font-terminal text-xl text-orange-300">{hash}</div>
              </div>
            ))}
          </div>

          {/* Key guarantees */}
          <div className="space-y-2 pt-2">
            <div className="font-pixel text-xl md:text-3xl text-orange-300 text-center">
              Content-addressed. Immutable. Permanent.
            </div>
            <div className="space-y-1">
              <div className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center">
                No government can delete it.
              </div>
              <div className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center">
                No lobbyist can edit it.
              </div>
              <div className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center">
                No administration can classify it.
              </div>
            </div>
          </div>

          {/* Logos/labels */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-orange-500/20">
            <div className="font-pixel text-xl md:text-2xl text-orange-400 bg-orange-500/10 px-3 py-1 rounded">
              STORACHA
            </div>
            <div className="font-pixel text-xl md:text-2xl text-zinc-200">+</div>
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded">
              IPFS
            </div>
          </div>
        </div>

        {/* Sample document */}
        <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-pixel text-xl text-zinc-200 mb-1">SAMPLE DOCUMENT</div>
              <div className="font-pixel text-xl md:text-2xl text-red-400">
                FDA DELAY: 102M DEATHS
              </div>
            </div>
            <div className="text-right">
              <div className="font-pixel text-xl md:text-3xl text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                IMMUTABLE
              </div>
              <div className="font-pixel text-xl text-zinc-200 mt-1">PERMANENT</div>
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
