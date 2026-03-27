"use client";

import { SlideBase } from "../slide-base";

const SNAPSHOTS = [
  { type: "WISHOCRACY AGGREGATION", cid: "bafy...k7qR3", color: "cyan" },
  { type: "POLICY ANALYSIS", cid: "bafy...xW9m2", color: "orange" },
  { type: "HEALTH ANALYSIS", cid: "bafy...pN4d8", color: "emerald" },
] as const;

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
};

export function SlideStoracha() {
  return (
    <SlideBase act={2} className="text-orange-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-orange-400 text-center">
          STORACHA: IMMUTABLE EVIDENCE CHAIN
        </h1>

        {/* Vault visual with chained blocks */}
        <div className="w-full bg-black/50 border-2 border-orange-500/40 rounded-lg p-6 space-y-2">
          {/* Vault header */}
          <div className="flex items-center justify-center gap-3 border-b border-orange-500/20 pb-3">
            <span className="font-pixel text-2xl">🔒</span>
            <span className="font-pixel text-xl md:text-2xl text-orange-300">IPFS VAULT — CHAINED</span>
            <span className="font-pixel text-2xl">🔒</span>
          </div>

          {/* Chained snapshot blocks */}
          <div className="space-y-1">
            {SNAPSHOTS.map((snap, i) => {
              const colors = colorMap[snap.color];
              return (
                <div key={snap.cid}>
                  {i > 0 && (
                    <div className="flex justify-center py-0.5">
                      <span className="font-pixel text-xl text-orange-400/60">&#x2191; previousCid</span>
                    </div>
                  )}
                  <div
                    className={`${colors.bg} border ${colors.border} rounded p-3 flex items-center justify-between`}
                  >
                    <div>
                      <div className={`font-pixel text-xl md:text-2xl ${colors.text}`}>{snap.type}</div>
                    </div>
                    <div className="font-terminal text-xl text-zinc-300">{snap.cid}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key guarantees */}
          <div className="space-y-2 pt-3">
            <div className="font-pixel text-xl md:text-3xl text-orange-300 text-center">
              Each record links to the last.
            </div>
            <div className="space-y-1">
              <div className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center">
                No government can delete it.
              </div>
              <div className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center">
                Break the chain? The hash won&apos;t match.
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

        {/* Verification callout */}
        <div className="bg-orange-500/5 border border-orange-500/30 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-pixel text-xl text-zinc-200 mb-1">VERIFY ANY CID</div>
              <div className="font-pixel text-xl md:text-2xl text-orange-400">
                No login. No permission. Just math.
              </div>
            </div>
            <div className="text-right">
              <div className="font-pixel text-xl md:text-3xl text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                VERIFIED
              </div>
              <div className="font-pixel text-xl text-zinc-200 mt-1">PERMANENT</div>
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
