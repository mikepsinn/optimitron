"use client";

import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";

export function TreasuryStatusCard() {
  const {
    ubiPendingBalance,
    citizenCount,
    taxRateBps,
    totalSupply,
    maxSupply,
    isDemo,
  } = useTreasuryData();

  const citizenCountNum = Number(citizenCount);
  const perCitizen = citizenCountNum > 0 ? ubiPendingBalance / citizenCount : 0n;

  const stats = [
    {
      label: "UBI Pending",
      value: `${formatWish(ubiPendingBalance)} $WISH`,
      detail: "Awaiting distribution to citizens",
      color: "bg-brutal-cyan/20",
    },
    {
      label: "Per Citizen",
      value: citizenCountNum > 0 ? `${formatWish(perCitizen)} $WISH` : "\u2014",
      detail: citizenCountNum > 0 ? "Next distribution" : "No citizens yet",
      color: "bg-brutal-cyan/10",
    },
    {
      label: "Registered Citizens",
      value: citizenCountNum.toLocaleString(),
      color: "bg-white",
    },
    {
      label: "Transaction Tax",
      value: `${(Number(taxRateBps) / 100).toFixed(1)}%`,
      detail: "On every $WISH transfer",
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
      detail: "No inflation. Ever.",
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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
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
