"use client";

import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";

export function TreasuryAllocationViz() {
  const { treasuryBalance, ubiAllocationBps, citizenCount, isDemo } =
    useTreasuryData();

  const ubiBps = Number(ubiAllocationBps);
  const alignmentBps = 10_000 - ubiBps;
  const ubiPct = ubiBps / 100;
  const alignmentPct = alignmentBps / 100;

  const ubiPool = (treasuryBalance * BigInt(ubiBps)) / 10_000n;
  const alignmentPool = treasuryBalance - ubiPool;

  const citizenCountNum = Number(citizenCount);
  const perCitizen = citizenCountNum > 0 ? ubiPool / citizenCount : 0n;

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">
        Where the Money Goes
      </h2>

      {/* Stacked bar */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex h-16 border-2 border-black overflow-hidden mb-6">
          <div
            className="bg-brutal-cyan flex items-center justify-center transition-all"
            style={{ width: `${ubiPct}%` }}
          >
            <span className="text-xs font-black text-black uppercase">
              UBI {ubiPct}%
            </span>
          </div>
          <div
            className="bg-brutal-pink flex items-center justify-center transition-all"
            style={{ width: `${alignmentPct}%` }}
          >
            <span className="text-xs font-black text-white uppercase">
              Alignment {alignmentPct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UBI column */}
          <div className="border-4 border-black bg-brutal-cyan/10 p-5">
            <h3 className="font-black uppercase text-black text-sm mb-3">
              Universal Basic Income
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-black uppercase text-black/50">
                  Pool Size
                </div>
                <div className="text-lg font-black text-black">
                  {formatWish(ubiPool)} $WISH
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-black/50">
                  Per Citizen
                </div>
                <div className="text-lg font-black text-brutal-cyan">
                  {citizenCountNum > 0
                    ? `${formatWish(perCitizen)} $WISH`
                    : "No citizens registered"}
                </div>
              </div>
              <p className="text-xs text-black/60 font-medium">
                Split equally among all World ID-verified citizens. Anyone can
                trigger distribution. No applications. No means testing. Just
                proof you exist.
              </p>
            </div>
          </div>

          {/* Alignment column */}
          <div className="border-4 border-black bg-brutal-pink/10 p-5">
            <h3 className="font-black uppercase text-black text-sm mb-3">
              Alignment Funding
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-black uppercase text-black/50">
                  Pool Size
                </div>
                <div className="text-lg font-black text-black">
                  {formatWish(alignmentPool)} $WISH
                </div>
              </div>
              <p className="text-xs text-black/60 font-medium">
                Distributed to politicians proportional to their Citizen
                Alignment Score. Vote with citizens? Get funded. Vote against
                them? Fund yourself.
              </p>
            </div>
          </div>
        </div>

        {isDemo && (
          <p className="text-[10px] font-bold text-black/40 mt-4 text-center">
            Illustrative data — contracts not yet deployed
          </p>
        )}
      </div>
    </section>
  );
}
