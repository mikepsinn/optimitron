"use client";

import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";

export function TreasuryStatusCard() {
  const {
    treasuryBalance,
    citizenCount,
    politicianCount,
    ubiAllocationBps,
    totalAlignmentScore,
    taxRateBps,
    totalSupply,
    maxSupply,
    isDemo,
  } = useTreasuryData();

  const ubiBps = Number(ubiAllocationBps);
  const alignmentBps = 10_000 - ubiBps;

  const stats = [
    {
      label: "Treasury Balance",
      value: `${formatWish(treasuryBalance)} $WISH`,
      color: "bg-brutal-cyan/20",
    },
    {
      label: "UBI Pool",
      value: `${(ubiBps / 100).toFixed(0)}%`,
      detail: `${formatWish((treasuryBalance * BigInt(ubiBps)) / 10_000n)} $WISH`,
      color: "bg-brutal-cyan/10",
    },
    {
      label: "Alignment Pool",
      value: `${(alignmentBps / 100).toFixed(0)}%`,
      detail: `${formatWish((treasuryBalance * BigInt(alignmentBps)) / 10_000n)} $WISH`,
      color: "bg-brutal-pink/10",
    },
    {
      label: "Registered Citizens",
      value: citizenCount.toString(),
      color: "bg-white",
    },
    {
      label: "Scored Politicians",
      value: politicianCount.toString(),
      detail: `Total score: ${totalAlignmentScore.toString()}`,
      color: "bg-white",
    },
    {
      label: "Transaction Tax",
      value: `${(Number(taxRateBps) / 100).toFixed(1)}%`,
      color: "bg-white",
    },
    {
      label: "Circulating Supply",
      value: `${formatWish(totalSupply)} $WISH`,
      color: "bg-white",
    },
    {
      label: "Max Supply (Fixed)",
      value: `${formatWish(maxSupply)} $WISH`,
      color: "bg-white",
    },
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black">
          Treasury Status
        </h2>
        {isDemo && (
          <span className="border-2 border-black bg-brutal-yellow px-2 py-0.5 text-[10px] font-black uppercase">
            Demo
          </span>
        )}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`border-2 border-black ${stat.color} p-3`}
          >
            <div className="text-[10px] font-black uppercase text-black/50">
              {stat.label}
            </div>
            <div className="text-sm font-black text-black mt-1">
              {stat.value}
            </div>
            {stat.detail && (
              <div className="text-[10px] font-bold text-black/40 mt-0.5">
                {stat.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
